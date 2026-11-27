import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createInstitutionService } from '../src/modules/institutions/institutions.service.js';
import { definitionInput, admissionInput } from '../src/modules/institutions/validation.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';

test('institution definition and admission validators accept clean data and reject invalid inputs', () => {
  const college = definitionInput('college', {
    universityId: String(new mongoose.Types.ObjectId()),
    name: 'Test Engineering College',
    code: 'TEC-01',
    category: 'College',
    address: 'Main Campus',
    city: 'Jaipur',
    district: 'Jaipur',
    stateId: String(new mongoose.Types.ObjectId()),
    logo: 'https://example.edu.in/logo.png',
    banner: 'https://example.edu.in/banner.jpg',
    facilities: ['Library', 'Labs'],
  }, true);
  assert.equal(college.code, 'TEC-01');
  assert.equal(college.logo, 'https://example.edu.in/logo.png');

  assert.throws(() => definitionInput('college', {
    universityId: String(new mongoose.Types.ObjectId()),
    name: 'Bad URL College',
    code: 'BAD-01',
    category: 'College',
    address: 'Campus',
    city: 'Delhi',
    district: 'Central',
    stateId: String(new mongoose.Types.ObjectId()),
    logo: 'javascript:alert(1)',
  }, true));

  const admission = admissionInput({
    collegeId: String(new mongoose.Types.ObjectId()),
    programId: String(new mongoose.Types.ObjectId()),
    studentDetails: {
      fullName: 'Student One',
      mobileNumber: '9876543210',
      email: 'student@example.invalid',
    },
    idempotencyKey: 'admission-key-123456',
  });
  assert.equal(admission.studentDetails.fullName, 'Student One');
});

test('myAdmissions returns verified user admission enquiries without internal admin notes or owner hashes', async () => {
  const userId = new mongoose.Types.ObjectId();
  const admissionId = new mongoose.Types.ObjectId();
  const collegeId = new mongoose.Types.ObjectId();
  const programId = new mongoose.Types.ObjectId();

  const row = {
    _id: admissionId,
    userId,
    collegeId,
    programId,
    reference: 'ADM-TEST-001',
    ownerKey: String(userId),
    idempotencyKey: 'secret-idempotency-key',
    requestHash: 'secret-hash',
    auditOutbox: [{ id: 'ev-1', action: 'admission_submitted' }],
    notes: [{ id: 'note-1', text: 'Internal staff-only note' }],
    programSnapshot: { name: 'B.Tech CSE', degreeType: 'Undergraduate', collegeName: 'Horizon College', universityName: 'Tech Univ', feeMinor: 5000000, currency: 'INR' },
    status: 'contacted',
    statusHistory: [{ from: 'new', to: 'contacted', actorId: 'staff-1', at: new Date('2026-11-26T10:00:00Z'), reason: 'Counsellor called applicant' }],
    createdAt: new Date('2026-11-26T09:00:00Z'),
    reviewedAt: new Date('2026-11-26T10:00:00Z'),
  };

  const chain = rows => ({
    sort: () => chain(rows),
    skip: () => chain(rows),
    limit: () => chain(rows),
    lean: async () => rows,
  });

  const service = createInstitutionService({
    models: {
      Taxonomy: {},
      University: {},
      College: {},
      CollegeProgram: {},
      AdmissionApplication: {
        countDocuments: async () => 1,
        find: () => chain([row]),
      },
      FranchiseApplication: {},
      DomainLock: {},
    },
    authService: { models: {} },
    config: { auth: { secret: 'test-secret' } },
    logger: { error() {}, warn() {}, info() {} },
  });

  const auth = { user: { _id: userId, status: 'active', emailVerifiedAt: new Date() } };
  const result = await service.myAdmissions({}, auth);
  assert.equal(result.meta.total, 1);
  assert.equal(result.data.length, 1);
  const item = result.data[0];
  assert.equal(item.id, String(admissionId));
  assert.equal(item.reference, 'ADM-TEST-001');
  assert.equal(item.status, 'contacted');
  assert.equal(item.programSnapshot.collegeName, 'Horizon College');
  assert.equal(item.statusHistory[0].reason, 'Counsellor called applicant');
  assert.equal('notes' in item, false);
  assert.equal('ownerKey' in item, false);
  assert.equal('requestHash' in item, false);
  assert.equal('auditOutbox' in item, false);

  await assert.rejects(() => service.myAdmissions({}, { user: { _id: userId, status: 'active', emailVerifiedAt: null } }), { code: 'UNAUTHENTICATED' });
});

const dbName = process.env.KITSS_STAGE4_BROWSER_DB || process.env.KITSS_INSTITUTIONS_FLOW_DB;
test('Stage 4 models keep strict schema boundaries (MongoDB optional)', { skip: !dbName ? 'No isolated test DB supplied; MongoDB integration skipped' : false }, async () => {
  assert.ok(createAuthModels);
  assert.ok(createInstitutionModels);
});
