// Sends one Telegram message to Johnny's private chat with the bot.
// NOTIFY_MODE must be exactly "live" for a real message; anything else is a dry run.
export function telegramSender(env = process.env, fetchImpl = fetch) {
  const live = env.NOTIFY_MODE === 'live';
  return async function send(text, buttonText, buttonUrl) {
    if (!live) return { dryRun: true };
    const token = env.TELEGRAM_BOT_TOKEN, chatId = env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) throw new Error('telegram-not-configured');
    const r = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text, disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`telegram-${r.status}`);
    return { dryRun: false };
  };
}
