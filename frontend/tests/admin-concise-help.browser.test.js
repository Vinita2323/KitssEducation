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
  // A filtered February day is empty; every other period returns sample activity.
  const dashboardData = from => {
    const empty = from === '2026-02-02';
    return { asOf: '2026-01-01T06:30:00Z', period: { from: from || '', to: '', timeZone: 'Asia/Kolkata' },
      payments: { currency: 'INR', environment: { mode: 'test', simulated: true }, collected: empty ? { amountMinor: 0, orders: 0, buyers: 0 } : { amountMinor: 125050, orders: 3, buyers: 2 },
        byProduct: empty ? [] : [{ kind: 'book', amountMinor: 100050, orders: 2 }, { kind: 'registration_fee', amountMinor: 25000, orders: 1 }],
        unpaidCheckouts: 1, failedPayments: empty ? 0 : 1, needsAction: 0, pendingRefunds: 0,
        recentOrders: [{ id: 'o1', reference: 'K6-1', title: 'Class 10 Mathematics', kind: 'book', amountMinor: 50025, createdAt: '2026-01-01T05:00:00Z', studentName: 'Asha', status: 'paid' }, { id: 'o2', reference: 'K6-2', title: 'Registration fee', kind: 'registration_fee', amountMinor: 25000, createdAt: '2025-12-31T05:00:00Z', studentName: null, status: 'failed' }] },
      overview: { people: { students: 120, newStudents: empty ? 0 : 8, staff: 3, activeEnrollments: 41 }, content: { books: { published: 3, draft: 2 }, courses: { published: 4, draft: 0 }, universities: { active: 2, total: 2 }, colleges: { active: 1, total: 2 } },
        awaitingReview: empty ? { admissions: 0, franchises: 0, registrations: 0, accessRequests: 0 } : { admissions: 3, franchises: 1, registrations: 0, accessRequests: 0 } } };
  };
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
    } else if (path === '/admin/dashboard') data = dashboardData(url.searchParams.get('from'));
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
  await t.test('dashboard shows paid-only totals, review queue and validated custom period', async () => {
    signedIn = true; await page.setViewportSize({ width: 1440, height: 1000 }); await go('/admin');
    await page.getByRole('heading', { name: 'Welcome back, Test', exact: true }).waitFor();
    assert.equal(await page.getByText(/Test Mode Financial Summary/).count(), 0);
    await page.getByText('₹1,250.50', { exact: true }).waitFor();
    await page.getByText(/no real money is collected/).waitFor();
    await page.getByText('admission applications awaiting review', { exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: /admission applications/ }).count(), 0, 'no link without admissions.read');
    await page.getByRole('link', { name: /Books published/ }).waitFor();
    assert.equal(await page.getByRole('button', { name: '30 days', exact: true }).getAttribute('aria-pressed'), 'true');
    const dashboardRequest = query => page.waitForRequest(r => { const u = new URL(r.url()); return u.pathname.endsWith('/admin/dashboard') && u.searchParams.toString() === query; });
    await Promise.all([dashboardRequest(''), page.getByRole('button', { name: 'All time', exact: true }).click()]);
    await page.waitForURL('**/admin?range=all');
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByLabel('Start date', { exact: true }).fill('2026-02-02');
    await page.getByLabel('End date', { exact: true }).fill('2026-02-01');
    await page.getByRole('button', { name: 'Apply dates', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Start date must not follow end date.' }).waitFor();
    const description = await page.getByLabel('Start date', { exact: true }).getAttribute('aria-describedby');
    assert.ok(description && await page.locator('[id="' + description + '"]').count());
    await page.getByLabel('End date', { exact: true }).fill('2026-02-02');
    await Promise.all([dashboardRequest('from=2026-02-02&to=2026-02-02'), page.getByRole('button', { name: 'Apply dates', exact: true }).click()]);
    await page.waitForURL('**/admin?range=custom&from=2026-02-02&to=2026-02-02');
    await page.getByText('No payments received in this period.', { exact: true }).waitFor();
    await page.getByText('All caught up. No applications, requests or orders are waiting for review.', { exact: true }).waitFor();
    await page.getByRole('button', { name: '30 days', exact: true }).click(); await page.getByText('₹1,250.50', { exact: true }).waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: artifacts + `admin-concise-dashboard-${width}.png`, fullPage: true });
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
    assert.equal(saved.priceMinor, 12345); assert.equal('pricingApproved' in saved, false, 'publishing approves the price'); assert.equal(saved.rightsConfirmed, false); assert.equal('category' in saved, false);
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
  await page.getByRole('heading', { name: 'Welcome back, Test', exact: true }).waitFor();
  await page.evaluate(readFileSync(fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url)), 'utf8'));
  assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)), []);
  assert.deepEqual(errors, []);
});
