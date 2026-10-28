import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { publishingFixture, imageBytes, pdfBytes, fakeCleanScanner } from '../../backend/tests/publishing-fixture.js';

const dbName=process.env.KITSS_STAGE5_BROWSER_DB, executablePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
test('Stage 5 real API/MongoDB existing UI, media and responsive workflows',{skip:!dbName?'No KITSS_STAGE5_BROWSER_DB; real browser suite not executed':!existsSync(executablePath)?'Chrome missing':false,timeout:600000},async t=>{
  const f=await publishingFixture(dbName,{scanner:fakeCleanScanner});let vite,backend,browser;
  t.after(async()=>{try{await browser?.close();await vite?.close();if(backend)await new Promise(r=>{backend.close(r);backend.closeAllConnections();});}finally{await f.close();}});
  const admin=await f.fixtureUser(),reader=await f.fixtureUser(['admin'],['learning.read','content.read']),student=await f.fixtureUser(['student']);
  const png=await imageBytes(),full=await pdfBytes(4),sample=await pdfBytes(1),ctx={...f.ctx,actorId:admin.user.publicId};
  const upload=async(purpose,buffer,mime,name)=>f.media.upload({purpose,stream:Readable.from(buffer),mime,originalName:name,idempotencyKey:randomUUID(),auth:admin.auth,ctx});
  const cover=await upload('book_cover',png,'image/png','fixture-cover.png'),doc=await upload('book_full',full,'application/pdf','fixture-full.pdf'),preview=await upload('book_preview',sample,'application/pdf','fixture-sample.pdf');
  const language=await f.institutions.create('taxonomy',{kind:'language',key:'stage5-test-language',label:'Test Language'},ctx);
  let book=await f.publishing.create('books',{title:'STAGE5_BROWSER_PUBLISHED',author:'Generated test author',category:'Development fixtures',languageId:language.id,description:'Isolated generated fixture, not educational inventory',priceMinor:12500,pricingApproved:true,rightsConfirmed:true,rightsNote:'Generated for isolated testing',coverAssetId:cover.id,documentAssetId:doc.id,previewAssetIds:[preview.id]},admin.auth,ctx);
  book=await f.publishing.publish('books',book.id,{expectedRevision:book.revision,publish:true},admin.auth,ctx);
  const banner=await upload('banner',png,'image/png','fixture-banner.png'),portrait=await upload('faculty',png,'image/png','fixture-portrait.png');
  let b=await f.publishing.create('banners',{title:'STAGE5_BROWSER_BANNER',placement:'home',ctaText:'Browse books',imageAssetId:banner.id,link:{type:'internal',target:'/books'}},admin.auth,ctx);await f.publishing.publish('banners',b.id,{expectedRevision:b.revision,publish:true},admin.auth,ctx);
  let faculty=await f.publishing.create('faculty',{name:'STAGE5_BROWSER_FACULTY',role:'Development test role',sourceNote:'Generated test profile; no real academic claims',portraitAssetId:portrait.id,trackTags:['school']},admin.auth,ctx);await f.publishing.publish('faculty',faculty.id,{expectedRevision:faculty.revision,publish:true},admin.auth,ctx);
  backend=http.createServer();await new Promise(r=>backend.listen(0,'127.0.0.1',r));
  vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),cacheDir:fileURLToPath(new URL('../test-artifacts/vite-'+dbName+'/',import.meta.url)),optimizeDeps:{noDiscovery:true,include:['react','react/jsx-runtime','react-dom/client','react-router-dom','lucide-react','framer-motion','html-to-image','html2canvas','jspdf']},server:{host:'127.0.0.1',port:0,hmr:false,watch:null,proxy:{'/api':{target:'http://127.0.0.1:'+backend.address().port,changeOrigin:true}}},logLevel:'error'});await vite.listen();
  const base='http://127.0.0.1:'+vite.httpServer.address().port;f.config.corsOrigins=[base];f.config.appPublicUrl=base;backend.on('request',f.app());
  browser=await chromium.launch({executablePath,headless:true});const context=await browser.newContext({viewport:{width:390,height:950}}),page=await context.newPage();page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser runtime error:',e.message);});
  await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const goto=url=>page.goto(base+url,{waitUntil:'domcontentloaded',timeout:60000});
  const identity=async actor=>{await context.clearCookies();if(actor)await context.addCookies([{name:actor.user.roles.includes('student')?'kitss_student_session':'kitss_staff_session',value:actor.token,url:base,httpOnly:true,sameSite:'Lax'}]);};
  const response=(part,method='POST')=>page.waitForResponse(r=>r.url().includes('/api/v1/')&&r.url().includes(part)&&r.request().method()===method);
  const artifacts=fileURLToPath(new URL('../test-artifacts/',import.meta.url));mkdirSync(artifacts,{recursive:true});
  t.afterEach(async child=>{if(child.passed===false){const name=child.name.replace(/[^a-z0-9]+/gi,'-');writeFileSync(artifacts+'failure-stage5-'+name+'.txt',await page.locator('body').innerText());await page.screenshot({path:artifacts+'failure-stage5-'+name+'.png',fullPage:true});}});
  await t.test('public catalogue/filter/detail/approved PDF preview and private denial',async()=>{
    await identity(null);await goto('/books');await page.getByRole('link',{name:'STAGE5_BROWSER_PUBLISHED',exact:true}).waitFor();
    const search=page.getByPlaceholder('Search books, chapters, topics, authors...');await search.fill('NOT_FOUND_STAGE5');await page.getByText('No Matching Books Found',{exact:true}).waitFor();await search.fill('');await page.getByRole('link',{name:'STAGE5_BROWSER_PUBLISHED',exact:true}).click();
    await page.getByRole('heading',{level:1,name:'STAGE5_BROWSER_PUBLISHED'}).waitFor();assert.equal(await page.getByRole('button',{name:'Test payments unavailable'}).isDisabled(),true);
    await page.getByRole('button',{name:'Preview Sample Pages'}).click();await page.getByRole('link',{name:/Open approved public sample/}).waitFor();assert.equal(await page.locator('object[aria-label="Public book sample"]').getAttribute('data'),'/api/v1/media/'+preview.id+'/content');
    const status=await page.evaluate(async id=>(await fetch('/api/v1/media/'+id+'/content')).status,doc.id);assert.equal(status,404);await page.getByRole('button',{name:'Close Preview',exact:true}).click();
  });
  await t.test('existing books admin creates/uploads/publishes/edits/archives real records',async()=>{
    await identity(admin);await goto('/admin/books');await page.getByRole('button',{name:'Add New Book',exact:true}).click();
    const form=page.getByRole('dialog',{name:'Book editor'});await form.getByLabel('Book title',{exact:true}).fill('STAGE5_BROWSER_CREATED');await form.getByLabel('Book author',{exact:true}).fill('Development test author');await form.getByLabel('Book category',{exact:true}).fill('Development fixtures');await form.getByLabel('Book language',{exact:true}).selectOption(language.id);await form.getByLabel('Book description',{exact:true}).fill('Generated fixture for isolated development testing.');await form.getByLabel('Book price',{exact:true}).fill('23.45');
    await form.getByLabel(/Pricing explicitly approved/).check();await form.getByLabel(/Licensed rights for this book/).check();await form.getByLabel('Book rightsNote',{exact:true}).fill('Generated test content only');
    for(const [label,buffer,mimeType,name]of [['Book cover',png,'image/png','ui-cover.png'],['Full book PDF',full,'application/pdf','ui-full.pdf'],['Public sample PDF',sample,'application/pdf','ui-sample.pdf']]){await form.getByLabel('Upload '+label,{exact:true}).setInputFiles({name,mimeType,buffer});const saved=response('/media');await form.locator('button').filter({hasText:'Upload '+label}).click();assert.equal((await saved).status(),201);await page.waitForFunction(label=>document.querySelector('select[aria-label="'+label+'"]')?.value,label);}
    const created=response('/admin/books');await form.getByRole('button',{name:'Save Book Draft',exact:true}).click();assert.equal((await created).status(),201);
    let row=page.getByRole('row').filter({has:page.getByRole('heading',{name:'STAGE5_BROWSER_CREATED',exact:true})});await row.waitFor();const published=response('/publish');await row.getByRole('button',{name:'Publish',exact:true}).click();await page.getByRole('dialog',{name:'Publish book',exact:true}).getByRole('button',{name:'Confirm publish',exact:true}).click();assert.equal((await published).status(),200);assert.equal((await f.models.Book.findOne({title:'STAGE5_BROWSER_CREATED'})).status,'published');
    await row.getByTitle('Edit Book').click();await page.getByLabel('Book title',{exact:true}).fill('STAGE5_BROWSER_EDITED');const edited=response('/admin/books/','PATCH');await page.getByRole('button',{name:'Save Book Draft',exact:true}).click();assert.equal((await edited).status(),200);
    row=page.getByRole('row').filter({has:page.getByRole('heading',{name:'STAGE5_BROWSER_EDITED',exact:true})});await row.getByTitle('Archive Book').click();const archived=response('/admin/books/','DELETE');await page.getByRole('button',{name:'Yes, Archive',exact:true}).click();assert.equal((await archived).status(),200);assert.equal((await f.models.Book.findOne({title:'STAGE5_BROWSER_EDITED'})).status,'archived');
  });
  await t.test('CMS editor publication reaches home/banner/faculty and typed support settings',async()=>{
    await goto('/admin/content');await page.getByRole('button',{name:'Add Content',exact:true}).click();const form=page.getByRole('dialog',{name:'Content editor'});await form.getByLabel('Section 1 heading',{exact:true}).fill('STAGE5_BROWSER_HOME_SECTION');await form.getByLabel('Section 1 body',{exact:true}).fill('Published content from real MongoDB.');const saved=response('/admin/content/pages');await form.getByRole('button',{name:'Save Content Draft',exact:true}).click();assert.equal((await saved).status(),201);const row=page.getByRole('row').filter({has:page.getByText('home',{exact:true})});const published=response('/publish');await row.getByRole('button',{name:'Publish',exact:true}).click();assert.equal((await published).status(),200);
    await goto('/admin/settings');await page.getByLabel('Setting group',{exact:true}).selectOption('support');await page.getByLabel('Setting email',{exact:true}).fill('stage5-browser@example.invalid');const settings=response('/admin/settings/support','PATCH');await page.getByRole('button',{name:'Save Public Settings',exact:true}).click();const settingsResult=await settings;assert.equal(settingsResult.status(),200);assert.equal((await settingsResult.json()).data.value.email,'stage5-browser@example.invalid');
    await identity(null);await goto('/home');await page.getByRole('heading',{name:'STAGE5_BROWSER_HOME_SECTION',exact:true}).waitFor();await page.getByRole('heading',{name:'STAGE5_BROWSER_BANNER',exact:true}).waitFor();await page.getByRole('link',{name:'stage5-browser@example.invalid',exact:true}).waitFor();await goto('/about');await page.getByRole('heading',{name:'STAGE5_BROWSER_FACULTY',exact:true}).waitFor();
  });
  await t.test('readonly staff and student routes remain guarded and media error states are honest',async()=>{
    await identity(reader);await goto('/admin/books');assert.equal(await page.getByRole('button',{name:'Add New Book',exact:true}).isDisabled(),true);await goto('/admin/media');await page.getByText(/Permission denied|Access denied|not have permission/i).waitFor();
    await identity(student);await goto('/admin/books');await page.getByRole('alert').filter({hasText:/do not have permission/}).waitFor();
    await identity(admin);await goto('/admin/media');await page.getByRole('heading',{name:'Media Management',exact:true}).waitFor();await page.getByRole('button',{name:'Refresh media',exact:true}).click();
  });
  for(const width of (process.env.KITSS_BROWSER_WORKFLOWS_ONLY ? [] : [320,375,390,414,768,1024,1440]))await t.test('Stage 5 responsive screens at '+width+'px',async()=>{
    await page.setViewportSize({width,height:950});await identity(admin);
    for(const path of ['/admin/books','/admin/content','/admin/media','/admin/settings']){await goto(path);await page.locator('main').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await goto('/admin/books');await page.getByRole('button',{name:'Add New Book',exact:true}).click();await page.getByRole('dialog',{name:'Book editor'}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('dialog',{name:'Book editor'}).getByRole('button',{name:'Close',exact:true}).click();
    await identity(null);for(const path of ['/books','/home','/about']){await goto(path);await page.locator('main').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
    await goto('/books/'+book.id);await page.getByRole('button',{name:'Preview Sample Pages',exact:true}).click();await page.getByRole('link',{name:/Open approved public sample/}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:artifacts+'stage5-preview-'+width+'.png',fullPage:true});await page.getByRole('button',{name:'Close Preview',exact:true}).click();
  });
  assert.deepEqual(errors,[]);
});
