// Server-side "new request" notification – against the local Firestore emulator only.
//   npm run test:server
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { notifyNewRequest } from '../server/notify.js';
import { telegramSender } from '../server/telegram.js';

process.env.GCLOUD_PROJECT = 'demo-johnny-taxi-notify';
initializeApp({ projectId: 'demo-johnny-taxi-notify' });
const db = getFirestore();
const SITE = 'https://example.test';

let n = 0;
async function seed(over = {}) {
  const id = `notify-test-${Date.now()}-${++n}`;
  await db.collection('requests').doc(id).set({
    v: 1, id, code: 'JT-ABCDE', name: 'לקוחה פרטית', phone: '050-7654321', from: 'רחוב סודי 1', to: 'בית חולים',
    wheelchair: true, wheelchairCount: 1, status: 'new', history: [], createdAt: Timestamp.now(), source: 'website', ...over,
  });
  return id;
}
function spySender({ fail = false } = {}) {
  const calls = [];
  const send = async (text, button, url) => { calls.push({ text, button, url }); if (fail) throw new Error('boom'); return { dryRun: true }; };
  return { send, calls };
}

before(async () => { /* emulator is started by firebase emulators:exec */ });

test('fresh website request → exactly one generic message with a link to the admin screen', async () => {
  const id = await seed(); const s = spySender();
  const r = await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE });
  assert.deepEqual(r, { status: 200, result: 'dry-run' });
  assert.equal(s.calls.length, 1);
  const { text, url } = s.calls[0];
  assert.equal(url, `${SITE}/admin?r=${id}`);
  for (const secret of ['לקוחה', '7654321', 'סודי', 'בית חולים', 'כיסא', 'נגיש']) assert.ok(!text.includes(secret), `leak: ${secret}`);
  assert.equal((await db.collection('notifications').doc(id).get()).data().state, 'dry-run');
});
test('retry / double call for the same request → no second message', async () => {
  const id = await seed(); const s = spySender();
  await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE });
  const again = await Promise.all([1, 2, 3].map(() => notifyNewRequest({ id, db, send: s.send, siteUrl: SITE })));
  assert.ok(again.every((x) => x.result === 'duplicate'));
  assert.equal(s.calls.length, 1);
});
test('the browser cannot trigger a message for a request that was not saved', async () => {
  const s = spySender();
  assert.equal((await notifyNewRequest({ id: 'does-not-exist-123', db, send: s.send, siteUrl: SITE })).status, 404);
  assert.equal((await notifyNewRequest({ id: '../admins/x', db, send: s.send, siteUrl: SITE })).status, 400);
  assert.equal((await notifyNewRequest({ id: 42, db, send: s.send, siteUrl: SITE })).status, 400);
  assert.equal(s.calls.length, 0);
});
test('old requests are not (re-)announced', async () => {
  const id = await seed({ createdAt: Timestamp.fromMillis(Date.now() - 60 * 60 * 1000) }); const s = spySender();
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE })).result, 'too-old');
  assert.equal(s.calls.length, 0);
});
test('requests Johnny entered himself are not announced', async () => {
  const id = await seed({ source: 'phone', createdBy: 'johnny@example.com' }); const s = spySender();
  assert.equal((await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE })).result, 'skipped-manual');
  assert.equal(s.calls.length, 0);
});
test('Telegram failure → request stays saved, failure is recorded, no exception', async () => {
  const id = await seed(); const s = spySender({ fail: true });
  const r = await notifyNewRequest({ id, db, send: s.send, siteUrl: SITE });
  assert.equal(r.result, 'send-failed');
  assert.ok((await db.collection('requests').doc(id).get()).exists);
  assert.equal((await db.collection('notifications').doc(id).get()).data().state, 'failed');
});
test('sender: dry run unless NOTIFY_MODE is exactly "live"', async () => {
  let called = 0; const fakeFetch = async () => { called++; return new Response('{"ok":true}'); };
  for (const mode of [undefined, '', 'LIVE', 'dry-run', 'true']) {
    const r = await telegramSender({ NOTIFY_MODE: mode, TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' }, fakeFetch)('x', 'b', 'https://u');
    assert.equal(r.dryRun, true);
  }
  assert.equal(called, 0);
});
test('sender (live, fake network): posts one message with a single button, token only in the URL path', async () => {
  const seen = [];
  const fakeFetch = async (url, opts) => { seen.push({ url, body: JSON.parse(opts.body) }); return new Response('{"ok":true}'); };
  const r = await telegramSender({ NOTIFY_MODE: 'live', TELEGRAM_BOT_TOKEN: 'TEST:TOKEN', TELEGRAM_CHAT_ID: '12345' }, fakeFetch)('hello', 'open', 'https://x/admin?r=1');
  assert.equal(r.dryRun, false);
  assert.equal(seen[0].url, 'https://api.telegram.org/botTEST:TOKEN/sendMessage');
  assert.equal(seen[0].body.chat_id, '12345');
  assert.deepEqual(seen[0].body.reply_markup.inline_keyboard, [[{ text: 'open', url: 'https://x/admin?r=1' }]]);
  assert.ok(!JSON.stringify(seen[0].body).includes('TEST:TOKEN'));
});
test('API route end-to-end (emulator, dry run)', async () => {
  const id = await seed();
  const { POST } = await import('../api/notify-new-request.js');
  const res = await POST(new Request('https://example.test/api/notify-new-request', { method: 'POST', body: JSON.stringify({ id }) }));
  assert.equal(res.status, 200);
  assert.equal((await res.json()).result, 'dry-run');
  const res2 = await POST(new Request('https://example.test/api/notify-new-request', { method: 'POST', body: JSON.stringify({ id }) }));
  assert.equal((await res2.json()).result, 'duplicate');
});
