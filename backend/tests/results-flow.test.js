import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { businessActions, businessNotice } from '../src/modules/notifications/business-events.js';
import { staffRoles, ownerOnly, describeAccess } from '../../frontend/src/modules/admin/components/staffRoles.js';
import { stage8Fixture } from './stage8-fixture.js';
import { serve } from './helpers.js';

test('Results manager staff role includes media permissions for bulk import and never owner-only permissions', () => {
  const role = staffRoles.find(r => r.name === 'Results manager');
  assert.ok(role);
  for (const perm of ['results.read', 'results.manage', 'media.read', 'media.write']) {
    assert.ok(role.permissions.includes(perm), `Expected ${perm} in Results manager`);
  }
  for (const forbidden of ownerOnly) {
    assert.equal(role.permissions.includes(forbidden), false);
  }
  assert.deepEqual(describeAccess(role.permissions).roles.map(r => r.name), ['Results manager']);
  assert.deepEqual(describeAccess(role.permissions).extras, []);
});

test('businessActions and businessNotice handle result_publish notifications cleanly', async () => {
  assert.ok(businessActions.includes('result_publish'));
  const recordId = new mongoose.Types.ObjectId();
  const examId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const connection = {
    models: {
      ResultRecord: {
        findById: async id => (String(id) === String(recordId) ? { _id: recordId, examId, userId: studentId, rollNormalized: 'ROLL-101' } : null),
      },
      Exam: {
        findById: () => ({ select: () => ({ lean: async () => ({ title: 'Midterm 2026' }) }) }),
      },
    },
  };
  const notice = await businessNotice(
    { _id: new mongoose.Types.ObjectId(), action: 'result_publish', subjectId: String(recordId), at: new Date('2026-11-25T10:00:00Z') },
    { connection, User: {} }
  );
  assert.ok(notice);
  assert.equal(notice.title, 'Result published');
  assert.equal(notice.category, 'exam');
  assert.equal(notice.link, '/results');
  assert.deepEqual(notice.audience.userIds, [String(studentId)]);
  assert.match(notice.message, /Midterm 2026/);
  assert.match(notice.message, /ROLL-101/);
});

const dbName = process.env.KITSS_RESULTS_FLOW_DB || process.env.KITSS_STAGE8_TEST_DB;
test('Streamlined admin-to-admin and student results end-to-end flow (MongoDB + HTTP)', {
  skip: !dbName ? 'No isolated test DB supplied; MongoDB integration skipped' : false,
  timeout: 180000,
}, async t => {
  const f = await stage8Fixture(dbName, { businessEvents: true });
  t.after(() => f.close());
  const d = await f.seed();
  const ctx = { ...f.ctx, actorId: d.admin.user.publicId };

  // Create a Results manager staff user (no accounts.read, no results.publish)
  const staff = await f.fixtureUser(['admin'], ['dashboard.read', 'results.read', 'results.manage', 'media.read', 'media.write']);
  const university = await f.institutions.create('university', { name: 'Flow Test University', shortName: 'FTU', status: 'active' }, ctx);
  const issuer = await f.results.mutate('issuers', null, {
    key: 'ftu-' + randomUUID().slice(0, 8),
    type: 'university',
    name: 'FTU',
    fullName: 'Flow Test University',
    sourceMode: 'admin',
    organizationKind: 'university',
    organizationId: university.id,
    status: 'active',
    fieldSchema: [{ id: 'dob', label: 'Date of birth', type: 'date', required: true }],
    source: { description: 'Official sheet', authorizationReference: 'MEMO-2026' },
  }, ctx);
  const exam = await f.results.mutate('exams', null, {
    issuerId: issuer.id,
    key: 'sem1-' + randomUUID().slice(0, 8),
    title: 'Semester 1',
    year: 2026,
    session: 'Nov 2026',
    status: 'draft',
  }, ctx);

  const url = await serve(t, f.app());
  const csrfRes = await fetch(url + '/api/v1/auth/csrf');
  const cookie = csrfRes.headers.getSetCookie()[0].split(';')[0];
  const csrf = (await csrfRes.json()).data.csrfToken;
  const api = async (actor, path, method = 'GET', body) => {
    const res = await fetch(url + '/api/v1' + path, {
      method,
      headers: {
        Origin: f.config.corsOrigins[0],
        Cookie: `${cookie}; ${actor.user.roles.includes('student') ? 'kitss_student_session' : 'kitss_staff_session'}=${actor.token}`,
        ...(method !== 'GET' ? { 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };

  // 1. Results manager can search verified students without accounts.read
  const studentSearch = await api(staff, '/admin/results/students?q=' + encodeURIComponent(d.student.user.publicId.slice(0, 8)));
  assert.equal(studentSearch.status, 200);
  assert.ok(studentSearch.json.data.some(s => s.id === d.student.user.publicId));

  // 2. Results manager enters single student marks directly (submit: true) without media upload
  const row1 = {
    rollNumber: 'FTU-101',
    userPublicId: d.student.user.publicId,
    student: { name: d.student.user.name },
    subjects: [{ code: 'CS101', name: 'Algorithms', maxMarks: 100, obtained: 85, grade: 'A' }],
    totals: { max: 100, obtained: 85, percentage: 85, status: 'PASS', grade: 'A' },
    verificationFields: { dob: '2001-05-10' },
    issueDate: '2026-11-25',
    externalId: 'EXT-101',
  };
  const created = await api(staff, '/admin/results/records', 'POST', { examId: exam.id, rows: [row1], submit: true, idempotencyKey: randomUUID() });
  assert.equal(created.status, 201);
  assert.equal(created.json.data.record.review.status, 'submitted');

  // 3. Results manager cannot approve_and_publish
  const denied = await api(staff, `/admin/results/records/${created.json.data.record.id}/approve_and_publish`, 'POST', { expectedRevision: created.json.data.record.expectedRevision });
  assert.equal(denied.status, 403);

  // 4. Dry-run batch validation reports exact row error message
  const badBatch = await api(staff, '/admin/results/records/batch', 'POST', {
    examId: exam.id,
    rows: [{ ...row1, rollNumber: 'FTU-102', userPublicId: 'INVALID_ID' }],
    dryRun: true,
    idempotencyKey: randomUUID(),
  });
  assert.equal(badBatch.status, 200);
  assert.equal(badBatch.json.data.errors.length, 1);
  assert.match(badBatch.json.data.errors[0].message, /verified account/i);

  // 5. Super admin clicks approve_and_publish with publishExam: true in one shot
  const published = await api(d.admin, `/admin/results/records/${created.json.data.record.id}/approve_and_publish`, 'POST', {
    expectedRevision: created.json.data.record.expectedRevision,
    publishExam: true,
  });
  assert.equal(published.status, 200);
  assert.equal(published.json.data.status, 'published');
  assert.equal(published.json.data.review.status, 'approved');
  assert.equal((await f.models.Exam.findById(exam.id)).status, 'published');

  // 6. Business event notification fires for student on result_publish
  await f.notifications.tick();
  const studentNotices = (await f.notifications.list({}, d.student.auth)).data;
  assert.ok(studentNotices.some(n => n.title === 'Result published' && n.message.includes('FTU-101')));

  // 7. Student /me/results returns complete exam & issuer info for direct marksheet opening
  const myResults = await api(d.student, '/me/results');
  assert.equal(myResults.status, 200);
  assert.equal(myResults.json.data.length, 1);
  assert.equal(myResults.json.data[0].exam.title, 'Semester 1');
  assert.equal(myResults.json.data[0].issuer.fullName, 'Flow Test University');

  // 8. Correction with keepVerification: true + approve_and_publish atomically supersedes old revision
  const corr = await api(staff, `/admin/results/records/${published.json.data.id}/corrections`, 'POST', {
    expectedRevision: published.json.data.expectedRevision,
    reason: 'Typo in marks',
    source: 'MEMO-CORR-1',
    keepVerification: true,
    correctedFields: {
      rollNumber: 'FTU-101',
      userPublicId: d.student.user.publicId,
      student: { name: d.student.user.name },
      subjects: [{ code: 'CS101', name: 'Algorithms', maxMarks: 100, obtained: 90, grade: 'A+' }],
      totals: { max: 100, obtained: 90, percentage: 90, status: 'PASS', grade: 'A+' },
      issueDate: '2026-11-25',
      externalId: 'EXT-101-R2',
    },
  });
  assert.equal(corr.status, 200);
  assert.equal(corr.json.data.revision, 2);

  const pubCorr = await api(d.admin, `/admin/results/records/${corr.json.data.id}/approve_and_publish`, 'POST', {
    expectedRevision: corr.json.data.expectedRevision,
  });
  assert.equal(pubCorr.status, 200);
  assert.equal(pubCorr.json.data.status, 'published');
  assert.equal((await f.models.ResultRecord.findById(published.json.data.id)).status, 'withdrawn');

  // Student lookup still works with original DOB verification answer!
  const lookup = await api(d.student, '/results/lookup', 'POST', {
    issuerId: issuer.id,
    examId: exam.id,
    rollNumber: 'FTU-101',
    verificationFields: { dob: '2001-05-10' },
  });
  assert.equal(lookup.status, 200);
  assert.equal(lookup.json.data.totals.obtained, 90);
});
