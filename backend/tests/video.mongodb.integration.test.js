import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { coachingFixture } from './coaching-fixture.js';
import { serve } from './helpers.js';
import { createMediaService } from '../src/modules/media/media.service.js';

test('Video real inspection, private range delivery, progress and replacement on isolated MongoDB', {skip: !process.env.KITSS_VIDEO_TEST_DB ? 'No isolated test database supplied' : false, timeout:240000}, async t => {
  const f = await coachingFixture(process.env.KITSS_VIDEO_TEST_DB);t.after(()=>f.close());
  const d = await f.seed(), L=f.learning;
  const url=await serve(t,f.app()), origin=f.config.corsOrigins[0];
  const proof=await fetch(url+'/api/v1/auth/csrf');const cookie=proof.headers.getSetCookie()[0].split(';')[0], csrf=(await proof.json()).data.csrfToken;
  const headers = actor => ({Origin:origin,Cookie:cookie+(actor?'; '+(actor.user.roles.includes('student')?'kitss_student_session=':'kitss_staff_session=')+actor.token:''),'X-CSRF-Token':csrf});
  const api=(endpoint,actor=d.student,options={})=>fetch(url+'/api/v1'+endpoint,{...options,headers:{...headers(actor),...options.headers}});
  const bytes=await readFile(new URL('./fixtures/lesson-generated.mp4',import.meta.url));
  const upload = async (content=bytes, actor=d.admin) => {const form=new FormData();form.append('purpose','lesson_video');form.append('idempotencyKey',randomUUID());form.append('file',new Blob([content],{type:'video/mp4'}),'lesson.mp4');return api('/media',actor,{method:'POST',body:form});};
  let asset,lesson, course=d.course;
  await t.test('authorized bounded multipart upload is privately inspected and scanned',async()=>{
    assert.equal((await upload(bytes,d.student)).status,403);
    const response=await upload();assert.equal(response.status,201,await response.clone().text());asset=(await response.json()).data;
    assert.equal(asset.status,'ready');assert.equal(asset.visibility,'private');assert.equal(asset.durationSeconds,20);assert.equal(asset.inspectionVersion,'mp4-h264-aac-v1');assert.equal(asset.key,undefined);
    assert.equal((await api('/media/'+asset.id+'/content')).status,404);
    assert.equal((await api('/media/'+asset.id+'/content',d.admin,{headers:{Range:'bytes=0-15'}})).status,206);
    course=await L.publish(course.id,{expectedRevision:course.revision,publish:false},d.admin.auth,f.ctx);
    lesson=await L.mutate('lessons',null,course.id,{title:'FINAL_GENERATED_VIDEO',subjectKey:'section-1',sortOrder:3,videoAssetId:asset.id,status:'published'},d.admin.auth,f.ctx);
    course=await L.publish(course.id,{expectedRevision:course.revision,publish:true},d.admin.auth,f.ctx);
    const order=await f.service.create({product:{kind:'course_plan',id:d.plan.id},idempotencyKey:randomUUID()},d.student.auth,f.ctx);
    await f.service.startAttempt(order.id,{idempotencyKey:randomUUID()},d.student.auth,f.ctx);const row=await f.models.Order.findById(order.id),payment=f.provider.pay(row.providerOrderId);await f.service.observe(row._id,payment.id,'isolated_video_test',f.ctx);
  });
  await t.test('each request enforces lesson rights and valid 206/416/suffix ranges',async()=>{
    const resource=await L.lesson(course.id,lesson.id,d.student.auth);assert.equal(resource.video.durationSeconds,20);
    const endpoint='/media/'+asset.id+'/content';
    for(const [range,start,end] of [['bytes=0-15',0,15],['bytes=-10',bytes.length-10,bytes.length-1],['bytes=100-',100,bytes.length-1]]){
      const res=await api(endpoint,d.student,{headers:{Range:range}});assert.equal(res.status,206);assert.equal(res.headers.get('content-type'),'video/mp4');assert.equal(res.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(Buffer.from(await res.arrayBuffer()),bytes.subarray(start,end+1));
    }
    for(const range of ['bytes=999999999-','bytes=5-2','bytes=0-1,5-6','bytes=-0']){const res=await api(endpoint,d.student,{headers:{Range:range}});assert.equal(res.status,416);assert.equal(res.headers.get('content-range'),'bytes */'+bytes.length);}
    assert.equal((await api(endpoint,d.other)).status,404);assert.equal((await api(endpoint,null)).status,404);
    const enrollment=await f.models.Enrollment.findOne({userId:d.student.user._id});
    await f.models.Enrollment.updateOne({_id:enrollment._id},{$set:{expiresAt:new Date(0)}});assert.equal((await api(endpoint)).status,404);
    await f.models.Enrollment.updateOne({_id:enrollment._id},{$set:{expiresAt:enrollment.expiresAt,revokedAt:new Date()}});assert.equal((await api(endpoint)).status,404);
    await f.models.Enrollment.updateOne({_id:enrollment._id},{$unset:{revokedAt:1}});
  });
  await t.test('owner-scoped progress uses inspected duration and persisted resume',async()=>{
    let response=await api('/me/lessons/'+lesson.id+'/progress',d.student,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'in_progress',positionSeconds:7.5,videoAssetId:asset.id,expectedRevision:0})});assert.equal(response.status,200,await response.clone().text());
    const progress=(await response.json()).data;
    const replay=await L.progressLesson(lesson.id,{status:'in_progress',expectedRevision:0,positionSeconds:7.5,videoAssetId:asset.id},d.student.auth);assert.equal(replay.revision,progress.revision);
    await assert.rejects(L.progressLesson(lesson.id,{status:'in_progress',expectedRevision:progress.revision,positionSeconds:1,videoAssetId:'000000000000000000000000'},d.student.auth));
    await assert.rejects(L.progressLesson(lesson.id,{status:'in_progress',expectedRevision:progress.revision,positionSeconds:1,durationSeconds:999,videoAssetId:asset.id},d.student.auth));assert.equal(progress.durationSeconds,20);assert.equal((await L.lesson(course.id,lesson.id,d.student.auth)).progress.positionSeconds,7.5);
    await assert.rejects(L.progressLesson(lesson.id,{status:'completed',expectedRevision:progress.revision,positionSeconds:21,videoAssetId:asset.id},d.student.auth));
    await assert.rejects(L.progressLesson(lesson.id,{status:'completed',expectedRevision:0,positionSeconds:5,videoAssetId:asset.id},d.other.auth),{code:'ACCESS_DENIED'});
  });
  await t.test('replacement detaches old access; referenced deletion and pending scanning remain gated',async()=>{
    await assert.rejects(f.media.remove(asset.id,{expectedRevision:asset.revision},f.ctx),{code:'MEDIA_REFERENCED'});
    course=await L.publish(course.id,{expectedRevision:course.revision,publish:false},d.admin.auth,f.ctx);
    const replacement=(await (await upload()).json()).data;
    lesson=await L.mutate('lessons',lesson.id,course.id,{videoAssetId:replacement.id,expectedRevision:lesson.revision},d.admin.auth,f.ctx);
    course=await L.publish(course.id,{expectedRevision:course.revision,publish:true},d.admin.auth,f.ctx);
    await assert.rejects(L.progressLesson(lesson.id,{status:'completed',positionSeconds:1,videoAssetId:asset.id,expectedRevision:1},d.student.auth));
    assert.equal((await api('/media/'+asset.id+'/content')).status,404);assert.equal((await api('/media/'+replacement.id+'/content',d.student,{headers:{Range:'bytes=0-15'}})).status,206);
    assert.equal((await L.lesson(course.id,lesson.id,d.student.auth)).progress.positionSeconds,0);
    await f.media.remove(asset.id,{expectedRevision:asset.revision},f.ctx);
    const pending=createMediaService({models:f.models,storage:f.storage,coordination:f.coordination,config:f.config,authService:f.auth,scanner:{configured:false,scan:async stream=>{stream.destroy();return 'pending';}}});
    const quarantined=await pending.upload({purpose:'lesson_video',originalName:'pending.mp4',mime:'video/mp4',stream:Readable.from(bytes),idempotencyKey:randomUUID(),auth:d.admin.auth,ctx:f.ctx});
    assert.equal(quarantined.status,'quarantined');await assert.rejects(f.media.linkable(quarantined.id,'lesson_video',d.admin.auth));assert.equal((await api('/media/'+quarantined.id+'/content',d.admin)).status,404);
  });
  await t.test('corrupt/interrupted files are rejected and failed staging is inaccessible',async()=>{
    for(const content of [Buffer.from('not mp4'),bytes.subarray(0,1000)])assert.equal((await upload(content)).status,415);
    const broken=Readable.from((async function*(){yield bytes.subarray(0,1000);throw new Error('interrupted');})());
    await assert.rejects(f.media.upload({purpose:'lesson_video',originalName:'broken.mp4',mime:'video/mp4',stream:broken,idempotencyKey:randomUUID(),auth:d.admin.auth,ctx:f.ctx}));
    assert.deepEqual(await readdir(path.join(f.storage.root,'staging')),[]);
    assert.equal(await f.models.MediaAsset.countDocuments({status:'staged'}),0);
    const limited=createMediaService({models:f.models,storage:f.storage,coordination:f.coordination,config:{...f.config,media:{...f.config.media,videoMaxBytes:1024}},authService:f.auth});
    await assert.rejects(limited.upload({purpose:'lesson_video',originalName:'oversize.mp4',mime:'video/mp4',stream:Readable.from(bytes),idempotencyKey:randomUUID(),auth:d.admin.auth,ctx:f.ctx}),{code:'FILE_TOO_LARGE'});
    assert.deepEqual(await readdir(path.join(f.storage.root,'staging')),[]);
  });
});
