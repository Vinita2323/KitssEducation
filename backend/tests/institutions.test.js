import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { definitionInput, admissionInput, franchiseInput, pageQuery } from '../src/modules/institutions/validation.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';

test('Stage 4 validation rejects mass assignment, operators, unsafe URLs and invalid money/query fields', () => {
  for (const input of [{ name: { $ne: null }, shortName: 'T' }, { name: 'Test', shortName: 'T', approved: true }, { name: 'Test', shortName: 'T', logo: 'javascript:alert(1)' }]) assert.throws(() => definitionInput('university', input, true), { status: 422 });
  assert.throws(() => definitionInput('program', { name: 'Test', degreeType: 'Degree', duration: '3 Years', eligibility: 'Approved requirement', feeMinor: 1.5 }, true), { status: 422 });
  assert.throws(() => pageQuery({ page: '-1' }), { status: 422 });
  assert.throws(() => pageQuery({ q: { $ne: null } }), { status: 422 });
  assert.throws(() => pageQuery({ sort: '$where' }), { status: 422 });
  assert.throws(() => franchiseInput({ universityId: 'wrong', collegeId: 'wrong', idempotencyKey: 'x'.repeat(20) }, true), { status: 422 });
  assert.throws(() => admissionInput({ collegeId: 'a'.repeat(24), programId: 'b'.repeat(24), idempotencyKey: 'x'.repeat(20), studentDetails: { fullName: 'Test', email: 'bad', mobileNumber: '1234567890' } }), { status: 422 });
});
test('Stage 4 schemas constrain definitions and indexes without needing MongoDB', async () => {
  const connection = mongoose.createConnection();
  const models = createInstitutionModels(connection);
  const bad = new models.University({ name: 'Test', shortName: 'T', publicId: 'test', shortNameNormalized: 't', status: 'published' });
  await assert.rejects(bad.validate());
  assert.ok(models.Taxonomy.schema.indexes().some(([index, options]) => index.kind && index.key && options.unique));
  assert.ok(models.CollegeProgram.schema.indexes().some(([index, options]) => index.collegeId && index.nameNormalized && options.unique));
  assert.ok(models.AdmissionApplication.schema.indexes().some(([index, options]) => index.ownerKey && index.idempotencyKey && options.unique));
  assert.equal(models.FranchiseApplication.schema.path('draftCapabilityHash').options.select, false);
  assert.equal(models.DomainLock.schema.indexes().some(([, options]) => options.expireAfterSeconds !== undefined), false);
  await connection.close();
});
