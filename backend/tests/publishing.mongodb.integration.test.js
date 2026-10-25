import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { publishingFixture, pdfBytes, imageBytes, fakeCleanScanner } from './publishing-fixture.js';
import { serve } from './helpers.js';
const dbName = process.env.KITSS_STAGE5_TEST_DB;
test('Stage 5 real standalone publishing/media APIs in fresh isolated MongoDB', { skip: !dbName ? 'No KITSS_STAGE5_TEST_DB; real Stage 5 DB tests not executed' : false, timeout: 300000 }, async t => {
  const f = await publishingFixture(dbName, { scanner: fakeCleanScanner }); t.after(() => f.close());
  const admin = await f.fixtureUser(), reader = await f.fixtureUser(['admin'], ['learning.read','content.read']), student = await f.fixtureUser(['student']);
  const url = await serve(t, f.app());
  const csrfResponse = await fetch(url + '/api/v1/auth/csrf'), csrfCookie = csrfResponse.headers.getSetCookie()[0].split(';')[0], csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, { method = 'GET', data, actor = admin, headers = {}, raw } = {}) => {
    if (process.env.KITSS_TEST_TRACE) console.info('Stage 5 request:', method, path);
    const response = await fetch(url + '/api/v1' + path, { signal: AbortSignal.timeout(30000), method, headers: { Origin: f.config.corsOrigins[0], Cookie: [csrfCookie, actor ? (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''].filter(Boolean).join('; '), 'X-CSRF-Token': csrf, ...(data ? { 'Content-Type':'application/json' } : {}), ...headers }, ...(data ? { body: JSON.stringify(data) } : raw ? { body: raw } : {}) });
    if (process.env.KITSS_TEST_TRACE) console.info('Stage 5 response:', response.status);
    return { status: response.status, body: response.status !== 204 && response.headers.get('content-type')?.includes('json') ? await response.json() : null, response };
  };
  const upload = async (purpose, bytes, mime, name, actor = admin, idem = randomUUID()) => { const form = new FormData(); form.append('purpose', purpose); form.append('idempotencyKey', idem); form.append('file', new Blob([bytes], { type: mime }), name); return api('/media', { method: 'POST', raw: form, actor }); };
  let cover, document, preview, book, language, bannerImage;
  await t.test('multipart auth/CSRF, signature/MIME, filename, malformed/empty/oversized validation', async () => {
    const png = await imageBytes();
    assert.equal((await upload('book_cover', png, 'image/png', 'cover.png', null)).status, 401);
    assert.equal((await upload('book_cover', png, 'image/png', 'cover.png', reader)).status, 403);
    assert.equal((await upload('book_cover', png, 'image/png', '../cover.png')).status, 415);
    assert.equal((await upload('book_cover', png, 'image/jpeg', 'cover.jpg')).status, 415);
    assert.equal((await upload('franchise_identity', png, 'image/png', 'cover.png')).status, 400);
    assert.equal((await upload('book_full', Buffer.from('MZ executable'), 'application/pdf', 'book.pdf')).status, 415);
    assert.equal((await upload('book_full', Buffer.alloc(0), 'application/pdf', 'book.pdf')).status, 422);
    assert.equal((await upload('book_cover', Buffer.alloc(5*1024*1024+1), 'image/png', 'cover.png')).status, 413);
    assert.equal((await api('/media', { method:'POST', raw:'bad', headers:{'Content-Type':'multipart/form-data; boundary=missing'} })).status, 400);
    const noCsrf = await fetch(url + '/api/v1/media', { method:'POST', headers:{Origin:f.config.corsOrigins[0],Cookie:'kitss_staff_session='+admin.token},body:new FormData() }); assert.equal(noCsrf.status,403);
  });
  await t.test('streamed uploads parse real images/PDF, deduplicate retry and protect unreferenced public/private files', async () => {
    const png = await imageBytes(), idem=randomUUID();
    const first = await upload('book_cover',png,'image/png','cover.png',admin,idem); assert.equal(first.status,201); cover=first.body.data; assert.equal(cover.status,'ready'); assert.equal(cover.scan.status,'clean'); assert.equal(cover.key,undefined); assert.equal(cover.width,40);
    assert.equal((await upload('book_cover',png,'image/png','cover.png',admin,idem)).body.data.id,cover.id);
    assert.equal((await upload('book_cover',png,'image/png','different.png',admin,idem)).status,409);
    document=(await upload('book_full',await pdfBytes(4),'application/pdf','full.pdf')).body.data;
    preview=(await upload('book_preview',await pdfBytes(1),'application/pdf','sample.pdf')).body.data;
    assert.equal(document.pageCount,4); assert.equal(preview.pageCount,1);
    assert.equal((await api('/media/'+cover.id+'/content',{actor:null})).status,404);
    assert.equal((await api('/media/'+document.id+'/content',{actor:student})).status,404);
    assert.equal((await api('/media/'+document.id+'/metadata',{actor:reader})).status,404);
    assert.equal((await api('/media/'+document.id+'/metadata')).body.data.key,undefined);
    const range=await api('/media/'+document.id+'/content',{headers:{Range:'bytes=0-4'}}); assert.equal(range.status,206); assert.equal(await range.response.text(),'%PDF-'); assert.match(range.response.headers.get('content-range'),/^bytes 0-4\//);
    assert.equal((await api('/media/'+document.id+'/content',{headers:{Range:'bytes=99-2'}})).status,416);
    assert.equal((await api('/media/'+document.id+'/content',{headers:{Range:'bytes=0-1,3-4'}})).status,416);
  });
  await t.test('book draft CRUD, metadata, revisions, publication gates, real taxonomy and safe DTO', async () => {
    language=await f.institutions.create('taxonomy',{kind:'language',key:'stage5-language',label:'Test Language'},f.ctx);
    assert.equal((await api('/admin/books',{method:'POST',actor:reader,data:{title:'Denied'}})).status,403);
    book=(await api('/admin/books',{method:'POST',data:{title:'STAGE5_TEST_BOOK',author:'Isolated test author',category:'Test category',description:'Development fixture, not licensed educational inventory',languageId:language.id,priceMinor:12500,pricingApproved:true,rightsConfirmed:true,rightsNote:'Isolated generated test content only',coverAssetId:cover.id,documentAssetId:document.id,previewAssetIds:[preview.id],toc:[{title:'Test chapter',page:1}]}})).body.data;
    assert.ok(book.id); assert.equal(book.status,'draft'); assert.equal((await api('/books/'+book.id,{actor:null})).status,404);
    assert.equal((await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:book.revision,priceMinor:-1}})).status,422);
    assert.equal((await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:book.revision,documentAssetId:cover.id}})).status,422);
    assert.equal((await api('/admin/books/'+book.id+'/publish',{method:'POST',actor:reader,data:{expectedRevision:book.revision,publish:true}})).status,403);
    book=(await api('/admin/books/'+book.id+'/publish',{method:'POST',data:{expectedRevision:book.revision,publish:true}})).body.data;
    const pub=await api('/books/'+book.id,{actor:null}); assert.equal(pub.status,200); assert.equal(pub.body.data.documentAssetId,undefined); assert.equal(pub.body.data.rightsNote,undefined); assert.equal(pub.body.data.canReadFull,false); assert.equal(pub.body.data.pageCount,4);
    assert.equal((await api('/media/'+cover.id+'/content',{actor:null})).status,200);
    assert.equal((await api('/media/'+document.id+'/content',{actor:null})).status,404);
    assert.equal((await api('/books/'+book.id+'/preview',{actor:null})).body.data.assets[0].id,preview.id);
    assert.equal((await api('/media/'+preview.id+'/content',{actor:null,headers:{Range:'bytes=-5'}})).status,206);
    const edited=await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:book.revision,title:'Edited draft'}}); assert.equal(edited.status,200); book=edited.body.data;
    assert.equal((await api('/books/'+book.id,{actor:null})).body.data.title,'STAGE5_TEST_BOOK');
    assert.equal((await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:1,title:'Stale'}})).status,409);
    assert.equal((await api('/books?q=STAGE5_TEST&type=paid&sort=price_asc',{actor:null})).body.meta.total,1);
    assert.equal((await api('/books?q=Test%20Language',{actor:null})).body.meta.total,1);
    assert.equal((await api('/books/facets',{actor:null})).body.data.languages[0].id,language.id);
    assert.equal((await api('/books?status=draft',{actor:null})).status,422);
    const invalid=(await api('/admin/books',{method:'POST',data:{title:'Incomplete'}})).body.data;
    assert.equal((await api('/admin/books/'+invalid.id+'/publish',{method:'POST',data:{expectedRevision:invalid.revision,publish:true}})).status,422);
  });
  await t.test('preview cannot reference original PDF or same-length duplicate; referenced-media deletion/replacement',async()=>{
    const same=(await upload('book_preview',await pdfBytes(4),'application/pdf','same.pdf')).body.data;
    assert.equal((await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:book.revision,previewAssetIds:[same.id]}})).status,422);
    assert.equal((await api('/media/'+cover.id,{method:'DELETE',data:{expectedRevision:cover.revision}})).status,409);
    const replacement=(await upload('book_cover',await imageBytes(),'image/png','replacement.png')).body.data;
    book=(await api('/admin/books/'+book.id,{method:'PATCH',data:{expectedRevision:book.revision,coverAssetId:replacement.id}})).body.data;
    assert.equal((await api('/media/'+cover.id,{method:'DELETE',data:{expectedRevision:cover.revision}})).status,409,'Live snapshot still references previous cover');
    book=(await api('/admin/books/'+book.id+'/publish',{method:'POST',data:{expectedRevision:book.revision,publish:true}})).body.data;
    assert.equal((await api('/media/'+cover.id,{method:'DELETE',data:{expectedRevision:cover.revision}})).status,204);
    assert.equal((await api('/media/'+cover.id+'/content')).status,404);
  });
  await t.test('CMS drafts/snapshots, plain-text protection, faculty source evidence and banner ordering/window',async()=>{
    const page=(await api('/admin/content/pages',{method:'POST',data:{key:'home',sections:[{key:'intro',type:'text',heading:'TEST HOME',body:'<script>plain text only</script>'}]}})).body.data;
    assert.equal((await api('/public/content/home',{actor:null})).body.data.sections.length,0);
    const published=await api('/admin/content/pages/'+page.id+'/publish',{method:'POST',data:{expectedRevision:page.revision,publish:true}});assert.equal(published.status,200);
    assert.equal((await api('/public/content/home',{actor:null})).body.data.sections[0].heading,'TEST HOME');
    assert.equal((await api('/admin/content/pages',{method:'POST',data:{key:'evil',sections:[]}})).status,422);
    bannerImage=(await upload('banner',await imageBytes(),'image/png','banner.png')).body.data;
    for(const [title,sortOrder,endsAt] of [['Second',2,undefined],['First',1,undefined],['Expired',0,new Date(0).toISOString()]]){const b=(await api('/admin/content/banners',{method:'POST',data:{placement:'home',title,sortOrder,imageAssetId:bannerImage.id,link:{type:'internal',target:'/books'},...(endsAt?{endsAt}:{})}})).body.data;assert.equal((await api('/admin/content/banners/'+b.id+'/publish',{method:'POST',data:{expectedRevision:b.revision,publish:true}})).status,200);}
    assert.deepEqual((await api('/public/banners?placement=home',{actor:null})).body.data.map(b=>b.title),['First','Second']);
    assert.equal((await api('/admin/content/banners',{method:'POST',data:{placement:'home',title:'Unsafe',link:{type:'external',target:'javascript:alert(1)'}}})).status,422);
    const portrait=(await upload('faculty',await imageBytes(),'image/png','portrait.png')).body.data;
    let faculty=(await api('/admin/content/faculty',{method:'POST',data:{name:'Test-only faculty',role:'Test role',portraitAssetId:portrait.id}})).body.data;
    assert.equal((await api('/admin/content/faculty/'+faculty.id+'/publish',{method:'POST',data:{expectedRevision:faculty.revision,publish:true}})).status,422);
    faculty=(await api('/admin/content/faculty/'+faculty.id,{method:'PATCH',data:{expectedRevision:faculty.revision,sourceNote:'Generated test profile, no real qualifications claimed'}})).body.data;
    assert.equal((await api('/admin/content/faculty/'+faculty.id+'/publish',{method:'POST',data:{expectedRevision:faculty.revision,publish:true}})).status,200);
    assert.equal((await api('/public/content/about',{actor:null})).body.data.faculty[0].name,'Test-only faculty');
  });
  await t.test('settings are typed, permissioned, revisioned and cannot configure secrets/roles/fees',async()=>{
    assert.equal((await api('/admin/settings/support',{method:'PATCH',actor:reader,data:{expectedRevision:0,value:{email:'test@example.invalid'}}})).status,403);
    assert.equal((await api('/admin/settings/secrets',{method:'PATCH',data:{expectedRevision:0,value:{AUTH_SECRET:'bad'}}})).status,422);
    assert.equal((await api('/admin/settings/brand',{method:'PATCH',data:{expectedRevision:0,value:{name:'Test site',roles:['super_admin']}}})).status,422);
    assert.equal((await api('/admin/settings/support',{method:'PATCH',data:{expectedRevision:0,value:{email:'test@example.invalid',phone:'9000000000'}}})).status,200);
    assert.equal((await api('/public/settings',{actor:null})).body.data.support.email,'test@example.invalid');
    assert.equal((await api('/admin/settings/support',{method:'PATCH',data:{expectedRevision:0,value:{phone:'9000000001'}}})).status,409);
  });
  await t.test('unconfigured/infected/error scanner never exposes or permits quarantined media',async()=>{
    for(const status of ['pending','infected','error']){
      const scanner={configured:status!=='pending',async scan(stream){for await(const _ of stream){}return status;}};
      const {createMediaService}=await import('../src/modules/media/media.service.js');
      const service=createMediaService({models:f.models,storage:f.storage,coordination:f.coordination,config:f.config,authService:f.auth,scanner});
      const asset=await service.upload({purpose:'book_cover',originalName:'quarantine.png',mime:'image/png',stream:Readable.from(await imageBytes()),idempotencyKey:randomUUID(),auth:admin.auth,ctx:f.ctx});
      assert.equal(asset.status,'quarantined');assert.equal(asset.scan.status,status);
      await assert.rejects(service.linkable(asset.id,'book_cover',admin.auth),{status:422});
      assert.equal((await api('/media/'+asset.id+'/content')).status,404);
    }
  });
  await t.test('rescan recovery, foreign linking, corruption rejection and durable failed-IO cleanup',async()=>{
    const {createMediaService}=await import('../src/modules/media/media.service.js');
    const {AppError}=await import('../src/utils/AppError.js');
    const pending=createMediaService({models:f.models,storage:f.storage,coordination:f.coordination,config:f.config,authService:f.auth,scanner:{configured:false,async scan(stream){stream.destroy();return 'pending';}}});
    const asset=await pending.upload({purpose:'cms',originalName:'rescan.png',mime:'image/png',stream:Readable.from(await imageBytes()),idempotencyKey:randomUUID(),auth:admin.auth,ctx:f.ctx});
    assert.equal(asset.status,'quarantined');
    const ready=await f.media.rescan(asset.id,{expectedRevision:asset.revision},f.ctx);assert.equal(ready.status,'ready');
    const foreign={user:{_id:reader.user._id,roles:['admin'],permissions:['learning.write']}};
    await assert.rejects(f.media.linkable(ready.id,'cms',foreign),{status:403});
    const record=await f.models.MediaAsset.findById(ready.id).select('+key');await f.storage.delete({key:record.key});
    await f.storage.upload({stream:Readable.from('corrupted test bytes'),key:record.key});
    assert.equal((await api('/media/'+ready.id+'/content')).status,503);
    const staleKey=f.storage.createKey({visibility:'quarantine',purpose:'cms',extension:'png'});await f.storage.upload({stream:Readable.from(await imageBytes()),key:staleKey});
    const stale=await f.models.MediaAsset.create({key:staleKey,purpose:'cms',visibility:'public',ownerUserId:admin.user._id,idempotencyKey:randomUUID(),status:'staged',createdAt:new Date(Date.now()-3600000)});
    await f.media.maintenance();assert.equal((await f.models.MediaAsset.findById(stale._id)).status,'deleted');await assert.rejects(f.storage.getMetadata({key:staleKey}),{status:404});
    const original=f.storage.upload.bind(f.storage);let failed;
    try{f.storage.upload=async input=>{if(input.key?.startsWith('public/'))throw new AppError(503,'ISOLATED_IO_FAILURE','Test failure');return original(input);};
      await assert.rejects(f.media.upload({purpose:'cms',originalName:'promotion-failure.png',mime:'image/png',stream:Readable.from(await imageBytes()),idempotencyKey:randomUUID(),auth:admin.auth,ctx:f.ctx}),{status:503});
      failed=await f.models.MediaAsset.findOne({originalName:'promotion-failure.png'}).select('+key +cleanupKeys');assert.equal(failed.status,'quarantined');assert.equal(failed.cleanupKeys.length,1);
    }finally{f.storage.upload=original;}
    await f.models.MediaAsset.updateOne({_id:failed._id},{$set:{cleanupAfterAt:new Date(0)}});await f.media.maintenance();assert.equal((await f.models.MediaAsset.findById(failed._id).select('+cleanupKeys')).cleanupKeys.length,0);
    assert.equal((await api('/media/'+failed._id+'/content')).status,404);
  });
  await t.test('missing/corrupt files, concurrent edits, audit outage recovery and archival persistence',async()=>{
    const eventsBefore=await f.models.AuditLog.countDocuments();
    const original=f.models.AuditLog.updateOne; let draft;
    try{f.models.AuditLog.updateOne=async()=>{throw new Error('Isolated outage');};draft=await f.publishing.create('books',{title:'Audit test'},admin.auth,f.ctx);assert.equal((await f.models.Book.findById(draft.id)).auditOutbox.length,1);}finally{f.models.AuditLog.updateOne=original;}
    await f.coordination.maintenance();await f.coordination.maintenance();assert.equal(await f.models.AuditLog.countDocuments(),eventsBefore+1);
    const edits=await Promise.all(['A','B'].map(title=>api('/admin/books/'+draft.id,{method:'PATCH',data:{expectedRevision:draft.revision,title}})));assert.deepEqual(edits.map(r=>r.status).sort(),[200,409]);
    const mediaDoc=await f.models.MediaAsset.findById(document.id).select('+key');await f.storage.delete({key:mediaDoc.key});assert.equal((await api('/media/'+document.id+'/content')).status,404);
    assert.equal((await api('/admin/books/'+book.id,{method:'DELETE',data:{expectedRevision:book.revision}})).status,200);assert.equal((await api('/books/'+book.id,{actor:null})).status,404);assert.ok(await f.models.Book.findById(book.id));
    assert.equal(await f.models.User.countDocuments(),3);assert.equal(await f.models.AdmissionApplication.countDocuments(),0);
  });
});
