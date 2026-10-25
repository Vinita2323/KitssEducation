import mongoose from 'mongoose';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';

// Deliberate development-only operator tool. Backups contain private data and
// stay under ignored .runtime, outside every database. No credentials are saved.
const config = loadConfig();
if (config.nodeEnv !== 'development') throw new Error('Development environment required');
const connection = await mongoose.createConnection(config.mongo.uri, {
  dbName: config.mongo.dbName,
  autoIndex: false,
  serverSelectionTimeoutMS: 30000
}).asPromise();
try {
  if (connection.name !== 'kitss_education_dev') throw new Error('Exact KITSS development database required');
  const allowed = new Set(['users', 'sessions', 'auththrottles', 'auditlogs', 'taxonomies', 'universities', 'colleges', 'collegePrograms', 'admissionApplications', 'franchiseApplications', 'domainLocks', 'books', 'mediaAssets', 'pageContents', 'banners', 'facultyProfiles', 'siteSettings', 'orders', 'bookEntitlements', 'registrationApplications', 'jobs', 'coachingCourses', 'coursePlans', 'lessons', 'enrollments', 'learningProgress', 'resultIssuers', 'exams', 'resultRecords', 'resultHistory', 'notifications', 'notificationReceipts']);
  const inventory = (await connection.db.admin().listDatabases()).databases;
  const backendTestsOnly = process.argv.includes('--completed-backend-tests-only');
  const candidates = inventory.filter(d => /^kitss_(?:auth|stage(?:[3-9]|10))_(?:test|browser)_[a-f0-9]{16}$/.test(d.name)
    && (!backendTestsOnly || /^kitss_(?:auth|stage(?:[3-9]|10))_test_[a-f0-9]{16}$/.test(d.name)));
  const root = path.resolve('.runtime', (process.argv.includes('--project-audit') ? 'project-audit-backup-' : process.argv.includes('--final-gap') ? 'final-gap-backup-' : process.argv.includes('--stage10') ? 'stage10-backup-' : process.argv.includes('--stage9') ? 'stage9-backup-' : process.argv.includes('--stage8') ? 'stage8-backup-' : 'stage7-backup-') + Date.now());
  await mkdir(root, {
    recursive: true
  });
  const manifest = {
    database: connection.name,
    hostFingerprint: createHash('sha256').update(connection.host).digest('hex'),
    at: new Date(),
    backupRoot: root,
    databases: [],
    removed: []
  };
  for (const name of [connection.name, ...candidates.map(d => d.name)]) {
    const db = connection.getClient().db(name),
      collections = await db.listCollections({}, {
        nameOnly: true
      }).toArray();
    const owned = collections.every(c => allowed.has(c.name));
    const users = collections.some(c => c.name === 'users') ? await db.collection('users').find({}, {
      projection: {
        emailNormalized: 1,
        publicId: 1
      }
    }).toArray() : [];
    const synthetic = users.every(u => /@example\.(?:invalid|test)$|@(?:test\.invalid|example\.com)$/.test(u.emailNormalized ?? '') && /TEST|VERIFY|test|fixture/i.test(u.publicId ?? ''));
    const entry = {
      name,
      collections: [],
      disposable: name !== connection.name && owned && synthetic
    };
    for (const item of collections) {
      const rows = await db.collection(item.name).find().toArray(),
        indexes = await db.collection(item.name).indexes();
      const serialized = mongoose.mongo.BSON.EJSON.stringify({
        rows,
        indexes
      }, {
        relaxed: false
      });
      const file = path.join(root, name + '--' + item.name + '.json');
      await writeFile(file, serialized, {
        mode: 0o600,
        flag: 'wx'
      });
      const readback = await readFile(file, 'utf8'),
        restored = mongoose.mongo.BSON.EJSON.parse(readback);
      if (restored.rows.length !== rows.length || restored.indexes.length !== indexes.length || readback !== serialized) throw new Error('Backup verification failed');
      entry.collections.push({
        name: item.name,
        count: rows.length,
        indexes: indexes.length,
        sha256: createHash('sha256').update(readback).digest('hex')
      });
    }
    manifest.databases.push(entry);
  }
  await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), {
    mode: 0o600
  });
  // Inspect-only by default. Drop only exact, backed-up, positively owned test databases.
  if (process.argv.includes('--cleanup-confirmed-project-tests')) {
    for (const entry of manifest.databases.filter(d => d.disposable)) {
      await connection.getClient().db(entry.name).dropDatabase();
      manifest.removed.push(entry.name);
    }
    await writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), {
      mode: 0o600
    });
  }
  const safe = {
    database: manifest.database,
    hostFingerprint: manifest.hostFingerprint,
    backupRoot: root,
    backupReadable: true,
    serverDatabaseCount: inventory.length,
    projectTestCandidates: candidates.length,
    databases: manifest.databases,
    removed: manifest.removed
  };
  const evidenceFile = process.argv.includes('--project-audit') ? backendTestsOnly ? 'backend/FINAL-PROJECT-BACKEND-CLEANUP.json' : 'backend/FINAL-PROJECT-DATABASE-CLEANUP.json' : process.argv.includes('--final-gap') ? 'backend/FINAL-GAP-DATABASE-CLEANUP.json' : process.argv.includes('--stage10') ? backendTestsOnly ? 'backend/STAGE10-BACKEND-TEST-CLEANUP.json' : 'backend/STAGE10-DATABASE-CLEANUP.json' : process.argv.includes('--stage9') ? 'backend/STAGE9-DATABASE-CLEANUP.json' : process.argv.includes('--stage8') ? 'backend/STAGE8-DATABASE-CLEANUP.json' : process.argv.includes('--post-test-cleanup') ? 'backend/STAGE7-POST-TEST-CLEANUP.json' : 'backend/STAGE7-DATABASE-EVIDENCE.json';
  await writeFile(evidenceFile, JSON.stringify(safe, null, 2));
  console.log(JSON.stringify({
    database: safe.database,
    backupReadable: true,
    databaseCount: inventory.length,
    candidates: candidates.length,
    disposable: manifest.databases.filter(d => d.disposable).map(d => ({
      name: d.name,
      collections: d.collections.length
    })),
    removed: manifest.removed
  }));
} finally {
  await connection.close();
}
