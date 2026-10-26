import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { RazorpayPaymentProvider, configuredProvider } from '../src/modules/commerce/payment-provider.js';
import { applicantInput } from '../src/modules/commerce/registration.js';
import { settingInput } from '../src/modules/publishing/validation.js';

test('credential gate: old/unapproved configuration and rotation flag alone cause zero network calls', async () => {
  let calls = 0; const config = { keyId: 'rzp_test_isolatedFixture', keySecret: 'isolated-fixture-secret', webhookSecret: 'isolated-fixture-webhook', mode: 'test', rotated: true };
  for (const provider of [new RazorpayPaymentProvider(config, { transport: () => { calls++; } }), await configuredProvider(config), new RazorpayPaymentProvider({ ...config, mode: 'live' }, { approved: true, transport: () => { calls++; } }), new RazorpayPaymentProvider({ ...config, keyId: 'rzp_live_isolatedFixture' }, { approved: true, transport: () => { calls++; } })]) {
    await assert.rejects(() => provider.createOrder({}), { code: 'PAYMENTS_UNAVAILABLE' });
    assert.throws(() => provider.verifyWebhook(Buffer.from('{}'), 'bad'), { code: 'PAYMENTS_UNAVAILABLE' });
  } assert.equal(calls, 0);
});
test('offline Razorpay HTTPS/signature contract uses exact stored-order HMAC, test configuration and no secret DTO', async () => {
  const config = { keyId: 'rzp_test_isolatedFixture', keySecret: 'isolated-fixture-secret', webhookSecret: 'isolated-fixture-webhook', mode: 'test', rotated: true }; let observed;
  const provider = new RazorpayPaymentProvider(config, { approved: true, transport: async (url, options) => { observed = { url, options }; return new Response(JSON.stringify({ id: 'order_fixture' })); } });
  await provider.createOrder({ reference: 'fixture', amountMinor: 123, currency: 'INR' });
  assert.equal(observed.url, 'https://api.razorpay.com/v1/orders'); assert.equal(JSON.parse(observed.options.body).amount, 123); assert.equal(JSON.parse(observed.options.body).partial_payment, false); assert.equal(observed.options.redirect, 'error');
  const sig = createHmac('sha256', config.keySecret).update('order_fixture|pay_fixture').digest('hex');
  assert.equal(provider.verifyCheckout('order_fixture', 'pay_fixture', sig), true); assert.equal(provider.verifyCheckout('order_other', 'pay_fixture', sig), false); assert.equal(provider.verifyCheckout('order_fixture', 'pay_fixture', '00'), false);
  const raw = Buffer.from('{ "event": "payment.captured" }'), webhook = createHmac('sha256', config.webhookSecret).update(raw).digest('hex'); assert.equal(provider.verifyWebhook(raw, webhook), true); assert.equal(provider.verifyWebhook(Buffer.from('{}'), webhook), false);
  assert.equal(JSON.stringify(provider.checkout({})).includes(config.keySecret), false);
});

test('read-only Test Mode authentication diagnostic cannot approve orders, signatures or fulfillment', async () => {
  let calls = 0;
  const config = { keyId: 'rzp_test_fixture', keySecret: 'synthetic-fixture-only', mode: 'test', rotated: false };
  const transport = async (url, options) => {
    calls++; assert.equal(url, 'https://api.razorpay.com/v1/orders?count=1');
    assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
    return new Response(JSON.stringify({ items: [] }));
  };
  const provider = new RazorpayPaymentProvider(config, { transport });
  assert.deepEqual(await provider.verifyTestAuthentication(), { authenticated: true, paymentMode: 'test', paymentsEnabled: false });
  await assert.rejects(provider.createOrder({}), { code: 'PAYMENTS_UNAVAILABLE' });
  assert.throws(() => provider.verifyCheckout('order_fixture', 'pay_fixture', 'a'.repeat(64)), { code: 'PAYMENTS_UNAVAILABLE' });
  for (const changes of [{ mode: 'live' }, { keyId: 'rzp_live_fixture' }, { keySecret: '' }]) await assert.rejects(new RazorpayPaymentProvider({ ...config, ...changes }, { transport }).verifyTestAuthentication());
  assert.equal(calls, 1);
});
test('registration and fee policy validation preserves safe fields while rejecting identity uploads, roles and financial invention', () => {
  const user = { emailNormalized: 'fixture@example.invalid' };
  assert.equal(applicantInput('study', { studentName: 'Fixture', email: user.emailNormalized }, user).studentName, 'Fixture');
  for (const data of [{ aadharNumber: 'not-collected' }, { roles: ['admin'] }, { passportPhotoFile: 'fake' }, { email: 'foreign@example.invalid' }]) assert.throws(() => applicantInput('study', data, user), { status: 422 });
  const fee = settingInput('registrationFees', { value: { study: { amountMinor: 900, approved: true } }, expectedRevision: 0 }); assert.equal(fee.value.study.amountMinor, 900);
  assert.throws(() => settingInput('registrationFees', { value: { study: { amountMinor: 900, approved: true, gst: 18 } }, expectedRevision: 0 }), { status: 422 });
});
