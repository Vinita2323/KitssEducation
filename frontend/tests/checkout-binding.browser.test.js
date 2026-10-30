import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { coachingFixture } from '../../backend/tests/coaching-fixture.js';

const name = process.env.KITSS_STAGE19_BROWSER_DB;
test('checkout binds resumed orders to the displayed product (synthetic provider only)', {
  skip: !name ? 'No fresh Stage 19 local browser fixture selected' : false, timeout: 300000,
}, async t => {
  const f = await coachingFixture(name); let backend, vite, browser;
  t.after(async () => { await browser?.close(); await vite?.close(); if (backend) await new Promise(r => { backend.close(r); backend.closeAllConnections(); }); await f.close(); });
  const d = await f.seed();
  const bookOrder = await f.service.create({ product: { kind: 'book', id: d.book.id }, idempotencyKey: randomUUID() }, d.other.auth, f.ctx);
  const courseOrder = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, d.other.auth, f.ctx);
  backend = http.createServer(); await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + name, import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + backend.address().port, changeOrigin: true } } }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port; f.config.corsOrigins = [base]; backend.on('request', f.app());
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 950 } });
  await context.addCookies([{ name: 'kitss_student_session', value: d.other.token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  const page = await context.newPage(); page.setDefaultTimeout(45000); let attempts = 0, captureEnabled = false;
  await context.exposeFunction('__stage19SyntheticCapture', orderId => {
    const payment = f.provider.pay(orderId);
    return { razorpay_order_id: orderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(orderId + '|' + payment.id) };
  });
  await context.addInitScript(() => { window.Razorpay = class { constructor(options) { this.options = options; } on() {} async open() { this.options.handler(await window.__stage19SyntheticCapture(this.options.order_id)); } }; });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (url.pathname === '/api/v1/public/payment-config') return route.fulfill({ json: { data: { available: true, paymentMode: 'test' } } });
    if (url.pathname.endsWith('/payment-attempts')) {
      attempts++;
      if (!captureEnabled) return route.fulfill({ status: 503, json: { error: { code: 'TEST_STOP', message: 'Synthetic checkout boundary' } } });
      // Presentation-only bridge for an injected fake Checkout. Persisted
      // provider records remain simulated; real backend verification still runs.
      const response = await route.fetch(), json = await response.json();
      if (json.data?.checkout) json.data.checkout.simulated = false;
      return route.fulfill({ response, json });
    }
    return route.continue();
  });
  for (const [kind, route, wrongOrder] of [
    ['course', '/coaching/' + d.course.id, bookOrder],
    ['book', '/books/' + d.book.id + '/checkout', courseOrder],
  ]) await t.test(kind + ' rejects a different owned product order before Checkout', async () => {
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/orders/' + wrongOrder.id + '/status'), { timeout: 120000 }),
      page.goto(base + route + '?order=' + wrongOrder.id, { waitUntil: 'domcontentloaded', timeout: 120000 }),
    ]);
    await page.waitForTimeout(200);
    const button = page.getByRole('button', { name: kind === 'course' ? /^Purchase / : /^Pay / }).first();
    assert.equal(await button.isDisabled(), true, 'A different product order must block payment');
    await page.getByText(/This order does not belong/).waitFor();
    assert.equal(attempts, 0);
  });
  await t.test('matching book order can still resume its authoritative pending attempt', async () => {
    await page.goto(base + '/books/' + d.book.id + '/checkout?order=' + bookOrder.id, { waitUntil: 'domcontentloaded' });
    const button = page.getByRole('button', { name: /^Pay / }); await button.waitFor();
    await button.click(); await page.getByText('Synthetic checkout boundary', { exact: true }).waitFor();
    assert.equal(attempts, 1); assert.equal(await f.models.BookEntitlement.countDocuments({ userId: d.other.user._id }), 0);
  });
  await t.test('matching course order preserves its server-snapshotted course binding and can resume', async () => {
    assert.equal(courseOrder.product.courseId, d.course.id);
    let currentCourse = await f.models.Course.findById(d.course.id);
    await f.learning.publish(d.course.id, { expectedRevision: currentCourse.revision, publish: false }, d.admin.auth, f.ctx);
    const currentPlan = await f.models.CoursePlan.findById(d.plan.id);
    await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: currentPlan.revision, priceMinor: 23456 }, d.admin.auth, f.ctx);
    currentCourse = await f.models.Course.findById(d.course.id);
    await f.learning.publish(d.course.id, { expectedRevision: currentCourse.revision, publish: true }, d.admin.auth, f.ctx);
    await page.goto(base + '/coaching/' + d.course.id + '?order=' + courseOrder.id, { waitUntil: 'domcontentloaded' });
    const button = page.getByRole('button', { name: /^Resume .*INR 123\.45.*saved order/ }).first(); await button.waitFor();
    await button.click(); await page.getByText('Synthetic checkout boundary', { exact: true }).waitFor();
    assert.equal(attempts, 2); assert.equal(await f.models.Enrollment.countDocuments({ userId: d.other.user._id }), 0);
  });
  await t.test('valid resumed book and course complete signed synthetic verification and exactly one entitlement each', async () => {
    captureEnabled = true;
    for (const [route, order, buttonName] of [
      ['/books/' + d.book.id + '/checkout', bookOrder, /^Pay /],
      ['/coaching/' + d.course.id, courseOrder, /^Resume /],
    ]) {
      await page.goto(base + route + '?order=' + order.id, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: buttonName }).first().click();
      // Books report "fulfillment: applied"; the course panel reports "access applied".
      await page.getByText(/(fulfillment:|access) applied/).first().waitFor();
      const saved = await f.models.Order.findById(order.id);
      assert.equal(saved.status, 'captured'); assert.equal(saved.simulated, true); assert.equal(saved.amountMinor, 12345);
    }
    assert.equal(await f.models.BookEntitlement.countDocuments({ userId: d.other.user._id }), 1);
    assert.equal(await f.models.Enrollment.countDocuments({ userId: d.other.user._id }), 1);
    assert.equal(attempts, 4);
  });
});
