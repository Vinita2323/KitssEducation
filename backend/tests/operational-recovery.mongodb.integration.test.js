import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { cp, mkdtemp, writeFile, appendFile, readFile, rm, unlink, copyFile } from 'node:fs/promises';
import os from 'node:os';
import { Readable } from 'node:stream';
import { stage8Fixture } from './stage8-fixture.js';
import { FakePaymentProvider } from './commerce-fixture.js';
import { createScanner } from '../src/modules/media/inspection.js';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { startServer } from '../src/server.js';
import { backupDatabase, restoreDatabase, connectLocal, inventory, sameInventory, compatibilityReport, storageIntegrity, relationshipIntegrity } from '../src/modules/operations/local-recovery.js';
import { createNotificationService } from '../src/modules/notifications/notifications.js';
const name=process.env.KITSS_STAGE17_TEST_DB;
const fresh=()=>randomUUID().replaceAll('-','').slice(0,16);

test('Stage 17 real dump/restore, restored-copy migration, lifecycle, queues and media safety', {skip:!name?'No isolated Stage 17 database supplied':false,timeout:360000},async t=>{
  const sourceBase=process.env.MONGODB_URI;
  assert.ok(['mongodb://127.0.0.1:27247/kitss_stage17_local','mongodb://127.0.0.1:27249/kitss_stage18_local'].includes(sourceBase));
  const localUri=database=>sourceBase.replace(/\/kitss_stage(?:17|18)_local$/,'/'+database);
  const actual=process.env.KITSS_REAL_MEDIA_ACCEPTANCE==='true';
  const configMedia={enabled:true,port:3315,scanTimeoutMs:120000};
  let outcome='retry',sends=0;
  const f=await stage8Fixture(name,{businessEvents:true,scanner:actual?createScanner(configMedia):undefined,notificationTransport:{configured:true,async send(){sends++;return {status:outcome};}}});
  t.after(()=>f.close());const d=await f.seed(),N=f.notifications,ctx={...f.ctx,actorId:d.admin.user.publicId};
  let backup,restoredUri,restored,copyRoot,runtime,protectedBefore;
  t.after(async()=>{await runtime?.close();await restored?.close();});
  const protectedFacts=async connection=>{
    const result={};
    const fieldsByCollection=[
      ['users',{roles:1,permissions:1,status:1}],
      ['orders',{status:1,capturedPaymentId:1,amountMinor:1,fulfillment:1}],
      ['bookEntitlements',{source:1,orderId:1,userId:1,bookId:1}],
      ['enrollments',{source:1,orderId:1,userId:1,courseId:1}],
      ['registrationApplications',{status:1,paymentState:1,userId:1}],
      ['resultRecords',{status:1,review:1}],
      ['fcmTokens',{token:1,userId:1,sessionId:1}],
      ['jobs',{key:1,kind:1,state:1}],
    ];
    for(const [collection,fields] of fieldsByCollection)result[collection]=await connection.db.collection(collection).find({},{projection:fields}).sort({_id:1}).toArray();
    return JSON.stringify(result);
  };
  await t.test('synthetic verified paid access and registration review generate committed notices',async()=>{
    await f.service.business.save({value:{registrations:{study:{status:'active',feeRequired:false,amountMinor:0,currency:'INR',documents:[],privacyApproved:true,documentsApproved:true}}},expectedRevision:0,reason:'Synthetic recovery fixture'},d.admin.auth,ctx);
    let application=await f.service.createApplication({kind:'study',applicant:{studentName:'Synthetic recovery applicant',dob:'1990-01-01'},idempotencyKey:randomUUID()},d.student.auth,ctx);
    application=await f.service.business.submit(application.id,{expectedRevision:application.revision,declaration:true},d.student.auth,ctx);
    await f.service.business.review(application.id,{expectedRevision:application.revision,status:'pending_verification',reason:'Synthetic review'},d.admin.auth,ctx);
    for(const product of [{kind:'book',id:d.book.id},{kind:'course_plan',id:d.plan.id}]){
      const order=await f.service.create({product,idempotencyKey:randomUUID()},d.student.auth,ctx),key=randomUUID(),attempt=await f.service.startAttempt(order.id,{idempotencyKey:key},d.student.auth,ctx),payment=f.provider.pay(attempt.providerOrderId);
      await f.service.verify({orderId:order.id,attemptId:key,razorpay_order_id:attempt.providerOrderId,razorpay_payment_id:payment.id,razorpay_signature:f.provider.sign(attempt.providerOrderId+'|'+payment.id)},d.student.auth,ctx);await f.service.fulfill(order.id);
    }
    await N.tick();assert.ok(await N.models.Notification.countDocuments());assert.equal(await f.models.BookEntitlement.countDocuments(),1);assert.equal(await f.models.Enrollment.countDocuments(),1);
    await f.service.create({product:{kind:'book',id:d.book.id},idempotencyKey:randomUUID()},d.other.auth,ctx);
    const issuer=await f.models.ResultIssuer.create({key:'synthetic-recovery',type:'school',name:'Synthetic',status:'draft'});
    const exam=await f.models.Exam.create({issuerId:issuer._id,key:'synthetic',status:'draft'});
    await f.models.ResultRecord.create({examId:exam._id,rollNormalized:'SYNTHETIC-RESTORE',userId:d.student.user._id,status:'draft',review:{status:'draft'}});
  });
  await t.test('provider failure, two workers, expired lease, retry exhaustion and restart preserve durable job ownership',async()=>{
    await N.fcm.saveToken(d.student.auth,{token:'SYNTHETIC_STAGE17_DEVICE_TOKEN_123456789'},ctx);
    let draft=await N.mutate(null,{title:'Synthetic recovery notice',message:'No private push payload',category:'general',audience:{kind:'users',userIds:[String(d.student.user._id)]}},ctx);
    await N.publish(draft.id,{expectedRevision:draft.revision},ctx);await N.processPush();
    let job=await f.models.Job.findOne({kind:'notification_push'});assert.equal(job.state,'pending');
    await f.models.Job.updateOne({_id:job._id},{$set:{availableAt:new Date(0)}});outcome='sent';const before=sends;
    await Promise.all([N.processPush(),N.processPush()]);assert.equal(sends-before,1);assert.equal((await f.models.Job.findById(job._id)).state,'done');
    await f.models.Job.updateOne({_id:job._id},{$set:{state:'leased',leaseUntil:new Date(0),attempts:7}});outcome='retry';await N.processPush();
    job=await f.models.Job.findById(job._id);assert.equal(job.state,'dead');assert.equal(job.attempts,8);
    const restarted=await createNotificationService({connection:f.connection,authService:f.auth,publishingModule:f,coachingService:f.learning,fcmService:N.fcm,businessEvents:true});await restarted.tick();assert.equal((await f.models.Job.findById(job._id)).state,'dead');
  });
  await t.test('real driver disconnect and audit failure recover without losing committed changes',async()=>{
    const original=f.models.AuditLog.updateOne;f.models.AuditLog.updateOne=()=>{throw new Error('Synthetic outage');};
    let draft;try{draft=await N.mutate(null,{title:'Persisted outbox',message:'Synthetic',category:'general',audience:{kind:'all_students'}},ctx);}finally{f.models.AuditLog.updateOne=original;}
    assert.ok((await N.models.Notification.findById(draft.id)).auditOutbox.length);await N.maintenance();assert.equal((await N.models.Notification.findById(draft.id)).auditOutbox.length,0);
    await f.connection.close();await assert.rejects(N.tick());await f.connection.openUri(process.env.MONGODB_URI,{dbName:name,autoIndex:false,bufferCommands:false});await N.tick();
    assert.equal(await N.models.Notification.countDocuments({title:'Persisted outbox'}),1);
  });
  await t.test('self-generated media scans and missing/orphan detection are dry-run only',async()=>{
    if(actual){const bytes=await readFile(new URL('./fixtures/lesson-generated.mp4',import.meta.url));const asset=await f.media.upload({purpose:'lesson_video',stream:Readable.from(bytes),mime:'video/mp4',originalName:'synthetic.mp4',idempotencyKey:randomUUID(),auth:d.admin.auth,ctx});assert.equal(asset.status,'ready');}
    const report=await storageIntegrity(f.connection,f.storage);assert.equal(report.deletions,0);assert.equal(report.missingFiles,0);assert.equal(report.checksumMismatches,0);
    const root=await mkdtemp(path.join(os.tmpdir(),'kitss-stage17-media-copy-'));copyRoot=root;await cp(f.storage.root,root,{recursive:true,force:false,errorOnExist:true});
    t.after(async()=>{const relative=path.relative(os.tmpdir(),root);if(!relative.startsWith('kitss-stage17-media-copy-')||relative.includes(path.sep)||path.isAbsolute(relative))throw new Error('Unsafe task media cleanup');await rm(root,{recursive:true,force:true});});
    const storage=new LocalStorageProvider({...f.config.storage,root});await storage.initialize();
    await storage.upload({stream:Readable.from('synthetic orphan'),purpose:'files'});
    const dry=await storageIntegrity(f.connection,storage);assert.equal(dry.orphanFiles,1);assert.equal(dry.deletions,0);
    const asset=await f.models.MediaAsset.findOne({purpose:'book_full',status:'ready'}).select('+key');
    const source=await f.storage.filePath(asset.key),copied=await storage.filePath(asset.key);
    assert.ok(copied.startsWith(root+path.sep));assert.notEqual(source,copied);
    await unlink(copied);assert.equal((await storageIntegrity(f.connection,storage)).missingFiles,1);
    await copyFile(source,copied);await writeFile(copied,'synthetic corrupt copy');
    assert.equal((await storageIntegrity(f.connection,storage)).checksumMismatches,1);
    await copyFile(source,copied);assert.equal((await storageIntegrity(f.connection,storage)).checksumMismatches,0);
  });
  await t.test('legacy indexes and unbound tokens are inventoried without mutating records',async()=>{
    await f.connection.db.collection('fcmTokens').insertOne({token:'SYNTHETIC_LEGACY_TOKEN_123456789',userId:d.other.user._id,platform:'web'});
    await f.models.Order.collection.createIndex({userId:1,'product.kind':1,'product.id':1},{unique:true});
    await f.models.Order.collection.createIndex({userId:1,'product.courseId':1},{unique:true,partialFilterExpression:{'product.kind':'course_plan'}});
    await f.models.BookEntitlement.collection.createIndex({orderId:1},{unique:true});await f.models.Enrollment.collection.createIndex({orderId:1},{unique:true});
    const report=await compatibilityReport(f.connection);assert.equal(report.legacyDevices,1);assert.equal(report.legacyUniqueIndexes.length,4);assert.equal((await N.fcm.tokensFor(d.other.user._id)).length,0);
    protectedBefore=await protectedFacts(f.connection);
  });
  await t.test('official mongodump creates a retained archive with full collection/index/record coverage',async()=>{
    backup=await backupDatabase({uri:localUri(name),confirmedLocal:true,writesQuiesced:true,dumpBinary:process.env.KITSS_MONGODUMP_BINARY});
    assert.equal(backup.manifest.completed,true);assert.ok(backup.manifest.bytes>0);assert.ok(backup.manifest.inventory.collections.length>20);
    assert.ok(backup.manifest.inventory.collections.some(c=>c.name==='orders'&&c.count===3));
  });
  await t.test('mongorestore verifies a fresh namespace, exact BSON fingerprints, options, indexes and relationships',async()=>{
    const target='kitss_stage17_restore_'+fresh();restoredUri=localUri(target);
    const result=await restoreDatabase({uri:restoredUri,confirmedLocal:true,directory:backup.directory,restoreBinary:process.env.KITSS_MONGORESTORE_BINARY});assert.equal(result.verified,true);
    restored=await connectLocal(restoredUri,true);assert.equal(await protectedFacts(restored),protectedBefore);
    assert.deepEqual(await relationshipIntegrity(restored),await relationshipIntegrity(f.connection));
    await assert.rejects(restoreDatabase({uri:restoredUri,confirmedLocal:true,directory:backup.directory,restoreBinary:process.env.KITSS_MONGORESTORE_BINARY}),{code:'RESTORE_TARGET_NOT_EMPTY'});
  });
  await t.test('restored application starts twice; index replacements preserve business authority and tokens',async()=>{
    for(let i=0;i<2;i++){
      const config={...f.config,mongo:{...f.config.mongo,uri:restoredUri,dbName:restored.name,requireReplicaSet:false},storage:{...f.config.storage,root:copyRoot},firebase:{pushEnabled:false,configJson:'',serviceAccountPath:''},smtp:{...f.config.smtp,host:'',user:'',appPassword:'',from:''}};
      runtime=await startServer({config,logger:f.logger,port:0,commerceProvider:new FakePaymentProvider()});
      const url='http://127.0.0.1:'+runtime.server.address().port+'/api/v1';assert.equal((await fetch(url+'/health/ready')).status,200);
      assert.equal((await fetch(url+'/auth/me',{headers:{Cookie:'kitss_student_session='+d.student.token}})).status,200);
      const adminHeaders={Cookie:'kitss_staff_session='+d.admin.token};const health=await fetch(url+'/admin/operations/health',{headers:adminHeaders});assert.equal(health.status,200);
      const body=await health.json();assert.equal(body.data.workers.length,2);assert.doesNotMatch(JSON.stringify(body),/SYNTHETIC_STAGE17_DEVICE|token|password|[A-Z]:\\/);
      assert.equal((await fetch(url+'/admin/operations/health',{headers:{Cookie:'kitss_student_session='+d.student.token}})).status,403);
      assert.equal(await protectedFacts(restored),protectedBefore);await runtime.close();runtime=undefined;
      assert.equal(await restored.db.collection('orders').countDocuments({userId:d.other.user._id,status:'pending'}),1);
      assert.equal(await restored.db.collection('bookEntitlements').countDocuments({userId:d.other.user._id}),0);
    }
    assert.equal((await compatibilityReport(restored)).legacyUniqueIndexes.length,0);assert.equal((await compatibilityReport(restored)).legacyDevices,1);
  });
  await t.test('corrupt backup refuses restore and original source remains byte-equivalent',async()=>{
    const bad=path.join(path.dirname(backup.directory),'corrupt-'+fresh());await cp(backup.directory,bad,{recursive:true});await appendFile(path.join(bad,'database.archive.gz'),'corruption');
    await assert.rejects(restoreDatabase({uri:localUri('kitss_stage17_restore_'+fresh()),confirmedLocal:true,directory:bad,restoreBinary:process.env.KITSS_MONGORESTORE_BINARY}),{code:'BACKUP_INTEGRITY_FAILED'});
    assert.equal(sameInventory(backup.manifest.inventory,await inventory(f.connection,{fingerprints:true})),true);
    await writeFile(new URL('../../.runtime/'+(sourceBase.includes('stage18')?'stage18-synthetic-recovery-evidence.json':'stage17-recovery-evidence.json'),import.meta.url),JSON.stringify({syntheticOnly:true,backupRelative:path.relative(path.resolve('..'),backup.directory),archiveSha256:backup.manifest.sha256,collections:backup.manifest.inventory.collections.length,documents:backup.manifest.inventory.collections.reduce((n,c)=>n+c.count,0),restoreVerified:true,originalPreserved:true,media:await storageIntegrity(f.connection,f.storage)},null,2));
  });
  await t.test('conflicting legacy token ownership blocks startup with a safe recovery path and preserves both rows',async()=>{
    const devices=restored.db.collection('fcmTokens');await devices.dropIndex('unique_push_device');
    const old=await devices.findOne({sessionId:{$exists:false}});
    await devices.insertOne({...old,_id:undefined,userId:d.student.user._id});
    const before=await protectedFacts(restored);
    const config={...f.config,mongo:{...f.config.mongo,uri:restoredUri,dbName:restored.name,requireReplicaSet:false},storage:{...f.config.storage,root:copyRoot},firebase:{pushEnabled:false},smtp:{...f.config.smtp,host:'',user:'',appPassword:'',from:''}};
    await assert.rejects(startServer({config,logger:f.logger,port:0,commerceProvider:new FakePaymentProvider()}),{code:'PUSH_INDEX_COMPATIBILITY'});
    assert.equal(await protectedFacts(restored),before);assert.equal((await compatibilityReport(restored)).duplicateDeviceGroups,1);
  });
  await t.test('failed tools and unquiesced backup cannot claim success; failed restore never overwrites a destination',async()=>{
    const uri=localUri(name);
    await assert.rejects(backupDatabase({uri,confirmedLocal:true,writesQuiesced:false,dumpBinary:process.env.KITSS_MONGODUMP_BINARY}),{code:'QUIESCED_WRITES_REQUIRED'});
    await assert.rejects(backupDatabase({uri,confirmedLocal:true,writesQuiesced:true,dumpBinary:'kitss-deliberately-missing-dump'}),{code:'DATABASE_TOOL_FAILED'});
    const target=localUri('kitss_stage17_restore_'+fresh());
    await assert.rejects(restoreDatabase({uri:target,confirmedLocal:true,directory:backup.directory,restoreBinary:'kitss-deliberately-missing-restore'}),{code:'DATABASE_TOOL_FAILED'});
    const partial=await connectLocal(target,true);
    try { assert.equal((await partial.db.listCollections().toArray()).length,1); }
    finally { await partial.close(); }
    await assert.rejects(restoreDatabase({uri:target,confirmedLocal:true,directory:backup.directory,restoreBinary:process.env.KITSS_MONGORESTORE_BINARY}),{code:'RESTORE_TARGET_NOT_EMPTY'});
  });
});
