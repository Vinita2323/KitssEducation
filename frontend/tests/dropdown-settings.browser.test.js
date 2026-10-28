import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('grouped dropdown settings (mocked HTTP, no database writes)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen();
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  const rows = [{ id: 'board-1', kind: 'board', key: 'legacy-board', label: 'Existing Board', parentIds: [], sortOrder: 0, status: 'active', revision: 7 }];
  const writes = [], errors = [];
  let writable = true, noParents = false, parentFailure = false;
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length), method = route.request().method();
    let data = [], meta = { page: 1, totalPages: 1, total: 0 };
    if (path === '/auth/me') data = { user: { id: 'dropdown-admin', name: 'Test Admin', roles: ['admin'], permissions: ['content.read', ...(writable ? ['content.write'] : [])], status: 'active' } };
    else if (path === '/auth/csrf') data = { csrfToken: 'mock-csrf' };
    else if (path.startsWith('/admin/taxonomies')) {
      if (method !== 'GET') {
        const payload = route.request().postDataJSON(); writes.push({ method, path, payload });
        if (method === 'POST') { data = { id: 'created-' + writes.length, key: 'server-generated-' + writes.length, revision: 1, ...payload }; rows.push(data); }
        else { const row = rows.find(r => path.endsWith('/' + r.id)); Object.assign(row, method === 'DELETE' ? { status: 'inactive' } : payload, { revision: row.revision + 1 }); data = row; }
      } else {
        const parentRequest = url.searchParams.get('pageSize') === '100';
        if (parentRequest && parentFailure) return route.fulfill({ status: 503, json: { error: { code: 'UNAVAILABLE', message: 'Choices temporarily unavailable' } } });
        data = parentRequest && noParents ? [] : rows.filter(r => r.kind === url.searchParams.get('kind') && (!url.searchParams.get('status') || r.status === url.searchParams.get('status')) && (!url.searchParams.get('q') || r.label.includes(url.searchParams.get('q'))));
        meta.total = data.length;
      }
    }
    return route.fulfill({ json: { data, meta, requestId: 'dropdown-test' } });
  });
  const go = () => page.goto(base + '/admin/taxonomies', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const pick = name => page.getByRole('navigation', { name: 'Dropdown groups' }).getByRole('button', { name, exact: true }).click();
  await go();
  await t.test('all eleven types are grouped and names replace internal fields', async () => {
    await page.getByRole('heading', { name: 'Dropdown settings', exact: true }).waitFor();
    const nav = page.getByRole('navigation', { name: 'Dropdown groups' });
    assert.equal(await nav.getByRole('button').count(), 11);
    for (const name of ['Education', 'Locations', 'Institution & profile']) await nav.getByRole('heading', { name, exact: true }).waitFor();
    for (const [section, singular] of [['Boards', 'board'], ['Languages', 'language'], ['Programs', 'program'], ['States', 'state'], ['Institution types', 'institution type'], ['Qualifications', 'qualification'], ['Designations', 'designation'], ['Experience', 'experience level']]) {
      await pick(section);
      await page.getByRole('button', { name: 'Add ' + singular, exact: true }).click();
      const editor = page.getByRole('dialog', { name: 'Add ' + singular, exact: true });
      assert.equal(await editor.getByText(/Canonical key|^Kind$/).count(), 0);
      await editor.getByLabel(new RegExp(singular + ' name', 'i')).fill('Sample ' + section);
      await editor.getByRole('button', { name: 'Save ' + singular, exact: true }).click();
      await editor.waitFor({ state: 'detached' });
      assert.equal(Object.hasOwn(writes.at(-1).payload, 'key'), false);
    }
  });
  await t.test('classes, subjects and districts require their respective parents', async () => {
    for (const [section, singular, parent, parentId] of [['Classes', 'class', 'Board', 'board-1'], ['Subjects', 'subject', 'Class', null], ['Districts', 'district', 'State', null]]) {
      await pick(section); await page.getByRole('button', { name: 'Add ' + singular, exact: true }).click();
      const editor = page.getByRole('dialog', { name: 'Add ' + singular, exact: true });
      const selector = editor.getByLabel(parent, { exact: true });
      await selector.locator('option').nth(1).waitFor({ state: 'attached' });
      await editor.getByLabel(new RegExp(singular + ' name', 'i')).fill('Linked ' + section);
      const count = writes.length;
      await editor.getByRole('button', { name: 'Save ' + singular, exact: true }).click();
      assert.equal(writes.length, count, 'Required parent prevents a write');
      const chosen = parentId || await selector.locator('option').nth(1).getAttribute('value');
      await selector.selectOption(chosen);
      await editor.getByRole('button', { name: 'Save ' + singular, exact: true }).click(); await editor.waitFor({ state: 'detached' });
      assert.deepEqual(writes.at(-1).payload.parentIds, [chosen]);
    }
  });
  await t.test('editing and archiving retain identifiers, revisions and hierarchy', async () => {
    await pick('Boards');
    await page.getByRole('button', { name: 'Edit Existing Board', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Edit board' });
    await editor.getByLabel('Board name', { exact: true }).fill('Renamed Board');
    await editor.getByRole('button', { name: 'Save board', exact: true }).click(); await editor.waitFor({ state: 'detached' });
    assert.deepEqual(writes.at(-1), { method: 'PATCH', path: '/admin/taxonomies/board-1', payload: { label: 'Renamed Board', status: 'active', sortOrder: 0, expectedRevision: 7 } });
    assert.equal(rows[0].key, 'legacy-board');
    await pick('Classes'); await page.getByRole('button', { name: 'Edit Linked Classes' }).click();
    const childEditor = page.getByRole('dialog', { name: 'Edit class' });
    assert.equal(await childEditor.getByLabel('Board', { exact: true }).isDisabled(), true);
    await childEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
    await pick('Boards');
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'Archive Renamed Board', exact: true }).click();
    await page.getByRole('row').filter({ hasText: 'Renamed Board' }).getByText('Inactive', { exact: true }).waitFor();
    assert.deepEqual(writes.at(-1), { method: 'DELETE', path: '/admin/taxonomies/board-1', payload: { expectedRevision: 8 } });
  });
  await t.test('missing parents and parent-load failures block creation with an explanation', async () => {
    noParents = true;
    await pick('Subjects'); await page.getByRole('button', { name: 'Add subject', exact: true }).click();
    let editor = page.getByRole('dialog', { name: 'Add subject' });
    await editor.getByText('Add an active class first in Classes.', { exact: true }).waitFor();
    assert.equal(await editor.getByRole('button', { name: 'Save subject', exact: true }).isDisabled(), true);
    await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
    noParents = false; parentFailure = true;
    await page.getByRole('button', { name: 'Add subject', exact: true }).click(); editor = page.getByRole('dialog', { name: 'Add subject' });
    await editor.getByRole('alert').waitFor();
    assert.equal(await editor.getByRole('button', { name: 'Save subject', exact: true }).isDisabled(), true);
    await editor.getByRole('button', { name: 'Cancel', exact: true }).click(); parentFailure = false;
  });
  await t.test('mobile layout, keyboard dialogs and accessibility remain usable', async () => {
    await pick('Languages');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    const trigger = page.getByRole('button', { name: 'Add language', exact: true });
    await trigger.focus(); await page.keyboard.press('Enter');
    await page.getByRole('dialog', { name: 'Add language' }).waitFor();
    await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
    assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  });
  await t.test('read-only permission allows browsing without mutation controls', async () => {
    writable = false; await go();
    await page.getByRole('heading', { name: 'Dropdown settings', exact: true }).waitFor();
    await page.getByRole('cell', { name: 'Renamed Board', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Add |^Edit |^Archive / }).count(), 0);
  });
  assert.deepEqual(errors, []);
});
