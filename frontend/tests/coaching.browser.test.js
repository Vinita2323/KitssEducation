import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { coachingFixture } from '../../backend/tests/coaching-fixture.js';
const dbName = process.env.KITSS_STAGE7_BROWSER_DB,
  chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 7 coaching and readers with real HTTP/MongoDB; fake providers only in fixture', {
  skip: !dbName ? 'No isolated browser database' : !existsSync(chrome) ? 'Chrome unavailable' : false,
  timeout: 600000
}, async t => {
  const f = await coachingFixture(dbName);
  let vite, backend, browser;
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
  const readonly = await f.fixtureUser(['admin'], ['learning.read', 'commerce.read']);
  const supportActor = await f.fixtureUser(['student']);
  const supportOrder = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, supportActor.auth, f.ctx);
  await f.service.startAttempt(supportOrder.id, { idempotencyKey: randomUUID() }, supportActor.auth, f.ctx);
  const supportRow = await f.models.Order.findById(supportOrder.id);
  const supportPayment = f.provider.pay(supportRow.providerOrderId);
  await f.service.observe(supportRow._id, supportPayment.id, 'isolated_support_fixture', f.ctx);
  const layoutCourse = await f.learning.mutate('courses', null, null, { title: 'STAGE7_SYNTHETIC_RESPONSIVE_DRAFT', syllabus: [{ key: 'layout', title: 'Synthetic layout section', sortOrder: 0 }] }, d.admin.auth, f.ctx);
  const bookOrder = await f.service.create({ product: { kind: 'book', id: d.book.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
  await f.service.startAttempt(bookOrder.id, { idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
  const bookRow = await f.models.Order.findById(bookOrder.id);
  const bookPayment = f.provider.pay(bookRow.providerOrderId);
  await f.service.observe(bookRow._id, bookPayment.id, 'isolated_book_fixture', f.ctx);
  const order = await f.service.create({
    product: {
      kind: 'course_plan',
      id: d.plan.id
    },
    idempotencyKey: randomUUID()
  }, d.student.auth, f.ctx);
  await f.service.startAttempt(order.id, {
    idempotencyKey: randomUUID()
  }, d.student.auth, f.ctx);
  const row = await f.models.Order.findById(order.id),
    payment = f.provider.pay(row.providerOrderId);
  await f.service.observe(row._id, payment.id, 'isolated_browser_fixture', f.ctx);
  backend = http.createServer();
  await new Promise(r => backend.listen(0, '127.0.0.1', r));
  vite = await createServer({
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: fileURLToPath(new URL('../test-artifacts/vite-' + dbName + '/', import.meta.url)),
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
  backend.on('request', f.app());
  browser = await chromium.launch({
    executablePath: chrome,
    headless: true
  });
  const context = await browser.newContext({
      viewport: {
        width: 390,
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
    if (actor) await context.addCookies([{
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
      path: artifacts + 'stage7-failure-' + child.name.replace(/[^a-z0-9]/gi, '-') + '.png',
      fullPage: true
    });
  });
  await t.test('published catalogue, literal search, details, public syllabus and approved plans', async () => {
    await identity(null);
    await goto('/coaching');
    await page.getByText(d.course.title, {
      exact: true
    }).first().waitFor();
    const search = page.getByPlaceholder('Search by title, subject (Physics, Math), board...');
    await search.fill('NO_SUCH_STAGE7_COURSE');
    await page.getByText(d.course.title, {
      exact: true
    }).first().waitFor({
      state: 'detached'
    });
    await search.fill('');
    await page.getByText(d.course.title, {
      exact: true
    }).first().waitFor();
    await goto('/coaching/' + d.course.id);
    await page.getByRole('heading', {
      name: 'Course syllabus',
      exact: true
    }).waitFor();
    await page.getByText('Synthetic authored learning outcome',{exact:true}).waitFor();
    await page.getByText('Synthetic authored course benefit',{exact:true}).waitFor();
    await page.getByLabel('Selected plan benefits',{exact:true}).getByText('Synthetic authored plan benefit',{exact:true}).waitFor();
    await page.getByText(/STAGE7_SYNTHETIC_LESSON.*Enrollment required/).waitFor();
    await page.getByRole('link', {
      name: /STAGE7_SYNTHETIC_PREVIEW/
    }).waitFor();
    assert.equal(external.filter(x => x.includes('razorpay')).length, 0);
  });
  await t.test('owned course dashboard, actual authored lesson and explicit completion persistence', async () => {
    await identity(d.student);
    await goto('/coaching/my-courses');
    await page.getByText(d.course.title, {
      exact: true
    }).first().waitFor();
    await goto('/coaching/' + d.course.id + '/dashboard');
    await page.getByText('Access Active', {
      exact: true
    }).waitFor();
    await goto('/coaching/' + d.course.id + '/lecture/' + d.lesson.id);
    await page.getByText('Generated isolated test content only', {
      exact: true
    }).waitFor();
    const completed = page.waitForResponse(r => r.url().includes('/me/lessons/') && r.request().method() === 'PUT');
    await page.getByRole('button', {
      name: 'Mark as Completed',
      exact: true
    }).click();
    assert.equal((await completed).status(), 200);
    await page.getByRole('button', {
      name: /^Completed/
    }).first().waitFor();
    const p = await f.models.LearningProgress.findOne({
      userId: d.student.user._id,
      lessonId: d.lesson.id
    });
    assert.equal(p.status, 'completed');
    await page.reload({
      waitUntil: 'domcontentloaded'
    });
    await page.getByRole('button', {
      name: /^Completed/
    }).first().waitFor();
    await goto('/coaching/' + d.course.id + '/player?lesson=' + d.lesson.id);
    await page.getByText('Generated isolated test content only', {
      exact: true
    }).waitFor();
    await page.getByRole('button', {
      name: 'PDF Notes',
      exact: true
    }).click();
    await page.getByRole('link', {
      name: 'Open authorized lesson PDF',
      exact: true
    }).waitFor();
    await page.getByRole('button', {
      name: 'Chapter Tests',
      exact: true
    }).click();
    await page.getByText('Assessments are not implemented. No test, ranking or certificate is issued.', {
      exact: true
    }).waitFor();
  });
  await t.test('actual PDF, saved page, bookmark, refresh and wishlist persistence', async () => {
    await goto('/coaching/' + d.course.id + '/book/' + d.book.id);
    await page.locator('canvas[data-rendered-page]').waitFor();
    const saved = page.waitForResponse(r => r.url().includes('/progress') && r.request().method() === 'PUT');
    await page.getByRole('button', {
      name: 'Next page',
      exact: true
    }).click();
    assert.equal((await saved).status(), 200);
    const bookmark = page.waitForResponse(r => r.url().includes('/bookmarks/2') && r.request().method() === 'PUT');
    await page.getByRole('button', {
      name: 'Toggle bookmark',
      exact: true
    }).click();
    assert.equal((await bookmark).status(), 200);
    await page.reload({
      waitUntil: 'domcontentloaded'
    });
    await page.locator('canvas[data-rendered-page]').waitFor();
    assert.equal(await page.getByRole('spinbutton', {
      name: 'PDF page',
      exact: true
    }).inputValue(), '2');
    assert.equal(await page.locator('canvas[data-rendered-page]').getAttribute('data-rendered-page'),'2');
    assert.equal(await page.locator('canvas[data-rendered-page]').evaluate(canvas=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<220&&pixels[i+1]<220&&pixels[i+2]<220&&pixels[i+3]>0)return true;return false;}),true);
    assert.equal(await page.getByRole('button', {
      name: 'Toggle bookmark',
      exact: true
    }).getAttribute('aria-pressed'), 'true');
    await goto('/books/' + d.book.id);
    const button = page.getByRole('button', {
      name: /wishlist/i
    });
    await page.waitForFunction(name=>document.querySelector('a[aria-label="User Profile"]')?.title===name,d.student.user.name);
    const [wished] = await Promise.all([page.waitForResponse(r => r.url().includes('/wishlist') && r.request().method() === 'PUT'),button.click()]);
    assert.equal(wished.status(), 200);
    assert.equal(await f.models.LearningProgress.countDocuments({
      userId: d.student.user._id,
      bookId: d.book.id,
      wishlisted: true
    }), 1);
    await goto('/books/' + d.book.id + '/read');
    await page.locator('canvas[data-rendered-page]').waitFor();
    assert.equal(await page.getByRole('spinbutton', { name: 'PDF page', exact: true }).inputValue(), '2');
    await goto('/my-books');
    await page.getByRole('link', { name: 'Open secure PDF', exact: true }).waitFor();
  });
  let draft;
  await t.test('admin course create, revisioned edit, lesson and explicit plan management', async () => {
    await identity(d.admin);
    await goto('/admin/coaching');
    await page.getByRole('heading', {
      name: 'Coaching Management',
      exact: true
    }).waitFor();
    await page.getByRole('button', {
      name: 'Add course',
      exact: true
    }).click();
    await page.getByLabel('Course title', {
      exact: true
    }).fill('STAGE7_BROWSER_CREATED_DRAFT');
    await page.getByLabel('Learning outcomes',{exact:true}).fill('Browser authored outcome');
    await page.getByLabel('Course benefits',{exact:true}).fill('Browser authored course benefit');
    await page.getByRole('button', {
      name: 'Add section',
      exact: true
    }).click();
    await page.getByLabel('Section title 1', {
      exact: true
    }).fill('Created section');
    await page.getByRole('button', {
      name: 'Save course',
      exact: true
    }).click();
    await page.getByText('STAGE7_BROWSER_CREATED_DRAFT', { exact: true }).waitFor();
    draft = await f.models.Course.findOne({
      title: 'STAGE7_BROWSER_CREATED_DRAFT'
    });
    assert.equal(draft.syllabus[0].key, 'created-section', 'section keys are generated from titles');
    assert.deepEqual(draft.whatYouWillLearn.toObject(),['Browser authored outcome']);
    const tr = page.getByRole('row').filter({
      hasText: 'STAGE7_BROWSER_CREATED_DRAFT'
    });
    await tr.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Description', { exact: true }).fill('Updated synthetic draft description');
    const courseEdit = page.waitForResponse(r => r.url().endsWith('/coaching/courses/' + draft.id) && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save course', exact: true }).click();
    assert.equal((await courseEdit).status(), 200);
    await page.getByRole('heading', { name: 'Edit course', exact: true }).waitFor({ state: 'detached' });
    await tr.getByRole('button', {
      name: 'Manage lessons',
      exact: true
    }).click();
    await page.getByRole('button', {
      name: 'Add lesson',
      exact: true
    }).click();
    await page.getByLabel('Lesson title', {
      exact: true
    }).fill('STAGE7_BROWSER_CREATED_LESSON');
    await page.getByLabel('Syllabus section', {
      exact: true
    }).selectOption({ label: 'Created section' });
    await page.getByLabel('Authored lesson content', {
      exact: true
    }).fill('Synthetic browser-created draft only');
    await page.getByRole('button', {
      name: 'Save lesson',
      exact: true
    }).click();
    await page.getByRole('cell', {
      name: 'STAGE7_BROWSER_CREATED_LESSON',
      exact: true
    }).waitFor();
    const lessonRow = page.getByRole('row').filter({ hasText: 'STAGE7_BROWSER_CREATED_LESSON' });
    await lessonRow.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Summary', { exact: true }).fill('Updated synthetic lesson summary');
    const lessonEdit = page.waitForResponse(r => r.url().includes('/lessons/') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save lesson', exact: true }).click();
    assert.equal((await lessonEdit).status(), 200);
    await page.getByRole('heading', { name: 'Edit lesson', exact: true }).waitFor({ state: 'detached' });
    await page.getByRole('button', {
      name: 'Course plans',
      exact: true
    }).click();
    await page.getByRole('button', {
      name: 'Add plan',
      exact: true
    }).click();
    await page.getByLabel('Plan name', {
      exact: true
    }).fill('STAGE7_BROWSER_UNCONFIGURED_PLAN');
    await page.getByLabel('Plan benefits',{exact:true}).fill('Browser authored plan benefit');
    await page.getByLabel('Highlight this plan',{exact:true}).check();
    await page.getByRole('button', {
      name: 'Save plan',
      exact: true
    }).click();
    await page.getByRole('cell', {
      name: 'STAGE7_BROWSER_UNCONFIGURED_PLAN',
      exact: true
    }).waitFor();
    assert.equal((await f.models.CoursePlan.findOne({
      courseId: draft._id
    })).rulesApproved, false);
    const planRow = page.getByRole('row').filter({ hasText: 'STAGE7_BROWSER_UNCONFIGURED_PLAN' });
    await planRow.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByLabel('Plan price (₹)', { exact: true }).fill('15');
    await page.getByLabel('Access duration', { exact: true }).fill('5');
    await page.getByLabel('Duration unit', { exact: true }).selectOption('days');
    await page.getByRole('region', { name: 'Plan preview' }).getByText('₹15', { exact: true }).waitFor();
    await page.getByLabel('Plan status', { exact: true }).selectOption('active');
    const planEdit = page.waitForResponse(r => r.url().includes('/plans/') && r.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Save plan', exact: true }).click();
    assert.equal((await planEdit).status(), 200);
    await page.getByRole('heading', { name: 'Edit plan', exact: true }).waitFor({ state: 'detached' });
    assert.equal((await f.models.CoursePlan.findOne({ courseId: draft._id })).priceMinor, 1500);
    const editorialPlan=await f.models.CoursePlan.findOne({courseId:draft._id});assert.deepEqual(editorialPlan.features.toObject(),['Browser authored plan benefit']);assert.equal(editorialPlan.popular,true);assert.equal(editorialPlan.durationDays,5);assert.equal(editorialPlan.rulesApproved,true);assert.equal(editorialPlan.eligibility,'verified_account');
    const planArchive = page.waitForResponse(r => r.url().includes('/plans/') && r.request().method() === 'DELETE');
    await planRow.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('dialog', { name: 'Archive plan?' }).getByRole('button', { name: 'Yes, archive', exact: true }).click();
    assert.equal((await planArchive).status(), 200);
    await page.getByRole('button', { name: 'Lessons', exact: true }).click();
    await lessonRow.getByRole('button', { name: 'Archive', exact: true }).waitFor();
    const lessonArchive = page.waitForResponse(r => r.url().includes('/lessons/') && r.request().method() === 'DELETE');
    await lessonRow.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('dialog', { name: 'Archive lesson?' }).getByRole('button', { name: 'Yes, archive', exact: true }).click();
    assert.equal((await lessonArchive).status(), 200);
    await page.getByRole('button', { name: 'All courses', exact: true }).click();
    // An incomplete course shows its checklist instead of sending a doomed publish request.
    let published = 0; const countPublish = r => { if (r.url().endsWith('/publish') && r.method() === 'POST') published++; }; page.on('request', countPublish);
    await tr.getByRole('button', { name: 'Publish', exact: true }).click();
    const notReady = page.getByRole('dialog', { name: 'Course is not ready to publish' });
    await notReady.getByText('Missing: At least one published lesson', { exact: true }).waitFor();
    await notReady.getByRole('button', { name: 'Cancel', exact: true }).click(); page.off('request', countPublish); assert.equal(published, 0);
    const courseArchive = page.waitForResponse(r => r.url().endsWith('/coaching/courses/' + draft.id) && r.request().method() === 'DELETE');
    await tr.getByRole('button', { name: 'Archive', exact: true }).click();
    await page.getByRole('dialog', { name: 'Archive course?' }).getByRole('button', { name: 'Yes, archive', exact: true }).click();
    assert.equal((await courseArchive).status(), 200);
    assert.equal((await f.models.Course.findById(draft._id)).status, 'archived');
  });
  await t.test('admin enrollment review and revocation preserve payment truth', async () => {
    await f.service.business.save({ value: { manualAccess: { approved: false, paidRevocationApproved: true, description: 'Isolated browser support policy' } }, expectedRevision: 0, reason: 'Explicit synthetic browser revocation acceptance' }, d.admin.auth, f.ctx);
    await goto('/admin/enrollments');
    await page.getByRole('heading', {
      name: 'Enrollment Review',
      exact: true
    }).waitFor();
    const support = page.getByRole('row').filter({ hasText: supportOrder.id });
    await support.getByRole('button', { name: 'Revoke access', exact: true }).waitFor();
    page.once('dialog', dialog => dialog.accept('Synthetic support revocation test'));
    const revoked = page.waitForResponse(r => r.url().includes('/revoke') && r.request().method() === 'POST');
    await support.getByRole('button', { name: 'Revoke access', exact: true }).click();
    assert.equal((await revoked).status(), 200);
    assert.equal((await f.learning.enrollment(d.course.id, supportActor.auth, false)).state, 'revoked');
    assert.equal((await f.models.Order.findById(supportOrder.id)).status, 'captured');
    assert.equal(await f.models.Enrollment.countDocuments({
      orderId: order.id
    }), 1);
    assert.equal((await f.models.Order.findById(order.id)).status, 'captured');
  });
  await t.test('cross-account denial and invalid hierarchy do not display unrelated content', async () => {
    await identity(readonly);
    await goto('/admin/coaching');
    await page.getByRole('heading', { name: 'Coaching Management', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add course', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Publish', exact: true }).count(), 0);
    await identity(d.other);
    await goto('/coaching/' + d.course.id + '/book/' + d.book.id);
    await page.getByRole('heading', {
      name: 'Book unavailable',
      exact: true
    }).waitFor();
    assert.equal(await page.locator('canvas[data-rendered-page]').count(), 0);
    await goto('/coaching/' + d.course.id + '/lecture/' + randomUUID().replaceAll('-', '').slice(0, 24));
    await page.getByRole('heading', {
      name: 'Lecture Not Found',
      exact: true
    }).waitFor();
    assert.equal(await page.getByText('Generated isolated test content only', {
      exact: true
    }).count(), 0);
  });
  for (const width of (process.env.KITSS_BROWSER_WORKFLOWS_ONLY === 'true' ? [] : [320, 375, 390, 414, 768, 1024, 1440])) await t.test('Stage 7 responsive catalogue/player/reader/admin at ' + width + 'px', async () => {
    await page.setViewportSize({
      width,
      height: 950
    });
    await identity(d.student);
    for (const path of ['/coaching', '/coaching/select?choose=1', '/coaching/my-courses', '/coaching/' + d.course.id, '/coaching/' + d.course.id + '/subscribe', '/coaching/' + d.course.id + '/dashboard', '/coaching/' + d.course.id + '/lecture/' + d.lesson.id, '/coaching/' + d.course.id + '/player?lesson=' + d.lesson.id, '/books/' + d.book.id + '/read', '/coaching/' + d.course.id + '/book/' + d.book.id]) {
      await goto(path);
      await page.locator('main').first().waitFor();
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.locator('canvas[data-rendered-page]').waitFor();
    if ([320, 1440].includes(width)) await page.screenshot({
      path: artifacts + 'stage7-reader-' + width + '.png',
      fullPage: true
    });
    await identity(d.admin);
    for (const path of ['/admin/coaching', '/admin/enrollments']) {
      await goto(path);
      await page.locator('main').first().waitFor();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (path === '/admin/coaching') {
        await page.getByRole('button', { name: 'Add course', exact: true }).click();
        await page.getByLabel('Course title', { exact: true }).waitFor();
        assert.ok(await page.locator('form').first().evaluate(form => form.scrollWidth <= form.clientWidth));
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        const layout = page.getByRole('row').filter({ hasText: layoutCourse.title });
        await layout.getByRole('button', { name: 'Manage lessons', exact: true }).click();
        await page.getByRole('button', { name: 'Add lesson', exact: true }).click();
        await page.getByLabel('Lesson title', { exact: true }).waitFor();
        assert.ok(await page.locator('form').first().evaluate(form => form.scrollWidth <= form.clientWidth));
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.getByRole('button', { name: 'Course plans', exact: true }).click();
        await page.getByRole('button', { name: 'Add plan', exact: true }).click();
        await page.getByLabel('Plan name', { exact: true }).waitFor();
        assert.ok(await page.locator('form').first().evaluate(form => form.scrollWidth <= form.clientWidth));
        if ([320, 1440].includes(width)) await page.screenshot({ path: artifacts + 'stage7-admin-plan-' + width + '.png', fullPage: true });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      }
    }
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(external.filter(x => x.includes('razorpay')), []);
});
