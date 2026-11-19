// Registering again for an unverified email: the password typed the second time is the one that works after
// verification, while nobody else can use a re-registration to choose the password the email's owner activates.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { silentLogger } from './helpers.js';

const dbName = process.env.KITSS_REREGISTER_TEST_DB;
test('re-registering an unverified account', { skip: dbName ? false : 'No KITSS_REREGISTER_TEST_DB supplied; integration not executed', timeout: 120000 }, async t => {
  assert.match(dbName, /^kitss_stage10_test_[a-f0-9]{16}$/);
  const config = loadConfig();
  const connection = await mongoose.createConnection(process.env.MONGODB_AUTH_TEST_URI || process.env.MONGODB_URI || config.mongo.uri, { dbName, serverSelectionTimeoutMS: 5000 }).asPromise();
  assert.equal((await connection.db.listCollections({}, { nameOnly: true }).toArray()).length, 0, 'Refusing to use an existing database');
  t.after(async () => { await connection.dropDatabase(); await connection.close(); });
  const models = createAuthModels(connection);
  const mail = { configured: true, messages: [], async send(message) { this.messages.push(message); } };
  let clock = new Date();
  config.auth.secret ||= randomUUID() + randomUUID();
  const service = await createAuthService({ models, config, mail, logger: silentLogger, now: () => clock });
  await service.initialize();
  const ctx = () => ({ ip: `test-${randomUUID()}`, requestId: randomUUID() });
  const later = () => { clock = new Date(clock.getTime() + config.auth.resendMs + 1000); };
  const code = () => mail.messages.at(-1).code;
  const canLogin = async (identifier, password) => service.login({ identifier, password }, ctx()).then(() => true, e => { if (e.code === 'INVALID_CREDENTIALS') return false; throw e; });

  await t.test('the password typed when registering again is the one that works after verifying', async () => {
    const address = 'again@example.invalid';
    await service.register({ name: 'First Try', email: address, password: 'first-password-1' }, ctx());
    later();
    const again = await service.register({ name: 'Second Try', email: address, password: 'second-password-2' }, ctx());
    await service.activate({ challengeId: again.challengeId, otp: code() }, ctx());
    assert.equal(await canLogin(address, 'second-password-2'), true);
    assert.equal(await canLogin(address, 'first-password-1'), false);
    assert.equal(await models.User.countDocuments({ emailNormalized: address }), 1);
  });

  await t.test('registering again within a minute says to wait instead of claiming a code was sent', async () => {
    const address = 'quick@example.invalid';
    await service.register({ name: 'Quick', email: address, password: 'quick-password-1' }, ctx());
    await assert.rejects(service.register({ name: 'Quick', email: address, password: 'quick-password-2' }, ctx()), { code: 'RESEND_COOLDOWN' });
  });

  await t.test('resend from the same registration keeps the new password', async () => {
    const address = 'resend@example.invalid';
    await service.register({ name: 'Resend', email: address, password: 'old-password-1' }, ctx());
    later();
    const again = await service.register({ name: 'Resend', email: address, password: 'new-password-2' }, ctx());
    later();
    const resent = await service.resend({ email: address, challengeId: again.challengeId }, ctx());
    await service.activate({ challengeId: resent.challengeId, otp: code() }, ctx());
    assert.equal(await canLogin(address, 'new-password-2'), true);
  });

  await t.test('someone re-registering another person\'s unverified email cannot set the password they activate', async () => {
    const address = 'owner@example.invalid';
    await service.register({ name: 'Owner', email: address, password: 'owner-password-1' }, ctx());
    later();
    await service.register({ name: 'Intruder', email: address, password: 'intruder-password' }, ctx()); // the intruder never sees the code
    later();
    const ownerResend = await service.resend({ email: address }, ctx()); // the owner asks for a new code without the intruder's challenge id
    await service.activate({ challengeId: ownerResend.challengeId, otp: code() }, ctx());
    assert.equal(await canLogin(address, 'intruder-password'), false, 'intruder password not applied');
    assert.equal(await canLogin(address, 'owner-password-1'), true, 'owner keeps their own password');
  });

  await t.test('a wrong challenge id on resend does not carry the pending password', async () => {
    const address = 'guess@example.invalid';
    await service.register({ name: 'Guess', email: address, password: 'guess-password-1' }, ctx());
    later();
    await service.register({ name: 'Guess', email: address, password: 'guess-password-2' }, ctx());
    later();
    const resent = await service.resend({ email: address, challengeId: 'not-the-current-challenge' }, ctx());
    await service.activate({ challengeId: resent.challengeId, otp: code() }, ctx());
    assert.equal(await canLogin(address, 'guess-password-2'), false);
    assert.equal(await canLogin(address, 'guess-password-1'), true);
  });
});
