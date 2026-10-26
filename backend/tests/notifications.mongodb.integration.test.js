import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { stage8Fixture } from './stage8-fixture.js';
import { createOperationsService } from '../src/modules/operations/operations.js';
import { serve } from './helpers.js';
const name = process.env.KITSS_NOTIFICATIONS_TEST_DB;
test('Stage 16 real isolated MongoDB notification durability and security; synthetic push only', { skip: !name ? 'No isolated notification database supplied' : false, timeout: 180000 }, async t => {
  const sent = []; let outcome = 'sent';
  const f = await stage8Fixture(name, { businessEvents: true, notificationTransport: { configured: true, async send(token, notificationId) { sent.push({ token, notificationId }); return { status: outcome }; } } });
  t.after(() => f.close());
  const student = await f.fixtureUser(['student']), other = await f.fixtureUser(['student']);
  const N = f.notifications, F = N.fcm, ctx = f.ctx, token = 'SYNTHETIC_PUSH_TOKEN_1234567890';
  const publish = async (category = 'general', audience = { kind: 'users', userIds: [String(student.user._id)] }) => {
    const row = await N.mutate(null, { title: 'Synthetic notice', message: '<script>private content</script>', category, link: '/notifications', audience }, ctx);
    return N.publish(row.id, { expectedRevision: row.revision }, ctx);
  };
  let notice;
  await t.test('validated token is session-bound, hidden in DTO and globally unique', async () => {
    const result = await F.saveToken(student.auth, { token, platform: 'web' }, ctx);
    assert.equal(result.saved, true); assert.equal(JSON.stringify(result).includes(token), false);
    await F.saveToken(student.auth, { token }, ctx);
    assert.equal(await F.models.FcmToken.countDocuments({ token }), 1);
    assert.equal((await F.models.FcmToken.findOne({ token })).token, undefined);
    await assert.rejects(F.saveToken(student.auth, { token: '../bad' }, ctx));
    await assert.rejects(F.saveToken(student.auth, { token, userId: String(other.user._id) }, ctx));
  });
  await t.test('another active account cannot take over or delete this device', async () => {
    await assert.rejects(F.saveToken(other.auth, { token }, ctx), { code: 'DEVICE_ALREADY_BOUND' });
    assert.equal((await F.removeToken(other.auth, token)).removed, false);
  });
  await t.test('published audience, read receipts, unread count and idempotent mark-all persist', async () => {
    notice = await publish(); assert.equal((await N.list({}, student.auth)).meta.unreadCount, 1);
    assert.equal((await N.list({}, other.auth)).data.length, 0);
    await assert.rejects(N.mark(notice.id, other.auth), { status: 404 });
    await N.mark(notice.id, student.auth); await N.mark(notice.id, student.auth);
    const list = await N.list({}, student.auth); assert.equal(list.meta.unreadCount, 0);
    await N.markAll({ through: list.meta.through }, student.auth);
    assert.equal(await N.models.NotificationReceipt.countDocuments({ notificationId: notice.id }), 1);
  });
  await t.test('durable delivery jobs deduplicate replays and contain no private message or raw token', async () => {
    await N.tick(); await N.tick(); assert.equal(sent.length, 1);
    const jobs = await f.models.Job.find({ kind: 'notification_push' }).lean();
    assert.equal(jobs.length, 1); assert.equal(jobs[0].state, 'done');
    assert.equal(JSON.stringify(jobs).includes(token), false); assert.equal(JSON.stringify(jobs).includes('private content'), false);
  });
  await t.test('preference opt-out filters both in-app and push delivery', async () => {
    await f.models.User.updateOne({ _id: student.user._id }, { $set: { 'preferences.notification.courseUpdates': false } });
    student.auth.user = await f.models.User.findById(student.user._id);
    await publish('course'); await N.tick(); assert.equal(sent.length, 1);
    assert.equal((await N.list({}, student.auth)).data.length, 1);
  });
  await t.test('provider failures remain pending and recover without losing in-app notices', async () => {
    outcome = 'retry'; const row = await publish(); await N.tick();
    let job = await f.models.Job.findOne({ 'resultSummary.notificationId': row.id });
    assert.equal(job.state, 'pending'); assert.equal(job.lastError, 'PUSH_RETRY');
    assert.ok((await N.list({}, student.auth)).data.some(n => n.id === row.id));
    outcome = 'sent'; await f.models.Job.updateOne({ _id: job._id }, { $set: { availableAt: new Date(0) } });
    await N.tick(); job = await f.models.Job.findById(job._id); assert.equal(job.state, 'done');
  });
  await t.test('expired worker lease is reclaimed and stale acknowledgement cannot own new lease', async () => {
    const row = await publish(); outcome = 'retry'; await N.tick();
    const job = await f.models.Job.findOne({ 'resultSummary.notificationId': row.id });
    await f.models.Job.updateOne({ _id: job._id }, { $set: { state: 'leased', token: 'crashed-worker', leaseUntil: new Date(0) } });
    outcome = 'sent'; await N.tick(); const done = await f.models.Job.findById(job._id);
    assert.equal(done.state, 'done'); assert.notEqual(done.token, 'crashed-worker');
  });
  await t.test('revoked and idle sessions stop delivery; inactive owner can safely rebind', async () => {
    await f.models.Session.updateOne({ _id: student.session._id }, { $set: { revokedAt: new Date() } });
    assert.equal((await F.tokensFor(student.user._id)).length, 0);
    await F.saveToken(other.auth, { token }, ctx); assert.equal((await F.tokensFor(other.user._id)).length, 1);
    await f.models.Session.updateOne({ _id: other.session._id }, { $set: { lastSeenAt: new Date(0) } });
    assert.equal((await F.tokensFor(other.user._id)).length, 0);
    await f.models.Session.updateOne({ _id: other.session._id }, { $set: { lastSeenAt: new Date(), expiresAt: new Date(0) } });
    assert.equal((await F.tokensFor(other.user._id)).length, 0);
    await f.models.Session.updateOne({ _id: other.session._id }, { $set: { expiresAt: new Date(Date.now() + 3600000) } });
    await f.models.User.updateOne({ _id: other.user._id }, { $inc: { securityVersion: 1 } });
    assert.equal((await F.tokensFor(other.user._id)).length, 0);
    await f.models.User.updateOne({ _id: other.user._id }, { $set: { securityVersion: 0 } });
  });
  await t.test('invalid provider tokens are removed without leaking provider errors', async () => {
    outcome = 'invalid_token'; const devices = await F.tokensFor(other.user._id);
    assert.equal((await F.send(devices[0]._id, notice.id)).status, 'invalid_token');
    assert.equal(await F.models.FcmToken.countDocuments({ token }), 0); outcome = 'sent';
  });
  await t.test('business audit events create exactly one durable notice after replay', async () => {
    const event = { _id: randomUUID(), action: 'account_roles_changed', subjectId: other.user.publicId, at: new Date() };
    await f.models.AuditLog.create(event); await N.processBusinessEvents(); await N.processBusinessEvents();
    assert.equal(await N.models.Notification.countDocuments({ sourceEventId: event._id }), 1);
    const row = await N.models.Notification.findOne({ sourceEventId: event._id });
    assert.deepEqual(row.audience.userIds.map(String), [String(other.user._id)]);
  });
  await t.test('database interruption retries business notice creation before marking event done', async () => {
    const event = { _id: randomUUID(), action: 'account_status_changed', subjectId: other.user.publicId, at: new Date() };
    await f.models.AuditLog.create(event); const original = N.models.Notification.updateOne;
    N.models.Notification.updateOne = () => { throw new Error('synthetic database outage'); };
    try { await assert.rejects(N.processBusinessEvents(), /synthetic database outage/); } finally { N.models.Notification.updateOne = original; }
    assert.equal(await f.models.Job.countDocuments({ key: 'notice-event:' + event._id }), 0);
    await N.processBusinessEvents(); assert.equal(await N.models.Notification.countDocuments({ sourceEventId: event._id }), 1);
  });
  await t.test('unsafe links and client-controlled delivery state are rejected', async () => {
    await assert.rejects(N.mutate(null, { title: 'Unsafe', message: 'Unsafe', category: 'general', audience: { kind: 'all_students' }, link: 'https://external.invalid' }, ctx));
    await assert.rejects(N.mutate(null, { title: 'Unsafe', message: 'Unsafe', category: 'general', audience: { kind: 'all_students' }, push: { state: 'queued' } }, ctx));
  });
  const base = await serve(t, f.app());
  await t.test('real HTTP enforces authentication, CSRF and admin permissions', async () => {
    assert.equal((await fetch(base + '/api/v1/me/notifications')).status, 401);
    const headers = { Cookie: 'kitss_student_session=' + other.token };
    assert.equal((await fetch(base + '/api/v1/admin/notifications', { headers })).status, 403);
    assert.equal((await fetch(base + '/api/v1/me/fcm-tokens', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })).status, 403);
    const res = await fetch(base + '/api/v1/me/push-config', { headers }); assert.equal(res.status, 200);
    assert.equal(JSON.stringify(await res.json()).includes(token), false);
  });
  await t.test('live test push is explicitly blocked; no provider call is made', async () => {
    const before = sent.length; await assert.rejects(F.sendTestNotification(), { code: 'LIVE_PUSH_APPROVAL_REQUIRED' }); assert.equal(sent.length, before);
  });
});

test('Committed registration, synthetic capture/fulfillment, refund and result review notices', { skip: !name ? 'No isolated notification database supplied' : false, timeout: 180000 }, async t => {
  const f = await stage8Fixture(name.replace(/.$/, name.endsWith('f') ? 'e' : 'f'), { businessEvents: true, mail: { configured: true, send: async () => {} } });
  t.after(() => f.close()); const d = await f.seed(), N = f.notifications, B = f.service.business;
  const ctx = { ...f.ctx, actorId: d.admin.user.publicId };
  const policy = { status: 'active', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [], privacyApproved: true, documentsApproved: true };
  await B.save({ value: { registrations: { study: policy }, refunds: { approved: true, version: 'synthetic-only', effectiveFrom: '2020-01-01T00:00:00Z', enabled: true, courseWindowDays: 7, outsideWindow: 'deny', evidenceRequired: false, categories: { course_plan: { enabled: true, reasons: ['technical_failure'] } }, accessAfterConfirmedRefund: 'separate_review' } }, expectedRevision: 0, reason: 'Synthetic isolated policies only' }, d.admin.auth, ctx);
  await t.test('registration submission, review, approval and activation each retain accurate messages', async () => {
    let row = await f.service.createApplication({ kind: 'study', applicant: { studentName: 'Synthetic applicant', dob: '1990-01-01' }, idempotencyKey: randomUUID() }, d.student.auth, ctx);
    row = await B.submit(row.id, { expectedRevision: row.revision, declaration: true }, d.student.auth, ctx);
    for (const status of ['pending_verification', 'under_review', 'approved', 'activated']) row = await B.review(row.id, { expectedRevision: row.revision, status, reason: 'Synthetic review only' }, d.admin.auth, ctx);
    await N.tick(); const messages = (await N.list({}, d.student.auth)).data.map(n => n.message);
    for (const status of ['submitted', 'approved', 'activated']) assert.ok(messages.some(m => m.includes('status: ' + status)));
    assert.equal((await f.models.User.findById(d.student.user._id)).roles.includes('admin'), false);
  });
  let courseOrder;
  await t.test('book and coaching capture/fulfillment notices follow verified synthetic payments exactly once', async () => {
    for (const product of [{ kind: 'book', id: d.book.id }, { kind: 'course_plan', id: d.plan.id }]) {
      const order = await f.service.create({ product, idempotencyKey: randomUUID() }, d.student.auth, ctx);
      await N.tick(); assert.equal(await N.models.Notification.countDocuments({ sourceEventId: 'capture:' + order.id }), 0);
      const key = randomUUID(), attempt = await f.service.startAttempt(order.id, { idempotencyKey: key }, d.student.auth, ctx), payment = f.provider.pay(attempt.providerOrderId);
      const evidence = { orderId: order.id, attemptId: key, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) };
      await f.service.verify(evidence, d.student.auth, ctx); await f.service.fulfill(order.id); await N.tick();
      await f.service.verify(evidence, d.student.auth, ctx); await f.service.fulfill(order.id); await N.tick();
      assert.equal(await N.models.Notification.countDocuments({ sourceEventId: 'capture:' + order.id }), 1);
      assert.equal(await N.models.Notification.countDocuments({ sourceEventId: 'fulfillment:' + order.id }), 1);
      const notice = await N.models.Notification.findOne({ sourceEventId: 'capture:' + order.id }); assert.ok(notice.message.startsWith('SIMULATED TEST:'));
      if (product.kind === 'course_plan') courseOrder = order;
    }
    assert.equal(await f.models.BookEntitlement.countDocuments({ userId: d.student.user._id }), 1);
    assert.equal(await f.models.Enrollment.countDocuments({ userId: d.student.user._id }), 1);
  });
  await t.test('refund review never reports provider completion or revokes verified access', async () => {
    await B.refund(courseOrder.id, { reason: 'Synthetic review', reasonCategory: 'technical_failure', idempotencyKey: randomUUID() }, d.student.auth, ctx);
    let row = await f.models.Order.findById(courseOrder.id);
    await B.refundReview(courseOrder.id, { expectedRevision: row.revision, status: 'approved', reason: 'Review only' }, ctx);
    await N.tick(); row = await f.models.Order.findById(courseOrder.id);
    assert.equal(row.refundRequest.providerStatus, 'not_executed'); assert.equal(row.status, 'captured');
    const notice = await N.models.Notification.findOne({ title: 'Refund review update', message: /approved/ }); assert.ok(notice.message.includes('completion has not been confirmed'));
  });
  await t.test('main-admin result review produces notices while official source publication stays blocked', async () => {
    const issuer = await f.results.mutate('issuers', null, { key: 'synthetic-review', type: 'school', name: 'Synthetic', fullName: 'Synthetic isolated source', status: 'active', fieldSchema: [], source: { description: 'Synthetic only', authorizationReference: 'NOT_OFFICIAL' } }, ctx);
    const exam = await f.results.mutate('exams', null, { issuerId: issuer.id, key: 'test', title: 'Synthetic', year: 2026, session: 'TEST' }, ctx);
    let row = await f.models.ResultRecord.create({ examId: exam.id, userId: d.student.user._id, rollNormalized: 'SYNTHETIC', source: { checksum: 'synthetic-checksum', importedBy: d.admin.user.publicId }, status: 'draft' });
    let result = await f.results.changeRecord(String(row._id), 'submit', { expectedRevision: 1, reason: 'Synthetic submission' }, ctx);
    await N.tick(); assert.ok(await N.models.Notification.exists({ message: /requires main-admin review/ }));
    result = await f.results.changeRecord(String(row._id), 'approve', { expectedRevision: result.expectedRevision, reason: 'Synthetic review' }, ctx);
    await N.tick(); assert.ok(await N.models.Notification.exists({ message: /review: approved/ }));
    await assert.rejects(f.results.changeRecord(String(row._id), 'publish', { expectedRevision: result.expectedRevision }, ctx), { code: 'SOURCE_APPROVAL_REQUIRED' });
  });
  await t.test('free access and registration rejection/change requests reflect committed state without paid claims', async () => {
    let book = await f.models.Book.findById(d.book.id);
    let edited = await f.publishing.edit('books', String(book._id), { expectedRevision: book.revision, priceMinor: 0 }, d.admin.auth, ctx);
    await f.publishing.publish('books', edited.id, { expectedRevision: edited.revision, publish: true }, d.admin.auth, ctx);
    await f.service.freeBook(edited.id, d.other.auth, ctx);
    let course = await f.models.Course.findById(d.course.id);
    await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, ctx);
    const plan = await f.models.CoursePlan.findById(d.plan.id);
    await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision, priceMinor: 0 }, d.admin.auth, ctx);
    course = await f.models.Course.findById(d.course.id);
    await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, ctx);
    const ordersBefore = await f.models.Order.countDocuments();
    await f.learning.enrollFree(d.course.id, d.other.auth, ctx);
    assert.equal(await f.models.Order.countDocuments(), ordersBefore);
    for (const status of ['needs_changes', 'rejected']) {
      let row = await f.service.createApplication({ kind: 'study', applicant: { studentName: 'Synthetic applicant', dob: '1990-01-01' }, idempotencyKey: randomUUID() }, d.other.auth, ctx);
      row = await B.submit(row.id, { expectedRevision: row.revision, declaration: true }, d.other.auth, ctx);
      await B.review(row.id, { expectedRevision: row.revision, status, reason: 'Synthetic review' }, d.admin.auth, ctx);
    }
    await N.tick(); const rows = (await N.list({}, d.other.auth)).data;
    for (const text of ['free book access', 'free course enrollment', 'status: needs changes', 'status: rejected']) assert.ok(rows.some(n => n.message.includes(text)), text);
  });
  await t.test('franchise review notice preserves the official affiliation block', async () => {
    const row = await f.models.FranchiseApplication.create({ reference: 'SYNTHETIC-FRANCHISE', ownerKey: String(d.student.user._id), applicantUserId: d.student.user._id, idempotencyKey: randomUUID(), requestHash: 'synthetic', universityId: d.student.user._id, collegeId: d.other.user._id, status: 'pending' });
    await f.institutions.review('franchise', String(row._id), { expectedRevision: row.revision, status: 'approved', reason: 'Synthetic review only; no affiliation' }, ctx);
    await N.tick(); const notice = await N.models.Notification.findOne({ title: 'Franchise review update' });
    assert.ok(notice.message.includes('Official affiliation remains blocked'));
    assert.equal((await f.models.FranchiseApplication.findById(row._id)).affiliationState, 'blocked_pending_policy');
  });
  await t.test('staff invitation and account status changes consume existing committed audit events', async () => {
    const invitation = await f.auth.invite(d.admin.auth, { name: 'Synthetic staff', email: 'notice-staff@example.invalid', permissions: [] }, ctx);
    await N.tick(); const staff = await f.models.User.findOne({ publicId: invitation.id });
    assert.ok(await N.models.Notification.exists({ 'audience.userIds': staff._id, title: 'Account update' }));
    const operations = createOperationsService(f.auth);
    await operations.change(d.other.user.publicId, { expectedRevision: 0, reason: 'Synthetic suspension', status: 'suspended' }, d.admin.auth, ctx, 'status');
    await N.tick(); assert.ok(await N.models.Notification.exists({ 'audience.userIds': d.other.user._id, title: 'Account update' }));
    assert.equal(await f.auth.authenticate(d.other.token, 'student'), null);
  });
  await t.test('in-app notifications operate with Firebase completely absent', async () => {
    assert.equal(N.fcm, undefined); assert.ok((await N.list({}, d.student.auth)).data.length > 0);
    const before = await N.models.Notification.countDocuments(); await N.tick(); assert.equal(await N.models.Notification.countDocuments(), before);
  });
});
