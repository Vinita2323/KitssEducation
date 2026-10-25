import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../src/config/database.js';
import { silentLogger } from './helpers.js';

const uri = process.env.MONGODB_TEST_URI;
test('opt-in local replica-set MongoDB connection/readiness/disconnect', {
  skip: uri ? false : 'No MONGODB_TEST_URI supplied; real MongoDB integration was not executed',
  timeout: 10000,
}, async () => {
  // Deliberately refuse unknown remote hosts and any production-like DB name.
  assert.match(uri, /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/kitss_[a-z0-9_]*test\?replicaSet=[a-zA-Z0-9_-]+$/);
  const database = createDatabase({ uri, requireReplicaSet: true, serverSelectionTimeoutMS: 2000, connectTimeoutMS: 2000, socketTimeoutMS: 3000, maxPoolSize: 1 }, silentLogger);
  try { await database.connect(); assert.equal(await database.isReady(), true); }
  finally { await database.disconnect(); }
});
