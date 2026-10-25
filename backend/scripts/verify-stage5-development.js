// Explicit development-only smoke verification. Retains Stage 5 records; never
// drops, resets, or deletes application records. No real account/session is used.
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { publishingFixture, imageBytes, pdfBytes } from '../tests/publishing-fixture.js';
import { startServer } from '../src/server.js';
import { createDatabase } from '../src/config/database.js';
import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { createServer } from '../../frontend/node_modules/vite/dist/node/index.js';
import { chromium } from '../../frontend/node_modules/playwright-core/index.mjs';

if (!process.argv.includes('--confirm-development')) throw new Error('Explicit --confirm-development is required');
const config=loadConfig(),logger=createLogger({level:'silent'});
const database=createDatabase(config.mongo,logger);await database.connect();
let report={label:'STAGE5_DEV_VERIFY',environment:config.nodeEnv,database:database.connection.db.databaseName,createdAt:new Date().toISOString(),baselineCounts:{},records:{},checks:{},destructiveOperations:false};
if(config.nodeEnv!=='development'||!/dev|development|local|test/i.test(report.database)){await database.disconnect();throw new Error('Database writes blocked: development classification is ambiguous');}
for(const c of await database.connection.db.listCollections({}, {nameOnly:true}).toArray())report.baselineCounts[c.name]=await database.connection.db.collection(c.name).countDocuments();
await database.disconnect();
const f=await publishingFixture(undefined,{actual:true});
let server,vite,browser,restarted,actor;
const label='STAGE5_DEV_VERIFY_'+randomUUID().slice(0,8);
const artifact=new URL('../STAGE5-DEVELOPMENT-VERIFICATION.json',import.meta.url);
try { const previous=JSON.parse(await readFile(artifact,'utf8')); report.previousRuns=[...(previous.previousRuns??[]),{...previous,previousRuns:undefined}]; } catch(error) { if(error.code!=='ENOENT')throw error; }
try{
  actor=await f.fixtureUser(['admin'],['learning.read','learning.write','content.read','content.write','media.read','media.write']);
  report.records.verificationActorId=String(actor.user._id);
  server=http.createServer(f.app());await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let base='http://127.0.0.1:'+server.address().port;
  const csrfResponse=await fetch(base+'/api/v1/auth/csrf'),csrfCookie=csrfResponse.headers.getSetCookie()[0].split(';')[0],csrf=(await csrfResponse.json()).data.csrfToken;
  const api=async(path,method='GET',body,form)=>{const response=await fetch(base+'/api/v1'+path,{method,signal:AbortSignal.timeout(30000),headers:{Origin:f.config.corsOrigins[0],Cookie:csrfCookie+'; kitss_staff_session='+actor.token,'X-CSRF-Token':csrf,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:form?{body:form}:{})});const json=response.status!==204&&response.headers.get('content-type')?.includes('json')?await response.json():null;return{status:response.status,json};};
  let result=await api('/admin/books','POST',{title:label+'_BOOK',description:'Development verification record. Unpublished; no prices, licensing or academic claims supplied.'});if(result.status!==201)throw new Error('Actual book creation failed');let book=result.json.data;report.records.bookId=book.id;
  result=await api('/admin/books/'+book.id,'PATCH',{expectedRevision:book.revision,title:label+'_BOOK_UPDATED'});if(result.status!==200)throw new Error('Actual draft update failed');book=result.json.data;
  const banner=await api('/admin/content/banners','POST',{title:label+'_BANNER',placement:'home'});if(banner.status!==201)throw new Error('Actual banner creation failed');report.records.bannerId=banner.json.data.id;
  const faculty=await api('/admin/content/faculty','POST',{name:label+'_FACULTY',role:'Development verification fixture',sourceNote:'Not a real faculty profile. Must remain unpublished.'});if(faculty.status!==201)throw new Error('Actual faculty draft creation failed');report.records.facultyId=faculty.json.data.id;
  const occupied=await f.models.PageContent.distinct('key');const free=['home','about','categories','navigation'].find(k=>!occupied.includes(k));
  if(free){const page=await api('/admin/content/pages','POST',{key:free,sections:[{key:'stage5-dev-verify',type:'text',heading:label+'_PAGE',body:'Unpublished development verification fixture.'}]});if(page.status!==201)throw new Error('Actual page draft creation failed');report.records.pageId=page.json.data.id;report.records.pageKey=free;}
  report.records.media=[];
  for(const[purpose,bytes,mime,name]of[['book_cover',await imageBytes(),'image/png',label+'-cover.png'],['book_full',await pdfBytes(3,'STAGE5_DEV_VERIFY generated fixture'),'application/pdf',label+'-full.pdf']]){
    const form=new FormData();form.append('purpose',purpose);form.append('idempotencyKey',randomUUID());form.append('file',new Blob([bytes],{type:mime}),name);
    const upload=await api('/media','POST',undefined,form);if(upload.status!==201){report.checks.lastUploadFailure={purpose,status:upload.status,code:upload.json?.error?.code??'unknown'};throw new Error('Actual safe media upload failed: '+report.checks.lastUploadFailure.code);}report.records.media.push({id:upload.json.data.id,status:upload.json.data.status,scan:upload.json.data.scan.status,bytes:upload.json.data.bytes});
    const access=await api('/media/'+upload.json.data.id+'/content');if(upload.json.data.status==='quarantined'&&access.status!==404)throw new Error('Quarantine exposure');
  }
  report.checks.authorizedDraftCreateAndUpdate=true;report.checks.publicDraftExcluded=(await api('/books/'+book.id)).status===404;
  const originalOrigin=f.config.corsOrigins;
  const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
  report.checks.actualBrowserExecuted=false;
  if(existsSync(chrome)){
    vite=await createServer({root:fileURLToPath(new URL('../../frontend/',import.meta.url)),cacheDir:fileURLToPath(new URL('../../frontend/test-artifacts/vite-stage5-actual/',import.meta.url)),server:{host:'127.0.0.1',port:0,hmr:false,watch:null,proxy:{'/api':{target:base,changeOrigin:true}}},logLevel:'error'});await vite.listen();const frontend='http://127.0.0.1:'+vite.httpServer.address().port;f.config.corsOrigins=[frontend];
    browser=await chromium.launch({executablePath:chrome,headless:true});const context=await browser.newContext();await context.addCookies([{name:'kitss_staff_session',value:actor.token,url:frontend,httpOnly:true,sameSite:'Lax'}]);const page=await context.newPage();await page.route('**/*',r=>new URL(r.request().url()).origin===frontend?r.continue():r.abort());
    await page.goto(frontend+'/admin/books',{waitUntil:'domcontentloaded',timeout:60000});await page.getByRole('heading',{name:label+'_BOOK_UPDATED',exact:true}).waitFor({timeout:30000});report.checks.actualBrowserExecuted=true;report.checks.actualFrontendRendersPersistedDraft=true;
    await browser.close();browser=null;await vite.close();vite=null;f.config.corsOrigins=originalOrigin;
  }
  await new Promise(r=>{server.close(r);server.closeAllConnections();});server=null;
  await f.connection.close();
  restarted=await startServer({config,logger,port:0});base='http://127.0.0.1:'+restarted.server.address().port;
  report.checks.readinessAfterRestart=(await fetch(base+'/api/v1/health/ready')).status===200;
  const persisted=await api('/admin/books/'+book.id);report.checks.persistsAfterRestart=persisted.status===200&&persisted.json.data.title===label+'_BOOK_UPDATED';
  if(!report.checks.persistsAfterRestart||!report.checks.publicDraftExcluded)throw new Error('Persistence or visibility verification failed');
  await restarted.close();restarted=null;
}finally{
  await browser?.close();await vite?.close();if(server)await new Promise(r=>{server.close(r);server.closeAllConnections();});await restarted?.close();
  if(f.connection.readyState!==1)await f.connection.openUri(config.mongo.uri,{...(config.mongo.dbName?{dbName:config.mongo.dbName}:{}),autoIndex:false,serverSelectionTimeoutMS:30000});
  if(actor){await f.models.User.updateOne({_id:actor.user._id,publicId:actor.user.publicId},{$set:{status:'suspended'},$inc:{securityVersion:1}});await f.models.Session.updateOne({_id:actor.session._id,userId:actor.user._id},{$set:{revokedAt:new Date()}});report.checks.verificationActorRetired=true;report.records.allMedia=(await f.models.MediaAsset.find({ownerUserId:actor.user._id}).select('_id status mime bytes').lean()).map(r=>({id:String(r._id),status:r.status,mime:r.mime,bytes:r.bytes}));}
  report.finalCounts={};for(const c of await f.connection.db.listCollections({}, {nameOnly:true}).toArray())report.finalCounts[c.name]=await f.connection.db.collection(c.name).countDocuments();
  report.indexes={};for(const name of ['books','pageContents','banners','facultyProfiles','siteSettings','mediaAssets'])report.indexes[name]=(await f.connection.db.collection(name).indexes()).map(x=>x.name);
  await writeFile(artifact,JSON.stringify(report,null,2)+'\n');await f.connection.close();
}
console.log(JSON.stringify(report,null,2));
