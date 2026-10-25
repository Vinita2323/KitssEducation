import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { stage8Fixture } from '../../backend/tests/stage8-fixture.js';

const name=process.env.KITSS_COMPLETENESS_BROWSER_DB, chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Original-scope gap closure: CMS teaser, saved selector, pagination and accessible PDF', {skip:!name?'No isolated completeness database':!existsSync(chrome)?'Chrome unavailable':false,timeout:600000},async t=>{
  const f=await stage8Fixture(name);let backend,vite,browser;
  t.after(async()=>{try{await browser?.close();await vite?.close();if(backend)await new Promise(r=>{backend.close(r);backend.closeAllConnections();});}finally{await f.close();}});
  const d=await f.seed();
  const order=await f.service.create({product:{kind:'book',id:d.book.id},idempotencyKey:randomUUID()},d.student.auth,f.ctx);await f.service.startAttempt(order.id,{idempotencyKey:randomUUID()},d.student.auth,f.ctx);const stored=await f.models.Order.findById(order.id),payment=f.provider.pay(stored.providerOrderId);await f.service.observe(stored._id,payment.id,'isolated_completeness_fixture',f.ctx);
  // Extra published fixture rows exercise page two, with no application data writes.
  const original=await f.models.Course.findById(d.course.id).lean();
  await f.models.Course.insertMany(Array.from({length:21},(_,i)=>{const {_id,__v,...row}=original;return {...row,title:'AUDIT PAGINATION '+i,publishedSnapshot:{...original.publishedSnapshot,title:'AUDIT PAGINATION '+i},auditOutbox:[]};}));
  backend=http.createServer();await new Promise(r=>backend.listen(0,'127.0.0.1',r));
  vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),cacheDir:fileURLToPath(new URL('../test-artifacts/vite-'+name+'/',import.meta.url)),optimizeDeps:{noDiscovery:true,include:['react','react/jsx-runtime','react-dom/client','react-router-dom','lucide-react','framer-motion','html-to-image','html2canvas','jspdf']},server:{host:'127.0.0.1',port:0,hmr:false,watch:null,proxy:{'/api':{target:'http://127.0.0.1:'+backend.address().port,changeOrigin:true}}},logLevel:'error'});
  await vite.listen();const base='http://127.0.0.1:'+vite.httpServer.address().port;f.config.corsOrigins=[base];f.config.appPublicUrl=base;backend.on('request',f.app());
  browser=await chromium.launch({executablePath:chrome,headless:true});const context=await browser.newContext({viewport:{width:1440,height:950}}),page=await context.newPage();page.setDefaultTimeout(30000);
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());const errors=[];page.on('pageerror',e=>{errors.push(e.message);t.diagnostic('Browser exception: '+e.message);});
  const artifacts=fileURLToPath(new URL('../test-artifacts/',import.meta.url));mkdirSync(artifacts,{recursive:true});t.afterEach(async child=>{if(child.passed===false){t.diagnostic('Failed UI: '+(await page.locator('body').innerText()).slice(-3500));await page.screenshot({path:artifacts+'completeness-failure.png',fullPage:true});}});
  const identity=async actor=>{await context.clearCookies();if(actor)await context.addCookies([{name:actor.user.roles.includes('student')?'kitss_student_session':'kitss_staff_session',value:actor.token,url:base,httpOnly:true,sameSite:'Lax'}]);};
  const go=path=>page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
  await t.test('existing admin CMS controls publish teaser; draft hidden and focus refresh updates mounted home',async()=>{
    await identity(d.admin);await go('/admin/content');await page.getByRole('button',{name:'Add Content',exact:true}).click();const editor=page.getByRole('dialog',{name:'Content editor'});
    await editor.getByLabel('Content key').selectOption('home');await editor.getByLabel('Section 1 key').fill('about-teaser');await editor.getByLabel('Section 1 heading').fill('AUDIT PUBLISHED TEASER');await editor.getByLabel('Section 1 body').fill('Saved organization story from the existing CMS.');const saved=page.waitForResponse(r=>r.url().endsWith('/admin/content/pages')&&r.request().method()==='POST');await editor.getByRole('button',{name:'Save Content Draft',exact:true}).click();const response=await saved;assert.equal(response.status(),201,await response.text());await editor.waitFor({state:'detached'});
    await identity(null);await go('/home');assert.equal(await page.getByText('AUDIT PUBLISHED TEASER',{exact:true}).count(),0);
    await identity(d.admin);await go('/admin/content');const row=page.getByRole('row').filter({hasText:'home'});await row.getByRole('button',{name:'Publish',exact:true}).click();await row.getByRole('cell',{name:'published',exact:true}).waitFor();
    await identity(null);await go('/home');await page.getByText('AUDIT PUBLISHED TEASER',{exact:true}).waitFor();assert.equal(await page.getByText('AUDIT PUBLISHED TEASER',{exact:true}).count(),1);
    const current=await f.models.PageContent.findOne({key:'home'});await f.publishing.edit('pages',String(current._id),{expectedRevision:current.revision,sections:[{key:'about-teaser',type:'text',heading:'AUDIT REFRESHED TEASER',body:'Published update without reloading this mounted home.'}]},d.admin.auth,f.ctx);const changed=await f.models.PageContent.findById(current._id);await f.publishing.publish('pages',String(current._id),{expectedRevision:changed.revision,publish:true},d.admin.auth,f.ctx);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByText('AUDIT REFRESHED TEASER',{exact:true}).waitFor();await page.getByRole('link').filter({hasText:'AUDIT REFRESHED TEASER'}).click();await page.waitForURL('**/about');
  });
  await t.test('selector page two is reachable and signed-in choices persist on the owner only',async()=>{
    await identity(d.student);await go('/coaching/select?choose=1');await page.getByRole('button',{name:'Save course choices',exact:true}).waitFor();
    const next=page.getByRole('button',{name:'Next',exact:true});await next.waitFor({state:'visible'});await next.click();await page.getByText(/Page 2/).waitFor();assert.ok(await page.getByText(/AUDIT PAGINATION/).count()>0);
    const language=await f.models.Taxonomy.findById(original.languageId);await page.getByLabel('Course selector language').selectOption(language.label);const saved=page.waitForResponse(r=>r.url().endsWith('/me/preferences')&&r.request().method()==='PATCH');await page.getByRole('button',{name:'Save course choices',exact:true}).click();assert.equal((await saved).status(),200);
    assert.equal((await f.models.User.findById(d.student.user._id)).preferences.courseSelector.languageId,String(language._id));await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(label=>document.querySelector('[aria-label="Course selector language"]')?.value===label,language.label);
    await identity(d.other);await go('/coaching/select?choose=1');await page.waitForFunction(()=>document.querySelector('button')&&[...document.querySelectorAll('button')].some(b=>b.textContent==='Save course choices'&&!b.disabled));assert.equal(await page.getByLabel('Course selector language').inputValue(),'All');
  });
  await t.test('protected PDF has real selectable and accessible page text with correct paging and zoom',async()=>{
    await identity(d.student);await go('/books/'+d.book.id+'/read');await page.locator('canvas[data-rendered-page="1"]').waitFor();const layer=page.locator('.kitss-pdf-text');await layer.locator('span').first().waitFor({state:'attached'});
    const text=await layer.textContent();assert.match(text,/Isolated Stage 5 fixture/);
    const selected=await layer.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);return selection.toString();});assert.match(selected,/Isolated Stage 5 fixture/);
    await page.getByText('Accessible page text',{exact:true}).click();await page.getByLabel('PDF page 1 text').waitFor();assert.match(await page.getByLabel('PDF page 1 text').textContent(),/Isolated Stage 5 fixture/);
    await page.getByRole('button',{name:'Next page',exact:true}).click();await page.locator('canvas[data-rendered-page="2"]').waitFor();await page.getByText('Accessible page text',{exact:true}).click();await page.getByLabel('PDF page 2 text').waitFor();assert.equal(await page.getByLabel('PDF page 1 text').count(),0);
    const before=await layer.boundingBox();await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForFunction(width=>document.querySelector('.kitss-pdf-text')?.getBoundingClientRect().width>width,before.width);
    assert.ok(!(await page.locator('meta[name="viewport"]').getAttribute('content')).includes('user-scalable=no'));assert.deepEqual(errors,[]);
  });
  await t.test('selector keyboard and mobile drawer focus, Escape and focus return work',async()=>{
    await identity(d.student);await go('/coaching/select?choose=1');const trigger=page.getByRole('button',{name:'All Courses',exact:true});await trigger.waitFor();await trigger.focus();await trigger.press('ArrowDown');
    const search=page.getByRole('combobox',{name:'Search course',exact:true});await search.waitFor();await search.focus();await search.press('End');await search.press('Enter');assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);
    await trigger.press('ArrowDown');await search.waitFor();await search.focus();await search.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    await page.setViewportSize({width:390,height:844});const open=page.getByRole('button',{name:'Open navigation menu',exact:true});await open.click();const drawer=page.getByRole('dialog',{name:'Student navigation',exact:true});await drawer.waitFor();
    await drawer.evaluate(el=>{const controls=[...el.querySelectorAll('button,a[href],input,select,[tabindex]')].filter(n=>!n.disabled&&n.tabIndex>=0&&n.getClientRects().length);controls.at(-1).focus();});await page.keyboard.press('Tab');assert.equal(await drawer.evaluate(el=>el.contains(document.activeElement)),true);await page.keyboard.press('Escape');await drawer.waitFor({state:'detached'});assert.equal(await open.evaluate(el=>el===document.activeElement),true);await page.setViewportSize({width:1440,height:950});
  });
});
