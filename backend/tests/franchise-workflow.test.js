import test from 'node:test';
import assert from 'node:assert/strict';
import { workflowPolicy, initialWorkflowPolicy } from '../src/modules/franchise/policy.js';
import { commerceFixture } from './commerce-fixture.js';
import { pdfBytes } from './publishing-fixture.js';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { serve } from './helpers.js';

test('franchise policy validates bounded supported rules and explicit free fees', () => {
  const p = initialWorkflowPolicy(); assert.equal(workflowPolicy(p).joining.amountMinor,0);
  for (const patch of [{applicationMode:'anywhere'},{minimumYears:-1},{joining:{...p.joining,amountMinor:20}},{renewal:{...p.renewal,months:0}},{agreement:{version:'1',text:''}},{documents:[{...p.documents[0],mime:['text/html']}]},{documents:[p.documents[0],p.documents[0]]},{existingRecords:'retroactive'},{effectiveFrom:'invalid'}]) assert.throws(()=>workflowPolicy({...p,...patch}),{status:422});
});
const db=process.env.KITSS_FRANCHISE_TEST_DB;
test('franchise end-to-end: real isolated DB/HTTP, synthetic payment and scanner', {skip:!db?'KITSS_FRANCHISE_TEST_DB missing; no database tests executed':false,timeout:300000}, async t=>{
  const f=await commerceFixture(db);t.after(()=>f.close());const api=f.service.franchise;
  const admin=await f.fixtureUser(),applicant=await f.fixtureUser(['student']),other=await f.fixtureUser(['student']),reviewer=await f.fixtureUser(['admin'],['franchises.read','franchises.review']);
  const url=await serve(t,f.app());
  const csrfRes=await fetch(url+'/api/v1/auth/csrf'),cookie=csrfRes.headers.getSetCookie()[0].split(';')[0],csrf=(await csrfRes.json()).data.csrfToken;
  const request=async(path,method='GET',data,actor=applicant,withCsrf=true)=>{const r=await fetch(url+'/api/v1'+path,{method,headers:{Origin:f.config.corsOrigins[0],Cookie:[actor?(actor.user.roles.includes('student')?'kitss_student_session=':'kitss_staff_session=')+actor.token:'',withCsrf?cookie:''].join('; '),...(withCsrf?{'X-CSRF-Token':csrf}:{}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,body:r.headers.get('content-type')?.includes('json')?await r.json():null};};
  const savePublish=async p=>{let record=await api.adminPolicy();record=await api.savePolicy({expectedRevision:record.revision,reason:'Synthetic policy test',policy:p},admin.auth,f.ctx);return api.savePolicy({expectedRevision:record.revision,reason:'Publish synthetic policy'},admin.auth,f.ctx,true);};
  let p=initialWorkflowPolicy(),row;
  const data=()=>({institution:{name:'Synthetic Test Institute',type:'Institute',yearEstablished:2000},contact:{person:'Test applicant',email:'test@example.invalid',mobile:'9999999999'},location:{address:'Synthetic address',city:'Test City',pincode:'123456'},idempotencyKey:randomUUID()});
  const document=async owner=>f.media.upload({purpose:'franchise_document',originalName:'proof.pdf',mime:'application/pdf',stream:Readable.from(await pdfBytes(1)),idempotencyKey:randomUUID(),auth:owner.auth,ctx:f.ctx});
  const attachAll=async r=>{for(const requirement of p.documents){const asset=await document(applicant);r=await api.attach(r.id,{expectedRevision:r.revision,key:requirement.key,assetId:asset.id},applicant.auth,f.ctx);}return r;};
  const reviewAll=async r=>{for(const doc of r.documents)r=await api.reviewDocument(r.id,{expectedRevision:r.revision,key:doc.key,state:'verified',reason:'Synthetic document checked'},admin.auth,f.ctx);return r;};
  await t.test('publication gate, signed-in ownership, admin permissions, CSRF and immutable versions',async()=>{
    assert.equal((await request('/public/franchise-fees')).status,200);
    assert.equal((await request('/franchise-applications','POST',data(),null)).status,403);
    assert.equal((await request('/franchise-applications','POST',data())).status,409);
    assert.equal((await request('/admin/franchise-policy','PATCH',{expectedRevision:0,reason:'test',policy:p},reviewer)).status,403);
    assert.equal((await request('/admin/franchise-policy','PATCH',{expectedRevision:0,reason:'test',policy:p},admin,false)).status,403);
    await savePublish(p);assert.equal((await request('/public/franchise-policy')).body.data.available,true);
    const before=await api.adminPolicy(); await assert.rejects(api.savePolicy({expectedRevision:before.revision+1,reason:'conflict',policy:p},admin.auth,f.ctx),{status:409});
    await assert.rejects(savePublish({...p,minimumYears:1}),{status:422});
    // Re-save the accepted baseline draft after deliberate rejected publication.
    await savePublish(p);
  });
  await t.test('independent draft, private uploads, cross-user rejection, revisions and document requirements',async()=>{
    const input=data(); row=await api.create(input,applicant.auth,f.ctx);assert.equal((await api.create(input,applicant.auth,f.ctx)).id,row.id);
    assert.equal(row.workflowVersion,1);assert.equal(row.collegeId,undefined);
    assert.equal((await request('/franchise-applications/'+row.id+'/status','GET',undefined,other)).status,404);
    await assert.rejects(api.submit(row.id,{expectedRevision:row.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx),{status:409});
    const asset=await document(applicant);
    assert.equal((await request('/media/'+asset.id+'/content','GET',undefined,null)).status,404);
    assert.equal((await request('/media/'+asset.id+'/content','GET',undefined,other)).status,404);
    assert.equal((await request('/media/'+asset.id+'/content','GET',undefined,reviewer)).status,200);
    await assert.rejects(api.attach(row.id,{expectedRevision:row.revision,key:p.documents[0].key,assetId:(await document(other)).id},applicant.auth,f.ctx),{status:403});
    row=await api.attach(row.id,{expectedRevision:row.revision,key:p.documents[0].key,assetId:asset.id},applicant.auth,f.ctx);
    await assert.rejects(api.edit(row.id,{expectedRevision:row.revision-1,institution:{name:'Stale'}},applicant.auth,f.ctx),{status:409});
    await assert.rejects(f.media.remove(asset.id,{expectedRevision:asset.revision},f.ctx),{status:409});
    for(const requirement of p.documents.slice(1)){const doc=await document(applicant);row=await api.attach(row.id,{expectedRevision:row.revision,key:requirement.key,assetId:doc.id},applicant.auth,f.ctx);}
    row=await api.submit(row.id,{expectedRevision:row.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx);assert.equal(row.status,'pending');assert.equal(row.policySnapshot.version,p.version);
  });
  await t.test('review, corrections, clean document verification and free activation exactly once',async()=>{
    await assert.rejects(api.review(row.id,{expectedRevision:row.revision,status:'approved',reason:'Review'},f.ctx),{status:409});
    row=await api.review(row.id,{expectedRevision:row.revision,status:'needs_changes',reason:'Correct address'},f.ctx);
    row=await api.edit(row.id,{expectedRevision:row.revision,location:{address:'Corrected address',city:'Test City',pincode:'123456'}},applicant.auth,f.ctx);
    row=await api.submit(row.id,{expectedRevision:row.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx);
    row=await reviewAll(row);
    assert.equal((await request('/admin/franchise-applications/'+row.id+'/status','PATCH',{expectedRevision:row.revision,status:'approved',reason:'Review'},reviewer)).status,403);
    row=await api.review(row.id,{expectedRevision:row.revision,status:'approved',reason:'Evidence reviewed'},f.ctx);assert.equal(row.affiliationState,'active');assert.ok(row.activatedAt);
    assert.equal((await api.activate(row.id,{expectedRevision:row.revision},applicant.auth,f.ctx)).activatedAt,row.activatedAt);
  });
  let paid,order,payment;
  await t.test('prospective paid policy preserves old accepted terms; verified joining and duplicate callbacks',async()=>{
    p={...p,version:'franchise-paid-2',joining:{enabled:true,amountMinor:12000,currency:'INR'},renewal:{enabled:true,amountMinor:3000,currency:'INR',months:6,graceDays:3,expiryAction:'suspend'}};await savePublish(p);
    assert.equal((await api.status(row.id,applicant.auth)).policySnapshot.joining.amountMinor,0);
    paid=await api.create(data(),applicant.auth,f.ctx);paid=await attachAll(paid);paid=await api.submit(paid.id,{expectedRevision:paid.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx);paid=await reviewAll(paid);paid=await api.review(paid.id,{expectedRevision:paid.revision,status:'approved',reason:'Reviewed'},f.ctx);
    assert.equal(paid.affiliationState,'awaiting_payment');await assert.rejects(api.activate(paid.id,{expectedRevision:paid.revision},applicant.auth,f.ctx),{status:409});
    const input={product:{kind:'franchise_joining',id:paid.id},idempotencyKey:randomUUID()};order=await f.service.create(input,applicant.auth,f.ctx);assert.equal(order.amountMinor,12000);assert.equal((await f.service.create(input,applicant.auth,f.ctx)).id,order.id);
    const attempt=await f.service.startAttempt(order.id,{idempotencyKey:randomUUID()},applicant.auth,f.ctx);payment=f.provider.pay(attempt.providerOrderId);
    const evidence={orderId:order.id,attemptId:attempt.attemptId,razorpay_order_id:attempt.providerOrderId,razorpay_payment_id:payment.id,razorpay_signature:'wrong'};
    await assert.rejects(f.service.verify(evidence,applicant.auth,f.ctx),{status:400});await assert.rejects(f.service.verify({...evidence,razorpay_signature:f.provider.sign(attempt.providerOrderId+'|'+payment.id)},other.auth,f.ctx),{status:404});
    evidence.razorpay_signature=f.provider.sign(attempt.providerOrderId+'|'+payment.id);await f.service.verify(evidence,applicant.auth,f.ctx);await f.service.verify(evidence,applicant.auth,f.ctx);
    paid=await api.status(paid.id,applicant.auth);assert.equal(paid.affiliationState,'active');assert.ok(paid.renewalDueAt);assert.equal((await f.service.owned(order.id,applicant.auth)).fulfillment.state,'applied');
  });
  await t.test('renewal reminders, expiry, new agreement, verified paid renewal and idempotency',async()=>{
    await f.models.FranchiseApplication.updateOne({_id:paid.id},{$set:{renewalDueAt:new Date(Date.now()-5*86400000),nextFranchiseCheckAt:new Date(0)}});
    await api.maintenance();paid=await api.status(paid.id,applicant.auth);assert.equal(paid.affiliationState,'suspended');
    assert.equal(await f.models.AuditLog.countDocuments({subjectId:paid.id,action:'franchise_expired'}),1);await api.maintenance();assert.equal(await f.models.AuditLog.countDocuments({subjectId:paid.id,action:'franchise_expired'}),1);
    await assert.rejects(f.service.create({product:{kind:'franchise_renewal',id:paid.id},idempotencyKey:randomUUID()},applicant.auth,f.ctx),{status:409});
    paid=await api.acceptRenewal(paid.id,{expectedRevision:paid.revision,agreementVersion:p.agreement.version,accepted:true},applicant.auth,f.ctx);
    let renewal=await f.service.create({product:{kind:'franchise_renewal',id:paid.id},idempotencyKey:randomUUID()},applicant.auth,f.ctx);const attempt=await f.service.startAttempt(renewal.id,{idempotencyKey:randomUUID()},applicant.auth,f.ctx);const captured=f.provider.pay(attempt.providerOrderId);
    await f.service.observe(renewal.id,captured.id,'synthetic');await f.service.fulfill(renewal.id);await f.service.fulfill(renewal.id);
    paid=await api.status(paid.id,applicant.auth);assert.equal(paid.affiliationState,'active');assert.equal(paid.renewalEffects.length,1);assert.ok(Date.parse(paid.renewalDueAt)>Date.now());
    const summary=await f.service.summary({});assert.equal(summary.groups.filter(g=>g._id.status==='captured').reduce((sum,g)=>sum+g.amountMinor,0),15000);
  });
  await t.test('free renewals and prospective disablement, private files remain protected',async()=>{
    p={...p,version:'franchise-free-renewal-3',renewal:{...p.renewal,amountMinor:0}};await savePublish(p);
    await f.models.FranchiseApplication.updateOne({_id:paid.id},{$set:{renewalDueAt:new Date(Date.now()-1000)}});paid=await api.status(paid.id,applicant.auth);
    paid=await api.freeRenew(paid.id,{expectedRevision:paid.revision,agreementVersion:p.agreement.version,accepted:true},applicant.auth,f.ctx);assert.equal(paid.affiliationState,'active');assert.equal(paid.renewalEffects.length,2);assert.equal(paid.renewalEffects[1].policySnapshot.agreement.text,p.agreement.text);
    p={...p,version:'franchise-no-renewal-4',renewal:{...p.renewal,enabled:false}};await savePublish(p);
    await f.models.FranchiseApplication.updateOne({_id:paid.id},{$set:{renewalDueAt:new Date(Date.now()-1000)}});paid=await api.status(paid.id,applicant.auth);
    paid=await api.freeRenew(paid.id,{expectedRevision:paid.revision,agreementVersion:p.agreement.version,accepted:true},applicant.auth,f.ctx);assert.equal(paid.renewalDueAt,null);
    assert.equal((await request('/public/franchise-fees')).body.data.state,'configured');
  });
  await t.test('signed webhook retry and interrupted franchise fulfillment reconcile exactly once',async()=>{
    let r=await api.create(data(),applicant.auth,f.ctx);r=await attachAll(r);r=await api.submit(r.id,{expectedRevision:r.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx);r=await reviewAll(r);r=await api.review(r.id,{expectedRevision:r.revision,status:'approved',reason:'Reviewed'},f.ctx);
    const order=await f.service.create({product:{kind:'franchise_joining',id:r.id},idempotencyKey:randomUUID()},applicant.auth,f.ctx),attempt=await f.service.startAttempt(order.id,{idempotencyKey:randomUUID()},applicant.auth,f.ctx),payment=f.provider.pay(attempt.providerOrderId);
    const body=Buffer.from(JSON.stringify({event:'payment.captured',payload:{payment:{entity:payment}}})),eventId=randomUUID();
    await f.service.receiveWebhook(body,f.provider.sign(body),eventId);await f.service.receiveWebhook(body,f.provider.sign(body),eventId);
    const fulfill=api.fulfill;api.fulfill=async()=>{throw new Error('Synthetic database interruption');};
    try{await assert.rejects(f.service.observe(order.id,payment.id,'synthetic'));}finally{api.fulfill=fulfill;}
    assert.equal((await api.status(r.id,applicant.auth)).activatedAt,undefined);
    await f.service.reconcile({id:order.id},f.ctx);await f.service.tick();await f.service.fulfill(order.id);
    r=await api.status(r.id,applicant.auth);assert.equal(r.affiliationState,'active');
    assert.equal(await f.models.Job.countDocuments({paymentId:payment.id}),1);assert.equal(await f.models.AuditLog.countDocuments({subjectId:r.id,action:'franchise_activated'}),1);
    const {businessNotice}=await import('../src/modules/notifications/business-events.js');
    const event=await f.models.AuditLog.findOne({subjectId:r.id,action:'franchise_activated'}).lean();const notice=await businessNotice(event,{connection:f.connection,User:f.auth.models.User});assert.ok(notice.message.includes('active'));assert.equal(notice.audience.userIds[0],String(applicant.user._id));
  });
  await t.test('new-application pause, manual expiry review, future policy and unrelated-policy preservation',async()=>{
    const before=await api.adminPolicy();await api.savePolicy({expectedRevision:before.revision,reason:'Future draft',policy:{...p,version:'future-policy',effectiveFrom:'2099-01-01T00:00:00.000Z'}},admin.auth,f.ctx);
    assert.equal((await api.policy()).version,p.version);
    const {value,revision}=await f.service.business.settings();await f.service.business.save({value:{...value,franchise:undefined},expectedRevision:revision,reason:'Preserve franchise policy while editing other settings'},admin.auth,f.ctx);assert.equal((await api.policy()).version,p.version);
    p={...p,version:'manual-review-5',joining:{enabled:false,amountMinor:0,currency:'INR'},renewal:{...p.renewal,enabled:true,amountMinor:0,expiryAction:'manual_review'}};await savePublish(p);
    let r=await api.create(data(),applicant.auth,f.ctx);r=await attachAll(r);r=await api.submit(r.id,{expectedRevision:r.revision,declaration:{version:p.agreement.version,accepted:true}},applicant.auth,f.ctx);r=await reviewAll(r);r=await api.review(r.id,{expectedRevision:r.revision,status:'approved',reason:'Reviewed'},f.ctx);
    await f.models.FranchiseApplication.updateOne({_id:r.id},{$set:{renewalDueAt:new Date(Date.now()-10*86400000),nextFranchiseCheckAt:new Date(0)}});r=await api.status(r.id,applicant.auth);assert.equal(r.affiliationState,'renewal_review');
    await assert.rejects(api.freeRenew(r.id,{expectedRevision:r.revision,agreementVersion:p.agreement.version,accepted:true},applicant.auth,f.ctx),{status:409});
    r=await api.reviewRenewal(r.id,{expectedRevision:r.revision,reason:'Evidence rechecked'},f.ctx);r=await api.freeRenew(r.id,{expectedRevision:r.revision,agreementVersion:p.agreement.version,accepted:true},applicant.auth,f.ctx);assert.equal(r.affiliationState,'active');
    await assert.rejects(api.create({...data(),collegeId:String(new (await import('mongoose')).default.Types.ObjectId())},applicant.auth,f.ctx),{status:422});
    await assert.rejects(api.create({...data(),institution:{name:'Ineligible',type:'Not configured'}},applicant.auth,f.ctx),{status:422});
    p={...p,version:'paused-6',acceptingApplications:false};await savePublish(p);await assert.rejects(api.create(data(),applicant.auth,f.ctx),{status:409});assert.equal((await api.status(r.id,applicant.auth)).policySnapshot.version,'manual-review-5');
  });

});
