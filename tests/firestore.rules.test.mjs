// Security-rules tests. Run against the local Firestore emulator only – never a real project:
//   npm run test:rules
// (needs Java 21+; the Firebase CLI downloads the emulator on first run)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, writeBatch,
  serverTimestamp, increment, arrayUnion, Timestamp,
} from 'firebase/firestore';

const DAY = Math.floor(Date.now() / 86400000);
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-johnny-taxi-rules', // "demo-" ids never touch a real project
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'admins/johnny'), { role: 'owner' });
    await setDoc(doc(ctx.firestore(), 'requests/existing-0001'), {
      ...base('existing-0001'), createdAt: Timestamp.now(),
    });
  });
});

const visitor = () => env.unauthenticatedContext().firestore();
const stranger = () => env.authenticatedContext('stranger', { email: 'stranger@example.com' }).firestore();
const admin = () => env.authenticatedContext('johnny', { email: 'johnny@example.com' }).firestore();

let seq = 0;
const newId = () => `test-${Date.now().toString(36)}-${++seq}`;
function base(id, over = {}) {
  return {
    v: 1, id, code: 'JT-ABCDE', name: 'לקוח בדיקה', phone: '050-1234567', phoneKey: '0501234567',
    from: 'הרצל 10 חיפה', to: 'רמב״ם', date: '2026-12-01', time: '09:30',
    passengers: 2, wheelchair: true, wheelchairCount: 1, lang: 'he', status: 'new', history: [], ...over,
  };
}
// The exact batch the website sends (src/lib/requests/firestoreStore.ts)
function publicCreate(fs, id, over = {}, { day = DAY, counters = true } = {}) {
  const data = { ...base(id, over), createdAt: serverTimestamp() };
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', id), data);
  if (counters) {
    b.set(doc(fs, 'dailyCount', String(day)), { n: increment(1), lastId: id }, { merge: true });
    b.set(doc(fs, 'phoneDaily', `${day}_${data.phoneKey}`), { n: increment(1), lastId: id }, { merge: true });
  }
  return b.commit();
}

// ---------- creating requests ----------
test('visitor can create a valid request', async () => {
  await assertSucceeds(publicCreate(visitor(), newId()));
});
test('valid request with optional email and notes, no wheelchair', async () => {
  await assertSucceeds(publicCreate(visitor(), newId(), { wheelchair: false, wheelchairCount: 0, email: 'a@b.co', notes: 'מזוודה' }));
});
test('creating the same id twice is refused (no duplicates)', async () => {
  const id = newId();
  await assertSucceeds(publicCreate(visitor(), id));
  await assertFails(publicCreate(visitor(), id, { phone: '052-1111111', phoneKey: '0521111111' }));
});
for (const [label, over] of [
  ['status other than new', { status: 'confirmed' }],
  ['extra field', { isAdmin: true }],
  ['demo flag', { demo: true }],
  ['non-empty history', { history: [{ status: 'confirmed' }] }],
  ['passengers 0', { passengers: 0 }],
  ['passengers as text', { passengers: '2' }],
  ['wheelchair yes with count 0', { wheelchairCount: 0 }],
  ['wheelchair no with count 1', { wheelchair: false, wheelchairCount: 1 }],
  ['phoneKey not matching phone', { phoneKey: '0509999999' }],
  ['invalid phone', { phone: 'call me', phoneKey: '' }],
  ['bad date', { date: '01/12/2026' }],
  ['bad time', { time: '25:00' }],
  ['bad code', { code: 'XX-1' }],
  ['empty name', { name: '' }],
  ['name too long', { name: 'א'.repeat(81) }],
  ['notes too long', { notes: 'x'.repeat(1001) }],
  ['unknown language', { lang: 'fr' }],
  ['wrong schema version', { v: 2 }],
]) {
  test(`create refused: ${label}`, async () => { await assertFails(publicCreate(visitor(), newId(), over)); });
}
test('create refused: id field differs from document id', async () => {
  await assertFails(publicCreate(visitor(), newId(), { id: 'someone-else-1' }));
});
test('create refused: client-chosen createdAt', async () => {
  const fs = visitor(); const id = newId();
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', id), { ...base(id), createdAt: Timestamp.fromDate(new Date('2020-01-01')) });
  b.set(doc(fs, 'dailyCount', String(DAY)), { n: increment(1), lastId: id }, { merge: true });
  b.set(doc(fs, 'phoneDaily', `${DAY}_0501234567`), { n: increment(1), lastId: id }, { merge: true });
  await assertFails(b.commit());
});
test('create refused without the daily counters', async () => {
  await assertFails(publicCreate(visitor(), newId(), {}, { counters: false }));
});
test('create refused with a wrong day key', async () => {
  await assertFails(publicCreate(visitor(), newId(), {}, { day: DAY - 3 }));
});

// ---------- flood control ----------
test('per-phone daily cap: 4 accepted, 5th refused, other phone still accepted', async () => {
  for (let i = 0; i < 4; i++) await assertSucceeds(publicCreate(visitor(), newId()));
  await assertFails(publicCreate(visitor(), newId()));
  await assertSucceeds(publicCreate(visitor(), newId(), { phone: '052-7654321', phoneKey: '0527654321' }));
});
test('site daily cap refuses requests beyond the limit', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'dailyCount', String(DAY)), { n: 150, lastId: 'x' });
  });
  await assertFails(publicCreate(visitor(), newId()));
});
test('counters cannot be reset, skipped, read or deleted by the public', async () => {
  const fs = visitor();
  await assertSucceeds(publicCreate(fs, newId()));
  await assertFails(setDoc(doc(fs, 'dailyCount', String(DAY)), { n: 0, lastId: 'existing-0001' }));
  await assertFails(setDoc(doc(fs, 'dailyCount', String(DAY)), { n: 1, lastId: 'existing-0001' }));
  await assertFails(getDoc(doc(fs, 'dailyCount', String(DAY))));
  await assertFails(deleteDoc(doc(fs, 'dailyCount', String(DAY))));
});

// ---------- reading ----------
test('visitor cannot read or list requests', async () => {
  await assertFails(getDoc(doc(visitor(), 'requests/existing-0001')));
  await assertFails(getDocs(collection(visitor(), 'requests')));
});
test('signed-in non-admin cannot read or list requests', async () => {
  await assertFails(getDoc(doc(stranger(), 'requests/existing-0001')));
  await assertFails(getDocs(collection(stranger(), 'requests')));
});
test('admin can read and list requests', async () => {
  await assertSucceeds(getDoc(doc(admin(), 'requests/existing-0001')));
  await assertSucceeds(getDocs(collection(admin(), 'requests')));
});

// ---------- updating ----------
const statusUpdate = (status, email) => ({
  status, history: arrayUnion({ status, at: Timestamp.now(), by: email }),
  updatedAt: serverTimestamp(), updatedBy: email,
});
test('visitor and non-admin cannot update or delete', async () => {
  await assertFails(updateDoc(doc(visitor(), 'requests/existing-0001'), statusUpdate('confirmed', 'x@y.z')));
  await assertFails(updateDoc(doc(stranger(), 'requests/existing-0001'), statusUpdate('confirmed', 'stranger@example.com')));
  await assertFails(deleteDoc(doc(stranger(), 'requests/existing-0001')));
});
test('admin can change the status (with history entry)', async () => {
  await assertSucceeds(updateDoc(doc(admin(), 'requests/existing-0001'), statusUpdate('in_progress', 'johnny@example.com')));
});
test('admin cannot change customer details, set an unknown status, fake the author, or delete', async () => {
  const d = doc(admin(), 'requests/existing-0001');
  await assertFails(updateDoc(d, { ...statusUpdate('confirmed', 'johnny@example.com'), name: 'שונה' }));
  await assertFails(updateDoc(d, statusUpdate('paid', 'johnny@example.com')));
  await assertFails(updateDoc(d, statusUpdate('confirmed', 'someone@else.com')));
  await assertFails(updateDoc(d, { status: 'confirmed' }));
  await assertFails(deleteDoc(d));
});

// ---------- admin allowlist ----------
test('nobody can add themselves (or anyone) to admins', async () => {
  await assertFails(setDoc(doc(stranger(), 'admins/stranger'), { role: 'owner' }));
  await assertFails(setDoc(doc(visitor(), 'admins/visitor'), { role: 'owner' }));
  await assertFails(setDoc(doc(admin(), 'admins/stranger'), { role: 'owner' }));
  await assertFails(updateDoc(doc(admin(), 'admins/johnny'), { role: 'super' }));
});
test('admins list is private; each user may only check their own entry', async () => {
  await assertFails(getDocs(collection(stranger(), 'admins')));
  await assertFails(getDoc(doc(stranger(), 'admins/johnny')));
  await assertSucceeds(getDoc(doc(stranger(), 'admins/stranger')));
  await assertSucceeds(getDoc(doc(admin(), 'admins/johnny')));
});
test('unknown collections are closed', async () => {
  await assertFails(setDoc(doc(visitor(), 'anything/x'), { a: 1 }));
  await assertFails(getDoc(doc(admin(), 'anything/x')));
});
