import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { pdfBytes } from './publishing-fixture.js';
import { randomUUID } from 'node:crypto';
import { accessExpiry, validDuration } from '../src/utils/accessDuration.js';
import { inputFor } from '../src/modules/coaching/validation.js';
import { registrationPolicy } from '../src/modules/commerce/business-policy.js';
import { refundPolicy, franchisePolicy, franchiseFeeStatus, invoicePolicy } from '../src/modules/commerce/policy-settings.js';
import { permissionPresets, presetSelection } from '../../frontend/src/modules/admin/components/permissionPresets.js';
import { stage8Fixture } from './stage8-fixture.js';
import { serve } from './helpers.js';

test('calendar months clamp end-of-month and leap-year dates while preserving UTC clock', () => {
  for (const [start, months, expected] of [['2024-02-29',12,'2025-02-28'],['2025-01-31',1,'2025-02-28'],['2024-01-31',1,'2024-02-29'],['2025-08-31',6,'2026-02-28'],['2023-02-28',12,'2024-02-28']]) {
    assert.equal(accessExpiry(new Date(start + 'T12:34:56.789Z'), { durationMonths: months }).toISOString(), expected + 'T12:34:56.789Z');
  }
  assert.equal(accessExpiry(new Date('2024-02-29T00:00:00Z'), { durationDays: 365 }).toISOString(), '2025-02-28T00:00:00.000Z');
  assert.equal(validDuration({ durationDays: 7, durationMonths: 12 }), false);
  assert.throws(() => accessExpiry(new Date(), {}));
});
test('only new paid plans receive twelve-month default; legacy days and explicit overrides remain', () => {
  assert.equal(inputFor('plans', { name: 'Paid', priceMinor: 1 }, true).fields.durationMonths, 12);
  assert.equal(inputFor('plans', { name: 'Paid', priceMinor: 1, durationDays: 7 }, true).fields.durationMonths, undefined);
  assert.equal(inputFor('plans', { name: 'Free', priceMinor: 0 }, true).fields.durationMonths, undefined);
  assert.equal(inputFor('plans', { expectedRevision: 1, priceMinor: 2 }, false).fields.durationMonths, undefined);
  assert.throws(() => inputFor('plans', { name: 'Ambiguous', durationDays: 1, durationMonths: 1 }, true));
});
test('registration optional documents, explicit disable and conservative guardian configuration', () => {
  const p = registrationPolicy({ status: 'active', enabled: false, version: 'v1', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [{ key: 'qualification', label: 'Optional qualification', required: false }], privacyApproved: true, documentsApproved: true });
  assert.throws(() => registrationPolicy({ ...p, upload: { mime: ['text/html'], maxBytes: 1 } }));
  assert.throws(() => registrationPolicy({ ...p, upload: { mime: ['application/pdf'], maxBytes: 10485761 } }));
  assert.equal(p.enabled, false); assert.equal(p.documents[0].required, false);
  assert.throws(() => registrationPolicy({ ...p, guardian: { approved: true, version: '', text: '' } }));
});
const refund = () => ({ approved: true, version: 'synthetic-v1', effectiveFrom: '2020-01-01T00:00:00Z', enabled: true, outsideWindow: 'deny', evidenceRequired: false, categories: { course_plan: { enabled: true, reasons: ['technical_failure'] }, book: { enabled: true, reasons: ['duplicate_charge', 'technical_failure', 'inaccessible_content'] } }, accessAfterConfirmedRefund: 'separate_review' });
const franchise = () => ({ approved: true, version: 'synthetic-v1', effectiveFrom: '2020-01-01T00:00:00Z', joining: { enabled: true, amountMinor: 100, currency: 'INR' }, renewal: { enabled: true, amountMinor: 200, currency: 'INR' }, dueRule: 'activation_anniversary', requirements: ['Synthetic reviewed evidence'], graceDays: 3 });
test('refund and franchise settings reject incomplete approval and invented financial fields', () => {
  assert.equal(refundPolicy(refund()).courseWindowDays, 7);
  assert.throws(() => refundPolicy({ ...refund(), version: '' }));
  assert.throws(() => refundPolicy({ ...refund(), taxRate: 18 }));
  assert.throws(() => franchisePolicy({ ...franchise(), joining: { enabled: true, currency: 'INR' } }));
  assert.equal(franchisePolicy({ ...franchise(), joining: { enabled: false, currency: 'INR' } }).joining.enabled, false);
});
test('annual franchise projection clamps anniversaries and cannot activate or extend affiliation', () => {
  const p = franchise();
  assert.equal(franchiseFeeStatus(p).state, 'awaiting_approved_activation');
  const status = franchiseFeeStatus(p, { activationAt: '2024-02-29T00:00:00Z' }, new Date('2025-03-01T00:00:00Z'));
  assert.equal(status.dueAt.toISOString(), '2025-02-28T00:00:00.000Z');
  assert.equal(status.state, 'grace');
  assert.equal(franchiseFeeStatus(p, { activationAt: '2024-02-29T00:00:00Z' }, new Date('2025-03-05T00:00:00Z')).state, 'due');
  assert.equal(status.affiliationState, 'blocked_pending_policy'); assert.equal(status.paymentCollectionEnabled, false);
  assert.equal(franchiseFeeStatus({ ...p, renewal: { enabled: false, currency: 'INR' } }).state, 'renewal_disabled');
});
test('tax metadata requires explicit identity and never invents tax registration', () => {
  assert.deepEqual(invoicePolicy({ taxRegistrationStatus: 'undecided' }), { taxRegistrationStatus: 'undecided' });
  assert.throws(() => invoicePolicy({ taxConfigurationApproved: true }));
  assert.throws(() => invoicePolicy({ gstin: 'invalid' }));
});
test('permission presets are allowlisted editable selections without privileged grants', () => {
  const forbidden = ['accounts.roles.manage', 'settings.write', 'results.publish', 'access.issue', 'payments.refund'];
  for (const [name, grants] of Object.entries(permissionPresets)) {
    assert.equal(grants.some(p => forbidden.includes(p)), false);
    assert.deepEqual(presetSelection(name, []), []);
    assert.deepEqual(presetSelection(name, grants), grants);
  }
});

const db = process.env.KITSS_STAGE14_TEST_DB;
test('Stage 14 real isolated MongoDB and HTTP acceptance; synthetic payments, no external calls', { skip: !db ? 'KITSS_STAGE14_TEST_DB unavailable; database acceptance not executed' : false, timeout: 360000 }, async t => {
  const f = await stage8Fixture(db); t.after(() => f.close());
  const d = await f.seed(), b = f.service.business, ctx = { ...f.ctx, actorId: d.admin.user.publicId };
  const save = async fields => { const row = await b.settings(); return b.save({ value: { ...row.value, ...fields }, expectedRevision: row.revision, reason: 'Synthetic Stage 14 acceptance only' }, d.admin.auth, ctx); };
  const capture = async order => { const k = randomUUID(), attempt = await f.service.startAttempt(order.id, { idempotencyKey: k }, d.student.auth, ctx), payment = f.provider.pay(attempt.providerOrderId); await f.service.verify({ orderId: order.id, attemptId: k, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) }, d.student.auth, ctx); };
  let paidCourse, bookOrder;
  await t.test('policy revisions, audit history, disabled category and optional document submission', async () => {
    const p = { status: 'active', enabled: false, version: 'v1', feeRequired: false, amountMinor: 0, currency: 'INR', privacyApproved: true, documentsApproved: true, documents: [{ key: 'qualification', label: 'Optional', required: false }], upload: { mime: ['application/pdf'], maxBytes: 1 } };
    await save({ registrations: { study: p } }); await assert.rejects(() => b.policy('study'));
    await save({ registrations: { study: { ...p, enabled: true } } });
    const draft = await f.service.createApplication({ kind: 'study', applicant: { studentName: 'Synthetic', dob: '1990-01-01' }, idempotencyKey: randomUUID() }, d.student.auth, ctx);
    const asset = await f.media.upload({ purpose: 'registration_document', originalName: 'synthetic.pdf', mime: 'application/pdf', stream: Readable.from(await pdfBytes()), idempotencyKey: randomUUID(), auth: d.student.auth, ctx });
    await assert.rejects(() => b.attach(draft.id, { expectedRevision: draft.revision, key: 'qualification', assetId: asset.id }, d.student.auth, ctx), { code: 'INVALID_INPUT' });
    const submitted = await b.submit(draft.id, { expectedRevision: draft.revision, declaration: true }, d.student.auth, ctx);
    assert.equal(submitted.status, 'submitted');
    assert.equal((await b.settings()).policyHistory.length, 2);
    assert.equal((await b.settings()).policyHistory[0].value.registrations.study.enabled, false);
    assert.equal((await b.settings()).policyHistory[1].value.registrations.study.enabled, true);
    await assert.rejects(() => b.save({ value: {}, expectedRevision: 0, reason: 'Stale' }, d.admin.auth, ctx));
  });
  await t.test('paid book capture grants lifetime rights exactly once', async () => {
    bookOrder = await f.service.create({ product: { kind: 'book', id: d.book.id }, idempotencyKey: randomUUID() }, d.student.auth, ctx);
    await capture(bookOrder); await f.service.fulfill(bookOrder.id);
    const rights = await f.models.BookEntitlement.findOne({ orderId: bookOrder.id });
    assert.equal(rights.source, 'purchase'); assert.equal(rights.expiresAt == null, true);
    assert.equal(await f.models.BookEntitlement.countDocuments({ orderId: bookOrder.id }), 1);
  });
  await t.test('new paid plan defaults to calendar months and captured snapshot fulfills once', async () => {
    let course = await f.models.Course.findById(d.course.id);
    await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, ctx);
    const plan = await f.learning.mutate('plans', null, d.course.id, { name: 'Twelve-month synthetic plan', priceMinor: 200, status: 'active', rulesApproved: true, eligibility: 'verified_account', renewalApproved: false }, d.admin.auth, ctx);
    assert.equal(plan.durationMonths, 12); assert.equal((await f.models.CoursePlan.findById(d.plan.id)).durationDays, 7);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, ctx);
    paidCourse = await f.service.create({ product: { kind: 'course_plan', id: plan.id }, idempotencyKey: randomUUID() }, d.student.auth, ctx);
    await capture(paidCourse); await f.service.fulfill(paidCourse.id);
    const order = await f.models.Order.findById(paidCourse.id), enrollment = await f.models.Enrollment.findOne({ orderId: paidCourse.id });
    assert.equal(order.product.durationMonths, 12);
    assert.equal(enrollment.expiresAt.toISOString(), accessExpiry(order.capturedAt, { durationMonths: 12 }).toISOString());
    assert.equal(await f.models.Enrollment.countDocuments({ orderId: paidCourse.id }), 1);
  });
  await t.test('refund requires approved effective policy and eligible category', async () => {
    await assert.rejects(() => b.refund(paidCourse.id, { reason: 'Synthetic', reasonCategory: 'technical_failure', idempotencyKey: randomUUID() }, d.student.auth, ctx));
    await save({ refunds: refund() });
    await assert.rejects(() => b.refund(paidCourse.id, { reason: 'Synthetic', reasonCategory: 'arbitrary', idempotencyKey: randomUUID() }, d.student.auth, ctx));
  });
  await t.test('outside seven-day capture window rejects; approved exception permits manual review only', async () => {
    await f.models.Order.updateOne({ _id: paidCourse.id }, { $set: { capturedAt: new Date(Date.now() - 8 * 86400000) } });
    const input = { reason: 'Synthetic technical failure', reasonCategory: 'technical_failure', idempotencyKey: randomUUID() };
    await assert.rejects(() => b.refund(paidCourse.id, input, d.student.auth, ctx));
    await save({ refunds: { ...refund(), outsideWindow: 'manual_review' } });
    const row = await b.refund(paidCourse.id, input, d.student.auth, ctx);
    assert.equal(row.eligibility.outsideWindow, true); assert.equal(row.providerStatus, 'not_executed');
    const order = await f.models.Order.findById(paidCourse.id);
    await b.refundReview(paidCourse.id, { expectedRevision: order.revision, status: 'approved', reason: 'Review only' }, ctx);
    assert.equal((await f.models.Order.findById(paidCourse.id)).status, 'captured');
    assert.equal((await f.models.Enrollment.findOne({ orderId: paidCourse.id })).revokedAt == null, true);
    assert.equal((await b.refund(paidCourse.id, input, d.student.auth, ctx)).status, 'approved');
  });
  await t.test('inside-window book request preserves verified capture and draft invoice', async () => {
    const request = await b.refund(bookOrder.id, { reason: 'Synthetic inaccessible content', reasonCategory: 'inaccessible_content', idempotencyKey: randomUUID() }, d.student.auth, ctx);
    assert.equal(request.eligibility.outsideWindow, false);
    await save({ invoice: { sellerName: 'Synthetic legal metadata', sellerAddress: 'Synthetic address', businessType: 'Owner supplied synthetic', taxRegistrationStatus: 'unregistered', financialPolicyVersion: 'v1', taxConfigurationApproved: true } });
    const receipt = await f.service.receipt(bookOrder.id, d.student.auth);
    assert.equal(receipt.invoiceDraft.officialTaxInvoice, false); assert.equal(receipt.invoiceDraft.taxFields, null);
    assert.equal((await f.models.BookEntitlement.findOne({ orderId: bookOrder.id })).revokedAt == null, true);
  });
  await t.test('independent franchise fee settings persist with history and cannot activate affiliation', async () => {
    await save({ franchise: franchise() });
    const fees = await b.franchiseFees(); assert.equal(fees.joining.amountMinor, 100); assert.equal(fees.renewal.amountMinor, 200); assert.equal(fees.affiliationState, 'blocked_pending_policy');
    await save({ franchise: { ...franchise(), joining: { enabled: false, currency: 'INR' } } });
    assert.equal((await b.franchiseFees()).joining.enabled, false); assert.equal((await b.franchiseFees()).renewal.enabled, true);
  });
  await t.test('results submission, main-only review, rejection/resubmission and source gate via real HTTP', async () => {
    const issuer = await f.models.ResultIssuer.create({ key: randomUUID(), type: 'school', name: 'Synthetic', fullName: 'Synthetic test issuer', status: 'active', source: { authorizationReference: 'SYNTHETIC_ISOLATED_ONLY' } });
    const exam = await f.models.Exam.create({ issuerId: issuer._id, key: randomUUID(), title: 'Synthetic exam', year: 2026, status: 'published' });
    let record = await f.models.ResultRecord.create({ examId: exam._id, rollNormalized: 'SYNTHETIC', userId: d.student.user._id, revision: 1, source: { checksum: 'synthetic-only' }, __v: 0 });
    const staff = await f.fixtureUser(['admin'], ['results.manage','results.read','results.publish']);
    const url = await serve(t, f.app()), csrfResponse = await fetch(url + '/api/v1/auth/csrf'), cookie = csrfResponse.headers.getSetCookie()[0].split(';')[0], csrf = (await csrfResponse.json()).data.csrfToken;
    const call = async (action, actor, revision) => fetch(url + '/api/v1/admin/results/records/' + record._id + '/' + action, { method: 'POST', headers: { Origin: f.config.corsOrigins[0], Cookie: cookie + '; kitss_staff_session=' + actor.token, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: revision, reason: 'Synthetic review evidence' }) });
    assert.equal((await call('publish', staff, 1)).status, 403);
    assert.equal((await call('submit', staff, 1)).status, 200);
    assert.equal((await call('approve', staff, 2)).status, 403);
    assert.equal((await call('reject', d.admin, 2)).status, 200);
    assert.equal((await call('submit', staff, 3)).status, 200);
    assert.equal((await call('approve', d.admin, 4)).status, 200);
    assert.equal((await call('approve', d.admin, 4)).status, 409);
    const publish = await call('publish', d.admin, 5); assert.equal(publish.status, 409); assert.equal((await publish.json()).error.code, 'SOURCE_APPROVAL_REQUIRED');
    assert.equal((await f.results.list('records', { reviewStatus: 'approved' })).data.length, 1);
    record = await f.models.ResultRecord.findById(record._id); assert.equal(record.status, 'draft');
    const actor = await f.models.User.findById(staff.user._id); actor.permissions = []; actor.securityVersion += 1; await actor.save();
    assert.equal((await call('submit', staff, 5)).status, 401);
  });
});
