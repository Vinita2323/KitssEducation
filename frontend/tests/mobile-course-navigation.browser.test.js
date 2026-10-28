import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('mobile course browsing and personal courses (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen(); const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 400, height: 844 } }); page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  let signedIn = false; const errors = [], personalRequests = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length);
    let data = [], meta = { page: 1, total: 0, totalPages: 1, unreadCount: 0 };
    if (path === '/auth/me') {
      if (!signedIn) return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' } } });
      data = { user: { id: 'STUDENT', name: 'Student Test', email: 'student@example.invalid', roles: ['student'], permissions: [], status: 'active' } };
    } else if (path === '/coaching/facets') data = { categories: [], boards: [], classes: [], subjects: [], languages: [], states: [] };
    else if (path === '/public/content/home') data = { sections: [] };
    else if (path === '/public/settings') data = {};
    else if (path === '/me/enrollments') { personalRequests.push(path); if (!signedIn) return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' } } }); }
    return route.fulfill({ json: { data, meta, requestId: 'navigation-test' } });
  });
  const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const bottom = () => page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
  await t.test('guest Courses opens the public catalogue with six bottom links and no enrollment request', async () => {
    await go('/home'); await bottom().waitFor();
    assert.equal(await bottom().getByRole('link').count(), 6);
    await bottom().getByRole('link', { name: 'Courses', exact: true }).click(); await page.waitForURL('**/coaching');
    await page.getByPlaceholder('Search by title, subject (Physics, Math), board...').waitFor();
    assert.equal(await bottom().getByRole('link', { name: 'Courses', exact: true }).getAttribute('aria-current'), 'page');
    assert.equal(personalRequests.length, 0);
    await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Student navigation' });
    assert.equal(await drawer.getByRole('button', { name: 'My courses', exact: true }).count(), 0);
    await page.keyboard.press('Escape');
  });
  await t.test('personal routes keep guest login protection, including the old subscriptions URL', async () => {
    for (const path of ['/coaching/my-courses', '/subscriptions', '/coaching/example/dashboard', '/coaching/example/subscribe']) {
      await go(path); await page.waitForURL('**/login');
    }
    assert.equal(personalRequests.length, 0);
  });
  await t.test('signed-in users can reach My courses from catalogue, profile and drawer without extra icons', async () => {
    signedIn = true; await go('/coaching');
    await page.getByRole('link', { name: 'My courses', exact: true }).click(); await page.waitForURL('**/coaching/my-courses');
    await page.getByRole('heading', { name: 'My Courses', exact: true }).waitFor();
    await go('/profile');
    await page.getByRole('link', { name: /My courses View & renew coaching/i }).click(); await page.waitForURL('**/coaching/my-courses');
    await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
    await page.getByRole('dialog', { name: 'Student navigation' }).getByRole('button', { name: 'My courses', exact: true }).click();
    await page.getByRole('dialog', { name: 'Student navigation' }).waitFor({ state: 'detached' });
    assert.equal(new URL(page.url()).pathname, '/coaching/my-courses');
    assert.equal(await bottom().getByRole('link').count(), 6);
    assert.ok(personalRequests.length > 0);
    for (const width of [400, 320]) { await page.setViewportSize({ width, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  });
  assert.deepEqual(errors, []);
});
