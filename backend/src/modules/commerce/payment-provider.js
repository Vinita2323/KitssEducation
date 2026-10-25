import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { backendRoot } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

const approvalFile = path.join(backendRoot, '.runtime', 'razorpay-test-approval.json');
export const unavailable = () => new AppError(503, 'PAYMENTS_UNAVAILABLE', 'Test payments require rotated credentials and operator validation');
export const fingerprint = config => createHash('sha256').update(JSON.stringify([config.keyId, config.keySecret, config.webhookSecret])).digest('hex');
const signature = (secret, input, supplied) => {
  if (!secret || typeof supplied !== 'string' || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(createHmac('sha256', secret).update(input).digest(), Buffer.from(supplied, 'hex'));
};

export class PaymentProvider {
  async createOrder() { throw unavailable(); }
  async getOrder() { throw unavailable(); }
  async getPayment() { throw unavailable(); }
  async listPayments() { throw unavailable(); }
  async findOrders() { throw unavailable(); }
}

// Only this adapter knows the provider protocol/credentials. No SDK is required.
export class RazorpayPaymentProvider extends PaymentProvider {
  constructor(config, { transport = fetch, approved = false } = {}) {
    super(); this.config = config; this.transport = transport;
    this.ready = approved && config.rotated === true && config.mode === 'test' && /^rzp_test_[A-Za-z0-9]+$/.test(config.keyId ?? '') && Boolean(config.keySecret && config.webhookSecret);
    this.name = 'razorpay'; this.mode = 'test'; this.simulated = false;
    this.scope = fingerprint(config);
  }
  assertReady() { if (!this.ready) throw unavailable(); }
  async request(endpoint, data) {
    this.assertReady();
    let response;
    try {
      response = await this.transport('https://api.razorpay.com/v1/' + endpoint, {
        method: data ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: 'Basic ' + Buffer.from(this.config.keyId + ':' + this.config.keySecret).toString('base64'), 'Content-Type': 'application/json' },
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
      if (!response.ok) throw new Error('Provider response');
      let size = 0; const chunks = [];
      for await (const chunk of response.body) { size += chunk.length; if (size > 1048576) throw new Error('Response limit'); chunks.push(chunk); }
      return JSON.parse(Buffer.concat(chunks).toString());
    } catch { throw new AppError(503, 'PROVIDER_UNCERTAIN', 'Provider verification unavailable; reconciliation required'); }
  }
  createOrder(order) { return this.request('orders', { amount: order.amountMinor, currency: order.currency, receipt: order.reference, partial_payment: false }); }
  getOrder(id) { return this.request('orders/' + providerId(id, 'order')); }
  getPayment(id) { return this.request('payments/' + providerId(id, 'pay')); }
  async listPayments(id) { return (await this.request('orders/' + providerId(id, 'order') + '/payments')).items; }
  // A receipt lookup may establish a positive binding. An empty result NEVER permits re-creation.
  async findOrders(receipt) { return (await this.request('orders?receipt=' + encodeURIComponent(receipt) + '&count=100')).items; }
  verifyCheckout(orderId, paymentId, supplied) { this.assertReady(); return signature(this.config.keySecret, orderId + '|' + paymentId, supplied); }
  verifyWebhook(raw, supplied) { this.assertReady(); return signature(this.config.webhookSecret, raw, supplied); }
  checkout(order) { this.assertReady(); return { keyId: this.config.keyId, providerOrderId: order.providerOrderId, amountMinor: order.amountMinor, currency: 'INR', paymentMode: 'test' }; }
}
export function providerId(value, prefix) {
  if (typeof value !== 'string' || !new RegExp('^' + prefix + '_[a-zA-Z0-9]{1,80}$').test(value)) throw new AppError(422, 'INVALID_INPUT', 'Invalid provider reference');
  return value;
}
export async function configuredProvider(config) {
  let approved = false;
  if (config.rotated === true) try {
    const record = JSON.parse(await readFile(approvalFile, 'utf8'));
    approved = record.fingerprint === fingerprint(config) && record.mode === 'test' && Date.now() - Date.parse(record.validatedAt) >= 0 && Date.now() - Date.parse(record.validatedAt) < 7 * 86400000;
  } catch { /* No operator validation: stay offline, including signature/webhook paths. */ }
  return new RazorpayPaymentProvider(config, { approved });
}
// CLI-only, deliberately not invoked by server startup. Operator must first rotate all secrets.
export async function approveRotatedTestCredentials(config) {
  const provider = new RazorpayPaymentProvider(config, { approved: true });
  provider.assertReady(); await provider.request('orders?count=1'); // read-only authentication check
  await mkdir(path.dirname(approvalFile), { recursive: true });
  await writeFile(approvalFile, JSON.stringify({ mode: 'test', fingerprint: fingerprint(config), validatedAt: new Date().toISOString() }), { mode: 0o600 });
}
