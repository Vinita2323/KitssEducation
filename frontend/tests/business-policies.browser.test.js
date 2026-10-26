import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { coachingFixture } from '../../backend/tests/coaching-fixture.js';

const db = process.env.KITSS_STAGE13_BROWSER_DB, chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 13 real browser/HTTP/MongoDB policy, free content and keyboard granular staff UI (fake scanner/mail/payment only)', { skip: !db ? 'No KITSS_STAGE13_BROWSER_DB' : !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 600000 }, async t => {
  const messages = [];
  const f = await coachingFixture(db, { mail: { configured: true, send: async m => messages.push(m) } });
  let vite, backend, browser;
  t.after(async () => { await browser?.close(); await vite?.close(); if (backend) await new Promise(resolve => { backend.close(resolve); backend.closeAllConnections(); }); await f.close(); });
  const d = await f.seed();
  backend = http.createServer(); await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + db + '/', import.meta.url)), optimizeDeps: { noDiscovery: true, include: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom', 'lucide-react', 'framer-motion', 'html-to-image', 'html2canvas', 'jspdf'] }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + backend.address().port, changeOrigin: true } } }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  f.config.corsOrigins = [base]; f.config.appPublicUrl = base; backend.on('request', f.app());
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 950 } }), page = await context.newPage(); page.setDefaultTimeout(45000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const identity = async actor => { await context.clearCookies(); if (actor) await context.addCookies([{ name: actor.user.roles.includes('student') ? 'kitss_student_session' : 'kitss_staff_session', value: actor.token, url: base, httpOnly: true, sameSite: 'Lax' }]); };
  await identity(d.admin);
  await t.test('main admin configures an explicit free registration policy through the UI', async () => {
    await goto('/admin/settings'); const panel = page.getByRole('heading', { name: 'Business policy configuration' }); await panel.waitFor();
    await page.getByLabel('Policy registration category').selectOption('study');
    await page.getByLabel('Policy status', { exact: true }).selectOption('active');
    await page.getByLabel('Fee required', { exact: true }).uncheck();
    await page.getByLabel('Approved amount (INR minor units)', { exact: true }).fill('0');
    await page.getByLabel('Owner approved privacy policy', { exact: true }).check();
    await page.getByLabel('Owner approved document requirements (including explicit none)', { exact: true }).check();
    await page.getByLabel('Policy change reason').fill('Synthetic browser policy only');
    const saved = page.waitForResponse(r => r.url().endsWith('/admin/business-policies') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save business policies', exact: true }).click(); const savedResponse = await saved; assert.equal(savedResponse.status(), 200, JSON.stringify(await savedResponse.json()));
    assert.equal((await f.service.business.settings()).value.registrations.study.amountMinor, 0);
  });
  await t.test('verified user submits saved registration and main admin reviews/activates it without changing identity roles', async () => {
    const row = await f.service.createApplication({ kind: 'study', applicant: { studentName: 'Browser applicant', dob: '1990-01-01' }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
    await identity(d.student); await goto('/register?type=study&application=' + row.id);
    await page.getByRole('heading', { name: 'Application status: draft' }).waitFor();
    await page.getByLabel('I confirm the application information and submit for admin review.').check();
    await page.getByRole('button', { name: 'Submit registration for review', exact: true }).click();
    await page.getByRole('heading', { name: 'Application status: submitted' }).waitFor();
    await identity(d.admin); await goto('/admin/registrations'); await page.getByRole('button', { name: new RegExp(row.reference) }).click();
    for (const status of ['pending_verification', 'under_review', 'approved', 'activated']) {
      await page.getByLabel('Registration decision reason').fill('Synthetic ' + status + ' evidence');
      const response = page.waitForResponse(r => r.url().endsWith('/status') && r.request().method() === 'PATCH');
      await page.getByRole('button', { name: status, exact: true }).click(); assert.equal((await response).status(), 200);
    }
    assert.equal((await f.models.RegistrationApplication.findById(row.id)).status, 'activated');
    assert.deepEqual((await f.models.User.findById(d.student.user._id)).roles, ['student']);
  });
  await t.test('main admin creates a default-deny invitation using grouped individual permission controls', async () => {
    await identity(d.admin); await goto('/admin/users'); await page.getByText('Staff invitations', { exact: true }).click();
    const email = randomUUID() + '@example.invalid';
    await page.getByLabel('Staff name', { exact: true }).fill('Browser subadmin'); await page.getByLabel('Staff email', { exact: true }).fill(email);
    const read = page.getByLabel('books.read', { exact: true }); await read.focus(); await page.keyboard.press('Space');
    assert.equal(await read.isChecked(), true); assert.equal(await page.getByLabel('books.create', { exact: true }).isChecked(), false);
    const response = page.waitForResponse(r => r.url().endsWith('/admin/users/invitations') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Invite / resend', exact: true }).click(); assert.equal((await response).status(), 201);
    const staff = await f.models.User.findOne({ emailNormalized: email }); assert.deepEqual(staff.permissions.toObject(), ['books.read']); assert.equal(staff.status, 'pending');
    assert.equal(messages.filter(m => m.to === email).length, 1);
  });
  await t.test('permission selector and staff controls reflow at all eight requested widths', async () => {
    for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      const checkbox = page.getByLabel('books.edit', { exact: true }); await checkbox.focus(); await page.keyboard.press('Space'); assert.equal(await checkbox.isChecked(), true); await page.keyboard.press('Space');
      const bounds = await checkbox.boundingBox(); assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1); assert.equal(overflow, false, 'Overflow at ' + width);
    }
  });
  await t.test('granular read-only staff navigation and direct protected route deny unauthorized actions', async () => {
    const staff = await f.fixtureUser(['admin'], ['books.read']); await identity(staff); await goto('/admin/books');
    await page.getByRole('heading', { name: 'Digital Books Management', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Add.*Book/ }).isEnabled(), false);
    await goto('/admin/users'); await page.getByText('You do not have permission to view this page.', { exact: true }).waitFor();
  });
  await t.test('zero-priced book and course open existing reader/lesson without provider traffic or paid orders', async () => {
    const book = await f.models.Book.findById(d.book.id), edited = await f.publishing.edit('books', d.book.id, { expectedRevision: book.revision, priceMinor: 0 }, d.admin.auth, f.ctx); await f.publishing.publish('books', d.book.id, { expectedRevision: edited.revision, publish: true }, d.admin.auth, f.ctx);
    let course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    const plan = await f.models.CoursePlan.findById(d.plan.id); await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision, priceMinor: 0 }, d.admin.auth, f.ctx);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, f.ctx);
    await identity(d.student); await goto('/books/' + d.book.id); await page.getByRole('button', { name: 'Read Free PDF', exact: true }).click();
    await page.waitForURL('**/books/' + d.book.id + '/read', { waitUntil: 'domcontentloaded' });
    assert.equal(await f.models.BookEntitlement.countDocuments({ userId: d.student.user._id, source: 'free' }), 1);
    await goto('/coaching/' + d.course.id); await page.getByRole('button', { name: /Open free course/ }).click();
    await page.getByText('Current access is active.', { exact: true }).waitFor();
    const response = await page.request.get(base + '/api/v1/coaching/courses/' + d.course.id + '/lessons/' + d.lesson.id); assert.equal(response.status(), 200);
    assert.equal(await f.models.Order.countDocuments(), 0);
    assert.equal(f.provider.creates, 0); assert.deepEqual(errors, []);
  });
  await t.test('expired paid course repurchase uses a new verified simulated order through existing Checkout UI', async () => {
    let course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    const plan = await f.models.CoursePlan.findById(d.plan.id); await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision, priceMinor: 12345 }, d.admin.auth, f.ctx);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, f.ctx);
    const actor = await f.fixtureUser(['student']);
    const first = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, actor.auth, f.ctx);
    const started = await f.service.startAttempt(first.id, { idempotencyKey: randomUUID() }, actor.auth, f.ctx);
    const oldPayment = f.provider.pay(started.providerOrderId); await f.service.observe(first.id, oldPayment.id, 'isolated-browser-fixture');
    await f.models.Enrollment.updateOne({ userId: actor.user._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    // Explicit test-only widget and presentation bridge. Provider records and
    // summaries remain simulated; real backend ownership/HMAC/capture checks run.
    await context.exposeFunction('__stage13SimulatedPayment', orderId => { const payment = f.provider.pay(orderId); return { razorpay_order_id: orderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(orderId + '|' + payment.id) }; });
    await context.addInitScript(() => { window.Razorpay = class { constructor(options) { this.options = options; } on() {} async open() { this.options.handler(await window.__stage13SimulatedPayment(this.options.order_id)); } }; });
    await page.route('**/api/v1/public/payment-config', route => route.fulfill({ json: { data: { available: true, paymentMode: 'test' } } }));
    await page.route('**/api/v1/orders/*/payment-attempts', async route => { const response = await route.fetch(), json = await response.json(); if (json.data?.checkout) json.data.checkout.simulated = false; return route.fulfill({ response, json }); });
    await identity(actor); await goto('/coaching/' + d.course.id);
    await page.getByText('Access expired. A new verified purchase is required for a new paid period.', { exact: true }).waitFor();
    await page.getByRole('button', { name: /^Purchase / }).click();
    await page.waitForURL('**/coaching/' + d.course.id + '?order=*', { waitUntil: 'domcontentloaded' });
    await page.getByText('Verified payment fulfilled. Refresh course to open lessons.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Refresh course access', exact: true }).click(); await page.getByText('Current access is active.', { exact: true }).waitFor();
    const rows = await f.models.Order.find({ userId: actor.user._id }); assert.equal(rows.length, 2); assert.ok(rows.every(r => r.status === 'captured' && r.simulated));
    const enrollment = await f.models.Enrollment.findOne({ userId: actor.user._id }); assert.equal(enrollment.purchaseHistory.length, 1); assert.notEqual(String(enrollment.orderId), first.id);
    await goto('/orders'); await page.getByRole('button', { name: 'View Receipt', exact: true }).first().click();
    await page.getByLabel('Reason', { exact: true }).fill('Synthetic browser refund review');
    await page.getByLabel('Supporting explanation (no sensitive document data)', { exact: true }).fill('Test evidence only');
    const requested = page.waitForResponse(r => r.url().endsWith('/refund-requests') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit refund request', exact: true }).click(); assert.equal((await requested).status(), 201);
    await identity(d.admin); await goto('/admin/refunds'); await page.getByLabel('Review reason', { exact: true }).fill('Approved review only, no execution');
    const reviewed = page.waitForResponse(r => r.url().endsWith('/refund-request') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Approve refund request (no execution)', exact: true }).click(); assert.equal((await reviewed).status(), 200);
    const refund = await f.models.Order.findOne({ userId: actor.user._id, 'refundRequest.status': 'approved' }); assert.equal(refund.status, 'captured'); assert.equal(refund.refundRequest.providerStatus, 'not_executed');
  });
  await t.test('exceptional request/issue UI respects the independent policy gate and produces no payment', async () => {
    await identity(d.admin); await goto('/admin/access-requests');
    await page.getByLabel('userId', { exact: true }).fill(d.other.user.publicId); await page.getByLabel('resourceId', { exact: true }).fill(d.book.id);
    await page.getByLabel('expiresAt', { exact: true }).fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await page.getByLabel('reason', { exact: true }).fill('Synthetic browser exceptional access');
    const requested = page.waitForResponse(r => r.url().endsWith('/admin/access-requests') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Request exceptional access', exact: true }).click(); assert.equal((await requested).status(), 201);
    await page.getByLabel('Review reason', { exact: true }).fill('Issue under approved synthetic policy');
    const denied = page.waitForResponse(r => /\/admin\/access-requests\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Issue exceptional grant', exact: true }).click(); assert.equal((await denied).status(), 409);
    const config = await f.service.business.settings(); await f.service.business.save({ value: { ...config.value, manualAccess: { approved: true, paidRevocationApproved: false, description: 'Synthetic browser test policy only' } }, expectedRevision: config.revision, reason: 'Explicit synthetic grant approval' }, d.admin.auth, f.ctx);
    const issued = page.waitForResponse(r => /\/admin\/access-requests\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Issue exceptional grant', exact: true }).click(); assert.equal((await issued).status(), 200);
    const grant = await f.models.BookEntitlement.findOne({ userId: d.other.user._id, bookId: d.book.id }); assert.equal(grant.source, 'manual'); assert.equal(grant.orderId, undefined);
    assert.equal(await f.models.Order.countDocuments({ userId: d.other.user._id }), 0);
  });
});
