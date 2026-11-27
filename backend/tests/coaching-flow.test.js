import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createCoachingService } from '../src/modules/coaching/coaching.service.js';
import { staffRoles, ownerOnly, describeAccess } from '../../frontend/src/modules/admin/components/staffRoles.js';
import { coachingFixture } from './coaching-fixture.js';

test('Content manager role can view course plans via commerce.read without granting owner-only permissions', () => {
  const role = staffRoles.find(r => r.name === 'Content manager');
  assert.ok(role);
  for (const perm of ['coaching.read', 'coaching.create', 'coaching.edit', 'coaching.publish', 'coaching.archive', 'commerce.read']) {
    assert.ok(role.permissions.includes(perm), `Expected ${perm} in Content manager`);
  }
  assert.equal(role.permissions.includes('commerce.plans.write'), false);
  for (const forbidden of ownerOnly) {
    assert.equal(role.permissions.includes(forbidden), false);
  }
  assert.deepEqual(describeAccess(role.permissions).roles.map(r => r.name), ['Content manager']);
  assert.deepEqual(describeAccess(role.permissions).extras, []);
});

test('coaching catalogue enriches published courses with lowest active approved plan summary', async () => {
  const courseA = new mongoose.Types.ObjectId();
  const courseB = new mongoose.Types.ObjectId();
  const planPaid = new mongoose.Types.ObjectId();
  const planCheaper = new mongoose.Types.ObjectId();
  const chain = rows => ({
    sort: () => chain(rows),
    skip: () => chain(rows),
    limit: () => chain(rows),
    lean: async () => rows,
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
  });
  const publishedRows = [
    {
      _id: courseA,
      status: 'published',
      publishedSnapshot: { title: 'Course A', category: 'Foundation', facultyIds: [], subjectIds: [] },
    },
    {
      _id: courseB,
      status: 'published',
      publishedSnapshot: { title: 'Course B', category: 'Boards', facultyIds: [], subjectIds: [] },
    },
  ];
  const plansRows = [
    { _id: planCheaper, courseId: courseA, name: 'Starter', priceMinor: 49900, durationMonths: 6, status: 'active', rulesApproved: true },
    { _id: planPaid, courseId: courseA, name: 'Annual', priceMinor: 99900, durationMonths: 12, status: 'active', rulesApproved: true },
  ];
  const service = createCoachingService({
    models: {
      Course: {
        countDocuments: async () => publishedRows.length,
        find: () => chain(publishedRows),
      },
      CoursePlan: {
        find: () => chain(plansRows),
      },
      Lesson: {
        countDocuments: async () => 3,
      },
      Enrollment: {},
      LearningProgress: {},
    },
    publishingModule: {
      coordination: {},
      models: {
        Book: {},
        FacultyProfile: { find: () => chain([]) },
      },
    },
    commerce: {
      models: { Order: {}, DigitalGrant: {}, Refund: {} },
    },
    institutions: {
      models: {
        Taxonomy: { find: () => chain([]) },
      },
    },
    authService: {
      models: { User: {} },
    },
  });

  const result = await service.catalogue({ page: 1, pageSize: 10 });
  assert.equal(result.data.length, 2);
  const dtoA = result.data.find(c => c.id === String(courseA));
  const dtoB = result.data.find(c => c.id === String(courseB));
  assert.equal(dtoA.activePlanCount, 2);
  assert.deepEqual(dtoA.lowestPlan, {
    id: String(planCheaper),
    name: 'Starter',
    priceMinor: 49900,
    durationDays: undefined,
    durationMonths: 6,
    free: false,
  });
  assert.equal(dtoB.activePlanCount, 0);
  assert.equal(dtoB.lowestPlan, null);
});

const dbName = process.env.KITSS_COACHING_FLOW_DB || process.env.KITSS_STAGE7_TEST_DB;
test('Coaching end-to-end catalogue plan summary and free enrollment flow (MongoDB)', {
  skip: !dbName ? 'No isolated test DB supplied; MongoDB integration skipped' : false,
  timeout: 180000,
}, async t => {
  const f = await coachingFixture(dbName);
  t.after(() => f.close());
  const d = await f.seed();
  const cat = await f.learning.catalogue({ q: d.course.title });
  const row = cat.data.find(c => c.id === d.course.id);
  assert.ok(row);
  assert.ok(row.activePlanCount >= 1);
  assert.ok(row.lowestPlan);
});
