import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmailService } from '../src/modules/email/email.service.js';
import { runSmtpAcceptance } from '../scripts/verify-smtp.js';
import { silentLogger, testConfig } from './helpers.js';

const smtp = { host: 'smtp.gmail.com', port: 587, secure: false, user: 'owner@example.invalid', from: 'owner@example.invalid', fromName: 'kits education', appPassword: 'isolated-test-fixture-only' };

test('SMTP transport enforces STARTTLS, certificate validation, bounded timeouts and disabled protocol logging', () => {
  let options;
  const mail = createEmailService(smtp, silentLogger, { createTransport: value => { options = value; return {}; } });
  assert.equal(mail.configured, true);
  assert.equal(options.port, 587); assert.equal(options.secure, false); assert.equal(options.requireTLS, true);
  assert.deepEqual(options.tls, { minVersion: 'TLSv1.2', rejectUnauthorized: true });
  for (const flag of ['logger', 'debug']) assert.equal(options[flag], false);
  for (const flag of ['disableFileAccess', 'disableUrlAccess']) assert.equal(options[flag], true);
  assert.ok(options.connectionTimeout <= 10000 && options.greetingTimeout <= 10000 && options.socketTimeout <= 15000);
});

test('SMTP connection and all four templates report acceptance separately from inbox receipt', async () => {
  const messages = []; let verifies = 0;
  const mail = createEmailService(smtp, silentLogger, { transport: { verify: async () => { verifies++; return true; }, sendMail: async value => { messages.push(value); return { accepted: [value.to], rejected: [] }; } } });
  assert.deepEqual(await mail.verify(), { authenticated: true, inboxReceiptVerified: false });
  assert.equal(messages.length, 0); assert.equal(verifies, 1);
  for (const purpose of ['verify', 'reset', 'emailChange', 'invite']) await mail.send({ to: 'recipient@example.invalid', purpose, code: '123456', link: 'https://example.invalid/staff/accept#synthetic', ttlMinutes: 7 });
  assert.deepEqual(await mail.sendDiagnostic(smtp.from), { acceptedBySmtp: true, inboxReceiptVerified: false });
  for (const message of messages) { assert.deepEqual(message.from, { name: smtp.fromName, address: smtp.from }); assert.ok(message.subject); assert.ok(!JSON.stringify(message).includes(smtp.appPassword)); }
  assert.match(messages[2].subject, /email change/); assert.match(messages[0].text, /7 minutes/);
  assert.equal(messages[4].to, smtp.from); assert.ok(!messages[4].text.includes('123456'));
});

test('SMTP rejection, thrown credential errors and failed verification serialize safely', async () => {
  const events = [], logger = { error: (...args) => events.push(args) };
  for (const result of [{ accepted: [], rejected: [] }, { accepted: ['x'], rejected: ['y'] }, null]) {
    const mail = createEmailService(smtp, logger, { transport: { verify: async () => { throw Error(smtp.appPassword); }, sendMail: async () => { if (!result) throw Error(smtp.appPassword); return result; } } });
    await assert.rejects(mail.verify(), e => e.code === 'EMAIL_UNAVAILABLE' && !e.message.includes(smtp.appPassword));
    await assert.rejects(mail.sendDiagnostic(smtp.from), { code: 'EMAIL_UNAVAILABLE' });
  }
  assert.ok(!JSON.stringify(events).includes(smtp.appPassword));
  await assert.rejects(createEmailService({}, silentLogger).verify(), { code: 'EMAIL_UNAVAILABLE' });
});

test('Gmail config rejects implicit TLS/other ports and display-name header injection', async t => {
  const base = { SMTP_HOST: smtp.host, SMTP_USER: smtp.user, SMTP_APP_PASSWORD: smtp.appPassword, SMTP_FROM: smtp.from, SMTP_FROM_NAME: smtp.fromName };
  assert.equal((await testConfig(t, base)).smtp.fromName, smtp.fromName);
  for (const changes of [{ SMTP_PORT: '465', SMTP_SECURE: 'true' }, { SMTP_PORT: '25' }, { SMTP_FROM_NAME: 'Owner\r\nBcc: injected@example.invalid' }]) {
    await assert.rejects(testConfig(t, { ...base, ...changes }), { name: 'ConfigurationError' });
  }
});

test('SMTP operator command refuses missing confirmation/config before network and prevents repeated sends', async () => {
  let network = 0, sent = 0, reserved = false;
  const dependencies = { getConfig: () => ({ smtp }), makeMail: () => ({ verify: async () => { network++; return { authenticated: true, inboxReceiptVerified: false }; }, sendDiagnostic: async to => { assert.equal(to, smtp.from); sent++; return { acceptedBySmtp: true, inboxReceiptVerified: false }; } }), reserveSend: async () => { if (reserved) throw Error('Already reserved'); reserved = true; } };
  for (const args of [[], ['--verify'], ['--confirm-local-smtp-use'], ['--confirm-local-smtp-use', '--verify', '--send-test-to-self']]) await assert.rejects(runSmtpAcceptance(args, dependencies));
  assert.equal(network, 0);
  await assert.rejects(runSmtpAcceptance(['--confirm-local-smtp-use', '--verify'], { ...dependencies, getConfig: () => ({ smtp: { ...smtp, appPassword: '' } }) }));
  assert.equal(network, 0);
  const result = await runSmtpAcceptance(['--confirm-local-smtp-use', '--verify'], dependencies);
  assert.equal(result.messageSent, false); assert.equal(sent, 0);
  await runSmtpAcceptance(['--confirm-local-smtp-use', '--send-test-to-self'], dependencies);
  await assert.rejects(runSmtpAcceptance(['--confirm-local-smtp-use', '--send-test-to-self'], dependencies));
  assert.equal(sent, 1);
});
