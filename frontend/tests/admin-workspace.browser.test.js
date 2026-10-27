import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';
import { imageBytes } from '../../backend/tests/publishing-fixture.js';

const database = process.env.KITSS_ADMIN_UI_BROWSER_DB;
test('admin field help, native upload and draft persistence (synthetic local fixtures)', { skip: !database ? 'No isolated admin UI database configured' : false, timeout: 300000 }, async t => {
  const f = await stage8Fixture(database);
  let backend, vite, browser;
  t.after(async () => { await browser?.close(); await vite?.close(); if (backend) await new Promise(resolve => { backend.close(resolve); backend.closeAllConnections(); }); await f.close(); });
  const admin = await f.fixtureUser();
  backend = http.createServer(); await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + backend.address().port, changeOrigin: true } } }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  f.config.corsOrigins = [base]; f.config.appPublicUrl = base; backend.on('request', f.app());
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addCookies([{ name: 'kitss_staff_session', value: admin.token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page = await context.newPage(); page.setDefaultTimeout(45000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url)); mkdirSync(artifacts, { recursive: true });
  const go = async path => { await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 }); await page.locator('#admin-main h1').first().waitFor(); };
  const help = async () => assert.deepEqual(await page.locator('#admin-main').evaluate(main => [...main.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(input => input.getClientRects().length).filter(input => (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean).some(id => !document.getElementById(id))).map(input => input.getAttribute('aria-label') || input.id)), []);
  await t.test('policy and review fields have no broken description references', async () => {
    for (const path of ['/admin/refunds', '/admin/access-requests', '/admin/settings']) { await go(path); if (path.endsWith('settings')) await page.getByLabel('Policy registration category', { exact: true }).waitFor(); await help(); }
  });
  await t.test('file selection and decimal price survive native form submit', async () => {
    await go('/admin/books'); await page.getByRole('button', { name: 'Add New Book', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Book editor' }); await editor.waitFor();
    await editor.getByLabel('Book title', { exact: true }).fill('ADMIN UI SYNTHETIC DRAFT');
    await editor.getByLabel('Book price', { exact: true }).fill('123.45');
    await editor.getByLabel('Upload Book cover', { exact: true }).setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: await imageBytes() });
    await editor.locator('button').filter({ hasText: /^Upload Book cover$/ }).click();
    await page.waitForFunction(() => document.querySelector('select[aria-label="Book cover"]')?.value);
    await help(); await page.screenshot({ path: artifacts + 'admin-workspace-editor-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: artifacts + 'admin-workspace-editor-mobile.png' });
    await editor.getByRole('button', { name: 'Save Book Draft', exact: true }).click(); await editor.waitFor({ state: 'detached' });
    const book = await f.models.Book.findOne({ title: 'ADMIN UI SYNTHETIC DRAFT' });
    assert.equal(book.priceMinor, 12345); assert.equal(book.status, 'draft'); assert.equal(book.pricingApproved, false); assert.equal(book.rightsConfirmed, false); assert.ok(book.coverAssetId);
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.screenshot({ path: artifacts + 'admin-workspace-books.png' });
  });
  assert.deepEqual(errors, []);
});
