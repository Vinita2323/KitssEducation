import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { loadConfig } from '../../backend/src/config/env.js';
import { createDatabase } from '../../backend/src/config/database.js';
import { createLogger } from '../../backend/src/config/logger.js';
import { createAuthModels } from '../../backend/src/modules/auth/auth.models.js';
import { createAuthService } from '../../backend/src/modules/auth/auth.service.js';
import { createInstitutionModels } from '../../backend/src/modules/institutions/institutions.models.js';
import { createInstitutionService } from '../../backend/src/modules/institutions/institutions.service.js';
import { opaque, digest, hashPassword } from '../../backend/src/modules/auth/security.js';
import { createApp } from '../../backend/src/app.js';

const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const dbName = process.env.KITSS_STAGE4_BROWSER_DB;
test('Stage 4 existing UI with REAL API/MongoDB and responsive matrix', { skip: !dbName ? 'No KITSS_STAGE4_BROWSER_DB; real browser integration not executed' : !existsSync(executablePath) ? 'Chrome missing' : false, timeout: 600000 }, async t => {
  assert.match(dbName, /^kitss_stage4_browser_[a-f0-9]{16}$/);
  const config = loadConfig(), logger = createLogger({ level: 'silent' });
  const database = createDatabase({ ...config.mongo, dbName, requireReplicaSet: false }, logger);
  await database.connect(); let owned = false, authModels, models, browser, vite, backend;
  t.after(async () => { try { await browser?.close(); await vite?.close(); if (backend) await new Promise(resolve => { backend.close(resolve); backend.closeAllConnections(); }); if (owned) for (const Model of [...Object.values(models ?? {}), ...Object.values(authModels ?? {})]) { const ids = (await Model.find({}, { _id: 1 }).lean()).map(r => r._id); if (ids.length) await Model.deleteMany({ _id: { $in: ids } }); } } finally { await database.disconnect(); } });
  assert.equal((await database.connection.db.listCollections({}, { nameOnly: true }).toArray()).length, 0, 'Refuse existing database'); owned = true;
  authModels = createAuthModels(database.connection); models = createInstitutionModels(database.connection);
  const auth = await createAuthService({ models: authModels, config, logger, mail: { configured: false, send: async () => { throw new Error('No real emails in Stage 4'); } } }); await auth.initialize();
  const domain = createInstitutionService({ models, authService: auth, config, logger }); await domain.initialize();
  const ctx = { actorId: 'isolated-browser-fixture', ip: 'isolated-browser', requestId: randomUUID() };
  const state = await domain.create('taxonomy', { kind: 'state', key: 'test-state', label: 'Test State' }, ctx);
  await domain.create('taxonomy', { kind: 'district', key: 'test-district', label: 'Test District', parentIds: [state.id] }, ctx);
  for (const [kind, label] of [['institution_type', 'Test Institute'], ['designation', 'Test Director'], ['program', 'Test Program'], ['qualification', 'Test Qualification']]) await domain.create('taxonomy', { kind, key: 'test-' + kind.replaceAll('_', '-'), label }, ctx);
  const university = await domain.create('university', { name: 'Test University', shortName: 'TEST', status: 'active' }, ctx);
  const college = await domain.create('college', { name: 'Test College', code: 'TEST-COLLEGE', category: 'Institute', universityId: university.id, stateId: state.id, district: 'Test District', city: 'Test City', address: 'Test Campus', status: 'active', verification: { state: 'verified', source: 'Isolated test fixture, not a real institution' } }, ctx);
  const program = await domain.create('program', { name: 'Test Program', degreeType: 'Undergraduate', duration: '3 years', eligibility: 'Test criteria', feeMinor: 10000, status: 'active', admissionStatus: 'open' }, ctx, college.id);
  const fixture = async role => {
    const user = await authModels.User.create({ publicId: 'TEST-' + randomUUID(), name: 'Test Applicant', emailNormalized: randomUUID() + '@example.invalid', passwordHash: await hashPassword(opaque()), roles: [role], status: 'active', emailVerifiedAt: new Date() });
    const token = opaque(); const session = await authModels.Session.create({ _id: randomUUID(), userId: user._id, tokenHash: digest(token), kind: role === 'student' ? 'student' : 'admin', securityVersion: 0, lastSeenAt: new Date(), expiresAt: new Date(Date.now() + 3600000) });
    if (role === 'student') await authModels.User.updateOne({ _id: user._id }, { $set: { activeSessionId: session._id } });
    return { user, token, cookie: role === 'student' ? 'kitss_student_session' : 'kitss_staff_session' };
  };
  const admin = await fixture('super_admin'), student = await fixture('student');
  backend = http.createServer(); await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
  const backendUrl = `http://127.0.0.1:${backend.address().port}`;
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), optimizeDeps: { noDiscovery: true, include: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom', 'lucide-react', 'framer-motion', 'html-to-image', 'html2canvas', 'jspdf'] }, cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + dbName + '/', import.meta.url)), server: { host: '127.0.0.1', port: 5410, hmr: false, watch: null, proxy: { '/api': { target: backendUrl, changeOrigin: true } } }, logLevel: 'error' }); await vite.listen();
  const base = `http://127.0.0.1:${vite.httpServer.address().port}`; config.corsOrigins = [base]; config.appPublicUrl = base;
  backend.on('request', createApp({ config, logger, database, storage: { isReady: async () => true }, authService: auth, institutionService: domain }));
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } }); const page = await context.newPage(); page.setDefaultTimeout(30000);
  const goto = url => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Browser runtime error:', error.message); });
  t.afterEach(async child => { if (child.passed === false) { mkdirSync(fileURLToPath(new URL('../test-artifacts/', import.meta.url)), { recursive: true }); const name = child.name.replace(/[^a-z0-9]+/gi, '-'); writeFileSync(fileURLToPath(new URL('../test-artifacts/failure-' + name + '.txt', import.meta.url)), (await page.locator('body').innerText()) + '\n' + JSON.stringify(await page.locator('input,select,textarea').evaluateAll(nodes => nodes.map(n => ({ label: n.getAttribute('aria-label'), value: n.value, invalid: n.validationMessage }))))); await page.screenshot({ path: fileURLToPath(new URL('../test-artifacts/failure-' + name + '.png', import.meta.url)), fullPage: true }); } });
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const identity = async actor => { await context.clearCookies(); if (actor) await context.addCookies([{ name: actor.cookie, value: actor.token, url: base, httpOnly: true, sameSite: 'Lax' }]); };
  const by = name => page.getByLabel(name, { exact: true });
  const response = path => page.waitForResponse(r => r.url().includes('/api/v1/') && r.url().includes(path) && r.request().method() !== 'GET');
  await t.test('university create/edit/archive UI uses real persistence', async () => {
    await identity(admin); await goto(base + '/admin/universities');
    await page.getByRole('button', { name: 'Add University', exact: true }).click();
    await by('University name').fill('Browser Test University'); await by('University shortName').fill('BROWSER'); await by('University status').selectOption('draft');
    const saved = response('/admin/universities'); await page.getByRole('button', { name: 'Create University', exact: true }).click(); assert.equal((await saved).status(), 201);
    const row = page.locator('div').filter({ has: page.getByText('Browser Test University', { exact: true }) });
    await page.getByTestId('university-BROWSER').getByRole('button', { name: 'Edit university', exact: true }).click(); await by('University name').fill('Browser Test University Updated');
    const updated = response('/admin/universities/'); await page.getByRole('button', { name: 'Update University', exact: true }).click(); assert.equal((await updated).status(), 200);
    assert.ok(await models.University.exists({ name: 'Browser Test University Updated' }));
    page.once('dialog', dialog => dialog.accept()); const archived = response('/admin/universities/'); await page.getByTestId('university-BROWSER').getByRole('button', { name: 'Archive university', exact: true }).click(); assert.equal((await archived).status(), 200);
    assert.ok(await models.University.exists({ name: 'Browser Test University Updated', status: 'archived' }));
  });
  let createdCollege;
  await t.test('college create/edit validates real taxonomy and program create/edit/archive', async () => {
    await goto(base + '/admin/colleges'); await page.getByRole('button', { name: /Add College/ }).first().click();
    await by('College name').fill('Browser Test College'); await by('College code').fill('BROWSER-COLLEGE'); await by('College city').fill('Test City'); await by('College stateId').selectOption(state.id);
    await by('College district').selectOption('Test District'); await by('College address').fill('Test Browser Campus'); await by('College status').selectOption('draft'); await by('College universityId').selectOption(university.id);
    const saved = response('/admin/colleges'); await page.getByRole('button', { name: /Create College/ }).click(); assert.equal((await saved).status(), 201);
    createdCollege = await models.College.findOne({ code: 'BROWSER-COLLEGE' }); assert.ok(createdCollege);
    await goto(base + '/admin/colleges/' + createdCollege._id + '/courses'); await page.getByRole('button', { name: /Add Course|Add Program/ }).first().click();
    await by('Program courseName').fill('Browser Test Program'); await by('Program duration').fill('3 Years'); await by('Program eligibility').fill('Test requirement'); await by('Program fee').fill('100'); await by('Program status').selectOption('draft');
    const created = response('/programs'); await page.getByRole('button', { name: /Create Course|Add Course|Save Course/ }).last().click(); assert.equal((await created).status(), 201);
    await page.getByRole('button', { name: 'Edit program', exact: true }).click(); await by('Program courseName').fill('Browser Test Program Updated'); const updated = response('/programs/'); await page.getByRole('button', { name: /Update Course|Update Program/ }).click(); assert.equal((await updated).status(), 200);
    page.once('dialog', dialog => dialog.accept()); const archived = response('/programs/'); await page.getByRole('button', { name: 'Archive program', exact: true }).click(); assert.equal((await archived).status(), 200);
  });
  await t.test('public filters/details and signed-in admission confirmation persist', async () => {
    await identity(student); await goto(base + '/colleges'); await page.getByText('Test College', { exact: true }).waitFor();
    await page.getByLabel('Filter by State').selectOption('Test State');
    await page.getByRole('button', { name: 'View Details', exact: true }).click(); await page.getByRole('button', { name: 'Close modal' }).waitFor(); await page.getByRole('button', { name: 'Close modal' }).click();
    await page.getByRole('button', { name: 'Apply Now', exact: true }).click();
    await page.getByRole('dialog', { name: 'Admission application' }).getByText('Test Program', { exact: true }).click(); await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await by('Admission mobileNumber').fill('9000000000'); await by('Admission educationalQualification').selectOption('Test Qualification');
    await page.getByRole('button', { name: 'Continue', exact: true }).click(); const submitted = response('/admission-applications'); await page.getByRole('button', { name: 'Submit Application', exact: true }).click(); assert.equal((await submitted).status(), 201);
    assert.equal(await models.AdmissionApplication.countDocuments(), 1);
  });
  // Registration now renders the policy-driven FranchiseApplicationForm, whose full multi-step flow is
  // covered by franchise-workflow.browser.test.js. Here: the form opens, and a submitted application
  // (created through the institution service) reaches the admin review below.
  await t.test('franchise form opens and a submitted application persists as pending', async () => {
    await goto(base + '/register?type=franchise'); await page.getByRole('heading', { name: /^Franchise application/ }).first().waitFor();
    const studentAuth = await auth.authenticate(student.token, 'student');
    const draft = await domain.createDraft({ universityId: university.id, collegeId: college.id, institution: { name: 'Browser Test Applicant Institute', type: 'Test Institute', yearEstablished: 2000 }, programsOffered: ['Test Program'], contact: { person: 'Test Contact', designation: 'Test Director', email: 'franchise@example.invalid', mobile: '9000000000' }, location: { address: 'Test Campus', city: 'Test City', stateId: state.id, pincode: '110001' }, idempotencyKey: randomUUID() }, studentAuth, ctx);
    await domain.submitFranchise(draft.id, { expectedRevision: draft.revision, declaration: { version: 'franchise-v1', accepted: true } }, studentAuth, draft.draftCapability, ctx);
    assert.equal(await models.FranchiseApplication.countDocuments({ status: 'pending' }), 1);
  });
  await t.test('admin admission/franchise note-only review does not change status', async () => {
    await identity(admin); await goto(base + '/admin/applications'); await page.getByRole('button', { name: /^Review admission / }).first().click();
    const noteBox = page.locator('textarea').last(); await noteBox.fill('Browser test admission note'); const noteSaved = response('/notes'); await page.getByRole('button', { name: /Save Note Only|Add Note/ }).click(); assert.equal((await noteSaved).status(), 200);
    assert.equal((await models.AdmissionApplication.findOne()).status, 'new');
    await goto(base + '/admin/franchise-requests'); await page.getByRole('button', { name: /^Review franchise / }).first().click(); await page.locator('textarea').last().fill('Browser test franchise note'); const saved = response('/notes'); await page.getByRole('button', { name: 'Save Note Only' }).click(); assert.equal((await saved).status(), 200);
    assert.equal(await page.getByRole('button', { name: 'Approve Franchise' }).isDisabled(), true); assert.equal((await models.FranchiseApplication.findOne()).status, 'pending');
  });
  for (const width of (process.env.KITSS_STAGE4_WORKFLOWS_ONLY ? [] : [320, 375, 390, 414, 768, 1024, 1440])) await t.test(`responsive directories/modals/forms/admin boundaries at ${width}px`, async () => {
    await page.setViewportSize({ width, height: 950 }); await identity(admin);
    for (const path of ['/admin/taxonomies','/admin/universities','/admin/colleges', '/admin/colleges/' + college.id + '/courses','/admin/applications','/admin/franchise-requests']) {
      await goto(base + path); await page.locator('main').waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await identity(null); await goto(base + '/institutes'); await page.getByText('Test College', { exact: true }).waitFor(); await page.getByRole('button', { name: 'View Details', exact: true }).click(); await page.getByRole('button', { name: 'Close modal' }).click();
    await goto(base + '/register?type=franchise'); await page.getByRole('heading', { name: /^Franchise application/ }).first().waitFor(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    mkdirSync(fileURLToPath(new URL('../test-artifacts/', import.meta.url)), { recursive: true }); await page.screenshot({ path: fileURLToPath(new URL(`../test-artifacts/stage4-${width}.png`, import.meta.url)), fullPage: true });
    await goto(base + '/admin/universities'); await page.waitForURL('**/login');
  });
  assert.deepEqual(errors, []);
});
