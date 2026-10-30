import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';

const db = process.env.KITSS_STAGE13_BROWSER_DB, chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 13 real browser/HTTP/MongoDB policy, free content and keyboard granular staff UI (fake scanner/mail/payment only)', { skip: !db ? 'No KITSS_STAGE13_BROWSER_DB' : !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 600000 }, async t => {
  const messages = [];
  const f = await stage8Fixture(db, { mail: { configured: true, send: async m => messages.push(m) } });
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
    await page.getByLabel('Policy change reason', { exact: true }).fill('Synthetic browser policy only');
    const saved = page.waitForResponse(r => r.url().endsWith('/admin/business-policies') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save business policies', exact: true }).click(); const savedResponse = await saved; assert.equal(savedResponse.status(), 200, JSON.stringify(await savedResponse.json()));
    assert.equal((await f.service.business.settings()).value.registrations.study.amountMinor, 0);
  });
  await t.test('main admin configures refund/franchise/tax metadata without enabling operational gates', async () => {
    await page.getByLabel('Owner approved refund policy', { exact: true }).check();
    await page.getByLabel('refund version', { exact: true }).fill('synthetic-browser-v1');
    await page.getByLabel('refund effectiveFrom (UTC ISO date)', { exact: true }).fill('2020-01-01T00:00:00Z');
    await page.getByLabel('Enable refund requests', { exact: true }).check();
    await page.getByLabel('Enable course_plan refund review', { exact: true }).check();
    await page.getByLabel('course_plan allowed reason categories (one per line)', { exact: true }).fill('technical_failure');
    // Franchise fees moved to the separate Franchise Policy form (covered by franchise-workflow tests).
    await page.getByText('Franchise eligibility, documents, agreements and fees are managed in Franchise Policy above.', { exact: true }).waitFor();
    await page.getByLabel('Policy change reason', { exact: true }).fill('Synthetic financial configuration only');
    const response = page.waitForResponse(r => r.url().endsWith('/admin/business-policies') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save business policies', exact: true }).click(); assert.equal((await response).status(), 200);
    assert.equal((await f.service.business.settings()).value.refunds.courseWindowDays, 7);
    assert.equal((await f.service.business.franchiseFees()).affiliationState, 'blocked_pending_policy');
    for (const width of [320,375,390,414,768,1024,1280,1440]) {
      await page.setViewportSize({ width, height: 950 });
      await page.getByLabel('Course refund window (days)', { exact: true }).focus();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Financial policy overflow at ' + width);
    }
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
  await t.test('result draft review queue, main-admin approval and source gate through browser', async () => {
    const issuer = await f.models.ResultIssuer.create({ key: randomUUID(), type: 'school', name: 'Synthetic browser', fullName: 'Synthetic browser issuer', status: 'active', source: { authorizationReference: 'SYNTHETIC_ISOLATED_ONLY' } });
    const exam = await f.models.Exam.create({ issuerId: issuer._id, key: randomUUID(), title: 'Synthetic exam', year: 2026, status: 'published' });
    const record = await f.models.ResultRecord.create({ examId: exam._id, rollNormalized: 'SYNTHETIC-BROWSER', userId: d.student.user._id, revision: 1, source: { checksum: 'synthetic-source-only' }, __v: 0 });
    await identity(d.admin); await goto('/admin/results');
    await page.getByRole('button', { name: 'records', exact: true }).click();
    await page.getByRole('button', { name: 'Review', exact: true }).click();
    await page.getByLabel('Result action reason').fill('Synthetic reviewed source');
    await page.getByRole('button', { name: 'Submit for main-admin review', exact: true }).click();
    await page.getByRole('button', { name: 'Approve official result revision', exact: true }).click();
    await page.getByRole('button', { name: 'Approve official result revision', exact: true }).waitFor({ state: 'detached' });
    assert.equal((await f.models.ResultRecord.findById(record._id)).review.status, 'approved');
    await page.getByRole('button', { name: 'Request publication', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Official result publication is disabled' }).waitFor();
    for (const width of [320,375,390,414,768,1024,1280,1440]) { await page.setViewportSize({ width, height: 950 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'Results overflow at ' + width); }
    assert.equal((await f.models.ResultRecord.findById(record._id)).status, 'draft');
  });
  await t.test('main admin creates a default-deny invitation using grouped individual permission controls', async () => {
    await identity(d.admin); await goto('/admin/staff'); await page.getByRole('heading', { name: 'Staff invitations', exact: true }).waitFor();
    const email = randomUUID() + '@example.invalid';
    await page.getByLabel('Staff name', { exact: true }).fill('Browser subadmin'); await page.getByLabel('Staff email', { exact: true }).fill(email);
    await page.getByLabel('Permission preset', { exact: true }).selectOption('Content Manager');
    assert.equal(await page.getByLabel('books.create', { exact: true }).isChecked(), true);
    await page.getByLabel('Permission preset', { exact: true }).selectOption('Support Manager');
    assert.equal(await page.getByLabel('books.create', { exact: true }).isChecked(), false);
    await page.getByLabel('commerce.read', { exact: true }).uncheck();
    await page.getByLabel('registrations.read', { exact: true }).uncheck();
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
    await page.getByRole('heading', { name: 'Digital Books', exact: true }).waitFor();
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
    await page.getByText('Your course access is active.', { exact: true }).waitFor();
    const response = await page.request.get(base + '/api/v1/coaching/courses/' + d.course.id + '/lessons/' + d.lesson.id); assert.equal(response.status(), 200);
    assert.equal(await f.models.Order.countDocuments(), 0);
    assert.equal(f.provider.creates, 0); assert.deepEqual(errors, []);
  });
  { const row = await f.service.business.settings(); await f.service.business.save({ value: { ...row.value, refunds: { approved: true, version: 'synthetic-v1', effectiveFrom: '2020-01-01T00:00:00Z', enabled: true, courseWindowDays: 7, outsideWindow: 'deny', evidenceRequired: false, categories: { course_plan: { enabled: true, reasons: ['technical_failure'] } }, accessAfterConfirmedRefund: 'separate_review' } }, expectedRevision: row.revision, reason: 'Synthetic refund configuration' }, d.admin.auth, f.ctx); }
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
    await page.getByText('Payment confirmed and course access is ready. Refresh the course to open lessons.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Refresh course access', exact: true }).click(); await page.getByText('Your course access is active.', { exact: true }).waitFor();
    const rows = await f.models.Order.find({ userId: actor.user._id }); assert.equal(rows.length, 2); assert.ok(rows.every(r => r.status === 'captured' && r.simulated));
    const enrollment = await f.models.Enrollment.findOne({ userId: actor.user._id }); assert.equal(enrollment.purchaseHistory.length, 1); assert.notEqual(String(enrollment.orderId), first.id);
    await goto('/orders'); await page.getByRole('button', { name: 'View Receipt', exact: true }).first().click();
    await page.getByLabel('Refund reason category', { exact: true }).selectOption('technical_failure');
    await page.getByLabel('Reason', { exact: true }).fill('Synthetic browser refund review');
    await page.getByLabel('Supporting explanation (no sensitive document data)', { exact: true }).fill('Test evidence only');
    const requested = page.waitForResponse(r => r.url().endsWith('/refund-requests') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit refund request', exact: true }).click(); assert.equal((await requested).status(), 201);
    await identity(d.admin); await goto('/admin/refunds'); await page.getByLabel('Review reason', { exact: true }).fill('Approved review only, no execution');
    const reviewed = page.waitForResponse(r => r.url().endsWith('/refund-request') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Approve request (refund not sent)', exact: true }).click(); assert.equal((await reviewed).status(), 200);
    const refund = await f.models.Order.findOne({ userId: actor.user._id, 'refundRequest.status': 'approved' }); assert.equal(refund.status, 'captured'); assert.equal(refund.refundRequest.providerStatus, 'not_executed');
  });
  await t.test('exceptional request/issue UI respects the independent policy gate and produces no payment', async () => {
    await identity(d.admin); await goto('/admin/access-requests');
    await page.getByLabel('User reference', { exact: true }).fill(d.other.user.publicId); await page.getByLabel('Book or course reference', { exact: true }).fill(d.book.id);
    await page.getByLabel('Access ends', { exact: true }).fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await page.getByLabel('Reason', { exact: true }).fill('Synthetic browser exceptional access');
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
