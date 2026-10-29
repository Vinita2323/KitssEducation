import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { coachingFixture } from './coaching-fixture.js';

const dbName = process.env.KITSS_COACHING_LIFECYCLE_TEST_DB;
test('coaching lifecycle: live edits, early renewal, off-sale access, late payment, removal and restore', { skip: !dbName ? 'No KITSS_COACHING_LIFECYCLE_TEST_DB; real coaching lifecycle tests not executed' : false, timeout: 300000 }, async t => {
  const f = await coachingFixture(dbName); t.after(() => f.close());
  const d = await f.seed(), L = f.learning, ctx = f.ctx;
  const course = () => f.models.Course.findById(d.course.id);
  const order = async actor => f.service.create({ product: { kind: 'course_plan', id: d.plan.id }, idempotencyKey: randomUUID() }, actor.auth, ctx);
  const pay = async (actor, value) => {
    const key = randomUUID(), attempt = await f.service.startAttempt(value.id, { idempotencyKey: key }, actor.auth, ctx);
    return async () => { const payment = f.provider.pay(attempt.providerOrderId); await f.service.verify({ orderId: value.id, attemptId: key, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) }, actor.auth, ctx); await f.service.fulfill(value.id); };
  };
  const enrollment = actor => f.models.Enrollment.findOne({ userId: actor.user._id, courseId: d.course.id });
  await (await pay(d.student, await order(d.student)))();

  await t.test('admin rows report stats and pending course changes', async () => {
    let row = await L.adminGet('courses', d.course.id);
    assert.equal(row.publication.everPublished, true); assert.equal(row.publication.changesPending, false); assert.deepEqual(row.publication.liveSectionKeys, ['section-1']);
    assert.deepEqual(row.stats.lessons, { total: 2, published: 2 }); assert.equal(row.stats.activeStudents, 1); assert.equal(row.stats.activePlans[0].priceMinor, 12345);
    await L.mutate('courses', d.course.id, null, { expectedRevision: row.revision, description: 'Edited while live' }, d.admin.auth, ctx);
    row = await L.adminGet('courses', d.course.id); assert.equal(row.publication.changesPending, true);
    assert.equal((await L.publicDTO(await course())).description, 'Isolated generated test content', 'students keep the published version');
    await L.publish(d.course.id, { expectedRevision: row.revision, publish: true }, d.admin.auth, ctx);
    assert.equal((await L.adminGet('courses', d.course.id)).publication.changesPending, false);
    assert.equal((await L.publicDTO(await course())).description, 'Edited while live');
  });

  await t.test('lessons and plans of a live course are edited in place behind guards', async () => {
    let lesson = await f.models.Lesson.findById(d.lesson.id);
    await L.mutate('lessons', d.lesson.id, d.course.id, { expectedRevision: lesson.revision, title: 'LIVE EDITED LESSON' }, d.admin.auth, ctx);
    assert.equal((await L.lesson(d.course.id, d.lesson.id, d.student.auth)).title, 'LIVE EDITED LESSON');
    const preview = await f.models.Lesson.findById(d.preview.id);
    await L.mutate('lessons', d.preview.id, d.course.id, { expectedRevision: preview.revision }, d.admin.auth, ctx, true);
    lesson = await f.models.Lesson.findById(d.lesson.id);
    await assert.rejects(() => L.mutate('lessons', d.lesson.id, d.course.id, { expectedRevision: lesson.revision }, d.admin.auth, ctx, true), { code: 'INVALID_INPUT' });
    await assert.rejects(() => L.mutate('lessons', d.lesson.id, d.course.id, { expectedRevision: lesson.revision, status: 'draft' }, d.admin.auth, ctx), { code: 'INVALID_INPUT' });
    const plan = await f.models.CoursePlan.findById(d.plan.id);
    await assert.rejects(() => L.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision }, d.admin.auth, ctx, true), { code: 'INVALID_INPUT' });
    let row = await course();
    await L.mutate('courses', d.course.id, null, { expectedRevision: row.revision, syllabus: [...row.syllabus.map(s => ({ key: s.key, title: s.title, sortOrder: s.sortOrder })), { key: 'new-section', title: 'New section', sortOrder: 5 }] }, d.admin.auth, ctx);
    await assert.rejects(() => L.mutate('lessons', null, d.course.id, { title: 'NOT YET LIVE', subjectKey: 'new-section', sortOrder: 9, content: 'Synthetic', status: 'published' }, d.admin.auth, ctx), /not live yet/);
    const draftLesson = await L.mutate('lessons', null, d.course.id, { title: 'DRAFT IN NEW SECTION', subjectKey: 'new-section', sortOrder: 9, content: 'Synthetic', status: 'draft' }, d.admin.auth, ctx);
    row = await course(); await L.publish(d.course.id, { expectedRevision: row.revision, publish: true }, d.admin.auth, ctx);
    const published = await L.mutate('lessons', draftLesson.id, d.course.id, { expectedRevision: draftLesson.revision, status: 'published' }, d.admin.auth, ctx);
    assert.equal(published.status, 'published');
  });

  await t.test('early renewal extends the current period without a gap; one order per period', async () => {
    const before = await enrollment(d.student);
    const renewal = await order(d.student);
    assert.equal(renewal.product.purchaseSlot, String(before._id) + ':' + before.expiresAt.toISOString());
    await assert.rejects(() => order(d.student), { code: 'EXISTING_COURSE_ORDER' });
    await (await pay(d.student, renewal))();
    const after = await enrollment(d.student);
    assert.equal(after.startsAt.getTime(), before.startsAt.getTime());
    assert.equal(after.expiresAt.getTime() - before.expiresAt.getTime(), 7 * 86400000);
    assert.equal(after.purchaseHistory.length, 1); assert.equal(String(after.orderId), renewal.id);
    assert.equal((await L.enrollment(d.course.id, d.student.auth)).canAccess, true);
  });

  await t.test('off sale: no new sales, enrolled students keep learning, late payments are delivered', async () => {
    const late = await order(d.other), complete = await pay(d.other, late);
    const row = await course(); await L.publish(d.course.id, { expectedRevision: row.revision, publish: false }, d.admin.auth, ctx);
    await assert.rejects(() => L.plans(d.course.id), { code: 'NOT_FOUND' });
    await assert.rejects(() => L.courseFor(d.course.id, null), { code: 'NOT_FOUND' });
    const stranger = await f.fixtureUser(['student']);
    await assert.rejects(() => L.courseFor(d.course.id, stranger.auth), { code: 'NOT_FOUND' });
    await assert.rejects(() => order(stranger), { code: 'NOT_FOUND' });
    assert.equal((await L.publicDTO(await L.courseFor(d.course.id, d.student.auth))).onSale, false);
    assert.ok((await L.syllabus(d.course.id, d.student.auth)).lessons.length >= 1);
    assert.equal((await L.lesson(d.course.id, d.lesson.id, d.student.auth)).title, 'LIVE EDITED LESSON');
    assert.equal((await L.enrollments({}, d.student.auth)).data[0].course.title, row.publishedSnapshot.title);
    await complete();
    assert.equal((await L.enrollment(d.course.id, d.other.auth)).canAccess, true, 'paid before going off sale, delivered after');
  });

  await t.test('removed courses keep enrolled access and can be restored as drafts', async () => {
    let row = await course();
    const removed = await L.mutate('courses', d.course.id, null, { expectedRevision: row.revision }, d.admin.auth, ctx, true);
    assert.equal(removed.status, 'archived');
    assert.equal((await L.lesson(d.course.id, d.lesson.id, d.student.auth)).id, d.lesson.id);
    await assert.rejects(() => L.mutate('courses', d.course.id, null, { expectedRevision: removed.revision, title: 'NOPE' }, d.admin.auth, ctx), { code: 'ARCHIVED' });
    const restored = await L.restore('courses', d.course.id, null, { expectedRevision: removed.revision }, ctx);
    assert.equal(restored.status, 'draft'); assert.equal(restored.publication.everPublished, true);
    await assert.rejects(() => L.restore('courses', d.course.id, null, { expectedRevision: restored.revision }, ctx), { code: 'INVALID_INPUT' });
    row = await course(); await L.publish(d.course.id, { expectedRevision: row.revision, publish: true }, d.admin.auth, ctx);
    assert.equal((await course()).status, 'published');
  });

  await t.test('category spacing is normalised', async () => {
    const created = await L.mutate('courses', null, null, { title: 'CATEGORY SPACING', category: '  Board   Exams ' }, d.admin.auth, ctx);
    assert.equal(created.category, 'Board Exams');
  });
});
