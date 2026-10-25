import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { validateEnv, loadConfig, ConfigurationError } from '../src/config/env.js';
import { tempDirectory, testEnv } from './helpers.js';

test('minimal configuration works without Razorpay credentials and rejects missing required configuration', async t => {
  const env = testEnv(await tempDirectory(t));
  const config = validateEnv(env);
  assert.equal(config.payment.mode, 'test');
  assert.equal(config.payment.keySecret, '');
  assert.equal(config.trustProxyHops, 0);
  assert.throws(() => validateEnv({}), ConfigurationError);
});

test('invalid configuration reports only field names, not secret values', async t => {
  const env = testEnv(await tempDirectory(t));
  for (const invalid of [
    { PORT: '0' }, { PORT: 'abc' }, { JSON_BODY_LIMIT_BYTES: '0' },
    { MONGODB_URI: 'private-sensitive-value' }, { STORAGE_LOCAL_ROOT: '../outside' },
    { CORS_ORIGINS: '*' }, { CORS_ORIGINS: 'https://trusted.example.evil/path' },
    { TRUST_PROXY_HOPS: 'true' }, { PAYMENT_MODE: 'live' }, { RAZORPAY_KEY_ID: 'rzp_live_rejected' },
    { NODE_ENV: 'production' }, { STORAGE_PROVIDER: 's3' }, { HOST: 'untrusted-host' },
  ]) assert.throws(() => validateEnv({ ...env, ...invalid }), error => error instanceof ConfigurationError && !error.message.includes('private-sensitive-value'));
});

test('environment loader preserves supplied process values and does not mutate or overwrite .env', async t => {
  const root = await tempDirectory(t);
  const envFile = path.join(root, '.env');
  await writeFile(envFile, `PORT=5100\nMONGODB_URI=mongodb://127.0.0.1:27017/kitss_test\nSTORAGE_LOCAL_ROOT="${root.replaceAll('\\', '/')}"\n`);
  assert.equal(loadConfig({ envFile, env: { PORT: '5200' } }).port, 5200);
  assert.equal(loadConfig({ envFile, env: {} }).port, 5100);
});

test('video and disk limit configuration remains bounded and requires no provider secrets', async t => {
  const env = testEnv(await tempDirectory(t));
  const config = validateEnv(env);
  assert.equal(config.media.videoMaxBytes,268435456);
  assert.equal(config.storage.minFreeBytes,1073741824);
  for(const [key,value] of [['MEDIA_VIDEO_MAX_BYTES','0'],['MEDIA_VIDEO_UPLOAD_TIMEOUT_MS','9999999'],['MEDIA_VIDEO_INSPECTION_TIMEOUT_MS','0'],['STORAGE_MIN_FREE_BYTES','-1']]) assert.throws(()=>validateEnv({...env,[key]:value}),ConfigurationError);
});
