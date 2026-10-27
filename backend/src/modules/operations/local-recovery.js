import mongoose from 'mongoose';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, writeFile, lstat, realpath, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { backendRoot } from '../../config/env.js';

const exec = promisify(execFile);
const fail = code => Object.assign(new Error(code), { code });
export async function fileDigest(file) { const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex'); }
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const encode = value => JSON.stringify(canonical(mongoose.mongo.BSON.EJSON.serialize(value, { relaxed: false })));

// No environment fallback and no credentials: these tools never choose the application DB implicitly.
export function localDatabase(uri, confirmedLocal = false) {
  if (!confirmedLocal || typeof uri !== 'string' || !/^mongodb:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+\/kitss_[a-zA-Z0-9_]+$/.test(uri)) throw fail('LOCAL_DATABASE_CONFIRMATION_REQUIRED');
  const url = new URL(uri), database = url.pathname.slice(1);
  if (/prod/i.test(database)) throw fail('UNSAFE_DATABASE');
  return database;
}

export async function connectLocal(uri, confirmedLocal) {
  localDatabase(uri, confirmedLocal);
  const connection=mongoose.createConnection(uri, { autoIndex: false, bufferCommands: false, serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 });
  try { await connection.asPromise();return connection; }
  catch { await connection.close().catch(()=>{});throw fail('LOCAL_DATABASE_UNAVAILABLE'); }
}

function indexDefinition(index) {
  return Object.fromEntries(Object.entries(index).filter(([key]) => !['v', 'ns', 'background'].includes(key)));
}

export async function inventory(connection, { fingerprints = false } = {}) {
  const build = await connection.db.admin().command({ buildInfo: 1 });
  const stats = await connection.db.command({ dbStats: 1 });
  const collections = [];
  for (const item of (await connection.db.listCollections().toArray()).sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.name === '_kitss_restore_guard') continue;
    if (item.type !== 'collection') throw fail('UNSUPPORTED_BACKUP_COLLECTION_TYPE');
    const collection = connection.db.collection(item.name);
    const entry = { name: item.name, count: await collection.countDocuments(), options: item.options, indexes: (await collection.indexes()).map(indexDefinition).sort((a,b) => a.name.localeCompare(b.name)) };
    if (fingerprints) {
      const hash = createHash('sha256');
      for await (const row of collection.find().sort({ _id: 1 })) hash.update(encode(row) + '\n');
      entry.fingerprint = hash.digest('hex');
    }
    collections.push(entry);
  }
  const roles = collections.some(c => c.name === 'users') ? await connection.db.collection('users').aggregate([{ $unwind: '$roles' }, { $group: { _id: { $cond:[{$in:['$roles',['student','admin','super_admin']]},'$roles','unrecognized'] }, count: { $sum: 1 } } }, { $project: { _id: 0, role: '$_id', count: 1 } }]).toArray() : [];
  return { database: connection.name, serverVersion: build.version, dataBytes: stats.dataSize, storageBytes: stats.storageSize, collections, roles };
}

export function sameInventory(a, b) {
  // Compound index key order is significant; canonical object-key sorting must
  // not make {a:1,b:1} appear equivalent to {b:1,a:1}.
  const comparable = item => item.collections.map(c => ({ ...c,
    indexes: c.indexes.map(index => ({ ...index, key: Object.entries(index.key) })),
  }));
  return encode(comparable(a)) === encode(comparable(b));
}

export async function privateBackupDirectory() {
  const root = path.resolve(backendRoot, '../.runtime/backups');
  const runtime=path.dirname(root);
  await mkdir(runtime,{mode:0o700}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  if((await lstat(runtime)).isSymbolicLink() || (await realpath(runtime)).toLowerCase()!==runtime.toLowerCase())throw fail('UNSAFE_BACKUP_ROOT');
  await mkdir(root, { mode: 0o700 }).catch(e=>{if(e.code!=='EEXIST')throw e;});
  const resolved = await realpath(root);
  if (resolved.toLowerCase() !== root.toLowerCase() || (await lstat(root)).isSymbolicLink()) throw fail('UNSAFE_BACKUP_ROOT');
  const directory = path.join(root, new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID());
  await mkdir(directory, { mode: 0o700 });
  return directory;
}

async function runTool(binary, args) {
  try { await exec(binary, args, { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 }); }
  catch { throw fail('DATABASE_TOOL_FAILED'); } // Never surface tool output/URIs or OS paths.
}

export async function backupDatabase({ uri, confirmedLocal, writesQuiesced, dumpBinary }) {
  const source = localDatabase(uri, confirmedLocal);
  if (writesQuiesced !== true) throw fail('QUIESCED_WRITES_REQUIRED');
  const connection = await connectLocal(uri, confirmedLocal);
  try {
    const before = await inventory(connection, { fingerprints: true });
    const directory = await privateBackupDirectory(), archive = path.join(directory, 'database.archive.gz');
    await runTool(dumpBinary, ['--uri=' + uri, '--gzip', '--archive=' + archive]);
    const after = await inventory(connection, { fingerprints: true });
    if (!sameInventory(before, after)) throw fail('DATABASE_CHANGED_DURING_BACKUP');
    const bytes = (await lstat(archive)).size;
    if (!bytes) throw fail('EMPTY_BACKUP');
    const manifest = { format: 1, completed: true, createdAt: new Date().toISOString(), source, sha256: await fileDigest(archive), bytes, inventory: before, consistency: 'quiesced standalone logical backup', exclusions: ['filesystem media', 'secret configuration', 'external services', 'replica-set oplog / point-in-time recovery'] };
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
    return { directory, manifest };
  } finally { await connection.close(); }
}

export async function restoreDatabase({ uri, confirmedLocal, directory, restoreBinary }) {
  const target = localDatabase(uri, confirmedLocal);
  if (!/^kitss_stage(?:17|18)_restore_[a-f0-9]{16}$/.test(target)) throw fail('FRESH_RESTORE_NAME_REQUIRED');
  const root = await realpath(path.resolve(backendRoot, '../.runtime/backups'));
  const resolved = await realpath(directory), relative = path.relative(root, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative) || (await lstat(directory)).isSymbolicLink()) throw fail('UNSAFE_BACKUP_ROOT');
  for (const name of ['manifest.json', 'database.archive.gz']) if (!(await lstat(path.join(resolved, name))).isFile() || (await lstat(path.join(resolved,name))).isSymbolicLink()) throw fail('UNSAFE_BACKUP_FILE');
  const manifest = JSON.parse(await readFile(path.join(resolved, 'manifest.json'), 'utf8'));
  if (manifest.format !== 1 || !manifest.completed || !/^kitss_[a-zA-Z0-9_]+$/.test(manifest.source) || manifest.source === target) throw fail('INVALID_BACKUP_MANIFEST');
  const archive = path.join(resolved, 'database.archive.gz');
  if (await fileDigest(archive) !== manifest.sha256 || (await lstat(archive)).size !== manifest.bytes) throw fail('BACKUP_INTEGRITY_FAILED');
  const connection = await connectLocal(uri, confirmedLocal);
  try {
    const build = await connection.db.admin().command({ buildInfo: 1 });
    if (String(build.version).split('.')[0] !== String(manifest.inventory?.serverVersion).split('.')[0]) throw fail('RESTORE_VERSION_MISMATCH');
    if ((await connection.db.listCollections().toArray()).length) throw fail('RESTORE_TARGET_NOT_EMPTY');
    // Atomic reservation prevents two restores from sharing a destination. It is retained as evidence.
    await connection.db.createCollection('_kitss_restore_guard');
    await connection.db.collection('_kitss_restore_guard').insertOne({ _id: 'restore', sourceSha256: manifest.sha256, startedAt: new Date() });
    await runTool(restoreBinary, ['--uri=' + uri, '--gzip', '--archive=' + archive, '--nsInclude=' + manifest.source + '.*', '--nsFrom=' + manifest.source + '.*', '--nsTo=' + target + '.*', '--stopOnError']);
    const restored = await inventory(connection, { fingerprints: true });
    if (!sameInventory(manifest.inventory, restored)) throw fail('RESTORE_COMPARISON_FAILED');
    await connection.db.collection('_kitss_restore_guard').updateOne({ _id: 'restore' }, { $set: { verifiedAt: new Date() } });
    return { verified: true, target, collections: restored.collections.length, documents: restored.collections.reduce((sum,c) => sum+c.count,0), archiveSha256: manifest.sha256 };
  } finally { await connection.close(); }
}

export async function compatibilityReport(connection) {
  const db = connection.db, names = new Set((await db.listCollections().toArray()).map(c => c.name));
  const count = (name, filter) => names.has(name) ? db.collection(name).countDocuments(filter) : 0;
  const duplicates = async (name, field) => names.has(name) ? (await db.collection(name).aggregate([{ $group: { _id: '$' + field, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }, { $count: 'groups' }]).toArray())[0]?.groups ?? 0 : 0;
  return { legacyDevices: await count('fcmTokens', { $or: [{ sessionId: { $exists: false } }, { securityVersion: { $exists: false } }] }), duplicateDeviceGroups: await duplicates('fcmTokens','token'), duplicateJobKeys: await duplicates('jobs','key'), missingPolicies: !await count('siteSettings', { key: 'businessPolicies' }), legacyUniqueIndexes: (await Promise.all(['orders','bookEntitlements','enrollments'].map(async name => names.has(name) ? (await db.collection(name).indexes()).filter(i => i.unique && ['orderId_1','userId_1_product.kind_1_product.id_1','userId_1_product.courseId_1'].includes(i.name)).map(i => ({ collection:name,name:i.name,key:i.key })) : []))).flat() };
}

export async function relationshipIntegrity(connection) {
  const names=new Set((await connection.db.listCollections().toArray()).map(c=>c.name)),checks=[];
  for(const [collection,field,target] of [['orders','userId','users'],['bookEntitlements','bookId','books'],['bookEntitlements','userId','users'],['bookEntitlements','orderId','orders'],['enrollments','courseId','coachingCourses'],['enrollments','userId','users'],['registrationApplications','userId','users'],['books','documentAssetId','mediaAssets'],['books','coverAssetId','mediaAssets']]) {
    if(!names.has(collection))continue;
    const rows=await connection.db.collection(collection).aggregate([{$match:{[field]:{$exists:true,$ne:null}}},{$lookup:{from:target,localField:field,foreignField:'_id',as:'matched'}},{$match:{'matched.0':{$exists:false}}},{$count:'missing'}]).toArray();
    checks.push({collection,field,missing:rows[0]?.missing??0});
  }
  return checks;
}

export async function storageIntegrity(connection, storage) {
  await storage.assertRoot();
  const referenced = new Set(), report = { dryRun: true, assets: 0, missingFiles: 0, checksumMismatches: 0, unsafeReferences: 0, orphanFiles: 0, stagingFiles: 0, symlinks: 0, deletions: 0 };
  for await (const asset of connection.db.collection('mediaAssets').find()) {
    report.assets++;
    if(asset.status==='deleted')continue;
    for (const key of [asset.key, ...(asset.cleanupKeys ?? [])].filter(Boolean)) referenced.add(key);
    if (!asset.key) continue;
    try {
      const meta = await storage.getMetadata({ key: asset.key });
      if (asset.checksum && meta.checksum !== asset.checksum) report.checksumMismatches++;
    } catch (e) { if (e.code === 'FILE_NOT_FOUND') report.missingFiles++; else report.unsafeReferences++; }
  }
  async function walk(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const key = prefix + entry.name;
      if (entry.isSymbolicLink()) { report.symlinks++; continue; }
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), key + '/');
      else if (key.startsWith('staging/')) report.stagingFiles++;
      else if (!referenced.has(key)) report.orphanFiles++;
    }
  }
  await walk(storage.root);
  return report; // Counts only: no private paths, device values or personal identifiers.
}
