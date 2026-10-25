import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { hashPassword, checkPassword, userDTO, grantsFor, equal } from '../src/modules/auth/security.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createEmailService } from '../src/modules/email/email.service.js';
import { createApp } from '../src/app.js';
import { testConfig, serve, silentLogger } from './helpers.js';
import { validateEnv } from '../src/config/env.js';

test('Argon2id hashes unique salts, verifies exact passwords and enforces length', async () => {
  const pw = ' a long password with spaces ';
  const a = await hashPassword(pw), b = await hashPassword(pw);
  assert.match(a, /^\$argon2id\$v=19\$/);
  assert.match(a, /m=65536/); assert.match(a, /t=3/); assert.match(a, /p=1/);
  assert.notEqual(a, b);
  assert.equal(await checkPassword(a, pw), true);
  assert.equal(await checkPassword(a, pw.trim()), false);
  assert.equal(await checkPassword(a, 'wrong'), false);
  await assert.rejects(hashPassword('short'), { code: 'WEAK_PASSWORD' });
  await assert.rejects(hashPassword('x'.repeat(129)), { code: 'WEAK_PASSWORD' });
  assert.equal(equal('secret', 'longer'), false);
});

test('identity schema constrains roles and DTO never exposes security fields', async () => {
  const connection = mongoose.createConnection();
  const { User, Session } = createAuthModels(connection);
  const user = new User({ publicId: 'KITSS1', name: 'Test', emailNormalized: 'test@example.invalid', passwordHash: 'private', roles: ['student'], permissions: ['accounts.roles.manage'] });
  await user.validate();
  assert.deepEqual(grantsFor(user), []);
  assert.equal(JSON.stringify(userDTO(user)).includes('private'), false);
  assert.equal(userDTO(user).permissions.length, 0);
  user.roles = ['teacher'];
  await assert.rejects(user.validate());
  assert.equal(User.schema.path('passwordHash').options.select, false);
  assert.equal(User.schema.indexes().some(([index, options]) => index.emailNormalized && options.unique), true);
  assert.equal(Session.schema.indexes().some(([index, options]) => index.expiresAt && options.expireAfterSeconds === 0), true);
  assert.equal(grantsFor({ roles: ['admin'], permissions: ['accounts.roles.manage', 'institutions.read', 'invented'] }).join(), 'institutions.read');
  await connection.close();
});

test('SMTP abstraction uses fake transport and fails safely without configured/accepted delivery', async () => {
  const sent = [];
  const mail = createEmailService({ from: 'no-reply@example.invalid' }, silentLogger, { transport: { async sendMail(message) { sent.push(message); return { accepted: [message.to] }; } } });
  for (const purpose of ['verify', 'reset', 'invite']) await mail.send({ to: 'person@example.invalid', purpose, code: '654321', link: 'https://example.invalid/staff/accept#proof' });
  assert.equal(sent.length, 3);
  assert.match(sent[0].text, /654321/);
  const missing = createEmailService({}, silentLogger);
  await assert.rejects(missing.send({}), { code: 'EMAIL_UNAVAILABLE' });
  const failed = createEmailService({}, silentLogger, { transport: { sendMail: async () => { throw new Error('SMTP password must not leak'); } } });
  await assert.rejects(failed.send({ purpose: 'reset' }), e => e.code === 'EMAIL_UNAVAILABLE' && !e.message.includes('password'));
});

test('standalone environment is permitted and SMTP configuration rejects incomplete setup', async t => {
  const config = await testConfig(t);
  assert.equal(validateEnv({ MONGODB_URI: 'mongodb://localhost:27017', STORAGE_LOCAL_ROOT: config.storage.root }).mongo.dbName, 'kitss_education_dev');
  assert.throws(() => validateEnv({ MONGODB_URI: 'mongodb://localhost:27017', STORAGE_LOCAL_ROOT: config.storage.root, SMTP_HOST: 'smtp.example.invalid' }), /SMTP_CONFIGURATION/);
});

test('auth HTTP enforces Origin, signed CSRF, validation, 401 and backend permission denial', async t => {
  const config = await testConfig(t, { AUTH_SECRET: 'test-only-secret-with-more-than-32-characters' });
  const calls = [];
  const service = { authenticate: async () => null, throttle: async () => {}, login: async input => { calls.push(input); return { conflict: true, challengeId: 'test-challenge', proof: 'test-proof' }; } };
  const url = await serve(t, createApp({ config, logger: silentLogger, database: {}, storage: {}, authService: service }));
  const csrf = await fetch(`${url}/api/v1/auth/csrf`);
  const cookie = csrf.headers.getSetCookie()[0].split(';')[0];
  const token = (await csrf.json()).data.csrfToken;
  const post = (path, data, headers = {}) => fetch(`${url}/api/v1${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
  assert.equal((await post('/auth/login', {})).status, 403);
  assert.equal((await post('/auth/login', {}, { Origin: config.corsOrigins[0] })).status, 403);
  const headers = { Origin: config.corsOrigins[0], Cookie: cookie, 'X-CSRF-Token': token };
  assert.equal((await post('/auth/login', { identifier: { $ne: null }, password: 'test' }, headers)).status, 422);
  assert.equal((await post('/auth/accounts', { name: 'X', email: 'a@example.invalid', password: 'long password', roles: ['super_admin'] }, headers)).status, 422);
  assert.equal((await post('/auth/login', { identifier: 'a@example.invalid', password: 'long password' }, headers)).status, 409);
  assert.equal(calls.length, 1);
  assert.equal((await fetch(`${url}/api/v1/auth/me`)).status, 401);
  assert.equal((await post('/admin/users/invitations', { name: 'X', email: 'x@example.invalid' }, headers)).status, 401);
  assert.equal((await post('/auth/logout', {}, { ...headers, 'X-CSRF-Token': token + 'x' })).status, 403);
});
