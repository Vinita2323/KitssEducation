import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { coachingFixture } from './coaching-fixture.js';
import { FakePaymentProvider } from './commerce-fixture.js';
import { RazorpayPaymentProvider } from '../src/modules/commerce/payment-provider.js';
import { serve } from './helpers.js';

// Synthetic credentials and injected HTTPS responses only. No provider traffic,
// operator approval file, configured credentials or application records are used.
const dbName = process.env.KITSS_RAZORPAY_ACCEPTANCE_DB;
test('Razorpay adapter + HTTP + MongoDB acceptance with transport doubles (NOT real provider acceptance)', {
  skip: !dbName ? 'No KITSS_RAZORPAY_ACCEPTANCE_DB; isolated database unavailable' : false,
  timeout: 360000
}, async t => {
  const config = { keyId: 'rzp_test_syntheticStage12', keySecret: randomUUID(), webhookSecret: randomUUID(), mode: 'test', rotated: true };
  const remote = new FakePaymentProvider();
  const calls = [];
  const transport = async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://api.razorpay.com');
    assert.equal(options.headers.Authorization, 'Basic ' + Buffer.from(config.keyId + ':' + config.keySecret).toString('base64'));
    calls.push(options.method + ' ' + parsed.pathname);
    const endpoint = parsed.pathname.replace('/v1/', '');
    let value;
    if (endpoint === 'orders' && options.method === 'POST') {
      const input = JSON.parse(options.body);
      assert.equal(input.partial_payment, false);
      value = await remote.createOrder({ reference: input.receipt, amountMinor: input.amount });
    } else if (/^orders\/[^/]+\/payments$/.test(endpoint)) value = { items: await remote.listPayments(endpoint.split('/')[1]) };
    else if (endpoint.startsWith('payments/')) value = await remote.getPayment(endpoint.split('/')[1]);
    else if (endpoint.startsWith('orders/')) value = await remote.getOrder(endpoint.split('/')[1]);
    else if (endpoint === 'orders') value = { items: await remote.findOrders(parsed.searchParams.get('receipt')) };
    else assert.fail('Unexpected adapter endpoint');
    // Real Razorpay entities do not need a synthetic mode field: the configured
    // test credential scope is authoritative. Preserve all other response fields.
    const json = JSON.stringify(value, (key, v) => key === 'mode' ? undefined : v);
    return new Response(json);
  };
  const provider = new RazorpayPaymentProvider(config, { approved: true, transport });
  // This is a test double despite using the production adapter; keep isolated
  // records and summaries explicitly simulated.
  provider.simulated = true;
  const f = await coachingFixture(dbName, { provider });
  t.after(() => f.close());
  const d = await f.seed(), url = await serve(t, f.app());
  const csrfResponse = await fetch(url + '/api/v1/auth/csrf');
  const cookie = csrfResponse.headers.getSetCookie()[0].split(';')[0];
  const csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, { method = 'GET', data, raw, actor = d.student, headers = {} } = {}) => {
    const response = await fetch(url + '/api/v1' + path, { method, headers: {
      Origin: f.config.corsOrigins[0], Cookie: [cookie, actor ? (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''].join('; '),
      'X-CSRF-Token': csrf, ...(data || raw ? { 'Content-Type': 'application/json' } : {}), ...headers
    }, ...(data ? { body: JSON.stringify(data) } : raw ? { body: raw } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const sign = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');
  const start = async product => {
    const data = { product, idempotencyKey: randomUUID() };
    const first = await api('/orders', { method: 'POST', data });
    assert.equal(first.status, 201); assert.equal(first.body.data.amountMinor, 12345);
    assert.equal((await api('/orders', { method: 'POST', data })).body.data.id, first.body.data.id);
    const attemptId = randomUUID();
    const attempt = await api('/orders/' + first.body.data.id + '/payment-attempts', { method: 'POST', data: { idempotencyKey: attemptId } });
    assert.equal(attempt.status, 200);
    return { orderId: first.body.data.id, attemptId, razorpay_order_id: attempt.body.data.providerOrderId };
  };
  const proof = (order, payment) => ({ ...order, razorpay_payment_id: payment.id, razorpay_signature: sign(config.keySecret, order.razorpay_order_id + '|' + payment.id) });
  const verify = (order, payment, options = {}) => api('/payments/razorpay/verify', { method: 'POST', data: proof(order, payment), ...options });
  let book, course;
  await t.test('backend pricing, ownership, invalid proof and pending capture never grant book access', async () => {
    book = await start({ kind: 'book', id: d.book.id });
    assert.equal((await api('/media/' + d.book.documentAssetId + '/content')).status, 404);
    const pending = remote.pay(book.razorpay_order_id, 'authorized');
    assert.equal((await verify(book, pending, { data: { ...proof(book, pending), razorpay_signature: '0'.repeat(64) } })).status, 400);
    assert.equal((await verify(book, pending, { actor: d.other })).status, 404);
    assert.equal((await verify(book, pending)).status, 202);
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: book.orderId }), 0);
    assert.equal((await api('/orders/' + book.orderId + '/status')).body.data.paymentStatus, 'authorized');
  });
  await t.test('captured book callback and duplicate callback apply exactly one entitlement', async () => {
    const payment = remote.pay(book.razorpay_order_id);
    assert.equal((await verify(book, payment)).status, 200);
    assert.equal((await verify(book, payment)).status, 200);
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: book.orderId }), 1);
    const owned = await f.service.owned(book.orderId, d.student.auth);
    assert.equal(owned.fulfillment.state, 'applied');
    assert.equal(await f.service.canReadAsset(await f.models.MediaAsset.findById(d.book.documentAssetId), d.student.auth), true);
  });
  await t.test('exact raw-body HMAC, tamper rejection, durable duplicate webhook and course fulfillment', async () => {
    course = await start({ kind: 'course_plan', id: d.plan.id });
    const payment = remote.pay(course.razorpay_order_id);
    const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: payment.id, order_id: payment.order_id, amount: 1 } } } }));
    const eventId = randomUUID(), headers = { 'X-Razorpay-Signature': sign(config.webhookSecret, raw), 'X-Razorpay-Event-Id': eventId };
    assert.equal((await api('/webhooks/razorpay', { method: 'POST', actor: null, raw: Buffer.concat([raw, Buffer.from(' ')]), headers })).status, 400);
    const send = () => api('/webhooks/razorpay', { method: 'POST', actor: null, raw, headers });
    assert.equal((await send()).status, 200); assert.equal((await send()).status, 200);
    assert.equal(await f.models.Job.countDocuments({ paymentId: payment.id }), 1);
    assert.equal(await f.models.Enrollment.countDocuments({ orderId: course.orderId }), 0);
    await f.service.tick();
    assert.equal((await f.learning.enrollment(d.course.id, d.student.auth)).canAccess, true);
    assert.equal(await f.models.Enrollment.countDocuments({ orderId: course.orderId }), 1);
    assert.equal((await api('/coaching/courses/' + d.course.id + '/lessons/' + d.lesson.id)).status, 200);
    assert.equal((await api('/coaching/courses/' + d.course.id + '/lessons/' + d.lesson.id, { actor: d.other })).status, 403);
    assert.equal((await verify(course, payment)).status, 200);
    await f.service.fulfill(course.orderId);
    assert.equal(await f.models.Enrollment.countDocuments({ orderId: course.orderId }), 1);
  });
  await t.test('interrupted callback reconciliation fetches adapter evidence and admin totals stay simulated', async () => {
    const actor = await f.fixtureUser(['student']);
    const order = await f.service.create({ product: { kind: 'book', id: d.book.id }, idempotencyKey: randomUUID() }, actor.auth, f.ctx);
    const attempt = await f.service.startAttempt(order.id, { idempotencyKey: randomUUID() }, actor.auth, f.ctx);
    remote.pay(attempt.providerOrderId);
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: order.id }), 0);
    await f.service.reconcile({ id: order.id }, f.ctx);
    await f.service.tick();
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: order.id }), 1);
    const dashboard = await api('/admin/dashboard', { actor: d.admin });
    assert.equal(dashboard.status, 200);
    const details = await api('/admin/orders/' + book.orderId, { actor: d.admin });
    assert.equal(details.status, 200);
    assert.ok(JSON.stringify(details.body).includes(book.razorpay_order_id));
    assert.equal((await api('/admin/orders/' + book.orderId)).status, 403);
    const captured = dashboard.body.data.groups.filter(g => g._id.status === 'captured');
    assert.equal(captured.reduce((n, g) => n + g.amountMinor, 0), 3 * 12345);
    assert.ok(captured.every(g => g._id.simulated === true));
    assert.equal(remote.creates, 3);
    assert.ok(calls.some(c => /\/payments$/.test(c)));
    assert.equal(JSON.stringify(dashboard.body).includes(config.keySecret), false);
  });
  await t.test('unapproved provider blocks local HTTP webhook without queuing or external calls', async () => {
    const old = f.service.provider;
    let network = 0;
    f.service.provider = new RazorpayPaymentProvider({ ...config, rotated: false }, { transport: () => { network++; } });
    try {
      const response = await api('/webhooks/razorpay', { method: 'POST', actor: null, raw: Buffer.from('{}'), headers: { 'X-Razorpay-Signature': '0'.repeat(64), 'X-Razorpay-Event-Id': randomUUID() } });
      assert.equal(response.status, 503); assert.equal(network, 0);
    } finally { f.service.provider = old; }
  });
});
