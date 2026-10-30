import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { coachingFixture } from './coaching-fixture.js';

const dbName = process.env.KITSS_ENROLLMENT_ADMIN_TEST_DB;
test('admin enrollment review: student details, search, states, detail, revoke and restore', { skip: !dbName ? 'No KITSS_ENROLLMENT_ADMIN_TEST_DB; real enrollment admin tests not executed' : false, timeout: 300000 }, async t => {
  const f = await coachingFixture(dbName); t.after(() => f.close());
  const d = await f.seed(), A = f.learning.access, ctx = { ...f.ctx, actorId: d.admin.user.publicId };
  const order = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
  const key = randomUUID(), attempt = await f.service.startAttempt(order.id, { idempotencyKey: key }, d.student.auth, f.ctx), payment = f.provider.pay(attempt.providerOrderId);
  await f.service.verify({ orderId: order.id, attemptId: key, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) }, d.student.auth, f.ctx);
  await f.service.fulfill(order.id);
  const now = Date.now();
  const free = await f.models.Enrollment.create({ userId: d.other.user._id, courseId: d.course.id, planId: d.plan.id, source: 'free', startsAt: new Date(now - 86400000), expiresAt: new Date(now + 3 * 86400000), simulated: false });
  const studentRow = () => A.list({ q: d.student.user.emailNormalized }).then(r => r.data[0]);

  await t.test('rows carry student, course, plan, order, progress and state; summary counts all', async () => {
    const result = await A.list({});
    assert.equal(result.meta.total, 2);
    assert.deepEqual(result.summary, { active: 2, expiring: 2, expired: 0, revoked: 0, blocked: 0 });
    const row = await studentRow();
    assert.equal(row.student.name, d.student.user.name); assert.equal(row.student.email, d.student.user.emailNormalized);
    assert.equal(row.title, 'STAGE7_SYNTHETIC_COURSE'); assert.equal(row.course.title, 'STAGE7_SYNTHETIC_COURSE');
    assert.equal(row.plan.name, d.plan.name); assert.equal(row.order.reference, (await f.models.Order.findById(order.id)).reference);
    assert.equal(row.state, 'active'); assert.equal(row.source, 'paid'); assert.equal(row.totalLessons, 2); assert.equal(row.progressPercentage, 0);
    assert.equal(row.orderId, order.id, 'existing callers still find rows by order id');
  });

  await t.test('search and filters: title, order reference, state, source, product', async () => {
    assert.equal((await A.list({ q: 'STAGE7_SYNTHETIC_COURSE' })).meta.total, 2);
    assert.equal((await A.list({ q: (await f.models.Order.findById(order.id)).reference })).meta.total, 1);
    assert.equal((await A.list({ q: '[.*(' })).meta.total, 0);
    assert.equal((await A.list({ source: 'free' })).data[0].id, String(free._id));
    assert.equal((await A.list({ productId: d.course.id })).meta.total, 2);
    assert.equal((await A.list({ courseId: d.course.id })).meta.total, 2);
    await f.models.Enrollment.updateOne({ _id: free._id }, { $set: { expiresAt: new Date(now - 1000) } });
    assert.equal((await A.list({ state: 'expired' })).data[0].id, String(free._id));
    assert.equal((await A.list({ state: 'active' })).meta.total, 1);
    await f.models.User.updateOne({ _id: d.student.user._id }, { $set: { status: 'suspended' } });
    assert.equal((await A.list({ state: 'blocked' })).meta.total, 1, 'a suspended student is blocked, not active');
    assert.equal((await A.list({ state: 'active' })).meta.total, 0);
    await f.models.User.updateOne({ _id: d.student.user._id }, { $set: { status: 'active' } });
    await f.models.Enrollment.updateOne({ _id: free._id }, { $set: { expiresAt: new Date(now + 60 * 86400000) } });
    const expiring = await A.list({ state: 'expiring' });
    assert.equal(expiring.meta.total, 1, 'the 7-day paid plan is expiring; the free one now lasts 60 days');
    assert.equal(expiring.data[0].student.email, d.student.user.emailNormalized);
    for (const query of [{ state: 'bogus' }, { source: 'card' }, { kind: 'video' }, { q: { $ne: '' } }]) await assert.rejects(() => A.list(query), { code: 'INVALID_INPUT' });
  });

  await t.test('revoke then restore with a recorded reason; the student regains access', async () => {
    let row = await studentRow();
    const [freeRow] = (await A.list({ source: 'free' })).data;
    await f.learning.revoke(freeRow.id, { kind: 'course', reason: 'Synthetic mistaken revoke', expectedRevision: freeRow.revision }, ctx);
    assert.equal((await A.list({ state: 'revoked' })).data[0].revokeReason, 'Synthetic mistaken revoke');
    assert.equal((await f.learning.enrollment(d.course.id, d.other.auth, false)).canAccess, false);
    const revoked = (await A.list({ state: 'revoked' })).data[0];
    await assert.rejects(() => A.restore(revoked.id, { kind: 'course', reason: '  ', expectedRevision: revoked.revision }, ctx), { code: 'INVALID_INPUT' });
    await assert.rejects(() => A.restore(revoked.id, { kind: 'course', reason: 'x', expectedRevision: revoked.revision - 1 }, ctx), { code: 'REVISION_CONFLICT' });
    await A.restore(revoked.id, { kind: 'course', reason: 'Revoked by mistake', expectedRevision: revoked.revision }, ctx);
    assert.equal((await f.learning.enrollment(d.course.id, d.other.auth, false)).canAccess, true);
    await assert.rejects(() => A.restore(revoked.id, { kind: 'course', reason: 'again', expectedRevision: revoked.revision + 1 }, ctx), { code: 'INVALID_INPUT' });
    const detail = await A.detail(revoked.id, 'course');
    assert.equal(detail.state, 'active');
    assert.ok(detail.history.some(h => h.action === 'enrollment_restored' && h.reason === 'Revoked by mistake'));
    assert.ok(detail.history.some(h => h.action === 'enrollment_revoked'));
    row = await A.detail((await studentRow()).id, 'course');
    assert.equal(row.payments[0].status, 'captured'); assert.equal(row.payments.length, 1);
  });

  await t.test('book access uses the same review with expired state support', async () => {
    const book = await f.models.Book.findById(d.book.id);
    const grant = await f.models.BookEntitlement.create({ userId: d.other.user._id, bookId: book._id, source: 'free', grantedAt: new Date() });
    const result = await A.list({ kind: 'book' });
    assert.equal(result.meta.total, 1); const [row] = result.data;
    assert.equal(row.title, book.publishedSnapshot.title); assert.equal(row.student.email, d.other.user.emailNormalized); assert.equal(row.state, 'active'); assert.equal(row.bookId, String(book._id));
    assert.equal((await A.list({ kind: 'book', state: 'expired' })).meta.total, 0);
    await f.learning.revoke(row.id, { kind: 'book', reason: 'x', expectedRevision: row.revision }, ctx).catch(error => assert.equal(error.code, 'ACCESS_REVOCATION_POLICY_PENDING'));
    await f.models.BookEntitlement.updateOne({ _id: grant._id }, { $set: { revokedAt: new Date(), revokeReason: 'Synthetic' } });
    const revoked = (await A.list({ kind: 'book', state: 'revoked' })).data[0];
    await A.restore(revoked.id, { kind: 'book', reason: 'Restored', expectedRevision: revoked.revision }, ctx);
    assert.equal((await A.list({ kind: 'book', state: 'active' })).meta.total, 1);
  });
});
