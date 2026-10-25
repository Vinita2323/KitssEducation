import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { silentLogger } from './helpers.js';
import { serve } from './helpers.js';
import { createApp } from '../src/app.js';

const dbName = process.env.KITSS_AUTH_TEST_DB;
test('Stage 3 real MongoDB atomic authentication (dedicated fresh database only)', {
  skip: dbName ? false : 'No KITSS_AUTH_TEST_DB supplied; real auth integration not executed', timeout: 120000,
}, async t => {
  assert.match(dbName, /^kitss_stage3_test_[a-f0-9]{16}$/);
  const config = loadConfig();
  // Explicit safe database selection overrides the owner database path. Never
  // drop a database/collection or run tests against the configured application DB.
  const connection = await mongoose.createConnection(process.env.MONGODB_AUTH_TEST_URI || config.mongo.uri, { dbName, serverSelectionTimeoutMS: 5000, autoIndex: false }).asPromise();
  const existing = await connection.db.listCollections({}, { nameOnly: true }).toArray();
  assert.equal(existing.length, 0, 'Refusing to use an existing database');
  const models = createAuthModels(connection);
  const mail = { configured: true, messages: [], fail: false, async send(message) { if (this.fail) throw Object.assign(new Error('Delivery unavailable'), { code: 'EMAIL_UNAVAILABLE' }); this.messages.push(message); } };
  let clock = new Date();
  config.auth.secret ||= randomUUID() + randomUUID();
  const service = await createAuthService({ models, config, mail, logger: silentLogger, now: () => clock });
  await service.initialize();
  const ctx = () => ({ ip: `test-${randomUUID()}`, requestId: randomUUID() });
  const { User, Session, AuthThrottle, AuditLog } = models;
  t.after(async () => {
    // Only IDs created inside this fresh, guarded database. No drops/resets.
    for (const Model of Object.values(models)) { const ids = (await Model.find({}, { _id: 1 }).lean()).map(x => x._id); if (ids.length) await Model.deleteMany({ _id: { $in: ids } }); }
    await connection.close();
  });
  const password = 'Correct horse battery staple!';
  const address = 'student@example.invalid';
  let registered, login, user, transferred, reset;
  await t.test('registration stores hash and normalized unique email; no session/paid grants', async () => {
    registered = await service.register({ name: 'Test Student', email: 'STUDENT@example.invalid', password }, ctx());
    user = await User.findOne({ emailNormalized: address }).select('+passwordHash');
    assert.match(user.passwordHash, /^\$argon2id/); assert.equal(user.status, 'pending');
    assert.equal(await Session.countDocuments(), 0); assert.equal(user.activeSessionId, null);
    assert.equal(user.challenges.verify.hash.includes(mail.messages.at(-1).code), false);
    assert.equal(user.roles.join(), 'student');
    await assert.rejects(service.login({ identifier: address, password }, ctx()), { code: 'INVALID_CREDENTIALS' });
    const duplicate = await service.register({ name: 'Other', email: address, password }, ctx());
    assert.equal(typeof duplicate.challengeId, 'string'); assert.equal(await User.countDocuments(), 1);
  });
  await t.test('OTP wrong attempts, concurrent consumption and replay', async () => {
    const code = mail.messages.at(-1).code;
    await assert.rejects(service.activate({ challengeId: registered.challengeId, otp: '000000' }, ctx()), { code: 'INVALID_CHALLENGE' });
    const outcomes = await Promise.allSettled([service.activate({ challengeId: registered.challengeId, otp: code }, ctx()), service.activate({ challengeId: registered.challengeId, otp: code }, ctx())]);
    assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
    await assert.rejects(service.activate({ challengeId: registered.challengeId, otp: code }, ctx()), { code: 'INVALID_CHALLENGE' });
  });
  await t.test('login by email/ID, hashed persistent cookies and generic failures', async () => {
    await assert.rejects(service.login({ identifier: address, password: 'incorrect password' }, ctx()), { code: 'INVALID_CREDENTIALS' });
    await assert.rejects(service.login({ identifier: 'absent@example.invalid', password }, ctx()), { code: 'INVALID_CREDENTIALS' });
    login = await service.login({ identifier: 'STUDENT@example.invalid', password }, ctx());
    assert.equal(login.user.id, user.publicId); assert.notEqual(login.session.tokenHash, login.token);
    assert.equal((await service.authenticate(login.token, 'student')).user.publicId, user.publicId);
    assert.equal(await service.authenticate(login.token, 'admin'), null);
    await service.logout(await service.authenticate(login.token, 'student'), ctx());
    assert.equal(await service.authenticate(login.token, 'student'), null);
    login = await service.login({ identifier: user.publicId, password }, ctx());
  });
  await t.test('student login conflict cannot silently transfer; concurrent confirmation wins once', async () => {
    const conflict = await service.login({ identifier: address, password }, ctx());
    assert.equal(conflict.conflict, true); assert.ok(await service.authenticate(login.token, 'student'));
    await assert.rejects(service.transfer({ ...conflict, confirmed: false }, ctx()), { code: 'INVALID_CHALLENGE' });
    const results = await Promise.allSettled([service.transfer({ ...conflict, confirmed: true }, ctx()), service.transfer({ ...conflict, confirmed: true }, ctx())]);
    assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
    transferred = results.find(x => x.status === 'fulfilled').value;
    assert.equal(await service.authenticate(login.token, 'student'), null);
    assert.ok(await service.authenticate(transferred.token, 'student'));
    await assert.rejects(service.transfer({ ...conflict, confirmed: true }, ctx()), { code: 'INVALID_CHALLENGE' });
  });
  await t.test('generic recovery, OTP reset and credential version revoke every old session', async () => {
    const absent = await service.forgot({ identifier: 'absent@example.invalid' }, ctx());
    reset = await service.forgot({ identifier: address }, ctx());
    assert.equal(absent.message, reset.message);
    const code = mail.messages.at(-1).code;
    const outcomes = await Promise.allSettled([service.reset({ challengeId: reset.challengeId, otp: code, newPassword: password + '2' }, ctx()), service.reset({ challengeId: reset.challengeId, otp: code, newPassword: password + '3' }, ctx())]);
    assert.equal(outcomes.filter(x => x.status === 'fulfilled').length, 1);
    assert.equal(await service.authenticate(transferred.token, 'student'), null);
    await assert.rejects(service.login({ identifier: address, password }, ctx()), { code: 'INVALID_CREDENTIALS' });
  });
  await t.test('resend cooldown, previous invalidation, expiry and attempt exhaustion', async () => {
    const pending = await service.register({ name: 'Pending', email: 'pending@example.invalid', password }, ctx());
    const oldCode = mail.messages.at(-1).code;
    const cooldown = await service.resend({ email: 'pending@example.invalid' }, ctx());
    assert.notEqual(cooldown.challengeId, pending.challengeId);
    clock = new Date(clock.getTime() + config.auth.resendMs + 1);
    const renewed = await service.resend({ email: 'pending@example.invalid' }, ctx());
    await assert.rejects(service.activate({ challengeId: pending.challengeId, otp: oldCode }, ctx()), { code: 'INVALID_CHALLENGE' });
    const code = mail.messages.at(-1).code;
    for (let i = 0; i < 5; i++) await assert.rejects(service.activate({ challengeId: renewed.challengeId, otp: '000000' }, ctx()));
    await assert.rejects(service.activate({ challengeId: renewed.challengeId, otp: code }, ctx()), { code: 'INVALID_CHALLENGE' });
    clock = new Date(clock.getTime() + config.auth.resendMs + 1);
    const expired = await service.resend({ email: 'pending@example.invalid' }, ctx());
    const expiredCode = mail.messages.at(-1).code;
    clock = new Date(clock.getTime() + config.auth.otpTtlMs + 1);
    await assert.rejects(service.activate({ challengeId: expired.challengeId, otp: expiredCode }, ctx()), { code: 'INVALID_CHALLENGE' });
  });
  await t.test('SMTP failures invalidate undelivered proofs and never verify accounts', async () => {
    mail.fail = true;
    await assert.rejects(service.register({ name: 'Failed', email: 'failed@example.invalid', password }, ctx()));
    const failed = await User.findOne({ emailNormalized: 'failed@example.invalid' });
    assert.equal(failed.status, 'pending'); assert.equal(failed.challenges.verify, undefined);
    mail.fail = false;
  });
  let admin;
  await t.test('real HTTP login cookies, me, CSRF, student RBAC and logout', async httpTest => {
    const account = await service.register({ name: 'HTTP', email: 'http@example.invalid', password }, ctx());
    await service.activate({ challengeId: account.challengeId, otp: mail.messages.at(-1).code }, ctx());
    const url = await serve(httpTest, createApp({ config, logger: silentLogger, database: {}, storage: {}, authService: service }));
    const csrfResponse = await fetch(`${url}/api/v1/auth/csrf`);
    const csrfCookie = csrfResponse.headers.getSetCookie()[0].split(';')[0];
    const token = (await csrfResponse.json()).data.csrfToken;
    const headers = { Origin: config.corsOrigins[0], 'Content-Type': 'application/json', Cookie: csrfCookie, 'X-CSRF-Token': token };
    const loginResponse = await fetch(`${url}/api/v1/auth/login`, { method: 'POST', headers, body: JSON.stringify({ identifier: 'http@example.invalid', password }) });
    assert.equal(loginResponse.status, 200);
    const issued = loginResponse.headers.getSetCookie().find(value => value.startsWith('kitss_student_session='));
    assert.match(issued, /HttpOnly/); assert.match(issued, /SameSite=Lax/); assert.doesNotMatch(issued, /Domain=/);
    const loginBody = await loginResponse.json();
    assert.equal(loginBody.data.token, undefined); assert.equal(loginBody.data.user.passwordHash, undefined);
    headers.Cookie += '; ' + issued.split(';')[0];
    assert.equal((await fetch(`${url}/api/v1/auth/me`, { headers })).status, 200);
    assert.equal((await fetch(`${url}/api/v1/admin/users/invitations`, { method: 'POST', headers, body: JSON.stringify({ name: 'No', email: 'no@example.invalid' }) })).status, 403);
    assert.equal((await fetch(`${url}/api/v1/auth/logout`, { method: 'POST', headers, body: '{}' })).status, 204);
    assert.equal((await fetch(`${url}/api/v1/auth/me`, { headers })).status, 401);
  });
  await t.test('password change revokes sessions and audit outage retains durable events', async () => {
    const account = await service.register({ name: 'Change', email: 'change@example.invalid', password }, ctx());
    await service.activate({ challengeId: account.challengeId, otp: mail.messages.at(-1).code }, ctx());
    const signed = await service.login({ identifier: 'change@example.invalid', password }, ctx());
    const auth = await service.authenticate(signed.token, 'student');
    await assert.rejects(service.change(auth, { currentPassword: 'incorrect password', newPassword: password + 'changed' }, ctx()), { code: 'INVALID_CREDENTIALS' });
    const original = AuditLog.updateOne;
    AuditLog.updateOne = async () => { throw new Error('Temporary audit outage'); };
    try { await service.change(auth, { currentPassword: password, newPassword: password + 'changed' }, ctx()); }
    finally { AuditLog.updateOne = original; }
    assert.equal(await service.authenticate(signed.token, 'student'), null);
    const changed = await User.findById(auth.user._id);
    assert.ok(changed.auditOutbox.some(item => item.action === 'password_changed'));
    await service.flushAudit(changed);
    assert.equal((await User.findById(auth.user._id)).auditOutbox.length, 0);
    assert.ok((await service.login({ identifier: 'change@example.invalid', password: password + 'changed' }, ctx())).token);
  });
  await t.test('explicit bootstrap singleton, audit, staff email verification', async () => {
    await assert.rejects(service.bootstrap({ name: 'Owner', email: 'owner@example.invalid', password, allowed: false }), { code: 'BOOTSTRAP_DISABLED' });
    const result = await service.bootstrap({ name: 'Owner', email: 'owner@example.invalid', password, allowed: true });
    const code = mail.messages.at(-1).code;
    await service.activate({ challengeId: result.challengeId, otp: code }, ctx());
    await assert.rejects(service.bootstrap({ name: 'Owner 2', email: 'owner2@example.invalid', password, allowed: true }), { code: 'BOOTSTRAP_EXISTS' });
    const signed = await service.login({ identifier: 'owner@example.invalid', password, kind: 'admin' }, ctx());
    admin = await service.authenticate(signed.token, 'admin');
    assert.ok(admin); assert.ok(await AuditLog.exists({ action: 'super_admin_bootstrap' }));
  });
  await t.test('staff invitation, resend invalidation, acceptance once, email OTP and revoke', async () => {
    await assert.rejects(service.invite({ user: { roles: ['student'], permissions: [] } }, { email: 'bad@example.invalid' }, ctx()), { code: 'FORBIDDEN' });
    const invited = await service.invite(admin, { name: 'Staff', email: 'staff@example.invalid', permissions: ['institutions.read'] }, ctx());
    const first = mail.messages.at(-1);
    clock = new Date(clock.getTime() + config.auth.resendMs + 1);
    await service.invite(admin, { name: 'Staff', email: 'staff@example.invalid', permissions: ['institutions.read'] }, ctx());
    const second = mail.messages.at(-1);
    const proof = message => { const [challengeId, token] = message.link.split('#')[1].split('.'); return { challengeId, token, newPassword: password }; };
    await assert.rejects(service.accept(proof(first), ctx()), { code: 'INVALID_CHALLENGE' });
    const accepted = await service.accept(proof(second), ctx());
    await assert.rejects(service.accept(proof(second), ctx()), { code: 'INVALID_CHALLENGE' });
    await assert.rejects(service.login({ identifier: 'staff@example.invalid', password, kind: 'admin' }, ctx()), { code: 'INVALID_CREDENTIALS' });
    await service.activate({ challengeId: accepted.challengeId, otp: mail.messages.at(-1).code }, ctx());
    const staff = await service.login({ identifier: 'staff@example.invalid', password, kind: 'admin' }, ctx());
    assert.deepEqual(staff.permissions, ['institutions.read']);
    await service.logout(await service.authenticate(staff.token, 'admin'), ctx());
    assert.equal(await service.authenticate(staff.token, 'admin'), null);
    assert.ok(await AuditLog.exists({ action: 'staff_logout' }));
    const pending = await service.invite(admin, { name: 'Revoked', email: 'revoked@example.invalid' }, ctx());
    const revocable = proof(mail.messages.at(-1));
    await service.revokeInvitation(admin, pending.id, ctx());
    await service.revokeInvitation(admin, pending.id, ctx());
    await assert.rejects(service.accept(revocable, ctx()), { code: 'INVALID_CHALLENGE' });
    assert.ok(invited.id);
  });
  await t.test('concurrent first logins create only one active student session; expiry/status checks', async () => {
    const account = await service.register({ name: 'Race', email: 'race@example.invalid', password }, ctx());
    await service.activate({ challengeId: account.challengeId, otp: mail.messages.at(-1).code }, ctx());
    const results = await Promise.allSettled([service.login({ identifier: 'race@example.invalid', password }, ctx()), service.login({ identifier: 'race@example.invalid', password }, ctx())]);
    const successful = results.filter(x => x.status === 'fulfilled' && x.value.token);
    const authorized = await Promise.all(successful.map(x => service.authenticate(x.value.token, 'student')));
    assert.equal(authorized.filter(Boolean).length, 1);
    const signed = successful.find((x, index) => authorized[index]);
    await User.updateOne({ emailNormalized: 'race@example.invalid' }, { $set: { status: 'suspended' } });
    assert.equal(await service.authenticate(signed.value.token, 'student'), null);
    await assert.rejects(service.login({ identifier: 'race@example.invalid', password }, ctx()), { code: 'INVALID_CREDENTIALS' });
    await User.updateOne({ emailNormalized: 'race@example.invalid' }, { $set: { status: 'active' } });
    clock = new Date(clock.getTime() + config.auth.sessionMs + 1);
    assert.equal(await service.authenticate(signed.value.token, 'student'), null);
  });
  await t.test('distributed throttle persists and rejects further attempts', async () => {
    const key = randomUUID();
    await service.throttle('test', key, 2); await service.throttle('test', key, 2);
    await assert.rejects(service.throttle('test', key, 2), { code: 'RATE_LIMITED' });
    assert.ok(await AuthThrottle.countDocuments());
  });
});
