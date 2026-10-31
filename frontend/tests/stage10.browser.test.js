import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';
import { hashPassword } from '../../backend/src/modules/auth/security.js';
const name = process.env.KITSS_STAGE10_BROWSER_DB;
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 10 admin-to-user persisted workflows and responsive shared navigation', { skip: !name ? 'No isolated Stage 10 database' : !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 600000 }, async t => {
  const focus = process.env.KITSS_STAGE10_BROWSER_FOCUS;
  const check = (title, run) => t.test(title, { skip: focus && !title.includes(focus) ? 'Excluded by explicit focused rerun' : false }, run);
  const f = await stage8Fixture(name); let backend, vite, browser;
  t.after(async () => { try { await browser?.close(); await vite?.close(); if (backend) await new Promise(r => { backend.close(r); backend.closeAllConnections(); }); } finally { await f.close(); } });
  const d = await f.seed(), admin = d.admin, target = d.other, student = d.student;
  const staff = await f.fixtureUser(['admin'], ['accounts.read']);
  await f.models.User.updateOne({ _id: target.user._id }, { $set: { name: 'STAGE10 ACCOUNT TARGET' } });
  target.user.name = 'STAGE10 ACCOUNT TARGET';
  await f.models.User.updateOne({ _id: staff.user._id }, { $set: { name: 'STAGE10 ORDINARY STAFF', passwordHash: await hashPassword('SyntheticPassword123!') } });
  const order = await f.service.create({ product: { kind: 'book', id: d.book.id }, idempotencyKey: randomUUID() }, student.auth, f.ctx);
  await f.service.startAttempt(order.id, { idempotencyKey: randomUUID() }, student.auth, f.ctx);
  const stored = await f.models.Order.findById(order.id), payment = f.provider.pay(stored.providerOrderId);
  await f.service.observe(stored._id, payment.id, 'isolated_stage10_fixture', f.ctx);
  for (let i = 0; i < 21; i++) await f.models.Order.create({ reference: 'STAGE10-PAGING-' + i, userId: student.user._id, product: { kind: 'book', id: new f.connection.base.Types.ObjectId(), title: 'SYNTHETIC PAGING RECORD ' + i }, amountMinor: 100, currency: 'INR', provider: 'fake', simulated: true, paymentMode: 'test', idempotencyKey: randomUUID() });
  await f.models.Job.create({ key: randomUUID(), kind: 'result_import', state: 'dead', attempts: 2, token: 'PRIVATE_BROWSER_LEASE', resultSummary: { candidate: 'PRIVATE_BROWSER_PAYLOAD' } });
  backend = http.createServer(); await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + name + '/', import.meta.url)), optimizeDeps: { noDiscovery: true, include: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom', 'lucide-react', 'framer-motion', 'html-to-image', 'html2canvas', 'jspdf'] }, server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + backend.address().port, changeOrigin: true } } }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  f.config.corsOrigins = [base]; f.config.appPublicUrl = base; backend.on('request', f.app());
  browser = await chromium.launch({ executablePath: chrome, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } }), page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = [], apiFailures = []; page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().includes('/api/v1/') && r.status() >= 500) apiFailures.push({ path: new URL(r.url()).pathname, status: r.status() }); });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url)); mkdirSync(artifacts, { recursive: true });
  t.afterEach(async child => { if (child.passed === false) await page.screenshot({ path: artifacts + 'stage10-failure-' + child.name.replace(/[^a-z0-9]/gi, '-') + '.png', fullPage: true }); });
  const goto = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const identity = async actor => { await context.clearCookies(); await context.addCookies([{ name: actor.user.roles.includes('student') ? 'kitss_student_session' : 'kitss_staff_session', value: actor.token, url: base, httpOnly: true, sameSite: 'Lax' }]); };
  const searchAccount = async value => { await goto('/admin/users'); await page.getByLabel('Search accounts').fill(value); await page.getByRole('button', { name: 'Search accounts', exact: true }).click(); await page.getByRole('button').filter({ hasText: value }).click(); await page.getByLabel('Account change reason').waitFor(); };
  await check('admin suspension/restore persists and revoked student session remains denied', async () => {
    await identity(admin); await searchAccount(target.user.name);
    await page.getByLabel('Account change reason').fill('STAGE10 reviewed suspension');
    const response = page.waitForResponse(r => r.url().endsWith('/status') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Suspend account', exact: true }).click(); assert.equal((await response).status(), 200);
    await page.getByText('Account updated. Previous sessions are invalidated.', { exact: true }).waitFor();
    assert.equal((await f.models.User.findById(target.user._id)).status, 'suspended');
    await identity(target); await goto('/profile'); await page.waitForURL('**/login*');
    assert.equal(await page.evaluate(async () => (await fetch('/api/v1/auth/me')).status), 401);
    await identity(admin); await searchAccount(target.user.name);
    await page.getByLabel('Account change reason').fill('STAGE10 reviewed restoration');
    const restored = page.waitForResponse(r => r.url().endsWith('/status') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Restore account', exact: true }).click(); assert.equal((await restored).status(), 200);
    await goto('/admin/audit-logs'); await page.getByLabel('Audit resource').fill(target.user.publicId); await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await page.getByText('Reason: STAGE10 reviewed suspension', { exact: true }).waitFor(); await page.getByText('Reason: STAGE10 reviewed restoration', { exact: true }).waitFor();
  });
  await check('super-admin permission edit is enforced on a newly authenticated staff session', async () => {
    await identity(admin); await searchAccount('STAGE10 ORDINARY STAFF');
    await page.getByRole('checkbox', { name: 'audit.read', exact: true }).check(); await page.getByLabel('Account change reason').fill('STAGE10 safe staff visibility');
    const response = page.waitForResponse(r => r.url().endsWith('/roles') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save staff permissions', exact: true }).click(); assert.equal((await response).status(), 200);
    assert.equal(await f.auth.authenticate(staff.token, 'admin'), null);
    const signedIn = await f.auth.login({ identifier: staff.user.emailNormalized, password: 'SyntheticPassword123!', kind: 'admin' }, f.ctx);
    await identity(signedIn); await goto('/admin/audit-logs'); await page.getByRole('heading', { name: 'Audit logs', exact: true }).waitFor();
    assert.equal(await page.evaluate(async () => (await fetch('/api/v1/admin/jobs')).status), 403);
    assert.equal(await page.getByRole('link', { name: 'Job monitoring', exact: true }).count(), 0);
  });
  await check('CMS draft/publication and admin card edits reach actual category cards', async () => {
    await identity(admin); await goto('/admin/content'); await page.getByRole('button', { name: 'Add Content', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Content editor' });
    await editor.getByLabel('Content key').selectOption('categories'); await editor.getByLabel('Section 1 heading').fill('STAGE10 CATEGORY HEADING');
    await editor.getByLabel('Cards (one heading | body | optional link key per line)').fill('STAGE10 COURSE CARD | Approved synthetic course navigation | coaching\nSTAGE10 RESULT CARD | Source policy still required | results');
    await editor.getByRole('button', { name: 'Save Content Draft', exact: true }).click(); await editor.waitFor({ state: 'detached' });
    assert.equal((await f.models.PageContent.findOne({ key: 'categories' })).status, 'draft');
    await identity(student); await goto('/categories'); await page.getByRole('heading', { name: 'Explore Categories', exact: true }).waitFor();
    assert.equal(await page.getByText('STAGE10 COURSE CARD', { exact: true }).count(), 0);
    await identity(admin); await goto('/admin/content'); const row = page.getByRole('row').filter({ hasText: 'categories' });
    await row.getByRole('button', { name: 'Publish', exact: true }).click(); await row.getByRole('cell', { name: 'published', exact: true }).waitFor();
    await identity(student); await goto('/categories'); await page.getByRole('heading', { name: 'STAGE10 COURSE CARD', exact: true }).last().waitFor();
    await page.getByPlaceholder(/Search/i).fill('STAGE10 COURSE CARD');
    await page.getByRole('link').filter({ hasText: 'STAGE10 COURSE CARD' }).click(); await page.waitForURL('**/coaching');
    assert.equal((await f.models.PageContent.findOne({ key: 'categories' })).publishedSnapshot.sections[0].items[0].linkKey, 'coaching');
  });
  const longBrand = 'STAGE10' + 'LongBrand'.repeat(12) + ' Education';
  await check('all four registration draft UIs recover fields and support persisted admin notes without activation', async () => {
    const drafts = [];
    for (const [kind, path, field] of [['study', '/register?type=study', 'studentName'], ['tuition', '/register?type=tuition', 'studentName'], ['teacher', '/register?type=teacher', 'fullName'], ['coaching-profile', '/coaching/register', 'name']]) {
      await identity(student); await goto(path);
      const input = kind === 'coaching-profile' ? page.getByPlaceholder('e.g. Rohan Sharma', { exact: true }) : page.locator('input[name="' + field + '"]'); await input.fill('STAGE10 ' + kind + ' APPLICANT');
      await page.getByRole('button', { name: 'Save application draft', exact: true }).click(); await page.getByText(/Application reference:/).waitFor();
      const id = new URL(page.url()).searchParams.get('application'); assert.ok(id);
      await page.reload({ waitUntil: 'domcontentloaded' }); await page.getByRole('button', { name: 'Save changes', exact: true }).waitFor();
      assert.equal(await input.inputValue(), 'STAGE10 ' + kind + ' APPLICANT');
      const row = await f.models.RegistrationApplication.findById(id); assert.equal(row.status, 'draft'); assert.equal(row.paymentState, 'blocked');
      drafts.push({ id, reference: row.reference, field, kind });
    }
    await identity(admin); await goto('/admin/registrations');
    for (const draft of drafts) {
      await page.getByRole('button').filter({ hasText: draft.reference }).click();
      await page.getByText(draft.field + ': STAGE10 ' + draft.kind + ' APPLICANT', { exact: true }).waitFor();
      await page.getByLabel('Registration review note').fill('STAGE10 reviewed safe draft ' + draft.kind);
      const response = page.waitForResponse(r => r.url().endsWith('/notes') && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Add review note', exact: true }).click(); assert.equal((await response).status(), 200);
      await page.getByText('STAGE10 reviewed safe draft ' + draft.kind, { exact: true }).waitFor();
      assert.equal((await f.models.RegistrationApplication.findById(draft.id)).notes.length, 1);
    }
  });
  await check('public settings update the real header; job/book/order administration is usable', async () => {
    await identity(admin); await goto('/admin/settings'); await page.getByLabel('Setting name').fill(longBrand);
    await page.getByRole('button', { name: 'Save Public Settings', exact: true }).click(); await page.getByText('Public settings saved.', { exact: true }).waitFor();
    await page.getByLabel('Setting group').selectOption('footer');
    await page.getByLabel('Footer links', { exact: true }).fill('internal | /about\nexternal | https://example.invalid/approved-reference');
    const footerSaved = page.waitForResponse(r => r.url().endsWith('/admin/settings/footer') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save Public Settings', exact: true }).click(); assert.equal((await footerSaved).status(), 200);
    await goto('/admin/operations'); await page.getByLabel('Job state').selectOption('dead'); await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await page.getByText('result_import / dead', { exact: true }).waitFor(); assert.doesNotMatch(await page.locator('body').innerText(), /PRIVATE_BROWSER/);
    await goto('/admin/enrollments'); await page.getByRole('button', { name: 'Books', exact: true }).click(); await page.getByRole('heading', { name: 'Book access review', exact: true }).waitFor();
    await page.getByText(/Payment verified/).first().waitFor();
    await goto('/admin/orders'); await page.getByText(/Page 1 of 2/).waitFor(); await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.getByText(/Page 2 of 2/).waitFor();
    await page.getByRole('button', { name: 'Previous', exact: true }).click(); await page.getByText(/Page 1 of 2/).waitFor();
    await identity(student); await goto('/home'); await page.locator('header').getByText('Education', { exact: true }).waitFor(); assert.ok((await page.locator('header').innerText()).includes('STAGE10LongBrand'));
    await page.getByRole('navigation', { name: 'Published footer links' }).getByRole('link', { name: '/about', exact: true }).click(); await page.waitForURL('**/about');
  });
  for (const width of [320, 375, 390, 414, 768, 1024, 1440]) await check('new account/operations/category navigation at ' + width + 'px', async () => {
    await page.setViewportSize({ width, height: 950 }); await identity(admin); await goto('/admin/users'); await page.getByLabel('Search accounts').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width < 768) { await page.getByRole('button', { name: 'Open admin navigation', exact: true }).click(); await page.getByRole('link', { name: 'Job monitoring', exact: true }).click(); await page.waitForURL('**/admin/operations'); }
    await identity(student); await goto('/categories'); await page.getByRole('heading', { name: 'STAGE10 COURSE CARD', exact: true }).last().waitFor();
    await page.waitForFunction(name => document.querySelector('a[aria-label="User Profile"]')?.title === name, student.user.name);
    for (const label of ['Notifications', 'User Profile']) { const bounds = await page.locator('header').getByRole('link', { name: label, exact: true }).boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width, label + ' clipped at ' + width); }
    if (width < 1280) { await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click(); await page.getByRole('button', { name: 'Settings', exact: true }).click(); await page.waitForURL('**/settings'); }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if ([320, 1440].includes(width)) await page.screenshot({ path: artifacts + 'stage10-navigation-' + width + '.png', fullPage: true });
  });
  assert.deepEqual(errors, []); assert.deepEqual(apiFailures, []);
});
