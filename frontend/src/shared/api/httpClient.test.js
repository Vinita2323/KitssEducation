import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpClient, ApiError } from './httpClient.js';

const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json', 'X-Request-ID': 'server-request-id' } });

test('HTTP client includes cookie credentials, JSON, request ID and future CSRF token', async () => {
  let call;
  const client = createHttpClient({ getCsrfToken: () => 'csrf-test-value', createRequestId: () => 'client-request-id',
    fetchImpl: async (...args) => { call = args; return response({ data: { ok: true }, requestId: 'server-request-id' }); } });
  const result = await client.request('/future', { method: 'POST', json: { example: true } });
  assert.equal(call[0], '/api/v1/future');
  assert.equal(call[1].credentials, 'include');
  assert.equal(call[1].redirect, 'error');
  assert.equal(call[1].headers.get('X-Request-ID'), 'client-request-id');
  assert.equal(call[1].headers.get('X-CSRF-Token'), 'csrf-test-value');
  assert.equal(call[1].body, '{"example":true}');
  assert.equal(result.data.ok, true);
});

test('HTTP client returns structured server errors and rejects non-JSON/malformed success', async () => {
  const client = createHttpClient({ fetchImpl: async () => response({ error: { code: 'NOT_READY', message: 'Not ready', fields: [{ path: 'test' }] } }, 503) });
  await assert.rejects(client.request('/health/ready'), error => error instanceof ApiError && error.status === 503 && error.code === 'NOT_READY' && error.requestId === 'server-request-id' && error.fields.length === 1);
  for (const result of [new Response('<html>gateway</html>', { status: 502 }), response({ wrong: true })]) {
    await assert.rejects(createHttpClient({ fetchImpl: async () => result }).request('/test'), { code: 'INVALID_RESPONSE' });
  }
});

test('HTTP client supports 204 and network errors', async () => {
  const empty = createHttpClient({ fetchImpl: async () => new Response(null, { status: 204 }) });
  assert.equal((await empty.request('/test')).data, null);
  const offline = createHttpClient({ fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  await assert.rejects(offline.request('/test'), { code: 'NETWORK_ERROR' });
});

test('HTTP client distinguishes timeout and explicit AbortController cancellation', async () => {
  const fetchImpl = async (url, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error('aborted'));
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const client = createHttpClient({ fetchImpl, timeoutMs: 20 });
  await assert.rejects(client.request('/test'), { code: 'TIMEOUT' });
  const controller = new AbortController();
  const request = client.request('/test', { signal: controller.signal, timeout: 1000 });
  controller.abort();
  await assert.rejects(request, { code: 'ABORTED' });
});

test('HTTP client rejects off-origin endpoints, traversal and unsafe configuration', async () => {
  const client = createHttpClient();
  for (const endpoint of ['https://evil.test', '//evil.test', '/../auth', '/%2e%2e/auth', '/%2e%2e%2fauth', '/%2f%2fevil.test', '/safe\\evil']) await assert.rejects(client.request(endpoint));
  for (const baseUrl of ['//evil.test', 'file:///secret', 'https://user:pw@host/api', '/api?secret=x']) assert.throws(() => createHttpClient({ baseUrl }));
});
test('a stale unauthorized response cannot clear a newer identity', async () => {
  const { advanceIdentityEpoch } = await import('./httpClient.js');
  const priorWindow = globalThis.window;
  const events = [];
  globalThis.window = { dispatchEvent: event => events.push(event.type) };
  try {
    let finish;
    const client = createHttpClient({ fetchImpl: () => new Promise(resolve => { finish = resolve; }) });
    const pending = client.request('/auth/me');
    await new Promise(resolve => setImmediate(resolve));
    advanceIdentityEpoch();
    finish(new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Expired' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
    await assert.rejects(pending, { status: 401 });
    assert.deepEqual(events, []);
    const current = client.request('/auth/me');
    await new Promise(resolve => setImmediate(resolve));
    finish(new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', message: 'Expired' } }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
    await assert.rejects(current, { status: 401 });
    assert.deepEqual(events, ['kitss:session-expired']);
  } finally { if (priorWindow === undefined) delete globalThis.window; else globalThis.window = priorWindow; }
});

test('transfer errors preserve their short-lived capability without a session token', async () => {
  const client = createHttpClient({ fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'DEVICE_CONFLICT', message: 'Confirm transfer' }, data: { challengeId: 'short-lived', proof: 'one-use' }, requestId: 'test-request' }), { status: 409, headers: { 'Content-Type': 'application/json' } }) });
  await assert.rejects(client.request('/auth/login', { method: 'POST', json: {} }), error => error.code === 'DEVICE_CONFLICT' && error.data.proof === 'one-use' && !error.data.token);
});
test('multipart transport preserves cookie/CSRF/request IDs and lets the browser set its boundary', async () => {
  const formData = new FormData(); formData.append('purpose', 'book_cover');
  const client = createHttpClient({ getCsrfToken: () => 'test-csrf', fetchImpl: async (url, options) => {
    assert.equal(options.body, formData); assert.equal(options.credentials, 'include'); assert.equal(options.headers.get('Content-Type'), null); assert.equal(options.headers.get('X-CSRF-Token'), 'test-csrf'); assert.ok(options.headers.get('X-Request-ID'));
    return new Response(JSON.stringify({ data: { status: 'quarantined' } }), { headers: { 'Content-Type':'application/json' } });
  } });
  assert.equal((await client.request('/media', { method:'POST', formData })).data.status, 'quarantined');
});
