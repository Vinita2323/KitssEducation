import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { backendRoot, loadConfig } from '../src/config/env.js';
import { createEmailService } from '../src/modules/email/email.service.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createAccountService } from '../src/modules/auth/account.service.js';
import { hashPassword } from '../src/modules/auth/security.js';
import { silentLogger } from './helpers.js';

// Ordinary test runs NEVER send mail. This suite sends at most six messages and
// permanently reserves the attempt before network use, preventing blind reruns.
test('explicitly authorized real Gmail SMTP workflows on isolated local MongoDB', {
  skip: process.env.KITSS_STAGE11_REAL_SMTP !== 'true' ? 'Real SMTP not explicitly opted in; no email sent' : false,
  timeout: 300000,
}, async t => {
  const config = loadConfig(), recipient = process.env.KITSS_SMTP_ACCEPTANCE_RECIPIENT;
  const uri = process.env.MONGODB_STAGE11_SMTP_TEST_URI, prefix = 'kitss_stage11_smtp_' + randomUUID().replaceAll('-', '').slice(0, 16);
  assert.match(uri || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/kitss_stage11_local$/);
  assert.ok(recipient && recipient === config.smtp.user && recipient === config.smtp.from, 'Only the explicitly authorized sender inbox may receive mail');
  assert.equal(config.smtp.host, 'smtp.gmail.com'); assert.equal(config.smtp.port, 587); assert.equal(config.smtp.secure, false);
  const directory = path.join(backendRoot, '.runtime'); await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'stage11-smtp-workflows-reserved.json'), JSON.stringify({ reservedAt: new Date().toISOString(), messageLimit: 6 }), { flag: 'wx', mode: 0o600 });
  const mail = createEmailService(config.smtp, silentLogger), accepted = [], connections = [];
  const evidence = { smtpAuthenticated: false, acceptedMessages: accepted, inboxReceiptVerified: false, realPaymentExecuted: false };
  t.after(async () => {
    for (const connection of connections) await connection.close();
    // No OTP, token, password, recipient address, message ID or DB document dump.
    await writeFile(path.join(backendRoot, 'STAGE11-SMTP-EVIDENCE.json'), JSON.stringify(evidence, null, 2) + '\n');
  });
  await mail.verify(); evidence.smtpAuthenticated = true;
  let latest;
  const guardedMail = { configured: true, async send(message) {
    assert.ok(message.to === recipient && accepted.length < 6, 'Recipient/message budget guard');
    await mail.send(message); latest = message;
    accepted.push({ purpose: message.purpose, acceptedBySmtp: true });
  } };
  const ctx = () => ({ ip: '127.0.0.1', requestId: randomUUID() });
  const password = 'Synthetic-only-' + randomUUID();
  const fixture = async suffix => {
    const connection = await mongoose.createConnection(uri, { dbName: prefix + '_' + suffix, serverSelectionTimeoutMS: 5000, autoIndex: false }).asPromise(); connections.push(connection);
    assert.equal((await connection.db.listCollections({}, { nameOnly: true }).toArray()).length, 0, 'Refuse existing database');
    const models = createAuthModels(connection);
    const auth = await createAuthService({ models, config, mail: guardedMail, logger: silentLogger }); await auth.initialize();
    return { models, auth };
  };
  await t.test('real registration OTP, invalid/expired rejection, rate-respecting resend, email verification and reset', async () => {
    const { models, auth } = await fixture('identity');
    const registered = await auth.register({ name: 'STAGE11 SYNTHETIC IDENTITY', email: recipient, password }, ctx());
    assert.equal(accepted.length, 1); const original = latest.code;
    assert.ok(!JSON.stringify(registered).includes(original), 'No OTP in service response');
    await assert.rejects(auth.activate({ challengeId: registered.challengeId, otp: '000000' }, ctx()), { code: 'INVALID_CHALLENGE' });
    await models.User.updateOne({ emailNormalized: recipient }, { $set: { 'challenges.verify.expiresAt': new Date(0) } });
    await assert.rejects(auth.activate({ challengeId: registered.challengeId, otp: original }, ctx()), { code: 'INVALID_CHALLENGE' });
    await auth.resend({ email: recipient }, ctx()); assert.equal(accepted.length, 1, 'Cooldown must not send another message');
    // Real elapsed cooldown: do not shorten the application's resend limit.
    await new Promise(resolve => setTimeout(resolve, config.auth.resendMs + 100));
    const resend = await auth.resend({ email: recipient }, ctx()); assert.equal(accepted.length, 2);
    await assert.rejects(auth.activate({ challengeId: registered.challengeId, otp: original }, ctx()), { code: 'INVALID_CHALLENGE' });
    await auth.activate({ challengeId: resend.challengeId, otp: latest.code }, ctx());
    const signed = await auth.login({ identifier: recipient, password }, ctx()); assert.ok(signed.token);
    const recovery = await auth.forgot({ identifier: recipient }, ctx()); assert.equal(accepted.length, 3);
    await assert.rejects(auth.reset({ challengeId: recovery.challengeId, otp: '000000', newPassword: password + 'x' }, ctx()), { code: 'INVALID_CHALLENGE' });
    await auth.reset({ challengeId: recovery.challengeId, otp: latest.code, newPassword: password + 'x' }, ctx());
    assert.equal(await auth.authenticate(signed.token, 'student'), null);
    await assert.rejects(auth.login({ identifier: recipient, password }, ctx()), { code: 'INVALID_CREDENTIALS' });
    assert.ok((await auth.login({ identifier: recipient, password: password + 'x' }, ctx())).token);
  });
  await t.test('real email-change verification targets only authorized inbox and revokes old session', async () => {
    const { models, auth } = await fixture('change');
    // Synthetic starting identity in a separate empty DB, not an application user.
    const initial = 'synthetic-' + randomUUID() + '@example.invalid';
    await models.User.create({ publicId: 'TEST' + randomUUID(), name: 'STAGE11 SYNTHETIC CHANGE', emailNormalized: initial, passwordHash: await hashPassword(password), roles: ['student'], status: 'active', emailVerifiedAt: new Date() });
    const signed = await auth.login({ identifier: initial, password }, ctx()), actor = await auth.authenticate(signed.token, 'student');
    const account = createAccountService({ authService: auth, config, mail: guardedMail });
    const result = await account.emailChange({ newEmail: recipient, currentPassword: password }, actor, ctx()); assert.equal(accepted.length, 4);
    await assert.rejects(account.confirm({ challengeId: result.challengeId, otp: '000000' }, actor, ctx()), { code: 'INVALID_PROOF' });
    await account.confirm({ challengeId: result.challengeId, otp: latest.code }, actor, ctx());
    assert.equal(await auth.authenticate(signed.token, 'student'), null);
    assert.ok(await models.User.exists({ emailNormalized: recipient }));
  });
  await t.test('real staff invitation and following verification OTP preserve invitation-only authority', async () => {
    const { models, auth } = await fixture('staff');
    const admin = await models.User.create({ publicId: 'TEST' + randomUUID(), name: 'STAGE11 SYNTHETIC OPERATOR', emailNormalized: 'operator@example.invalid', roles: ['super_admin'], status: 'active', emailVerifiedAt: new Date() });
    await auth.invite({ user: admin }, { name: 'STAGE11 SYNTHETIC STAFF', email: recipient, permissions: ['institutions.read'] }, ctx()); assert.equal(accepted.length, 5);
    const [challengeId, token] = latest.link.split('#')[1].split('.');
    const acceptedInvite = await auth.accept({ challengeId, token, newPassword: password }, ctx()); assert.equal(accepted.length, 6);
    await auth.activate({ challengeId: acceptedInvite.challengeId, otp: latest.code }, ctx());
    const signed = await auth.login({ identifier: recipient, password, kind: 'admin' }, ctx());
    assert.deepEqual(signed.permissions, ['institutions.read']);
  });
  assert.equal(accepted.length, 6);
});
