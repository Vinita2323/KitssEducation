import test from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { createLogger } from '../src/config/logger.js';

test('structured logger redacts nested sensitive values, URI, known secrets and error text', () => {
  const chunks = [];
  const destination = new Writable({ write(chunk, encoding, callback) { chunks.push(chunk.toString()); callback(); } });
  const logger = createLogger({ destination, secrets: ['known-test-secret'] });
  logger.info({ user: { password: 'pw-value', items: [{ otp: 'otp-value', cookie: 'cookie-value' }] },
    body: { identity: 'body-value' }, proof: 'transfer-proof-value', challenge: 'challenge-value', smtp: { appPassword: 'smtp-password-value' }, message: 'known-test-secret',
    err: new Error('error-secret-stack'), connection: 'mongodb://name:uri-value@host/db' }, 'Safe event');
  const output = chunks.join('');
  for (const secret of ['pw-value', 'otp-value', 'cookie-value', 'body-value', 'transfer-proof-value', 'challenge-value', 'smtp-password-value', 'known-test-secret', 'error-secret-stack', 'uri-value']) assert.ok(!output.includes(secret), secret);
  assert.equal(JSON.parse(output).service, 'kitss-backend');
  assert.ok(output.includes('[REDACTED]'));
});
