import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { commerceFixture } from './commerce-fixture.js';
import { serve } from './helpers.js';
import { PaymentService } from '../src/modules/commerce/payment.service.js';
import { RazorpayPaymentProvider } from '../src/modules/commerce/payment-provider.js';

const dbName = process.env.KITSS_STAGE6_TEST_DB;
test('Stage 6 standalone commerce, real HTTP and crash recovery with isolated fake provider only', { skip: !dbName ? 'No KITSS_STAGE6_TEST_DB; Stage 6 real database tests not executed' : false, timeout: 360000 }, async t => {
  const f = await commerceFixture(dbName); t.after(() => f.close());
  const admin = await f.fixtureUser(), student = await f.fixtureUser(['student']), foreign = await f.fixtureUser(['student']), readonly = await f.fixtureUser(['admin'], ['commerce.read']);
  const book = await f.book(admin), ctx = { ...f.ctx, actorId: student.user.publicId }, url = await serve(t, f.app());
  const csrfResponse = await fetch(url + '/api/v1/auth/csrf'), cookie = csrfResponse.headers.getSetCookie()[0].split(';')[0], csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, { method = 'GET', data, actor = student, headers = {}, raw } = {}) => {
    const response = await fetch(url + '/api/v1' + path, { method, headers: { Origin: f.config.corsOrigins[0], Cookie: [cookie, actor ? (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''].join('; '), 'X-CSRF-Token': csrf, ...(data ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(data ? { body: JSON.stringify(data) } : raw ? { body: raw } : {}) });
    return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : null, response };
  };
  const create = async actor => f.service.create({ product: { kind: 'book', id: book.id }, idempotencyKey: randomUUID() }, actor.auth, ctx);
  const started = async () => { const actor = await f.fixtureUser(['student']), order = await create(actor), attemptKey = randomUUID(); const attempt = await f.service.startAttempt(order.id, { idempotencyKey: attemptKey }, actor.auth, ctx); return { actor, order, attempt, attemptKey }; };
  const verify = (value, payment) => f.service.verify({ orderId: value.order.id, attemptId: value.attemptKey, razorpay_order_id: value.attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(value.attempt.providerOrderId + '|' + payment.id) }, value.actor.auth, ctx);
  const due = () => f.models.Order.updateMany({ 'creation.state': { $ne: 'pending' } }, { $set: { 'reconcile.state': 'pending', 'reconcile.nextAt': new Date(0), 'creation.startedAt': new Date(0) } });
  let primary;

  await t.test('server price authority, approved snapshots, ownership, CSRF and idempotent order creation', async () => {
    assert.equal((await api('/orders', { method: 'POST', actor: null, data: { product: { kind: 'book', id: book.id }, idempotencyKey: randomUUID() } })).status, 401);
    assert.equal((await api('/orders', { method: 'POST', data: { product: { kind: 'book', id: book.id }, amountMinor: 1, idempotencyKey: randomUUID() } })).status, 422);
    const idem = randomUUID(), payload = { product: { kind: 'book', id: book.id }, idempotencyKey: idem };
    const [first, second] = await Promise.all([api('/orders', { method: 'POST', data: payload }), api('/orders', { method: 'POST', data: payload })]);
    assert.equal(first.status, 201); assert.equal(second.status, 201); assert.equal(first.body.data.id, second.body.data.id); assert.equal(first.body.data.amountMinor, 12345); primary = first.body.data;
    assert.equal((await api('/orders', { method: 'POST', data: { ...payload, product: { kind: 'book', id: '000000000000000000000001' } } })).status, 409);
    assert.equal((await api('/orders/' + primary.id + '/status', { actor: foreign })).status, 404);
    assert.equal((await api('/me/orders/' + primary.id, { actor: foreign })).status, 404);
    assert.equal((await api('/orders', { method: 'POST', data: { product: { kind: 'course_plan', id: book.id }, idempotencyKey: randomUUID() } })).status, 409);
    const noCsrf = await fetch(url + '/api/v1/orders', { method: 'POST', headers: { Origin: f.config.corsOrigins[0], Cookie: 'kitss_student_session=' + student.token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); assert.equal(noCsrf.status, 403);
  });
  await t.test('pricing RBAC, stale revisions and missing/zero pricing never grant free access', async () => {
    const old = await f.models.Book.findById(book.id).lean();
    assert.equal((await api('/admin/books/' + book.id, { method: 'PATCH', actor: readonly, data: { expectedRevision: old.revision, priceMinor: 1 } })).status, 403);
    assert.equal((await api('/admin/books/' + book.id, { method: 'PATCH', actor: admin, data: { expectedRevision: 0, priceMinor: 1 } })).status, 422);
    for (const price of [undefined, 0]) {
      await f.models.Book.updateOne({ _id: book.id }, price === undefined ? { $unset: { 'publishedSnapshot.priceMinor': 1 } } : { $set: { 'publishedSnapshot.priceMinor': price } });
      await assert.rejects(() => create(foreign), { code: 'PRODUCT_NOT_PURCHASABLE' });
      assert.equal((await api('/media/' + book.documentAssetId + '/content', { actor: foreign })).status, 404);
    }
    await f.models.Book.updateOne({ _id: book.id }, { $set: { publishedSnapshot: old.publishedSnapshot } });
    const revised = await f.publishing.edit('books', book.id, { expectedRevision: old.revision, priceMinor: 20000 }, admin.auth, ctx);
    await f.publishing.publish('books', book.id, { expectedRevision: revised.revision, publish: true }, admin.auth, ctx);
    assert.equal((await f.service.owned(primary.id, student.auth)).amountMinor, 12345);
    assert.equal((await create(foreign)).amountMinor, 20000);
  });
  await t.test('provider order creation intent, one provider order, Checkout signature and uncaptured denial', async () => {
    const idem = randomUUID(); const [a, b] = await Promise.all([f.service.startAttempt(primary.id, { idempotencyKey: idem }, student.auth, ctx), f.service.startAttempt(primary.id, { idempotencyKey: idem }, student.auth, ctx)]);
    assert.equal(f.provider.creates, 1); const ready = await f.service.startAttempt(primary.id, { idempotencyKey: idem }, student.auth, ctx); assert.ok(ready.checkout); assert.equal(ready.providerOrderId, a.providerOrderId ?? b.providerOrderId);
    await assert.rejects(() => f.service.startAttempt(primary.id, { idempotencyKey: randomUUID() }, student.auth, ctx), { code: 'EXISTING_PAYMENT_ATTEMPT' });
    const payment = f.provider.pay(ready.providerOrderId, 'authorized'), input = { orderId: primary.id, attemptId: idem, razorpay_order_id: ready.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: 'bad' };
    assert.equal((await api('/payments/razorpay/verify', { method: 'POST', data: input })).status, 400);
    input.razorpay_signature = f.provider.sign(ready.providerOrderId + '|' + payment.id); const result = await api('/payments/razorpay/verify', { method: 'POST', data: input }); assert.equal(result.status, 202); assert.equal(result.body.data.orderStatus, 'authorized');
    assert.equal(await f.models.BookEntitlement.countDocuments({ userId: student.user._id }), 0);
    const failed = f.provider.pay(ready.providerOrderId, 'failed'); const failure = await api('/payments/razorpay/verify', {method:'POST',data:{...input,razorpay_payment_id:failed.id,razorpay_signature:f.provider.sign(ready.providerOrderId+'|'+failed.id)}}); assert.equal(failure.status,202); assert.equal(failure.body.data.paymentStatus,'failed');
    const failedList = await api('/admin/orders?status=failed',{actor:admin}); assert.equal(failedList.status,200); assert.ok(failedList.body.data.some(o=>o.id===primary.id));

  });
  await t.test('wrong amount/currency/order/mode and reused references are rejected without access', async () => {
    const value = await started();
    for (const override of [{ amount: 1 }, { currency: 'USD' }, { order_id: 'order_foreign' }, { mode: 'live' }, { captured: false }]) {
      const payment = f.provider.pay(value.attempt.providerOrderId, 'captured', override); await assert.rejects(() => verify(value, payment), error => ['PROVIDER_EVIDENCE_MISMATCH', 'CAPTURE_NOT_VERIFIED'].includes(error.code));
    }
    assert.equal(await f.models.BookEntitlement.countDocuments({ userId: value.actor.user._id }), 0);
    const payment = f.provider.pay(value.attempt.providerOrderId); await verify(value, payment);
    const other = await started(); f.provider.payments.set(payment.id, { ...payment, order_id: other.attempt.providerOrderId }); Object.assign(f.provider.orders.get(other.attempt.providerOrderId), { status: 'paid', amount_paid: other.attempt.amountMinor, amount_due: 0 });
    await assert.rejects(() => verify(other, { ...payment }), { code: 'COMMERCE_CONFLICT' }); assert.equal(await f.models.BookEntitlement.countDocuments({ userId: other.actor.user._id }), 0);
  });
  await t.test('captured payment commits durable obligation then concurrent fulfillment deduplicates and private media checks source order', async () => {
    const value = await started(), payment = f.provider.pay(value.attempt.providerOrderId);
    f.service.hooks.afterCaptureCommit = () => { throw new Error('Simulated crash after captured commit'); };
    await assert.rejects(() => verify(value, payment)); assert.equal((await f.models.Order.findById(value.order.id)).status, 'captured'); assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 0);
    f.service.hooks = {};
    await Promise.all([f.service.fulfill(value.order.id), f.service.fulfill(value.order.id), f.service.fulfill(value.order.id)]);
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 1);
    assert.equal((await f.service.owned(value.order.id, value.actor.auth)).fulfillment.state, 'applied');
    const Model = f.models.BookEntitlement, update = Model.findOneAndUpdate;
    let injected = false;
    Model.findOneAndUpdate = async function (...args) {
      const result = await update.apply(this, args);
      if (!injected) { injected = true; throw Object.assign(new Error('Synthetic duplicate after matching effect commit'), { code: 11000 }); }
      return result;
    };
    try { await f.service.fulfill(value.order.id); } finally { Model.findOneAndUpdate = update; }
    assert.equal(injected, true);
    assert.equal(await Model.countDocuments({ orderId: value.order.id }), 1);
    assert.equal((await api('/media/' + book.documentAssetId + '/content', { actor: value.actor, headers: { Range: 'bytes=0-4' } })).status, 206);
    assert.equal((await api('/media/' + book.documentAssetId + '/content', { actor: foreign })).status, 404);
    const original = await f.models.Order.findById(value.order.id); await f.models.Order.updateOne({ _id: original._id }, { $set: { status: 'pending' } }); assert.equal((await api('/media/' + book.documentAssetId + '/content', { actor: value.actor })).status, 404); await f.models.Order.updateOne({ _id: original._id }, { $set: { status: 'captured' } });
    const receipt = await api('/me/orders/' + value.order.id + '/receipt', { actor: value.actor }); assert.equal(receipt.status, 200); assert.equal(receipt.body.data.officialTaxInvoice, false); assert.match(receipt.body.data.label, /SIMULATED/);
    assert.equal((await api('/me/orders/' + value.order.id + '/invoice', { actor: value.actor })).status, 409);
    const unrelatedOrder = new f.connection.base.Types.ObjectId();
    await Model.updateOne({ orderId: value.order.id }, { $set: { orderId: unrelatedOrder } });
    try {
      await assert.rejects(() => f.service.fulfill(value.order.id), { code: 'ENTITLEMENT_CONFLICT' });
      assert.equal(await Model.countDocuments({ userId: value.actor.user._id }), 1);
      assert.equal(String((await Model.findOne({ userId: value.actor.user._id })).orderId), String(unrelatedOrder));
    } finally { await Model.updateOne({ orderId: unrelatedOrder }, { $set: { orderId: value.order.id } }); }
  });
  await t.test('crash before/after entitlement, service restart and missing effect recovery do not duplicate grants', async () => {
    for (const point of ['beforeEntitlement', 'afterEntitlement']) {
      const value = await started(), payment = f.provider.pay(value.attempt.providerOrderId); f.service.hooks[point] = () => { throw new Error('Simulated interruption'); };
      await assert.rejects(() => verify(value, payment)); f.service.hooks = {};
      const restarted = new PaymentService({ models: f.service.models, publishingModule: f, authService: f.auth, logger: f.logger, provider: f.provider });
      await restarted.fulfill(value.order.id); await restarted.fulfill(value.order.id); assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 1);
      assert.equal((await f.models.Order.findById(value.order.id)).fulfillment.state, 'applied');
    }
  });
  await t.test('provider timeout and crashes before/after create preserve intent and never blindly recreate', async () => {
    for (const point of ['beforeProviderCreate', 'afterProviderCreate']) {
      const actor = await f.fixtureUser(['student']), order = await create(actor), idem = randomUUID(); const previous = f.provider.creates;
      f.service.hooks[point] = () => { throw new Error('Simulated process interruption'); };
      await assert.rejects(() => f.service.startAttempt(order.id, { idempotencyKey: idem }, actor.auth, ctx)); f.service.hooks = {};
      await f.service.startAttempt(order.id, { idempotencyKey: idem }, actor.auth, ctx); assert.equal(f.provider.creates, previous + (point === 'afterProviderCreate' ? 1 : 0));
      await f.models.Order.updateOne({ _id: order.id }, { $set: { 'creation.startedAt': new Date(0) } });
      if (point === 'afterProviderCreate') { await f.service.processOrder(await f.models.Order.findById(order.id)).catch(error => assert.equal(error.code, 'PAYMENT_PENDING')); assert.equal((await f.models.Order.findById(order.id)).creation.state, 'ready'); }
      else await assert.rejects(async () => f.service.processOrder(await f.models.Order.findById(order.id)), { code: 'PROVIDER_CREATE_UNRESOLVED' });
      assert.equal(f.provider.creates, previous + (point === 'afterProviderCreate' ? 1 : 0));
    }
  });
  await t.test('raw signed webhook durable receipt, duplicate delivery, invalid signature and DB failures', async () => {
    const value = await started(), payment = f.provider.pay(value.attempt.providerOrderId), raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: payment.id, order_id: payment.order_id, status: 'untrusted' } } } })), eventId = randomUUID();
    const webhook = (signature = f.provider.sign(raw)) => api('/webhooks/razorpay', { method: 'POST', actor: null, raw, headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': signature, 'X-Razorpay-Event-Id': eventId } });
    assert.equal((await webhook('bad')).status, 400);
    const createJob = f.models.Job.create; f.models.Job.create = async () => { throw new Error('Database unavailable'); }; try { assert.equal((await webhook()).status, 503); } finally { f.models.Job.create = createJob; }
    f.service.hooks.afterWebhookReceipt = () => { throw new Error('Crash after receipt'); }; assert.equal((await webhook()).status, 500); f.service.hooks = {};
    assert.equal(await f.models.Job.countDocuments({ paymentId: payment.id }), 1);
    assert.equal((await webhook()).status, 200); assert.equal((await webhook()).status, 200);
    await f.service.tick(); assert.equal((await f.models.Order.findById(value.order.id)).status, 'captured'); assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 1);
    // Out-of-order/stale failures are fetched authoritatively and cannot undo capture.
    f.provider.payments.set(payment.id, { ...payment, status: 'failed', captured: false }); await f.service.observe(value.order.id, payment.id, 'webhook');
    const row = await f.models.Order.findById(value.order.id); assert.equal(row.status, 'captured'); assert.equal(row.attempts.find(a => a.paymentId === payment.id).status, 'captured');
  });
  await t.test('expired leases, bounded retries/dead letters, concurrent workers and captured pending fulfillment recovery', async () => {
    const value = await started(), payment = f.provider.pay(value.attempt.providerOrderId);
    f.service.hooks.beforeEntitlement = () => { throw new Error('Disk/DB interruption'); }; await assert.rejects(() => verify(value, payment)); f.service.hooks = {};
    await f.models.Order.updateOne({ _id: value.order.id }, { $set: { 'reconcile.state': 'leased', 'reconcile.leaseUntil': new Date(0), 'reconcile.token': 'abandoned' } });
    await Promise.all([f.service.tick(), f.service.tick()]); assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 1); assert.equal((await f.models.Order.findById(value.order.id)).reconcile.state, 'done');
    const pending = await started(); await f.models.Order.updateOne({ _id: pending.order.id }, { $set: { 'reconcile.state': 'pending', 'reconcile.nextAt': new Date(0), 'reconcile.attempts': 7 } }); await f.service.tick(); const dead = await f.models.Order.findById(pending.order.id); assert.equal(dead.reconcile.state, 'dead'); assert.equal(dead.status, 'pending');
    assert.ok(await f.models.AuditLog.countDocuments({ action: 'fulfillment_applied' }));
  });
  await t.test('admin cannot mark paid or rewrite amounts; reconciliation requires permission and summaries separate simulation', async () => {
    assert.equal((await api('/admin/orders', { actor: student })).status, 403);
    assert.equal((await api('/admin/orders/' + primary.id + '/reconcile', { method: 'POST', actor: readonly, data: {} })).status, 403);
    assert.equal((await api('/admin/orders/' + primary.id + '/reconcile', { method: 'POST', actor: admin, data: { paid: true, amountMinor: 1 } })).status, 422);
    assert.equal((await api('/admin/orders/' + primary.id, { method: 'PATCH', actor: admin, data: { status: 'captured' } })).status, 404);
    assert.equal((await api('/admin/orders/' + primary.id + '/reconcile', { method: 'POST', actor: admin, data: {} })).status, 202);
    const details = await api('/admin/orders/' + primary.id, { actor: admin }); assert.equal(details.status,200); assert.ok(Array.isArray(details.body.data.eventHistory)); assert.equal(details.body.data.providerScope,undefined);
    const summary = await api('/admin/dashboard', { actor: admin }); assert.equal(summary.status, 200); assert.equal(summary.body.data.paymentMode, 'test'); assert.ok(summary.body.data.groups.every(g => g._id.simulated === true));
  });
  await t.test('capture persistence/audit outages and interrupted reconciliation recover without claiming nonexistent effects', async () => {
    const value = await started(), payment = f.provider.pay(value.attempt.providerOrderId);
    const update = f.models.Order.findOneAndUpdate;
    f.models.Order.findOneAndUpdate = () => { throw new Error('Capture DB unavailable'); };
    try { await assert.rejects(() => verify(value, payment)); } finally { f.models.Order.findOneAndUpdate = update; }
    assert.equal((await f.models.Order.findById(value.order.id)).status, 'pending');
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 0);
    const audit = f.models.AuditLog.updateOne;
    f.models.AuditLog.updateOne = async () => { throw new Error('Audit unavailable'); };
    try { await verify(value, payment); } finally { f.models.AuditLog.updateOne = audit; }
    const row = await f.models.Order.findById(value.order.id); assert.ok(row.auditOutbox.length > 0);
    // Deleting a test-owned effect simulates a missing projection. Paid is not an access grant by itself.
    await f.models.BookEntitlement.deleteMany({ orderId: value.order.id });
    assert.equal((await api('/media/' + book.documentAssetId + '/content', { actor: value.actor })).status, 404);
    const restarted = new PaymentService({ models: f.service.models, publishingModule: f, authService: f.auth, logger: f.logger, provider: f.provider });
    await restarted.fulfill(value.order.id); await restarted.tick();
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: value.order.id }), 1);
    assert.equal((await f.models.Order.findById(value.order.id)).auditOutbox.length, 0);
    const pending = await started(); f.service.hooks.duringReconciliation = () => { throw new Error('Reconcile interrupted'); };
    try { await assert.rejects(async () => f.service.processOrder(await f.models.Order.findById(pending.order.id))); } finally { f.service.hooks = {}; }
    assert.equal((await f.models.Order.findById(pending.order.id)).status, 'pending');
  });
  await t.test('registration drafts persist safe fields and block documents, submission, fees and staff escalation', async () => {
    const input = { kind: 'teacher', applicant: { fullName: 'STAGE6_ISOLATED_APPLICANT', email: student.user.emailNormalized, isContinuing: true, specializationNotes: 'Generated fixture' }, idempotencyKey: randomUUID() };
    const created = await api('/registration-applications', { method: 'POST', data: input }); assert.equal(created.status, 201); const application = created.body.data;
    assert.equal((await api('/registration-applications', { method: 'POST', data: input })).body.data.id, application.id);
    assert.equal((await api('/registration-applications/' + application.id + '/status', { actor: foreign })).status, 404);
    assert.equal((await api('/registration-applications/' + application.id, { method: 'PATCH', data: { expectedRevision: application.revision, applicant: { fullName: 'Updated fixture', email: student.user.emailNormalized } } })).status, 200);
    assert.equal((await api('/registration-applications/' + application.id + '/submit', { method: 'POST', data: { expectedRevision: 2, declaration: true } })).status, 409);
    assert.equal((await api('/orders', { method: 'POST', data: { product: { kind: 'registration_fee', id: application.id }, idempotencyKey: randomUUID() } })).status, 409);
    assert.equal((await api('/registration-applications', { method: 'POST', data: { ...input, applicant: { aadharNumber: 'never-collected' } } })).status, 422);
    assert.deepEqual((await f.models.User.findById(student.user._id)).roles, ['student']);
    assert.equal((await api('/admin/settings/registrationFees', { method: 'PATCH', actor: admin, data: { expectedRevision: 0, value: { teacher: { amountMinor: 500, approved: true } } } })).status, 200);
    const config = await api('/public/registration-config', { actor: null }); assert.equal(config.body.data.paymentEnabled, false); assert.equal(config.body.data.fees.teacher.amountMinor, 500);
  });
  await t.test('only a never-started internal order may bind newly approved credentials; external intents keep their scope', async () => {
    const actor = await f.fixtureUser(['student']), order = await create(actor), originalScope = f.provider.scope;
    try {
      f.provider.scope = 'new-approved-isolated-scope'; const idem = randomUUID();
      const ready = await f.service.startAttempt(order.id, {idempotencyKey:idem}, actor.auth, ctx); assert.ok(ready.checkout);
      assert.equal((await f.models.Order.findById(order.id)).providerScope, f.provider.scope);
      f.provider.scope = 'another-scope';
      await assert.rejects(() => f.service.startAttempt(order.id, {idempotencyKey:idem}, actor.auth, ctx), {code:'PROVIDER_SCOPE_MISMATCH'});
    } finally { f.provider.scope = originalScope; }
  });
  await t.test('runtime credential gate rejects old configuration for provider operations and raw webhooks', async () => {
    const previous = f.service.provider; f.service.provider = new RazorpayPaymentProvider({ mode: 'test', rotated: false });
    try { assert.equal((await api('/webhooks/razorpay', { method: 'POST', raw: Buffer.from('{}'), headers: { 'Content-Type': 'application/json' } })).status, 503); assert.equal((await api('/public/payment-config', { actor: null })).body.data.available, false); }
    finally { f.service.provider = previous; }
  });
});
