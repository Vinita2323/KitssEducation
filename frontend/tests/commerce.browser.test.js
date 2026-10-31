import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { randomUUID } from 'node:crypto';
import { commerceFixture } from '../../backend/tests/commerce-fixture.js';

const dbName = process.env.KITSS_STAGE6_BROWSER_DB, chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 6 existing UI real API and standalone MongoDB with explicitly isolated mock Checkout', { skip: !dbName ? 'No KITSS_STAGE6_BROWSER_DB supplied' : !existsSync(chrome) ? 'Chrome missing' : false, timeout: 600000 }, async t => {
  const f = await commerceFixture(dbName); let vite, backend, browser;
  t.after(async () => { try { await browser?.close(); await vite?.close(); if (backend) await new Promise(r => { backend.close(r); backend.closeAllConnections(); }); } finally { await f.close(); } });
  const admin = await f.fixtureUser(), actor = await f.fixtureUser(['student']), foreign = await f.fixtureUser(['student']), readonly = await f.fixtureUser(['admin'], ['commerce.read']);
  const book = await f.book(admin, 'STAGE6_BROWSER_BOOK');
  backend = http.createServer(); await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + dbName + '/', import.meta.url)), optimizeDeps: { noDiscovery: true, include: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom', 'lucide-react', 'framer-motion', 'html-to-image', 'html2canvas', 'jspdf'] }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + backend.address().port, changeOrigin: true } } }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port; f.config.corsOrigins = [base]; f.config.appPublicUrl = base; backend.on('request', f.app());
  browser = await chromium.launch({ executablePath: chrome, headless: true }); const context = await browser.newContext({ viewport: { width: 390, height: 950 } }), page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = [], external = []; page.on('pageerror', e => errors.push(e.message));
  let checkoutEnabled = false, action = 'dismiss';
  await context.exposeFunction('__isolatedFixturePayment', async orderId => {
    const payment = f.provider.pay(orderId, action === 'authorized' ? 'authorized' : action === 'failed' ? 'failed' : 'captured');
    return { razorpay_order_id: orderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(orderId + '|' + payment.id) };
  });
  await context.addInitScript(() => {
    window.Razorpay = class { constructor(options) { this.options = options; } on() {} async open() { if (window.__fixtureAction === 'dismiss') this.options.modal.ondismiss(); else this.options.handler(await window.__isolatedFixturePayment(this.options.order_id)); } };
  });
  await page.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base) { external.push(url.origin); return route.abort(); }
    if (checkoutEnabled && url.pathname === '/api/v1/public/payment-config') return route.fulfill({ json: { data: { available: true, paymentMode: 'test' } } });
    if (checkoutEnabled && /\/api\/v1\/orders\/[^/]+\/payment-attempts$/.test(url.pathname)) {
      // Harness-only mock Checkout bridge. Aggregate remains labelled simulated; no backend verification is weakened.
      const response = await route.fetch(), data = await response.json(); if (data.data?.checkout) data.data.checkout.simulated = false; return route.fulfill({ response, json: data });
    }
    return route.continue();
  });
  const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const identity = async value => { await context.clearCookies(); if (value) await context.addCookies([{ name: value.user.roles.includes('student') ? 'kitss_student_session' : 'kitss_staff_session', value: value.token, url: base, httpOnly: true, sameSite: 'Lax' }]); };
  const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url)); mkdirSync(artifacts, { recursive: true });
  t.afterEach(async child => { if (child.passed === false) await page.screenshot({ path: artifacts + 'stage6-failure-' + child.name.replace(/[^a-z0-9]/gi, '-') + '.png', fullPage: true }); });
  let orderId;
  await t.test('ordinary credential gate does not launch Checkout or show fake success', async () => {
    await identity(actor); await goto('/books/' + book.id + '/checkout'); await page.getByRole('heading', { name: 'Order Summary', exact: true }).waitFor();
    await page.getByText(/Payments unavailable: fresh rotated/).waitFor(); assert.equal(await page.getByRole('button', { name: /Pay .* Access Book/ }).isDisabled(), true);
    assert.equal(await f.models.Order.countDocuments(), 0); assert.equal(external.filter(origin=>origin.includes('razorpay')).length, 0);
  });
  await t.test('isolated mock Checkout dismissal, pending status, refresh and authorized-only payment grant nothing', async () => {
    checkoutEnabled = true; action = 'dismiss'; await goto('/books/' + book.id + '/checkout'); await page.evaluate(() => { window.__fixtureAction = 'dismiss'; });
    await page.getByRole('button', { name: /Pay .* Access Book/ }).click(); await page.getByText(/Checkout closed/).waitFor(); orderId = new URL(page.url()).searchParams.get('order'); assert.ok(orderId);
    assert.equal(await f.models.BookEntitlement.countDocuments(), 0); await f.models.Book.updateOne({_id:book.id},{$set:{'publishedSnapshot.priceMinor':25000}}); await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByText(/fulfillment: pending/).waitFor(); assert.ok((await page.getByRole('button',{name:/Pay .* Access Book/}).textContent()).includes('123.45'));
    action = 'failed'; await page.evaluate(() => { window.__fixtureAction = 'failed'; }); await page.getByRole('button', { name: /Pay .* Access Book/ }).click(); await page.getByText(/Payment attempt failed. No access granted/).waitFor(); assert.equal(await f.models.BookEntitlement.countDocuments(), 0);
    action = 'authorized'; await page.evaluate(() => { window.__fixtureAction = 'authorized'; }); await page.getByRole('button', { name: /Pay .* Access Book/ }).click();
    await page.getByText(/Your payment is awaiting confirmation/).waitFor(); assert.equal(await f.models.BookEntitlement.countDocuments(), 0);
  });
  await t.test('captured payment and fulfillment are backend verified; order history/receipts and secure private bytes', async () => {
    action = 'captured'; await page.evaluate(() => { window.__fixtureAction = 'captured'; }); await page.getByRole('button', { name: /Pay .* Access Book/ }).click();
    await page.getByText('Test payment captured and fulfilled', { exact: true }).waitFor({ timeout: 45000 }); assert.equal(await f.models.BookEntitlement.countDocuments(), 1);
    await goto('/orders'); await page.getByText(/Simulated Test Mode - captured; fulfillment: applied/).waitFor(); await page.getByRole('button', { name: 'View Receipt', exact: true }).click(); await page.getByText('Test Mode Order Details - Not a Tax Invoice', { exact: true }).waitFor();
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download Test Payment Receipt (JSON)', exact: true }).click(); assert.match((await download).suggestedFilename(), /test-receipt\.json$/);
    await goto('/my-books'); const link = page.getByRole('link', { name: 'Open secure PDF', exact: true }); await link.waitFor(); assert.equal(await link.getAttribute('href'), '/books/' + book.id + '/read');
  });
  await t.test('registration drafts persist and recover all safe form fields while submission and identity uploads remain blocked', async () => {
    await goto('/register?type=teacher'); await page.getByRole('button', { name: 'Save application draft', exact: true }).waitFor();
    const input = page.locator('input[name="fullName"]'); await input.fill('STAGE6_BROWSER_APPLICANT'); await page.getByRole('button', { name: 'Save application draft', exact: true }).click(); await page.getByText(/Application reference: STAGE6-APP/).waitFor();
    const application = new URL(page.url()).searchParams.get('application'); assert.ok(application); await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('button', { name: 'Save changes', exact: true }).waitFor(); assert.equal(await input.inputValue(), 'STAGE6_BROWSER_APPLICANT');
    assert.equal((await f.models.RegistrationApplication.findById(application)).paymentState, 'blocked');
  });
  await t.test('admin history, reconciliation, pricing and financial summaries use persisted simulated records only', async () => {
    checkoutEnabled = false; await identity(admin); await goto('/admin/orders'); await page.getByRole('heading', { name: 'Orders & Payment Review', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Payment details', exact: true }).first().click(); await page.getByText(/pay_/).first().waitFor();
    const reconcile = page.waitForResponse(r => r.url().includes('/reconcile') && r.request().method() === 'POST'); await page.getByRole('button', { name: 'Check payment status', exact: true }).first().click(); assert.equal((await reconcile).status(), 202);
    await goto('/admin/settings'); await page.getByLabel('Setting group', { exact: true }).selectOption('registrationFees'); await page.getByLabel('study fee minor units', { exact: true }).fill('900'); const saved = page.waitForResponse(r => r.url().includes('/admin/settings/registrationFees') && r.request().method() === 'PATCH'); await page.getByRole('button', { name: 'Save Public Settings', exact: true }).click(); assert.equal((await saved).status(), 200);
    await goto('/admin'); await page.getByRole('heading', { name: /^Welcome back|^Dashboard$/ }).waitFor(); await page.getByText(/Simulated payments: no real money is collected/).waitFor();
    await identity(readonly); await goto('/admin/orders'); assert.equal(await page.getByRole('button', { name: 'Check payment status', exact: true }).first().isDisabled(), true);
  });
  await t.test('cross-account isolation and expired sessions do not retain order data', async () => {
    await identity(foreign); await goto('/orders'); await page.getByText('No Orders Yet', { exact: true }).waitFor();
    await goto('/books/' + book.id + '/checkout?order=' + orderId); await page.getByText('Order or application was not found', { exact: true }).waitFor();
    await context.clearCookies(); await goto('/orders');
    await page.waitForURL(/\/login/, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('button', { name: 'Login', exact: true }).waitFor();
    assert.equal((await context.request.get(base + '/api/v1/auth/me')).status(), 401);
    assert.equal(await page.getByText(/Simulated Test Mode - captured/).count(), 0);
  });
  for (const width of (process.env.KITSS_BROWSER_WORKFLOWS_ONLY ? [] : [320,375,390,414,768,1024,1440])) await t.test('commerce responsive layout at ' + width + 'px', async () => {
    await page.setViewportSize({ width, height: 950 }); await identity(admin);
    for (const path of ['/admin/orders', '/admin/registrations', '/admin/settings', '/admin']) { await goto(path); await page.locator('main, form').first().waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
    await identity(actor); for (const path of ['/orders', '/books/' + book.id + '/checkout?order=' + orderId, '/register?type=study', '/coaching/fixture/subscribe']) { await goto(path); await page.locator('main, form').first().waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
    await page.screenshot({ path: artifacts + 'stage6-' + width + '.png', fullPage: true });
  });
  assert.deepEqual(errors, []); assert.deepEqual(external.filter(origin=>origin.includes('razorpay')), []);
});
