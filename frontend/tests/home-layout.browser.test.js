import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('home layouts and admin appearance save (mocked HTTP)', { skip: !existsSync(chrome), timeout: 240000 }, async t => {
  const vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' }); await vite.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await vite.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  const sections = [{ key: 'services', type: 'cards', heading: 'Explore learning', body: 'DEMO CONTENT', items: ['colleges', 'coaching', 'books', 'categories'].map(linkKey => ({ heading: linkKey, body: 'Published description', linkKey })), mediaAssetIds: [] }, { key: 'features', type: 'cards', heading: 'Built around your learning', body: 'Published introduction', items: [{ heading: 'Study materials', body: 'Published benefit' }], mediaAssetIds: [] }, { key: 'extra', type: 'text', heading: 'Extra content', body: 'Retained', items: [], mediaAssetIds: [] }];
  let saved; const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length); let data = [], meta = { total: 0, page: 1, totalPages: 1 };
    if (path === '/auth/me') data = { user: { id: 'admin', name: 'Admin', status: 'active', roles: ['admin'], permissions: ['content.read', 'content.write', 'content.publish'] } };
    else if (path === '/public/content/home') data = { key: 'home', sections };
    else if (path === '/public/settings') data = {};
    else if (path === '/auth/csrf') data = { csrfToken: 'test-csrf' };
    else if (path === '/admin/content/pages') { data = [{ id: 'home-record', key: 'home', status: 'published', revision: 4, sections }]; meta.total = 1; }
    else if (path === '/admin/content/pages/home-record' && route.request().method() === 'PATCH') { saved = route.request().postDataJSON(); data = { ...saved, id: 'home-record', revision: 5 }; }
    return route.fulfill({ json: { data, meta, requestId: 'home-test' } });
  });
  const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await t.test('legacy published sections gain coloured cards without changing their copy or links', async () => {
    await go('/home');
    const services = page.getByRole('region', { name: 'Our services' });
    await services.getByRole('heading', { name: 'Explore learning' }).waitFor();
    assert.equal(await services.getByRole('article').count(), 4);
    assert.equal(await services.getByRole('link', { name: 'Explore service : books' }).getAttribute('href'), '/books');
    await page.getByRole('region', { name: 'Why choose us' }).getByRole('heading', { name: 'Built around your learning' }).waitFor();
    await page.getByText('DEMO CONTENT', { exact: true }).waitFor(); await page.getByRole('heading', { name: 'Extra content' }).waitFor();
    assert.ok(await services.getByRole('article').first().evaluate(el => getComputedStyle(el).backgroundColor !== 'rgb(255, 255, 255)'));
    for (const width of [1440, 390, 320]) { await page.setViewportSize({ width, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  });
  await t.test('home editor saves appearance through the existing revision-protected draft contract', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await go('/admin/content');
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Content editor' });
    await editor.getByLabel('Home layout', { exact: true }).first().selectOption('services');
    await editor.getByLabel('Card icon', { exact: true }).first().selectOption('Building2');
    await editor.getByLabel('Card colour', { exact: true }).first().selectOption('purple');
    await editor.getByLabel('Card title', { exact: true }).first().fill('Updated institution card');
    await editor.getByRole('button', { name: 'Save Content Draft', exact: true }).click(); await editor.waitFor({ state: 'detached' });
    assert.equal(saved.expectedRevision, 4); assert.equal(saved.sections[0].layout, 'services');
    assert.equal(saved.sections[0].items[0].iconKey, 'Building2'); assert.equal(saved.sections[0].items[0].color, 'purple');
    assert.equal(saved.sections[0].items[0].linkKey, 'colleges'); assert.equal(saved.sections[2].body, 'Retained');
    assert.equal(saved.publish, undefined);
  });
  assert.deepEqual(errors, []);
});
