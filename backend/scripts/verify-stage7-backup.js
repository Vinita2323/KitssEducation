import mongoose from 'mongoose';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
// Restore a logical backup ONLY into a fresh database on the separate local
// standalone test server. Never uses the application's configured MongoDB URI.
if (!process.argv.includes('--local-restore-confirmed')) throw new Error('Explicit local restore flag required');
const evidence = JSON.parse(await readFile('backend/STAGE7-DATABASE-EVIDENCE.json', 'utf8'));
const manifest = JSON.parse(await readFile(path.join(evidence.backupRoot, 'manifest.json'), 'utf8'));
const source = manifest.databases.find(d => d.name === 'kitss_education_dev');
if (!source) throw new Error('Application backup missing');
const name = 'kitss_stage7_restore_' + randomUUID().replaceAll('-', '').slice(0, 16);
const connection = await mongoose.createConnection('mongodb://127.0.0.1:27187/' + name, {
  autoIndex: false,
  serverSelectionTimeoutMS: 5000
}).asPromise();
try {
  if ((await connection.db.listCollections().toArray()).length) throw new Error('Fresh local restore database required');
  const report = {
    sourceDatabase: source.name,
    restoredDatabase: name,
    localOnly: true,
    topologyChanged: false,
    logicalBackup: true,
    collections: []
  };
  for (const item of source.collections) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(item.name)) throw new Error('Unsafe collection name');
    const raw = await readFile(path.join(evidence.backupRoot, source.name + '--' + item.name + '.json'), 'utf8');
    if (createHash('sha256').update(raw).digest('hex') !== item.sha256) throw new Error('Backup checksum mismatch');
    const data = mongoose.mongo.BSON.EJSON.parse(raw, {
      relaxed: false
    });
    await connection.db.createCollection(item.name);
    const collection = connection.db.collection(item.name);
    if (data.rows.length) await collection.insertMany(data.rows);
    for (const index of data.indexes.filter(i => i.name !== '_id_')) {
      const {
        key,
        name,
        unique,
        sparse,
        expireAfterSeconds,
        partialFilterExpression
      } = index;
      await collection.createIndex(key, {
        name,
        ...(unique ? {
          unique
        } : {}),
        ...(sparse ? {
          sparse
        } : {}),
        ...(expireAfterSeconds !== undefined ? {
          expireAfterSeconds: Number(expireAfterSeconds)
        } : {}),
        ...(partialFilterExpression ? {
          partialFilterExpression
        } : {})
      });
    }
    const rows = await collection.find().toArray(),
      indexes = await collection.indexes();
    const rowsMatch = mongoose.mongo.BSON.EJSON.stringify(rows, {
      relaxed: false
    }) === mongoose.mongo.BSON.EJSON.stringify(data.rows, {
      relaxed: false
    });
    report.collections.push({
      name: item.name,
      rows: item.count,
      indexes: indexes.length,
      rowsMatch,
      indexCountMatch: indexes.length === item.indexes
    });
  }
  report.passed = report.collections.every(c => c.rowsMatch && c.indexCountMatch);
  await writeFile('backend/STAGE7-BACKUP-RESTORE-VERIFICATION.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    localRestore: true,
    collections: report.collections.length,
    passed: report.passed
  }));
  if (!report.passed) process.exitCode = 1;
} finally {
  await connection.close();
}
