// Server configuration from environment variables (Vercel → Settings → Environment Variables).
export function notifyConfig(env = process.env, requestUrl) {
  const vercelUrl = env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_BRANCH_URL;
  return {
    // separates Preview from Production markers (they share one database)
    channel: env.NOTIFY_CHANNEL || env.VERCEL_ENV || 'default',
    siteUrl: env.PUBLIC_SITE_URL
      || (vercelUrl ? `https://${vercelUrl}` : '')
      || (requestUrl ? new URL(requestUrl).origin : ''),
    since: env.NOTIFY_SINCE,
  };
}
