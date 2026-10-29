import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('book catalogue retains academic filters without sorting or price controls (mocked HTTP)', { skip: !existsSync(chrome), timeout: 180000 }, async t => {
  const vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' }); await vite.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true }); t.after(async () => { await browser.close(); await vite.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); page.setDefaultTimeout(15000);
  const base = 'http://127.0.0.1:' + vite.httpServer.address().port, queries = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort(); if (!url.pathname.startsWith('/api/')) return route.continue();
    let data = [], meta = { total: 0, page: 1, totalPages: 1 };
    if (url.pathname.endsWith('/auth/me')) return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' } } });
    if (url.pathname.endsWith('/books/facets')) data = { boards: [{ id: 'board-1', name: 'School Board' }], classes: [{ id: 'class-1', name: '10' }], subjects: [{ id: 'subject-1', name: 'Maths' }], languages: [{ id: 'language-1', name: 'English' }] };
    else if (url.pathname === '/api/v1/books') queries.push(url.searchParams);
    else if (url.pathname.endsWith('/public/settings')) data = {};
    return route.fulfill({ json: { data, meta, requestId: 'books-test' } });
  });
  await page.goto(base + '/books?sort=price-low&type=paid&minPrice=10&maxPrice=100', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('heading', { name: 'Digital Books', exact: true, level: 1 }).waitFor();
  assert.equal(await page.locator('select').count(), 4);
  for (const name of ['Sort books', 'Book price type', 'Minimum book price', 'Maximum book price']) assert.equal(await page.getByLabel(name, { exact: true }).count(), 0);
  const search = page.getByPlaceholder('Search books, chapters, topics, authors...');
  const searched = page.waitForRequest(r => new URL(r.url()).searchParams.get('q') === 'algebra');
  await search.fill('algebra'); await searched;
  await page.getByRole('button', { name: /Reset All|Clear All|Reset Filters/i }).first().click();
  assert.equal(await search.inputValue(), '');
  for (const query of queries) for (const key of ['sort', 'type', 'minPriceMinor', 'maxPriceMinor']) assert.equal(query.has(key), false);
  for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  assert.deepEqual(errors, []);
});
