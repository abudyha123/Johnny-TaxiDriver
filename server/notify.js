// "New request" notifications for Johnny (server side only).
//
// Two entry points share one state machine:
//   notifyNewRequest – right after a website save (the browser passes only the id)
//   reconcile        – a scheduled scan that completes anything missed or failed
//
// The server never trusts the browser: it re-reads the request with the Admin SDK and
// only announces real website requests. Messages are generic (code + link), no
// customer details.
//
// Marker: notifications/{channel}__{requestId}
//   state: sending  – an attempt is in progress (lease expires after LEASE_MS)
//          sent     – Telegram confirmed delivery            (final)
//          failed   – Telegram refused it; NOT delivered     (retry after nextAttemptAt)
//          unknown  – timeout/network/5xx; maybe delivered   (retry after nextAttemptAt,
//                     marked "may be a repeat")
//          dry-run  – NOTIFY_MODE is not "live"              (final for this channel)
//          gave-up  – MAX_ATTEMPTS reached                   (final)
// Every attempt is claimed in a transaction, so parallel calls never send twice.

const ID_RE = /^[A-Za-z0-9-]{8,64}$/;
export const FRESH_MS = 15 * 60 * 1000;          // browser path: only requests up to 15 min old
export const RECONCILE_WINDOW_MS = 48 * 3600 * 1000;
export const RECONCILE_MIN_AGE_MS = 2 * 60 * 1000; // give the browser path 2 min first
export const LEASE_MS = 90 * 1000;
export const MAX_ATTEMPTS = 5;
const BACKOFF_MIN = [2, 5, 15, 30];               // after attempt 1, 2, 3, 4
const UNKNOWN_RETRY_MIN = 10;

const FINAL = new Set(['sent', 'dry-run', 'gave-up']);

export function markerId(channel, id) { return `${channel || 'default'}__${id}`; }

function eligible(r) {
  return (!r.source || r.source === 'website') && (r.status === 'new' || r.status === 'in_progress');
}

/** Claim the right to make one attempt. Returns { attempt, possibleRepeat } or null. */
async function claim(db, ref, code, now) {
  return db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    const d = snap.exists ? snap.data() : null;
    if (d) {
      if (FINAL.has(d.state)) return null;
      if (d.state === 'sending' && d.leaseUntil?.toMillis() > now) return null;
      if ((d.state === 'failed' || d.state === 'unknown') && d.nextAttemptAt?.toMillis() > now) return null;
      if ((d.attempts || 0) >= MAX_ATTEMPTS) { t.update(ref, { state: 'gave-up', updatedAt: new Date(now) }); return null; }
    }
    // a previous attempt that may have reached Telegram (unknown outcome, or a crash
    // while "sending") → this one is labelled as a possible repeat
    const possibleRepeat = !!d && (d.state === 'unknown' || d.state === 'sending');
    const attempt = (d?.attempts || 0) + 1;
    t.set(ref, {
      state: 'sending', attempts: attempt, code,
      leaseUntil: new Date(now + LEASE_MS), updatedAt: new Date(now),
      ...(d ? {} : { firstAt: new Date(now) }),
    }, { merge: true });
    return { attempt, possibleRepeat };
  });
}

/** One notification attempt for one request (if it is due). */
export async function processRequest({ db, send, siteUrl, channel, snap, now = Date.now(), late = false }) {
  const r = snap.data();
  if (!eligible(r)) return 'not-eligible';
  const ref = db.collection('notifications').doc(markerId(channel, snap.id));
  const c = await claim(db, ref, r.code, now);
  if (!c) return 'not-due';

  const lines = [late
    ? `🚕 בקשת נסיעה מהאתר ממתינה לטיפול (${r.code}).`
    : `🚕 בקשת נסיעה חדשה התקבלה באתר (${r.code}).`];
  if (c.possibleRepeat) lines.push('(ייתכן שזו התראה חוזרת)');
  lines.push('לחצו לפתיחה במסך הניהול.');
  const url = `${siteUrl.replace(/\/+$/, '')}/admin?r=${encodeURIComponent(snap.id)}`;

  try {
    const { dryRun } = await send(lines.join('\n'), 'פתיחת הבקשה', url);
    await ref.update({ state: dryRun ? 'dry-run' : 'sent', sentAt: new Date(), leaseUntil: null, lastError: null });
    return dryRun ? 'dry-run' : 'sent';
  } catch (e) {
    const kind = e?.kind === 'unknown' ? 'unknown' : 'failed';
    const waitMin = kind === 'unknown' ? UNKNOWN_RETRY_MIN : BACKOFF_MIN[Math.min(c.attempt - 1, BACKOFF_MIN.length - 1)];
    const waitMs = Math.max(waitMin * 60000, (e?.retryAfterSec || 0) * 1000);
    await ref.update({
      state: c.attempt >= MAX_ATTEMPTS ? 'gave-up' : kind,
      nextAttemptAt: new Date(now + waitMs), leaseUntil: null,
      lastError: String(e?.message || e).slice(0, 200), updatedAt: new Date(),
    }).catch(() => {});
    return kind;
  }
}

/** Browser path: "request <id> was saved". Verified here; never trusted. */
export async function notifyNewRequest({ id, db, send, siteUrl, channel, now = Date.now() }) {
  if (typeof id !== 'string' || !ID_RE.test(id)) return { status: 400, result: 'bad-id' };
  const snap = await db.collection('requests').doc(id).get();
  if (!snap.exists) return { status: 404, result: 'not-found' };
  const r = snap.data();
  if (r.source && r.source !== 'website') return { status: 200, result: 'skipped-manual' };
  const created = r.createdAt?.toMillis?.() ?? 0;
  if (!created || now - created > FRESH_MS) return { status: 409, result: 'too-old' };
  const result = await processRequest({ db, send, siteUrl, channel, snap, now });
  const status = result === 'failed' || result === 'unknown' ? 502 : 200;
  return { status, result: result === 'not-due' ? 'duplicate' : result };
}

/**
 * Scheduled catch-up. Looks only at website requests created after `since`
 * (NOTIFY_SINCE – set when notifications are switched on, so older test requests are
 * never announced) and within the last 48 hours, still new / in progress.
 */
export async function reconcile({ db, send, siteUrl, channel, since, now = Date.now(), pauseMs = 1100, maxSends = 20 }) {
  const sinceMs = Date.parse(since || '');
  if (!since || Number.isNaN(sinceMs)) return { skipped: 'NOTIFY_SINCE not set' };
  const from = new Date(Math.max(sinceMs, now - RECONCILE_WINDOW_MS));
  const q = await db.collection('requests').where('createdAt', '>=', from).orderBy('createdAt').limit(200).get();
  const summary = { scanned: q.size, sent: 0, dryRun: 0, failed: 0, unknown: 0, notDue: 0, notEligible: 0, tooFresh: 0 };
  let sends = 0;
  for (const snap of q.docs) {
    const created = snap.data().createdAt?.toMillis?.() ?? 0;
    if (now - created < RECONCILE_MIN_AGE_MS) { summary.tooFresh++; continue; }
    if (sends >= maxSends) break;
    const res = await processRequest({ db, send, siteUrl, channel, snap, now, late: true });
    if (res === 'sent') summary.sent++; else if (res === 'dry-run') summary.dryRun++;
    else if (res === 'failed') summary.failed++; else if (res === 'unknown') summary.unknown++;
    else if (res === 'not-due') summary.notDue++; else summary.notEligible++;
    if (['sent', 'dry-run', 'failed', 'unknown'].includes(res)) {
      sends++;
      if (pauseMs) await new Promise((r) => setTimeout(r, pauseMs)); // Telegram: ≤1 msg/s per chat
    }
  }
  return summary;
}
