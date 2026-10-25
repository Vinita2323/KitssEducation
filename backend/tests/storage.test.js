import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { readdir, writeFile, mkdir, symlink } from 'node:fs/promises';
import path from 'node:path';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { createStorageProvider } from '../src/storage/index.js';
import { createApp } from '../src/app.js';
import { tempDirectory, testConfig, serve, silentLogger } from './helpers.js';

async function provider(t, maxBytes = 1024) {
  const root = await tempDirectory(t);
  const storage = new LocalStorageProvider({ root, maxBytes });
  await storage.initialize();
  return { root, storage };
}

test('stream upload/read/range/metadata/delete with checksum and private URL protection', { timeout: 5000 }, async t => {
  const { root, storage } = await provider(t);
  assert.equal(await storage.isReady(), true);
  const bytes = Buffer.from('KITSS streaming storage');
  const uploaded = await storage.upload({ stream: Readable.from([bytes]), expectedBytes: bytes.length });
  assert.ok(uploaded.key.startsWith('private/'));
  assert.equal(uploaded.checksum, createHash('sha256').update(bytes).digest('hex'));
  const metadata = await storage.getMetadata({ key: uploaded.key });
  assert.equal(metadata.bytes, bytes.length);
  assert.equal(metadata.checksum, uploaded.checksum);
  const { stream } = await storage.getFile({ key: uploaded.key, range: { start: 0, end: 4 } });
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString(), 'KITSS');
  await assert.rejects(storage.getFile({ key: uploaded.key, range: { start: 0, end: 999 } }), { code: 'INVALID_RANGE' });
  assert.throws(() => storage.getPublicUrl({ key: uploaded.key }), { code: 'PRIVATE_FILE' });
  assert.equal((await storage.delete({ key: uploaded.key })).deleted, true);
  assert.equal((await storage.delete({ key: uploaded.key })).deleted, false);
  await assert.rejects(storage.getFile({ key: uploaded.key }), { code: 'FILE_NOT_FOUND' });
  assert.deepEqual(await readdir(path.join(root, 'staging')), []);
});

test('public logical URL does not imply HTTP exposure; existing files cannot be overwritten', async t => {
  const { storage } = await provider(t);
  const key = storage.createKey({ visibility: 'public', purpose: 'covers', extension: 'png' });
  await storage.upload({ key, stream: Readable.from(['original']) });
  assert.ok(storage.getPublicUrl({ key }).startsWith('/api/v1/media/public/covers/'));
  await assert.rejects(storage.upload({ key, stream: Readable.from(['replacement']) }), { code: 'FILE_EXISTS' });
  const config = await testConfig(t);
  const base = await serve(t, createApp({ config, logger: silentLogger, storage, database: { isReady: async () => true } }));
  for (const url of [storage.getPublicUrl({ key }), '/uploads/' + key, '/api/v1/media/' + key]) assert.equal((await fetch(base + url)).status, 404);
});

test('traversal, drive/UNC, encoded keys and malicious purpose/extension are rejected', async t => {
  const { storage } = await provider(t);
  for (const key of ['../escape', '/absolute', 'C:\\escape', '\\\\server\\share', 'private/../x', 'private/%2e%2e/x', 'private\\x', 'private/x\0']) {
    await assert.rejects(storage.getFile({ key }), { code: 'INVALID_STORAGE_KEY' });
    await assert.rejects(storage.delete({ key }), { code: 'INVALID_STORAGE_KEY' });
    await assert.rejects(storage.upload({ key, stream: Readable.from(['x']) }), { code: 'INVALID_STORAGE_KEY' });
  }
  assert.throws(() => storage.createKey({ extension: '../exe' }), { code: 'INVALID_STORAGE_KEY' });
  assert.throws(() => createStorageProvider({ provider: 's3' }), { code: 'UNSUPPORTED_STORAGE_PROVIDER' });
});

test('oversized, mismatched, aborted and failing streams leave no staging files or final file', async t => {
  const { root, storage } = await provider(t, 16);
  for (const [stream, extra, code] of [
    [Readable.from(['this payload exceeds sixteen bytes']), {}, 'FILE_TOO_LARGE'],
    [Readable.from(['short']), { expectedBytes: 10 }, 'FILE_SIZE_MISMATCH'],
    [Readable.from((async function* () { yield 'x'; throw new Error('private internal path'); })()), {}, 'STORAGE_UNAVAILABLE'],
    [Readable.from(['x']), { signal: AbortSignal.abort() }, 'STORAGE_UNAVAILABLE'],
  ]) {
    const key = storage.createKey();
    await assert.rejects(storage.upload({ key, stream, ...extra }), { code });
    await assert.rejects(storage.getFile({ key }), { code: 'FILE_NOT_FOUND' });
    assert.deepEqual(await readdir(path.join(root, 'staging')), []);
  }
});

test('storage initialization fails safely when root is a file', async t => {
  const dir = await tempDirectory(t);
  const root = path.join(dir, 'not-directory');
  await writeFile(root, 'x');
  const storage = new LocalStorageProvider({ root });
  await assert.rejects(storage.initialize(), { code: 'STORAGE_UNAVAILABLE' });
  assert.equal(await storage.isReady(), false);
});

test('missing storage root is an infrastructure failure, not a successful no-op delete', async t => {
  const root = path.join(await tempDirectory(t), 'not-mounted');
  const storage = new LocalStorageProvider({ root });
  const key = storage.createKey();
  await assert.rejects(storage.delete({ key }), { code: 'STORAGE_UNAVAILABLE' });
  await assert.rejects(storage.getFile({ key }), { code: 'STORAGE_UNAVAILABLE' });
  assert.equal(await storage.isReady(), false);
});

test('directory symlink/junction escape is rejected, including reads and deletion', async t => {
  const dir = await tempDirectory(t);
  const outside = path.join(dir, 'outside');
  const root = path.join(dir, 'storage');
  await mkdir(outside);
  await mkdir(root);
  await symlink(outside, path.join(root, 'private'), process.platform === 'win32' ? 'junction' : 'dir');
  const storage = new LocalStorageProvider({ root });
  await assert.rejects(storage.initialize(), { code: 'UNSAFE_STORAGE_PATH' });
  const key = storage.createKey();
  await assert.rejects(storage.getFile({ key }), { code: 'UNSAFE_STORAGE_PATH' });
  await assert.rejects(storage.delete({ key }), { code: 'UNSAFE_STORAGE_PATH' });
  assert.deepEqual(await readdir(outside), []);
});
