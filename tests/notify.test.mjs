// Server-side "new request" notifications – against the local Firestore emulator only.
//   npm run test:server
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { notifyNewRequest, reconcile, markerId, MAX_ATTEMPTS } from '../server/notify.js';
import { telegramSender, SendError } from '../server/telegram.js';

process.env.GCLOUD_PROJECT = 'demo-johnny-taxi-notify';
initializeApp({ projectId: 'demo-johnny-taxi-notify' });
const db = getFirestore();
const SITE = 'https://example.test';
const MIN = 60000;

let n = 0;
let ch = 0;
const newChannel = () => `test${++ch}-${Date.now()}`; // isolates tests from each other
async function seed(over = {}, ageMs = 0) {
  const id = `notify-test-${Date.now()}-${++n}`;
  await db.collection('requests').doc(id).set({
    v: 1, id, code: 'JT-ABCDE', name: 'לקוחה פרטית', phone: '050-7654321', from: 'רחוב סודי 1', to: 'בית חולים',
    wheelchair: true, wheelchairCount: 1, status: 'new', history: [], source: 'website',
    createdAt: Timestamp.fromMillis(Date.now() - ageMs), ...over,
  });
  return id;
}
// scripted sender: each call takes the next outcome ('ok' | 'rejected' | 'unknown' | 'dry')
function scripted(...outcomes) {
  const calls = [];
  const send = async (text, button, url) => {
    calls.push({ text, button, url });
    const o = outcomes.length ? outcomes.shift() : 'ok';
    if (o === 'rejected') throw new SendError('rejected', 'http-400');
    if (o === 'unknown') throw new SendError('unknown', 'timeout');
    return { dryRun: o === 'dry' };
  };
  return { send, calls };
}
const marker = async (channel, id) => (await db.collection('notifications').doc(markerId(channel, id)).get()).data();

// ---------- browser path ----------
test('fresh website request → one generic message with a link to the admin screen', async () => {
  const channel = newChannel(); const id = await seed(); const s = scripted('ok');
  const r = await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel });
  assert.deepEqual(r, { status: 200, result: 'sent' });
  assert.equal(s.calls.length, 1);
  const { text, url } = s.calls[0];
  assert.equal(url, `${SITE}/admin?r=${id}`);
  for (const secret of ['לקוחה', '7654321', 'סודי', 'בית חולים', 'כיסא', 'נגיש']) assert.ok(!text.includes(secret), `leak: ${secret}`);
  assert.equal((await marker(channel, id)).state, 'sent');
});
test('parallel and repeated calls for one request → exactly one message', async () => {
  const channel = newChannel(); const id = await seed(); const s = scripted();
  const res = await Promise.all([1, 2, 3, 4, 5].map(() => notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel })));
  assert.equal(s.calls.length, 1);
  assert.equal(res.filter((x) => x.result === 'sent').length, 1);
  assert.equal(res.filter((x) => x.result === 'duplicate').length, 4);
});
test('browser cannot trigger messages for unsaved, malformed, old or manual requests', async () => {
  const channel = newChannel(); const s = scripted();
  assert.equal((await notifyNewRequest({ id: 'does-not-exist-123', db, send: s.send, siteUrl: SITE, channel })).status, 404);
  assert.equal((await notifyNewRequest({ id: '../admins/x', db, send: s.send, siteUrl: SITE, channel })).status, 400);
  assert.equal((await notifyNewRequest({ id: 42, db, send: s.send, siteUrl: SITE, channel })).status, 400);
  const old = await seed({}, 60 * MIN);
  assert.equal((await notifyNewRequest({ id: old, db, send: s.send, siteUrl: SITE, channel })).result, 'too-old');
  const manual = await seed({ source: 'phone', createdBy: 'johnny@example.com' });
  assert.equal((await notifyNewRequest({ id: manual, db, send: s.send, siteUrl: SITE, channel })).result, 'skipped-manual');
  assert.equal(s.calls.length, 0);
});

// ---------- failures, retries, unknown outcome ----------
test('Telegram refuses → marker "failed", NOT blocked: a later retry sends it', async () => {
  const channel = newChannel(); const id = await seed(); const s = scripted('rejected', 'ok');
  const t0 = Date.now();
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 })).result, 'failed');
  let m = await marker(channel, id);
  assert.equal(m.state, 'failed'); assert.equal(m.attempts, 1);
  assert.ok(m.nextAttemptAt.toMillis() >= t0 + 2 * MIN - 1000);
  // too early → not retried
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 + MIN })).result, 'duplicate');
  // after the back-off → retried and sent, without the "repeat" label (first was surely not delivered)
  const r2 = await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 + 3 * MIN });
  assert.equal(r2.result, 'sent');
  assert.equal(s.calls.length, 2);
  assert.ok(!s.calls[1].text.includes('חוזרת'));
  m = await marker(channel, id); assert.equal(m.state, 'sent'); assert.equal(m.attempts, 2);
  // the request itself was never touched
  assert.ok((await db.collection('requests').doc(id).get()).exists);
});
test('timeout (unknown outcome) → retried later and labelled as a possible repeat', async () => {
  const channel = newChannel(); const id = await seed(); const s = scripted('unknown', 'ok');
  const t0 = Date.now();
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 })).result, 'unknown');
  assert.equal((await marker(channel, id)).state, 'unknown');
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 + 5 * MIN })).result, 'duplicate');
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 + 11 * MIN })).result, 'sent');
  assert.match(s.calls[1].text, /ייתכן שזו התראה חוזרת/);
});
test('crash mid-send (stale "sending" lease) → retried after the lease, as a possible repeat', async () => {
  const channel = newChannel(); const id = await seed(); const t0 = Date.now();
  await db.collection('notifications').doc(markerId(channel, id)).set({ state: 'sending', attempts: 1, leaseUntil: new Date(t0 + 30000) });
  const s = scripted('ok');
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 })).result, 'duplicate'); // lease still valid
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 + 2 * MIN })).result, 'sent');
  assert.match(s.calls[0].text, /ייתכן שזו התראה חוזרת/);
});
test(`gives up after ${MAX_ATTEMPTS} refused attempts (no endless retries)`, async () => {
  // later attempts come from the scheduled catch-up (the browser path only covers 15 min)
  const channel = newChannel(); const t0 = Date.now(); const id = await seed({}, 3 * MIN);
  const since = new Date(t0 - 3600 * 1000).toISOString();
  const calls = []; // always refuses (other tests' requests in the emulator may also be scanned)
  const s = { calls, send: async (text, b, url) => { calls.push({ text, url }); throw new SendError('rejected', 'http-400'); } };
  for (let i = 0; i < 8; i++) await reconcile({ db, send: s.send, siteUrl: SITE, channel, since, now: t0 + i * 40 * MIN, pauseMs: 0, maxSends: 10000 });
  assert.equal(s.calls.filter((c) => c.url.endsWith(id)).length, MAX_ATTEMPTS);
  assert.equal((await marker(channel, id)).state, 'gave-up');
});
test('Telegram 429 "retry_after" is respected', async () => {
  const channel = newChannel(); const id = await seed(); const t0 = Date.now();
  const send = async () => { throw new SendError('rejected', 'http-429', 600); };
  await notifyNewRequest({ id, db, send, siteUrl: SITE, channel, now: t0 });
  assert.ok((await marker(channel, id)).nextAttemptAt.toMillis() >= t0 + 600000 - 1000);
});

// ---------- scheduled catch-up ----------
test('reconcile: completes missed requests (even > 15 min old) but never older test requests', async () => {
  const channel = newChannel(); const t0 = Date.now();
  const since = new Date(t0 - 3 * 3600 * 1000).toISOString();      // "notifications switched on 3 h ago"
  const beforeSince = await seed({}, 5 * 3600 * 1000);               // old test request – must stay silent
  const missed = await seed({}, 40 * MIN);                           // customer closed the browser
  const fresh = await seed({}, 30 * 1000);                           // browser path still has time
  const confirmed = await seed({ status: 'confirmed' }, 30 * MIN);   // Johnny already handled it
  const manual = await seed({ source: 'whatsapp' }, 30 * MIN);       // entered by Johnny
  const s = scripted();
  const sum = await reconcile({ db, send: s.send, siteUrl: SITE, channel, since, now: t0, pauseMs: 0, maxSends: 10000 });
  const sentIds = s.calls.map((c) => c.url.split('r=')[1]);
  assert.ok(sentIds.includes(missed), 'missed request announced');
  for (const x of [beforeSince, fresh, confirmed, manual]) assert.ok(!sentIds.includes(x), `must not announce ${x}`);
  assert.match(s.calls.find((c) => c.url.endsWith(missed)).text, /ממתינה לטיפול/);
  assert.ok(sum.tooFresh >= 1);
  // a second run sends nothing new
  const before = s.calls.length;
  await reconcile({ db, send: s.send, siteUrl: SITE, channel, since, now: t0 + MIN, pauseMs: 0, maxSends: 10000 });
  assert.equal(s.calls.filter((c) => c.url.endsWith(missed)).length, 1);
  assert.ok(s.calls.length >= before);
});
test('reconcile retries a failed notification after its back-off', async () => {
  const channel = newChannel(); const t0 = Date.now();
  const id = await seed({}, 5 * MIN);
  const s = scripted('rejected', 'ok');
  await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE, channel, now: t0 });
  const since = new Date(t0 - 3600 * 1000).toISOString();
  await reconcile({ db, send: s.send, siteUrl: SITE, channel, since, now: t0 + 3 * MIN, pauseMs: 0, maxSends: 10000 });
  assert.equal((await marker(channel, id)).state, 'sent');
});
test('reconcile does nothing without NOTIFY_SINCE (safe default)', async () => {
  const s = scripted();
  assert.deepEqual(await reconcile({ db, send: s.send, siteUrl: SITE, channel: newChannel(), since: undefined, pauseMs: 0 }), { skipped: 'NOTIFY_SINCE not set' });
  assert.equal(s.calls.length, 0);
});
test('Preview and Production channels keep separate markers', async () => {
  const id = await seed(); const a = scripted(), b = scripted();
  const chA = newChannel(), chB = newChannel();
  await notifyNewRequest({ id, db, send: a.send, siteUrl: SITE, channel: chA });
  await notifyNewRequest({ id, db, send: b.send, siteUrl: SITE, channel: chB });
  assert.equal(a.calls.length, 1); assert.equal(b.calls.length, 1);
});

// ---------- Telegram sender ----------
test('sender: dry run unless NOTIFY_MODE is exactly "live"', async () => {
  let called = 0; const fakeFetch = async () => { called++; return new Response('{"ok":true}'); };
  for (const mode of [undefined, '', 'LIVE', 'dry-run', 'true']) {
    assert.equal((await telegramSender({ NOTIFY_MODE: mode, TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' }, fakeFetch)('x', 'b', 'https://u')).dryRun, true);
  }
  assert.equal(called, 0);
});
test('sender: classifies outcomes (ok / refused / unknown)', async () => {
  const env = { NOTIFY_MODE: 'live', TELEGRAM_BOT_TOKEN: 'TEST:TOKEN', TELEGRAM_CHAT_ID: '12345' };
  const seen = [];
  const ok = async (url, o) => { seen.push({ url, body: JSON.parse(o.body) }); return new Response('{"ok":true}'); };
  assert.equal((await telegramSender(env, ok)('hello', 'open', 'https://x/admin?r=1')).dryRun, false);
  assert.equal(seen[0].url, 'https://api.telegram.org/botTEST:TOKEN/sendMessage');
  assert.deepEqual(seen[0].body.reply_markup.inline_keyboard, [[{ text: 'open', url: 'https://x/admin?r=1' }]]);
  assert.ok(!JSON.stringify(seen[0].body).includes('TEST:TOKEN'));
  const kind = async (f) => { try { await telegramSender(env, f)('x', 'b', 'https://u'); return 'ok'; } catch (e) { return e.kind; } };
  assert.equal(await kind(async () => new Response('{"ok":false}', { status: 400 })), 'rejected');
  assert.equal(await kind(async () => new Response('{"ok":false,"parameters":{"retry_after":5}}', { status: 429 })), 'rejected');
  assert.equal(await kind(async () => new Response('', { status: 502 })), 'unknown');
  assert.equal(await kind(async () => { throw Object.assign(new Error('t'), { name: 'TimeoutError' }); }), 'unknown');
  assert.equal(await kind(async () => { throw new TypeError('fetch failed'); }), 'unknown');
});
test('API route end-to-end (emulator, dry run)', async () => {
  const id = await seed();
  process.env.NOTIFY_CHANNEL = newChannel();
  const { POST } = await import('../api/notify-new-request.js');
  const call = () => POST(new Request('https://example.test/api/notify-new-request', { method: 'POST', body: JSON.stringify({ id }) }));
  const r1 = await call(); assert.equal(r1.status, 200); assert.equal((await r1.json()).result, 'dry-run');
  assert.equal((await (await call()).json()).result, 'duplicate');
});
