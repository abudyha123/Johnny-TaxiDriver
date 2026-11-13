// POST /api/notify-new-request  { "id": "<request id>" }
// Called by the booking form right after Firestore confirmed the save. Whatever happens
// here, the customer's request is already saved; the form ignores this response.
import { adminDb } from '../server/firebaseAdmin.js';
import { telegramSender } from '../server/telegram.js';
import { notifyNewRequest } from '../server/notify.js';
import { notifyConfig } from '../server/config.js';

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export async function POST(request) {
  let id;
  try { ({ id } = await request.json()); } catch { return json(400, { result: 'bad-json' }); }
  try {
    const { channel, siteUrl } = notifyConfig(process.env, request.url);
    const { status, result } = await notifyNewRequest({ id, db: adminDb(), send: telegramSender(), siteUrl, channel });
    return json(status, { result });
  } catch (e) {
    return json(e?.status || 500, { result: e?.message === 'notify-not-configured' ? 'not-configured' : 'error' });
  }
}
