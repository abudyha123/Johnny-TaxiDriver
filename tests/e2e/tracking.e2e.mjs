// End-to-end: customer phone + admin computer + a third "device" opening the tracking link,
// against the local Firebase emulators only (project "demo-…"; no real data).
// Run by CI:  npm run test:e2e
import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const PROJECT = 'demo-johnny-taxi-e2e';
const SITE = process.env.SITE_URL || 'http://127.0.0.1:4300';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const ADMIN = { email: 'johnny@example.com', password: 'e2e-Admin-pass-1' };
const STRANGER = { email: 'stranger@example.com', password: 'e2e-Stranger-pass-1' };

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['ok', name]); console.log(`ok - ${name}`); }
  catch (e) { results.push(['FAIL', name]); console.log(`not ok - ${name}\n  ${String(e?.message || e).split('\n').slice(0, 6).join('\n  ')}`); }
}
async function signUp({ email, password }) {
  const r = await fetch(`${AUTH}/accounts:signUp?key=fake-api-key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const j = await r.json(); if (!j.localId) throw new Error(JSON.stringify(j)); return j.localId;
}
// "Bearer owner" = emulator-only admin access that bypasses rules (test setup only)
async function fsWrite(path, fields) {
  const r = await fetch(`${FS}/${path}`, { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ fields }) });
  if (!r.ok) throw new Error(await r.text());
}
const token43 = () => randomBytes(32).toString('base64url');

const adminUid = await signUp(ADMIN);
await signUp(STRANGER);
await fsWrite(`admins/${adminUid}`, { role: { stringValue: 'owner' } });

const browser = await chromium.launch();
const phone = await browser.newContext({ ...devices['Pixel 7'], locale: 'he-IL' });
const computer = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const other = await browser.newContext({ ...devices['iPhone 13'] });

const customer = await phone.newPage();
let trackLink = '';

await step('customer: request is saved and shows a real "awaiting confirmation" status', async () => {
  await customer.goto(SITE + '/');
  await customer.evaluate(() => document.getElementById('booking').scrollIntoView());
  await customer.fill('#booking input[name=name]', 'לקוחה לבדיקה');
  await customer.fill('#booking input[name=phone]', '050-7654321');
  await customer.fill('#booking input[name=pickupAddress]', 'רחוב הבדיקה 5, חיפה');
  await customer.fill('#booking input[name=destination]', 'בית חולים רמב״ם');
  const d = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  await customer.fill('#booking input[name=date]', d);
  await customer.fill('#booking input[name=time]', '10:15');
  await customer.check('#booking input[name=wheelchairAccess][value=yes]');
  await customer.click('#booking button[type=submit]');
  await customer.waitForSelector('#booking-result-title', { timeout: 20000 });
  const txt = await customer.innerText('#booking-result');
  assert.match(txt, /הבקשה נשמרה/);
  assert.match(txt, /JT-[A-Z2-9]{5}/);
  await customer.waitForSelector('text=ממתינה לאישור', { timeout: 15000 });
  assert.doesNotMatch(txt, /הנסיעה אושרה/);
  trackLink = await customer.inputValue('#booking-result input[readonly]');
  assert.match(trackLink, /\/track\?l=he#[A-Za-z0-9_-]{43}$/);
});

const tracker = await other.newPage();
await step('another device: tracking link shows status only – no personal details', async () => {
  await tracker.goto(trackLink);
  await tracker.waitForSelector('text=ממתינה לאישור', { timeout: 15000 });
  const body = await tracker.innerText('body');
  for (const secret of ['לקוחה לבדיקה', '7654321', 'רחוב הבדיקה', 'רמב״ם', 'כיסא']) assert.ok(!body.includes(secret), `leaked: ${secret}`);
  assert.equal(await tracker.getAttribute('meta[name=robots]', 'content'), 'noindex, nofollow');
});

const admin = await computer.newPage();
await step('admin: sees the request live and confirms it', async () => {
  await admin.goto(SITE + '/admin');
  await admin.fill('#em', ADMIN.email); await admin.fill('#pw', ADMIN.password);
  await admin.click('button[type=submit]');
  await admin.waitForSelector('text=לקוחה לבדיקה', { timeout: 15000 });
  const card = admin.locator('li', { hasText: 'לקוחה לבדיקה' });
  assert.match(await card.innerText(), /תופיע כאן אחרי סימון הבקשה/);
  assert.match(await card.innerText(), /לא שולח לו הודעה/);
  await card.getByRole('button', { name: 'אושרה', exact: true }).click();
  await card.getByRole('button', { name: 'כן, אושרה' }).click();
  await card.getByRole('link', { name: 'שליחת אישור בוואטסאפ' }).waitFor({ timeout: 10000 });
  const href = await card.getByRole('link', { name: 'שליחת אישור בוואטסאפ' }).getAttribute('href');
  const text = decodeURIComponent(href.split('text=')[1]);
  assert.match(href, /^https:\/\/wa\.me\/972507654321\?text=/);
  assert.match(text, /הנסיעה שלך אושרה/); assert.match(text, /10:15/);
  assert.ok(text.includes(trackLink.split('#')[1]), 'tracking link in message');
});

await step('customer + other device update to "ride confirmed" without reloading', async () => {
  await tracker.waitForSelector('text=הנסיעה אושרה', { timeout: 15000 });
  await customer.waitForSelector('text=הנסיעה אושרה', { timeout: 15000 });
});

await step('after refresh the confirmed status is still shown (customer + admin "upcoming")', async () => {
  await tracker.reload();
  await tracker.waitForSelector('text=הנסיעה אושרה', { timeout: 15000 });
  await admin.reload();
  await admin.getByRole('button', { name: /מאושרות קרובות/ }).click();
  await admin.locator('li', { hasText: 'לקוחה לבדיקה' }).getByText('אושרה').first().waitFor({ timeout: 15000 });
  await admin.getByRole('button', { name: /לטיפול/ }).click();
  assert.ok(!(await admin.innerText('main')).includes('לקוחה לבדיקה'), 'confirmed ride left "to handle"');
});

await step('connection lost: last status is marked as not verified now', async () => {
  await other.setOffline(true);
  await tracker.waitForSelector('text=אין חיבור כרגע', { timeout: 15000 });
  await other.setOffline(false);
  await tracker.waitForSelector('text=אומת מול השרת', { timeout: 20000 });
});

await step('wrong, missing and expired links are refused', async () => {
  const p = await other.newPage();
  await p.goto(`${SITE}/track?l=he#${token43()}`);
  await p.waitForSelector('text=הקישור אינו תקף', { timeout: 15000 });
  await p.goto(`${SITE}/track?l=he`);
  await p.waitForSelector('text=הקישור אינו תקף', { timeout: 15000 });
  const old = token43();
  await fsWrite(`tracking/${old}`, {
    v: { integerValue: '1' }, rid: { stringValue: 'x' }, code: { stringValue: 'JT-AAAAA' }, status: { stringValue: 'confirmed' },
    createdAt: { timestampValue: new Date(Date.now() - 20 * 86400000).toISOString() },
    updatedAt: { timestampValue: new Date(Date.now() - 19 * 86400000).toISOString() },
    expiresAt: { timestampValue: new Date(Date.now() - 86400000).toISOString() },
  });
  await p.goto(`${SITE}/track?l=he#${old}`);
  await p.waitForSelector('text=הקישור אינו תקף', { timeout: 15000 });
  assert.ok(!(await p.innerText('body')).includes('JT-AAAAA'));
});

await step('admin on a phone: "to handle" / "upcoming" views, manual request, big call + confirm buttons', async () => {
  const c = await browser.newContext({ ...devices['Pixel 7'] }); const p = await c.newPage();
  await p.goto(SITE + '/admin');
  await p.fill('#em', ADMIN.email); await p.fill('#pw', ADMIN.password); await p.click('button[type=submit]');
  await p.getByRole('button', { name: /לטיפול/ }).waitFor({ timeout: 15000 });
  await p.getByRole('button', { name: /בקשה ידנית/ }).click();
  const dlg = p.getByRole('dialog');
  await dlg.locator('label', { hasText: 'וואטסאפ' }).click();
  await p.fill('#m-name', 'לקוח מהטלפון'); await p.fill('#m-phone', '052-3334444');
  const d = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  await p.fill('#m-date', d); await p.fill('#m-time', '07:45');
  await p.fill('#m-from', 'קריית ביאליק'); await p.fill('#m-to', 'רמב״ם');
  await dlg.locator('label', { hasText: 'לא' }).click();
  await p.selectOption('select[aria-label="סטטוס התחלתי"]', 'confirmed');
  await dlg.getByRole('button', { name: 'שמירת הבקשה' }).click();
  await dlg.getByText(/הבקשה נשמרה/).waitFor({ timeout: 15000 });
  const link = await dlg.locator('input[readonly]').inputValue();
  assert.match(link, /\/track\?l=he#[A-Za-z0-9_-]{43}$/);
  await dlg.getByRole('button', { name: 'סגירה' }).last().click();
  await p.getByRole('button', { name: /מאושרות קרובות/ }).click();
  const card = p.locator('li', { hasText: 'לקוח מהטלפון' });
  await card.waitFor({ timeout: 15000 });
  assert.match(await card.innerText(), /וואטסאפ/);                         // source badge
  const call = card.getByRole('link', { name: /חיוג/ });
  assert.equal(await call.getAttribute('href'), 'tel:0523334444');
  const box = await call.boundingBox(); assert.ok(box.height >= 48 && box.width >= 120, 'call button big enough');
  const conf = card.getByRole('link', { name: 'שליחת אישור בוואטסאפ' });
  const cb = await conf.boundingBox(); assert.ok(cb.height >= 48, 'confirm button big enough');
  // the first website request (confirmed earlier) is also in "upcoming"; "to handle" is now empty of both
  await p.getByRole('button', { name: /לטיפול/ }).click();
  assert.ok(!(await p.innerText('main')).includes('לקוח מהטלפון'));
  const t = await other.newPage(); await t.goto(link);
  await t.waitForSelector('text=הנסיעה אושרה', { timeout: 15000 });
  assert.ok(!(await t.innerText('body')).includes('לקוח מהטלפון'));
  await p.screenshot({ path: 'e2e-admin-mobile.png', fullPage: false });
  await c.close();
});

await step('signed-in account that is not on the admins list gets no access', async () => {
  const c = await browser.newContext(); const p = await c.newPage();
  await p.goto(SITE + '/admin');
  await p.fill('#em', STRANGER.email); await p.fill('#pw', STRANGER.password);
  await p.click('button[type=submit]');
  await p.waitForSelector('text=אין הרשאה', { timeout: 15000 });
  assert.ok(!(await p.innerText('body')).includes('לקוחה לבדיקה'));
  await c.close();
});

await step('tracking page in Arabic and English (direction + texts)', async () => {
  const p = await other.newPage();
  await p.goto(trackLink.replace('?l=he', '?l=ar'));
  await p.waitForSelector('text=تم تأكيد الرحلة', { timeout: 15000 });
  assert.equal(await p.getAttribute('html', 'dir'), 'rtl');
  await p.goto(trackLink.replace('?l=he', '?l=en'));
  await p.waitForSelector('text=Ride confirmed', { timeout: 15000 });
  assert.equal(await p.getAttribute('html', 'dir'), 'ltr');
  await p.setViewportSize({ width: 360, height: 740 });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assert.equal(overflow, false, 'horizontal overflow on a small phone');
  await p.screenshot({ path: 'e2e-track-en.png', fullPage: true });
  await tracker.screenshot({ path: 'e2e-track-he.png', fullPage: true });
});

await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n# e2e ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
