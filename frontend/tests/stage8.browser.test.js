import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';
import { hashPassword } from '../../backend/src/modules/auth/security.js';
const name = process.env.KITSS_STAGE8_BROWSER_DB,
  chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 8 real API/Mongo browser; synthetic source/mail only', {
  skip: !name ? 'No isolated Stage 8 browser database' : !existsSync(chrome) ? 'Chrome unavailable' : false,
  timeout: 900000
}, async t => {
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
  const admin = await f.fixtureUser(),
    student = await f.fixtureUser(['student']),
    other = await f.fixtureUser(['student']),
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
  let record = (await f.results.list('records')).data[0];
  const approvalCtx = { ...ctx, actorId: admin.user.publicId };
  record = await f.trusted.changeRecord(record.id, 'submit', { expectedRevision: record.expectedRevision, reason: 'Synthetic review submission' }, approvalCtx);
  record = await f.trusted.changeRecord(record.id, 'approve', { expectedRevision: record.expectedRevision, reason: 'Synthetic main admin approval' }, approvalCtx);
  await f.trusted.changeRecord(record.id, 'publish', {
    expectedRevision: record.expectedRevision
  }, approvalCtx);
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
  backend.on('request', f.app(true));
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
  const check = async (title, work) => {
    if (process.env.KITSS_STAGE8_BROWSER_FOCUS && !new RegExp(process.env.KITSS_STAGE8_BROWSER_FOCUS).test(title)) return;
    await t.test(title, work);
  };
  await check('exact owned synthetic result displays stored marks and exports PDF', async () => {
    await identity(student);
    await goto('/results');
    await page.getByLabel('Result issuer').selectOption(issuer.id);
    await page.getByLabel('Result exam').selectOption(exam.id);
    await page.getByLabel('Roll number', {
      exact: true
    }).fill(row.rollNumber);
    await page.getByLabel('Date of birth').fill('2000-01-01');
    await page.getByRole('button', {
      name: 'Check result',
      exact: true
    }).click();
    await page.getByText(row.student.name, {
      exact: true
    }).waitFor();
    assert.ok((await page.locator('#printable-marksheet').innerText()).includes('82 / 100'));
    assert.equal(await page.getByText('Verified & Digitally Signed', {
      exact: true
    }).count(), 0);
    const download = page.waitForEvent('download');
    await page.getByRole('button', {
      name: /Download/
    }).click();
    assert.ok((await download).suggestedFilename().endsWith('.pdf'));
    await page.emulateMedia({
      media: 'print'
    });
    assert.ok(await page.locator('#printable-marksheet').isVisible());
    await page.emulateMedia({
      media: 'screen'
    });
  });
  await check('admin issuer configuration and targeted notification publication', async () => {
    await identity(admin);
    await goto('/admin/results');
    await page.getByRole('button', {
      name: 'Add issuer',
      exact: true
    }).click();
    await page.getByLabel('key', {
      exact: true
    }).fill('synthetic-created');
    await page.getByLabel('name', {
      exact: true
    }).fill('SYNTHETIC CREATED ISSUER');
    await page.getByLabel('fullName', {
      exact: true
    }).fill('SYNTHETIC CREATED ISSUER FULL');
    await page.getByRole('button', {
      name: 'Save configuration',
      exact: true
    }).click();
    await page.getByRole('cell', {
      name: /SYNTHETIC CREATED ISSUER/
    }).waitFor();
    await goto('/admin/notifications');
    await page.getByRole('button', {
      name: 'Compose notification',
      exact: true
    }).click();
    await page.getByLabel('Notification title', {
      exact: true
    }).fill('SYNTHETIC BROWSER NOTICE');
    await page.getByLabel('Notification message', {
      exact: true
    }).fill('Isolated recipient test');
    await page.getByLabel('Notification audience').selectOption('users');
    await page.getByLabel('Notification recipients').fill(String(student.user._id));
    await page.getByRole('button', {
      name: 'Save notification draft',
      exact: true
    }).click();
    const tr = page.getByRole('row').filter({
      hasText: 'SYNTHETIC BROWSER NOTICE'
    });
    await tr.waitFor();
    page.once('dialog', dialog => dialog.accept());
    await tr.getByRole('button', {
      name: 'Publish',
      exact: true
    }).click();
    await tr.getByRole('cell', {
      name: 'published',
      exact: true
    }).waitFor();
  });
  await check('recipient read state survives reload and other account sees nothing', async () => {
    await identity(student);
    await goto('/notifications');
    const response = page.waitForResponse(r => r.url().includes('/read') && r.request().method() === 'PUT');
    await page.getByText('SYNTHETIC BROWSER NOTICE', {
      exact: true
    }).click();
    assert.equal((await response).status(), 200);
    await page.reload();
    await page.getByText('SYNTHETIC BROWSER NOTICE', {
      exact: true
    }).waitFor();
    assert.equal((await f.notifications.list({}, student.auth)).meta.unreadCount, 0);
    await identity(other);
    await goto('/notifications');
    await page.getByText('All Caught Up', {
      exact: true
    }).waitFor();
    assert.equal(await page.getByText('SYNTHETIC BROWSER NOTICE', {
      exact: true
    }).count(), 0);
  });
  await check('notification header count and mark-all persist together', async () => {
    for (const title of ['STAGE9 UNREAD A', 'STAGE9 UNREAD B']) {
      const draft = await f.notifications.mutate(null, {title,message:'Isolated mark-all test',category:'general',audience:{kind:'users',userIds:[String(student.user._id)]}},ctx);
      await f.notifications.publish(draft.id,{expectedRevision:draft.revision},ctx);
    }
    await identity(student); await goto('/home');
    await page.locator('a[aria-label="Notifications"][title="2 unread notifications"]').waitFor();
    await page.getByRole('link',{name:'Notifications',exact:true}).click();
    await page.getByText('STAGE9 UNREAD A',{exact:true}).waitFor();
    const response=page.waitForResponse(r=>r.url().includes('/notifications/read-all')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'Mark all read',exact:true}).click();assert.equal((await response).status(),200);
    await page.getByRole('button',{name:'Mark all read',exact:true}).waitFor({state:'detached'});
    await goto('/home');await page.locator('a[aria-label="Notifications"][title="0 unread notifications"]').waitFor();
    await page.reload();await page.locator('a[aria-label="Notifications"][title="0 unread notifications"]').waitFor();
  });
  await check('long notification text is inert, keyboard readable and optional push never prompts', async () => {
    await identity(student);
    const draft = await f.notifications.mutate(null, { title: 'SYNTHETIC LONG NOTICE', message: '<script>window.__noticeXss = true</script> ' + 'Long content '.repeat(200), category: 'general', audience: { kind: 'users', userIds: [String(student.user._id)] }, link: '/notifications' }, ctx);
    await f.notifications.publish(draft.id, { expectedRevision: draft.revision }, ctx);
    await goto('/notifications');
    const item = page.getByRole('button').filter({ hasText: 'SYNTHETIC LONG NOTICE' });
    await item.waitFor(); await item.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[aria-disabled="true"]'));
    assert.equal(await page.evaluate(() => window.__noticeXss), undefined);
    assert.equal(await page.getByRole('button', { name: 'Enable Push', exact: true }).count(), 0);
    assert.equal((await f.notifications.list({}, student.auth)).data.find(n => n.title === 'SYNTHETIC LONG NOTICE').isRead, true);
  });
  await check('denied or unavailable browser push leaves in-app notifications accessible', async () => {
    await identity(student); await goto('/notifications');
    await page.evaluate(() => { if ('Notification' in window) Object.defineProperty(Notification, 'permission', { configurable: true, get: () => 'denied' }); });
    await page.getByRole('heading', { name: 'Notifications', exact: true }).waitFor();
    assert.equal(await page.evaluate(async () => (await import('/src/modules/user/services/pushNotificationService.js')).getNotificationPermission()), 'denied');
    assert.equal(await page.getByRole('button', { name: 'Enable Push', exact: true }).count(), 0);
    await page.evaluate(() => { Object.defineProperty(window, 'Notification', { configurable: true, value: undefined }); });
    assert.equal(await page.evaluate(async () => (await import('/src/modules/user/services/pushNotificationService.js')).getNotificationPermission()), 'unsupported');
    await page.getByRole('heading', { name: 'Notifications', exact: true }).waitFor();
  });
  await check('existing registration book coaching and admin navigation remain usable', async () => {
    await identity(student);
    for (const path of ['/register', '/books', '/coaching', '/orders']) {
      await goto(path);
      await page.locator('main').first().waitFor({ timeout: 60000 }).catch(error => {
        throw new Error('Expected main content on ' + path, { cause: error });
      });
      assert.equal(new URL(page.url()).pathname, path);
      assert.equal(await page.getByRole('heading', { name: /Not found/i }).count(), 0);
    }
    await identity(admin); await goto('/admin/notifications');
    await page.getByRole('button', { name: 'Compose notification', exact: true }).waitFor();
    await goto('/admin/operations');
    await page.getByLabel('Job kind').selectOption('notification_push');
    const jobsResponse = page.waitForResponse(r => r.url().includes('/admin/jobs?') && r.url().includes('notification_push'));
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    assert.equal((await jobsResponse).status(), 200);
    const logoutActor = await f.fixtureUser(['student']);
    await identity(logoutActor); await goto('/profile');
    await page.getByRole('button', { name: 'Logout', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Logout', exact: true }).click();
    await page.waitForURL('**/login');
    assert.equal(await f.auth.authenticate(logoutActor.token, 'student'), null);
  });
  await check('notification errors do not claim All Caught Up', async () => {
    await identity(student);
    await context.route('**/api/v1/me/notifications?*', route => route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'TEST_UNAVAILABLE',message:'Synthetic notice outage'}})}));
    await goto('/notifications');await page.getByRole('alert').filter({hasText:'Synthetic notice outage'}).waitFor();
    assert.equal(await page.getByText('All Caught Up',{exact:true}).count(),0);
    await context.unroute('**/api/v1/me/notifications?*');
  });
  await check('profile and preferences persist after refresh', async () => {
    await identity(student);
    await goto('/profile');
    await page.getByRole('button', {
      name: 'Edit Profile',
      exact: true
    }).click();
    await page.getByLabel('Profile full name').fill('SYNTHETIC PERSISTED NAME');
    await page.getByLabel('Profile phone').fill('+91 1234567890');
    const savedProfile = page.waitForResponse(r => r.url().includes('/me/profile') && r.request().method() === 'PATCH');
    await page.getByRole('button', {
      name: 'Save Changes',
      exact: true
    }).click();
    assert.equal((await savedProfile).status(), 200);
    await page.getByText('Profile updated successfully!', {
      exact: true
    }).waitFor();
    await page.reload();
    await page.getByText('SYNTHETIC PERSISTED NAME', {
      exact: true
    }).first().waitFor();
    await goto('/settings');
    const save = page.getByRole('button', {
      name: 'Save preferences',
      exact: true
    });
    await save.waitFor();
    await page.getByRole('button', {
      name: 'Save preferences',
      exact: true
    }).waitFor();
    await page.waitForFunction(() => {
      const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Save preferences');
      return button && !button.disabled;
    });
    await page.getByRole('checkbox').first().uncheck();
    const response = page.waitForResponse(r => r.url().includes('/me/preferences') && r.request().method() === 'PATCH');
    await save.click();
    assert.equal((await response).status(), 200);
    await page.reload();
    await page.getByRole('button', {
      name: 'Save preferences',
      exact: true
    }).waitFor();
    await page.waitForFunction(() => {
      const button = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Save preferences');
      return button && !button.disabled;
    });
    assert.equal(await page.getByRole('checkbox').first().isChecked(), false);
  });
  await check('operational diagnostics, queue controls, keyboard refresh and permission denial', async () => {
    await identity(admin); await goto('/admin/operations');
    const region = page.getByRole('region', { name: 'Operational readiness', exact: true });
    await region.getByText('Database', { exact: true }).waitFor();
    assert.doesNotMatch(await region.innerText(), /PRIVATE_|password|[A-Z]:\\/);
    await page.getByLabel('Job kind').selectOption('notification_push');
    const filtered = page.waitForResponse(r => r.url().includes('/admin/jobs?') && r.url().includes('notification_push'));
    await page.getByRole('button', { name: 'Apply filters', exact: true }).focus(); await page.keyboard.press('Enter');
    assert.equal((await filtered).status(), 200);
    await context.route('**/api/v1/admin/operations/health', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'TEST_UNAVAILABLE', message: 'Synthetic diagnostics outage' } }) }));
    await page.reload(); await region.getByRole('alert').filter({ hasText: 'Synthetic diagnostics outage' }).waitFor();
    await context.unroute('**/api/v1/admin/operations/health');
    await page.getByRole('button', { name: 'Reset / refresh', exact: true }).focus(); await page.keyboard.press('Enter');
    await region.getByText('Database', { exact: true }).waitFor();
    const denied = await f.fixtureUser(['admin'], ['notifications.read']); await identity(denied);
    assert.equal((await context.request.get(base + '/api/v1/admin/operations/health')).status(), 403);
    await identity(admin);
  });
  for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440]) await check('mobile/desktop Stage 8 pages and admin forms at ' + width, async () => {
    await page.setViewportSize({
      width,
      height: 950
    });
    await identity(student);
    for (const path of ['/results', '/notifications', '/profile', '/settings']) {
      await goto(path);
      await page.locator('main').first().waitFor();
      await page.waitForTimeout(200);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await identity(admin);
    for (const path of ['/admin/results', '/admin/operations', '/admin/media', '/admin/registrations', '/admin/notifications']) {
      await goto(path);
      await page.locator('main').first().waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.getByRole('button', {
      name: 'Compose notification',
      exact: true
    }).click();
    await page.getByLabel('Notification title', {
      exact: true
    }).waitFor();
    assert.ok(await page.locator('form').first().evaluate(f => f.scrollWidth <= f.clientWidth));
    await page.screenshot({
      path: artifacts + 'stage8-admin-' + width + '.png',
      fullPage: true
    });
  });
  await check('email-change form confirms fake SMTP proof and signs out', async () => {
    await identity(student);
    await goto('/settings');
    await page.getByLabel('New email', {
      exact: true
    }).fill('stage8-browser-' + randomUUID() + '@example.invalid');
    await page.getByLabel('Email change password').fill('SyntheticPassword123!');
    await page.getByRole('button', {
      name: 'Send confirmation code',
      exact: true
    }).click();
    await page.getByLabel('Email confirmation code').waitFor();
    await page.getByLabel('Email confirmation code').fill(f.messages.at(-1).code);
    await page.getByRole('button', {
      name: 'Confirm email change',
      exact: true
    }).click();
    await page.waitForURL('**/login');
    assert.equal(await f.auth.authenticate(student.token, 'student'), null);
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(external.filter(u => u.includes('razorpay')), []);
});
