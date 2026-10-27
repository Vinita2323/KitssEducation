import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateRemoteApproval, backupApprovedRemote, restrictBackupDirectory } from '../src/modules/operations/approved-remote-backup.js';
import { localDatabase, sameInventory } from '../src/modules/operations/local-recovery.js';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Synthetic syntax only: these unit tests never connect to any host.
const config = { nodeEnv: 'development', mongo: { dbName: 'kitss_education_dev', uri: 'mongodb+srv://synthetic:fixture@example.invalid/?retryWrites=true' } };
const approvalFor = c => ({ readOnly: true, writesQuiesced: true, database: 'kitss_education_dev',
  expectedTopology: 'replica set', connectionSha256: createHash('sha256').update(c.mongo.uri).digest('hex') });

test('remote backup requires exact namespace, connection and quiescence approval before any connection', async () => {
  const approval = approvalFor(config);
  assert.equal(validateRemoteApproval(config, approval), 'kitss_education_dev');
  for (const patch of [{ readOnly: false }, { writesQuiesced: false }, { database: 'other' },
    { connectionSha256: 'wrong' }, { expectedTopology: 'standalone' }]) {
    await assert.rejects(backupApprovedRemote({ config, approval: { ...approval, ...patch } }), { code: 'REMOTE_SCOPE_APPROVAL_REQUIRED' });
  }
  assert.throws(() => validateRemoteApproval({ ...config, nodeEnv: 'production' }, approval));
  assert.throws(() => validateRemoteApproval({ ...config, mongo: { ...config.mongo, uri: config.mongo.uri + '&appName=changed' } }, approval));
  assert.throws(() => localDatabase(config.mongo.uri, true));
});

test('remote approval refuses disabled TLS and certificate/hostname verification', () => {
  for (const query of ['tls=false', 'ssl=false', 'tlsInsecure=true', 'tlsAllowInvalidCertificates=true', 'tlsAllowInvalidHostnames=true']) {
    const changed = { ...config, mongo: { ...config.mongo, uri: config.mongo.uri + '&' + query } };
    assert.throws(() => validateRemoteApproval(changed, approvalFor(changed)), { code: 'REMOTE_SECURE_CONNECTION_REQUIRED' });
  }
});

test('private backup directory is restricted before writing sensitive files', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'kitss-stage18-acl-'));
  try {
    await restrictBackupDirectory(directory);
    await writeFile(path.join(directory, 'synthetic.txt'), 'synthetic fixture', { flag: 'wx', mode: 0o600 });
    assert.equal(await readFile(path.join(directory, 'synthetic.txt'), 'utf8'), 'synthetic fixture');
  } finally {
    const relative = path.relative(os.tmpdir(), directory);
    assert.match(relative, /^kitss-stage18-acl-[^\\/]+$/);
    await rm(directory, { recursive: true });
  }
});

test('backup comparison preserves compound-index field order', () => {
  const data = key => ({ collections: [{ name: 'synthetic', count: 1, fingerprint: 'fixture', options: {},
    indexes: [{ name: 'constraint', key, unique: true }] }] });
  assert.equal(sameInventory(data({ a: 1, b: -1 }), data({ a: 1, b: -1 })), true);
  assert.equal(sameInventory(data({ a: 1, b: -1 }), data({ b: -1, a: 1 })), false);
});
