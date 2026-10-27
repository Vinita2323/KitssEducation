// Deliberately separate from the credential-free local recovery CLI. Importing
// this module does not read .env or connect. Approval assertions are an operator
// prerequisite, not proof of infrastructure ownership or a read-only DB role.
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { chmod, lstat, statfs, unlink, writeFile } from 'node:fs/promises';
import { fileDigest, inventory, privateBackupDirectory, sameInventory } from './local-recovery.js';

const exec = promisify(execFile);
const fail = code => Object.assign(new Error(code), { code });

export function validateRemoteApproval(config, approval) {
  if (!approval || approval.readOnly !== true || approval.writesQuiesced !== true ||
      config.nodeEnv !== 'development' || approval.database !== 'kitss_education_dev' ||
      config.mongo.dbName !== approval.database || approval.expectedTopology !== 'replica set' ||
      createHash('sha256').update(config.mongo.uri).digest('hex') !== approval.connectionSha256) {
    throw fail('REMOTE_SCOPE_APPROVAL_REQUIRED');
  }
  let url;
  try { url = new URL(config.mongo.uri); } catch { throw fail('REMOTE_SCOPE_APPROVAL_REQUIRED'); }
  if (url.protocol !== 'mongodb+srv:' || !url.username || !url.password ||
      [...url.searchParams].some(([key, value]) =>
        (/^(tls|ssl)$/i.test(key) && value !== 'true') ||
        (/^(tlsAllowInvalidCertificates|tlsAllowInvalidHostnames|tlsInsecure)$/i.test(key) && value !== 'false'))) {
    throw fail('REMOTE_SECURE_CONNECTION_REQUIRED');
  }
  return approval.database;
}

export async function restrictBackupDirectory(directory) {
  // POSIX modes alone do not restrict Windows ACLs. Fail before writing a URI
  // or archive unless inheritance has been removed and explicit access applied.
  if (process.platform !== 'win32') { await chmod(directory, 0o700); return; }
  try {
    const { stdout } = await exec('whoami.exe', ['/user', '/fo', 'csv', '/nh'], { windowsHide: true });
    const sid = stdout.match(/S-1-5-[\d-]+/)?.[0];
    if (!sid) throw new Error();
    await exec('icacls.exe', [directory, '/inheritance:r', '/grant:r',
      `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F', '*S-1-5-32-544:(OI)(CI)F'], { windowsHide: true });
  } catch { throw fail('BACKUP_ACCESS_RESTRICTION_FAILED'); }
}

export async function backupApprovedRemote({ config, approval, dumpBinary }) {
  const source = validateRemoteApproval(config, approval);
  const client = new mongoose.mongo.MongoClient(config.mongo.uri, {
    dbName: source, readPreference: 'primary', maxPoolSize: 1,
    serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000, socketTimeoutMS: 30000,
    appName: 'kitss-approved-development-backup',
  });
  let credentialFile;
  try {
    await client.connect();
    const connection = { db: client.db(source), name: source };
    const hello = await connection.db.command({ hello: 1 });
    if (!hello.setName || hello.msg === 'isdbgrid') throw fail('REMOTE_TOPOLOGY_MISMATCH');
    const before = await inventory(connection, { fingerprints: true });
    const directory = await privateBackupDirectory();
    await restrictBackupDirectory(directory);
    const disk = await statfs(directory);
    const freeBytes = disk.bavail * disk.bsize;
    if (freeBytes < Math.max(1073741824, before.dataBytes * 4)) throw fail('BACKUP_CAPACITY_INSUFFICIENT');
    credentialFile = path.join(directory, 'temporary-connection.yml');
    // JSON-quoted scalar is valid YAML. Never pass URI/password in argv or
    // propagate tool stdout/stderr, which can contain private connection data.
    await writeFile(credentialFile, 'uri: ' + JSON.stringify(config.mongo.uri) + '\n', { flag: 'wx', mode: 0o600 });
    const archive = path.join(directory, 'database.archive.gz');
    try {
      await exec(dumpBinary, ['--config=' + credentialFile, '--db=' + source,
        '--gzip', '--archive=' + archive], { windowsHide: true, timeout: 180000, maxBuffer: 4194304 });
    } catch { throw fail('REMOTE_DATABASE_DUMP_FAILED'); }
    await unlink(credentialFile); credentialFile = undefined;
    const after = await inventory(connection, { fingerprints: true });
    if (!sameInventory(before, after)) throw fail('DATABASE_CHANGED_DURING_BACKUP');
    const bytes = (await lstat(archive)).size;
    if (!bytes) throw fail('EMPTY_BACKUP');
    const manifest = {
      format: 1, completed: true, createdAt: new Date().toISOString(), source,
      sha256: await fileDigest(archive), bytes, inventory: before,
      sourceCategory: 'explicitly approved remote development namespace',
      consistency: 'owner-confirmed quiesced logical backup; before/after BSON fingerprints match; not atomic PITR',
      freeBytesBefore: freeBytes,
      exclusions: ['filesystem media', 'secret configuration', 'other databases', 'users/roles', 'external services', 'oplog / point-in-time recovery'],
    };
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx', mode: 0o600 });
    return { directory, manifest };
  } catch (error) {
    const known = ['REMOTE_TOPOLOGY_MISMATCH', 'BACKUP_ACCESS_RESTRICTION_FAILED', 'BACKUP_CAPACITY_INSUFFICIENT',
      'REMOTE_DATABASE_DUMP_FAILED', 'DATABASE_CHANGED_DURING_BACKUP', 'EMPTY_BACKUP'];
    throw fail(known.includes(error.code) ? error.code : 'REMOTE_BACKUP_UNAVAILABLE');
  } finally {
    try { if (credentialFile) await unlink(credentialFile); }
    finally { await client.close(); }
  }
}
