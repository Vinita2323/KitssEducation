import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('admin book review and publication (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  const book = { id: 'book-1', title: 'Draft demonstration', status: 'draft', revision: 3, author: 'Author', description: 'Saved admin description', category: 'Learning', languageId: 'language-1', priceMinor: 14900, pricingApproved: false, rightsConfirmed: true, rightsNote: 'Original authored text', coverAssetId: 'cover-1', documentAssetId: 'document-1', previewAssetIds: [] };
  const writes = [], errors = [], publicReads = [];
  let rejectPublish = false, writable = true;
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length); let data = [], meta = { page: 1, total: 0, totalPages: 1 };
    if (path === '/auth/me') data = { user: { id: 'reviewer', name: 'Reviewer', status: 'active', roles: ['admin'], permissions: ['books.read', ...(writable ? ['books.publish', 'books.edit'] : [])] } };
    else if (path === '/auth/csrf') data = { csrfToken: 'mock-token' };
    else if (path === '/admin/books') { data = [{ ...book }]; meta.total = 1; }
    else if (path === '/admin/books/book-1') data = { ...book };
    else if (path === '/admin/books/book-1/publish') {
      const payload = route.request().postDataJSON(); writes.push(payload);
      if (rejectPublish) return route.fulfill({ status: 422, json: { error: { code: 'VALIDATION_ERROR', message: 'The attached PDF must be clean and ready.' } } });
      assert.equal(payload.expectedRevision, book.revision);
      book.status = payload.publish ? 'published' : 'draft'; book.revision++; data = { ...book };
    } else if (path.startsWith('/books/')) publicReads.push(path);
    return route.fulfill({ json: { data, meta, requestId: 'review-test' } });
  });
  const go = () => page.goto(base + '/admin/books', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const row = () => page.getByRole('row').filter({ hasText: 'Draft demonstration' });
  await go();
  await t.test('draft preview stays in admin and exposes saved details without a public request', async () => {
    await row().getByRole('button', { name: 'Admin preview', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Admin book preview', exact: true });
    await dialog.getByText('Saved admin description', { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/admin/books');
    assert.equal(publicReads.length, 0);
    assert.equal(await row().getByRole('link', { name: 'View public page', exact: true }).count(), 0);
    await page.keyboard.press('Escape');
  });
  await t.test('missing pricing approval blocks publication and offers the editor', async () => {
    await row().getByRole('button', { name: 'Publish', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Publish book', exact: true });
    await dialog.getByText('Required: Pricing approved by the business owner', { exact: true }).waitFor();
    assert.equal(await dialog.getByRole('button', { name: 'Confirm publish', exact: true }).isDisabled(), true);
    assert.equal(writes.length, 0);
    await dialog.getByRole('button', { name: 'Edit book', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Book editor' });
    await editor.getByLabel('Book title', { exact: true }).waitFor();
    assert.equal(await editor.getByLabel('Book price', { exact: true }).inputValue(), '149');
    await page.keyboard.press('Escape');
  });
  await t.test('server 422 stays in the dialog and never changes the book to published', async () => {
    book.pricingApproved = true; rejectPublish = true;
    await row().getByRole('button', { name: 'Publish', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Publish book', exact: true });
    await dialog.getByRole('button', { name: 'Confirm publish', exact: true }).click();
    await dialog.getByRole('alert').filter({ hasText: 'Book was not published. The attached PDF must be clean and ready.' }).waitFor();
    assert.equal(book.status, 'draft');
    await page.keyboard.press('Escape');
  });
  await t.test('explicit publish/unpublish actions retain revision contract and public link visibility', async () => {
    rejectPublish = false;
    await row().getByRole('button', { name: 'Publish', exact: true }).click();
    await page.getByRole('dialog', { name: 'Publish book', exact: true }).getByRole('button', { name: 'Confirm publish', exact: true }).click();
    await row().getByRole('link', { name: 'View public page', exact: true }).waitFor();
    assert.equal(writes.at(-1).publish, true);
    await row().getByRole('button', { name: 'Unpublish', exact: true }).click();
    await page.getByRole('dialog', { name: 'Unpublish book', exact: true }).getByRole('button', { name: 'Confirm unpublish', exact: true }).click();
    await row().getByRole('button', { name: 'Publish', exact: true }).waitFor();
    assert.equal(writes.at(-1).publish, false);
    assert.equal(await row().getByRole('link', { name: 'View public page', exact: true }).count(), 0);
  });
  await t.test('preview works on mobile, is keyboard-accessible and respects read-only permission', async () => {
    writable = false; await go();
    await page.setViewportSize({ width: 390, height: 844 });
    const trigger = row().getByRole('button', { name: 'Admin preview', exact: true }); await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Admin book preview', exact: true }); await dialog.getByText('Saved admin description', { exact: true }).waitFor();
    assert.equal(await dialog.getByRole('button', { name: 'Edit book', exact: true }).count(), 0);
    assert.equal(await row().getByRole('button', { name: 'Publish', exact: true }).count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
    assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
    await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'detached' });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  });
  assert.deepEqual(errors, []);
});
