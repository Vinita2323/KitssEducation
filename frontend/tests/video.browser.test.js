import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { coachingFixture } from '../../backend/tests/coaching-fixture.js';

const name=process.env.KITSS_VIDEO_BROWSER_DB, chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const workflowsOnly = process.env.KITSS_VIDEO_WORKFLOWS_ONLY === 'true';
test('Final video admin upload, playback/resume' + (workflowsOnly ? ' workflows (width loop intentionally omitted)' : ' and seven-width acceptance'), {skip:!name?'No isolated browser DB':!existsSync(chrome)?'Chrome unavailable':false,timeout:600000},async t=>{
  const f=await coachingFixture(name);let backend,vite,browser;
  t.after(async()=>{try{await browser?.close();await vite?.close();if(backend)await new Promise(r=>{backend.close(r);backend.closeAllConnections();});}finally{await f.close();}});
  const d=await f.seed();
  await f.learning.publish(d.course.id,{expectedRevision:d.course.revision,publish:false},d.admin.auth,f.ctx);
  backend=http.createServer();await new Promise(r=>backend.listen(0,'127.0.0.1',r));
  vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),cacheDir:fileURLToPath(new URL('../test-artifacts/vite-'+name+'/',import.meta.url)),optimizeDeps:{noDiscovery:true,include:['react','react/jsx-runtime','react-dom/client','react-router-dom','lucide-react','framer-motion','html-to-image','html2canvas','jspdf']},server:{host:'127.0.0.1',port:0,hmr:false,watch:null,proxy:{'/api':{target:'http://127.0.0.1:'+backend.address().port,changeOrigin:true}}},logLevel:'error'});
  await vite.listen();const base='http://127.0.0.1:'+vite.httpServer.address().port;f.config.corsOrigins=[base];f.config.appPublicUrl=base;backend.on('request',f.app());
  browser=await chromium.launch({executablePath:chrome,headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:950}}),page=await context.newPage();page.setDefaultTimeout(30000);
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const errors=[], ranges=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/content')&&r.status()===206)ranges.push({url:r.url(),range:r.request().headers().range});});
  const artifacts=fileURLToPath(new URL('../test-artifacts/',import.meta.url));mkdirSync(artifacts,{recursive:true});
  t.afterEach(async child=>{if(child.passed===false)await page.screenshot({path:artifacts+'final-video-failure.png',fullPage:true});});
  const identity=async actor=>{await context.clearCookies();await context.addCookies([{name:actor.user.roles.includes('student')?'kitss_student_session':'kitss_staff_session',value:actor.token,url:base,httpOnly:true,sameSite:'Lax'}]);};
  const go=path=>page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});
  let lesson,asset;
  await t.test('admin uploads inspected video, previews, attaches lesson and publishes existing course',async()=>{
    await identity(d.admin);await go('/admin/coaching');
    await page.getByRole('row').filter({hasText:d.course.title}).getByRole('button',{name:'Manage lessons',exact:true}).click();
    await page.getByRole('button',{name:'Add lesson',exact:true}).click();
    await page.getByLabel('Lesson title',{exact:true}).fill('FINAL VIDEO BROWSER LESSON');await page.getByLabel('Syllabus section',{exact:true}).selectOption('section-1');
    await page.getByLabel('Upload Lesson video',{exact:true}).setInputFiles(fileURLToPath(new URL('../../backend/tests/fixtures/lesson-generated.mp4',import.meta.url)));
    const uploaded=page.waitForResponse(r=>r.url().endsWith('/api/v1/media')&&r.request().method()==='POST');
    await page.locator('button').filter({hasText:/^Upload Lesson video$/}).click();const response=await uploaded;assert.equal(response.status(),201,await response.text());asset=(await response.json()).data;
    await page.waitForFunction(()=>{const v=document.querySelector('video[aria-label="Admin lesson video preview"]');return v?.readyState>=2;});
    await page.getByLabel('Status',{exact:true}).selectOption('published');
    await page.getByRole('button',{name:'Save lesson',exact:true}).click();await page.getByText('FINAL VIDEO BROWSER LESSON',{exact:true}).waitFor();
    lesson=await f.models.Lesson.findOne({title:'FINAL VIDEO BROWSER LESSON'});assert.equal(String(lesson.videoAssetId),asset.id);
    await page.getByRole('button',{name:'All courses',exact:true}).click();const row=page.getByRole('row').filter({hasText:d.course.title});await row.getByRole('button',{name:'Publish',exact:true}).click();await row.getByRole('cell',{name:'published',exact:true}).waitFor();
    const order=await f.service.create({product:{kind:'course_plan',id:d.plan.id},idempotencyKey:randomUUID()},d.student.auth,f.ctx);await f.service.startAttempt(order.id,{idempotencyKey:randomUUID()},d.student.auth,f.ctx);const stored=await f.models.Order.findById(order.id),payment=f.provider.pay(stored.providerOrderId);await f.service.observe(stored._id,payment.id,'isolated_video_browser',f.ctx);
  });
  assert.ok(lesson, 'Admin setup must succeed before dependent playback checks');
  const route=()=>'/coaching/'+d.course.id+'/lecture/'+lesson._id;
  const ready=async()=>{await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);};
  await t.test('native video actually decodes, seeks, saves and resumes after reload in both players',async()=>{
    await identity(d.student);await go(route());await ready();
    await page.getByText('No lesson summary has been published.',{exact:true}).first().waitFor();
    await page.getByText('Duration: 20 seconds',{exact:true}).waitFor();
    await page.locator('video').evaluate(async v=>{v.muted=true;await v.play();});await page.waitForFunction(()=>document.querySelector('video')?.currentTime>1);
    assert.ok(await page.locator('video').evaluate(v=>v.getVideoPlaybackQuality().totalVideoFrames>0));
    await page.locator('video').evaluate(v=>{v.currentTime=7;});await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.seeking&&v.currentTime>=7;});
    const saved=page.waitForResponse(r=>r.url().includes('/progress')&&r.request().method()==='PUT');await page.locator('video').evaluate(v=>v.pause());assert.equal((await saved).status(),200);
    const progress=await f.models.LearningProgress.findOne({userId:d.student.user._id,lessonId:lesson._id});assert.ok(progress.positionSeconds>=7);assert.equal(progress.durationSeconds,20);
    await page.reload({waitUntil:'domcontentloaded'});await ready();await page.waitForFunction(()=>document.querySelector('video').currentTime>=6.9);
    await page.getByLabel('Playback speed',{exact:true}).selectOption('1.5');assert.equal(await page.locator('video').evaluate(v=>v.playbackRate),1.5);
    assert.ok(ranges.some(r=>r.url.includes(asset.id)&&r.range?.startsWith('bytes=')),'Actual browser byte range delivery');
    await go('/coaching/'+d.course.id+'/player?lesson='+lesson._id);await ready();await page.waitForFunction(()=>document.querySelector('video').currentTime>=6.9);
  });
  await t.test('completion queues behind an in-flight position save',async()=>{
    await go(route());await ready();
    let release;const gate=new Promise(r=>{release=r;});let first=true;
    const pattern='**/api/v1/me/lessons/'+lesson._id+'/progress';
    await page.route(pattern,async intercepted=>{if(!first)return intercepted.continue();first=false;const response=await intercepted.fetch();await gate;await intercepted.fulfill({response});});
    try{
      await page.locator('video').evaluate(v=>{v.currentTime=5;});
      const started=page.waitForRequest(r=>r.url().endsWith('/progress')&&r.method()==='PUT');
      await page.getByRole('button',{name:'Save playback position',exact:true}).click();await started;
      await page.locator('video').evaluate(async v=>{v.currentTime=19.5;v.muted=true;await v.play();});
      await page.waitForFunction(()=>document.querySelector('video').ended);
      const completed=page.waitForResponse(r=>r.url().endsWith('/progress')&&r.request().postDataJSON()?.status==='completed');
      release();assert.equal((await completed).status(),200);
      const progress=await f.models.LearningProgress.findOne({userId:d.student.user._id,lessonId:lesson._id});assert.equal(progress.status,'completed');assert.equal(progress.positionSeconds,20);
    }finally{release();await page.unroute(pattern);}
  });
  await t.test('leaving a lesson cancels pending progress reads before a later write',async()=>{
    await go(route());await ready();
    const before=await f.models.LearningProgress.findOne({userId:d.student.user._id,lessonId:lesson._id});
    let release,finished;const gate=new Promise(r=>{release=r;}),done=new Promise(r=>{finished=r;});let first=true,writes=0;
    const pattern='**/api/v1/coaching/courses/'+d.course.id+'/syllabus';
    const observe=r=>{if(r.url().endsWith('/me/lessons/'+lesson._id+'/progress')&&r.method()==='PUT')writes++;};page.on('request',observe);
    await page.route(pattern,async intercepted=>{if(!first)return intercepted.continue();first=false;try{const response=await intercepted.fetch();await gate;await intercepted.fulfill({response});}catch{/* Browser may already have cancelled the held request. */}finally{finished();}});
    try{
      await page.locator('video').evaluate(v=>{v.currentTime=4;});
      const started=page.waitForRequest(r=>r.url().endsWith('/syllabus'));
      await page.getByRole('button',{name:'Save playback position',exact:true}).click();await started;
      await page.getByTitle('Back to Course Dashboard',{exact:true}).click();await page.waitForURL('**/dashboard');
      await page.getByRole('heading',{name:d.course.title,exact:true,level:1}).waitFor();release();await done;
      assert.equal(writes,0);assert.equal((await f.models.LearningProgress.findById(before._id)).positionSeconds,before.positionSeconds);
    }finally{release();await page.unroute(pattern);page.off('request',observe);}
  });
  await t.test('an identity change during a pending read cannot write previous playback state',async()=>{
    await go(route());await ready();
    const before=await f.models.LearningProgress.findOne({userId:d.student.user._id,lessonId:lesson._id});
    let release,finished;const gate=new Promise(r=>{release=r;}),done=new Promise(r=>{finished=r;});let first=true,writes=0;
    const pattern='**/api/v1/coaching/courses/'+d.course.id+'/syllabus';
    const observe=r=>{if(r.url().endsWith('/me/lessons/'+lesson._id+'/progress')&&r.method()==='PUT')writes++;};page.on('request',observe);
    await page.route(pattern,async intercepted=>{if(!first)return intercepted.continue();first=false;try{const response=await intercepted.fetch();await gate;await intercepted.fulfill({response});}finally{finished();}});
    try{
      await page.locator('video').evaluate(v=>{v.currentTime=3;});
      const started=page.waitForRequest(r=>r.url().endsWith('/syllabus'));await page.getByRole('button',{name:'Save playback position',exact:true}).click();await started;
      await page.evaluate(async()=>{const transport=await import('/src/shared/api/httpClient.js');transport.advanceIdentityEpoch();});
      release();await done;await page.getByRole('alert').filter({hasText:/Account changed/}).waitFor();
      assert.equal(writes,0);assert.equal((await f.models.LearningProgress.findById(before._id)).positionSeconds,before.positionSeconds);
    }finally{release();await page.unroute(pattern);page.off('request',observe);}
  });
  for(const width of (workflowsOnly ? [] : [320,375,390,414,768,1024,1440]))await t.test('video player and admin editor fit '+width+'px',async()=>{
    await page.setViewportSize({width,height:900});await identity(d.student);await go(route());await ready();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const bounds=await page.locator('video').boundingBox();assert.ok(bounds.width<=width&&bounds.width>100);
    await page.getByLabel('Playback speed',{exact:true}).selectOption('1.25');
    await page.screenshot({path:artifacts+'final-video-'+width+'.png',fullPage:true});
    await identity(d.admin);await go('/admin/coaching');await page.getByRole('row').filter({hasText:d.course.title}).getByRole('button',{name:'Manage lessons',exact:true}).click();await page.getByRole('row').filter({hasText:'FINAL VIDEO BROWSER LESSON'}).getByRole('button',{name:'Edit',exact:true}).click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.getByLabel('Upload Lesson video',{exact:true}).waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
  });
  await t.test('touch/mobile emulation decodes actual video and unauthorized playback is denied',async()=>{
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    try{await mobile.addCookies([{name:'kitss_student_session',value:d.student.token,url:base,httpOnly:true,sameSite:'Lax'}]);const p=await mobile.newPage();await p.goto(base+route());await p.waitForFunction(()=>document.querySelector('video')?.readyState>=2);await p.locator('video').evaluate(async v=>{v.currentTime=0;v.muted=true;await v.play();});await p.waitForFunction(()=>document.querySelector('video').currentTime>1);await p.locator('video').evaluate(v=>v.pause());}finally{await mobile.close();}
    await identity(d.other);await go(route());await page.getByRole('alert').filter({hasText:/enrollment/i}).waitFor();assert.equal(await page.locator('video').count(),0);
    assert.equal((await context.request.get(base+'/api/v1/media/'+asset.id+'/content')).status(),404);
    assert.deepEqual(errors,[]);
  });
});
