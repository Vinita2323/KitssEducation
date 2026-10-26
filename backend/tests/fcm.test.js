import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/config/env.js';
import { tempDirectory, testEnv } from './helpers.js';
import { createFirebaseTransport, pushPayload } from '../src/modules/notifications/firebaseAdmin.js';

test('FCM configuration defaults gracefully when omitted from env', async (t) => {
  const env = testEnv(await tempDirectory(t));
  const config = validateEnv(env);
  assert.equal(config.firebase.serviceAccountPath, '');
  assert.equal(config.firebase.configJson, '');
});

test('FCM configuration accepts optional environment variables without error', async (t) => {
  const env = testEnv(await tempDirectory(t));
  env.FIREBASE_SERVICE_ACCOUNT_PATH = './config/firebase.json';
  env.FIREBASE_CONFIG = '{"project_id":"test-123"}';
  const config = validateEnv(env);
  assert.equal(config.firebase.serviceAccountPath, './config/firebase.json');
  assert.equal(config.firebase.configJson, '{"project_id":"test-123"}');
});

test('FCM is disabled even with private configuration unless explicitly opted in', async () => {
  assert.deepEqual(await createFirebaseTransport({ firebase: { configJson: 'never-read' } }), { configured: false });
});
test('Invalid private configuration fails closed with a generic log event', async () => {
  const logs = [];
  const provider = await createFirebaseTransport({ firebase: { pushEnabled: true, configJson: 'PRIVATE_INVALID_CONFIG' } }, { warn: (...args) => logs.push(args) });
  assert.equal(provider.configured, false);
  assert.equal(logs.length, 1);
  assert.equal(JSON.stringify(logs).includes('PRIVATE_INVALID_CONFIG'), false);
});
test('provider payload contains only a generic prompt, opaque notice ID and fixed internal link', () => {
  const payload = pushPayload('synthetic-device', 'synthetic-notice');
  assert.deepEqual(payload.data, { notificationId: 'synthetic-notice', link: '/notifications' });
  assert.deepEqual(Object.keys(payload.notification).sort(), ['body', 'title']);
  assert.equal(payload.notification.body, 'You have a new notification. Sign in to view it.');
});
