import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { commerceFixture } from '../../backend/tests/commerce-fixture.js';
import { pdfBytes, imageBytes } from '../../backend/tests/publishing-fixture.js';
const db=process.env.KITSS_FRANCHISE_BROWSER_DB;
test('franchise policy and applicant/admin screens: isolated HTTP, browser, fake scanner/payment', {skip:!db?'No isolated franchise browser DB':false,timeout:300000},async t=>{
  const f=await commerceFixture(db);let server,vite,browser;t.after(async()=>{await browser?.close();await vite?.close();if(server)await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});await f.close();});
  const admin=await f.fixtureUser(),student=await f.fixtureUser(['student']);
  await f.institutions.create('taxonomy',{kind:'designation',key:randomUUID(),label:'Owner',status:'active'},f.ctx);
  await f.institutions.create('taxonomy',{kind:'state',key:randomUUID(),label:'Synthetic State',status:'active'},f.ctx);
  server=http.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),server:{host:'127.0.0.1',port:0,hmr:false,watch:null,proxy:{'/api':{target:'http://127.0.0.1:'+server.address().port,changeOrigin:true}}},logLevel:'error'});await vite.listen();
  const base='http://127.0.0.1:'+vite.httpServer.address().port;f.config.corsOrigins=[base];f.config.appPublicUrl=base;server.on('request',f.app());
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addCookies([{name:'kitss_staff_session',value:admin.token,url:base,httpOnly:true,sameSite:'Lax'}]);
  const studentContext=await browser.newContext({viewport:{width:390,height:844}});await studentContext.addCookies([{name:'kitss_student_session',value:student.token,url:base,httpOnly:true,sameSite:'Lax'}]);
  for(const c of [context,studentContext])await c.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage(),app=await studentContext.newPage();page.setDefaultTimeout(30000);app.setDefaultTimeout(30000);const errors=[];for(const p of [page,app])p.on('pageerror',e=>errors.push(e.message));
  await t.test('main admin saves and publishes explicit policy through UI',async()=>{
    await page.goto(base+'/admin/settings',{waitUntil:'domcontentloaded',timeout:120000});
    const policy=page.getByRole('region',{name:'Franchise policy manager'});await policy.getByLabel('Franchise policy version',{exact:true}).waitFor();
    await policy.getByLabel('Franchise policy change reason',{exact:true}).fill('Review initial synthetic franchise terms');
    await policy.getByRole('button',{name:'Save franchise policy draft',exact:true}).click();await policy.getByText('Franchise policy draft saved. Review it before publishing.',{exact:true}).waitFor();
    assert.equal((await f.service.franchise.adminPolicy()).published,null);
    await policy.getByLabel('Franchise policy change reason',{exact:true}).fill('Publish approved synthetic test policy');
    await policy.getByRole('button',{name:'Publish franchise policy',exact:true}).click();await policy.getByText('Franchise policy published. Accepted application versions remain unchanged.',{exact:true}).waitFor();
  });
  let id;
  await t.test('mobile applicant saves independent draft, uploads actual PDFs and accepts agreement',async()=>{
    await app.goto(base+'/register?type=franchise',{waitUntil:'domcontentloaded',timeout:120000});
    await app.getByLabel('Institution name',{exact:true}).fill('BROWSER FRANCHISE INSTITUTE');await app.getByLabel('Institution type',{exact:true}).selectOption('Institute');
    await app.getByLabel('Institution logo',{exact:true}).setInputFiles({name:'synthetic-logo.png',mimeType:'image/png',buffer:await imageBytes()});
    await app.getByRole('button',{name:'Next step',exact:true}).click();
    await app.getByRole('button',{name:'+ Other Course',exact:true}).click();
    await app.getByPlaceholder('e.g. Hotel Management, Aviation & Logistics, Data Science...').fill('Synthetic Program');
    await app.getByRole('button',{name:'Add',exact:true}).click();
    await app.getByRole('button',{name:'Next step',exact:true}).click();
    for(const [label,value] of [['Contact person','Browser applicant'],['Contact email','browser@example.invalid'],['Contact mobile','9999999999']])await app.getByLabel(label,{exact:true}).fill(value);
    await app.getByLabel('Designation',{exact:true}).selectOption('Owner');
    await app.getByRole('button',{name:'Next step',exact:true}).click();
    await app.getByLabel('State',{exact:true}).selectOption('Synthetic State');
    await app.getByLabel('Campus Google Maps location',{exact:true}).fill('https://maps.google.com/?q=synthetic');
    for(const [label,value] of [['Address','Synthetic street'],['City','Synthetic City'],['Pincode','123456']])await app.getByLabel(label,{exact:true}).fill(value);
    assert.deepEqual(await app.locator('form').evaluateAll(forms=>forms.flatMap(f=>[...f.elements].filter(e=>e.willValidate&&!e.validity.valid).map(e=>({label:e.getAttribute('aria-label'),value:e.value,message:e.validationMessage})))),[]);
    await app.getByRole('button',{name:'Next step',exact:true}).click();
    await app.getByRole('button',{name:'Save application draft',exact:true}).click();
    await app.waitForFunction(()=>document.querySelector('[role=alert]')||[...document.querySelectorAll('[role=status]')].some(n=>n.textContent==='Draft saved. Attach the required documents before submitting.'));
    assert.deepEqual(await app.getByRole('alert').allTextContents(),[]);
    await app.getByText('Draft saved. Attach the required documents before submitting.',{exact:true}).waitFor();
    id=new URL(app.url()).searchParams.get('draft');assert.ok(id);
    const draft=await f.service.franchise.status(id,student.auth);assert.ok(draft.institution.logoAssetId);assert.deepEqual(draft.programsOffered,['Synthetic Program']);assert.ok(draft.location.stateId);assert.equal(draft.location.mapsUrl,'https://maps.google.com/?q=synthetic');
    for(const label of ['Institution registration proof','Authorization letter']){
      await app.getByLabel('Select '+label,{exact:true}).setInputFiles({name:'synthetic-proof.pdf',mimeType:'application/pdf',buffer:await pdfBytes(1)});
      await app.getByRole('button',{name:'Upload '+label,exact:true}).click();await app.getByText(label+' uploaded and attached.',{exact:true}).waitFor();
    }
    await app.getByRole('checkbox',{name:'Accept franchise agreement',exact:true}).check();await app.getByRole('button',{name:'Submit franchise application',exact:true}).click();await app.getByText('Application submitted. KITSS staff will review your details and documents.',{exact:true}).waitFor();
    assert.equal((await f.service.franchise.status(id,student.auth)).status,'pending');
    for (const width of [390,320]) { await app.setViewportSize({width,height:844}); assert.ok(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); }
    await app.screenshot({path:fileURLToPath(new URL('../../.runtime/franchise-applicant.png',import.meta.url)),fullPage:true});
  });
  await t.test('admin verifies documents and approves; free affiliation activates and applicant sees status',async t=>{
    if(!id){t.skip('Applicant submission did not complete');return;}
    await page.goto(base+'/admin/franchise-requests',{waitUntil:'domcontentloaded',timeout:120000});
    const row=page.getByRole('row').filter({hasText:'BROWSER FRANCHISE INSTITUTE'});await row.waitFor();
    await row.getByRole('button').first().click();
    await page.getByLabel('Add Admin Note / Rejection Reason',{exact:true}).fill('Evidence reviewed in isolated browser test');
    const verification=page.getByRole('region',{name:'Franchise verification'});
    const buttons=verification.getByRole('button',{name:'Verify document',exact:true});await buttons.first().click();
    await page.getByText('Document review saved',{exact:true}).first().waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].filter(b=>b.textContent==='Verify document').every(b=>!b.disabled));
    await buttons.nth(1).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('p')].filter(p=>/^(Institution registration proof|Authorization letter): verified$/.test(p.textContent)).length===2);
    await page.getByRole('button',{name:'Approve Franchise',exact:true}).click();
    await page.waitForFunction(()=>[...document.querySelectorAll('p')].some(p=>p.textContent.startsWith('Affiliation: active')));
    await app.getByRole('button',{name:'Refresh application status',exact:true}).click();await app.getByText('Affiliation: active',{exact:true}).waitFor();
    assert.equal((await f.service.franchise.status(id,student.auth)).affiliationState,'active');
    await page.screenshot({path:fileURLToPath(new URL('../../.runtime/franchise-admin-review.png',import.meta.url)),fullPage:true});
    await app.goto(base+'/institutes',{waitUntil:'domcontentloaded'});
    await app.getByRole('heading',{name:'KITSS Franchise Network',exact:true}).waitFor();
    await app.getByRole('heading',{name:'BROWSER FRANCHISE INSTITUTE',exact:true}).waitFor();
    assert.equal(await app.getByText('browser@example.invalid',{exact:true}).count(),0);
    assert.deepEqual(errors,[]);
  });
});
