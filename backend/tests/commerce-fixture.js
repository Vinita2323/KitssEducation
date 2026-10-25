import { randomUUID, createHmac } from 'node:crypto';
import { Readable } from 'node:stream';
import { publishingFixture, fakeCleanScanner, pdfBytes, imageBytes } from './publishing-fixture.js';
import { createCommerceModule } from '../src/modules/commerce/index.js';
import { createApp } from '../src/app.js';

export class FakePaymentProvider {
  constructor(scope = randomUUID()) { this.name = 'fake'; this.scope = scope; this.mode = 'test'; this.simulated = true; this.ready = true; this.orders = new Map(); this.payments = new Map(); this.creates = 0; }
  async createOrder(order) { this.creates++; const value = { id: 'order_' + randomUUID().replaceAll('-', ''), receipt: order.reference, amount: order.amountMinor, currency: 'INR', amount_paid: 0, amount_due: order.amountMinor, status: 'created', mode: 'test' }; this.orders.set(value.id, value); return value; }
  async getOrder(id) { return structuredClone(this.orders.get(id)); }
  async getPayment(id) { return structuredClone(this.payments.get(id)); }
  async findOrders(receipt) { return [...this.orders.values()].filter(o => o.receipt === receipt); }
  async listPayments(id) { return [...this.payments.values()].filter(p => p.order_id === id); }
  pay(orderId, status = 'captured', override = {}) { const order = this.orders.get(orderId); const payment = { id: 'pay_' + randomUUID().replaceAll('-', ''), order_id: orderId, amount: order.amount, currency: 'INR', status, captured: status === 'captured', created_at: Math.floor(Date.now() / 1000), mode: 'test', ...override }; this.payments.set(payment.id, payment); if (status === 'captured') Object.assign(order, { status: 'paid', amount_paid: order.amount, amount_due: 0 }); return payment; }
  sign(value) { return createHmac('sha256', 'isolated-fixture-signing-key').update(value).digest('hex'); }
  verifyCheckout(order, payment, signature) { return this.sign(order + '|' + payment) === signature; }
  verifyWebhook(raw, signature) { return this.sign(raw) === signature; }
  checkout(order) { return { keyId: 'rzp_test_isolatedFixture', providerOrderId: order.providerOrderId, amountMinor: order.amountMinor, currency: 'INR', paymentMode: 'test' }; }
}
export async function commerceFixture(dbName, options = {}) {
  const f = await publishingFixture(dbName, { scanner: options.actual ? undefined : fakeCleanScanner, actual: options.actual });
  const provider = options.provider ?? new FakePaymentProvider(dbName);
  let service; try { service = await createCommerceModule({ connection: f.connection, publishingModule: f, authService: f.auth, config: f.config, logger: f.logger, provider, hooks: options.hooks }); } catch (error) { if (!options.actual) await f.close(); else await f.connection.close(); throw error; }
  Object.assign(f.models, service.models);
  const app = () => createApp({ config: f.config, logger: f.logger, database: { isReady: async () => true }, storage: f.storage, authService: f.auth, institutionService: f.institutions, publishingModule: f, commerceService: service });
  const book = async (actor, label = 'STAGE6_ISOLATED_BOOK') => {
    const ctx = { ...f.ctx, actorId: actor.user.publicId }, asset = async (purpose, bytes, mime, originalName) => f.media.upload({ purpose, stream: Readable.from(bytes), mime, originalName, idempotencyKey: randomUUID(), auth: actor.auth, ctx });
    const cover = await asset('book_cover', await imageBytes(), 'image/png', 'fixture.png'), document = await asset('book_full', await pdfBytes(4), 'application/pdf', 'fixture.pdf');
    const language = await f.institutions.create('taxonomy', { kind: 'language', key: randomUUID(), label: 'STAGE6_TEST_LANGUAGE' }, ctx);
    let book = await f.publishing.create('books', { title: label, author: 'Generated isolated fixture', description: 'Synthetic test content only', category: 'Development fixture', languageId: language.id, priceMinor: 12345, pricingApproved: true, rightsConfirmed: true, rightsNote: 'Generated for isolated tests only', coverAssetId: cover.id, documentAssetId: document.id }, actor.auth, ctx);
    book = await f.publishing.publish('books', book.id, { expectedRevision: book.revision, publish: true }, actor.auth, ctx);
    return { ...book, documentAssetId: document.id };
  };
  return { ...f, service, provider, app, book };
}
