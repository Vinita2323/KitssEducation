import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { commerceFixture } from './commerce-fixture.js';
import { imageBytes } from './publishing-fixture.js';
import { serve } from './helpers.js';
const db = process.env.KITSS_REGISTRATION_LISTINGS_DB;

test('real registration review, owner history and approved teacher publication over HTTP', { skip: !db, timeout: 180000 }, async t => {
  const f = await commerceFixture(db); t.after(() => f.close());
  const admin = await f.fixtureUser(), owner = await f.fixtureUser(['student']), other = await f.fixtureUser(['student']);
  const base = await serve(t, f.app());
  const response = await fetch(base + '/api/v1/auth/csrf'), csrf = (await response.json()).data.csrfToken;
  const csrfCookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  const request = async (path, actor = owner, method = 'GET', body) => {
    const response = await fetch(base + '/api/v1' + path, { method, headers: { Origin: f.config.corsOrigins[0], Cookie: (actor ? (actor === admin ? 'kitss_staff_session=' : 'kitss_student_session=') + actor.token + '; ' : '') + csrfCookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  };
  const policy = { status: 'active', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [], privacyApproved: true, documentsApproved: true };
  await f.service.business.save({ expectedRevision: 0, reason: 'Approved isolated test policies', value: { registrations: { study: policy, tuition: policy, teacher: policy } } }, admin.auth, f.ctx);
  let teacher;
  for (const kind of ['study', 'tuition', 'teacher']) await t.test(kind + ': submit, review and owner history', async () => {
    const applicant = { [kind === 'teacher' ? 'fullName' : 'studentName']: 'Synthetic applicant', dob: '1990-01-01', [kind === 'tuition' ? 'emailId' : 'email']: owner.user.emailNormalized };
    let response = await request('/registration-applications', owner, 'POST', { kind, applicant, idempotencyKey: randomUUID() }); assert.equal(response.status, 201);
    let row = response.body.data;
    assert.equal((await request('/registration-applications/' + row.id + '/status', other)).status, 404);
    response = await request('/registration-applications/' + row.id + '/submit', owner, 'POST', { expectedRevision: row.revision, declaration: true }); assert.equal(response.status, 200); row = response.body.data;
    for (const status of ['pending_verification', 'under_review', 'approved']) {
      response = await request('/admin/registration-applications/' + row.id + '/status', admin, 'PATCH', { expectedRevision: row.revision, status, reason: 'Synthetic review completed' }); assert.equal(response.status, 200); row = response.body.data;
    }
    assert.equal(row.status, 'approved'); assert.equal(row.paymentState, 'not_required');
    if (kind === 'teacher') teacher = row;
    assert.equal((await f.models.User.findById(owner.user._id)).roles.includes('admin'), false);
  });
  const list = await request('/me/registration-applications'); assert.equal(list.status, 200); assert.equal(list.body.data.items.length, 3);
  for (const row of list.body.data.items) { assert.equal(row.notes, undefined); assert.equal(row.userId, undefined); }
  assert.equal((await request('/me/registration-applications', other)).body.data.items.length, 0);
  assert.equal((await request('/me/registration-applications', null)).status, 401);
  assert.equal((await request('/me/registration-applications?page=-1')).status, 422);
  await t.test('teacher public portrait, publication permissions, idempotence and faculty visibility', async () => {
    const portrait = await f.media.upload({ purpose: 'faculty', stream: Readable.from(await imageBytes()), mime: 'image/png', originalName: 'public-portrait.png', idempotencyKey: randomUUID(), auth: admin.auth, ctx: f.ctx });
    const input = { expectedRevision: teacher.revision, profile: { name: 'Public KITSS teacher', role: 'Teacher', portraitAssetId: portrait.id, specialty: 'Mathematics' } };
    const path = '/admin/registration-applications/' + teacher.id + '/teacher-profile';
    assert.equal((await request(path, owner, 'POST', input)).status, 403);
    let result = await request(path, admin, 'POST', input); assert.equal(result.status, 200); assert.ok(result.body.data.teacherProfileId);
    const profileId = result.body.data.teacherProfileId;
    result = await request(path, admin, 'POST', input); assert.equal(result.status, 200); assert.equal(result.body.data.teacherProfileId, profileId);
    assert.equal(await f.models.FacultyProfile.countDocuments({ registrationApplicationId: teacher.id }), 1);
    const publicFaculty = await request('/public/faculty', null); assert.equal(publicFaculty.status, 200);
    const profile = publicFaculty.body.data.find(row => row.id === profileId); assert.equal(profile.name, 'Public KITSS teacher'); assert.equal(profile.badge, 'KITSS Teacher');
    for (const key of ['registrationApplicationId', 'email', 'applicant', 'sourceNote', 'documents']) assert.equal(profile[key], undefined);
    assert.equal((await request('/me/registration-applications')).body.data.items.find(row => row.id === teacher.id).teacherProfileId, profileId);
    assert.deepEqual((await f.models.User.findById(owner.user._id)).roles, ['student']);
  });
});
