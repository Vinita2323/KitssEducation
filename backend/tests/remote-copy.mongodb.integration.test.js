import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { appendFile, cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from '../src/config/env.js';
import { startServer } from '../src/server.js';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { FakePaymentProvider } from './commerce-fixture.js';
import { silentLogger } from './helpers.js';
import { connectLocal, restoreDatabase, inventory, sameInventory, compatibilityReport, relationshipIntegrity } from '../src/modules/operations/local-recovery.js';
import { restrictBackupDirectory } from '../src/modules/operations/approved-remote-backup.js';

const directory = process.env.KITSS_STAGE18_BACKUP_DIRECTORY;
const fresh = () => randomUUID().replaceAll('-', '').slice(0, 16);

test('approved development archive restores and starts only on a fresh isolated local copy', {
  skip: !directory ? 'No explicitly selected Stage 18 archive; remote-copy acceptance not executed' : false,
  timeout: 240000,
}, async t => {
  // No remote connection is reachable through this test. Config must be overridden
  // before loading it, and each restore has an independently reserved namespace.
  assert.equal(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27249/kitss_stage18_local');
  const manifest = JSON.parse(await readFile(path.join(directory, 'manifest.json'), 'utf8'));
  assert.equal(manifest.source, 'kitss_education_dev');
  assert.equal(manifest.sourceCategory, 'explicitly approved remote development namespace');
  const target = 'kitss_stage18_restore_' + fresh();
  const uriFor = name => 'mongodb://127.0.0.1:27249/' + name;
  let connection, runtime;
  const root = await mkdtemp(path.join(os.tmpdir(), 'kitss-stage18-media-'));
  t.after(async () => {
    await runtime?.close(); await connection?.close();
    assert.match(path.relative(os.tmpdir(), root), /^kitss-stage18-media-[^\\/]+$/);
    await rm(root, { recursive: true });
  });
  const options = uri => ({ uri, confirmedLocal: true, directory, restoreBinary: process.env.KITSS_MONGORESTORE_BINARY });
  let restored;
  await t.test('archive bytes, documents, collection options and every index match before startup', async () => {
    restored = await restoreDatabase(options(uriFor(target)));
    connection = await connectLocal(uriFor(target), true);
    assert.equal(restored.verified, true);
    assert.equal(sameInventory(manifest.inventory, await inventory(connection, { fingerprints: true })), true);
    t.diagnostic(JSON.stringify({ collections: restored.collections, documents: restored.documents, archiveSha256: restored.archiveSha256 }));
  });
  await t.test('compatibility and relationships are inventoried without exporting user or token data', async () => {
    const compatibility = await compatibilityReport(connection);
    const relationships = await relationshipIntegrity(connection);
    t.diagnostic(JSON.stringify({ compatibility, relationships }));
    // Report incompatibility rather than repairing records. Duplicates remain
    // a startup blocker; the synthetic token suite tests conflicting owners.
    assert.equal(compatibility.duplicateDeviceGroups, 0);
    assert.equal(compatibility.duplicateJobKeys, 0);
  });
  await t.test('media keys have safe shapes; no private files are copied or inferred from the archive', async () => {
    const storage = new LocalStorageProvider({ root }); await storage.initialize();
    let assets = 0, invalidKeys = 0, live = 0;
    for await (const row of connection.db.collection('mediaAssets').find()) {
      assets++; if (row.status !== 'deleted') live++;
      for (const key of [row.key, ...(row.cleanupKeys ?? [])].filter(Boolean)) {
        try { storage.validateKey(key); } catch { invalidKeys++; }
      }
    }
    assert.equal(invalidKeys, 0);
    t.diagnostic(JSON.stringify({ assets, liveMetadata: live, invalidKeys, mediaFilesRecovered: 0 }));
  });
  await t.test('two startups preserve all business documents; maintenance and index changes are reported separately', async () => {
    const before = await inventory(connection, { fingerprints: true });
    const jobsBefore = await connection.db.collection('jobs').find().sort({ _id: 1 }).toArray();
    const businessNames = before.collections.map(c => c.name).filter(n => !['auditlogs', 'auththrottles', 'domainLocks', 'jobs', 'sessions'].includes(n));
    const signatures = async () => (await inventory(connection, { fingerprints: true })).collections
      .filter(c => businessNames.includes(c.name)).map(c => ({ name: c.name, count: c.count, fingerprint: c.fingerprint }));
    const authority = await signatures();
    const base = loadConfig();
    const config = { ...base, host: '127.0.0.1', logLevel: 'silent',
      mongo: { ...base.mongo, uri: uriFor(target), dbName: target, requireReplicaSet: false },
      storage: { ...base.storage, root },
      smtp: { host: '', user: '', appPassword: '', from: '', port: 587, secure: false },
      firebase: { pushEnabled: false, configJson: '', serviceAccountPath: '' },
      payment: { provider: 'razorpay', mode: 'test', keyId: '', keySecret: '', webhookSecret: '', rotated: false },
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      runtime = await startServer({ config, logger: silentLogger, port: 0, commerceProvider: new FakePaymentProvider() });
      const response = await fetch('http://127.0.0.1:' + runtime.server.address().port + '/api/v1/health/ready');
      assert.equal(response.status, 200);
      await runtime.close(); runtime = undefined;
      assert.deepEqual(await signatures(), authority);
    }
    const after = await inventory(connection, { fingerprints: true });
    const changed = after.collections.filter(c => !sameInventory({ collections: [c] }, { collections: before.collections.filter(b => b.name === c.name) })).map(c => c.name);
    const jobsAfter = await connection.db.collection('jobs').find().sort({ _id: 1 }).toArray();
    assert.equal(jobsAfter.length, jobsBefore.length);
    const jobFields = [...new Set([...jobsBefore, ...jobsAfter].flatMap(row => Object.keys(row)))];
    const changedJobFields = jobFields.filter(field => JSON.stringify(jobsBefore.map(r => r[field])) !== JSON.stringify(jobsAfter.map(r => r[field])));
    assert.deepEqual(changed.filter(name => name !== 'jobs'), []);
    assert.deepEqual(changedJobFields, ['updatedAt']);
    t.diagnostic(JSON.stringify({ startups: 2, businessDocumentsUnchanged: businessNames, maintenanceOrIndexChanges: changed, changedJobFields }));
  });
  await t.test('occupied targets reject restore without overwriting their contents', async () => {
    const before = await inventory(connection, { fingerprints: true });
    await assert.rejects(restoreDatabase(options(uriFor(target))), { code: 'RESTORE_TARGET_NOT_EMPTY' });
    assert.equal(sameInventory(before, await inventory(connection, { fingerprints: true })), true);
  });
  await t.test('corrupted private archive copy is rejected before a destination is created', async () => {
    const corrupt = path.join(path.dirname(directory), 'stage18-corrupt-' + fresh());
    await mkdir(corrupt); await restrictBackupDirectory(corrupt);
    await cp(directory, corrupt, { recursive: true, force: false, errorOnExist: true });
    await appendFile(path.join(corrupt, 'database.archive.gz'), 'synthetic corruption');
    await assert.rejects(restoreDatabase({ ...options(uriFor('kitss_stage18_restore_' + fresh())), directory: corrupt }), { code: 'BACKUP_INTEGRITY_FAILED' });
  });
  await t.test('different MongoDB major version is rejected without creating target collections', async () => {
    const incompatible = path.join(path.dirname(directory), 'stage18-version-' + fresh());
    await mkdir(incompatible); await restrictBackupDirectory(incompatible);
    await cp(directory, incompatible, { recursive: true, force: false, errorOnExist: true });
    await writeFile(path.join(incompatible, 'manifest.json'), JSON.stringify({ ...manifest, inventory: { ...manifest.inventory, serverVersion: '7.0.24' } }));
    const uri = uriFor('kitss_stage18_restore_' + fresh());
    await assert.rejects(restoreDatabase({ ...options(uri), directory: incompatible }), { code: 'RESTORE_VERSION_MISMATCH' });
    const empty = await connectLocal(uri, true);
    try { assert.equal((await empty.db.listCollections().toArray()).length, 0); } finally { await empty.close(); }
  });
  await t.test('failed restore preserves its reservation and requires a new namespace', async () => {
    const partial = uriFor('kitss_stage18_restore_' + fresh());
    await assert.rejects(restoreDatabase({ ...options(partial), restoreBinary: 'kitss-deliberately-missing-restore' }), { code: 'DATABASE_TOOL_FAILED' });
    await assert.rejects(restoreDatabase(options(partial)), { code: 'RESTORE_TARGET_NOT_EMPTY' });
  });
});
