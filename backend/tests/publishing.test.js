import test from 'node:test';
import assert from 'node:assert/strict';
import { contentInput, settingInput, safeLink } from '../src/modules/publishing/validation.js';
import { createPublishingModels } from '../src/modules/publishing/publishing.models.js';
import mongoose from 'mongoose';
import { createScanner } from '../src/modules/media/inspection.js';
import { Readable } from 'node:stream';
import net from 'node:net';

test('publishing validators reject mass assignment, financial assumptions, unsafe links, arbitrary settings and invalid sections', () => {
  for (const input of [{ title: { $ne: null } }, { title:'Test',status:'published' }, { title:'Test',priceMinor:-1 }, { title:'Test',priceMinor:1.5 }, { title:'Test',ratingSummary:{value:5,count:99} }]) assert.throws(() => contentInput('books',input,true),{status:422});
  const draft=contentInput('books',{title:'Test'},true);assert.equal(draft.fields.priceMinor,undefined);
  assert.throws(()=>contentInput('pages',{key:'home',sections:[{key:'x',type:'html',body:'<script>'}]},true),{status:422});
  assert.throws(()=>contentInput('pages',{key:'home',sections:[{key:'x',type:'text'},{key:'x',type:'text'}]},true),{status:422});
  for(const target of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:password@example.com'])assert.throws(()=>safeLink({type:'external',target}),{status:422});
  assert.throws(()=>safeLink({type:'internal',target:'/admin'}),{status:422});
  for(const key of ['registrationFees','AUTH_SECRET','roles','scanner'])assert.throws(()=>settingInput(key,{value:{},expectedRevision:0}),{status:422});
  assert.throws(()=>settingInput('publicFeatures',{value:{booksEnabled:'false'},expectedRevision:0}),{status:422});
});
test('publishing schemas use additive standalone indexes and hide provider keys',async()=>{
  const connection=mongoose.createConnection(),models=createPublishingModels(connection);
  assert.ok(models.Book.schema.indexes().some(([fields,opts])=>fields.publicId&&opts.unique));
  assert.ok(models.MediaAsset.schema.indexes().some(([fields,opts])=>fields.ownerUserId&&fields.idempotencyKey&&opts.unique));
  assert.equal(models.MediaAsset.schema.path('key').options.select,false);
  assert.equal(new models.Book({title:'Draft',publicId:'test'}).priceMinor,undefined);
  await connection.close();
});
test('unconfigured and unavailable malware scanners fail closed; local INSTREAM protocol handles clean/infected replies',async t=>{
  assert.equal(await createScanner().scan(Readable.from('test')),'pending');
  for(const [reply,expected]of [['stream: OK\0','clean'],['stream: Test-Signature FOUND\0','infected'],['stream: ERROR\0','error']]){
    const server=net.createServer(socket=>{let bytes=Buffer.alloc(0);socket.on('data',chunk=>{bytes=Buffer.concat([bytes,chunk]);const marker=bytes.indexOf(0);if(marker<0)return;let offset=marker+1;while(bytes.length>=offset+4){const size=bytes.readUInt32BE(offset);offset+=4;if(size===0){socket.end(reply);return;}if(bytes.length<offset+size)return;offset+=size;}});});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{assert.equal(await createScanner({enabled:true,port:server.address().port}).scan(Readable.from(Buffer.from('isolated scan fixture'))),expected);}finally{await new Promise(resolve=>server.close(resolve));}
  }
  const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const port=server.address().port;await new Promise(resolve=>server.close(resolve));
  assert.equal(await createScanner({enabled:true,port}).scan(Readable.from('test')),'error');
});
