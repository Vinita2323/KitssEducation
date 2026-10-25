import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';
import { createInstitutionService } from '../src/modules/institutions/institutions.service.js';
import { opaque, digest, hashPassword } from '../src/modules/auth/security.js';
import { createApp } from '../src/app.js';
import { silentLogger, serve } from './helpers.js';

const dbName = process.env.KITSS_STAGE4_TEST_DB;
test('Stage 4 standalone institution/intake integration in fresh isolated MongoDB', { skip: !dbName ? 'No KITSS_STAGE4_TEST_DB; real Stage 4 integration not executed' : false, timeout: 240000 }, async t => {
  assert.match(dbName, /^kitss_stage4_test_[a-f0-9]{16}$/);
  const config = loadConfig();
  const connection = await mongoose.createConnection(process.env.MONGODB_STAGE4_TEST_URI || config.mongo.uri, { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 }).asPromise();
  let models, authModels, owned = false;
  t.after(async () => { try { if (owned) for (const Model of [...Object.values(models ?? {}), ...Object.values(authModels ?? {})]) { const ids = (await Model.find({}, { _id: 1 }).lean()).map(doc => doc._id); if (ids.length) await Model.deleteMany({ _id: { $in: ids } }); } } finally { await connection.close(); } });
  assert.equal((await connection.db.listCollections({}, { nameOnly: true }).toArray()).length, 0, 'Refuse pre-existing database'); owned = true;
  models = createInstitutionModels(connection); authModels = createAuthModels(connection);
  const authService = await createAuthService({ models: authModels, config, logger: silentLogger, mail: { configured: true, send: async () => { throw new Error('Stage 4 tests must not send mail'); } } });
  await authService.initialize();
  const service = createInstitutionService({ models, authService, config, logger: silentLogger });
  await service.initialize();
  const fixture = async (role, permissions = []) => {
    const user = await authModels.User.create({ publicId: 'TEST-' + randomUUID(), name: 'Isolated fixture', emailNormalized: randomUUID() + '@example.invalid', passwordHash: await hashPassword(opaque()), roles: [role], permissions, status: 'active', emailVerifiedAt: new Date() });
    const token = opaque(); const session = await authModels.Session.create({ _id: randomUUID(), tokenHash: digest(token), userId: user._id, kind: role === 'student' ? 'student' : 'admin', securityVersion: 0, expiresAt: new Date(Date.now() + 3600000), lastSeenAt: new Date() });
    if (role === 'student') await authModels.User.updateOne({ _id: user._id }, { $set: { activeSessionId: session._id, activeSessionExpiresAt: session.expiresAt } });
    return { user, session, token };
  };
  const admin = await fixture('super_admin'), student = await fixture('student'), other = await fixture('student'), reader = await fixture('admin', ['institutions.read', 'admissions.read']);
  const ctx = { actorId: admin.user.publicId, requestId: randomUUID(), ip: 'isolated-stage4' };
  const url = await serve(t, createApp({ config, logger: silentLogger, database: { isReady: async () => true }, storage: { isReady: async () => true }, authService, institutionService: service }));
  const csrfResponse = await fetch(url + '/api/v1/auth/csrf');
  const csrfCookie = csrfResponse.headers.getSetCookie()[0].split(';')[0]; const csrf = (await csrfResponse.json()).data.csrfToken;
  const api = async (path, { method = 'GET', data, actor = admin, headers = {} } = {}) => {
    const cookie = actor ? `${actor.session.kind === 'admin' ? 'kitss_staff_session' : 'kitss_student_session'}=${actor.token}; ${csrfCookie}` : csrfCookie;
    const response = await fetch(url + '/api/v1' + path, { method, headers: { Origin: config.corsOrigins[0], Cookie: cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json', ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    const body = await response.json(); return { status: response.status, ...body };
  };
  let state, district, university, college, program, admission, draft;
  await t.test('taxonomy creation/uniqueness, hierarchy, invalid data and permission boundaries', async () => {
    const result = await api('/admin/taxonomies', { method: 'POST', data: { kind: 'state', key: 'test-state', label: 'Test State' } });
    assert.equal(result.status, 201); state = result.data;
    district = await service.create('taxonomy', { kind: 'district', key: 'test-district', label: 'Test District', parentIds: [state.id] }, ctx);
    for (const [kind, label] of [['institution_type', 'Test Institute'], ['designation', 'Test Director'], ['qualification', 'Test Qualification']]) await service.create('taxonomy', { kind, key: kind.replaceAll('_', '-') + '-test', label }, ctx);
    assert.equal((await api('/admin/taxonomies', { method: 'POST', data: { kind: 'state', key: 'test-state', label: 'Duplicate' } })).status, 409);
    assert.equal((await api('/admin/taxonomies', { method: 'POST', actor: student, data: { kind: 'state', key: 'bad', label: 'Bad' } })).status, 403);
    assert.equal((await api('/admin/universities', { method: 'POST', actor: reader, data: { name: 'No', shortName: 'NO' } })).status, 403);
    assert.equal((await api('/admin/universities', { method: 'POST', actor: null, data: { name: 'No', shortName: 'NO' } })).status, 401);
    assert.equal((await api('/admin/universities', { method: 'POST', data: { name: { $ne: '' }, shortName: 'NO' } })).status, 422);
    await assert.rejects(service.create('taxonomy', { kind: 'state', key: 'cycle', label: 'No', parentIds: [district.id] }, ctx), { status: 422 });
    await assert.rejects(service.edit('taxonomy', state.id, { status: 'inactive', expectedRevision: state.revision }, ctx), { code: 'ACTIVE_DEPENDENTS' });
  });
  await t.test('university CRUD, default drafts, normalized duplicates and optimistic revisions', async () => {
    university = await service.create('university', { name: 'Test University', shortName: 'TEST' }, ctx);
    assert.equal((await service.list('university', {})).meta.total, 0);
    await assert.rejects(service.create('university', { name: 'Duplicate', shortName: 'test' }, ctx), e => e.code === 11000);
    university = await service.edit('university', university.id, { status: 'active', expectedRevision: university.revision }, ctx);
    assert.equal((await service.list('university', {})).data[0].name, 'Test University');
    await assert.rejects(service.edit('university', university.id, { name: 'Stale', expectedRevision: 1 }, ctx), { code: 'REVISION_CONFLICT' });
  });
  const collegeInput = () => ({ universityId: university.id, stateId: state.id, name: 'Test College', code: 'TEST-COLLEGE', category: 'Institute', address: 'Test campus address', city: 'Test City', district: district.label, verification: { state: 'verified', source: 'Isolated fixture evidence, not a real institution' } });
  await t.test('college relationships, explicit verification and no unpublished public leak', async () => {
    await assert.rejects(service.create('college', { ...collegeInput(), universityId: '0'.repeat(24) }, ctx), { status: 404 });
    await assert.rejects(service.create('college', { ...collegeInput(), district: 'Unknown District' }, ctx), { status: 422 });
    await assert.rejects(service.create('college', { ...collegeInput(), status: 'active', verification: { state: 'unverified' } }, ctx), { status: 422 });
    college = await service.create('college', collegeInput(), ctx);
    assert.equal((await service.list('college', {})).meta.total, 0);
    college = await service.edit('college', college.id, { status: 'active', expectedRevision: college.revision }, ctx);
    assert.equal((await service.list('college', { view: 'institutes' })).meta.total, 1);
    await assert.rejects(service.edit('college', college.id, { universityId: '0'.repeat(24), expectedRevision: college.revision }, ctx), { status: 422 });
    await assert.rejects(service.edit('university', university.id, { status: 'inactive', expectedRevision: university.revision }, ctx), { code: 'ACTIVE_DEPENDENTS' });
    const publicCollege = await api('/colleges/' + college.id, { actor: null });
    assert.equal(publicCollege.status, 200); assert.equal(publicCollege.data.verification, undefined); assert.equal(JSON.stringify(publicCollege).includes('fixture evidence'), false);
    for (const status of ['draft', 'inactive', 'archived']) assert.equal((await api('/colleges?status=' + status, { actor: null })).status, 422);
    await assert.rejects(service.edit('taxonomy', district.id, { status: 'inactive', expectedRevision: district.revision }, ctx), { code: 'ACTIVE_DEPENDENTS' });
    await assert.rejects(service.edit('taxonomy', district.id, { label: 'Changed referenced district', expectedRevision: district.revision }, ctx), { code: 'REFERENCED_TAXONOMY' });
  });
  await t.test('program CRUD/unique index, parent membership, monetary validation and authoritative facets', async () => {
    const input = { name: 'Test Program', degreeType: 'Test Degree', duration: '3 years', eligibility: 'Test requirement', feeMinor: 1234500, admissionStatus: 'open', status: 'active' };
    program = await service.create('program', input, ctx, college.id);
    await assert.rejects(service.create('program', input, ctx, college.id), e => e.code === 11000);
    await assert.rejects(service.create('program', { ...input, name: 'Bad', feeMinor: -1 }, ctx, college.id), { status: 422 });
    assert.equal((await service.list('college', { degree: 'Test Degree', q: 'Program', pageSize: '1' })).meta.total, 1);
    assert.equal((await service.list('college', { q: 'absent' })).meta.total, 0);
    assert.equal((await service.list('college', { page: '2', pageSize: '1' })).data.length, 0);
    const facets = await service.facets({ state: state.label }); assert.deepEqual(facets.districts, [district.label]); assert.deepEqual(facets.degrees, ['Test Degree']);
    await assert.rejects(service.edit('program', program.id, { name: 'Wrong Parent', expectedRevision: program.revision }, ctx, '0'.repeat(24)), { status: 404 });
    await assert.rejects(service.edit('college', college.id, { status: 'inactive', expectedRevision: college.revision }, ctx), { code: 'ACTIVE_DEPENDENTS' });
  });
  const admissionInput = () => ({ collegeId: college.id, programId: program.id, studentDetails: { fullName: 'Test Applicant', mobileNumber: '9000000000', email: 'applicant@example.invalid', educationalQualification: 'Test Qualification' }, idempotencyKey: randomUUID() });
  await t.test('verified signed-in admission, idempotency, private data and invalid parent rejection', async () => {
    const input = admissionInput();
    assert.equal((await api('/admission-applications', { actor: null, method: 'POST', data: input })).status, 401);
    const [a, b] = await Promise.all([api('/admission-applications', { actor: student, method: 'POST', data: input }), api('/admission-applications', { actor: student, method: 'POST', data: input })]);
    assert.equal(a.status, 201); assert.equal(b.status, 201); assert.equal(a.data.reference, b.data.reference); admission = a.data;
    assert.equal(await models.AdmissionApplication.countDocuments(), 1);
    assert.equal((await api('/admission-applications', { actor: student, method: 'POST', data: { ...input, studentDetails: { ...input.studentDetails, fullName: 'Changed' } } })).status, 409);
    assert.equal((await api('/admin/admission-applications', { actor: student })).status, 403);
    assert.equal((await api('/admin/admission-applications/' + admission.id, { actor: null })).status, 401);
    assert.equal((await api('/admission-applications', { actor: student, method: 'POST', data: { ...admissionInput(), programId: '0'.repeat(24) } })).status, 422);
    assert.equal(JSON.stringify((await api('/colleges', { actor: null })).data).includes('applicant@example.invalid'), false);
  });
  await t.test('admission note-only append, replay conflict, manual review and concurrency conflict', async () => {
    const note = { text: 'Test internal note', idempotencyKey: randomUUID() };
    const noted = await api('/admin/admission-applications/' + admission.id + '/notes', { method: 'POST', data: note });
    assert.equal(noted.status, 200); assert.equal(noted.data.status, 'new'); assert.equal(noted.data.notes[0].actorId, admin.user.publicId);
    const repeat = await api('/admin/admission-applications/' + admission.id + '/notes', { method: 'POST', data: note }); assert.equal(repeat.data.notes.length, 1);
    assert.equal((await api('/admin/admission-applications/' + admission.id + '/notes', { method: 'POST', data: { ...note, text: 'Different' } })).status, 409);
    const outcomes = await Promise.all(['contacted', 'in_process'].map(status => api('/admin/admission-applications/' + admission.id + '/status', { method: 'PATCH', data: { status, expectedRevision: noted.data.revision } })));
    assert.equal(outcomes.filter(r => r.status === 200).length, 1); assert.equal(outcomes.filter(r => r.status === 409).length, 1);
    assert.equal((await api('/admin/admission-applications/' + admission.id + '/status', { method: 'PATCH', actor: reader, data: { status: 'rejected', expectedRevision: 3 } })).status, 403);
  });
  const franchiseInput = () => ({ universityId: university.id, collegeId: college.id, institution: { name: 'Test Applicant Institute', type: 'Test Institute', yearEstablished: 2000 }, programsOffered: ['Test Program'], contact: { person: 'Test Contact', designation: 'Test Director', email: 'franchise@example.invalid', mobile: '9000000000' }, location: { address: 'Test address', city: 'Test City', stateId: state.id, pincode: '110001' }, idempotencyKey: randomUUID() });
  await t.test('franchise persistent guest/owner drafts, capability scope and operator rejection', async () => {
    const input = franchiseInput();
    const result = await api('/franchise-applications', { actor: student, method: 'POST', data: input }); assert.equal(result.status, 201); draft = result.data;
    const replay = await api('/franchise-applications', { actor: student, method: 'POST', data: input }); assert.equal(replay.data.id, draft.id);
    assert.equal((await api('/franchise-applications/' + draft.id + '/status', { actor: other, headers: { 'X-Draft-Capability': draft.draftCapability } })).status, 404);
    const saved = await api('/franchise-applications/' + draft.id, { actor: student, method: 'PATCH', data: { institution: { ...input.institution, name: 'Updated Test Institute' }, expectedRevision: draft.revision } }); assert.equal(saved.status, 200); draft.revision = saved.data.revision;
    const stored = await models.FranchiseApplication.findById(draft.id); assert.equal(stored.institution.name, 'Updated Test Institute');
    const guest = await api('/franchise-applications', { actor: null, method: 'POST', data: franchiseInput() }); assert.equal(guest.status, 201);
    assert.equal((await api('/franchise-applications/' + guest.data.id + '/status', { actor: null })).status, 404);
    assert.equal((await api('/franchise-applications/' + guest.data.id + '/status', { actor: null, headers: { 'X-Draft-Capability': guest.data.draftCapability } })).status, 200);
    await models.FranchiseApplication.updateOne({ _id: guest.data.id }, { $set: { draftExpiresAt: new Date(0) } });
    assert.equal((await api('/franchise-applications/' + guest.data.id + '/status', { actor: null, headers: { 'X-Draft-Capability': guest.data.draftCapability } })).status, 404);
  });
  await t.test('franchise selected documents block submission; document-free submit persists once; approval blocked', async () => {
    const attached = await service.editDraft(draft.id, { expectedRevision: draft.revision, pendingDocuments: [{ purpose: 'registrationCert', name: 'test.pdf', size: 100, contentType: 'application/pdf' }] }, student, draft.draftCapability, ctx); draft.revision = attached.revision;
    await assert.rejects(service.submitFranchise(draft.id, { expectedRevision: draft.revision, declaration: { version: 'franchise-v1', accepted: true } }, student, draft.draftCapability, ctx), { code: 'DOCUMENT_UPLOAD_PENDING' });
    const removed = await service.editDraft(draft.id, { expectedRevision: draft.revision, pendingDocuments: [] }, student, draft.draftCapability, ctx); draft.revision = removed.revision;
    const input = { expectedRevision: draft.revision, declaration: { version: 'franchise-v1', accepted: true } };
    const first = await service.submitFranchise(draft.id, input, student, draft.draftCapability, ctx); assert.equal(first.status, 'pending');
    const repeat = await service.submitFranchise(draft.id, input, student, draft.draftCapability, ctx); assert.equal(repeat.reference, first.reference);
    await assert.rejects(service.editDraft(draft.id, { expectedRevision: first.revision, programsOffered: ['Changed'] }, student, draft.draftCapability, ctx), { code: 'FINALIZED' });
    await assert.rejects(service.review('franchise', draft.id, { status: 'approved', expectedRevision: first.revision }, ctx), { code: 'APPROVAL_POLICY_PENDING' });
    await assert.rejects(service.review('franchise', draft.id, { status: 'rejected', expectedRevision: first.revision }, ctx), { status: 422 });
    const note = await service.review('franchise', draft.id, { text: 'Review note only', idempotencyKey: randomUUID() }, ctx, true); assert.equal(note.status, 'pending');
    const rejected = await service.review('franchise', draft.id, { status: 'rejected', expectedRevision: note.revision, rejectionReason: 'Test review reason' }, ctx); assert.equal(rejected.status, 'rejected');
    assert.equal((await models.College.findById(college.id)).revision, college.revision);
    assert.equal(await authModels.User.countDocuments(), 4);
  });
  await t.test('safe archival retains historical references; inactive taxonomy rejects new relationships', async () => {
    program = await service.edit('program', program.id, { expectedRevision: program.revision }, ctx, college.id, true);
    college = await service.edit('college', college.id, { expectedRevision: college.revision }, ctx, undefined, true);
    university = await service.edit('university', university.id, { expectedRevision: university.revision }, ctx, undefined, true);
    assert.equal((await service.list('college', {})).meta.total, 0); assert.equal(await models.AdmissionApplication.countDocuments(), 1);
    assert.ok(await models.College.findById(college.id)); assert.ok(await models.CollegeProgram.findById(program.id));
    district = await service.edit('taxonomy', district.id, { status: 'inactive', expectedRevision: district.revision }, ctx);
    state = await service.edit('taxonomy', state.id, { status: 'inactive', expectedRevision: state.revision }, ctx);
    await assert.rejects(service.create('taxonomy', { kind: 'district', key: 'new-district', label: 'New', parentIds: [state.id] }, ctx), { status: 422 });
    assert.ok(await authModels.AuditLog.exists({ action: 'college_archived' }));
  });
  await t.test('domain mutation retains its audit during an outage and maintenance delivers exactly once', async () => {
    const original = authModels.AuditLog.updateOne;
    let record;
    try {
      authModels.AuditLog.updateOne = async () => { throw new Error('Isolated audit outage'); };
      record = await service.create('university', { name: 'Audit Outage Fixture', shortName: 'AUDIT-OUTAGE' }, ctx);
      assert.equal((await models.University.findById(record.id)).auditOutbox.length, 1);
      assert.equal(await authModels.AuditLog.countDocuments({ subjectId: record.id }), 0);
    } finally { authModels.AuditLog.updateOne = original; }
    await service.maintenance(); await service.maintenance();
    assert.equal((await models.University.findById(record.id)).auditOutbox.length, 0);
    assert.equal(await authModels.AuditLog.countDocuments({ subjectId: record.id }), 1);
    assert.equal((await models.DomainLock.findById('stage4-hierarchy')).owner, null);
  });
  await t.test('standalone coordination recovers normal failures and never steals an abandoned lock', async () => {
    assert.equal((await models.DomainLock.findById('stage4-hierarchy')).owner, null);
    await models.DomainLock.updateOne({ _id: 'stage4-hierarchy' }, { $set: { owner: 'isolated-crashed-writer', acquiredAt: new Date(0) } });
    await assert.rejects(service.create('university', { name: 'Blocked', shortName: 'BLOCKED' }, ctx), { code: 'DOMAIN_BUSY' });
    assert.equal((await models.DomainLock.findById('stage4-hierarchy')).owner, 'isolated-crashed-writer');
    // This is the exclusively owned test DB, never an automatic application unlock.
    await models.DomainLock.updateOne({ _id: 'stage4-hierarchy', owner: 'isolated-crashed-writer' }, { $set: { owner: null } });
  });
});
