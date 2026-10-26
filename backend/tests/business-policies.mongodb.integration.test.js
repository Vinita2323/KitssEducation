import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { coachingFixture } from './coaching-fixture.js';
import { pdfBytes } from './publishing-fixture.js';
import { serve } from './helpers.js';
import { registrationPolicy } from '../src/modules/commerce/business-policy.js';
import { commerceFixture } from './commerce-fixture.js';

test('explicit fee configuration rejects unset paid fees, ambiguous free amounts and unapproved fields', () => {
  const p = { status: 'active', feeRequired: true, currency: 'INR', documents: [], privacyApproved: true, documentsApproved: true };
  assert.throws(() => registrationPolicy(p));
  assert.throws(() => registrationPolicy({ ...p, amountMinor: 0 }));
  assert.throws(() => registrationPolicy({ ...p, feeRequired: false, amountMinor: 100 }));
  assert.throws(() => registrationPolicy({ ...p, amountMinor: 100, taxRate: 18 }));
  assert.equal(registrationPolicy({ ...p, feeRequired: false, amountMinor: 0 }).amountMinor, 0);
});
const db = process.env.KITSS_STAGE13_TEST_DB;
test('Stage 13 policy workflows, private documents, free/paid access and granular staff permissions: isolated MongoDB/HTTP, fake mail/payment/scanner', { skip: !db ? 'KITSS_STAGE13_TEST_DB unavailable; database workflows not executed' : false, timeout: 360000 }, async t => {
  const messages = [];
  const f = await coachingFixture(db, { mail: { configured: true, send: async item => { messages.push(item); } } }); t.after(() => f.close());
  const d = await f.seed(), url = await serve(t, f.app()), b = f.service.business;
  const csrfResponse = await fetch(url + '/api/v1/auth/csrf'), cookie = csrfResponse.headers.getSetCookie()[0].split(';')[0], csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, { method = 'GET', data, actor = d.admin } = {}) => {
    const response = await fetch(url + '/api/v1' + path, { method, headers: { Origin: f.config.corsOrigins[0], Cookie: [cookie, actor ? (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''].join('; '), 'X-CSRF-Token': csrf, ...(data ? { 'Content-Type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : null };
  };
  let value = { registrations: {} }, configRevision = 0;
  const policy = (fields = {}) => ({ status: 'active', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [], privacyApproved: true, documentsApproved: true, ...fields });
  const save = async () => { const r = await api('/admin/business-policies', { method: 'PATCH', data: { value, expectedRevision: configRevision, reason: 'Synthetic policy acceptance only' } }); assert.equal(r.status, 200, JSON.stringify(r.body)); configRevision = r.body.data.revision; };
  const draft = async (kind = 'study', dob = '1990-01-01') => f.service.createApplication({ kind, applicant: { [kind === 'teacher' ? 'fullName' : 'studentName']: 'Synthetic applicant', dob }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
  const submit = async row => b.submit(row.id, { expectedRevision: row.revision, declaration: true }, d.student.auth, f.ctx);
  const review = async (row, status) => b.review(row.id, { expectedRevision: row.revision, status, reason: 'Synthetic reviewed evidence' }, d.admin.auth, f.ctx);
  const capture = async order => { const k = randomUUID(), attempt = await f.service.startAttempt(order.id, { idempotencyKey: k }, d.student.auth, f.ctx), payment = f.provider.pay(attempt.providerOrderId); await f.service.verify({ orderId: order.id, attemptId: k, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) }, d.student.auth, f.ctx); return payment; };

  await t.test('unset and invalid fees stay blocked; main admin owns policy assignment', async () => {
    const row = await draft(); await assert.rejects(() => submit(row), { code: 'BUSINESS_POLICY_PENDING' });
    const staff = await f.fixtureUser(['admin'], ['settings.read', 'settings.write']);
    assert.equal((await api('/admin/business-policies', { method: 'PATCH', actor: staff, data: { value, expectedRevision: 0, reason: 'Cannot approve policy' } })).status, 403);
    value.registrations = { study: policy(), teacher: policy({ feeRequired: true, amountMinor: 2500 }), tuition: policy({ documents: [{ key: 'qualification', label: 'Approved synthetic document' }] }) }; await save();
    assert.equal((await api('/public/registration-config', { actor: null })).body.data.enabled.study, true);
  });
  await t.test('free registration lifecycle does not alter verified identity or grant staff privileges', async () => {
    let row = await submit(await draft()); assert.equal(row.status, 'submitted'); assert.equal(row.paymentState, 'not_required');
    await assert.rejects(() => review(row, 'activated'));
    row = await review(row, 'pending_verification'); row = await review(row, 'under_review'); row = await review(row, 'approved'); row = await review(row, 'activated');
    assert.equal(row.status, 'activated'); assert.deepEqual((await f.models.User.findById(d.student.user._id)).roles, ['student']);
    assert.equal((await api('/auth/me', { actor: d.student })).status, 200);
    await assert.rejects(() => f.service.editApplication(row.id, { expectedRevision: row.revision, applicant: { studentName: 'Cannot edit activated' } }, d.student.auth, f.ctx));
  });
  await t.test('paid registration approval cannot activate before authentic provider-double capture', async () => {
    let row = await submit(await draft('teacher')); row = await review(row, 'pending_verification'); row = await review(row, 'under_review'); row = await review(row, 'approved');
    await assert.rejects(() => review(row, 'activated'), { code: 'BUSINESS_POLICY_PENDING' });
    const order = await f.service.create({ product: { kind: 'registration_fee', id: row.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx); assert.equal(order.amountMinor, 2500);
    await capture(order); row = f.service.applicationDTO(await f.models.RegistrationApplication.findById(row.id));
    assert.equal(row.paymentState, 'verified'); row = await review(row, 'activated'); assert.equal(row.status, 'activated');
    assert.equal(await f.models.BookEntitlement.countDocuments(), 0);
  });
  await t.test('private scanned document, mandatory verification, rejection/reupload and reviewer-only bytes', async () => {
    let row = await draft('tuition'); await assert.rejects(() => submit(row));
    const asset = await f.media.upload({ purpose: 'registration_document', originalName: 'qualification.pdf', mime: 'application/pdf', stream: Readable.from(await pdfBytes()), idempotencyKey: randomUUID(), auth: d.student.auth, ctx: f.ctx });
    assert.equal(asset.visibility, 'private'); assert.equal(asset.status, 'ready');
    row = await b.attach(row.id, { expectedRevision: row.revision, key: 'qualification', assetId: asset.id }, d.student.auth, f.ctx); row = await submit(row);
    assert.equal((await api('/media/' + asset.id + '/content', { actor: d.other })).status, 404);
    const unrelated = await f.fixtureUser(['admin'], ['media.read']); assert.equal((await api('/media/' + asset.id + '/content', { actor: unrelated })).status, 404);
    assert.equal((await api('/media/' + asset.id + '/metadata', { actor: d.admin })).status, 200);
    row = await review(row, 'pending_verification'); row = await review(row, 'under_review'); await assert.rejects(() => review(row, 'approved'));
    row = await b.review(row.id, { expectedRevision: row.revision, documentKey: 'qualification', documentStatus: 'rejected', reason: 'Please reupload readable evidence' }, d.admin.auth, f.ctx); assert.equal(row.status, 'needs_changes');
    row = await b.attach(row.id, { expectedRevision: row.revision, key: 'qualification', assetId: asset.id }, d.student.auth, f.ctx); row = await submit(row);
    row = await b.review(row.id, { expectedRevision: row.revision, documentKey: 'qualification', documentStatus: 'verified', reason: 'Synthetic document checked' }, d.admin.auth, f.ctx);
    row = await review(row, 'pending_verification'); row = await review(row, 'under_review'); row = await review(row, 'approved'); assert.equal(row.status, 'approved');
    await assert.rejects(() => f.media.remove(asset.id, { expectedRevision: asset.revision }, f.ctx), { code: 'MEDIA_REFERENCED' });
  });
  await t.test('minors need approved versioned guardian consent and reviewer verification; rejection is auditable', async () => {
    let row = await draft('study', '2015-01-01'); await assert.rejects(() => submit(row));
    value.registrations.study = policy({ guardian: { approved: true, version: 'synthetic-v1', text: 'Synthetic guardian consent for isolated tests only' } }); await save();
    row = await b.submit(row.id, { expectedRevision: row.revision, declaration: true, guardianConsent: { guardianName: 'Synthetic guardian', relationship: 'Parent', accepted: true, version: 'synthetic-v1' } }, d.student.auth, f.ctx);
    row = await review(row, 'pending_verification'); row = await review(row, 'under_review'); await assert.rejects(() => review(row, 'approved'));
    row = await b.review(row.id, { expectedRevision: row.revision, guardianVerified: true, reason: 'Synthetic guardian workflow evidence reviewed' }, d.admin.auth, f.ctx);
    row = await review(row, 'rejected'); assert.equal(row.status, 'rejected'); assert.ok(row.history.length);
  });
  await t.test('free book access uses real zero backend price, no orders and no public or foreign grant', async () => {
    const old = await f.models.Book.findById(d.book.id); const edited = await f.publishing.edit('books', d.book.id, { expectedRevision: old.revision, priceMinor: 0 }, d.admin.auth, f.ctx); await f.publishing.publish('books', d.book.id, { expectedRevision: edited.revision, publish: true }, d.admin.auth, f.ctx);
    const orders = await f.models.Order.countDocuments();
    assert.equal((await api('/books/' + d.book.id + '/access', { method: 'POST', actor: null, data: {} })).status, 401);
    const r = await api('/books/' + d.book.id + '/access', { method: 'POST', actor: d.student, data: {} }); assert.equal(r.status, 200, JSON.stringify(r.body));
    await f.service.freeBook(d.book.id, d.student.auth, f.ctx);
    assert.equal(await f.models.Order.countDocuments(), orders); assert.equal(await f.models.BookEntitlement.countDocuments({ userId: d.student.user._id, bookId: d.book.id, source: 'free' }), 1);
    assert.equal((await f.service.ownedBooks(d.student.auth)).length, 1);
    assert.equal(await f.service.canReadAsset(await f.models.MediaAsset.findById(d.book.documentAssetId), d.other.auth), false);
    await f.models.Book.updateOne({ _id: d.book.id }, { $unset: { 'publishedSnapshot.priceMinor': 1 } });
    await assert.rejects(() => f.service.freeBook(d.book.id, d.other.auth, f.ctx));
    assert.equal(await f.service.canReadAsset(await f.models.MediaAsset.findById(d.book.documentAssetId), d.student.auth), false);
    await f.models.Book.updateOne({ _id: d.book.id }, { $set: { 'publishedSnapshot.priceMinor': 0 } });
  });
  await t.test('paid course expiry and new purchase period preserve history and deduplicate old/new effects', async () => {
    const first = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx); await capture(first);
    await assert.rejects(() => f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx), { code: 'ACTIVE_OR_REVOKED_ACCESS' });
    await f.models.Enrollment.updateOne({ userId: d.student.user._id, courseId: d.course.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await f.learning.enrollment(d.course.id, d.student.auth, false)).state, 'expired');
    const second = await f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx); assert.notEqual(first.id, second.id);
    assert.equal((await f.learning.enrollment(d.course.id, d.student.auth, false)).canAccess, false);
    await capture(second); await f.service.fulfill(first.id); await f.service.fulfill(second.id);
    const row = await f.models.Enrollment.findOne({ userId: d.student.user._id, courseId: d.course.id }); assert.equal(String(row.orderId), second.id); assert.equal(row.purchaseHistory.length, 1); assert.equal(String(row.purchaseHistory[0].orderId), first.id);
    assert.equal(await f.models.Enrollment.countDocuments({ userId: d.student.user._id, courseId: d.course.id }), 1);
    assert.equal((await f.learning.enrollment(d.course.id, d.student.auth)).canAccess, true);
  });
  await t.test('free course plan grants audited access without a fabricated paid order', async () => {
    let course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    const plan = await f.models.CoursePlan.findById(d.plan.id); await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision, priceMinor: 0 }, d.admin.auth, f.ctx);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, f.ctx);
    const count = await f.models.Order.countDocuments(); const result = await api('/coaching/courses/' + d.course.id + '/enroll', { actor: d.other, method: 'POST', data: { idempotencyKey: randomUUID() } }); assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.data.source, 'free');
    assert.equal(await f.models.Order.countDocuments(), count); assert.equal((await f.learning.enrollment(d.course.id, d.other.auth)).canAccess, true);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    const reset = await f.models.CoursePlan.findById(d.plan.id); await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: reset.revision, priceMinor: 12345 }, d.admin.auth, f.ctx);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, f.ctx);
    assert.equal((await f.learning.enrollment(d.course.id, d.other.auth, false)).canAccess, false);
  });
  await t.test('refund request/review remains non-executed and preserves capture and access', async () => {
    value.refunds = { approved: true, version: 'synthetic-v1', effectiveFrom: '2020-01-01T00:00:00Z', enabled: true, courseWindowDays: 7, outsideWindow: 'deny', evidenceRequired: false, categories: { course_plan: { enabled: true, reasons: ['technical_failure'] } }, accessAfterConfirmedRefund: 'separate_review' }; await save();
    const order = await f.models.Order.findOne({ userId: d.student.user._id, 'product.kind': 'course_plan' });
    const r = await api('/me/orders/' + order._id + '/refund-requests', { actor: d.student, method: 'POST', data: { reason: 'Synthetic manual review', reasonCategory: 'technical_failure', evidence: 'No real customer data', idempotencyKey: randomUUID() } }); assert.equal(r.status, 201);
    const updated = await f.models.Order.findById(order._id);
    const decision = await api('/admin/orders/' + order._id + '/refund-request', { method: 'PATCH', data: { expectedRevision: updated.revision, status: 'approved', reason: 'Review only' } }); assert.equal(decision.status, 200); assert.equal(decision.body.data.providerStatus, 'not_executed'); assert.equal((await f.models.Order.findById(order._id)).status, 'captured');
    const receipt = await f.service.receipt(String(order._id), d.student.auth); assert.equal(receipt.invoiceDraft.status, 'draft'); assert.equal(receipt.invoiceDraft.complianceApproved, false); assert.ok(receipt.invoiceDraft.verifiedPaymentReference);
  });
  await t.test('exceptional access is permissioned, policy gated, reasoned and never payment-equivalent', async () => {
    const target = await f.fixtureUser(['student']); const row = await b.accessRequest({ userId: String(target.user._id), kind: 'book', resourceId: d.book.id, expiresAt: new Date(Date.now() + 86400000).toISOString(), reason: 'Synthetic exception', idempotencyKey: randomUUID() }, d.admin.auth, f.ctx);
    await assert.rejects(() => b.accessReview(String(row._id), { expectedRevision: row.revision, decision: 'issued', reason: 'Test issuance' }, d.admin.auth, f.ctx), { code: 'MANUAL_GRANT_POLICY_PENDING' });
    value.manualAccess = { approved: true, paidRevocationApproved: false, description: 'Synthetic isolated policy only' }; await save();
    await b.accessReview(String(row._id), { expectedRevision: row.revision, decision: 'issued', reason: 'Test issuance' }, d.admin.auth, f.ctx);
    const grant = await f.models.BookEntitlement.findOne({ userId: target.user._id }); assert.equal(grant.source, 'manual'); assert.equal(grant.orderId, undefined); assert.equal(await b.manualValid(grant), true);
    await assert.rejects(() => f.learning.revoke(String(grant._id), { kind: 'book', expectedRevision: 1, reason: 'No paid revoke policy' }, f.ctx));
    assert.equal((await api('/admin/access-requests', { method: 'POST', actor: d.student, data: {} })).status, 403);
    value.manualAccess.paidRevocationApproved = true; await save();
    await f.learning.revoke(String(grant._id), { kind: 'book', expectedRevision: grant.revision, reason: 'Approved synthetic access revocation' }, f.ctx);
    assert.ok((await f.models.BookEntitlement.findById(grant._id)).revokedAt);
    assert.ok(await f.models.AuditLog.exists({ action: 'book_access_revoked', subjectId: String(grant._id) }));
  });
  await t.test('retention is explicit, legal hold blocks redaction, and file deletion failure stays resumable', async () => {
    value.registrations.tuition.retentionDays = 1; await save();
    let row = await draft('tuition');
    const asset = await f.media.upload({ purpose: 'registration_document', originalName: 'retention.pdf', mime: 'application/pdf', stream: Readable.from(await pdfBytes()), idempotencyKey: randomUUID(), auth: d.student.auth, ctx: f.ctx });
    row = await b.attach(row.id, { expectedRevision: row.revision, key: 'qualification', assetId: asset.id }, d.student.auth, f.ctx); row = await submit(row); row = await review(row, 'rejected');
    row = await b.review(row.id, { expectedRevision: row.revision, legalHold: true, reason: 'Synthetic hold' }, d.admin.auth, f.ctx);
    await f.models.RegistrationApplication.collection.updateOne({ _id: new f.connection.base.Types.ObjectId(row.id) }, { $set: { updatedAt: new Date(Date.now() - 2 * 86400000) } });
    await assert.rejects(() => b.purge(row.id, { expectedRevision: row.revision, reason: 'Must respect hold' }, d.admin.auth, f.ctx));
    row = await b.review(row.id, { expectedRevision: row.revision, legalHold: false, reason: 'Hold resolved in synthetic test' }, d.admin.auth, f.ctx);
    await f.models.RegistrationApplication.collection.updateOne({ _id: new f.connection.base.Types.ObjectId(row.id) }, { $set: { updatedAt: new Date(Date.now() - 2 * 86400000) } });
    const remove = f.storage.delete; f.storage.delete = async () => { throw new Error('Synthetic disk unavailable'); };
    try { await assert.rejects(() => b.purge(row.id, { expectedRevision: row.revision, reason: 'Approved retention cleanup' }, d.admin.auth, f.ctx)); } finally { f.storage.delete = remove; }
    const pending = await f.models.RegistrationApplication.findById(row.id); assert.equal(pending.deletionAssets.length, 1); assert.deepEqual(pending.applicant, {});
    await b.purge(row.id, { expectedRevision: pending.revision, reason: 'Resume exact cleanup intent' }, d.admin.auth, f.ctx);
    assert.equal((await f.models.RegistrationApplication.findById(row.id)).deletionAssets.length, 0); assert.equal((await f.models.MediaAsset.findById(asset.id)).status, 'deleted');
  });
  await t.test('manual franchise review approval requires its own grant and never activates affiliation', async () => {
    await f.institutions.create('taxonomy', { kind: 'institution_type', key: randomUUID(), label: 'Institute' }, f.ctx);
    await f.institutions.create('taxonomy', { kind: 'designation', key: randomUUID(), label: 'Owner' }, f.ctx);
    const state = await f.institutions.create('taxonomy', { kind: 'state', key: randomUUID(), label: 'Synthetic State' }, f.ctx);
    await f.institutions.create('taxonomy', { kind: 'district', key: randomUUID(), label: 'Synthetic District', parentIds: [state.id] }, f.ctx);
    let university = await f.institutions.create('university', { name: 'Synthetic University', shortName: 'SYN' + randomUUID().slice(0, 5) }, f.ctx);
    university = await f.institutions.edit('university', university.id, { expectedRevision: university.revision, status: 'active' }, f.ctx);
    let college = await f.institutions.create('college', { universityId: university.id, stateId: state.id, name: 'Synthetic College', code: randomUUID(), category: 'Institute', address: 'Synthetic address', city: 'Synthetic City', district: 'Synthetic District', verification: { state: 'verified', source: 'Synthetic test evidence only' } }, f.ctx);
    college = await f.institutions.edit('college', college.id, { expectedRevision: college.revision, status: 'active' }, f.ctx);
    const application = await f.institutions.createDraft({ universityId: university.id, collegeId: college.id, institution: { name: 'Synthetic institute', type: 'Institute' }, programsOffered: ['Synthetic programme'], contact: { person: 'Synthetic applicant', designation: 'Owner', email: d.student.user.emailNormalized, mobile: '9000000000' }, location: { address: 'Synthetic address', city: 'Synthetic City', stateId: state.id, pincode: '100000' }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
    const submitted = await f.institutions.submitFranchise(application.id, { expectedRevision: application.revision, declaration: { version: 'franchise-v1', accepted: true } }, d.student.auth, application.draftCapability, f.ctx);
    const reviewer = await f.fixtureUser(['admin'], ['franchises.read', 'franchises.review']);
    assert.equal((await api('/admin/franchise-applications/' + application.id + '/status', { actor: reviewer, method: 'PATCH', data: { expectedRevision: submitted.revision, status: 'approved', reason: 'Cannot approve' } })).status, 403);
    const approved = await api('/admin/franchise-applications/' + application.id + '/status', { method: 'PATCH', data: { expectedRevision: submitted.revision, status: 'approved', reason: 'Manual review accepted, official affiliation still blocked' } });
    assert.equal(approved.status, 200, JSON.stringify(approved.body)); assert.equal(approved.body.data.status, 'approved'); assert.equal(approved.body.data.affiliationState, 'blocked_pending_policy'); assert.equal((await f.models.College.findById(college.id)).revision, college.revision);
  });
  await t.test('main admin invitation/password/OTP creates granular staff; forbidden actions and escalation denied', async () => {
    const email = randomUUID() + '@example.invalid';
    const invited = await api('/admin/users/invitations', { method: 'POST', data: { name: 'Synthetic subadmin', email, permissions: ['books.read', 'books.edit', 'accounts.read'] } }); assert.equal(invited.status, 201);
    const invitation = messages.find(m => m.to === email && m.purpose === 'invite'); const [challengeId, token] = invitation.link.split('#')[1].split('.');
    const password = 'Synthetic-only-password-' + randomUUID();
    const accepted = await api('/auth/invitations/accept', { actor: null, method: 'POST', data: { challengeId, token, newPassword: password } }); assert.equal(accepted.status, 200);
    const verifyMail = messages.find(m => m.to === email && m.purpose === 'verify'); assert.equal((await api('/auth/activate', { actor: null, method: 'POST', data: { challengeId: accepted.body.data.challengeId, otp: verifyMail.code } })).status, 200);
    const login = await f.auth.login({ identifier: email, password, kind: 'admin' }, f.ctx); const user = await f.models.User.findOne({ emailNormalized: email }); const staff = { user, token: login.token };
    assert.equal((await api('/admin/books', { actor: staff })).status, 200);
    assert.equal((await api('/admin/books', { actor: staff, method: 'POST', data: { title: 'Cannot create' } })).status, 403);
    assert.equal((await api('/admin/books/' + d.book.id + '/publish', { actor: staff, method: 'POST', data: { expectedRevision: 1, publish: true } })).status, 403);
    assert.equal((await api('/admin/users/' + d.admin.user.publicId + '/roles', { actor: staff, method: 'PATCH', data: { roles: ['super_admin'], permissions: [], reason: 'Escalation attempt', expectedRevision: 0 } })).status, 403);
    const change = await api('/admin/users/' + user.publicId + '/roles', { method: 'PATCH', data: { roles: ['admin'], permissions: ['books.read'], reason: 'Revoke edit grant', expectedRevision: 0 } }); assert.equal(change.status, 200);
    assert.equal((await api('/admin/books', { actor: staff })).status, 401);
    const relogin = await f.auth.login({ identifier: email, password, kind: 'admin' }, f.ctx); staff.token = relogin.token;
    assert.equal((await api('/admin/books', { actor: staff })).status, 200);
    assert.equal((await api('/admin/books/' + d.book.id, { actor: staff, method: 'PATCH', data: { expectedRevision: 1, title: 'Cannot edit now' } })).status, 403);
    assert.equal((await api('/admin/users/' + user.publicId + '/status', { method: 'PATCH', data: { status: 'suspended', reason: 'Disable synthetic staff', expectedRevision: 1 } })).status, 200);
    assert.equal((await api('/admin/books', { actor: staff })).status, 401);
    assert.equal((await api('/admin/users/' + user.publicId + '/status', { method: 'PATCH', data: { status: 'active', reason: 'Restore synthetic staff', expectedRevision: 2 } })).status, 200);
    assert.equal((await api('/admin/books', { actor: staff })).status, 401);
    assert.equal((await f.models.User.findById(user._id)).roles.includes('super_admin'), false);
    assert.ok(await f.models.AuditLog.countDocuments({ action: 'account_roles_changed', subjectId: user.publicId }));
    assert.ok((await f.models.User.findById(user._id)).lastLoginAt);
    const audit = await f.models.AuditLog.findOne({ action: 'account_roles_changed', subjectId: user.publicId });
    assert.deepEqual(audit.permissionChange.after.toObject(), ['books.read']);
    await f.models.Session.collection.updateOne({ _id: d.admin.session._id }, { $set: { createdAt: new Date(Date.now() - 16 * 60000) } });
    assert.equal((await api('/admin/users/' + user.publicId + '/roles', { method: 'PATCH', data: { roles: ['admin'], permissions: [], reason: 'Expired recent authentication', expectedRevision: 3 } })).status, 403);
    await f.models.Session.collection.updateOne({ _id: d.admin.session._id }, { $set: { createdAt: new Date() } });
  });
  await t.test('known legacy uniqueness constraints are replaced safely and startup reruns preserve records', async () => {
    const isolated = await commerceFixture('kitss_stage10_test_' + randomUUID().replaceAll('-', '').slice(0, 16));
    try {
      const O = isolated.models.Order;
      await O.collection.createIndex({ userId: 1, 'product.kind': 1, 'product.id': 1 }, { unique: true });
      await O.collection.createIndex({ userId: 1, 'product.courseId': 1 }, { unique: true, partialFilterExpression: { 'product.kind': 'course_plan' } });
      await isolated.models.BookEntitlement.collection.createIndex({ orderId: 1 }, { unique: true });
      const userId = new f.connection.base.Types.ObjectId(), courseId = new f.connection.base.Types.ObjectId(), planId = new f.connection.base.Types.ObjectId();
      const first = await O.create({ reference: 'Synthetic-' + randomUUID(), userId, product: { kind: 'course_plan', id: planId, courseId }, amountMinor: 100, currency: 'INR', provider: 'fake', providerScope: 'isolated', paymentMode: 'test', simulated: true, idempotencyKey: randomUUID() });
      await isolated.service.initialize();
      assert.equal(String((await O.findById(first._id))._id), String(first._id));
      await O.create({ reference: 'Synthetic-' + randomUUID(), userId, product: { kind: 'course_plan', id: planId, courseId, purchaseSlot: 'explicit-expired-period' }, amountMinor: 100, currency: 'INR', provider: 'fake', providerScope: 'isolated', paymentMode: 'test', simulated: true, idempotencyKey: randomUUID() });
      await isolated.service.initialize(); assert.equal(await O.countDocuments(), 2);
      assert.equal((await O.collection.indexes()).some(i => i.name === 'unique_course_purchase_period' && i.unique), true);
    } finally { await isolated.close(); }
  });
});
