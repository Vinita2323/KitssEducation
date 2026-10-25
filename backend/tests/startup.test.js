import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { startServer, installSignalHandlers } from '../src/server.js';
import { AppError } from '../src/utils/AppError.js';
import { testConfig, silentLogger } from './helpers.js';

test('startup validates dependencies before listen and graceful shutdown is idempotent', async t => {
  const order = [];
  const database = { connect: async () => order.push('db'), disconnect: async () => order.push('disconnect'), isReady: async () => true };
  const storage = { initialize: async () => order.push('storage'), isReady: async () => true };
  const runtime = await startServer({ config: await testConfig(t), logger: silentLogger, database, storage, port: 0 });
  t.after(() => runtime.close());
  assert.deepEqual(order, ['storage', 'db']);
  const response = await fetch(`http://127.0.0.1:${runtime.server.address().port}/api/v1/health/ready`);
  assert.equal(response.status, 200);
  await runtime.close(); await runtime.close();
  assert.equal(runtime.lifecycle.draining, true);
  assert.equal(runtime.server.listening, false);
  assert.equal(order.filter(v => v === 'disconnect').length, 1);
});

test('failed database/storage initialization does not start HTTP and cleans DB resources', async t => {
  for (const failing of ['storage', 'database']) {
    let disconnected = 0;
    const database = { connect: async () => { if (failing === 'database') throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database unavailable'); }, disconnect: async () => { disconnected++; } };
    const storage = { initialize: async () => { if (failing === 'storage') throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Storage unavailable'); } };
    await assert.rejects(startServer({ config: await testConfig(t), logger: silentLogger, database, storage, port: 0 }), { status: 503 });
    assert.equal(disconnected, 1);
  }
});

test('SIGINT and SIGTERM share one shutdown and release installed listeners', async () => {
  const processRef = new EventEmitter();
  let closed = 0;
  installSignalHandlers({ close: async () => { closed++; } }, { processRef, logger: silentLogger });
  processRef.emit('SIGINT'); processRef.emit('SIGTERM');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(closed, 1);
  assert.equal(processRef.listenerCount('SIGINT'), 0);
  assert.equal(processRef.listenerCount('SIGTERM'), 0);
});

test('shutdown errors set failure exit status without disclosing internals', async () => {
  const processRef = new EventEmitter();
  installSignalHandlers({ close: async () => { throw new Error('private detail'); } }, { processRef, logger: silentLogger });
  processRef.emit('SIGTERM');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(processRef.exitCode, 1);
});

test('shutdown deadline rejects a stuck dependency and CLI signal handler requests a bounded failure exit', async t => {
  const config = await testConfig(t, { SHUTDOWN_TIMEOUT_MS: '100' });
  const runtime = await startServer({ config, logger: silentLogger, port: 0,
    database: { connect: async () => {}, isReady: async () => true, disconnect: () => new Promise(() => {}) },
    storage: { initialize: async () => {}, isReady: async () => true } });
  await assert.rejects(runtime.close(), { code: 'SHUTDOWN_TIMEOUT' });
  assert.equal(runtime.server.listening, false);
  const processRef = new EventEmitter();
  let exitStatus;
  processRef.exit = status => { exitStatus = status; };
  installSignalHandlers({ close: () => Promise.reject(new AppError(503, 'SHUTDOWN_TIMEOUT', 'Timeout')) }, { processRef, logger: silentLogger });
  processRef.emit('SIGINT');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(exitStatus, 1);
});
