import { escapeRegex } from '../../utils/escapeRegex.js';
import { generateTaxonomyKey } from './taxonomy-key.js';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { AppError } from '../../utils/AppError.js';
import { digest, mac } from '../auth/security.js';
import { id, invalid, definitionInput, pageQuery, admissionInput, franchiseInput, revision, object, noteText, key } from './validation.js';

const names = { taxonomy: 'Taxonomy', university: 'University', college: 'College', program: 'CollegeProgram', admission: 'AdmissionApplication', franchise: 'FranchiseApplication' };
const missing = () => new AppError(404, 'NOT_FOUND', 'The requested resource was not found');
const conflict = () => new AppError(409, 'REVISION_CONFLICT', 'This record changed; refresh before retrying');
const expression = text => new RegExp(escapeRegex(text), 'i');
const canonical = value => value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : Array.isArray(value) ? value.map(canonical) : value;
const hash = value => digest(JSON.stringify(canonical(value)));
const stringId = value => String(value);
export const policies = Object.freeze({ admission: 'verified_account', franchiseSubmission: 'documents_optional', franchiseApproval: 'manual_review_only_affiliation_blocked', attachments: 'unavailable' });
export function dto(doc) {
  const value = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  if (!value) return value;
  const { _id, __v, auditOutbox, ownerKey, idempotencyKey, requestHash, draftCapabilityHash, ...rest } = value;
  return JSON.parse(JSON.stringify({ id: String(_id), ...rest }));
}
export function createInstitutionService({ models, authService, config, logger }) {
  const { Taxonomy, University, College, CollegeProgram, AdmissionApplication, FranchiseApplication, DomainLock } = models;
  const modelFor = kind => models[names[kind]];
  const event = (action, ctx) => ({ id: randomUUID(), action, actorId: ctx.actorId, requestId: ctx.requestId, at: new Date() });
  async function flush(Model, doc) {
    for (const item of doc?.auditOutbox ?? []) {
      try {
        await authService.models.AuditLog.updateOne({ _id: item.id }, { $setOnInsert: { action: item.action, subjectId: String(doc._id), actorId: item.actorId, requestId: item.requestId, at: item.at } }, { upsert: true });
        await Model.updateOne({ _id: doc._id }, { $pull: { auditOutbox: { id: item.id } } });
      } catch { logger.error({ event: 'institution_audit_pending' }, 'Domain audit remains durably pending'); break; }
    }
  }
  async function serialize(work) {
    const owner = randomUUID();
    const until = Date.now() + 3000;
    let acquired;
    do {
      acquired = await DomainLock.findOneAndUpdate({ _id: 'stage4-hierarchy', owner: null }, { $set: { owner, acquiredAt: new Date() } }, { returnDocument: 'after' });
      if (!acquired) await delay(30);
    } while (!acquired && Date.now() < until);
    if (!acquired) throw new AppError(503, 'DOMAIN_BUSY', 'Institution changes are temporarily busy; retry later');
    try { return await work(); }
    finally {
      try { await DomainLock.updateOne({ _id: 'stage4-hierarchy', owner }, { $set: { owner: null }, $unset: { acquiredAt: 1 } }); }
      catch { logger.error({ event: 'domain_lock_release_failed' }, 'Institution writes require operator lock recovery'); }
    }
  }
  async function find(kind, value) { const doc = await modelFor(kind).findById(id(value)); if (!doc) throw missing(); return doc; }
  async function activeTax(value, kind) {
    const doc = await Taxonomy.findOne({ _id: id(value), kind, status: 'active', deletedAt: null });
    if (!doc) throw invalid(`Select an active ${kind}`);
    for (const parent of doc.parentIds) if (!await Taxonomy.exists({ _id: parent, status: 'active', deletedAt: null })) throw invalid('Taxonomy parent is inactive');
    return doc;
  }
  async function parentCollege(value, requirePublished = false) {
    const college = await find('college', value);
    const university = await find('university', String(college.universityId));
    if (college.deletedAt || university.deletedAt || ['archived', 'inactive'].includes(college.status) || ['archived', 'inactive'].includes(university.status)) throw invalid('The institution parent is unavailable');
    if (requirePublished && (college.status !== 'active' || college.verification.state !== 'verified' || university.status !== 'active')) throw invalid('Select a published verified college');
    await activeTax(String(college.stateId), 'state');
    if (!await Taxonomy.exists({ kind: 'district', label: college.district, parentIds: college.stateId, status: 'active', deletedAt: null })) throw invalid('The college district is unavailable');
    return { college, university };
  }
  async function relationships(kind, data, existing) {
    if (kind === 'taxonomy') {
      if (existing && (data.kind !== existing.kind || data.key !== existing.key || JSON.stringify((data.parentIds ?? []).map(String).sort()) !== JSON.stringify(existing.parentIds.map(String).sort()))) throw invalid('Taxonomy kind, canonical key and hierarchy are immutable; create a replacement');
      const parentKind = { class: 'board', subject: 'class', district: 'state' }[data.kind];
      if (data.parentIds?.length && !parentKind) throw invalid('This taxonomy kind has no parent');
      if (data.kind === 'district' && data.parentIds?.length !== 1) throw invalid('District requires exactly one state');
      for (const parent of data.parentIds ?? []) await activeTax(String(parent), parentKind);
      if (existing && data.status !== 'active') {
        const districtReferenced = existing.kind === 'district' && await College.exists({ stateId: { $in: existing.parentIds }, district: existing.label, status: 'active', deletedAt: null });
        if (districtReferenced || await Taxonomy.exists({ parentIds: existing._id, status: 'active', deletedAt: null }) || await College.exists({ stateId: existing._id, status: 'active', deletedAt: null })) throw new AppError(409, 'ACTIVE_DEPENDENTS', 'Deactivate dependent records first');
      }
      if (existing?.kind === 'district' && data.label !== existing.label && await College.exists({ stateId: { $in: existing.parentIds }, district: existing.label })) throw new AppError(409, 'REFERENCED_TAXONOMY', 'A referenced district label cannot change; create a replacement');
    }
    if (kind === 'university' && existing && data.status !== 'active' && await College.exists({ universityId: existing._id, status: 'active', deletedAt: null })) throw new AppError(409, 'ACTIVE_DEPENDENTS', 'Deactivate active colleges before this university');
    if (kind === 'college') {
      if (existing && String(data.universityId) !== String(existing.universityId)) throw invalid('College university membership is immutable; archive and create a replacement');
      if (existing && data.status !== 'active' && String(data.stateId) === String(existing.stateId) && data.district === existing.district) {
        if (await CollegeProgram.exists({ collegeId: existing._id, status: 'active', deletedAt: null })) throw new AppError(409, 'ACTIVE_DEPENDENTS', 'Deactivate active programs before this college');
        return;
      }
      const university = await find('university', String(data.universityId));
      if (university.deletedAt || university.status !== 'active') throw invalid('Choose an active university');
      await activeTax(String(data.stateId), 'state');
      if (!await Taxonomy.exists({ kind: 'district', label: data.district, parentIds: id(String(data.stateId)), status: 'active', deletedAt: null })) throw invalid('Choose an active district belonging to the selected state');
      if (data.status === 'active' && (data.verification?.state !== 'verified' || !data.verification?.source)) throw invalid('Publishing requires explicit verified relationship evidence');
      if (existing && data.status !== 'active' && await CollegeProgram.exists({ collegeId: existing._id, status: 'active', deletedAt: null })) throw new AppError(409, 'ACTIVE_DEPENDENTS', 'Deactivate active programs before this college');
    }
    if (kind === 'program' && (!existing || data.status === 'active')) await parentCollege(String(data.collegeId), data.status === 'active');
  }
  async function update(Model, doc, changes, expectedRevision, action, ctx, extra = {}) {
    const updated = await Model.findOneAndUpdate({ _id: doc._id, revision: expectedRevision, 'auditOutbox.999': { $exists: false }, ...extra }, {
      $set: { ...changes, updatedBy: ctx.actorId }, $inc: { revision: 1 }, $push: { auditOutbox: event(action, ctx) },
    }, { returnDocument: 'after', runValidators: true });
    if (!updated) throw conflict();
    await flush(Model, updated); return updated;
  }
  async function paged(Model, filter, query, sort) {
    const total = await Model.countDocuments(filter);
    const data = await Model.find(filter).sort(sort ?? (query.sort === 'newest' ? { createdAt: -1, _id: -1 } : { name: 1, _id: 1 })).skip((query.page - 1) * query.pageSize).limit(query.pageSize).lean();
    return { data, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }
  async function visibleColleges(query = {}) {
    const universities = await University.find({ status: 'active', deletedAt: null }).select('_id');
    const states = await Taxonomy.find({ kind: 'state', status: 'active', deletedAt: null }).select('_id');
    const filter = { status: 'active', deletedAt: null, 'verification.state': 'verified', universityId: { $in: universities.map(u => u._id) }, stateId: { $in: states.map(s => s._id) } };
    const districts = await Taxonomy.find({ kind: 'district', status: 'active', deletedAt: null }).select('label parentIds').lean();
    const validDistricts = districts.flatMap(d => d.parentIds.map(parent => ({ stateId: parent, district: d.label })));
    filter.$and = [validDistricts.length ? { $or: validDistricts } : { _id: { $in: [] } }];
    if (query.universityId) filter.universityId = { $in: universities.filter(u => String(u._id) === String(id(query.universityId))).map(u => u._id) };
    if (query.stateId) filter.stateId = { $in: states.filter(s => String(s._id) === String(id(query.stateId))).map(s => s._id) };
    if (query.state) { const state = await Taxonomy.findOne({ kind: 'state', label: query.state, status: 'active', deletedAt: null }); filter.stateId = { $in: state ? [state._id] : [] }; }
    if (query.district) filter.district = query.district;
    if (query.category) { if (!['University', 'College', 'School', 'Institute'].includes(query.category)) throw invalid('Invalid category'); filter.category = query.category; }
    if (query.view && !['colleges', 'institutes'].includes(query.view)) throw invalid('Invalid directory view');
    if (query.view === 'institutes') filter.category = query.category ?? { $ne: 'University' };
    if (query.degree) filter._id = { $in: (await CollegeProgram.find({ status: 'active', deletedAt: null, degreeType: query.degree }).select('collegeId')).map(p => p.collegeId) };
    if (query.q) {
      const regex = expression(query.q);
      const programs = await CollegeProgram.find({ status: 'active', deletedAt: null, name: regex }).select('collegeId');
      filter.$or = ['name', 'city', 'district', 'description'].map(k => ({ [k]: regex })).concat({ _id: { $in: programs.map(p => p.collegeId) } });
    }
    return filter;
  }
  async function decorateColleges(rows, admin = false) {
    const universities = await University.find({ _id: { $in: rows.map(c => c.universityId) } }).lean();
    const states = await Taxonomy.find({ _id: { $in: rows.map(c => c.stateId) } }).lean();
    const programs = await CollegeProgram.find({ collegeId: { $in: rows.map(c => c._id) }, status: 'active', deletedAt: null }).lean();
    return rows.map(row => {
      const university = universities.find(u => String(u._id) === String(row.universityId));
      const state = states.find(s => String(s._id) === String(row.stateId));
      const related = programs.filter(p => String(p.collegeId) === String(row._id));
      const result = dto(row);
      if (!admin) { delete result.verification; delete result.createdBy; delete result.updatedBy; delete result.deletedAt; }
      return { ...result, verified: row.verification?.state === 'verified', state: state?.label ?? '', university: university ? { id: String(university._id), name: university.name, shortName: university.shortName } : null,
        coursesCount: related.length, popularCourses: related.slice(0, 3).map(p => p.name), degreeTypes: [...new Set(related.map(p => p.degreeType))] };
    });
  }
  async function validateFranchise(data, complete = false) {
    const { college, university } = await parentCollege(String(data.collegeId), true);
    if (String(college.universityId) !== String(data.universityId)) throw invalid('College does not belong to this university');
    if (data.location?.stateId) await activeTax(String(data.location.stateId), 'state');
    if (complete) {
      if (!data.institution?.name || !data.institution?.type || !data.contact?.person || !data.contact?.email || !data.contact?.designation || !/^[+\d ()-]{10,32}$/.test(data.contact?.mobile ?? '') || !data.location?.address || !data.location?.city || !data.location?.stateId || !/^\d{6}$/.test(data.location?.pincode ?? '') || !data.programsOffered?.length) throw invalid('Complete all institution, contact, location and program fields');
      for (const [kind, label] of [['institution_type', data.institution.type], ['designation', data.contact.designation]]) if (!await Taxonomy.exists({ kind, label, status: 'active', deletedAt: null })) throw invalid(`Choose an active ${kind}`);
      if (data.pendingDocuments?.length) throw new AppError(409, 'DOCUMENT_UPLOAD_PENDING', 'Selected files are not uploaded. Remove them to submit without documents, or wait for secure uploads.');
    }
    return { college, university };
  }
  async function ownedDraft(value, auth, capability) {
    const doc = await FranchiseApplication.findById(id(value)).select('+draftCapabilityHash');
    if (!doc) throw missing();
    const own = doc.applicantUserId ? auth && String(auth.user._id) === String(doc.applicantUserId) : typeof capability === 'string' && capability.length <= 100 && doc.draftCapabilityHash === digest(capability) && doc.draftExpiresAt > new Date();
    if (!own) throw missing();
    return doc;
  }
  async function reviewDTO(doc) {
    const result = dto(doc);
    if (doc.workflowVersion === 1 && service.franchiseWorkflow) result.affiliationState = service.franchiseWorkflow.state(doc);
    const college = await College.findById(doc.collegeId).select('name universityId').lean();
    const university = college ? await University.findById(college.universityId).select('name').lean() : null;
    result.parentCollegeName = college?.name ?? '';
    result.parentUniversityName = university?.name ?? '';
    if (doc.location?.stateId) result.stateLabel = (await Taxonomy.findById(doc.location.stateId).select('label').lean())?.label ?? '';
    return result;
  }
  const service = {
    models,
    async initialize() {
      for (const Model of Object.values(models)) await Model.createIndexes();
      try { await DomainLock.updateOne({ _id: 'stage4-hierarchy' }, { $setOnInsert: { owner: null } }, { upsert: true }); } catch (error) { if (error.code !== 11000) throw error; }
      await service.maintenance();
    },
    async maintenance() { for (const [name, Model] of Object.entries(models)) if (name !== 'DomainLock') for await (const doc of Model.find({ 'auditOutbox.0': { $exists: true } }).cursor()) await flush(Model, doc); },
    async create(kind, input, ctx, parentId) {
      const fields = definitionInput(kind, input, true);
      return serialize(async () => {
        const Model = modelFor(kind);
        const data = { ...fields, ...(kind === 'program' ? { collegeId: String(id(parentId)) } : {}), createdBy: ctx.actorId, updatedBy: ctx.actorId };
        if (kind !== 'taxonomy' && kind !== 'program') data.publicId = `${kind.toUpperCase()}-${randomUUID()}`;
        data.status ??= kind === 'taxonomy' ? 'active' : 'draft';
        if (kind === 'taxonomy') data.parentIds ??= [];
        if (kind === 'university') data.shortNameNormalized = data.shortName.toLowerCase();
        if (kind === 'program') data.nameNormalized = data.name.toLowerCase();
        if (kind === 'college' && data.verification) data.verification = { ...data.verification, actorId: ctx.actorId, checkedAt: new Date() };
        await relationships(kind, data);
        if (kind === 'taxonomy' && !data.key) data.key = await generateTaxonomyKey(data, Taxonomy);
        const doc = await Model.create({ ...data, auditOutbox: [event(`${kind}_created`, ctx)] });
        await flush(Model, doc); return dto(doc);
      });
    },
    async edit(kind, value, input, ctx, parentId, archive = false) {
      const fields = archive ? (object(input, ['expectedRevision'], ['expectedRevision']), { expectedRevision: revision(input.expectedRevision), status: kind === 'taxonomy' ? 'inactive' : 'archived', deletedAt: new Date() }) : definitionInput(kind, input);
      return serialize(async () => {
        const doc = await find(kind, value);
        if (kind === 'program' && String(doc.collegeId) !== String(id(parentId))) throw missing();
        if (doc.deletedAt) throw new AppError(409, 'ARCHIVED', 'Archived records cannot be edited');
        const { expectedRevision, ...changes } = fields;
        const merged = { ...doc.toObject(), ...changes };
        if (kind === 'university' && changes.shortName) changes.shortNameNormalized = changes.shortName.toLowerCase();
        if (kind === 'program' && changes.name) changes.nameNormalized = changes.name.toLowerCase();
        if (kind === 'college' && changes.verification) changes.verification = { ...changes.verification, actorId: ctx.actorId, checkedAt: new Date() };
        await relationships(kind, merged, doc);
        return dto(await update(modelFor(kind), doc, changes, expectedRevision, `${kind}_${archive ? 'archived' : 'updated'}`, ctx));
      });
    },
    async list(kind, raw = {}, admin = false, parentId) {
      const query = pageQuery(raw, ['status', 'kind', 'parentId', 'universityId', 'stateId', 'state', 'district', 'category', 'degree', 'view', 'admissionStatus']);
      if (!admin && raw.status && raw.status !== 'active') throw invalid('Public directories expose active records only');
      let filter = { deletedAt: null };
      if (kind === 'college' && !admin) filter = await visibleColleges(raw);
      else if (raw.status) { if (!(kind === 'taxonomy' ? ['active', 'inactive'] : ['draft', 'active', 'inactive', 'archived']).includes(raw.status)) throw invalid('Invalid status'); filter.status = raw.status; if (admin && raw.status === 'archived') delete filter.deletedAt; }
      else if (!admin) filter.status = 'active';
      if (kind === 'taxonomy') {
        if (raw.kind) { if (!['board', 'class', 'subject', 'program', 'language', 'state', 'district', 'qualification', 'designation', 'experience', 'institution_type'].includes(raw.kind)) throw invalid('Invalid taxonomy kind'); filter.kind = raw.kind; }
        if (raw.parentId) filter.parentIds = id(raw.parentId);
      }
      if (admin && kind === 'college' && raw.universityId) filter.universityId = id(raw.universityId);
      if (kind === 'program') {
        if (admin) await find('college', parentId); else { try { await parentCollege(parentId, true); } catch { throw missing(); } }
        filter.collegeId = id(parentId);
        if (raw.degree) filter.degreeType = raw.degree;
        if (raw.admissionStatus) { if (!['open', 'closed'].includes(raw.admissionStatus)) throw invalid('Invalid admissions status'); filter.admissionStatus = raw.admissionStatus; }
      }
      if (query.q && !(kind === 'college' && !admin)) filter.$or = (kind === 'taxonomy' ? ['label', 'key'] : ['name']).map(k => ({ [k]: expression(query.q) }));
      const result = await paged(modelFor(kind), filter, query, kind === 'taxonomy' ? { sortOrder: 1, label: 1, _id: 1 } : undefined);
      result.data = kind === 'college' ? await decorateColleges(result.data, admin) : result.data.map(row => { const value = dto(row); if (!admin) for (const field of ['createdBy', 'updatedBy', 'deletedAt', 'shortNameNormalized', 'nameNormalized']) delete value[field]; return value; });
      if (kind === 'university' && admin) {
        result.data = await Promise.all(result.data.map(async university => ({ ...university,
          totalColleges: await College.countDocuments({ universityId: id(university.id), deletedAt: null }),
          activeColleges: await College.countDocuments({ universityId: id(university.id), status: 'active', deletedAt: null }),
        })));
      }
      return result;
    },
    async detail(kind, value, admin = false, parentId) {
      const doc = await find(kind, value);
      if (kind === 'program' && String(doc.collegeId) !== String(id(parentId))) throw missing();
      if (!admin) {
        if (kind === 'college' && !await College.exists({ ...await visibleColleges(), _id: doc._id })) throw missing();
        if (doc.status !== 'active' || doc.deletedAt) throw missing();
      }
      return kind === 'college' ? (await decorateColleges([doc.toObject()], admin))[0] : dto(doc);
    },
    async facets(raw) {
      pageQuery(raw, ['view', 'universityId', 'stateId', 'state', 'district', 'category', 'degree']);
      const all = await College.find(await visibleColleges({ ...raw, q: undefined, state: undefined, district: undefined, stateId: undefined })).lean();
      const states = await Taxonomy.find({ _id: { $in: all.map(c => c.stateId) } }).sort({ label: 1 }).lean();
      const universities = await University.find({ _id: { $in: all.map(c => c.universityId) } }).sort({ name: 1 }).lean();
      const selected = all.filter(c => (!raw.stateId || String(c.stateId) === raw.stateId) && (!raw.state || states.find(s => String(s._id) === String(c.stateId))?.label === raw.state));
      const programs = await CollegeProgram.find({ collegeId: { $in: selected.map(c => c._id) }, status: 'active', deletedAt: null }).lean();
      return { states: states.map(s => ({ id: String(s._id), label: s.label })), districts: [...new Set(selected.map(c => c.district))].sort(), categories: [...new Set(all.map(c => c.category))].sort(), universities: universities.map(u => ({ id: String(u._id), name: u.name })), degrees: [...new Set(programs.map(p => p.degreeType))].sort(), policies };
    },
    async submitAdmission(input, auth, ctx) {
      if (!auth || auth.user.status !== 'active' || !auth.user.emailVerifiedAt) throw new AppError(401, 'UNAUTHENTICATED', 'Sign in with a verified account to apply');
      const fields = admissionInput(input);
      await authService.limit(ctx, String(auth.user._id), 'admission', 10);
      return serialize(async () => {
        const ownerKey = String(auth.user._id), requestHash = hash(fields);
        const prior = await AdmissionApplication.findOne({ ownerKey, idempotencyKey: fields.idempotencyKey }).select('+requestHash');
        if (prior) { if (prior.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Submission key was already used for different information'); return { id: String(prior._id), reference: prior.reference, status: prior.status }; }
        const { college, university } = await parentCollege(fields.collegeId, true);
        const program = await CollegeProgram.findOne({ _id: id(fields.programId), collegeId: college._id, status: 'active', admissionStatus: 'open', deletedAt: null });
        if (!program) throw invalid('Select an open program belonging to this college');
        if (fields.studentDetails.educationalQualification && !await Taxonomy.exists({ kind: 'qualification', label: fields.studentDetails.educationalQualification, status: 'active', deletedAt: null })) throw invalid('Choose an active qualification');
        const doc = await AdmissionApplication.create({ ...fields, ownerKey, requestHash, userId: auth.user._id, reference: `ADM-${randomUUID()}`, programSnapshot: { name: program.name, degreeType: program.degreeType, collegeName: college.name, universityName: university.name, feeMinor: program.feeMinor, currency: program.currency }, auditOutbox: [event('admission_submitted', ctx)] });
        await flush(AdmissionApplication, doc); return { id: String(doc._id), reference: doc.reference, status: doc.status };
      });
    },
    async createDraft(input, auth, ctx) {
      const fields = franchiseInput(input, true);
      await authService.limit(ctx, auth?.user.publicId ?? ctx.ip, 'franchise', 10);
      return serialize(async () => {
        const ownerKey = auth ? String(auth.user._id) : 'guest';
        const capability = mac(config.auth.secret, `franchise:${ownerKey}:${fields.idempotencyKey}`);
        const requestHash = hash(fields);
        const prior = await FranchiseApplication.findOne({ ownerKey, idempotencyKey: fields.idempotencyKey }).select('+requestHash');
        if (prior) { if (prior.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Draft key was already used'); return { id: String(prior._id), reference: prior.reference, revision: prior.revision, draftCapability: capability, expiresAt: prior.draftExpiresAt }; }
        await validateFranchise(fields);
        const doc = await FranchiseApplication.create({ ...fields, ownerKey, requestHash, ...(auth ? { applicantUserId: auth.user._id } : {}), reference: `FRN-${randomUUID()}`, draftCapabilityHash: digest(capability), draftExpiresAt: new Date(Date.now() + 86400000), auditOutbox: [event('franchise_draft_created', ctx)] });
        await flush(FranchiseApplication, doc); return { id: String(doc._id), reference: doc.reference, revision: doc.revision, draftCapability: capability, expiresAt: doc.draftExpiresAt };
      });
    },
    async editDraft(value, input, auth, capability, ctx) {
      const fields = franchiseInput(input);
      return serialize(async () => {
        const doc = await ownedDraft(value, auth, capability);
        if (doc.status !== 'draft') throw new AppError(409, 'FINALIZED', 'Submitted applications cannot be edited');
        const { expectedRevision, ...changes } = fields;
        await validateFranchise({ ...doc.toObject(), ...changes });
        return dto(await update(FranchiseApplication, doc, changes, expectedRevision, 'franchise_draft_updated', ctx));
      });
    },
    async submitFranchise(value, input, auth, capability, ctx) {
      object(input, ['expectedRevision', 'declaration'], ['expectedRevision', 'declaration']);
      revision(input.expectedRevision); object(input.declaration, ['version', 'accepted'], ['version', 'accepted']);
      if (input.declaration.accepted !== true || input.declaration.version !== 'franchise-v1') throw invalid('Accept the current franchise declaration');
      return serialize(async () => {
        const doc = await ownedDraft(value, auth, capability);
        if (doc.status !== 'draft') return { id: String(doc._id), reference: doc.reference, status: doc.status, revision: doc.revision };
        await validateFranchise(doc, true);
        const updated = await update(FranchiseApplication, doc, { status: 'pending', submittedAt: new Date(), declaration: { version: input.declaration.version, acceptedAt: new Date() } }, input.expectedRevision, 'franchise_submitted', ctx);
        return { id: String(updated._id), reference: updated.reference, status: updated.status, revision: updated.revision };
      });
    },
    async draftStatus(value, auth, capability) {
      const doc = await ownedDraft(value, auth, capability);
      return { id: String(doc._id), reference: doc.reference, status: doc.status, revision: doc.revision, submittedAt: doc.submittedAt, rejectionReason: doc.rejectionReason, draft: doc.status === 'draft' ? dto(doc) : undefined, documentsStatus: doc.pendingDocuments.length ? 'selected_not_uploaded' : 'none' };
    },
    async reviews(kind, raw) {
      const query = pageQuery(raw, ['status', 'collegeId', 'universityId']);
      const filter = {};
      if (raw.status) { if (!(kind === 'admission' ? ['new', 'contacted', 'in_process', 'approved', 'rejected'] : ['draft', 'pending', 'needs_changes', 'approved', 'rejected']).includes(raw.status)) throw invalid('Invalid application status'); filter.status = raw.status; }
      if (raw.collegeId) filter.collegeId = id(raw.collegeId);
      if (raw.universityId && kind === 'franchise') filter.universityId = id(raw.universityId);
      if (raw.q) filter.$or = (kind === 'admission' ? ['reference', 'studentDetails.fullName', 'studentDetails.email'] : ['reference', 'institution.name', 'contact.email']).map(k => ({ [k]: expression(raw.q) }));
      const result = await paged(modelFor(kind), filter, query, { createdAt: -1, _id: -1 });
      result.data = await Promise.all(result.data.map(reviewDTO)); return result;
    },
    reviewDetail: async (kind, value) => reviewDTO(await find(kind, value)),
    async review(kind, value, input, ctx, noteOnly = false) {
      object(input, noteOnly ? ['text', 'idempotencyKey'] : ['status', 'reason', 'rejectionReason', 'note', 'expectedRevision'], noteOnly ? ['text', 'idempotencyKey'] : ['status', 'expectedRevision']);
      return serialize(async () => {
        const Model = modelFor(kind), doc = await find(kind, value);
        if (doc.status === 'draft') throw new AppError(409, 'DRAFT_ONLY', 'Only submitted applications can be reviewed');
        if (doc.notes.length >= 200 || doc.statusHistory.length >= 100) throw new AppError(409, 'HISTORY_LIMIT', 'Application history requires operator archival review');
        if (noteOnly) {
          const text = noteText(input.text), noteId = key(input.idempotencyKey), requestHash = hash({ text });
          const previous = doc.notes.find(n => n.id === noteId);
          if (previous) { if (previous.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Note key was reused'); return dto(doc); }
          const notes = [...doc.notes.map(n => n.toObject()), { id: noteId, text, requestHash, actorId: ctx.actorId, createdAt: new Date() }];
          return dto(await update(Model, doc, { notes }, doc.revision, `${kind}_note_added`, ctx));
        }
        const expectedRevision = revision(input.expectedRevision);
        if (kind === 'franchise' && input.status === 'approved' && !(input.reason ?? input.note)?.trim()) throw invalid('Manual review approval requires a recorded reason; official affiliation remains blocked');
        const allowed = kind === 'admission' ? { new: ['contacted', 'in_process', 'rejected'], contacted: ['in_process', 'rejected'], in_process: ['approved', 'rejected'], approved: [], rejected: [] } : { pending: ['approved', 'rejected'], approved: [], rejected: [] };
        if (!(allowed[doc.status] ?? []).includes(input.status)) throw new AppError(409, 'INVALID_TRANSITION', 'This status transition is not allowed');
        const reason = input.rejectionReason ?? input.reason;
        if (kind === 'franchise' && input.status === 'rejected' && !reason) throw invalid('A rejection reason is required');
        const changes = { status: input.status, reviewedAt: new Date(), reviewedBy: ctx.actorId, statusHistory: [...doc.statusHistory.map(h => h.toObject()), { from: doc.status, to: input.status, actorId: ctx.actorId, at: new Date(), ...(reason ? { reason: noteText(reason) } : {}) }] };
        if (kind === 'franchise' && input.status === 'rejected' && reason) changes.rejectionReason = noteText(reason);
        if (input.note) changes.notes = [...doc.notes.map(n => n.toObject()), { id: randomUUID(), text: noteText(input.note), actorId: ctx.actorId, createdAt: new Date() }];
        return dto(await update(Model, doc, changes, expectedRevision, `${kind}_reviewed`, ctx));
      });
    },
  };
  return service;
}
