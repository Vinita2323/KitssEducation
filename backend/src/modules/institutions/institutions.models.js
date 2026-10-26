import mongoose from 'mongoose';

export const taxonomyKinds = ['board', 'class', 'subject', 'program', 'language', 'state', 'district', 'qualification', 'designation', 'experience', 'institution_type'];
export function createInstitutionModels(connection) {
  const { Schema } = mongoose;
  const str = (max = 160, required = false) => ({ type: String, trim: true, maxlength: max, required });
  const ref = (required = false) => ({ type: Schema.Types.ObjectId, required });
  const event = new Schema({ id: String, action: String, actorId: String, requestId: String, at: Date }, { _id: false });
  const base = { revision: { type: Number, default: 1, min: 1 }, deletedAt: Date, createdBy: String, updatedBy: String, auditOutbox: { type: [event], default: [] } };
  const options = { timestamps: true, strict: 'throw', bufferCommands: false };
  const definition = { ...base, publicId: { ...str(80, true), unique: true }, name: str(160, true), status: { type: String, enum: ['draft', 'active', 'inactive', 'archived'], default: 'draft' } };
  const taxonomy = new Schema({ ...base, kind: { type: String, enum: taxonomyKinds, required: true }, key: str(80, true), label: str(160, true), parentIds: { type: [Schema.Types.ObjectId], default: [] }, sortOrder: { type: Number, default: 0, min: 0, max: 100000, validate: Number.isInteger }, status: { type: String, enum: ['active', 'inactive'], default: 'active' } }, options);
  taxonomy.index({ kind: 1, key: 1 }, { unique: true }); taxonomy.index({ kind: 1, status: 1, sortOrder: 1 });
  const university = new Schema({ ...definition, shortName: str(80, true), shortNameNormalized: { ...str(80, true), unique: true }, logo: str(2048) }, options);
  const college = new Schema({ ...definition, universityId: ref(true), code: { ...str(80, true), unique: true }, category: { type: String, enum: ['University', 'College', 'School', 'Institute'], required: true }, collegeType: str(80), description: str(20000), about: str(20000), address: str(500, true), city: str(160, true), district: str(160, true), stateId: ref(true), country: str(80), pincode: str(12), logo: str(2048), banner: str(2048), facilities: { type: [String], default: [] }, contactInformation: { phone: str(32), email: str(254), website: str(2048) }, admissionInformation: str(2000), verification: { state: { type: String, enum: ['unverified', 'verified'], default: 'unverified' }, source: str(500), checkedAt: Date, actorId: String } }, options);
  college.index({ universityId: 1, status: 1 }); college.index({ stateId: 1, district: 1, status: 1 });
  const program = new Schema({ ...base, collegeId: ref(true), name: str(160, true), nameNormalized: str(160, true), degreeType: str(80, true), duration: str(80, true), eligibility: str(500, true), feeMinor: { type: Number, required: true, min: 0, max: 10000000000, validate: Number.isSafeInteger }, currency: { type: String, enum: ['INR'], default: 'INR' }, description: str(20000), availableSeats: { type: Number, min: 0, max: 1000000, validate: Number.isSafeInteger }, admissionStatus: { type: String, enum: ['open', 'closed'], default: 'closed' }, status: { type: String, enum: ['draft', 'active', 'inactive', 'archived'], default: 'draft' } }, options);
  program.index({ collegeId: 1, nameNormalized: 1, degreeType: 1 }, { unique: true }); program.index({ collegeId: 1, status: 1, admissionStatus: 1 });
  const note = new Schema({ id: String, text: str(2000, true), actorId: String, createdAt: Date, requestHash: String }, { _id: false });
  const history = new Schema({ from: String, to: String, actorId: String, at: Date, reason: str(2000) }, { _id: false });
  const intake = { ...base, reference: { ...str(80, true), unique: true }, ownerKey: { type: String, required: true, select: false }, idempotencyKey: { type: String, required: true, select: false }, requestHash: { type: String, required: true, select: false }, collegeId: ref(true), notes: { type: [note], default: [] }, statusHistory: { type: [history], default: [] } };
  const admission = new Schema({ ...intake, userId: ref(), programId: ref(true), studentDetails: { fullName: str(160, true), mobileNumber: str(32, true), email: str(254, true), dob: str(10), city: str(160), educationalQualification: str(160), passingYear: str(4), additionalInfo: str(2000) }, programSnapshot: { name: String, degreeType: String, collegeName: String, universityName: String, feeMinor: Number, currency: String }, status: { type: String, enum: ['new', 'contacted', 'in_process', 'approved', 'rejected'], default: 'new' }, reviewedAt: Date, reviewedBy: String }, options);
  admission.index({ ownerKey: 1, idempotencyKey: 1 }, { unique: true }); admission.index({ collegeId: 1, status: 1, createdAt: -1 });
  const franchise = new Schema({ ...intake, applicantUserId: ref(), universityId: ref(true), draftCapabilityHash: { type: String, select: false }, draftExpiresAt: Date,
    institution: { name: str(160), type: str(160), yearEstablished: { type: Number, min: 1, max: new Date().getFullYear(), validate: Number.isInteger }, website: str(2048) }, programsOffered: { type: [String], default: [] },
    contact: { person: str(160), designation: str(160), email: str(254), mobile: str(32), alternateMobile: str(32) }, location: { address: str(500), city: str(160), stateId: ref(), pincode: str(12), mapsUrl: str(2048) },
    pendingDocuments: [{ _id: false, purpose: str(80), name: str(160), size: { type: Number, min: 0, max: 5242880 }, contentType: str(100) }],
    affiliationState: { type: String, enum: ['blocked_pending_policy'], default: 'blocked_pending_policy' }, declaration: { version: str(80), acceptedAt: Date }, status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft' }, rejectionReason: str(2000), submittedAt: Date, reviewedAt: Date, reviewedBy: String }, options);
  franchise.index({ ownerKey: 1, idempotencyKey: 1 }, { unique: true }); franchise.index({ status: 1, createdAt: -1 });
  // Necessary standalone coordination, not a business entity or expiring lease.
  // No TTL: a crashed writer leaves a fail-closed lock for operator recovery.
  const lock = new Schema({ _id: String, owner: { type: String, default: null }, acquiredAt: Date }, { versionKey: false });
  const model = (name, schema, collection) => connection.models[name] ?? connection.model(name, schema, collection);
  return { Taxonomy: model('Taxonomy', taxonomy, 'taxonomies'), University: model('University', university, 'universities'), College: model('College', college, 'colleges'), CollegeProgram: model('CollegeProgram', program, 'collegePrograms'), AdmissionApplication: model('AdmissionApplication', admission, 'admissionApplications'), FranchiseApplication: model('FranchiseApplication', franchise, 'franchiseApplications'), DomainLock: model('DomainLock', lock, 'domainLocks') };
}
