import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp,rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import mongoose from 'mongoose';
import net from 'node:net';
import { createDatabase } from '../src/config/database.js';
import { silentLogger } from './helpers.js';

test('task-owned real MongoDB interrupted process restarts with journaled data and recovers connectivity',{skip:!process.env.KITSS_MONGOD_BINARY?'No explicit local MongoDB executable supplied':false,timeout:60000},async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'kitss-stage17-interruption-'));
  let child,connection;
  async function stop(){if(!child||child.exitCode!==null)return;const closed=once(child,'exit');child.kill();await closed;child=undefined;}
  t.after(async()=>{await connection?.close();await stop();const relative=path.relative(os.tmpdir(),root);if(!relative.startsWith('kitss-stage17-interruption-')||relative.includes(path.sep)||path.isAbsolute(relative))throw new Error('Unsafe task cleanup');await rm(root,{recursive:true,force:true});});
  const uri='mongodb://127.0.0.1:27248/kitss_stage17_interrupt_test';
  async function start(){
    const reservation=net.createServer();
    await new Promise((resolve,reject)=>{reservation.once('error',reject);reservation.listen(27248,'127.0.0.1',resolve);});
    await new Promise(resolve=>reservation.close(resolve));
    child=spawn(process.env.KITSS_MONGOD_BINARY,['--dbpath',root,'--port','27248','--bind_ip','127.0.0.1','--logpath',path.join(root,'mongod.log')],{windowsHide:true,stdio:'ignore'});
    let last;
    for(let i=0;i<30;i++){
      if(child.exitCode!==null)throw new Error('Task MongoDB failed to start; port may be occupied');
      connection=mongoose.createConnection(uri,{serverSelectionTimeoutMS:200,connectTimeoutMS:200});
      try{await connection.asPromise();const status=await connection.db.admin().command({serverStatus:1});assert.equal(status.pid,child.pid);return;}catch(e){last=e;await connection.close();await new Promise(r=>setTimeout(r,100));}
    }
    throw new Error('Task MongoDB did not become ready');
  }
  await start();await connection.db.collection('sentinel').insertOne({_id:'synthetic',value:'durable'},{writeConcern:{w:1,j:true}});
  await connection.close();await stop();
  const database=createDatabase({uri,serverSelectionTimeoutMS:100,connectTimeoutMS:100,socketTimeoutMS:1000,maxPoolSize:1,requireReplicaSet:false},silentLogger);
  await assert.rejects(database.connect(),{code:'DATABASE_UNAVAILABLE'});
  await start();assert.equal((await connection.db.collection('sentinel').findOne({_id:'synthetic'})).value,'durable');
  await database.connect();assert.equal(await database.isReady(),true);await database.disconnect();
});
