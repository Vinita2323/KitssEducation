import express from 'express';
import { requireSession, requirePermission } from '../auth/auth.routes.js';
import { object, id, text, key, revision } from '../publishing/validation.js';
import { registrationBlocked } from './registration.js';
import { orderDTO } from './payment.service.js';
import { dashboardFilters } from './dashboard-filters.js';
import { AppError } from '../../utils/AppError.js';

export function createCommerceWebhookRouter(service) {
  const router = express.Router();
  router.post('/api/v1/webhooks/razorpay', express.raw({ type: 'application/json', limit: 131072, inflate: false }), async (req, res) => {
    if (!Buffer.isBuffer(req.body)) throw new AppError(415, 'RAW_JSON_REQUIRED', 'Raw JSON required');
    const data = await service.receiveWebhook(req.body, req.get('X-Razorpay-Signature'), req.get('X-Razorpay-Event-Id'));
    res.json({ data, requestId: req.requestId });
  });
  return router;
}
export function createCommerceRouter(service, { operations } = {}) {
  const router = express.Router();
  const ctx = req => ({ actorId: req.auth?.user.publicId, requestId: req.requestId, ip: req.ip });
  const reply = (req, res, data, status = 200) => res.status(status).json({ data, requestId: req.requestId });
  if (service.franchise) {
    router.get('/public/franchise-policy', async (req, res) => { try { reply(req, res, { available: true, policy: await service.franchise.policy() }); } catch (e) { if (e.code !== 'FRANCHISE_REQUIREMENTS') throw e; reply(req, res, { available: false, message: e.message }); } });
    router.get('/admin/franchise-policy', requirePermission('settings.read'), async (req, res) => reply(req, res, await service.franchise.adminPolicy()));
    router.patch('/admin/franchise-policy', requirePermission('settings.write'), async (req, res) => reply(req, res, await service.franchise.savePolicy(req.body, req.auth, ctx(req))));
    router.post('/admin/franchise-policy/publish', requirePermission('settings.write'), async (req, res) => reply(req, res, await service.franchise.savePolicy(req.body, req.auth, ctx(req), true)));
    router.get('/me/franchise-applications', requireSession, async (req, res) => reply(req, res, await service.franchise.mine(req.auth)));
    router.post('/franchise-applications/:id/documents', requireSession, async (req, res) => reply(req, res, await service.franchise.attach(req.params.id, req.body, req.auth, ctx(req))));
    router.post('/franchise-applications/:id/activate', requireSession, async (req, res) => reply(req, res, await service.franchise.activate(req.params.id, req.body, req.auth, ctx(req))));
    router.post('/franchise-applications/:id/renewal-agreement', requireSession, async (req, res) => reply(req, res, await service.franchise.acceptRenewal(req.params.id, req.body, req.auth, ctx(req))));
    router.post('/franchise-applications/:id/renew', requireSession, async (req, res) => reply(req, res, await service.franchise.freeRenew(req.params.id, req.body, req.auth, ctx(req))));
    router.post('/admin/franchise-applications/:id/renewal-review', requirePermission('franchises.approve'), async (req, res) => reply(req, res, await service.franchise.reviewRenewal(req.params.id, req.body, ctx(req))));
    router.post('/admin/franchise-applications/:id/documents/review', requirePermission('franchises.review'), async (req, res) => reply(req, res, await service.franchise.reviewDocument(req.params.id, req.body, req.auth, ctx(req))));
  }
  router.get('/public/registration-config', async (req, res) => reply(req, res, await service.registrationConfig()));
  router.get('/public/franchise-fees', async (req, res) => reply(req, res, await service.business.franchiseFees()));
  router.get('/me/refund-policy', requireSession, async (req, res) => reply(req, res, await service.business.refundOptions()));
  router.get('/public/payment-config', (req, res) => reply(req, res, { paymentMode: 'test', available: service.provider.ready && !service.provider.simulated, reason: service.provider.ready ? null : 'Rotated credentials and operator validation pending', coachingEnabled: service.provider.ready && !service.provider.simulated, registrationEnabled: service.provider.ready && !service.provider.simulated }));
  router.get('/admin/business-policies', requirePermission('settings.read'), async (req, res) => { const row = await service.business.settings(); reply(req, res, { value: row.value, revision: row.revision, history: row.policyHistory ?? [] }); });
  router.patch('/admin/business-policies', requirePermission('settings.write'), async (req, res) => reply(req, res, await service.business.save(req.body, req.auth, ctx(req))));
  router.post('/books/:id/access', requireSession, async (req, res) => { object(req.body, []); reply(req, res, await service.freeBook(req.params.id, req.auth, ctx(req))); });
  router.post('/me/orders/:id/refund-requests', requireSession, async (req, res) => reply(req, res, await service.business.refund(req.params.id, req.body, req.auth, ctx(req)), 201));
  router.get('/admin/refund-requests', requirePermission('refunds.read'), async (req, res) => { object(req.query, ['page', 'status']); const page = Number(req.query.page ?? 1); if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw new AppError(422, 'INVALID_INPUT', 'Invalid page'); if (req.query.status && !['pending', 'approved', 'rejected'].includes(req.query.status)) throw new AppError(422, 'INVALID_INPUT', 'Invalid status'); const filter = req.query.status ? { 'refundRequest.status': req.query.status } : { refundRequest: { $ne: null } }; reply(req, res, { items: (await service.models.Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20)).map(orderDTO), page, total: await service.models.Order.countDocuments(filter) }); });
  router.patch('/admin/orders/:id/refund-request', requirePermission('refunds.review'), async (req, res) => reply(req, res, await service.business.refundReview(req.params.id, req.body, ctx(req))));
  router.get('/admin/access-requests', requirePermission('access.read'), async (req, res) => { object(req.query, ['page']); const page = Number(req.query.page ?? 1); if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw new AppError(422, 'INVALID_INPUT', 'Invalid page'); reply(req, res, { items: await service.models.AccessRequest.find().sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).lean(), page, total: await service.models.AccessRequest.countDocuments() }); });
  router.post('/admin/access-requests', requirePermission('access.request'), async (req, res) => reply(req, res, await service.business.accessRequest(req.body, req.auth, ctx(req)), 201));
  router.patch('/admin/access-requests/:id', requirePermission('access.issue'), async (req, res) => reply(req, res, await service.business.accessReview(req.params.id, req.body, req.auth, ctx(req))));
  router.post('/orders', requireSession, async (req, res) => reply(req, res, await service.create(req.body, req.auth, ctx(req)), 201));
  router.post('/orders/:id/payment-attempts', requireSession, async (req, res) => { const result = await service.startAttempt(req.params.id, req.body, req.auth, ctx(req)); reply(req, res, result, result.checkout ? 200 : 202); });
  router.post('/payments/razorpay/verify', requireSession, async (req, res) => { const result = await service.verify(req.body, req.auth, ctx(req)); reply(req, res, result, result.orderStatus === 'captured' && result.activationStatus === 'applied' ? 200 : 202); });
  router.get('/orders/:id/status', requireSession, async (req, res) => reply(req, res, orderDTO(await service.owned(req.params.id, req.auth))));
  router.get('/me/orders', requireSession, async (req, res) => res.json({ ...await service.list(req.query, req.auth), requestId: req.requestId }));
  router.get('/me/orders/:id/receipt', requireSession, async (req, res) => reply(req, res, await service.receipt(req.params.id, req.auth)));
  router.get('/me/orders/:id/invoice', requireSession, async (req, res) => { await service.owned(req.params.id, req.auth); throw new AppError(409, 'INVOICE_POLICY_PENDING', 'Official tax invoices are unavailable pending approved compliance policy; use a clearly labelled payment receipt'); });
  router.get('/me/orders/:id', requireSession, async (req, res) => reply(req, res, orderDTO(await service.owned(req.params.id, req.auth))));
  router.get('/me/books', requireSession, async (req, res) => reply(req, res, await service.ownedBooks(req.auth)));
  router.get('/admin/book-owner-counts', requirePermission('books.read'), async (req, res) => {
    object(req.query, ['ids'], ['ids']);
    const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',') : [];
    if (!ids.length || ids.length > 100) throw new AppError(422, 'VALIDATION_ERROR', 'Send between 1 and 100 book ids');
    reply(req, res, await service.ownerCounts(ids.map(value => id(value))));
  });
  router.get('/admin/dashboard', requirePermission('dashboard.read'), async (req, res) => {
    // Validate once before starting queries, so a bad date cannot leave a rejected query unhandled.
    const filters = dashboardFilters(req.query);
    const [payments, overview] = await Promise.all([service.summary(req.query), operations?.overview(filters.range) ?? null]);
    reply(req, res, { asOf: new Date(), period: payments.period, payments, overview });
  });
  router.get('/admin/orders', requirePermission('commerce.read'), async (req, res) => res.json({ ...await service.list(req.query, req.auth, true), requestId: req.requestId }));
  router.get('/admin/orders/:id', requirePermission('commerce.read'), async (req, res) => { const row = await service.models.Order.findById(id(req.params.id)); if (!row) throw new AppError(404, 'NOT_FOUND', 'Order was not found'); const events = row.providerOrderId ? await service.models.Job.find({ providerOrderId: row.providerOrderId, scope: row.providerScope }).select('_id state attempts lastError paymentId providerOrderId').limit(100).lean() : []; reply(req, res, { ...orderDTO(row), eventHistory: events.map(e => ({ id: String(e._id), state: e.state, attempts: e.attempts, lastError: e.lastError, paymentId: e.paymentId, providerOrderId: e.providerOrderId })) }); });
  router.post('/admin/orders/:id/reconcile', requirePermission('commerce.reconcile'), async (req, res) => { object(req.body, []); await service.authService.limit(ctx(req), req.auth.user.publicId, 'admin-reconcile', 30); reply(req, res, await service.reconcile({ id: req.params.id }, ctx(req)), 202); });
  router.post('/registration-applications', requireSession, async (req, res) => reply(req, res, await service.createApplication(req.body, req.auth, ctx(req)), 201));
  router.patch('/registration-applications/:id', requireSession, async (req, res) => reply(req, res, await service.editApplication(req.params.id, req.body, req.auth, ctx(req))));
  router.get('/registration-applications/:id/status', requireSession, async (req, res) => reply(req, res, service.applicationDTO(await service.application(req.params.id, req.auth))));
  router.post('/registration-applications/:id/submit', requireSession, async (req, res) => reply(req, res, await service.business.submit(req.params.id, req.body, req.auth, ctx(req))));
  router.post('/registration-applications/:id/documents', requireSession, async (req, res) => reply(req, res, await service.business.attach(req.params.id, req.body, req.auth, ctx(req))));
  router.get('/admin/registration-applications', requirePermission('registrations.read'), async (req, res) => { object(req.query, ['page']); const page = Number(req.query.page ?? 1); if (!Number.isSafeInteger(page) || page < 1) throw new AppError(422, 'INVALID_INPUT', 'Invalid page'); const total = await service.models.RegistrationApplication.countDocuments(); reply(req, res, { items: (await service.models.RegistrationApplication.find().sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20)).map(r => service.applicationDTO(r, true)), page, total }); });
  router.get('/admin/registration-applications/:id', requirePermission('registrations.read'), async (req, res) => { const row = await service.models.RegistrationApplication.findById(id(req.params.id)); if (!row) throw new AppError(404, 'NOT_FOUND', 'Application was not found'); reply(req, res, service.applicationDTO(row, true)); });
  router.patch('/admin/registration-applications/:id/status', requirePermission('registrations.review'), async (req, res) => reply(req, res, await service.business.review(req.params.id, req.body, req.auth, ctx(req))));
  router.post('/admin/registration-applications/:id/purge', requirePermission('registrations.documents.review'), async (req, res) => reply(req, res, await service.business.purge(req.params.id, req.body, req.auth, ctx(req))));
  router.post('/admin/registration-applications/:id/notes', requirePermission('registrations.write'), async (req, res) => {
    object(req.body, ['text', 'idempotencyKey'], ['text', 'idempotencyKey']); key(req.body.idempotencyKey); const note = text(req.body.text, 2000); if (!note) throw new AppError(422, 'INVALID_INPUT', 'Note is required');
    let row = await service.models.RegistrationApplication.findById(id(req.params.id)); if (!row) throw new AppError(404, 'NOT_FOUND', 'Application was not found');
    const prior = row.notes.find(n => n.id === req.body.idempotencyKey); if (prior && prior.text !== note) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Note key already used');
    if (!prior) { row = await service.models.RegistrationApplication.findOneAndUpdate({ _id: row._id, revision: row.revision, 'notes.99': { $exists: false }, 'auditOutbox.999': { $exists: false } }, { $push: { notes: { id: req.body.idempotencyKey, text: note, actorId: req.auth.user.publicId, at: new Date() }, auditOutbox: { id: String(row._id) + ':' + req.body.idempotencyKey, action: 'registration_note', actorId: req.auth.user.publicId, at: new Date() } }, $inc: { revision: 1 } }, { returnDocument: 'after' }); if (!row) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh before retrying'); await service.flush(service.models.RegistrationApplication, row); }
    reply(req, res, service.applicationDTO(row, true));
  });
  return router;
}
