// Sends one Telegram message to the configured private chat.
// NOTIFY_MODE must be exactly "live" for a real message; anything else is a dry run.
//
// Outcome classes (used for retries):
//   ok        – Telegram confirmed the message
//   rejected  – Telegram answered with an error (4xx): the message was NOT sent; safe to retry
//   unknown   – timeout / network error / 5xx: we can't tell whether it arrived
export class SendError extends Error {
  constructor(kind, detail, retryAfterSec) { super(`${kind}:${detail}`); this.kind = kind; this.retryAfterSec = retryAfterSec; }
}

export function telegramSender(env = process.env, fetchImpl = fetch) {
  const live = env.NOTIFY_MODE === 'live';
  return async function send(text, buttonText, buttonUrl) {
    if (!live) return { dryRun: true };
    const token = env.TELEGRAM_BOT_TOKEN, chatId = env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new SendError('rejected', 'not-configured');
    let r;
    try {
      r = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId, text, disable_web_page_preview: true,
          reply_markup: { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] },
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (e) {
      throw new SendError('unknown', e?.name === 'TimeoutError' ? 'timeout' : 'network');
    }
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) return { dryRun: false };
    if (r.status >= 500) throw new SendError('unknown', `http-${r.status}`);
    throw new SendError('rejected', `http-${r.status}`, j?.parameters?.retry_after);
  };
}
