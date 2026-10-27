import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('published banner image loads and remains visible on desktop/mobile (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 180000 }, async t => {
  const vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await vite.listen(); const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await vite.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (url.pathname === '/api/v1/auth/me') return route.fulfill({ status: 401, json: { error: { code: 'UNAUTHENTICATED', message: 'Please sign in' } } });
    if (url.pathname === '/api/v1/media/test-banner/content') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="60"><rect width="40" height="60" fill="teal"/></svg>' });
    const data = url.pathname === '/api/v1/public/banners' ? [{ id: 'banner-image-test', title: 'Banner image visibility test', subtitle: 'Published banner', tag: 'Update', ctaText: 'Browse books', imageUrl: '/api/v1/media/test-banner/content', link: { type: 'internal', target: '/books' }, variant: 'navy' }]
      : url.pathname.startsWith('/api/v1/public/content/') ? { sections: [], faculty: [] } : url.pathname === '/api/v1/public/settings' ? {} : [];
    return route.fulfill({ json: { data, meta: { page: 1, total: 0, totalPages: 1, unreadCount: 0 } } });
  });
  await page.goto(base + '/home', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const image = page.getByRole('img', { name: 'Banner image visibility test', exact: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await image.waitFor({ state: 'visible' });
    await image.evaluate(img => img.decode());
    assert.equal(await image.evaluate(img => img.naturalWidth), 40);
    const box = await image.boundingBox();
    assert.ok(box.width > 0 && box.x >= 0 && box.x + box.width <= width, `image fits at ${width}px`);
    assert.equal(await page.getByRole('link', { name: 'Browse books', exact: true }).first().getAttribute('href'), '/books');
  }
  assert.deepEqual(errors, []);
});
