import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('dedicated staff management (mocked HTTP; no emails sent)', { skip: !existsSync(chrome) ? 'Chrome unavailable' : false, timeout: 240000 }, async t => {
  const server = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null }, logLevel: 'error' });
  await server.listen(); const browser = await chromium.launch({ executablePath: chrome, headless: true });
  t.after(async () => { await browser.close(); await server.close(); });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.httpServer.address().port;
  let manage = true;
  const staff = { id: 'PENDING-STAFF', name: 'Pending Person', email: 'pending@example.invalid', roles: ['admin'], status: 'pending', permissions: ['books.read'], emailVerified: false, revision: 1, summary: { orders: 0, enrollments: 0, registrations: 0 } };
  const writes = [], queries = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url()); if (url.origin !== base) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    const path = url.pathname.slice('/api/v1'.length), method = route.request().method();
    let data = [], meta = { page: 1, total: 0, totalPages: 1 };
    if (path === '/auth/me') data = { user: { id: 'OWNER', name: 'Owner', roles: ['admin'], status: 'active', permissions: ['accounts.read', 'books.read', 'dashboard.read', ...(manage ? ['accounts.roles.manage'] : [])] } };
    else if (path === '/auth/csrf') data = { csrfToken: 'mock-csrf' };
    else if (path === '/admin/users/invitations' && method === 'POST') { writes.push({ method, input: route.request().postDataJSON(), csrf: route.request().headers()['x-csrf-token'] }); data = { id: staff.id, message: 'Invitation submitted to SMTP for delivery' }; }
    else if (path === '/admin/users/invitations/' + staff.id && method === 'DELETE') { writes.push({ method, csrf: route.request().headers()['x-csrf-token'] }); staff.status = 'archived'; data = { message: 'Invitation revoked or already unavailable' }; }
    else if (path === '/admin/users') { queries.push(url.searchParams.toString()); data = [staff].filter(s => !url.searchParams.get('status') || s.status === url.searchParams.get('status')); meta.total = data.length; }
    else if (path === '/admin/users/' + staff.id) data = staff;
    else if (path === '/admin/dashboard') data = { operations: { totals: {}, asOf: new Date().toISOString() }, groups: [], failedAttempts: [], eventQueue: [] };
    return route.fulfill({ json: { data, meta, requestId: 'staff-test' } });
  });
  const go = path => page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await t.test('invitations exist only on the dedicated page and the sidebar links there', async () => {
    for (const path of ['/admin', '/admin/books', '/admin/users']) {
      await go(path); await page.getByRole('main').waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Staff invitations', exact: true }).count(), 0);
    }
    const nav = page.getByRole('navigation', { name: 'Admin sections', exact: true });
    await nav.getByRole('button', { name: 'Administration', exact: true }).click();
    // Visiting User accounts opens Administration automatically; toggle it open if needed.
    if (await nav.getByRole('button', { name: 'Administration', exact: true }).getAttribute('aria-expanded') === 'false') await nav.getByRole('button', { name: 'Administration', exact: true }).click();
    await nav.getByRole('link', { name: 'Staff management', exact: true }).click();
    await page.getByRole('heading', { name: 'Staff management', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Staff invitations', exact: true }).waitFor();
    assert.equal(await page.locator('fieldset[disabled]').count(), 0);
    await page.getByRole('button', { name: /Pending Person/ }).waitFor();
    assert.ok(queries.some(q => new URLSearchParams(q).get('role') === 'admin'));
  });
  await t.test('pending account review prefills an invitation; resend and revoke use existing CSRF contracts', async () => {
    await page.getByRole('button', { name: /Pending Person/ }).click();
    await page.getByRole('button', { name: 'Review invitation', exact: true }).click();
    await page.waitForFunction(email => document.querySelector('input[type=email]')?.value === email, staff.email);
    assert.equal(await page.getByLabel('Staff email', { exact: true }).inputValue(), staff.email);
    assert.equal(await page.getByLabel('books.read', { exact: true }).isChecked(), true);
    await page.getByRole('button', { name: 'Invite / resend', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Invitation submitted to SMTP' }).waitFor();
    assert.deepEqual(writes.at(-1).input, { name: staff.name, email: staff.email, permissions: ['books.read'] });
    assert.equal(writes.at(-1).csrf, 'mock-csrf');
    await page.getByRole('button', { name: 'Revoke invitation', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Invitation revoked' }).waitFor();
    assert.equal(writes.at(-1).method, 'DELETE');
    assert.equal(writes.at(-1).csrf, 'mock-csrf');
    await page.getByRole('button', { name: /Pending Person/ }).getByText(/archived/).waitFor();
  });
  await t.test('staff page fits mobile and passes accessibility checks', async () => {
    for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
    await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
    assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
  });
  await t.test('unauthorized staff cannot access the route or see its navigation link', async () => {
    manage = false; await go('/admin/staff');
    await page.getByRole('alert').filter({ hasText: 'You do not have permission' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Staff management', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Invite / resend', exact: true }).count(), 0);
  });
  assert.deepEqual(errors, []);
});
