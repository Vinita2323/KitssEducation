import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';
import { hashPassword } from '../../backend/src/modules/auth/security.js';
const name = process.env.KITSS_STAGE9_BROWSER_DB,
  chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 9 cross-stage active routes and release smoke', {
  skip: !name ? 'No isolated Stage 8 browser database' : !existsSync(chrome) ? 'Chrome unavailable' : false,
  timeout: process.env.KITSS_PROJECT_AUDIT === 'true' ? 1200000 : 600000
}, async t => {
  const focus = process.env.KITSS_STAGE9_BROWSER_FOCUS;
  const check = (title, run) => t.test(title, {
    skip: focus && !title.includes(focus) ? 'Excluded by explicit targeted rerun' : false
  }, run);
  const f = await stage8Fixture(name);
  let backend, vite, browser;
  t.after(async () => {
    try {
      await browser?.close();
      await vite?.close();
      if (backend) await new Promise(r => {
        backend.close(r);
        backend.closeAllConnections();
      });
    } finally {
      await f.close();
    }
  });
  const d = await f.seed();
  const admin = d.admin,
    student = d.student,
    other = d.other,
    ctx = f.ctx;
  await f.models.User.updateOne({
    _id: student.user._id
  }, {
    $set: {
      passwordHash: await hashPassword('SyntheticPassword123!')
    }
  });
  const issuer = await f.results.mutate('issuers', null, {
    key: 'synthetic-browser',
    type: 'school',
    name: 'SYNTHETIC',
    fullName: 'SYNTHETIC BROWSER ISSUER',
    status: 'active',
    fieldSchema: [{
      id: 'dob',
      label: 'Date of birth',
      type: 'date',
      required: true
    }],
    source: {
      description: 'Isolated test only',
      authorizationReference: 'SYNTHETIC_ISOLATED_ONLY'
    }
  }, ctx);
  let exam = await f.results.mutate('exams', null, {
    issuerId: issuer.id,
    key: 'synthetic-exam',
    title: 'SYNTHETIC BROWSER EXAM',
    year: 2026,
    session: 'TEST'
  }, ctx);
  exam = await f.trusted.mutate('exams', exam.id, {
    expectedRevision: exam.revision,
    status: 'published'
  }, ctx);
  const row = {
    rollNumber: 'SYNTHETIC-BROWSER-001',
    userPublicId: student.user.publicId,
    student: {
      name: 'SYNTHETIC BROWSER CANDIDATE'
    },
    subjects: [{
      code: 'T1',
      name: 'SYNTHETIC SUBJECT',
      maxMarks: 100,
      obtained: 82,
      grade: 'SOURCE-A'
    }],
    totals: {
      max: 100,
      obtained: 82,
      percentage: 82,
      status: 'SOURCE-PASS'
    },
    verificationFields: {
      dob: '2000-01-01'
    },
    issueDate: '2026-10-24',
    externalId: 'SYNTHETIC-BROWSER-REF'
  };
  const asset = await f.media.upload({
    purpose: 'result_import',
    stream: Readable.from(Buffer.from(JSON.stringify([row]))),
    mime: 'application/json',
    originalName: 'synthetic.json',
    idempotencyKey: randomUUID(),
    auth: admin.auth,
    ctx
  });
  const input = {
      examId: exam.id,
      assetId: asset.id,
      mappingVersion: 'kitss-results-v1',
      idempotencyKey: randomUUID()
    },
    dry = await f.results.importRecords(input, admin.auth, ctx);
  await f.results.importRecords({
    ...input,
    dryRun: false,
    validationToken: dry.validationToken
  }, admin.auth, ctx);
  const record = (await f.results.list('records')).data[0];
  await f.trusted.changeRecord(record.id, 'publish', {
    expectedRevision: record.expectedRevision
  }, ctx);
  backend = http.createServer();
  await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + name + '/', import.meta.url)),
    optimizeDeps: {
      noDiscovery: true,
      include: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router-dom', 'lucide-react', 'framer-motion', 'html-to-image', 'html2canvas', 'jspdf']
    },
    server: {
      host: '127.0.0.1',
      port: 0,
      hmr: false,
      watch: null,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:' + backend.address().port,
          changeOrigin: true
        }
      }
    },
    logLevel: 'error'
  });
  await vite.listen();
  const base = 'http://127.0.0.1:' + vite.httpServer.address().port;
  f.config.corsOrigins = [base];
  f.config.appPublicUrl = base;
  backend.on('request', f.app(false));
  browser = await chromium.launch({
    executablePath: chrome,
    headless: true
  });
  const context = await browser.newContext({
      viewport: {
        width: 375,
        height: 950
      }
    }),
    page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [],
    external = [];
  page.on('pageerror', e => errors.push(e.message));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin !== base) {
      external.push(url.origin);
      return route.abort();
    }
    return route.continue();
  });
  const goto = path => page.goto(base + path, {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });
  const identity = async actor => {
    await context.clearCookies();
    await context.addCookies([{
      name: actor.user.roles.includes('student') ? 'kitss_student_session' : 'kitss_staff_session',
      value: actor.token,
      url: base,
      httpOnly: true,
      sameSite: 'Lax'
    }]);
  };
  const artifacts = fileURLToPath(new URL('../test-artifacts/', import.meta.url));
  mkdirSync(artifacts, {
    recursive: true
  });
  t.afterEach(async child => {
    if (child.passed === false) await page.screenshot({
      path: artifacts + 'stage8-failure-' + child.name.replace(/[^a-z0-9]/gi, '-') + '.png',
      fullPage: true
    });
  });
  const paid = async kind => {
    const order = await f.service.create({
      product: {
        kind,
        id: kind === 'book' ? d.book.id : d.plan.id
      },
      idempotencyKey: randomUUID()
    }, student.auth, ctx);
    await f.service.startAttempt(order.id, {
      idempotencyKey: randomUUID()
    }, student.auth, ctx);
    const stored = await f.models.Order.findById(order.id),
      payment = f.provider.pay(stored.providerOrderId);
    await f.service.observe(stored._id, payment.id, 'isolated_stage9_fixture', ctx);
  };
  await paid('book');
  await paid('course_plan');
  const university = await f.institutions.create('university', {
    name: 'STAGE9 SYNTHETIC UNIVERSITY',
    shortName: 'STAGE9',
    status: 'active'
  }, ctx);
  const state = await f.institutions.create('taxonomy', {
    kind: 'state',
    key: 'stage9-synthetic-state',
    label: 'STAGE9 SYNTHETIC STATE'
  }, ctx);
  await f.institutions.create('taxonomy', {
    kind: 'district',
    key: 'stage9-synthetic-district',
    label: 'Synthetic district',
    parentIds: [state.id]
  }, ctx);
  const college = await f.institutions.create('college', {
    name: 'STAGE9 SYNTHETIC COLLEGE',
    code: 'STAGE9-TEST',
    universityId: university.id,
    stateId: state.id,
    district: 'Synthetic district',
    address: 'Synthetic campus',
    category: 'Institute',
    city: 'Synthetic',
    status: 'active',
    verification: {
      state: 'verified',
      source: 'Isolated fixture only'
    }
  }, ctx);
  const apiFailures = [];
  let expectedOutage = false;
  page.on('response', response => {
    if (response.url().includes('/api/v1/') && response.status() >= 500 && !(expectedOutage && new URL(response.url()).pathname === '/api/v1/me/enrollments')) apiFailures.push({
      path: new URL(response.url()).pathname,
      status: response.status()
    });
  });
  const manifest = [];
  const resolve = (route, adminRoute) => {
    if (adminRoute) route = '/admin/' + route;
    return route.replace(':collegeId', college.id).replace(':lectureId', d.lesson.id).replace(':bookId', d.book.id).replace(':id', route.startsWith('/books') ? d.book.id : d.course.id);
  };
  const render = async path => {
    await goto(path);
    await page.waitForFunction(async () => {
      const text = document.body.innerText.trim();
      if (!text) return false;
      await new Promise(resolve => setTimeout(resolve, 100));
      return text === document.body.innerText.trim();
    }, null, {
      timeout: 30000
    });
  };
  await check('every registered student route renders or correctly redirects', async () => {
    await identity(student);
    const code = readFileSync(fileURLToPath(new URL('../src/modules/user/routes/UserRoutes.jsx', import.meta.url)), 'utf8');
    for (const match of code.matchAll(/<Route path="([^"*]+)"/g)) {
      const path = resolve(match[1], false);
      await render(path);
      manifest.push({
        route: match[1],
        path,
        portal: 'student',
        finalPath: new URL(page.url()).pathname
      });
    }
    assert.ok(manifest.length >= 35);
  });
  await check('every registered admin section loads with existing permission checks', async () => {
    await identity(admin);
    await render('/admin');
    manifest.push({
      route: '/admin',
      portal: 'admin'
    });
    const code = readFileSync(fileURLToPath(new URL('../src/modules/admin/routes/AdminRoutes.jsx', import.meta.url)), 'utf8');
    for (const match of code.matchAll(/<Route path="([^"*]+)"/g)) {
      const path = resolve(match[1], true);
      await render(path);
      manifest.push({
        route: '/admin/' + match[1],
        path,
        portal: 'admin',
        finalPath: new URL(page.url()).pathname
      });
    }
  });
  await check('payment and official-result production gates remain closed; unpaid learner denied', async () => {
    await identity(other);
    await render('/books/' + d.book.id + '/read');
    await page.getByRole('alert').first().waitFor();
    assert.equal(await page.locator('canvas[data-rendered-page]').count(), 0);
    await render('/coaching/' + d.course.id + '/lecture/' + d.lesson.id);
    await page.getByText(/current verified enrollment|ACCESS_DENIED|Access denied|enrollment/i).first().waitFor();
    await render('/books/' + d.book.id + '/checkout');
    await page.waitForFunction(name => document.querySelector('a[aria-label="User Profile"]')?.title === name, other.user.name);
    await page.getByRole('status').filter({ hasText: 'Payments unavailable:' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Pay .*Access Book/ }).isDisabled(), true);
    const config = await page.evaluate(async () => ({
      payment: (await (await fetch('/api/v1/public/payment-config')).json()).data,
      results: (await (await fetch('/api/v1/results/config')).json()).data
    }));
    assert.equal(config.payment.available, false);
    assert.equal(config.results.publicationEnabled, false);
  });
  await check('My Courses reports API outages instead of inventing an empty library', async () => {
    await identity(student);
    expectedOutage = true;
    await context.route('**/api/v1/me/enrollments*', route => route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'TEST_UNAVAILABLE',
          message: 'Synthetic outage: courses unavailable'
        }
      })
    }));
    await render('/coaching/my-courses');
    await page.getByRole('alert').filter({
      hasText: 'Synthetic outage'
    }).waitFor();
    assert.equal(await page.getByText('No Courses Yet', {
      exact: true
    }).count(), 0);
    await context.unroute('**/api/v1/me/enrollments*');
    expectedOutage = false;
  });
  for (const width of (process.env.KITSS_PROJECT_AUDIT === 'true' ? [320, 375, 390, 414, 768, 1024, 1280, 1440] : [320, 375, 390, 414, 768, 1024, 1440])) await check('header/drawer, protected PDF and lesson at ' + width + 'px', async () => {
    await page.setViewportSize({
      width,
      height: 950
    });
    await identity(student);
    await render('/home');
    await page.locator('a[aria-label="User Profile"]').filter({
      hasText: ''
    }).waitFor();
    await page.waitForFunction(name => document.querySelector('a[aria-label="User Profile"]')?.title === name, student.user.name);
    if (width < 1024) {
      await page.getByRole('button', {
        name: 'Open navigation menu',
        exact: true
      }).click();
      await page.getByRole('button', {
        name: 'Settings',
        exact: true
      }).click();
      await page.waitForURL('**/settings');
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await render('/books/' + d.book.id + '/read');
    await page.locator('canvas[data-rendered-page]').waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if ([320, 1440].includes(width)) await page.screenshot({
      path: artifacts + 'stage9-reader-' + width + '.png',
      fullPage: true
    });
    await render('/coaching/' + d.course.id + '/lecture/' + d.lesson.id);
    await page.getByText(d.lesson.title, {
      exact: true
    }).first().waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await identity(admin);
    await render('/admin');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  });
  if(process.env.KITSS_PROJECT_AUDIT==='true') await check('all admin sections respond at every original-plan width',async()=>{
    await identity(admin);
    for(const item of manifest.filter(r=>r.portal==='admin')) {
      await render(item.path||'/admin');
      for(const width of [320,375,390,414,768,1024,1280,1440]) {
        await page.setViewportSize({width,height:950});
        await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth,null,{timeout:5000});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),(item.path||'/admin')+' at '+width);
      }
    }
  });
  writeFileSync(process.env.KITSS_PROJECT_AUDIT === 'true' ? 'backend/FINAL-PROJECT-ROUTE-VERIFICATION.json' : process.env.KITSS_STAGE10_ROUTE_AUDIT === 'true' ? 'backend/STAGE10-ROUTE-VERIFICATION.json' : focus ? 'backend/STAGE9-GATE-VERIFICATION.json' : 'backend/STAGE9-ROUTE-VERIFICATION.json', JSON.stringify({
    routes: manifest,
    ...(process.env.KITSS_PROJECT_AUDIT==='true'?{adminWidths:[320,375,390,414,768,1024,1280,1440]}:{}),
    pageErrors: errors,
    unexpectedApiFailures: apiFailures
  }, null, 2));
  assert.deepEqual(errors, []);
  assert.deepEqual(apiFailures, []);
  assert.deepEqual(external.filter(u => u.includes('razorpay')), []);
});
