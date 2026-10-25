import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createDatabase } from '../src/config/database.js';
import { silentLogger } from './helpers.js';

const config = { uri: 'mongodb://127.0.0.1:1/kitss_stage2_test', requireReplicaSet: true,
  serverSelectionTimeoutMS: 200, connectTimeoutMS: 200, socketTimeoutMS: 200, maxPoolSize: 1 };

function fakeConnection({ fail = false, replica = true } = {}) {
  const connection = new EventEmitter();
  connection.readyState = 0;
  connection.closed = 0;
  connection.openUri = async (uri, options) => {
    connection.options = options;
    if (fail) throw new Error('mongodb://secret:password@private-host/database');
    connection.readyState = 1;
  };
  connection.close = async () => { connection.closed++; connection.readyState = 0; };
  connection.db = { admin: () => ({ command: async input => input.hello ? (replica ? { setName: 'rs0' } : {}) : { ok: 1 } }) };
  return connection;
}

test('database config disables buffering/index creation, validates replica set, pings and disconnects', async () => {
  const connection = fakeConnection();
  const db = createDatabase(config, silentLogger, { connection });
  assert.equal(await db.isReady(), false);
  await db.connect();
  assert.equal(connection.options.bufferCommands, false);
  assert.equal(connection.options.autoIndex, false);
  assert.equal(await db.isReady(), true);
  await db.disconnect();
  assert.equal(await db.isReady(), false);
});

test('initial DB failure and standalone topology close connection and expose only safe error', async () => {
  for (const connection of [fakeConnection({ fail: true }), fakeConnection({ replica: false })]) {
    const db = createDatabase(config, silentLogger, { connection });
    await assert.rejects(db.connect(), error => error.code === 'DATABASE_UNAVAILABLE' && !error.message.includes('password'));
    assert.equal(connection.closed, 1);
  }
});

test('real Mongoose loopback connection refusal is bounded and serialized safely', { timeout: 5000 }, async () => {
  const db = createDatabase(config, silentLogger);
  await assert.rejects(db.connect(), { code: 'DATABASE_UNAVAILABLE' });
  assert.equal(await db.isReady(), false);
  await db.disconnect();
});
