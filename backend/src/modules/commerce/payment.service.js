import { createHash, randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { id, key, object, revision, text, invalid } from '../publishing/validation.js';
import { providerId, unavailable } from './payment-provider.js';
import { applicantInput, documentRequirements, registrationBlocked, registrationFields } from './registration.js';
import { dashboardFilters } from './dashboard-filters.js';
import { retireLegacyIndexes } from '../../utils/legacy-indexes.js';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const missing = () => new AppError(404, 'NOT_FOUND', 'Order or application was not found');
const conflict = () => new AppError(409, 'COMMERCE_CONFLICT', 'Record changed or provider reference requires investigation');
const now = () => new Date();
const event = (action, ctx = {}) => ({ id: randomUUID(), action, actorId: ctx.actorId ?? 'system', requestId: ctx.requestId, at: now() });
const pageInput = query => {
  const page = Number(query.page ?? 1), pageSize = Number(query.pageSize ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw invalid('Invalid pagination');
  return { page, pageSize };
};
export const orderDTO = order => ({
  id: String(order._id), reference: order.reference, product: { kind: order.product.kind, id: String(order.product.id), title: order.product.title, purchaseSlot: order.product.purchaseSlot, revision: order.product.revision, ...(order.product.courseId ? { courseId: String(order.product.courseId) } : {}) },
  amountMinor: order.amountMinor, currency: order.currency, paymentMode: order.paymentMode, simulated: order.simulated,
  orderStatus: order.status, paymentStatus: order.status === 'captured' ? 'captured' : order.attempts.at(-1)?.status ?? order.status, activationStatus: order.fulfillment.state, revision: order.revision,
  providerOrderId: order.providerOrderId, capturedPaymentId: order.capturedPaymentId, attempts: order.attempts,
  creationStatus: order.creation.state, attemptId: order.creation.key, reconciliation: { state: order.reconcile.state, attempts: order.reconcile.attempts, lastError: order.reconcile.lastError },
  investigation: order.investigation, createdAt: order.createdAt, updatedAt: order.updatedAt, expiresAt: order.expiresAt,
  receiptAvailable: order.status === 'captured', invoiceAvailable: false, refundRequest: order.refundRequest ?? null,
});

export class PaymentService {
  constructor({ models, publishingModule, authService, provider, logger, hooks = {} }) {
    Object.assign(this, { models, publishingModule, authService, provider, logger, hooks });
  }
  async initialize() {
    for (const Model of Object.values(this.models)) await Model.createIndexes();
    // Install replacement constraints before removing only known obsolete indexes.
    // No records are changed; repurchases/free grants need these precise refinements.
    await retireLegacyIndexes(this.models.Order, [
      ['userId_1_product.kind_1_product.id_1', { userId: 1, 'product.kind': 1, 'product.id': 1 }],
      ['userId_1_product.courseId_1', { userId: 1, 'product.courseId': 1 }, [undefined, { 'product.kind': 'course_plan' }]],
    ]);
    await retireLegacyIndexes(this.models.BookEntitlement, [['orderId_1', { orderId: 1 }]]);
  }
  async owned(value, auth) {
    const order = await this.models.Order.findOne({ _id: id(value), userId: auth.user._id });
    if (!order) throw missing();
    if (order.fulfillment.state === 'applied' && !(['franchise_joining','franchise_renewal'].includes(order.product.kind) ? await this.franchise?.hasEffect(order) : order.product.kind === 'registration_fee' ? await this.models.RegistrationApplication.exists({ _id: order.product.id, orderId: order._id, paymentState: 'verified' }) : order.product.kind === 'course_plan' ? await this.learning?.hasEffect(order) : await this.models.BookEntitlement.exists({ orderId: order._id, userId: order.userId, bookId: order.product.id, revokedAt: null }))) order.fulfillment.state = 'pending';
    return order;
  }
  eligible(auth) { if (!auth?.user?.emailVerifiedAt || auth.user.status !== 'active') throw new AppError(403, 'INELIGIBLE_ACCOUNT', 'A verified active account is required'); }
  async flush(Model, doc) {
    for (const item of doc.auditOutbox ?? []) try {
      await this.authService.models.AuditLog.updateOne({ _id: item.id }, { $setOnInsert: { action: item.action, actorId: item.actorId, requestId: item.requestId, subjectId: String(doc._id), at: item.at } }, { upsert: true, writeConcern: { w: 1, j: true } });
      await Model.updateOne({ _id: doc._id }, { $pull: { auditOutbox: { id: item.id } } });
    } catch { this.logger.error({ event: 'commerce_audit_pending' }, 'Commerce audit will retry'); break; }
  }
  async change(orderId, action, mutate, ctx) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const current = await this.models.Order.findById(orderId); if (!current) throw missing();
      if (current.auditOutbox.length >= 999) throw new AppError(503, 'AUDIT_BACKLOG', 'Commerce audit requires recovery');
      const fields = mutate(current); if (!fields) return current;
      try {
        const result = await this.models.Order.findOneAndUpdate({ _id: current._id, revision: current.revision }, { $set: fields, $inc: { revision: 1 }, $push: { auditOutbox: event(action, ctx) } }, { returnDocument: 'after', runValidators: true });
        if (result) { await this.flush(this.models.Order, result); return result; }
      } catch (error) { if (error.code === 11000) throw conflict(); throw error; }
    } throw conflict();
  }
  async resolve(product, auth) {
    object(product, ['kind', 'id'], ['kind', 'id']);
    if (['franchise_joining','franchise_renewal'].includes(product.kind) && this.franchise) return this.franchise.quote(product.id, product.kind, auth);
    if (product.kind === 'registration_fee') return this.business.registrationQuote(product.id, auth);
    if (product.kind === 'course_plan' && this.learning) return this.learning.resolvePlan(product.id, auth);
    if (product.kind !== 'book') throw new AppError(409, 'PRODUCT_NOT_ENABLED', 'Registration and coaching charges require approved eligibility, documents, plans and renewal rules');
    const book = await this.publishingModule.models.Book.findById(id(product.id)).lean(), data = book?.publishedSnapshot;
    if (book?.status !== 'published' || !data?.rightsConfirmed || !data.rightsNote || !data.pricingApproved || !Number.isSafeInteger(data.priceMinor) || data.priceMinor <= 0 || data.currency !== 'INR') throw new AppError(409, 'PRODUCT_NOT_PURCHASABLE', 'Published licensed content and an approved positive price are required');
    const media = await this.publishingModule.models.MediaAsset.findOne({ _id: data.documentAssetId, purpose: 'book_full', status: 'ready', 'scan.status': 'clean' });
    if (!media) throw new AppError(409, 'PRODUCT_NOT_PURCHASABLE', 'Secure licensed book delivery is not ready');
    return { product: { kind: 'book', id: book._id, title: data.title, revision: data.revision, documentAssetId: data.documentAssetId }, amountMinor: data.priceMinor, currency: 'INR' };
  }
  async create(input, auth, ctx) {
    this.eligible(auth); object(input, ['product', 'applicationId', 'idempotencyKey'], ['product', 'idempotencyKey']); key(input.idempotencyKey);
    if (input.applicationId && (input.product?.kind !== 'registration_fee' || String(input.applicationId) !== String(input.product.id))) throw invalid('Application must match the registration fee product');
    object(input.product, ['kind', 'id'], ['kind', 'id']);
    const canonical = { kind: text(input.product.kind, 40), id: String(id(input.product.id)) }, requestHash = hash(canonical);
    await this.authService.limit(ctx, String(auth.user._id), 'order-create', 30);
    const prior = await this.models.Order.findOne({ userId: auth.user._id, idempotencyKey: input.idempotencyKey });
    if (prior) { if (prior.requestHash !== requestHash) throw conflict(); return orderDTO(prior); }
    return this.publishingModule.coordination.run(async () => {
      const quote = await this.resolve(canonical, auth);
      try {
        const doc = await this.models.Order.create({ ...quote, reference: 'K6-' + randomUUID().replaceAll('-', ''), userId: auth.user._id, idempotencyKey: input.idempotencyKey, requestHash, provider: this.provider.name, paymentMode: 'test', providerScope: this.provider.scope, simulated: this.provider.simulated, expiresAt: new Date(Date.now() + 86400000), auditOutbox: [event('order_created', ctx)] });
        await this.flush(this.models.Order, doc); return orderDTO(doc);
      } catch (error) {
        if (error.code !== 11000) throw error;
        const replay = await this.models.Order.findOne({ userId: auth.user._id, idempotencyKey: input.idempotencyKey, requestHash });
        if (replay) return orderDTO(replay); throw new AppError(409, 'EXISTING_PRODUCT_ORDER', 'An order already exists for this product or course; resume it from order history');
      }
    });
  }
  providerFor(order) {
    if (!this.provider.ready) throw unavailable();
    const unstarted = order.creation.state === 'pending' && !order.providerOrderId && order.status === 'pending' && order.paymentReferences.length === 0;
    if (order.providerScope !== this.provider.scope && !unstarted || order.provider !== this.provider.name || order.paymentMode !== 'test' || order.simulated !== this.provider.simulated) throw new AppError(409, 'PROVIDER_SCOPE_MISMATCH', 'Order belongs to another verified provider configuration; investigate');
    return this.provider;
  }
  checkout(order) { return { ...orderDTO(order), checkout: order.status !== 'captured' && order.creation.state === 'ready' && this.provider.ready ? { ...this.provider.checkout(order), attemptId: order.creation.key, simulated: order.simulated } : null }; }
  validProviderOrder(order, remote) {
    if (!remote || remote.id !== order.providerOrderId && order.providerOrderId || remote.receipt !== order.reference || remote.amount !== order.amountMinor || remote.currency !== order.currency || remote.partial_payment === true || remote.mode && remote.mode !== 'test') throw new AppError(409, 'PROVIDER_EVIDENCE_MISMATCH', 'Provider order evidence does not match the immutable order');
    providerId(remote.id, 'order');
  }
  async startAttempt(value, input, auth, ctx) {
    object(input, ['idempotencyKey'], ['idempotencyKey']); key(input.idempotencyKey);
    let order = await this.owned(value, auth); const provider = this.providerFor(order);
    await this.authService.limit(ctx, String(auth.user._id), 'payment-attempt', 30);
    if (order.creation.key && order.creation.key !== input.idempotencyKey) throw new AppError(409, 'EXISTING_PAYMENT_ATTEMPT', 'Resume the existing payment attempt; do not create a second provider order');
    if (order.status === 'captured' || order.creation.state === 'ready') return this.checkout(order);
    if (order.creation.state !== 'pending') return this.checkout(order);
    if (order.expiresAt < now()) throw new AppError(409, 'ORDER_EXPIRED', 'This unstarted order expired; contact support');
    // This CAS persists intent before any network call. A lost response/crash never authorizes another create call.
    const claimed = await this.models.Order.findOneAndUpdate({ _id: order._id, 'creation.state': 'pending', revision: order.revision }, { $set: { providerScope: provider.scope, creation: { state: 'creating', key: input.idempotencyKey, startedAt: now() } }, $inc: { revision: 1 }, $push: { auditOutbox: event('provider_order_intent', ctx) } }, { returnDocument: 'after' });
    if (!claimed) return this.checkout(await this.owned(value, auth));
    await this.flush(this.models.Order, claimed);
    await this.hooks.beforeProviderCreate?.(claimed);
    try {
      const remote = await provider.createOrder(claimed);
      await this.hooks.afterProviderCreate?.(claimed, remote);
      this.validProviderOrder(claimed, remote);
      order = await this.change(order._id, 'provider_order_bound', current => current.providerOrderId ? null : { providerOrderId: remote.id, 'creation.state': 'ready', 'reconcile.state': 'pending', 'reconcile.nextAt': now(), 'reconcile.attempts': 0 }, ctx);
    } catch (error) {
      await this.change(order._id, 'provider_order_uncertain', current => current.providerOrderId ? null : { 'creation.state': 'unknown', 'reconcile.state': 'pending', 'reconcile.nextAt': now(), investigation: 'PROVIDER_CREATE_UNCERTAIN' }, ctx);
      throw error instanceof AppError ? error : new AppError(503, 'PROVIDER_UNCERTAIN', 'Provider creation interrupted; do not retry creation. Reconciliation is pending.');
    }
    return this.checkout(order);
  }
  async verify(input, auth, ctx) {
    object(input, ['orderId', 'attemptId', 'razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature'], ['orderId', 'attemptId', 'razorpay_payment_id', 'razorpay_order_id', 'razorpay_signature']);
    const order = await this.owned(input.orderId, auth), provider = this.providerFor(order);
    await this.authService.limit(ctx, String(auth.user._id), 'payment-verify', 60);
    if (input.attemptId !== order.creation.key || input.razorpay_order_id !== order.providerOrderId || !provider.verifyCheckout(order.providerOrderId, providerId(input.razorpay_payment_id, 'pay'), input.razorpay_signature)) throw new AppError(400, 'INVALID_PAYMENT_SIGNATURE', 'Payment verification failed');
    await this.observe(order._id, input.razorpay_payment_id, 'checkout', ctx);
    return orderDTO(await this.owned(input.orderId, auth));
  }
  async observe(orderId, paymentId, source, ctx) {
    let order = await this.models.Order.findById(orderId); const provider = this.providerFor(order);
    const [remote, payment] = await Promise.all([provider.getOrder(order.providerOrderId), provider.getPayment(providerId(paymentId, 'pay'))]);
    this.validProviderOrder(order, remote);
    if (payment.id !== paymentId || payment.order_id !== order.providerOrderId || payment.amount !== order.amountMinor || payment.currency !== 'INR' || payment.mode && payment.mode !== 'test' || !['created', 'authorized', 'captured', 'failed'].includes(payment.status)) throw new AppError(409, 'PROVIDER_EVIDENCE_MISMATCH', 'Payment evidence does not match the immutable order');
    const captured = payment.status === 'captured' && payment.captured === true;
    if (payment.status === 'captured' && (!captured || remote.status !== 'paid' || remote.amount_paid !== order.amountMinor || remote.amount_due !== 0)) throw new AppError(409, 'CAPTURE_NOT_VERIFIED', 'Provider capture is not fully verified');
    order = await this.change(orderId, 'payment_observed_' + payment.status, current => {
      if (current.paymentReferences.length >= 100 && !current.paymentReferences.includes(paymentId)) throw new AppError(409, 'PAYMENT_HISTORY_LIMIT', 'Payment history requires operator investigation');
      const previousAttempt = current.attempts.find(a => a.paymentId === paymentId);
      const observation = previousAttempt?.status === 'captured' ? previousAttempt.toObject?.() ?? previousAttempt : { paymentId, status: payment.status, observedAt: now(), source };
      const fields = { paymentReferences: [...new Set([...current.paymentReferences, paymentId])], attempts: [...current.attempts.filter(a => a.paymentId !== paymentId), observation] };
      if (current.status === 'captured') {
        if (captured && current.capturedPaymentId !== paymentId) fields.investigation = 'MULTIPLE_CAPTURED_PAYMENTS';
        // Stale failure/authorization observations never alter authoritative capture.
        return fields;
      }
      if (captured) Object.assign(fields, { status: 'captured', capturedPaymentId: paymentId, capturedAt: now(), evidence: { source, verifiedAt: now(), providerCreatedAt: payment.created_at }, 'fulfillment.state': 'pending', 'reconcile.state': 'pending', 'reconcile.nextAt': now() });
      else if (payment.status === 'authorized') fields.status = 'authorized';
      return fields;
    }, ctx);
    await this.hooks.afterCaptureCommit?.(order);
    if (order.status === 'captured') await this.fulfill(order._id);
    return order;
  }
  async fulfill(orderId) {
    const order = await this.models.Order.findById(orderId);
    if (!order || order.status !== 'captured') return;
    if (['franchise_joining','franchise_renewal'].includes(order.product.kind) && this.franchise) {
      const effect = await this.franchise.fulfill(order);
      await this.change(orderId, 'fulfillment_applied', current => current.fulfillment.state === 'applied' ? null : { 'fulfillment.state': 'applied', 'fulfillment.effectId': effect._id, 'fulfillment.appliedAt': now() });
      return;
    }
    if (order.product.kind === 'registration_fee') {
      const effect = await this.business.fulfillRegistration(order);
      await this.change(orderId, 'registration_fee_applied', current => current.fulfillment.state === 'applied' ? null : { 'fulfillment.state': 'applied', 'fulfillment.effectId': effect._id, 'fulfillment.appliedAt': now() });
      return;
    }
    if (order.product.kind === 'course_plan' && this.learning) {
      await this.hooks.beforeEntitlement?.(order);
      const effect = await this.learning.fulfill(order);
      await this.hooks.afterEntitlement?.(order, effect);
      await this.change(orderId, 'fulfillment_applied', current => current.fulfillment.state === 'applied' && String(current.fulfillment.effectId) === String(effect._id) ? null : { 'fulfillment.state': 'applied', 'fulfillment.effectId': effect._id, 'fulfillment.appliedAt': now() });
      return;
    }
    if (order.product.kind !== 'book') throw new AppError(409, 'FULFILLMENT_POLICY_PENDING', 'Product activation policy is not enabled');
    const user = await this.authService.models.User.findById(order.userId);
    if (!user || user.status !== 'active' || !user.emailVerifiedAt) throw new AppError(409, 'FULFILLMENT_ACCOUNT_BLOCKED', 'Account requires investigation');
    // Recheck delivery/license operational gate; payment cannot bypass Stage 5.
    const book = await this.publishingModule.models.Book.findById(order.product.id).lean();
    const delivery = book?.publishedSnapshot;
    // A paid order is delivered even if the book went off sale after checkout started.
    if (!delivery?.rightsConfirmed || !delivery.rightsNote || !await this.publishingModule.models.MediaAsset.exists({ _id: delivery.documentAssetId, purpose: 'book_full', status: 'ready', 'scan.status': 'clean' })) throw new AppError(409, 'FULFILLMENT_DELIVERY_BLOCKED', 'Licensed secure delivery must be available before activation');
    await this.hooks.beforeEntitlement?.(order);
    let effect;
    try {
      effect = await this.models.BookEntitlement.findOneAndUpdate({ userId: order.userId, bookId: order.product.id, orderId: order._id }, { $setOnInsert: { source: 'purchase', grantedAt: now(), simulated: order.simulated } }, { upsert: true, returnDocument: 'after', runValidators: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      // A competing fulfillment may have committed the exact same unique effect.
      // Reuse only that owner/book/source-order binding; unrelated rights remain
      // an investigation case and must never be overwritten or relabelled paid.
      effect = await this.models.BookEntitlement.findOne({ userId: order.userId, bookId: order.product.id, orderId: order._id, source: 'purchase', simulated: order.simulated });
      if (!effect) throw new AppError(409, 'ENTITLEMENT_CONFLICT', 'Existing entitlement requires investigation');
    }
    if (effect.revokedAt) throw new AppError(409, 'ENTITLEMENT_REVOKED', 'A revoked entitlement cannot be recreated by reconciliation');
    await this.hooks.afterEntitlement?.(order, effect);
    await this.change(orderId, 'fulfillment_applied', current => current.fulfillment.state === 'applied' && String(current.fulfillment.effectId) === String(effect._id) ? null : { 'fulfillment.state': 'applied', 'fulfillment.effectId': effect._id, 'fulfillment.appliedAt': now() });
  }
  async canReadAsset(asset, auth) {
    if (!auth || auth.user.status !== 'active' || !auth.user.emailVerifiedAt || asset.purpose !== 'book_full' || asset.status !== 'ready' || asset.scan.status !== 'clean') return false;
    // Any status: a book taken off sale or removed keeps its last snapshot so existing owners keep reading it.
    const books = await this.publishingModule.models.Book.find({ 'publishedSnapshot.documentAssetId': String(asset._id), 'publishedSnapshot.rightsConfirmed': true }).select('_id publishedSnapshot').lean();
    for (const book of books) {
      if (!book.publishedSnapshot?.rightsNote) continue;
      const entitlement = await this.models.BookEntitlement.findOne({ userId: auth.user._id, bookId: book._id, revokedAt: null });
      if (!entitlement) continue;
      // Free claims are only granted while the published price is zero; a later price change keeps them.
      if (entitlement.source === 'free') return true;
      if (entitlement.source === 'manual' && await this.business.manualValid(entitlement)) return true;
      if (await this.models.Order.exists({ _id: entitlement.orderId, userId: auth.user._id, 'product.id': book._id, status: 'captured', simulated: entitlement.simulated, capturedPaymentId: { $type: 'string' } })) return true;
    } return false;
  }
  async ownerCounts(ids) {
    const rows = await this.models.BookEntitlement.aggregate([{ $match: { bookId: { $in: ids }, revokedAt: null } }, { $group: { _id: '$bookId', users: { $addToSet: '$userId' } } }]);
    return Object.fromEntries(rows.map(r => [String(r._id), r.users.length]));
  }
  async ownedBooks(auth) {
    const rows = await this.models.BookEntitlement.find({ userId: auth.user._id, revokedAt: null }).lean(), result = [];
    for (const row of rows) {
      const book = await this.publishingModule.models.Book.findById(row.bookId).lean();
      const asset = book?.publishedSnapshot?.documentAssetId && await this.publishingModule.models.MediaAsset.findById(book.publishedSnapshot.documentAssetId);
      // Display details come from the owner's snapshot so off-sale books still render in the library.
      if (asset && await this.canReadAsset(asset, auth)) result.push({ ...this.publishingModule.publishing.publicData('books', book), onSale: book.status === 'published', id: String(row.bookId), title: book.publishedSnapshot.title, canReadFull: true, contentUrl: '/api/v1/media/' + asset._id + '/content', simulated: row.simulated, readingState: this.learning && Number.isSafeInteger(asset.pageCount) && asset.pageCount > 0 ? await this.learning.bookState(String(row.bookId),auth) : null });
    } return result;
  }
  async receipt(value, auth) {
    const doc = await this.owned(value, auth); if (doc.status !== 'captured') throw new AppError(409, 'RECEIPT_PENDING', 'Receipt requires verified capture');
    return { type: 'payment_receipt', label: doc.simulated ? 'SIMULATED TEST RECEIPT - NOT A TAX INVOICE' : 'RAZORPAY TEST MODE RECEIPT - NOT A TAX INVOICE', order: orderDTO(doc), capturedAt: doc.capturedAt, officialTaxInvoice: false, invoiceDraft: await this.business.invoiceDraft(doc, auth) };
  }
  async list(query, auth, admin = false) {
    object(query, ['page', 'pageSize', 'status', 'type', 'sort', 'fulfillment', 'reconciliation']); const { page, pageSize } = pageInput(query);
    const filter = admin ? {} : { userId: auth.user._id };
    if (query.status) { if (!['pending', 'authorized', 'captured', 'failed'].includes(query.status)) throw invalid('Invalid payment state'); if (query.status === 'failed') { filter.status = { $ne: 'captured' }; filter.$expr = { $eq: [{ $arrayElemAt: ['$attempts.status', -1] }, 'failed'] }; } else filter.status = query.status; }
    if (query.type) { if (!['book','course_plan','registration_fee','franchise_joining','franchise_renewal'].includes(query.type)) throw invalid('Unsupported product'); filter['product.kind'] = query.type; }
    if (query.fulfillment) { if (!['pending', 'applied', 'blocked'].includes(query.fulfillment)) throw invalid('Invalid fulfillment state'); filter['fulfillment.state'] = query.fulfillment; }
    if (query.reconciliation) { if (!['pending', 'leased', 'dead', 'done'].includes(query.reconciliation)) throw invalid('Invalid reconciliation state'); filter['reconcile.state'] = query.reconciliation; }
    if (query.sort && query.sort !== 'newest') throw invalid('Unsupported sort');
    const total = await this.models.Order.countDocuments(filter);
    return { data: (await this.models.Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize)).map(orderDTO), meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  }
  async summary(query = {}) {
    const f = dashboardFilters(query), Order = this.models.Order, mode = this.provider.mode ?? 'test';
    const within = field => f.active ? { [field]: f.range } : {};
    // Only the configured payment environment counts, so test orders never mix into live totals.
    const env = { paymentMode: mode }, paid = { ...env, status: 'captured', ...within('capturedAt') };
    const [[collected], byProduct, unpaidCheckouts, failedPayments, needsAction, pendingRefunds, recent] = await Promise.all([
      Order.aggregate([{ $match: paid }, { $group: { _id: null, amountMinor: { $sum: '$amountMinor' }, orders: { $sum: 1 }, buyers: { $addToSet: '$userId' } } }, { $project: { _id: 0, amountMinor: 1, orders: 1, buyers: { $size: '$buyers' } } }]).option({ maxTimeMS: 10000 }),
      Order.aggregate([{ $match: paid }, { $group: { _id: '$product.kind', amountMinor: { $sum: '$amountMinor' }, orders: { $sum: 1 } } }, { $sort: { amountMinor: -1, _id: 1 } }, { $project: { _id: 0, kind: '$_id', amountMinor: 1, orders: 1 } }]).option({ maxTimeMS: 10000 }),
      Order.countDocuments({ ...env, status: { $ne: 'captured' }, ...within('createdAt') }),
      Order.countDocuments({ ...env, status: { $ne: 'captured' }, attempts: { $elemMatch: { status: 'failed', ...within('observedAt') } } }),
      // Lifetime: a paid order whose access was blocked, or whose payment check gave up, always needs staff.
      Order.countDocuments({ ...env, $or: [{ 'reconcile.state': 'dead' }, { status: 'captured', 'fulfillment.state': 'blocked' }] }),
      Order.countDocuments({ ...env, 'refundRequest.status': 'pending' }),
      Order.find(env).sort({ createdAt: -1, _id: -1 }).limit(6).lean()
    ]);
    const names = new Map((await this.authService.models.User.find({ _id: { $in: recent.map(o => o.userId) } }).select('name').lean()).map(u => [String(u._id), u.name]));
    const recentOrders = recent.map(o => ({ id: String(o._id), reference: o.reference, title: o.product.title, kind: o.product.kind, amountMinor: o.amountMinor, createdAt: o.createdAt, studentName: names.get(String(o.userId)) ?? null,
      status: o.status === 'captured' ? 'paid' : o.attempts?.at(-1)?.status === 'failed' ? 'failed' : 'unpaid' }));
    return { currency: 'INR', environment: { mode, simulated: Boolean(this.provider.simulated) }, period: f.public,
      collected: collected ?? { amountMinor: 0, orders: 0, buyers: 0 }, byProduct, unpaidCheckouts, failedPayments, needsAction, pendingRefunds, recentOrders };
  }
  async receiveWebhook(raw, signature, eventId) {
    const provider = this.provider; if (!provider.ready) throw unavailable();
    if (!provider.verifyWebhook(raw, signature)) throw new AppError(400, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook verification failed');
    if (typeof eventId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(eventId)) throw invalid('Webhook event identity required');
    let payload; try { payload = JSON.parse(raw.toString()); } catch { throw invalid('Invalid webhook JSON'); }
    if (!['payment.captured', 'payment.authorized', 'payment.failed', 'order.paid'].includes(payload.event)) throw invalid('Unsupported payment event');
    const entity = payload.payload?.payment?.entity; if (!entity) throw invalid('Payment entity required');
    const paymentId = providerId(entity.id, 'pay'), providerOrderId = providerId(entity.order_id, 'order'), requestHash = createHash('sha256').update(raw).digest('hex');
    const jobKey = `${provider.name}:test:${provider.scope}:${eventId}`;
    try { await this.models.Job.create({ key: jobKey, kind: 'payment_event', requestHash, provider: provider.name, scope: provider.scope, paymentId, providerOrderId }); }
    catch (error) {
      if (error.code !== 11000) throw new AppError(503, 'WEBHOOK_PERSISTENCE_FAILED', 'Retry webhook delivery');
      const old = await this.models.Job.findOne({ key: jobKey }); if (old.requestHash !== requestHash) throw conflict();
    }
    await this.hooks.afterWebhookReceipt?.();
    return { received: true }; // Durable receipt only; capture is verified asynchronously through authenticated provider reads.
  }
  async reconcile(value, ctx) {
    object(value, ['id'], ['id']);
    const order = await this.models.Order.findById(id(value.id)); if (!order) throw missing();
    await this.change(order._id, 'admin_reconciliation_requested', current => ({ 'reconcile.state': current.reconcile.state === 'leased' && current.reconcile.leaseUntil > now() ? 'leased' : 'pending', 'reconcile.nextAt': now(), 'reconcile.attempts': 0 }), ctx);
    return orderDTO(await this.models.Order.findById(order._id));
  }
  async processOrder(order) {
    const provider = this.providerFor(order);
    if (!order.providerOrderId && ['creating', 'unknown'].includes(order.creation.state)) {
      if (order.creation.startedAt && Date.now() - order.creation.startedAt.getTime() < 60000) throw new AppError(503, 'PROVIDER_CREATE_IN_FLIGHT', 'Waiting for external operation');
      const matches = (await provider.findOrders(order.reference)).filter(r => r.receipt === order.reference);
      if (matches.length !== 1) throw new AppError(409, 'PROVIDER_CREATE_UNRESOLVED', 'Uncertain provider creation requires investigation; never blindly create again');
      this.validProviderOrder(order, matches[0]);
      order = await this.change(order._id, 'provider_order_recovered', current => current.providerOrderId ? null : { providerOrderId: matches[0].id, 'creation.state': 'ready', investigation: null });
    }
    if (order.status === 'captured') { await this.fulfill(order._id); return; }
    if (!order.providerOrderId) throw new AppError(503, 'CHECKOUT_NOT_STARTED', 'No provider operation has been started');
    const payments = await provider.listPayments(order.providerOrderId);
    if (!Array.isArray(payments) || payments.length > 100) throw new AppError(409, 'PROVIDER_HISTORY_INVALID', 'Provider history requires investigation');
    for (const payment of payments) await this.observe(order._id, providerId(payment.id, 'pay'), 'reconciliation');
    await this.hooks.duringReconciliation?.(order);
    const current = await this.models.Order.findById(order._id);
    if (current.status !== 'captured') throw new AppError(503, 'PAYMENT_PENDING', 'Capture not yet verified');
  }
  async retry(Model, doc, prefix, error) {
    const attempts = prefix ? doc.reconcile.attempts : doc.attempts;
    const state = attempts >= 8 ? 'dead' : 'pending', next = new Date(Date.now() + Math.min(3600000, 1000 * 2 ** attempts));
    const fields = prefix ? { 'reconcile.state': state, 'reconcile.nextAt': next, 'reconcile.lastError': error instanceof AppError ? error.code : 'PROCESSING_UNAVAILABLE', 'reconcile.leaseUntil': null } : { state, availableAt: next, lastError: error instanceof AppError ? error.code : 'PROCESSING_UNAVAILABLE', leaseUntil: null };
    if (state === 'dead') this.logger.warn({ event: 'commerce_dead_letter', kind: prefix ? 'order' : 'payment_event', recordId: String(doc._id), code: error instanceof AppError ? error.code : 'PROCESSING_UNAVAILABLE' }, 'Commerce requires operator investigation');
    await Model.updateOne({ _id: doc._id, [prefix ? 'reconcile.token' : 'token']: prefix ? doc.reconcile.token : doc.token }, { $set: fields });
  }
  async tick() {
    try { await this.franchise?.maintenance(); } catch { this.logger.error({ event: 'franchise_maintenance_pending' }, 'Franchise maintenance will retry'); }
    const { Order, Job } = this.models;
    for (let n = 0; n < 20; n++) {
      const token = randomUUID();
      const job = await Job.findOneAndUpdate({ kind: 'payment_event', $or: [{ state: 'pending', availableAt: { $lte: now() } }, { state: 'leased', leaseUntil: { $lte: now() } }] }, { $set: { state: 'leased', token, leaseUntil: new Date(Date.now() + 60000) }, $inc: { attempts: 1 } }, { returnDocument: 'after', sort: { availableAt: 1 } });
      if (!job) break;
      try {
        if (job.scope !== this.provider.scope || job.provider !== this.provider.name) throw new AppError(409, 'PROVIDER_SCOPE_MISMATCH', 'Event belongs to another provider configuration');
        const order = await Order.findOne({ providerOrderId: job.providerOrderId, providerScope: job.scope }); if (!order) throw new AppError(503, 'WEBHOOK_ORDER_PENDING', 'Order binding not yet available');
        await this.observe(order._id, job.paymentId, 'webhook');
        await Job.updateOne({ _id: job._id, token }, { $set: { state: 'done', leaseUntil: null } });
      } catch (error) { await this.retry(Job, job, false, error); }
    }
    for (let n = 0; n < 20; n++) {
      const token = randomUUID();
      const order = await Order.findOneAndUpdate({ 'creation.state': { $ne: 'pending' }, $or: [{ 'reconcile.state': 'pending', 'reconcile.nextAt': { $lte: now() } }, { 'reconcile.state': 'leased', 'reconcile.leaseUntil': { $lte: now() } }] }, { $set: { 'reconcile.state': 'leased', 'reconcile.token': token, 'reconcile.leaseUntil': new Date(Date.now() + 60000) }, $inc: { 'reconcile.attempts': 1 } }, { returnDocument: 'after', sort: { 'reconcile.nextAt': 1 } });
      if (!order) break;
      try { await this.processOrder(order); await Order.updateOne({ _id: order._id, 'reconcile.token': token }, { $set: { 'reconcile.state': 'done', 'reconcile.leaseUntil': null, 'reconcile.lastError': null } }); }
      catch (error) { await this.retry(Order, order, true, error); }
    }
    for (const Model of [Order, this.models.RegistrationApplication, this.models.AccessRequest, this.models.BookEntitlement]) for await (const doc of Model.find({ 'auditOutbox.0': { $exists: true } }).cursor()) await this.flush(Model, doc);
  }
  async registrationConfig() {
    const legacyFees = await this.publishingModule.models.SiteSettings.findOne({ key: 'registrationFees' }).lean();
    const settings = await this.business.settings(), policies = settings.value?.registrations ?? {};
    const enabled = {}, unavailableReasons = {};
    for (const kind of Object.keys(registrationFields)) { try { await this.business.policy(kind); enabled[kind] = true; } catch (e) { if (e.status !== 409) throw e; enabled[kind] = false; unavailableReasons[kind] = e.message; } }
    return { kinds: Object.keys(registrationFields), policies, enabled, unavailableReasons, fees: { ...Object.fromEntries(Object.entries(legacyFees?.value ?? {}).map(([k, p]) => [k, { amountMinor: p.amountMinor, approved: false, legacyMetadataOnly: true }])), ...Object.fromEntries(Object.entries(policies).map(([kind, p]) => [kind, { amountMinor: p.amountMinor, approved: enabled[kind] }])) }, submissionEnabled: Object.values(enabled).some(Boolean), paymentEnabled: this.provider.ready && !this.provider.simulated, reason: 'Each category requires its own approved fee/document/privacy policy; activation requires review and applicable verified payment/guardian consent', requiredDocuments: Object.fromEntries(Object.entries(policies).map(([kind, p]) => [kind, p.documents?.filter(d => d.required !== false).map(d => d.key) ?? []])) };
  }
  applicationDTO(row, admin = false) { return { id: String(row._id), reference: row.reference, kind: row.kind, teacherProfileId: row.teacherProfileId ? String(row.teacherProfileId) : null, applicant: row.applicant, revision: row.revision, status: row.status, paymentState: row.paymentState, requiredDocuments: row.requiredDocuments, documents: row.documents, guardianConsent: row.guardianConsent, feeSnapshot: row.feeSnapshot, orderId: row.orderId, submittedAt: row.submittedAt, activatedAt: row.activatedAt, personalDataDeletedAt: row.personalDataDeletedAt, ...(admin ? { notes: row.notes, history: row.history, legalHold: row.legalHold, userId: String(row.userId) } : { reviewFeedback: row.history?.filter(h => ['needs_changes', 'rejected'].includes(h.status)).map(h => ({ status: h.status, reason: h.reason, at: h.at })) }), submissionEnabled: true }; }
  async freeBook(value, auth, ctx) {
    this.eligible(auth);
    return this.publishingModule.coordination.run(async () => {
      const book = await this.publishingModule.models.Book.findById(id(value)), data = book?.publishedSnapshot;
      if (book?.status !== 'published' || !data?.pricingApproved || data.priceMinor !== 0 || !data.rightsConfirmed || !data.rightsNote || !await this.publishingModule.models.MediaAsset.exists({ _id: data.documentAssetId, purpose: 'book_full', status: 'ready', 'scan.status': 'clean' })) throw new AppError(409, 'FREE_ACCESS_UNAVAILABLE', 'This book is not an eligible published free book');
      const prior = await this.models.BookEntitlement.findOne({ userId: auth.user._id, bookId: book._id });
      if (prior?.revokedAt) throw new AppError(409, 'ENTITLEMENT_REVOKED', 'Revoked access requires authorized review');
      const effect = prior ?? await this.models.BookEntitlement.create({ userId: auth.user._id, bookId: book._id, source: 'free', grantedAt: now(), simulated: false, auditOutbox: [event('free_book_access', ctx)] });
      await this.flush(this.models.BookEntitlement, effect);
      return { id: String(effect._id), source: effect.source, contentUrl: '/api/v1/media/' + data.documentAssetId + '/content' };
    });
  }
  async createApplication(input, auth, ctx) {
    this.eligible(auth); object(input, ['kind', 'applicant', 'idempotencyKey'], ['kind', 'applicant', 'idempotencyKey']); key(input.idempotencyKey);
    const applicant = applicantInput(input.kind, input.applicant, auth.user), requestHash = hash({ kind: input.kind, applicant: Object.fromEntries(Object.entries(applicant).sort()) });
    await this.authService.limit(ctx, String(auth.user._id), 'registration-draft', 20);
    const fees = await this.publishingModule.models.SiteSettings.findOne({ key: 'registrationFees' }).lean();
    const fee = fees?.value?.[input.kind];
    try {
      const doc = await this.models.RegistrationApplication.create({ reference: 'STAGE6-APP-' + randomUUID(), userId: auth.user._id, kind: input.kind, applicant, ...(fee?.approved ? { feeSnapshot: { amountMinor: fee.amountMinor, currency: 'INR', revision: fees.revision } } : {}), requiredDocuments: [], idempotencyKey: input.idempotencyKey, requestHash, auditOutbox: [event('registration_draft_created', ctx)] });
      await this.flush(this.models.RegistrationApplication, doc); return this.applicationDTO(doc);
    } catch (error) { if (error.code !== 11000) throw error; const prior = await this.models.RegistrationApplication.findOne({ userId: auth.user._id, idempotencyKey: input.idempotencyKey }); if (!prior || prior.requestHash !== requestHash) throw conflict(); return this.applicationDTO(prior); }
  }
  async application(value, auth) { const doc = await this.models.RegistrationApplication.findOne({ _id: id(value), userId: auth.user._id }); if (!doc) throw missing(); return doc; }
  async editApplication(value, input, auth, ctx) {
    object(input, ['applicant', 'expectedRevision'], ['applicant', 'expectedRevision']); const old = await this.application(value, auth), applicant = applicantInput(old.kind, input.applicant, auth.user);
    if (!['draft', 'needs_changes'].includes(old.status)) throw new AppError(409, 'APPLICATION_LOCKED', 'Submitted applications cannot be edited without a request for changes');
    const doc = await this.models.RegistrationApplication.findOneAndUpdate({ _id: old._id, status: old.status, revision: revision(input.expectedRevision), 'auditOutbox.999': { $exists: false } }, { $set: { applicant }, $inc: { revision: 1 }, $push: { auditOutbox: event('registration_draft_updated', ctx) } }, { returnDocument: 'after' });
    if (!doc) throw conflict(); await this.flush(this.models.RegistrationApplication, doc); return this.applicationDTO(doc);
  }
}
