import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { coachingFixture } from './coaching-fixture.js';
import { serve } from './helpers.js';
import { inputFor } from '../src/modules/coaching/validation.js';
test('Stage 7 validators reject invented financial defaults and unsafe inputs', () => {
  for (const body of [{
    name: 'P',
    priceMinor: -1
  }, {
    name: 'P',
    priceMinor: 1.1
  }, {
    name: 'P',
    durationDays: 0
  }, {
    name: 'P',
    durationDays: 36501
  }, {
    name: 'P',
    renewalApproved: true
  }, {
    name: 'P',
    currency: 'USD'
  }]) assert.throws(() => inputFor('plans', body, true));
  assert.throws(() => inputFor('courses', {
    title: 'C',
    syllabus: [{
      key: 'x',
      title: 'X',
      sortOrder: 1
    }, {
      key: 'x',
      title: 'Y',
      sortOrder: 2
    }]
  }, true));
});
test('Stage 7 standalone coaching, commerce and reading integration', {
  skip: !process.env.KITSS_STAGE7_TEST_DB,
  timeout: 240000
}, async t => {
  const f = await coachingFixture(process.env.KITSS_STAGE7_TEST_DB);
  t.after(() => f.close());
  const d = await f.seed();
  await t.test('catalogue searches published instructor and language; plan search uses plan names', async () => {
    const language = await f.models.Taxonomy.findById((await f.models.Course.findById(d.course.id)).languageId);
    assert.ok((await f.learning.catalogue({q:language.label})).data.some(row=>row.id===d.course.id));
    assert.ok((await f.learning.catalogue({q:'STAGE7_SYNTHETIC_INSTRUCTOR'})).data.some(row=>row.id===d.course.id));
    assert.equal((await f.learning.adminList('plans',d.course.id,{q:d.plan.name})).data[0].id,d.plan.id);
    assert.equal((await f.learning.catalogue({q:'[.*('})).data.length,0);
    await assert.rejects(f.learning.catalogue({q:{$ne:null}}));
  });
  const L = f.learning,
    ctx = f.ctx;
  await t.test('approved editorial plan fields and course outcomes persist without changing pricing authority',async()=>{
    const course=await L.mutate('courses',null,null,{title:'AUDIT EDITORIAL',whatYouWillLearn:['Approved outcome'],benefits:['Approved benefit']},d.admin.auth,ctx);
    const plan=await L.mutate('plans',null,course.id,{name:'AUDIT PLAN',features:['Authored plan benefit'],popular:true,sortOrder:9},d.admin.auth,ctx);
    assert.deepEqual((await f.models.Course.findById(course.id)).whatYouWillLearn.toObject(),['Approved outcome']);
    const stored=await f.models.CoursePlan.findById(plan.id);assert.deepEqual(stored.features.toObject(),['Authored plan benefit']);assert.equal(stored.popular,true);assert.equal(stored.sortOrder,9);assert.equal(stored.status,'draft');
    await assert.rejects(L.mutate('plans',plan.id,course.id,{expectedRevision:plan.revision,popular:'yes'},d.admin.auth,ctx));
  });
  if (process.env.KITSS_REQUIRE_STANDALONE === 'true') assert.equal((await f.connection.db.admin().command({
    hello: 1
  })).setName, undefined, 'Standalone topology required for this test run');
  const capture = async () => {
    const order = await f.service.create({
      product: {
        kind: 'course_plan',
        id: d.plan.id
      },
      idempotencyKey: randomUUID()
    }, d.student.auth, ctx);
    await f.service.startAttempt(order.id, {
      idempotencyKey: randomUUID()
    }, d.student.auth, ctx);
    const row = await f.models.Order.findById(order.id),
      payment = f.provider.pay(row.providerOrderId);
    await f.service.observe(row._id, payment.id, 'test', ctx);
    return f.models.Order.findById(row._id);
  };
  const url = await serve(t, f.app()),
    csrfResponse = await fetch(url + '/api/v1/auth/csrf'),
    cookie = csrfResponse.headers.getSetCookie()[0].split(';')[0],
    csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, actor = d.student, method = 'GET', data) => fetch(url + '/api/v1' + path, {
    method,
    headers: {
      Origin: f.config.corsOrigins[0],
      Cookie: cookie + (actor ? '; ' + (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''),
      'X-CSRF-Token': csrf,
      ...(data ? {
        'Content-Type': 'application/json'
      } : {})
    },
    ...(data ? {
      body: JSON.stringify(data)
    } : {})
  });
  let order;
  await t.test('HTTP session, RBAC, paid enrollment and manual grant boundaries', async () => {
    assert.equal((await api('/admin/coaching/courses', d.student)).status, 403);
    assert.equal((await api('/admin/coaching/courses', null)).status, 401);
    assert.equal((await api('/admin/coaching/courses', d.admin)).status, 200);
    assert.equal((await api('/coaching/courses/' + d.course.id + '/enroll', d.student, 'POST', {
      idempotencyKey: randomUUID()
    })).status, 409);
    assert.equal((await api('/admin/entitlements', d.admin, 'POST', {})).status, 409);
    assert.equal((await api('/coaching/courses/' + d.course.id + '/lessons/' + d.lesson.id, d.other)).status, 403);
    assert.equal((await api('/coaching/courses/' + d.course.id + '/lessons/' + d.preview.id, null)).status, 200);
  });
  await t.test('catalogue, facets, draft exclusion, pagination and literal search', async () => {
    const draft = await L.mutate('courses', null, null, {
      title: 'HIDDEN_DRAFT'
    }, d.admin.auth, ctx);
    assert.equal((await L.catalogue({
      q: 'HIDDEN_DRAFT'
    })).data.length, 0);
    assert.equal((await L.catalogue({
      category: 'Isolated fixture'
    })).meta.total, 1);
    assert.equal((await L.facets()).categories[0].name, 'Isolated fixture');
    await assert.rejects(() => L.course(draft.id, true));
    assert.equal((await L.catalogue({
      q: '.*'
    })).data.length, 0);
  });
  await t.test('private lessons, cross-course membership and public previews', async () => {
    await assert.rejects(() => L.lesson(d.course.id, d.lesson.id, d.student.auth));
    assert.equal((await L.lesson(d.course.id, d.preview.id, null)).content, 'Synthetic public preview');
    const foreign = await L.mutate('courses', null, null, {
      title: 'Other'
    }, d.admin.auth, ctx);
    await assert.rejects(() => L.lesson(foreign.id, d.lesson.id, d.student.auth));
    assert.equal((await L.syllabus(d.course.id, null)).lessons.find(l => l.id === d.lesson.id).locked, true);
  });
  await t.test('invalid plan values and unsafe live lesson edits rejected', async () => {
    await assert.rejects(() => L.mutate('plans', null, d.course.id, {
      name: 'No rules',
      status: 'active'
    }, d.admin.auth, ctx));
    // Live courses are edited in place; an edit that leaves a published lesson empty is still refused.
    const live = await f.models.Lesson.findById(d.lesson.id);
    await assert.rejects(() => L.mutate('lessons', d.lesson.id, d.course.id, { expectedRevision: live.revision, content: '', documentAssetId: null }, d.admin.auth, ctx), { code: 'INVALID_INPUT' });
    const edited = await L.mutate('lessons', d.lesson.id, d.course.id, { expectedRevision: live.revision, title: live.title }, d.admin.auth, ctx);
    assert.equal(edited.revision, live.revision + 1);
  });
  await t.test('unpaid order grants nothing; backend plan snapshot is authoritative', async () => {
    const pending = await f.service.create({
      product: {
        kind: 'course_plan',
        id: d.plan.id
      },
      idempotencyKey: randomUUID()
    }, d.other.auth, ctx);
    assert.equal(pending.amountMinor, 12345);
    await assert.rejects(() => L.enrollment(d.course.id, d.other.auth));
    await assert.rejects(() => f.service.create({
      product: {
        kind: 'course_plan',
        id: d.plan.id
      },
      amountMinor: 1,
      idempotencyKey: randomUUID()
    }, d.student.auth, ctx));
  });
  await t.test('captured fulfillment is idempotent and recovers after an interrupted acknowledgment', async () => {
    let fail = true;
    f.service.hooks.afterEntitlement = () => {
      if (fail) {
        fail = false;
        throw new Error('Injected post-effect crash');
      }
    };
    await assert.rejects(() => capture());
    order = await f.models.Order.findOne({
      userId: d.student.user._id
    });
    assert.equal(order.status, 'captured');
    assert.equal(await f.models.Enrollment.countDocuments({
      orderId: order._id
    }), 1);
    f.service.hooks.afterEntitlement = undefined;
    await Promise.all([f.service.fulfill(order._id), f.service.fulfill(order._id)]);
    const enrollment = await L.enrollment(d.course.id, d.student.auth);
    assert.equal(enrollment.canAccess, true);
    assert.equal(new Date(enrollment.expiresAt) - new Date(enrollment.startsAt), 7 * 86400000);
    assert.equal(await f.models.Enrollment.countDocuments({
      userId: d.student.user._id
    }), 1);
  });
  await t.test('different plans cannot create duplicate first-purchase course orders', async () => {
    const alternate = await f.models.CoursePlan.create({ courseId: d.course.id, name: 'STAGE7_ISOLATED_ALTERNATE_PLAN', priceMinor: 9876, durationDays: 3, eligibility: 'verified_account', rulesApproved: true, status: 'active' });
    await assert.rejects(() => f.service.create({ product: { kind: 'course_plan', id: String(alternate._id) }, idempotencyKey: randomUUID() }, d.other.auth, ctx), e => e.code === 'EXISTING_COURSE_ORDER');
    assert.equal(await f.models.Order.countDocuments({ userId: d.other.user._id, 'product.courseId': d.course.id }), 1);
    assert.ok((await f.models.Order.collection.indexes()).some(i => i.unique && i.key['product.courseId']));
  });
  await t.test('capture before enrollment interruption recovers without duplicate rights', async () => {
    const actor = await f.fixtureUser(['student']),
      created = await f.service.create({
        product: {
          kind: 'course_plan',
          id: d.plan.id
        },
        idempotencyKey: randomUUID()
      }, actor.auth, ctx);
    await f.service.startAttempt(created.id, {
      idempotencyKey: randomUUID()
    }, actor.auth, ctx);
    const row = await f.models.Order.findById(created.id),
      payment = f.provider.pay(row.providerOrderId);
    f.service.hooks.beforeEntitlement = () => {
      throw new Error('Injected pre-effect crash');
    };
    await assert.rejects(() => f.service.observe(row._id, payment.id, 'test', ctx));
    assert.equal(await f.models.Enrollment.countDocuments({
      orderId: row._id
    }), 0);
    f.service.hooks.beforeEntitlement = undefined;
    await Promise.all([f.service.fulfill(row._id), f.service.fulfill(row._id)]);
    assert.equal(await f.models.Enrollment.countDocuments({
      orderId: row._id
    }), 1);
  });
  await t.test('private lesson PDF requires current enrollment and denies unrelated users', async () => {
    const descriptor = await L.lesson(d.course.id, d.lesson.id, d.student.auth);
    assert.equal(descriptor.media.pageCount, 2);
    const asset = await f.models.Lesson.findById(d.lesson.id);
    await assert.rejects(() => f.media.open(String(asset.documentAssetId), d.other.auth));
    const stream = await f.media.open(String(asset.documentAssetId), d.student.auth, 'bytes=0-3');
    for await (const chunk of stream.stream) assert.equal(chunk.toString(), '%PDF');
  });
  await t.test('owned order status recognizes enrollment; active access can be renewed early for the next period', async () => {
    assert.equal((await f.service.owned(String(order._id), d.student.auth)).fulfillment.state, 'applied');
    const enrollment = await f.models.Enrollment.findOne({ userId: d.student.user._id, courseId: d.course.id });
    const quote = await L.resolvePlan(d.plan.id, d.student.auth);
    assert.equal(quote.product.purchaseSlot, String(enrollment._id) + ':' + enrollment.expiresAt.toISOString());
    await f.models.Enrollment.updateOne({ _id: enrollment._id }, { $set: { revokedAt: new Date() } });
    await assert.rejects(() => L.resolvePlan(d.plan.id, d.student.auth), e => e.code === 'ACTIVE_OR_REVOKED_ACCESS');
    await f.models.Enrollment.updateOne({ _id: enrollment._id }, { $set: { revokedAt: null } });
  });
  await t.test('progress explicit completion, bounded values, revision and account isolation', async () => {
    const p = await L.progressLesson(d.lesson.id, {
      status: 'completed',
      expectedRevision: 0
    }, d.student.auth);
    assert.equal(p.status, 'completed');
    assert.equal((await L.progressLesson(d.lesson.id, {
      status: 'completed',
      expectedRevision: 0
    }, d.student.auth)).revision, p.revision);
    await assert.rejects(() => L.progressLesson(d.lesson.id, {
      status: 'completed',
      positionSeconds: 999,
      expectedRevision: p.revision
    }, d.student.auth));
    await assert.rejects(() => L.progressLesson(d.lesson.id, {
      status: 'completed',
      expectedRevision: 0
    }, d.other.auth));
    assert.equal((await L.syllabus(d.course.id, d.student.auth)).completionPercentage, 50);
    assert.equal((await L.syllabus(d.course.id, d.other.auth)).completionPercentage, 0);
  });
  await t.test('linked book access, actual page count, bookmarks and ranges', async () => {
    const state = await L.linkedBook(d.course.id, d.book.id, d.student.auth);
    assert.equal(state.pageCount, 4);
    await assert.rejects(() => L.bookState(d.book.id, d.other.auth));
    const p = await L.bookProgress(d.book.id, {
      currentPage: 2,
      expectedRevision: 0,
      courseId: d.course.id
    }, d.student.auth, 'progress');
    assert.equal(p.currentPage, 2);
    await assert.rejects(() => L.bookProgress(d.book.id, {
      currentPage: 5,
      expectedRevision: p.revision,
      courseId: d.course.id
    }, d.student.auth, 'progress'));
    const b = await L.bookProgress(d.book.id, {
      expectedRevision: p.revision,
      courseId: d.course.id
    }, d.student.auth, 'add', '3');
    assert.deepEqual(b.bookmarkPages, [3]);
    const repeat = await L.bookProgress(d.book.id, {
      expectedRevision: p.revision,
      courseId: d.course.id
    }, d.student.auth, 'add', '3');
    assert.deepEqual(repeat.bookmarkPages, [3]);
    const edits = await Promise.allSettled([L.bookProgress(d.book.id, {
      currentPage: 3,
      expectedRevision: repeat.revision,
      courseId: d.course.id
    }, d.student.auth, 'progress'), L.bookProgress(d.book.id, {
      currentPage: 4,
      expectedRevision: repeat.revision,
      courseId: d.course.id
    }, d.student.auth, 'progress')]);
    assert.equal(edits.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(edits.filter(r => r.status === 'rejected').length, 1);
    const asset = await f.models.MediaAsset.findById(d.book.documentAssetId);
    const file = await f.media.open(String(asset._id), d.student.auth, 'bytes=0-3');
    let bytes = Buffer.alloc(0);
    for await (const chunk of file.stream) bytes = Buffer.concat([bytes, chunk]);
    assert.equal(bytes.toString(), '%PDF');
    await assert.rejects(() => f.media.open(String(asset._id), d.other.auth));
  });
  await t.test('wishlist is idempotent, persistent and scoped without granting access', async () => {
    await L.wishlist(d.book.id, true, d.other.auth);
    await L.wishlist(d.book.id, true, d.other.auth);
    assert.equal(await f.models.LearningProgress.countDocuments({
      userId: d.other.user._id,
      bookId: d.book.id,
      wishlisted: true
    }), 1);
    await assert.rejects(() => L.bookState(d.book.id, d.other.auth));
    await L.wishlist(d.book.id, false, d.other.auth);
  });
  await t.test('expiry/revocation deny media and progress; retries do not resurrect access', async () => {
    let e = await f.models.Enrollment.findOne({
      orderId: order._id
    });
    await f.models.Enrollment.updateOne({
      _id: e._id
    }, {
      $set: {
        expiresAt: new Date(Date.now() - 1000)
      }
    });
    await assert.rejects(() => L.lesson(d.course.id, d.lesson.id, d.student.auth));
    await assert.rejects(() => L.bookState(d.book.id, d.student.auth, d.course.id));
    await f.models.Enrollment.updateOne({
      _id: e._id
    }, {
      $set: {
        expiresAt: new Date(Date.now() + 86400000)
      }
    });
    e = await f.models.Enrollment.findById(e._id);
    await f.service.business.save({ value: { manualAccess: { approved: false, paidRevocationApproved: true, description: 'Isolated support revocation policy' } }, expectedRevision: 0, reason: 'Explicit synthetic revocation acceptance' }, d.admin.auth, ctx);
    await L.revoke(String(e._id), {
      kind: 'course',
      reason: 'Isolated support test',
      expectedRevision: e.revision
    }, ctx);
    await assert.rejects(() => f.service.fulfill(order._id));
    await assert.rejects(() => L.progressLesson(d.lesson.id, {
      status: 'completed',
      expectedRevision: 1
    }, d.student.auth));
    assert.equal((await L.enrollment(d.course.id, d.student.auth, false)).state, 'revoked');
  });
  await t.test('private media references prevent deletion and indexes exist', async () => {
    const asset = await f.models.MediaAsset.findById((await f.models.Course.findById(d.course.id)).thumbnailId);
    await assert.rejects(() => f.media.remove(String(asset._id), {
      expectedRevision: asset.revision
    }, ctx));
    assert.ok((await f.models.Enrollment.collection.indexes()).some(i => i.unique && i.key.userId && i.key.courseId));
    assert.ok((await f.models.LearningProgress.collection.indexes()).some(i => i.unique && i.key.bookId));
  });
});
