import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createApp } from '../src/app.js';
import { errorHandler } from '../src/middleware/errors.js';
import { requestId } from '../src/middleware/requestId.js';
import { serve, testConfig, silentLogger } from './helpers.js';

async function fixture(t, options = {}) {
  const config = await testConfig(t, options.env);
  const lifecycle = { draining: false };
  const app = createApp({ config, logger: silentLogger, lifecycle,
    database: options.database ?? { isReady: async () => true },
    storage: options.storage ?? { isReady: async () => true } });
  return { base: await serve(t, app), lifecycle, app };
}

test('health endpoints follow A76/A77 format, headers and request IDs', async t => {
  const { base } = await fixture(t);
  for (const endpoint of ['live', 'ready']) {
    const response = await fetch(`${base}/api/v1/health/${endpoint}`, { headers: { 'X-Request-ID': 'stage2-test-request' } });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.status, endpoint === 'live' ? 'ok' : 'ready');
    assert.equal(body.requestId, 'stage2-test-request');
    assert.equal(response.headers.get('X-Request-ID'), body.requestId);
    assert.ok(response.headers.get('Content-Security-Policy'));
    assert.equal(response.headers.get('X-Powered-By'), null);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

test('readiness fails when DB/storage fail, throw, time out, or shutdown begins; liveness stays healthy', async t => {
  for (const options of [
    { database: { isReady: async () => false } },
    { storage: { isReady: async () => false } },
    { database: { isReady: async () => { throw new Error('private db info'); } } },
    { database: { isReady: () => new Promise(() => {}) }, env: { READINESS_TIMEOUT_MS: '50' } },
  ]) {
    const { base } = await fixture(t, options);
    const response = await fetch(`${base}/api/v1/health/ready`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error.code, 'NOT_READY');
    assert.ok(!JSON.stringify(body).includes('private db info'));
    assert.equal((await fetch(`${base}/api/v1/health/live`)).status, 200);
  }
  const { base, lifecycle } = await fixture(t);
  lifecycle.draining = true;
  assert.equal((await fetch(`${base}/api/v1/health/ready`)).status, 503);
});

test('unknown routes, private files, uploads and future business endpoints are not exposed', async t => {
  const { base, app } = await fixture(t);
  assert.equal(app.get('trust proxy'), false);
  for (const endpoint of ['/api/v1/books', '/api/v1/auth/me', '/api/v1/media/private/file', '/uploads/private/file', '/health/live']) {
    const response = await fetch(base + endpoint, { headers: { 'X-Request-ID': 'invalid' } });
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.match(body.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(body.error.stack, undefined);
  }
  assert.equal((await fetch(base + '/api/v1/media', { method: 'POST' })).status, 404);
});

test('CORS allows exact configured origins and rejects malicious origins/preflights', async t => {
  const { base } = await fixture(t);
  const good = await fetch(`${base}/api/v1/health/live`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(good.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
  assert.equal(good.headers.get('Access-Control-Allow-Credentials'), 'true');
  for (const origin of ['null', 'http://localhost:5173.evil.test', 'https://evil.test']) {
    const response = await fetch(`${base}/api/v1/health/live`, { headers: { Origin: origin } });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  const preflight = await fetch(`${base}/api/v1/health/live`, { method: 'OPTIONS', headers: {
    Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-csrf-token,x-request-id' } });
  assert.equal(preflight.status, 204);
  const denied = await fetch(`${base}/api/v1/health/live`, { method: 'OPTIONS', headers: {
    Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'TRACE' } });
  assert.equal(denied.status, 403);
});

test('JSON parsing rejects malformed/scalar/oversized/encoded bodies with safe errors', async t => {
  const { base } = await fixture(t, { env: { JSON_BODY_LIMIT_BYTES: '256' } });
  for (const [body, status, code] of [['{"password":"do-not-echo",', 400, 'INVALID_JSON'], ['7', 400, 'INVALID_JSON'], [JSON.stringify({ payload: 'x'.repeat(300) }), 413, 'BODY_TOO_LARGE']]) {
    const response = await fetch(base + '/api/v1/unknown', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, status);
    const error = await response.json();
    assert.equal(error.error.code, code);
    assert.ok(!JSON.stringify(error).includes('do-not-echo'));
  }
  const response = await fetch(base + '/api/v1/unknown', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body: '{}' });
  assert.equal(response.status, 415);
});

test('unexpected exception serialization hides internal messages and stack', async t => {
  const app = express();
  app.use(requestId);
  app.get('/test', () => { throw new Error('secret-db-path'); });
  app.use(errorHandler(silentLogger));
  const response = await fetch(await serve(t, app) + '/test');
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.error.code, 'INTERNAL_ERROR');
  assert.ok(!JSON.stringify(body).includes('secret-db-path'));
});
