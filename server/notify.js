// "New request" notification for Johnny. The browser only says "request <id> was saved";
// this code checks the request really exists in Firestore (Admin SDK), is a fresh website
// request, and has not been notified before – then sends ONE generic message.
// No customer details ever leave in the message (it can show on a locked screen).

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const MAX_AGE_MS = 15 * 60 * 1000; // only requests created in the last 15 minutes

export async function notifyNewRequest({ id, db, send, siteUrl, now = Date.now() }) {
  if (typeof id !== 'string' || !ID_RE.test(id)) return { status: 400, result: 'bad-id' };

  const snap = await db.collection('requests').doc(id).get();
  if (!snap.exists) return { status: 404, result: 'not-found' };
  const r = snap.data();
  if (r.source && r.source !== 'website') return { status: 200, result: 'skipped-manual' };
  const created = r.createdAt?.toMillis?.() ?? 0;
  if (!created || now - created > MAX_AGE_MS) return { status: 409, result: 'too-old' };

  // Idempotency: create() fails if the marker already exists → never two messages.
  const marker = db.collection('notifications').doc(id);
  try {
    await marker.create({ state: 'sending', at: new Date(now), code: r.code });
  } catch (e) {
    if (e?.code === 6 || /already exists/i.test(String(e?.message))) return { status: 200, result: 'duplicate' };
    throw e;
  }

  const text = `🚕 בקשת נסיעה חדשה התקבלה באתר (${r.code}).\nלחצו לפתיחה במסך הניהול.`;
  const url = `${siteUrl.replace(/\/+$/, '')}/admin?r=${encodeURIComponent(id)}`;
  try {
    const { dryRun } = await send(text, 'פתיחת הבקשה', url);
    await marker.update({ state: dryRun ? 'dry-run' : 'sent', sentAt: new Date() });
    return { status: 200, result: dryRun ? 'dry-run' : 'sent' };
  } catch (e) {
    // the request itself stays saved; the marker records the failure for a later retry
    await marker.update({ state: 'failed', error: String(e?.message || e).slice(0, 200) }).catch(() => {});
    return { status: 502, result: 'send-failed' };
  }
}
