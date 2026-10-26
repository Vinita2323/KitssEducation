import test from 'node:test';
import assert from 'node:assert/strict';
import { createMaintenanceWorker } from '../src/utils/maintenance-worker.js';
import { localDatabase, connectLocal } from '../src/modules/operations/local-recovery.js';
import { retireLegacyIndexes } from '../src/utils/legacy-indexes.js';
import { processorReadiness, scannerReadiness } from '../src/modules/operations/diagnostics.js';
import { startServer } from '../src/server.js';
import { testConfig, silentLogger } from './helpers.js';

test('recovery guards reject remote, ambiguous, credential-bearing and unconfirmed database selection',()=>{
  for(const uri of ['mongodb+srv://remote/kitss_dev','mongodb://remote:27017/kitss_dev','mongodb://user:private@127.0.0.1:27017/kitss_dev','mongodb://127.0.0.1:27017/admin','mongodb://127.0.0.1:27017/kitss_production','mongodb://127.0.0.1:27017/kitss_dev?replicaSet=x']) assert.throws(()=>localDatabase(uri,true));
  assert.throws(()=>localDatabase('mongodb://127.0.0.1:27247/kitss_stage17_local'));
  assert.equal(localDatabase('mongodb://127.0.0.1:27247/kitss_stage17_local',true),'kitss_stage17_local');
});

test('legacy index retirement refuses unexpected keys/options and never deletes records',async()=>{
  const dropped=[];
  const Model={collection:{indexes:async()=>[{name:'orderId_1',unique:true,key:{privateConstraint:1}}],dropIndex:async name=>dropped.push(name)}};
  await assert.rejects(retireLegacyIndexes(Model,[['orderId_1',{orderId:1}]]),{code:'INDEX_COMPATIBILITY'});
  assert.deepEqual(dropped,[]);
  for(const extra of [{collation:{locale:'en'}},{expireAfterSeconds:10},{hidden:true},{sparse:true}]) {
    Model.collection.indexes=async()=>[{name:'orderId_1',unique:true,key:{orderId:1},...extra}];
    await assert.rejects(retireLegacyIndexes(Model,[['orderId_1',{orderId:1}]]),{code:'INDEX_COMPATIBILITY'});
    assert.deepEqual(dropped,[]);
  }
  Model.collection.indexes=async()=>[{name:'orderId_1',unique:true,key:{orderId:1}}];
  await retireLegacyIndexes(Model,[['orderId_1',{orderId:1}]]);assert.deepEqual(dropped,['orderId_1']);
});

test('worker shutdown drains active work, prevents new ticks and does not overlap execution',async()=>{
  let release,entered,finished=0;
  const started=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  const worker=createMaintenanceWorker({name:'test',intervalMs:1000,logger:silentLogger,tasks:[async()=>{entered();await gate;finished++;},async()=>{throw new Error('must not run after stop');}]});
  const first=worker.tick(),second=worker.tick();assert.equal(first,second);await started;
  worker.stop();let drained=false;const draining=worker.drain().then(()=>drained=true);
  await new Promise(r=>setImmediate(r));assert.equal(drained,false);
  release();await draining;await worker.tick();assert.equal(finished,1);assert.equal(worker.state().running,false);
});

test('worker failures are safe, bounded metadata and do not starve subsequent maintenance',async()=>{
  let ran=false;const logs=[];
  const worker=createMaintenanceWorker({name:'audit',intervalMs:1000,logger:{error:(...args)=>logs.push(args)},tasks:[async()=>{throw new Error('PRIVATE_PROVIDER_PAYLOAD');},async()=>{ran=true;}]});
  await worker.tick();assert.equal(ran,true);assert.equal(worker.state().failures,1);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_PROVIDER_PAYLOAD/);worker.stop();
});

test('actual server waits for in-flight HTTP and worker work before disconnecting database',async t=>{
  let releaseWorker,releaseHttp,httpEntered;
  const workerGate=new Promise(r=>releaseWorker=r),httpGate=new Promise(r=>releaseHttp=r),entered=new Promise(r=>httpEntered=r);
  let disconnected=false;
  const runtime=await startServer({config:await testConfig(t),port:0,logger:silentLogger,database:{connect:async()=>{},disconnect:async()=>{disconnected=true;},isReady:async()=>{httpEntered();await httpGate;return true;}},storage:{initialize:async()=>{},isReady:async()=>true}});
  const worker=createMaintenanceWorker({name:'test',intervalMs:1000,logger:silentLogger,tasks:[()=>workerGate]});runtime.workers.push(worker);worker.tick();
  const request=fetch('http://127.0.0.1:'+runtime.server.address().port+'/api/v1/health/ready');await entered;
  const closing=runtime.close();await new Promise(r=>setImmediate(r));assert.equal(disconnected,false);
  releaseHttp();assert.equal((await request).status,503);assert.equal(disconnected,false);
  releaseWorker();await closing;assert.equal(disconnected,true);
});

test('unavailable optional processors and scanner expose safe unavailable states',async()=>{
  assert.deepEqual(await processorReadiness('kitss-deliberately-missing-processor'),{ready:false});
  assert.equal((await scannerReadiness({enabled:false})).ready,false);
  assert.equal((await scannerReadiness({enabled:true,port:1})).status,'unavailable');
});

test('local recovery connection failure closes resources and returns a safe operator error',async()=>{
  await assert.rejects(connectLocal('mongodb://127.0.0.1:1/kitss_stage17_unavailable',true),{code:'LOCAL_DATABASE_UNAVAILABLE'});
});

test('malformed optional delivery gate is rejected by central configuration validation',async t=>{
  await assert.rejects(testConfig(t,{FIREBASE_PUSH_ENABLED:'invalid'}),{name:'ConfigurationError'});
});
