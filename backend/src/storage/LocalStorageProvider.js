import path from 'node:path';
import { constants } from 'node:fs';
import { mkdir, lstat, realpath, open, unlink, link, statfs } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { StorageProvider } from './StorageProvider.js';
import { AppError } from '../utils/AppError.js';

const areas = ['public', 'private', 'staging', 'quarantine'];
const keyPattern = /^(public|private|staging|quarantine)\/[a-z][a-z0-9-]{0,39}\/\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/;
const normalizePath = value => process.platform === 'win32' ? value.toLowerCase() : value;

function safeError(error) {
  if (error instanceof AppError) return error;
  if (error.code === 'ENOENT') return new AppError(404, 'FILE_NOT_FOUND', 'Stored file was not found');
  return new AppError(503, 'STORAGE_UNAVAILABLE', 'Storage operation failed');
}

export class LocalStorageProvider extends StorageProvider {
  constructor({ root, publicBaseUrl = '/api/v1/media/public', maxBytes = 1073741824, minFreeBytes = 1073741824 }) {
    super();
    if (!path.isAbsolute(root) || path.parse(root).root === root) throw new AppError(500, 'INVALID_STORAGE_ROOT', 'An absolute dedicated storage root is required');
    this.root = path.resolve(root);
    this.publicBaseUrl = publicBaseUrl;
    this.maxBytes = maxBytes;
    this.minFreeBytes = minFreeBytes;
  }

  createKey({ visibility = 'private', purpose = 'files', extension = 'bin' } = {}) {
    if (!areas.includes(visibility) || !/^[a-z][a-z0-9-]{0,39}$/.test(purpose) || !/^[a-z0-9]{1,10}$/.test(extension)) {
      throw new AppError(400, 'INVALID_STORAGE_KEY', 'Invalid storage key options');
    }
    const now = new Date();
    return `${visibility}/${purpose}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${extension}`;
  }

  validateKey(key) {
    if (typeof key !== 'string' || !keyPattern.test(key)) throw new AppError(400, 'INVALID_STORAGE_KEY', 'Invalid storage key');
    return key;
  }

  async assertRoot() {
    try {
      const info = await lstat(this.root);
      if (!info.isDirectory() || info.isSymbolicLink() || normalizePath(await realpath(this.root)) !== normalizePath(this.root)) {
        throw new AppError(503, 'UNSAFE_STORAGE_PATH', 'Storage directory is not safe');
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Storage root is unavailable');
    }
  }

  async directory(parts, create = false) {
    await this.assertRoot();
    let current = this.root;
    for (const part of parts) {
      current = path.join(current, part);
      if (create) await mkdir(current, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
      const info = await lstat(current);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new AppError(503, 'UNSAFE_STORAGE_PATH', 'Storage directory is not safe');
    }
    return current;
  }

  async filePath(key, createParents = false) {
    this.validateKey(key);
    const parts = key.split('/');
    const directory = await this.directory(parts.slice(0, -1), createParents);
    return path.join(directory, parts.at(-1));
  }

  async initialize() {
    try {
      await mkdir(this.root, { recursive: true, mode: 0o700 });
      await this.assertRoot();
      for (const area of areas) await this.directory([area], true);
      if (!await this.isReady()) throw new Error('Storage probe failed');
    } catch (error) { throw safeError(error); }
  }

  async isReady() {
    let probe;
    let handle;
    let ready = false;
    try {
      for (const area of areas) await this.directory([area]);
      probe = path.join(this.root, 'staging', `.probe-${randomUUID()}`);
      handle = await open(probe, 'wx', 0o600);
      await handle.writeFile('kitss-storage-probe');
      await handle.close(); handle = undefined;
      ready = true;
    } catch { ready = false; }
    finally {
      await handle?.close().catch(() => {});
      if (probe) await unlink(probe).catch(error => { if (error.code !== 'ENOENT') ready = false; });
    }
    return ready;
  }

  async assertCapacity(bytes) {
    await this.assertRoot();
    const fs = await statfs(this.root);
    if (fs.bavail * fs.bsize < bytes + this.minFreeBytes) throw new AppError(507, 'STORAGE_CAPACITY', 'Insufficient storage capacity for upload');
  }

  async upload({ stream, key, visibility = 'private', purpose = 'files', extension = 'bin',
    contentType = 'application/octet-stream', expectedBytes, maxBytes = this.maxBytes, signal } = {}) {
    key ??= this.createKey({ visibility, purpose, extension });
    this.validateKey(key);
    if (!stream || typeof stream.pipe !== 'function') throw new AppError(400, 'INVALID_STREAM', 'A readable stream is required');
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > this.maxBytes ||
      (expectedBytes !== undefined && (!Number.isSafeInteger(expectedBytes) || expectedBytes < 0))) {
      throw new AppError(400, 'INVALID_FILE_LIMIT', 'Invalid file size constraint');
    }
    if (expectedBytes > maxBytes) throw new AppError(413, 'FILE_TOO_LARGE', 'File exceeds storage limit');
    let tempPath;
    let fileHandle;
    let bytes = 0;
    const hash = createHash('sha256');
    try {
      await this.assertCapacity(maxBytes);
      const destination = await this.filePath(key, true);
      await this.directory(['staging']);
      tempPath = path.join(this.root, 'staging', `.upload-${randomUUID()}`);
      fileHandle = await open(tempPath, 'wx', 0o600);
      const meter = new Transform({ transform(chunk, encoding, callback) {
        bytes += chunk.length;
        if (bytes > maxBytes) return callback(new AppError(413, 'FILE_TOO_LARGE', 'File exceeds storage limit'));
        hash.update(chunk);
        callback(null, chunk);
      } });
      // Keep explicit handle ownership without waiting for an autoClose:false
      // fs.WriteStream 'close' event (which would leave pipeline unresolved).
      const sink = new Writable({ write(chunk, encoding, callback) {
        fileHandle.writeFile(chunk).then(() => callback(), callback);
      } });
      await pipeline(stream, meter, sink, { signal });
      await fileHandle.sync();
      await fileHandle.close(); fileHandle = undefined;
      if (expectedBytes !== undefined && bytes !== expectedBytes) throw new AppError(422, 'FILE_SIZE_MISMATCH', 'File size differs from the expected size');
      // Same-volume hard link publishes atomically and refuses existing targets.
      await this.filePath(key, true); // Recheck symlinks before publication.
      await link(tempPath, destination).catch(error => {
        if (error.code === 'EEXIST') throw new AppError(409, 'FILE_EXISTS', 'Storage key already exists');
        throw error;
      });
      return { key, bytes, checksum: hash.digest('hex'), metadata: { contentType, visibility: key.split('/')[0] } };
    } catch (error) { throw safeError(error); }
    finally {
      await fileHandle?.close().catch(() => {});
      if (tempPath) await unlink(tempPath).catch(error => {
        if (error.code !== 'ENOENT') throw new AppError(503, 'STORAGE_CLEANUP_FAILED', 'Storage staging cleanup failed');
      });
    }
  }

  async openFile(key) {
    const filename = await this.filePath(key);
    const info = await lstat(filename);
    if (!info.isFile() || info.isSymbolicLink()) throw new AppError(503, 'UNSAFE_STORAGE_PATH', 'Stored file is not safe');
    const handle = await open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const stat = await handle.stat();
    if (!stat.isFile()) { await handle.close(); throw new AppError(503, 'UNSAFE_STORAGE_PATH', 'Stored file is not safe'); }
    return { handle, stat };
  }

  async getFile({ key, range } = {}) {
    let handle;
    try {
      const file = await this.openFile(key); handle = file.handle;
      const { size } = file.stat;
      if (range && (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) || range.start < 0 || range.end < range.start || range.end >= size)) {
        throw new AppError(416, 'INVALID_RANGE', 'File range is not satisfiable');
      }
      const stream = handle.createReadStream({ autoClose: true, ...(range ? { start: range.start, end: range.end } : {}) });
      handle = undefined; // Stream owns the handle, including destroy/abort.
      return { stream, metadata: { bytes: size, contentType: 'application/octet-stream' }, ...(range ? { range } : {}) };
    } catch (error) { await handle?.close().catch(() => {}); throw safeError(error); }
  }

  async getMetadata({ key } = {}) {
    try {
      const { stream, metadata } = await this.getFile({ key });
      const hash = createHash('sha256');
      for await (const chunk of stream) hash.update(chunk);
      return { exists: true, ...metadata, checksum: hash.digest('hex') };
    } catch (error) { throw safeError(error); }
  }

  getPublicUrl({ key } = {}) {
    this.validateKey(key);
    if (!key.startsWith('public/')) throw new AppError(403, 'PRIVATE_FILE', 'Private files have no public URL');
    // Logical URL only: Stage 2 deliberately mounts no media-serving route.
    return `${this.publicBaseUrl}/${key.slice('public/'.length)}`;
  }

  async delete({ key } = {}) {
    try {
      const filename = await this.filePath(key);
      const info = await lstat(filename);
      if (!info.isFile() || info.isSymbolicLink()) throw new AppError(503, 'UNSAFE_STORAGE_PATH', 'Stored file is not safe');
      await unlink(filename);
      return { deleted: true };
    } catch (error) {
      if (error.code === 'ENOENT') return { deleted: false };
      throw safeError(error);
    }
  }
}
