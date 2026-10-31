import test from 'node:test';
import assert from 'node:assert/strict';
import { createFranchiseWorkflow } from '../src/modules/franchise/workflow.js';
import { createBusinessPolicyService } from '../src/modules/commerce/business-policy.js';
import { initialWorkflowPolicy } from '../src/modules/franchise/policy.js';
import { createPublishingService } from '../src/modules/publishing/publishing.service.js';

const applicationId = 'a'.repeat(24), portraitId = 'b'.repeat(24), profileId = 'c'.repeat(24), ctx = { actorId: 'admin' };
test('franchise approval creates a safe public listing; hide and publish are revision-protected', async () => {
  const row = { _id: applicationId, revision: 1, workflowVersion: 1, status: 'pending', applicantUserId: 'owner', institution: { name: 'Approved institute', type: 'Institute', website: 'https://example.invalid' }, contact: { person: 'Private person', email: 'private@example.invalid', mobile: '9999999999' }, location: { address: 'Private address', city: 'Public City', pincode: '123456' }, policySnapshot: { ...initialWorkflowPolicy(), documents: [] }, documents: [], statusHistory: [], programsOffered: ['Maths'], notes: ['private note'] };
  let visible = [];
  const Application = { findById: async () => row, countDocuments: async () => visible.length, find: filter => {
    assert.equal(filter.status, 'approved'); assert.deepEqual(filter.listingPublishedAt, { $ne: null }); assert.deepEqual(filter.listingHidden, { $ne: true });
    const query = { sort: () => query, skip: () => query, limit: () => query, lean: async () => visible }; return query;
  } };
  const coordination = { run: work => work(), update: async (model, current, fields, expected) => { assert.equal(expected, current.revision); Object.assign(current, fields, { revision: current.revision + 1 }); return current; } };
  const workflow = createFranchiseWorkflow({ publishingModule: { models: {}, coordination }, eligible: () => {}, authService: { models: { User: { findById: async () => ({ status: 'active', emailVerifiedAt: new Date() }) } } } }, { models: { FranchiseApplication: Application } });
  const approved = await workflow.review(applicationId, { expectedRevision: 1, status: 'approved', reason: 'Details reviewed' }, ctx);
  assert.ok(approved.listingPublishedAt); assert.ok(approved.activatedAt);
  visible = [row];
  const listing = (await workflow.directory()).data[0];
  assert.deepEqual(Object.keys(listing).sort(), ['id', 'name', 'type', 'city', 'website', 'programs'].sort());
  assert.equal(JSON.stringify(listing).includes('private'), false);
  await workflow.listing(applicationId, { expectedRevision: 2, publish: false, reason: 'Temporarily hide' }, ctx);
  assert.equal(row.listingHidden, true);
  await assert.rejects(() => workflow.directory({ status: 'pending' }), { status: 422 });
  await assert.rejects(() => workflow.directory({ page: '0' }), { status: 422 });
  row.status = 'pending';
  await assert.rejects(() => workflow.listing(applicationId, { expectedRevision: 3, publish: true, reason: 'Not approved' }, ctx), { status: 409 });
});

test('approved teacher publication requires permissions, review and clean public portrait; retries do not duplicate or grant access', async () => {
  const policy = { status: 'active', currency: 'INR', feeRequired: false, amountMinor: 0, documents: [], privacyApproved: true, documentsApproved: true };
  const row = { _id: applicationId, userId: 'owner', reference: 'TEACHER-1', kind: 'teacher', status: 'approved', revision: 1, applicant: { fullName: 'Private applicant name', dob: '1990-01-01', email: 'private@example.invalid' }, policySnapshot: policy, documents: [], history: [] };
  let profile, creates = 0, portraitClean = true;
  const Application = { findById: async () => row, findOneAndUpdate: async (filter, change) => { assert.equal(filter.revision, row.revision); Object.assign(row, change.$set, { revision: row.revision + 1 }); return row; } };
  const Faculty = { findOne: async () => profile, create: async fields => { creates++; profile = { ...fields, _id: profileId }; return profile; } };
  const publishing = { models: { RegistrationApplication: Application, FacultyProfile: Faculty, SiteSettings: { findOne: () => ({ lean: async () => ({ revision: 1, value: { registrations: { teacher: policy } } }) }) } }, coordination: { run: work => work(), event: () => ({}), flush: async () => {} }, media: { linkable: async (id, purpose) => { assert.equal(id, portraitId); assert.equal(purpose, 'faculty'); if (!portraitClean) throw Object.assign(new Error('Portrait not cleared'), { status: 409 }); } } };
  const commerce = { publishingModule: publishing, models: { RegistrationApplication: Application }, authService: { models: { User: { findById: async () => ({ _id: 'owner', status: 'active', emailVerifiedAt: new Date() }) } } }, eligible: () => {}, flush: async () => {}, applicationDTO: value => ({ ...value }) };
  const business = createBusinessPolicyService(commerce), admin = { user: { roles: ['super_admin'] } };
  const input = { expectedRevision: 1, profile: { name: 'Public Teacher', role: 'Teacher', portraitAssetId: portraitId } };
  await assert.rejects(() => business.publishTeacher(applicationId, input, { user: { roles: ['student'] } }, ctx), { status: 403 });
  row.status = 'submitted'; await assert.rejects(() => business.publishTeacher(applicationId, input, admin, ctx), { status: 409 });
  row.status = 'approved'; portraitClean = false; await assert.rejects(() => business.publishTeacher(applicationId, input, admin, ctx), { status: 409 });
  portraitClean = true;
  const result = await business.publishTeacher(applicationId, input, admin, ctx);
  assert.equal(result.teacherProfileId, profileId); assert.equal(profile.badge, 'KITSS Teacher'); assert.equal(profile.status, 'published');
  const publicProfile = createPublishingService({ models: {} }).publicData('faculty', profile);
  assert.equal(publicProfile.name, 'Public Teacher');
  for (const key of ['applicant', 'registrationApplicationId', 'userId', 'email', 'sourceNote', 'documents']) assert.equal(Object.hasOwn(publicProfile, key), false);
  await business.publishTeacher(applicationId, input, admin, ctx); assert.equal(creates, 1);
  assert.equal(Object.hasOwn(row, 'roles'), false); assert.equal(Object.hasOwn(row, 'permissions'), false);
});
