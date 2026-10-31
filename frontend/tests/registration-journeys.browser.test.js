import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { commerceFixture } from '../../backend/tests/commerce-fixture.js';
import { imageBytes, pdfBytes } from '../../backend/tests/publishing-fixture.js';
const db = process.env.KITSS_REGISTRATION_BROWSER_DB;
test('inline account creation, all three applications, owner tracking and admin teacher publication (isolated real HTTP/database)', { skip: !db, timeout: 300000 }, async t => {
  const mail = { configured: true, messages: [], async send(message) { this.messages.push(message); } };
  const f = await commerceFixture(db, { mail }); let vite, browser, server;
  t.after(async () => { await browser?.close(); await vite?.close(); if (server) await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); await f.close(); });
  const admin = await f.fixtureUser();
  const policy = { status: 'active', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [], privacyApproved: true, documentsApproved: true };
  await f.service.business.save({ expectedRevision: 0, reason: 'Explicit synthetic browser rules', value: { registrations: { study: {...policy,documents:[{key:'courseCertificate',label:'Study certificate',required:true}]}, tuition: policy, teacher: policy } } }, admin.auth, f.ctx);
  for (const [kind,label] of [['state','Synthetic State'],['class','Synthetic Class'],['board','Synthetic Board'],['program','Synthetic Program'],['language','Synthetic Language'],['experience','Synthetic Experience']]) await f.institutions.create('taxonomy',{kind,key:randomUUID(),label,status:'active'},f.ctx);
  server = http.createServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  vite = await createServer({ root: fileURLToPath(new URL('../', import.meta.url)), server: { host: '127.0.0.1', port: 0, hmr: false, watch: null, proxy: { '/api': { target: 'http://127.0.0.1:' + server.address().port, changeOrigin: true } } }, logLevel: 'error' }); await vite.listen();
  const base = 'http://127.0.0.1:' + vite.httpServer.address().port; f.config.corsOrigins = [base]; f.config.appPublicUrl = base; server.on('request', f.app());
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const staff = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await staff.addCookies([{ name: 'kitss_staff_session', value: admin.token, url: base, httpOnly: true, sameSite: 'Lax' }]);
  for (const c of [context, staff]) await c.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  const page = await context.newPage(), panel = await staff.newPage(), errors = [];
  for (const p of [page, panel]) { p.setDefaultTimeout(30000); p.on('pageerror', error => errors.push(error.message)); }
  const email = 'registration-' + randomUUID() + '@example.invalid', password = 'Synthetic-only-password-2026';
  let owner, teacher;
  const choose = async (placeholder, value) => { await page.getByRole('button',{name:placeholder,exact:true}).click(); await page.getByRole('option',{name:value,exact:true}).click(); };
  const next = async () => page.getByRole('button',{name:'Continue',exact:true}).click();
  const fill = async (label,value) => page.getByLabel(label,{exact:true}).fill(value);
  const completeDetails = async kind => {
    await fill(kind === 'teacher' ? 'Full name' : 'Student name','Synthetic '+kind+' applicant');
    await fill('Date of birth','1990-01-01');
    if(kind !== 'teacher') { await fill("Father's name",'Synthetic Father'); await fill("Mother's name",'Synthetic Mother'); }
    if(kind === 'study') await next();
    await fill('Contact number','9999999999');
    await fill('Applicant email',email);
    if(kind==='tuition') await fill('Guardian contact number','9999999999');
    if(kind==='teacher') await choose('Select Medium / Language','Synthetic Language');
    if(kind!=='tuition') await fill('WhatsApp number','9999999999');
    if(kind==='study') {
      for(const [label,value] of [['Address','Synthetic street'],['District','Synthetic district'],['City','Synthetic City'],['Pincode','123456']]) await fill(label,value);
      await choose('Select State','Synthetic State'); await next();
      await choose('Select Course / Class applying for','Synthetic Program'); await fill('Preferred institution','Synthetic institution'); await next();
    } else if(kind==='tuition') {
      await next(); await choose('Select Class','Synthetic Class'); await choose('Select Board','Synthetic Board');
      await fill('School name','Synthetic School');await fill('School address','Synthetic school street'); await next();
      await choose('Select State','Synthetic State');
      for(const [label,value] of [['District','Synthetic district'],['Pincode','123456'],['Address','Synthetic street'],['Home address','Synthetic home']])await fill(label,value);
      await next();
    } else {
      await next();
      for(const [label,value] of [['Institution name','Synthetic institute'],['Start date','2020-01-01'],['Institution address','Synthetic street'],['Institution contact number','9999999999']]) await fill(label,value);
      await choose('Select coaching batch / course','Synthetic Program');await choose('Select Total Coaching Experience','Synthetic Experience');await next();
    }
    if(kind==='study') await page.getByLabel('Select courseCertificate',{exact:true}).setInputFiles({name:'certificate.pdf',mimeType:'application/pdf',buffer:await pdfBytes(1)});
    await page.getByRole('button',{name:'Continue to Review',exact:true}).click();
  };
  await t.test('new applicant creates and verifies login inside registration without losing entered details', async () => {
    await page.goto(base + '/register?type=study', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByLabel('Student name',{exact:true}).waitFor().catch(async e=>{throw new Error(e.message+' Browser errors: '+JSON.stringify(errors)+' Page: '+(await page.locator('body').innerText()).slice(0,1500));});
    await completeDetails('study');
    const account = page.getByRole('region', { name: 'Registration account' });
    assert.equal(await account.getByLabel('Account full name', { exact: true }).count(),0);
    assert.equal(await account.getByLabel('Login email', { exact: true }).count(),0);
    await account.getByLabel('Choose a password', { exact: true }).fill(password);
    await account.getByRole('button', { name: 'Create account and send code', exact: true }).click();
    await account.getByLabel('Email verification code', { exact: true }).waitFor();
    assert.equal(mail.messages.length, 1);
    const otp = mail.messages[0].code; assert.ok(otp);
    await account.getByLabel('Email verification code', { exact: true }).fill(otp);
    await account.getByRole('button', { name: 'Verify email', exact: true }).click();
    await account.getByLabel('Account password', { exact: true }).fill(password);
    await account.getByRole('button', { name: 'Sign in and continue', exact: true }).click();
    await page.getByText('Signed in as ' + email + '.', { exact: false }).waitFor();
    assert.equal(await page.getByText('Signed in as ' + email + '.', { exact: false }).count(),1);
    assert.equal(new URL(page.url()).pathname, '/register');
    assert.equal(await page.evaluate(secret => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }).includes(secret), password), false);
    owner = await f.models.User.findOne({ emailNormalized: email }); assert.ok(owner.emailVerifiedAt);
  });
  for (const kind of ['study', 'tuition', 'teacher']) await t.test(kind + ': save, reload, submit and see owned application', async sub => {
    if (!owner) return sub.skip('Account setup failed');
    if (kind !== 'study') { await page.goto(base + '/register?type=' + kind, { waitUntil: 'domcontentloaded', timeout: 120000 }); await completeDetails(kind); }
    await page.getByRole('button', { name: 'Save application draft', exact: true }).click();
    await page.getByText(/Application reference:/).waitFor();
    const application = new URL(page.url()).searchParams.get('application'); assert.ok(application);
    if(kind==='study'){await page.getByRole('heading',{name:'Application status: draft',exact:true}).waitFor();assert.equal((await f.models.RegistrationApplication.findById(application)).documents.length,1);}
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Save changes', exact: true }).waitFor();
    assert.equal(await page.getByLabel(kind === 'teacher' ? 'Full name' : 'Student name', { exact: true }).inputValue(), 'Synthetic ' + kind + ' applicant');
    for(let i=0;i<(kind==='teacher'?2:3);i++) await next();
    await page.getByRole('button',{name:'Continue to Review',exact:true}).click();
    await page.getByRole('checkbox', { name: /I confirm the application information/ }).check();
    await page.getByRole('button', { name: 'Submit registration for review', exact: true }).click();
    await page.getByRole('heading', { name: 'Application status: submitted', exact: true }).waitFor();
    const row = await f.models.RegistrationApplication.findById(application); assert.equal(String(row.userId), String(owner._id)); assert.equal(row.status, 'submitted');
    if (kind === 'teacher') teacher = row;
    if (kind === 'tuition') assert.equal(await page.getByRole('link', { name: 'Browse courses and enroll in Coaching', exact: true }).getAttribute('href'), '/coaching');
    await page.goto(base + '/my-applications'); await page.getByText('Reference: ' + row.reference, { exact: true }).waitFor();
    for (const width of [390, 320]) { await page.setViewportSize({ width, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); }
  });
  await t.test('admin reviews teacher, publishes public portrait/profile and keeps content uploads under admin control', async sub => {
    if (!teacher) return sub.skip('Teacher application failed');
    await panel.goto(base + '/admin/registrations', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await panel.getByRole('button').filter({ hasText: teacher.reference }).click();
    for (const status of ['pending_verification', 'under_review', 'approved']) {
      await panel.getByLabel('Registration decision reason', { exact: true }).fill('Synthetic educator details reviewed');
      const response = panel.waitForResponse(response => response.url().endsWith('/status') && response.request().method() === 'PATCH');
      await panel.getByRole('button', { name: status, exact: true }).click(); assert.equal((await response).status(), 200);
      await panel.waitForFunction(() => document.querySelector('[aria-label="Registration decision reason"]').value === '');
    }
    const listing = panel.getByRole('region', { name: 'KITSS teacher listing' });
    await listing.getByLabel('Upload Public teacher portrait', { exact: true }).setInputFiles({ name: 'public-teacher.png', mimeType: 'image/png', buffer: await imageBytes() });
    await listing.locator('button').filter({ hasText: /^Upload Public teacher portrait$/ }).click();
    await panel.waitForFunction(() => Boolean(document.querySelector('[aria-label="Public teacher portrait"]')?.value));
    await listing.getByRole('button', { name: 'Mark as KITSS teacher and publish', exact: true }).click();
    await listing.getByText('This applicant has been marked as a KITSS teacher.', { exact: true }).waitFor();
    const approved = await f.models.RegistrationApplication.findById(teacher._id); assert.ok(approved.teacherProfileId);
    await page.goto(base + '/about'); await page.getByRole('heading', { name: 'Synthetic teacher applicant', exact: true }).waitFor();
    await page.getByText('KITSS Teacher', { exact: true }).waitFor();
    assert.deepEqual((await f.models.User.findById(owner._id)).roles, ['student']);
    assert.deepEqual(errors, []);
  });
});
