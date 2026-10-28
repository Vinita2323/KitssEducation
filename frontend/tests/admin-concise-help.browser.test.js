import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('concise admin guidance and expandable financial explanation (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 300000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  let signedIn = false, saved, savedTaxonomy;
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length);
    let data = [], meta = { page: 1, total: 0, totalPages: 1, unreadCount: 0 };
    if (path === '/auth/me') {
      if (!signedIn) return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' } } });
      data = { user: { id: 'CONCISE-ADMIN', name: 'Test Admin', roles: ['admin'], permissions: ['dashboard.read', 'books.read', 'books.create', 'content.read', 'content.write'], status: 'active' } };
    } else if (path === '/admin/dashboard') data = { operations: { totals: {}, asOf: '2026-01-01T00:00:00Z' }, groups: [], failedAttempts: [], eventQueue: [] };
    else if (path === '/admin/taxonomies' && route.request().method() === 'POST') { savedTaxonomy = route.request().postDataJSON(); data = { id: 'mock-taxonomy', key: 'generated-key', ...savedTaxonomy }; }
    else if (path === '/auth/csrf') data = { csrfToken: 'mock-csrf' };
    else if (path === '/admin/books' && route.request().method() === 'POST') { saved = route.request().postDataJSON(); data = { id: 'mock-book', ...saved, status: 'draft' }; }
    return route.fulfill({ json: { data, meta, requestId: 'concise-test' } });
  });
  const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url)); mkdirSync(artifacts, { recursive: true });
  await t.test('login has no redundant paragraphs and fits a mobile screen', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/admin/login'); await page.getByRole('heading', { name: 'Admin sign in' }).waitFor();
    assert.equal(await page.locator('[id^="admin-login-"][id$="-help"]').count(), 0);
    const button = await page.getByRole('button', { name: 'Login', exact: true }).boundingBox();
    assert.ok(button.y >= 0 && button.y + button.height <= 844);
    await page.screenshot({ path: artifacts + 'admin-concise-login.png' });
  });
  await t.test('dashboard explanation is keyboard-expandable and filters retain validation', async () => {
    signedIn = true; await page.setViewportSize({ width: 1440, height: 1000 }); await go('/admin');
    await page.getByRole('heading', { name: 'Test Mode Financial Summary' }).waitFor();
    const form = page.getByRole('form', { name: 'Dashboard financial filters' });
    assert.equal(await form.locator('.admin-field-help').count(), 0);
    const disclosure = page.locator('details.admin-financial-help');
    await page.getByText('No payment activity yet. Test orders will appear here after checkout.', { exact: true }).waitFor();
    assert.equal(await disclosure.getAttribute('open'), null);
    await disclosure.locator('summary').focus(); await page.keyboard.press('Enter');
    await page.getByText(/Captured value is the amount collected/).waitFor();
    await page.keyboard.press('Space'); assert.equal(await disclosure.getAttribute('open'), null);
    await page.getByLabel('Start date', { exact: true }).fill('2026-02-02');
    await page.getByLabel('End date', { exact: true }).fill('2026-02-01');
    await page.getByRole('button', { name: 'Apply financial filters', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Start date must not follow end date.' }).waitFor();
    const description = await page.getByLabel('Start date', { exact: true }).getAttribute('aria-describedby');
    assert.ok(description && await page.locator('[id="' + description + '"]').count());
    await page.getByRole('button', { name: 'Clear financial filters', exact: true }).click();
    await page.getByLabel('Start date', { exact: true }).fill('2026-01-01');
    await page.getByRole('button', { name: 'Apply financial filters', exact: true }).click();
    await page.waitForURL('**/admin?from=2026-01-01');
    await page.getByText('No payment activity matches these filters. Try changing or clearing them.', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Clear financial filters', exact: true }).click();
    await page.getByText('No payment activity yet. Test orders will appear here after checkout.', { exact: true }).waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await form.scrollIntoViewIfNeeded(); await page.screenshot({ path: artifacts + `admin-concise-dashboard-${width}.png` });
    }
  });
  await t.test('simple book fields have no hints; price guidance and save payload remain', async () => {
    await go('/admin/books'); await page.getByRole('button', { name: 'Add New Book', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Book editor' }); await editor.waitFor();
    const title = editor.getByLabel('Book title', { exact: true });
    assert.equal(await title.getAttribute('aria-describedby'), null);
    assert.ok(await editor.getByLabel('Book price', { exact: true }).getAttribute('aria-describedby'));
    await title.fill('Concise Test Book'); await editor.getByLabel('Book price', { exact: true }).fill('123.45');
    await editor.getByRole('button', { name: 'Save Book Draft', exact: true }).click(); await editor.waitFor({ state: 'detached' });
    assert.equal(saved.priceMinor, 12345); assert.equal(saved.pricingApproved, false); assert.equal(saved.rightsConfirmed, false);
  });
  await t.test('taxonomy creation needs only a label, with no technical key field or column', async () => {
    await go('/admin/taxonomies');
    await page.getByRole('button', { name: 'States', exact: true }).click();
    await page.getByRole('button', { name: 'Add state', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Add state' });
    assert.equal(await editor.getByText('Canonical key', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('columnheader', { name: 'Key', exact: true }).count(), 0);
    await editor.getByLabel('State name', { exact: true }).fill('Uttar Pradesh');
    await editor.getByRole('button', { name: 'Save state', exact: true }).click();
    await editor.waitFor({ state: 'detached' });
    assert.equal(savedTaxonomy.label, 'Uttar Pradesh');
    assert.equal(savedTaxonomy.kind, 'state');
    assert.equal(Object.hasOwn(savedTaxonomy, 'key'), false);
  });
  await page.setViewportSize({ width: 1440, height: 1000 }); await go('/admin');
  await page.getByRole('heading', { name: 'Test Mode Financial Summary' }).waitFor();
  await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
  assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
  assert.deepEqual(errors, []);
});
