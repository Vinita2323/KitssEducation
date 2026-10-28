import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('coaching editor option loading, recovery and saved payloads (mocked HTTP)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  const errors = [], requests = [], writes = [];
  let failFaculty = false, failState = false, emptyFaculty = false, stateLabel = 'Learning State';
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length), method = route.request().method();
    requests.push(path + url.search);
    let data = [], meta = { page: 1, pageSize: 100, total: 0, totalPages: 1 };
    if (path === '/auth/me') data = { user: { id: 'coaching-admin', name: 'Test Admin', roles: ['admin'], permissions: ['coaching.read', 'coaching.create', 'coaching.edit', 'media.read'], status: 'active' } };
    else if (path === '/auth/csrf') data = { csrfToken: 'mock-csrf' };
    else if ((path === '/public/faculty' && failFaculty) || (path === '/taxonomies' && url.searchParams.get('kind') === 'state' && failState)) return route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Temporary failure' } } });
    else if (path === '/taxonomies') { const kind = url.searchParams.get('kind'); data = [{ id: kind + '-1', label: kind === 'state' ? stateLabel : 'Test ' + kind, parentIds: [] }]; }
    else if (path === '/public/faculty' && !emptyFaculty) { const number = Number(url.searchParams.get('page') || 1); data = [{ id: 'faculty-' + number, name: 'Published Instructor ' + number }]; meta = { ...meta, page: number, total: 2, totalPages: 2 }; }
    else if (path === '/books') data = [{ id: 'book-1', title: 'Published Book' }];
    else if (path === '/admin/coaching/courses' && method === 'POST') { const payload = route.request().postDataJSON(); writes.push(payload); data = { id: 'saved-course', revision: 1, ...payload }; }
    return route.fulfill({ json: { data, meta, requestId: 'coaching-options-test' } });
  });
  const go = () => page.goto(base + '/admin/coaching', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const open = async () => { await page.getByRole('button', { name: 'Add course', exact: true }).click(); return page.getByRole('dialog', { name: 'Coaching editor' }); };
  const ready = async (editor, name) => { await editor.getByLabel(name, { exact: true }).locator('option').nth(1).waitFor({ state: 'attached' }); await page.waitForFunction(name => !document.querySelector(`select[aria-label="${name}"]`).disabled, name); };
  await go();
  await t.test('faculty failure does not empty taxonomies or books; retry preserves entered data', async () => {
    failFaculty = true;
    const editor = await open();
    await editor.getByRole('alert').filter({ hasText: 'Could not load: published instructors.' }).waitFor();
    await ready(editor, 'State'); await ready(editor, 'Board');
    await editor.getByLabel('Course title', { exact: true }).fill('Original draft title');
    await editor.getByLabel('State', { exact: true }).selectOption('state-1');
    assert.equal(await editor.getByLabel('Linked published books', { exact: true }).locator('option').count(), 1);
    assert.equal(await editor.getByLabel('Published instructors', { exact: true }).isDisabled(), true);
    failFaculty = false;
    await editor.getByRole('button', { name: 'Retry choices', exact: true }).click();
    await editor.getByLabel('Published instructors', { exact: true }).locator('option').nth(1).waitFor({ state: 'attached' });
    assert.equal(await editor.getByLabel('Course title', { exact: true }).inputValue(), 'Original draft title');
    assert.equal(await editor.getByLabel('State', { exact: true }).inputValue(), 'state-1');
    assert.ok(requests.some(path => path === '/public/faculty?page=2&pageSize=100'));
    await page.keyboard.press('Escape');
  });
  await t.test('one failed taxonomy leaves other selectors usable and names the failed list', async () => {
    failState = true;
    const editor = await open();
    await editor.getByRole('alert').filter({ hasText: 'Could not load: states.' }).waitFor();
    await ready(editor, 'Language');
    assert.equal(await editor.getByLabel('State', { exact: true }).isDisabled(), true);
    await editor.getByLabel('Language', { exact: true }).selectOption('language-1');
    failState = false; await editor.getByRole('button', { name: 'Retry choices', exact: true }).click();
    await ready(editor, 'State'); assert.equal(await editor.getByLabel('Language', { exact: true }).inputValue(), 'language-1');
    await page.keyboard.press('Escape');
  });
  await t.test('reopening loads new choices and saving keeps course API fields unchanged', async () => {
    stateLabel = 'Newly added state';
    const editor = await open();
    await editor.getByLabel('State', { exact: true }).getByRole('option', { name: stateLabel }).waitFor({ state: 'attached' });
    for (const label of ['Language', 'Board', 'Educational level', 'Program', 'State']) await ready(editor, label);
    await editor.getByLabel('Course title', { exact: true }).fill('Coaching selection test');
    for (const [label, value] of [['Language', 'language-1'], ['Board', 'board-1'], ['Educational level', 'class-1'], ['Program', 'program-1'], ['State', 'state-1'], ['Subjects', 'subject-1'], ['Published instructors', 'faculty-2'], ['Linked published books', 'book-1']]) {
      await editor.getByLabel(label, { exact: true }).selectOption(value);
    }
    await editor.getByRole('button', { name: 'Save course', exact: true }).click();
    await editor.waitFor({ state: 'detached' });
    assert.equal(writes.at(-1).stateId, 'state-1'); assert.equal(writes.at(-1).classId, 'class-1');
    assert.deepEqual(writes.at(-1).subjectIds, ['subject-1']); assert.deepEqual(writes.at(-1).facultyIds, ['faculty-2']);
    assert.deepEqual(writes.at(-1).linkedBookIds, ['book-1']);
  });
  await t.test('empty published list is explained; mobile keyboard and accessibility remain usable', async () => {
    emptyFaculty = true;
    await page.setViewportSize({ width: 390, height: 844 });
    const editor = await open();
    await editor.getByText('No published instructors available.', { exact: true }).waitFor();
    assert.equal(await editor.getByRole('alert').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
    assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
    await page.keyboard.press('Escape'); await editor.waitFor({ state: 'detached' });
    assert.equal(await page.getByRole('button', { name: 'Add course', exact: true }).evaluate(el => el === document.activeElement), true);
  });
  assert.deepEqual(errors, []);
});
