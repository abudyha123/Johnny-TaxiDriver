// Security-rules tests. Run against the local Firestore emulator only – never a real project:
//   npm run test:rules
// (needs Java 21+; the Firebase CLI downloads the emulator on first run)
import { test, before, after, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
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
const newToken = () => {
  const b = new Uint8Array(32); crypto.getRandomValues(b);
  return Buffer.from(b).toString('base64url'); // 43 chars, like the site
};
const inDays = (d) => Timestamp.fromMillis(Date.now() + d * 86400000);
function trackDoc(id, over = {}) {
  return { v: 1, rid: id, code: 'JT-ABCDE', status: 'new', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), expiresAt: inDays(14), ...over };
}

// The exact batch the website sends (src/lib/requests/firestoreStore.ts)
function publicCreate(fs, id, over = {}, { day = DAY, counters = true, token = null, track = {}, trackId = null } = {}) {
  const data = { ...base(id, over), createdAt: serverTimestamp() };
  if (token) data.trackToken = token;
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', id), data);
  if (token && track !== false) b.set(doc(fs, 'tracking', trackId || token), trackDoc(id, track));
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

// ---------- customer tracking ----------
async function createTracked(over = {}) {
  const id = newId(), token = newToken();
  await assertSucceeds(publicCreate(visitor(), id, over, { token }));
  return { id, token };
}
test('tracking: request + tracking document are created together', async () => {
  await createTracked();
});
test('tracking: request that names a token but has no tracking doc is refused', async () => {
  await assertFails(publicCreate(visitor(), newId(), {}, { token: newToken(), track: false }));
});
test('tracking: tracking doc alone (no new request) is refused', async () => {
  const t = newToken();
  await assertFails(setDoc(doc(visitor(), 'tracking', t), trackDoc('existing-0001')));
  await assertFails(setDoc(doc(visitor(), 'tracking', t), trackDoc('nonexistent-0001')));
});
for (const [label, opts] of [
  ['status confirmed at creation', { track: { status: 'confirmed' } }],
  ['extra field (name)', { track: { name: 'לקוח' } }],
  ['expiry too long', { track: { expiresAt: inDays(200) } }],
  ['expiry already past', { track: { expiresAt: inDays(-1) } }],
  ['different code than the request', { track: { code: 'JT-ZZZZZ' } }],
  ['token too short', { token: 'abc123' }],
  ['token of the tracking doc differs from the request', { trackId: newToken() }],
]) {
  test(`tracking create refused: ${label}`, async () => {
    await assertFails(publicCreate(visitor(), newId(), {}, { token: opts.token || newToken(), ...opts }));
  });
}
test('tracking: anyone with the link can read it; it holds only minimal fields', async () => {
  const { token } = await createTracked();
  const snap = await assertSucceeds(getDoc(doc(visitor(), 'tracking', token)));
  assert.deepEqual(Object.keys(snap.data()).sort(), ['code', 'createdAt', 'expiresAt', 'rid', 'status', 'updatedAt', 'v']);
});
test('tracking: wrong token, listing and expired links are refused', async () => {
  await createTracked();
  await assertFails(getDoc(doc(visitor(), 'tracking', newToken())));
  await assertFails(getDocs(collection(visitor(), 'tracking')));
  await assertFails(getDocs(collection(stranger(), 'tracking')));
  const old = newToken();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'tracking', old), { v: 1, rid: 'existing-0001', code: 'JT-ABCDE', status: 'confirmed', createdAt: inDays(-30), updatedAt: inDays(-29), expiresAt: inDays(-1) });
  });
  await assertFails(getDoc(doc(visitor(), 'tracking', old)));
});
test('tracking: the link does not open the private request', async () => {
  const { id } = await createTracked();
  await assertFails(getDoc(doc(visitor(), 'requests', id)));
});
test('tracking: customer / stranger cannot fake a confirmation', async () => {
  const { token } = await createTracked();
  for (const fs of [visitor(), stranger()]) {
    await assertFails(updateDoc(doc(fs, 'tracking', token), { status: 'confirmed', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(fs, 'tracking', token), trackDoc('x', { status: 'confirmed' })));
    await assertFails(deleteDoc(doc(fs, 'tracking', token)));
  }
});
const adminBatch = (id, token, status, { trackStatus = status, skipTrack = false, skipRequest = false } = {}) => {
  const fs = admin(); const b = writeBatch(fs);
  if (!skipRequest) b.update(doc(fs, 'requests', id), statusUpdate(status, 'johnny@example.com'));
  if (!skipTrack) b.update(doc(fs, 'tracking', token), { status: trackStatus, updatedAt: serverTimestamp() });
  return b.commit();
};
test('tracking: admin changes request + tracking together, customer sees it', async () => {
  const { id, token } = await createTracked();
  await assertSucceeds(adminBatch(id, token, 'confirmed'));
  const snap = await getDoc(doc(visitor(), 'tracking', token));
  assert.equal(snap.data().status, 'confirmed');
});
test('tracking: admin cannot let the two disagree or change one alone', async () => {
  const { id, token } = await createTracked();
  await assertFails(adminBatch(id, token, 'confirmed', { trackStatus: 'cancelled' }));
  await assertFails(adminBatch(id, token, 'confirmed', { skipTrack: true }));
  await assertFails(adminBatch(id, token, 'confirmed', { skipRequest: true }));
  await assertFails(updateDoc(doc(admin(), 'tracking', token), { expiresAt: inDays(100) }));
});

// ---------- manual requests (Johnny, admin screen) ----------
function manualBatch(fs, { id = newId(), token = newToken(), email = 'johnny@example.com', over = {}, track = {}, status = 'new', history } = {}) {
  const data = {
    ...base(id, { status, history: history ?? (status === 'new' ? [] : [{ status, at: Timestamp.now(), by: email }]) }),
    createdAt: serverTimestamp(), trackToken: token, source: 'phone', createdBy: email, ...over,
  };
  const b = writeBatch(fs);
  b.set(doc(fs, 'requests', id), data);
  if (track !== false) b.set(doc(fs, 'tracking', token), trackDoc(id, { status, ...track }));
  return b.commit();
}
test('manual: admin adds a phone request (no public counters) with tracking', async () => {
  await assertSucceeds(manualBatch(admin()));
});
test('manual: admin adds an already-confirmed WhatsApp request; tracking shows confirmed', async () => {
  const token = newToken();
  await assertSucceeds(manualBatch(admin(), { token, status: 'confirmed', over: { source: 'whatsapp' } }));
  assert.equal((await getDoc(doc(visitor(), 'tracking', token))).data().status, 'confirmed');
});
test('manual: manual requests do not use up the public daily caps', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'dailyCount', String(DAY)), { n: 150, lastId: 'x' });
  });
  await assertSucceeds(manualBatch(admin()));
});
for (const [label, opts] of [
  ['by a visitor', { fs: 'visitor' }],
  ['by a signed-in non-admin', { fs: 'stranger', email: 'stranger@example.com' }],
  ['source website', { over: { source: 'website' } }],
  ['unknown source', { over: { source: 'email' } }],
  ['createdBy someone else', { over: { createdBy: 'someone@else.com' } }],
  ['without tracking link', { track: false, over: { trackToken: undefined } }],
  ['status completed', { status: 'completed' }],
  ['confirmed without a history entry', { status: 'confirmed', history: [] }],
  ['tracking status differs from request', { status: 'confirmed', track: { status: 'new' } }],
]) {
  test(`manual create refused: ${label}`, async () => {
    const fs = opts.fs === 'visitor' ? visitor() : opts.fs === 'stranger' ? stranger() : admin();
    const o = { ...opts }; delete o.fs;
    if (o.over && 'trackToken' in o.over && o.over.trackToken === undefined) {
      // request without trackToken field at all
      const id = newId();
      const data = { ...base(id), createdAt: serverTimestamp(), source: 'phone', createdBy: 'johnny@example.com' };
      return assertFails(setDoc(doc(fs, 'requests', id), data));
    }
    await assertFails(manualBatch(fs, o));
  });
}
test('public site cannot pose as a phone request or set createdBy', async () => {
  await assertFails(publicCreate(visitor(), newId(), { source: 'phone' }, { token: newToken() }));
  await assertFails(publicCreate(visitor(), newId(), { createdBy: 'johnny@example.com' }, { token: newToken() }));
  await assertSucceeds(publicCreate(visitor(), newId(), { source: 'website' }, { token: newToken() }));
});
test('public site cannot create a tracking link that starts as confirmed', async () => {
  await assertFails(publicCreate(visitor(), newId(), {}, { token: newToken(), track: { status: 'confirmed' } }));
});
