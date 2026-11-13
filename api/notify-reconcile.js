// Private scheduled function (Vercel Schedules, see vercel.json). It has no public URL;
// only Vercel's scheduler can invoke it. Completes notifications that were missed
// (customer closed the browser) or failed (Telegram error), without duplicates.
import { handleSchedule } from '@vercel/schedules';
import { adminDb } from '../server/firebaseAdmin.js';
import { telegramSender } from '../server/telegram.js';
import { reconcile } from '../server/notify.js';
import { notifyConfig } from '../server/config.js';

export const POST = handleSchedule(async (metadata) => {
  const { channel, siteUrl, since } = notifyConfig(process.env);
  if (!siteUrl) { console.log('notify-reconcile: PUBLIC_SITE_URL not set – skipped'); return; }
  const summary = await reconcile({ db: adminDb(), send: telegramSender(), siteUrl, channel, since });
  console.log(`notify-reconcile ${metadata.executionId}`, JSON.stringify(summary));
});
