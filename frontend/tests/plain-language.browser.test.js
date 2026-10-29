import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('plain-language notices keep existing restrictions and filter values (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen(); const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  const errors = [], reads = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length); reads.push(path + url.search);
    let data = [], meta = { page: 1, total: 0, totalPages: 1 };
    if (path === '/auth/me') data = { user: { id: 'reviewer', name: 'Reviewer', roles: ['admin'], status: 'active', emailVerified: true, permissions: ['commerce.read', 'media.read', 'content.read'] } };
    else if (path === '/admin/media') return route.fulfill({ json: { data: [], meta, scannerConfigured: false } });
    else if (path === '/admin/orders') data = [];
    else if (path === '/public/franchise-fees') data = { state: 'configuration_required' };
    else if (path === '/public/franchise-policy') data = { available: false, message: 'Configuration required: franchise applications are blocked.' };
    else if (path === '/auth/csrf') data = { csrfToken: 'mock' };
    return route.fulfill({ json: { data, meta, requestId: 'copy-test' } });
  });
  const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await t.test('media warns about security checks without exposing quarantine terminology', async () => {
    await go('/admin/media');
    await page.getByText(/File security checks are unavailable/).waitFor();
    const selector = page.getByLabel('Media status', { exact: true });
    const request = page.waitForRequest(r => r.url().includes('/admin/media?') && r.url().includes('status=quarantined'));
    await selector.selectOption('quarantined'); await request;
    assert.equal(await selector.inputValue(), 'quarantined');
    assert.equal(await selector.locator('option[value="quarantined"]').textContent(), 'Awaiting security check');
    assert.equal(await page.getByRole('button', { name: 'Upload Media file', exact: true }).count(), 0, 'No upload rights added');
  });
  await t.test('payment filters keep raw query values and show Test Mode', async () => {
    await go('/admin/orders');
    await page.getByText(/Test Mode only/).waitFor();
    await page.getByLabel('Payment status filter', { exact: true }).selectOption('captured');
    await page.getByLabel('Payment check filter', { exact: true }).selectOption('dead');
    await page.waitForFunction(() => new URLSearchParams(location.search).size === 0);
    assert.equal(await page.getByLabel('Payment status filter', { exact: true }).inputValue(), 'captured');
    assert.equal(await page.getByLabel('Payment check filter', { exact: true }).inputValue(), 'dead');
    assert.equal(await page.getByLabel('Payment status filter', { exact: true }).locator('option[value="captured"]').textContent(), 'Payment confirmed');
    assert.ok(reads.some(url => url.includes('status=captured')));
  });
  await t.test('application closure stays truthful on a mobile screen', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/register?type=franchise');
    await page.getByText('Not available yet. franchise applications are unavailable.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Submit application', exact: true }).count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  assert.deepEqual(errors, []);
});
