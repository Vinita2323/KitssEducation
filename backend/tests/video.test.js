import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable } from 'node:stream';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { inspectVideo, validateMp4 } from '../src/modules/media/video-inspection.js';

export const videoBytes = () => readFile(new URL('./fixtures/lesson-generated.mp4',import.meta.url));
export const videoTools = () => ({ffprobe:process.env.MEDIA_FFPROBE_PATH,ffmpeg:process.env.MEDIA_FFMPEG_PATH});
test('Video framing, operational gates, disk capacity and incomplete stream cleanup', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(),'kitss-video-'));
  t.after(() => rm(root,{recursive:true,force:true}));
  const storage = new LocalStorageProvider({root,maxBytes:1024*1024,minFreeBytes:0}); await storage.initialize();
  const store = async bytes => storage.upload({stream:Readable.from(bytes),extension:'mp4'});
  const file = await store(await videoBytes());
  await validateMp4(storage,file.key);
  await assert.rejects(inspectVideo(storage,file.key,{ffprobe:path.join(root,'absent-executable')}),{code:'VIDEO_INSPECTION_UNAVAILABLE'});
  for(const bytes of [Buffer.from('fake.mp4'), (await videoBytes()).subarray(0,1000),Buffer.concat([await videoBytes(),Buffer.from('junk')])]) {
    const bad = await store(bytes); await assert.rejects(validateMp4(storage,bad.key),{code:'INVALID_VIDEO'});
  }
  const impossible = new LocalStorageProvider({root,minFreeBytes:Number.MAX_SAFE_INTEGER});
  await assert.rejects(impossible.upload({stream:Readable.from('x')}),{code:'STORAGE_CAPACITY'});
  await assert.rejects(storage.upload({stream:Readable.from('too large'),maxBytes:1}),{code:'FILE_TOO_LARGE'});
  const broken = Readable.from((async function*(){yield Buffer.from('partial');throw new Error('interrupted');})());
  await assert.rejects(storage.upload({stream:broken}));
  assert.deepEqual(await readdir(path.join(root,'staging')),[]);
});
test('Actual FFprobe codec inspection and FFmpeg complete decode', {skip: !process.env.MEDIA_FFPROBE_PATH || !process.env.MEDIA_FFMPEG_PATH ? 'Explicit installed inspection tools not supplied' : false}, async t => {
  const root = await mkdtemp(path.join(os.tmpdir(),'kitss-video-')); t.after(()=>rm(root,{recursive:true,force:true}));
  const storage = new LocalStorageProvider({root,minFreeBytes:0});await storage.initialize();
  const file = await storage.upload({stream:Readable.from(await videoBytes()),extension:'mp4'});
  const info = await inspectVideo(storage,file.key,videoTools());
  const unsupported = path.join(root,'unsupported.mp4');
  await promisify(execFile)(process.env.MEDIA_FFMPEG_PATH,['-v','error','-i',fileURLToPath(new URL('./fixtures/lesson-generated.mp4',import.meta.url)),'-t','1','-an','-c:v','mpeg4','-movflags','+faststart',unsupported],{windowsHide:true});
  const wrong = await storage.upload({stream:Readable.from(await readFile(unsupported)),extension:'mp4'});
  await assert.rejects(inspectVideo(storage,wrong.key,videoTools()),{code:'UNSUPPORTED_VIDEO'});
  const corrupt = Buffer.from(await videoBytes());corrupt.fill(0,corrupt.indexOf(Buffer.from('mdat'))+4);
  const damaged = await storage.upload({stream:Readable.from(corrupt),extension:'mp4'});
  await assert.rejects(inspectVideo(storage,damaged.key,videoTools()),{code:'INVALID_VIDEO'});
  assert.equal(info.videoCodec,'h264');assert.equal(info.audioCodec,'aac');assert.equal(info.durationSeconds,20);assert.equal(info.width,320);
});
