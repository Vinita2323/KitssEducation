import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
  if (process.env.KITSS_AUTH_BROWSER_VIEWPORT && process.env.KITSS_AUTH_BROWSER_VIEWPORT !== name) continue;
  test(`auth browser interactions and route guards (${name}; mocked HTTP only)`, { skip: !existsSync(executablePath) ? 'No Chrome available; set CHROME_PATH' : false, timeout: 300000 }, async t => {
    const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
    await server.listen();
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    const browser = await chromium.launch({ executablePath, headless: true });
    t.after(async () => { await browser.close(); await server.close(); });
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    // Cold Vite compilation on the local QA host may exceed one minute. Keep
    // the actual redirect, permission and form assertions unchanged.
    const goto = url => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    t.afterEach(async child => { if (child.passed === false) { mkdirSync('frontend/test-artifacts', { recursive:true }); await page.screenshot({path:'frontend/test-artifacts/stage8-auth-failure-'+name+'.png',fullPage:true}); } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let user = null, conflict = false;
    const writes = [];
    const identity = { id: 'KITSS-TEST', name: 'Test Student', email: 'student@example.invalid', roles: ['student'], permissions: [], status: 'active' };
    await page.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== base) return route.abort();
      if (!url.pathname.startsWith('/api/v1/')) return route.continue();
      const path = url.pathname.slice('/api/v1'.length);
      const input = request.method() === 'GET' ? null : request.postDataJSON();
      if (input) writes.push({ path, input, csrf: request.headers()['x-csrf-token'] });
      let status = 200, data = {};
      if (path === '/auth/csrf') data = { csrfToken: 'browser-test-csrf' };
      else if (path === '/me/notifications') return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({data:[],meta:{page:1,totalPages:1,total:0,unreadCount:0},requestId:'browser-test'})});
      else if (path === '/auth/me') { if (user) data = { user }; else status = 401; }
      else if (path === '/auth/login') {
        if (conflict) { status = 409; data = { code: 'DEVICE_CONFLICT', challengeId: 'transfer-challenge', proof: 'transfer-proof' }; }
        else { user = input.kind === 'admin' ? { ...identity, name: 'Test Staff', roles: ['admin'], permissions: ['institutions.read'] } : identity; data = { user }; }
      } else if (path === '/auth/session/transfer') { assert.equal(input.confirmed, true); user = identity; data = { user }; }
      else if (path === '/auth/logout') { user = null; return route.fulfill({ status: 204 }); }
      else if (path === '/auth/accounts' || path === '/auth/email/resend') { status = 202; data = { challengeId: 'verify-challenge', message: 'Check email if eligible' }; }
      else if (path === '/auth/invitations/accept') { assert.equal(input.token, 'invite-proof'); data = { challengeId: 'verify-challenge', message: 'Verify email before signing in' }; }
      else if (path === '/admin/users/invitations') { status = 201; data = { id: 'STAFF0123456789ABCDEF', message: 'Invitation submitted to SMTP' }; }
      else if (path === '/admin/users/invitations/STAFF0123456789ABCDEF') data = { message: 'Invitation revoked' };
      else if (path === '/auth/activate') { assert.equal(input.challengeId, 'verify-challenge'); data = { user: identity, message: 'Email verified' }; }
      else if (path === '/auth/password/forgot') { status = 202; data = { challengeId: 'reset-challenge', message: 'If eligible, check email' }; }
      else if (path === '/auth/password/reset') { assert.equal(input.challengeId, 'reset-challenge'); data = { message: 'Password reset' }; }
      else { status = 404; }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 401 ? { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' }, requestId: 'browser-test' } : { data, requestId: 'browser-test' }) });
    });
    const login = async (staff = false) => {
      await page.locator('input[placeholder="e.g. KITSS20261084"]').fill('student@example.invalid');
      await page.locator('input[placeholder="Enter your password"]').fill('a long test password');
      if (staff) await page.getByLabel('Staff sign in').check();
      const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/v1/auth/login' && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      await response;
    };
    await t.test('guest routes redirect; login fields have no credential defaults', async () => {
      await goto(`${base}/admin/books`);
      await page.waitForURL('**/login');
      assert.equal(await page.locator('input[placeholder="Enter your password"]').inputValue(), '');
      assert.equal(await page.getByText('Digital Books', { exact: true }).count(), 0);
    });
    await t.test('account creation -> OTP verification, no authenticated session', async () => {
      await goto(`${base}/account/create`);
      await page.getByLabel('Full name').fill('Test Student');
      await page.getByLabel('Email', { exact: true }).fill('student@example.invalid');
      await page.getByLabel('Password', { exact: true }).fill('a long test password');
      await page.getByRole('button', { name: 'Create account' }).click();
      await page.getByLabel('Email OTP').fill('654321');
      await page.getByRole('button', { name: 'Verify email', exact: true }).click();
      await page.waitForURL('**/login'); assert.equal(user, null);
    });
    await t.test('recovery binds server challenge to OTP and new password', async () => {
      await goto(`${base}/forgot-password`);
      await page.locator('input[type="email"]').fill('student@example.invalid');
      await page.getByRole('button', { name: 'Send Reset OTP' }).click();
      await page.waitForURL('**/reset-password');
      const otp = page.locator('input[maxlength="6"]'); assert.equal(await otp.inputValue(), '');
      await otp.fill('654321');
      await page.locator('input[type="password"]').nth(0).fill('another long password');
      await page.locator('input[type="password"]').nth(1).fill('another long password');
      await page.getByRole('button', { name: 'Update Password' }).click();
      await page.waitForURL('**/login');
    });
    await t.test('staff acceptance removes fragment and requires OTP before login', async () => {
      await goto(`${base}/staff/accept#invite-challenge.invite-proof`);
      await page.getByLabel('Password', { exact: true }).fill('a long invitation password');
      await page.getByRole('button', { name: 'Set password' }).click();
      await page.getByLabel('Email OTP').fill('654321');
      assert.equal(new URL(page.url()).hash, ''); assert.equal(user, null);
      await page.getByRole('button', { name: 'Verify email', exact: true }).click();
      await page.waitForURL('**/login');
    });
    await t.test('explicit session transfer, protected route and expiry clear identity', async () => {
      conflict = true;
      await login();
      await page.getByRole('dialog').waitFor(); assert.equal(user, null);
      await page.getByRole('button', { name: 'Confirm session transfer' }).click();
      await page.waitForURL('**/home');
      await goto(`${base}/profile`); await page.getByText('Test Student', { exact: true }).first().waitFor();
      user = null; await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await page.waitForURL('**/login'); conflict = false;
    });
    await t.test('staff guards/nav honor permissions; preview writes disabled; logout', async () => {
      await login(true);
      await page.waitForURL('**/profile');
      await goto(`${base}/admin/universities`);
      await page.getByRole('heading', { name: 'University Management' }).waitFor();
      assert.equal(await page.locator('a[href="/admin/books"]').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Add University', exact: true }).isDisabled(), true);
      assert.equal(await page.getByText('Test Staff', { exact: true }).count(), viewport.width >= 768 ? 1 : 1);
      await goto(`${base}/admin/books`);
      await page.getByRole('alert').filter({ hasText: 'You do not have permission' }).waitFor();
      await goto(`${base}/admin/universities`);
      await page.getByRole('button', { name: 'Sign out' }).click();
      await page.waitForURL('**/login'); assert.equal(user, null);
      assert.equal(await page.evaluate(() => localStorage.getItem('kitss_auth_token')), null);
    });
    await t.test('super-admin invitation form invokes real contracts outside preview controls', async () => {
      user = { ...identity, roles: ['super_admin'], permissions: ['institutions.read', 'accounts.roles.manage'] };
      await goto(`${base}/admin/universities`);
      await page.getByText('Staff invitations', { exact: true }).click();
      await page.getByLabel('Staff name', { exact: true }).fill('Invited Staff');
      await page.getByLabel('Staff email', { exact: true }).fill('invited@example.invalid');
      await page.getByRole('button', { name: 'Invite / resend' }).click();
      await page.getByRole('status').filter({ hasText: 'Invitation submitted to SMTP' }).waitFor();
      await page.getByRole('button', { name: 'Revoke invitation' }).click();
      await page.getByRole('status').filter({ hasText: 'Invitation revoked' }).waitFor();
      await page.getByRole('button', { name: 'Sign out' }).click();
      await page.waitForURL('**/login');
    });
    assert.equal(writes.every(write => write.csrf === 'browser-test-csrf'), true);
    assert.deepEqual(errors, []);
    await goto(`${base}/login`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    mkdirSync(fileURLToPath(new URL('../test-artifacts/', import.meta.url)), { recursive: true });
    await page.screenshot({ path: fileURLToPath(new URL(`../test-artifacts/login-${name}.png`, import.meta.url)), fullPage: true });
  });
}
