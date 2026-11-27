import { adminResultSource } from './admin-source.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { createHash } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { object, id, text, revision, key, invalid } from '../publishing/validation.js';
import { mac, equal } from '../auth/security.js';
const absent = () => new AppError(404, 'RESULT_NOT_FOUND', 'No available result matches these details');
const canonicalRoll = value => text(value, 80).toUpperCase();
const integer = (v, min, max) => {
  if (!Number.isSafeInteger(v) || v < min || v > max) throw invalid('Invalid bounded number');
  return v;
};
const dto = row => {
  const {
    _id,
    auditOutbox,
    verificationHash,
    __v,
    ...rest
  } = row.toObject?.() ?? row;
  return {
    ...rest,
    id: String(_id),
    expectedRevision: (__v ?? 0) + 1
  };
};
const paging = query => {
  const page = integer(Number(query.page ?? 1), 1, 100000),
    pageSize = integer(Number(query.pageSize ?? 20), 1, 100);
  return {
    page,
    pageSize
  };
};
export async function createResultService({
  models,
  publishingModule,
  authService,
  commerceService,
  config,
  trustedSource = () => false
}) {
  const {
    ResultIssuer: Issuer,
    Exam,
    ResultRecord: Record,
    ResultHistory: History
  } = models;
  const coordination = publishingModule.coordination;
  const secret = config.auth.secret;
  // External providers remain closed in production. Admin sources must refer to
  // available platform organizations, with final approval on each academic revision.
  const adminSource = adminResultSource({ publishingModule, commerceService });
  const publicationReady = async issuer => issuer.sourceMode === 'admin' ? adminSource.ready(issuer) : trustedSource(issuer);
  const proof = (fields, issuer) => {
    object(fields, issuer.fieldSchema.map(f => f.id), issuer.fieldSchema.filter(f => f.required).map(f => f.id));
    const normalized = {};
    for (const f of [...issuer.fieldSchema].sort((a, b) => a.id.localeCompare(b.id))) {
      const value = text(fields[f.id] ?? '', 120);
      if (f.required && !value || f.type === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value)) throw invalid('Invalid verification details');
      normalized[f.id] = value;
    }
    return mac(secret, JSON.stringify(normalized));
  };
  const get = async (Model, value) => {
    const row = await Model.findById(id(String(value)));
    if (!row) throw absent();
    return row;
  };
  const service = {
    models,
    async initialize() {
      for (const Model of Object.values(models)) await Model.createIndexes();
    },
    async maintenance() {
      for (const Model of [Issuer, Exam, Record]) for await (const row of Model.find({
        'auditOutbox.0': {
          $exists: true
        }
      }).cursor()) await coordination.flush(Model, row);
    },
    organizations: adminSource.options,
    async config() {
      const issuers = (await Promise.all((await Issuer.find({ status: 'active' })).map(async r => await publicationReady(r) ? r : null))).filter(Boolean);
      return {
        types: ['school', 'university', 'institute'],
        publicationEnabled: issuers.length > 0,
        adminPublicationEnabled: true,
        externalPublicationEnabled: false,
        boardAvailable: false,
        message: 'View results published by your university or institution.',
        issuers: issuers.map(r => ({
          id: String(r._id),
          code: r.key,
          name: r.name,
          fullName: r.fullName,
          type: r.type
        }))
      };
    },
    async issuer(value) {
      const row = await get(Issuer, value);
      if (row.status !== 'active' || !(await publicationReady(row))) throw absent();
      return {
        id: String(row._id),
        code: row.key,
        name: row.name,
        fullName: row.fullName,
        type: row.type,
        fieldSchema: row.fieldSchema,
        exams: (await Exam.find({
          issuerId: row._id,
          status: 'published'
        })).map(dto)
      };
    },
    async students(query = {}) {
      object(query, ['q']);
      const q = text(query.q ?? '', 80);
      if (q.length < 2) return [];
      const match = new RegExp(escapeRegex(q), 'i');
      const users = await authService.models.User.find({
        status: 'active',
        emailVerifiedAt: { $ne: null },
        roles: 'student',
        $or: [{ name: match }, { emailNormalized: match }, { publicId: match }]
      }).select('publicId name emailNormalized profile.dob').sort({ name: 1 }).limit(20).lean();
      return users.map(u => ({ id: u.publicId, name: u.name, email: u.emailNormalized, dob: u.profile?.dob || '' }));
    },
    async list(kind, query = {}) {
      object(query, ['page', 'pageSize', 'q', 'status', 'issuerId', 'examId', 'year', 'reviewStatus']);
      const Model = {
          issuers: Issuer,
          exams: Exam,
          records: Record
        }[kind],
        filter = {},
        {
          page,
          pageSize
        } = paging(query);
      for (const field of ['issuerId', 'examId']) if (query[field]) filter[field] = id(query[field]);
      if (query.reviewStatus) { if (kind !== "records" || !["draft", "submitted", "approved", "rejected"].includes(query.reviewStatus)) throw invalid("Invalid review filter"); filter["review.status"] = query.reviewStatus; }
      if (query.status) filter.status = text(query.status, 30);
      if (query.q) {
        const rx = { $regex: escapeRegex(text(query.q, 80)), $options: 'i' };
        if (kind === 'records') filter.$or = [{ rollNormalized: rx }, { 'student.name': rx }];
        else filter[kind === 'issuers' ? 'name' : 'title'] = rx;
      }
      const total = await Model.countDocuments(filter);
      const rawRows = await Model.find(filter).sort({
        createdAt: -1,
        _id: -1
      }).skip((page - 1) * pageSize).limit(pageSize);
      let data = rawRows.map(dto);
      if (kind === 'records' && data.length) {
        const examIds = [...new Set(data.map(r => String(r.examId)))];
        const exams = new Map((await Exam.find({ _id: { $in: examIds } }).lean()).map(e => [String(e._id), e]));
        const issuerIds = [...new Set([...exams.values()].map(e => String(e.issuerId)))];
        const issuers = new Map((issuerIds.length ? await Issuer.find({ _id: { $in: issuerIds } }).lean() : []).map(i => [String(i._id), i]));
        const userIds = [...new Set(data.map(r => r.userId).filter(Boolean))];
        const users = new Map((userIds.length ? await authService.models.User.find({ _id: { $in: userIds } }).select('publicId').lean() : []).map(u => [String(u._id), u.publicId]));
        data = data.map(r => {
          const exam = exams.get(String(r.examId));
          const issuer = exam ? issuers.get(String(exam.issuerId)) : null;
          return {
            ...r,
            candidatePublicId: users.get(String(r.userId)) || '',
            examTitle: exam?.title || '',
            examStatus: exam?.status || '',
            examYear: exam?.year,
            examSession: exam?.session || '',
            issuerId: issuer ? String(issuer._id) : '',
            issuerName: issuer?.fullName || issuer?.name || '',
            issuerStatus: issuer?.status || ''
          };
        });
      }
      if (kind === 'exams' && data.length) {
        const issuerIds = [...new Set(data.map(e => String(e.issuerId)))];
        const issuers = new Map((await Issuer.find({ _id: { $in: issuerIds } }).lean()).map(i => [String(i._id), i]));
        data = data.map(e => {
          const issuer = issuers.get(String(e.issuerId));
          return { ...e, issuerName: issuer?.fullName || issuer?.name || '', issuerStatus: issuer?.status || '' };
        });
      }
      return {
        data,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      };
    },
    async detail(kind, value) {
      const row = await get({
        issuers: Issuer,
        exams: Exam,
        records: Record
      }[kind], value);
      const audit = await authService.models.AuditLog.find({
        subjectId: String(row._id)
      }).sort({
        at: -1
      }).limit(30).lean();
      let extra = {};
      if (kind === 'records') {
        const exam = await Exam.findById(row.examId).lean();
        const issuer = exam ? await Issuer.findById(exam.issuerId).lean() : null;
        extra = {
          candidatePublicId: (await authService.models.User.findById(row.userId).select('publicId'))?.publicId || '',
          examTitle: exam?.title || '',
          examStatus: exam?.status || '',
          examYear: exam?.year,
          examSession: exam?.session || '',
          issuerId: issuer ? String(issuer._id) : '',
          issuerName: issuer?.fullName || issuer?.name || '',
          issuerStatus: issuer?.status || ''
        };
      }
      return {
        ...dto(row),
        ...extra,
        audit
      };
    },
    async mutate(kind, value, input, ctx, archive = false) {
      const allowed = kind === 'issuers' ? ['key', 'type', 'name', 'fullName', 'fieldSchema', 'source', 'status', 'sourceMode', 'organizationKind', 'organizationId'] : ['issuerId', 'key', 'title', 'year', 'session', 'level', 'status'];
      object(input, [...allowed, 'expectedRevision'], value ? ['expectedRevision'] : kind === 'issuers' ? ['key', 'name', 'fullName', 'type'] : ['issuerId', 'key', 'title', 'year', 'session']);
      return coordination.run(async () => {
        const Model = kind === 'issuers' ? Issuer : Exam,
          row = value ? await get(Model, value) : null,
          fields = {};
        for (const field of allowed) if (field in input) {
          if (field === 'fieldSchema') {
            if (!Array.isArray(input[field]) || input[field].length > 8) throw invalid('At most eight verification fields');
            fields[field] = input[field].map(f => {
              object(f, ['id', 'label', 'type', 'required'], ['id', 'label', 'type', 'required']);
              if (['examId','rollNumber','boardId','type','boardName','__proto__','constructor','prototype'].includes(f.id) || !/^[a-z][a-zA-Z0-9]{0,39}$/.test(f.id) || !['text', 'date'].includes(f.type) || typeof f.required !== 'boolean') throw invalid('Invalid verification schema');
              return {
                id: f.id,
                label: text(f.label, 80),
                type: f.type,
                required: f.required
              };
            });
            if (new Set(fields[field].map(f => f.id)).size !== fields[field].length) throw invalid('Duplicate field');
          } else if (field === 'source') {
            object(input.source, ['description', 'authorizationReference']);
            fields.source = {
              description: text(input.source.description ?? '', 2000),
              authorizationReference: text(input.source.authorizationReference ?? '', 200)
            };
          } else if (['issuerId','organizationId'].includes(field)) fields[field] = id(input[field]);else if (field === 'year') fields[field] = integer(input[field], 1900, 2200);else fields[field] = text(input[field], 160);
        }
        if (fields.key && !/^[a-zA-Z0-9_-]{1,80}$/.test(fields.key)) throw invalid('Invalid key');
        for (const required of kind === 'issuers' ? ['key', 'name', 'fullName'] : ['key', 'title', 'session']) if (required in fields && !fields[required]) throw invalid('Required metadata cannot be empty');
        if (kind === 'issuers' && fields.type && !['school', 'university', 'institute'].includes(fields.type)) throw invalid('Invalid issuer type');
        if (fields.status && !(kind === 'issuers' ? ['draft', 'active', 'inactive'] : ['draft', 'published', 'withdrawn']).includes(fields.status)) throw invalid('Invalid status');
        if (archive) fields.status = kind === 'issuers' ? 'inactive' : 'withdrawn';
        if (kind === 'issuers') {
          const merged = { ...(row?.toObject?.() ?? {}), ...fields };
          if (fields.sourceMode && !['admin','external'].includes(fields.sourceMode)) throw invalid('Choose an available result source');
          if (fields.organizationKind && !['university','college','franchise','course'].includes(fields.organizationKind)) throw invalid('Choose an institution type');
          if (!archive && merged.sourceMode === 'admin') await adminSource.validate(merged);
          if (row && ['type','sourceMode','organizationKind','organizationId'].some(k=>k in fields && String(fields[k])!==String(row[k]??'')) && await Exam.exists({issuerId:row._id})) throw invalid('An institution with examinations cannot change its identity or result source');
          if (row && fields.fieldSchema && JSON.stringify(fields.fieldSchema)!==JSON.stringify(row.fieldSchema.map(f=>({id:f.id,label:f.label,type:f.type,required:f.required}))) && await Record.exists({examId:{$in:(await Exam.find({issuerId:row._id}).select('_id')).map(e=>e._id)}})) throw invalid('Verification questions are fixed once marks are imported. Create a new result institution configuration for different questions.');
        }
        if (kind === 'exams') {
          if (row && fields.issuerId && String(fields.issuerId) !== String(row.issuerId)) throw invalid('Exam issuer is immutable');
          const issuer = await get(Issuer, fields.issuerId ?? row?.issuerId);
          if (fields.status === 'published' && (issuer.status !== 'active' || !(await publicationReady(issuer)))) throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'Activate the institution and confirm its result source before publishing this examination');
        }
        if (row && (await Record.exists(kind === 'exams' ? {
          examId: row._id,
          status: 'published'
        } : {
          examId: {
            $in: (await Exam.find({
              issuerId: row._id
            }).select('_id')).map(e => e._id)
          },
          status: 'published'
        }))) throw new AppError(409, 'PUBLISHED_DEPENDENCY', 'Withdraw published records before changing issuer/exam definitions');
        if (row) return dto(await coordination.update(Model, row, fields, revision(input.expectedRevision), 'result_' + kind + '_updated', ctx));
        const created = await Model.create({
          ...fields,
          auditOutbox: [coordination.event('result_' + kind + '_created', ctx)]
        });
        await coordination.flush(Model, created);
        return dto(created);
      });
    },
    async validateRecord(input, issuer, { skipProof = false } = {}) {
      object(input, ['rollNumber', 'userPublicId', 'student', 'subjects', 'totals', 'verificationFields', 'issueDate', 'externalId'], ['rollNumber', 'userPublicId', 'student', 'subjects', 'totals', ...(skipProof ? [] : ['verificationFields']), 'issueDate', 'externalId']);
      const user = await authService.models.User.findOne({
        publicId: text(input.userPublicId, 80),
        status: 'active',
        emailVerifiedAt: {
          $ne: null
        }
      });
      if (!user) throw invalid('Candidate must be linked to an existing verified account');
      object(input.student, ['name', 'schoolName', 'enrollmentNumber'], ['name']);
      const student = {};
      for (const k of Object.keys(input.student)) student[k] = text(input.student[k], 160);
      if (!student.name || !Array.isArray(input.subjects) || !input.subjects.length || input.subjects.length > 40) throw invalid('Candidate name and subjects required');
      const subjects = input.subjects.map(s => {
        object(s, ['code', 'name', 'maxMarks', 'obtained', 'grade'], ['code', 'name', 'maxMarks', 'obtained']);
        const maxMarks = integer(s.maxMarks, 1, 10000),
          obtained = integer(s.obtained, 0, maxMarks);
        return {
          code: text(s.code, 40),
          name: text(s.name, 160),
          maxMarks,
          obtained,
          ...(s.grade !== undefined ? {
            grade: text(s.grade, 40)
          } : {})
        };
      });
      if (subjects.some(s => !s.code || !s.name) || new Set(subjects.map(s => s.code)).size !== subjects.length) throw invalid('Unique subject codes/names required');
      object(input.totals, ['max', 'obtained', 'percentage', 'grade', 'status', 'sgpa', 'cgpa'], ['max', 'obtained', 'percentage', 'status']);
      const max = subjects.reduce((n, s) => n + s.maxMarks, 0),
        obtained = subjects.reduce((n, s) => n + s.obtained, 0);
      if (input.totals.max !== max || input.totals.obtained !== obtained || typeof input.totals.percentage !== 'number' || Math.abs(input.totals.percentage - obtained / max * 100) > 0.011) throw invalid('Stored totals must reconcile with subject marks');
      const totals = {
        max,
        obtained,
        percentage: input.totals.percentage,
        status: text(input.totals.status, 80)
      };
      if (!totals.status) throw invalid('Source result status required');
      if (input.totals.grade !== undefined) totals.grade = text(input.totals.grade, 40);
      for (const k of ['sgpa', 'cgpa']) if (input.totals[k] !== undefined) {
        if (typeof input.totals[k] !== 'number' || input.totals[k] < 0 || input.totals[k] > 100) throw invalid('Invalid source grade point');
        totals[k] = input.totals[k];
      }
      const issueDate = new Date(input.issueDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.issueDate) || !Number.isFinite(issueDate.getTime()) || issueDate.toISOString().slice(0, 10) !== input.issueDate) throw invalid('Invalid issue date');
      const rollNormalized = canonicalRoll(input.rollNumber),
        externalId = text(input.externalId, 160);
      if (!rollNormalized || !externalId) throw invalid('Roll/source reference required');
      return {
        rollNormalized,
        userId: user._id,
        student,
        subjects,
        totals,
        ...(skipProof ? {} : { verificationHash: proof(input.verificationFields, issuer) }),
        issueDate,
        externalId
      };
    },
    async importRecords(input, auth, ctx) {
      object(input, ['examId', 'assetId', 'mappingVersion', 'idempotencyKey', 'dryRun', 'validationToken'], ['examId', 'assetId', 'mappingVersion', 'idempotencyKey']);
      key(input.idempotencyKey);
      if (input.mappingVersion !== 'kitss-results-v1' || input.dryRun !== undefined && typeof input.dryRun !== 'boolean') throw invalid('Use kitss-results-v1 JSON mapping');
      const exam = await get(Exam, input.examId),
        issuer = await get(Issuer, exam.issuerId);
      const media = await publishingModule.media.linkable(input.assetId, 'result_import', auth);
      const file = await publishingModule.media.open(input.assetId, auth);
      const chunks = [];
      let size = 0;
      for await (const chunk of file.stream) {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) throw invalid('Import exceeds 2 MiB');
        chunks.push(chunk);
      }
      let raw;
      try {
        raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw invalid('Invalid JSON import');
      }
      if (!Array.isArray(raw) || !raw.length || raw.length > 200) throw invalid('Import requires 1 to 200 rows');
      const rows = [],
        errors = [];
      for (let n = 0; n < raw.length; n++) try {
        rows.push(await service.validateRecord(raw[n], issuer));
      } catch (err) {
        errors.push({
          row: n + 1,
          code: 'INVALID_RESULT_ROW',
          message: err instanceof AppError ? err.message : 'Invalid row data'
        });
      }
      if (new Set(rows.map(r => r.rollNormalized)).size !== rows.length) errors.push({
        row: 0,
        code: 'DUPLICATE_CANDIDATE'
      });
      const batchKey = 'result-import:' + auth.user._id + ':' + input.idempotencyKey;
      const requestHash = createHash('sha256').update(JSON.stringify({
        examId: String(exam._id),
        assetId: input.assetId,
        checksum: media.checksum,
        mappingVersion: input.mappingVersion
      })).digest('hex');
      const validationToken = mac(secret, batchKey + ':' + requestHash + ':' + issuer.revision + ':' + exam.revision);
      if (input.dryRun !== false) return {
        dryRun: true,
        rows: raw.length,
        validRows: rows.length,
        errors,
        validationToken: errors.length ? null : validationToken
      };
      if (errors.length || !equal(input.validationToken, validationToken)) throw invalid('Successful current dry-run proof is required before import');
      return coordination.run(async () => {
        const currentIssuer = await get(Issuer, issuer._id),
          currentExam = await get(Exam, exam._id);
        if (currentIssuer.revision !== issuer.revision || currentExam.revision !== exam.revision) throw new AppError(409, 'REVISION_CONFLICT', 'Repeat the dry run against current definitions');
        const currentMedia = await publishingModule.media.linkable(input.assetId, 'result_import', auth);
        if (currentMedia.checksum !== media.checksum) throw invalid('Import source changed');
        const Job = commerceService.models.Job,
          prior = await Job.findOne({
            key: batchKey
          });
        if (prior) {
          if (prior.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Import key belongs to another source');
          return prior.resultSummary;
        }
        // Retry after a partial write reuses only this exact batch/checksum.
        for (const row of rows) {
          const existing = await Record.findOne({
            examId: exam._id,
            rollNormalized: row.rollNormalized,
            revision: 1
          });
          if (existing && (existing.source?.batchId !== batchKey || existing.source?.checksum !== media.checksum)) throw new AppError(409, 'RESULT_EXISTS', 'Use the correction workflow for an existing candidate');
        }
        await Record.bulkWrite(rows.map(({
          externalId,
          ...row
        }) => ({
          updateOne: {
            filter: {
              examId: exam._id,
              rollNormalized: row.rollNormalized,
              revision: 1
            },
            update: {
              $setOnInsert: {
                ...row,
                examId: exam._id,
                revision: 1,
                __v: 0,
                status: 'draft',
                source: {
                  batchId: batchKey,
                  assetId: input.assetId,
                  checksum: media.checksum,
                  externalId,
                  importedBy: ctx.actorId
                },
                auditOutbox: [coordination.event('result_imported', ctx)]
              }
            },
            upsert: true
          }
        })), {
          ordered: true
        });
        const resultSummary = {
          dryRun: false,
          imported: rows.length,
          status: 'draft',
          publicationEnabled: await publicationReady(currentIssuer)
        };
        await Job.create({
          key: batchKey,
          kind: 'result_import',
          requestHash,
          state: 'done',
          resultSummary
        });
        await service.maintenance();
        return resultSummary;
      });
    },
    async createDirectRecords(input, auth, ctx) {
      object(input, ['examId', 'rows', 'idempotencyKey', 'submit', 'reason', 'dryRun'], ['examId', 'rows', 'idempotencyKey']);
      key(input.idempotencyKey);
      if (input.submit !== undefined && typeof input.submit !== 'boolean') throw invalid('Invalid submit flag');
      if (input.dryRun !== undefined && typeof input.dryRun !== 'boolean') throw invalid('Invalid dryRun flag');
      if (!Array.isArray(input.rows) || !input.rows.length || input.rows.length > 200) throw invalid('Provide 1 to 200 student result rows');
      const exam = await get(Exam, input.examId), issuer = await get(Issuer, exam.issuerId);
      const raw = input.rows;
      const rows = [], errors = [];
      const seenRolls = new Set();
      for (let n = 0; n < raw.length; n++) {
        try {
          const validated = await service.validateRecord(raw[n], issuer);
          if (seenRolls.has(validated.rollNormalized)) {
            errors.push({ row: n + 1, rollNumber: validated.rollNormalized, code: 'DUPLICATE_CANDIDATE', message: 'Duplicate roll number ' + validated.rollNormalized + ' in this batch' });
          } else {
            seenRolls.add(validated.rollNormalized);
            const existing = await Record.findOne({ examId: exam._id, rollNormalized: validated.rollNormalized, revision: 1 }).select('_id').lean();
            if (existing) errors.push({ row: n + 1, rollNumber: validated.rollNormalized, code: 'RESULT_EXISTS', message: 'Roll number ' + validated.rollNormalized + ' already exists for this examination; use corrections instead' });
            else rows.push(validated);
          }
        } catch (err) {
          errors.push({
            row: n + 1,
            rollNumber: typeof raw[n]?.rollNumber === 'string' ? raw[n].rollNumber : '',
            code: 'INVALID_RESULT_ROW',
            message: err instanceof AppError ? err.message : 'Invalid row data'
          });
        }
      }
      if (input.dryRun === true) {
        return {
          dryRun: true,
          rows: raw.length,
          validRows: rows.length,
          errors,
          preview: rows.slice(0, 50).map(r => ({
            rollNumber: r.rollNormalized,
            name: r.student.name,
            obtained: r.totals.obtained,
            max: r.totals.max,
            percentage: r.totals.percentage,
            status: r.totals.status
          }))
        };
      }
      if (errors.length) throw invalid(errors[0].message + (errors.length > 1 ? ` (and ${errors.length - 1} more row error${errors.length > 2 ? 's' : ''})` : ''));
      const batchKey = 'result-direct:' + auth.user._id + ':' + input.idempotencyKey;
      const checksum = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
      const requestHash = createHash('sha256').update(JSON.stringify({
        examId: String(exam._id),
        checksum,
        submit: Boolean(input.submit)
      })).digest('hex');
      const submitNow = Boolean(input.submit);
      const reviewReason = submitNow ? text(input.reason?.trim() || 'Submitted for main-admin review', 2000) : '';
      return coordination.run(async () => {
        const currentIssuer = await get(Issuer, issuer._id);
        const Job = commerceService.models.Job, prior = await Job.findOne({ key: batchKey });
        if (prior) {
          if (prior.requestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Import key belongs to another submission');
          return prior.resultSummary;
        }
        for (const row of rows) {
          const existing = await Record.findOne({ examId: exam._id, rollNormalized: row.rollNormalized, revision: 1 });
          if (existing && (existing.source?.batchId !== batchKey || existing.source?.checksum !== checksum)) {
            throw new AppError(409, 'RESULT_EXISTS', 'Use the correction workflow for an existing candidate (' + row.rollNormalized + ')');
          }
        }
        const now = new Date();
        await Record.bulkWrite(rows.map(({ externalId, ...row }) => ({
          updateOne: {
            filter: { examId: exam._id, rollNormalized: row.rollNormalized, revision: 1 },
            update: {
              $setOnInsert: {
                ...row,
                examId: exam._id,
                revision: 1,
                __v: 0,
                status: 'draft',
                review: submitNow ? { status: 'submitted', reason: reviewReason, actorId: ctx.actorId, at: now, academicRevision: 1 } : { status: 'draft' },
                source: { batchId: batchKey, checksum, externalId, importedBy: ctx.actorId },
                auditOutbox: [coordination.event('result_imported', ctx), ...(submitNow ? [coordination.event('result_submit', ctx)] : [])]
              }
            },
            upsert: true
          }
        })), { ordered: true });
        const created = await Record.find({ examId: exam._id, rollNormalized: { $in: rows.map(r => r.rollNormalized) }, revision: 1 });
        const resultSummary = {
          dryRun: false,
          imported: rows.length,
          submitted: submitNow,
          status: 'draft',
          reviewStatus: submitNow ? 'submitted' : 'draft',
          record: created.length === 1 ? dto(created[0]) : undefined,
          recordIds: created.map(r => String(r._id)),
          publicationEnabled: await publicationReady(currentIssuer)
        };
        await Job.create({ key: batchKey, kind: 'result_import', requestHash, state: 'done', resultSummary });
        await service.maintenance();
        return resultSummary;
      });
    },
    async changeRecord(value, action, input, ctx) {
      if (!["submit", "approve", "reject", "publish", "approve_and_publish", "corrections", "withdraw"].includes(action)) throw invalid("Unknown result action");
      const allowedFields = action === 'corrections'
        ? ['correctedFields', 'reason', 'source', 'expectedRevision', 'keepVerification']
        : ['expectedRevision', 'sourceApproval', 'reason', 'publishExam', 'supersedePrevious'];
      const requiredFields = ['expectedRevision', ...(action === 'corrections' || action === 'reject' || action === 'withdraw' ? ['reason'] : [])];
      object(input, allowedFields, requiredFields);
      return coordination.run(async () => {
        const query = Record.findById(id(String(value)));
        if (action === 'corrections' && input.keepVerification === true) query.select('+verificationHash');
        const row = await query;
        if (!row) throw absent();
        let exam = await get(Exam, row.examId);
        const issuer = await get(Issuer, exam.issuerId);
        if (integer(input.expectedRevision, 1, 1000000) !== row.__v + 1) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh result revision');
        if (['approve', 'reject', 'publish', 'approve_and_publish', 'withdraw'].includes(action)) {
          const actor = await authService.models.User.findOne({ publicId: ctx.actorId, status: 'active' });
          if (!actor?.emailVerifiedAt || !actor.roles.includes('super_admin')) throw new AppError(403, 'MAIN_ADMIN_REQUIRED', 'Final result approval and publication require the main admin');
        }
        if (['submit', 'approve', 'reject'].includes(action)) {
          const reasonText = text(input.reason ?? '', 2000).trim();
          if (action === 'reject' && !reasonText) throw invalid('Review reason required');
          const status = row.review?.status ?? 'draft';
          if (row.status !== 'draft' || (action === 'submit' ? !['draft', 'rejected'].includes(status) : status !== 'submitted')) throw new AppError(409, 'REVIEW_STATE_CONFLICT', 'Submit a current draft before final review');
          if (!row.source?.checksum) throw invalid('Source provenance required for review');
          const finalReason = reasonText || (action === 'submit' ? 'Submitted for main-admin review' : 'Approved by main admin');
          const review = { status: action === 'submit' ? 'submitted' : action === 'approve' ? 'approved' : 'rejected', reason: finalReason, actorId: ctx.actorId, at: new Date(), academicRevision: row.revision };
          const changed = await Record.findOneAndUpdate({ _id: row._id, __v: row.__v }, { $set: { review }, $inc: { __v: 1 }, $push: { auditOutbox: coordination.event('result_' + action, ctx) } }, { returnDocument: 'after', runValidators: true });
          if (!changed) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh result revision');
          await coordination.flush(Record, changed);
          return dto(changed);
        }
        if (action === 'approve_and_publish') {
          if (row.status !== 'draft') throw new AppError(409, 'REVIEW_STATE_CONFLICT', 'Only draft results can be approved and published');
          if (!row.source?.checksum || !issuer.source?.authorizationReference) throw invalid('Source provenance required');
          if (issuer.status !== 'active' || !(await publicationReady(issuer))) throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'Activate the institution and confirm its result source before publishing');
          if (exam.status === 'draft' && input.publishExam === true) {
            exam = await coordination.update(Exam, exam, { status: 'published' }, exam.revision, 'result_exams_updated', ctx);
          }
          if (exam.status !== 'published') throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'The institution or examination is not currently available for result publication');
          if (row.supersedesId) {
            const priorPublished = await Record.findOne({ examId: row.examId, rollNormalized: row.rollNormalized, _id: { $ne: row._id }, status: 'published' });
            if (priorPublished) {
              const withdrawn = await Record.findOneAndUpdate(
                { _id: priorPublished._id, __v: priorPublished.__v },
                { $set: { status: 'withdrawn', withdrawalReason: 'Superseded by revision ' + row.revision }, $inc: { __v: 1 }, $push: { auditOutbox: coordination.event('result_withdraw', ctx) } },
                { returnDocument: 'after', runValidators: true }
              );
              if (withdrawn) await coordination.flush(Record, withdrawn);
            }
          }
          const finalReason = text(input.reason ?? '', 2000).trim() || 'Approved and published by main admin';
          const review = { status: 'approved', reason: finalReason, actorId: ctx.actorId, at: new Date(), academicRevision: row.revision };
          const changed = await Record.findOneAndUpdate(
            { _id: row._id, __v: row.__v },
            { $set: { review, status: 'published', publishedAt: new Date() }, $inc: { __v: 1 }, $push: { auditOutbox: { $each: [coordination.event('result_approve', ctx), coordination.event('result_publish', ctx)] } } },
            { returnDocument: 'after', runValidators: true }
          );
          if (!changed) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh result revision');
          await coordination.flush(Record, changed);
          return dto(changed);
        }
        if (action === 'publish') {
          if (row.review?.status !== 'approved' || row.review.academicRevision !== row.revision) throw new AppError(409, 'MAIN_ADMIN_APPROVAL_REQUIRED', 'Current academic revision needs final main-admin approval');
          if (row.status !== 'draft') throw new AppError(409, 'REVIEW_STATE_CONFLICT', 'Only draft results can be published');
          if (exam.status === 'draft' && input.publishExam === true && issuer.status === 'active' && (await publicationReady(issuer))) {
            exam = await coordination.update(Exam, exam, { status: 'published' }, exam.revision, 'result_exams_updated', ctx);
          }
          if (exam.status !== 'published' || issuer.status !== 'active' || !(await publicationReady(issuer))) throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'The institution or examination is not currently available for result publication');
          if (!issuer.source?.authorizationReference || !row.source?.checksum) throw invalid('Source provenance required');
          const existingPublished = await Record.findOne({ examId: row.examId, rollNormalized: row.rollNormalized, _id: { $ne: row._id }, status: 'published' });
          if (existingPublished) {
            if (input.supersedePrevious === true) {
              const withdrawn = await Record.findOneAndUpdate(
                { _id: existingPublished._id, __v: existingPublished.__v },
                { $set: { status: 'withdrawn', withdrawalReason: 'Superseded by revision ' + row.revision }, $inc: { __v: 1 }, $push: { auditOutbox: coordination.event('result_withdraw', ctx) } },
                { returnDocument: 'after', runValidators: true }
              );
              if (withdrawn) await coordination.flush(Record, withdrawn);
            } else {
              throw new AppError(409, 'PUBLISHED_VERSION_EXISTS', 'Another revision is already published for this roll number. Withdraw the previous version or use Publish correction.');
            }
          }
        } else if (!text(input.reason ?? '', 2000).trim()) throw invalid('Reason required');
        if (action === 'corrections') {
          if (row.status === 'withdrawn' || !input.source || typeof input.source !== 'string' || !input.source.trim()) throw invalid('Correction source reference required');
          const keepProof = input.keepVerification === true;
          if (keepProof && !row.verificationHash) throw invalid('Enter student verification answers');
          const corrected = await service.validateRecord(input.correctedFields, issuer, { skipProof: keepProof });
          if (corrected.rollNormalized !== row.rollNormalized || String(corrected.userId) !== String(row.userId)) throw invalid('Corrections cannot change candidate identity');
          const next = await Record.findOne({
            examId: row.examId,
            rollNormalized: row.rollNormalized
          }).sort({
            revision: -1
          });
          const {
            externalId,
            ...fields
          } = corrected;
          const doc = await Record.create({
            ...fields,
            ...(keepProof ? { verificationHash: row.verificationHash } : {}),
            examId: row.examId,
            revision: next.revision + 1,
            __v: 0,
            supersedesId: row._id,
            correctionReason: text(input.reason, 2000),
            source: {
              ...row.source,
              correctionReference: text(input.source, 1000),
              externalId
            },
            auditOutbox: [coordination.event('result_correction_drafted', ctx)]
          });
          await coordination.flush(Record, doc);
          return dto(doc);
        }
        if (action === 'withdraw' && row.status === 'withdrawn') return dto(row);
        const changed = await Record.findOneAndUpdate({
          _id: row._id,
          __v: row.__v
        }, {
          $set: action === 'publish' ? {
            status: 'published',
            publishedAt: new Date()
          } : {
            status: 'withdrawn',
            withdrawalReason: text(input.reason, 2000)
          },
          $inc: {
            __v: 1
          },
          $push: {
            auditOutbox: coordination.event('result_' + action, ctx)
          }
        }, {
          returnDocument: 'after',
          runValidators: true
        });
        if (!changed) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh result revision');
        await coordination.flush(Record, changed);
        return dto(changed);
      });
    },
    async batchChangeRecords(input, ctx) {
      object(input, ['ids', 'action', 'reason', 'publishExam'], ['ids', 'action']);
      if (!Array.isArray(input.ids) || !input.ids.length || input.ids.length > 100) throw invalid('Select 1 to 100 records');
      if (!['submit', 'approve', 'reject', 'publish', 'approve_and_publish', 'withdraw'].includes(input.action)) throw invalid('Unknown batch result action');
      const uniqueIds = [...new Set(input.ids.map(v => String(id(String(v)))))];
      const succeeded = [], failed = [];
      for (const recordId of uniqueIds) {
        try {
          const current = await Record.findById(recordId).select('__v rollNormalized').lean();
          if (!current) { failed.push({ id: recordId, message: 'Record not found' }); continue; }
          const updated = await service.changeRecord(recordId, input.action, {
            expectedRevision: (current.__v ?? 0) + 1,
            ...(input.reason !== undefined ? { reason: input.reason } : {}),
            ...(input.publishExam !== undefined ? { publishExam: Boolean(input.publishExam) } : {})
          }, ctx);
          succeeded.push(updated);
        } catch (err) {
          failed.push({ id: recordId, message: err instanceof AppError ? err.message : 'Action failed' });
        }
      }
      return { action: input.action, succeededCount: succeeded.length, failedCount: failed.length, succeeded, failed };
    },
    async lookup(input, auth, ctx) {
      object(input, ['issuerId', 'examId', 'rollNumber', 'verificationFields'], ['issuerId', 'examId', 'rollNumber', 'verificationFields']);
      await authService.limit(ctx, String(auth.user._id), 'result-lookup', 10);
      if (!auth.user.emailVerifiedAt) throw absent();
      const issuer = await get(Issuer, input.issuerId),
        exam = await get(Exam, input.examId);
      if (issuer.status !== 'active' || exam.status !== 'published' || String(exam.issuerId) !== String(issuer._id) || !(await publicationReady(issuer))) throw absent();
      const row = await Record.findOne({
        examId: exam._id,
        rollNormalized: canonicalRoll(input.rollNumber),
        userId: auth.user._id,
        status: 'published'
      }).select('+verificationHash');
      if (!row || row.review?.status !== 'approved' || row.review.academicRevision !== row.revision || !equal(row.verificationHash, proof(input.verificationFields, issuer))) throw absent();
      await History.updateOne({
        userId: auth.user._id,
        resultRecordId: row._id
      }, {
        $set: {
          lastViewedAt: new Date()
        }
      }, {
        upsert: true
      });
      return {
        ...dto(row),
        issuer: {
          id: String(issuer._id),
          name: issuer.name,
          fullName: issuer.fullName,
          type: issuer.type
        },
        exam: dto(exam),
        verificationLabel: 'Source-reviewed record'
      };
    },
    async history(query, auth) {
      object(query, ['page', 'pageSize']);
      const {
        page,
        pageSize
      } = paging(query);
      const records = await Record.find({
        userId: auth.user._id,
        status: 'published'
      }).sort({
        publishedAt: -1
      }).skip((page - 1) * pageSize).limit(pageSize);
      // Each exam and institution is loaded once for the page, not once per result.
      const exams = new Map((records.length ? await Exam.find({ _id: { $in: [...new Set(records.map(r => String(r.examId)))] } }) : []).map(e => [String(e._id), e]));
      const issuers = new Map((exams.size ? await Issuer.find({ _id: { $in: [...new Set([...exams.values()].map(e => String(e.issuerId)))] } }) : []).map(i => [String(i._id), i]));
      const ready = new Map();
      const available = [];
      for (const record of records) {
        const exam = exams.get(String(record.examId)), issuer = exam && issuers.get(String(exam.issuerId));
        if (!exam || !issuer) continue;
        const isReady = () => { const key = String(issuer._id); if (!ready.has(key)) ready.set(key, publicationReady(issuer)); return ready.get(key); };
        if (record.review?.status === 'approved' && record.review.academicRevision === record.revision && exam.status === 'published' && issuer.status === 'active' && (await isReady())) available.push({
          ...dto(record),
          issuerId: String(issuer._id),
          issuerName: issuer.name,
          issuerFullName: issuer.fullName,
          issuerType: issuer.type,
          examTitle: exam.title,
          exam: dto(exam),
          issuer: {
            id: String(issuer._id),
            name: issuer.name,
            fullName: issuer.fullName,
            type: issuer.type
          }
        });
      }
      return {
        data: available,
        meta: {
          page,
          pageSize,
          hasMore: records.length === pageSize
        }
      };
    }
  };
  publishingModule.media.resultReferences = async (assetId, publicOnly) => publicOnly ? [] : (await Record.find({
    'source.assetId': String(assetId)
  }).select('_id status')).map(r => ({
    kind: 'ResultRecord',
    id: String(r._id),
    status: r.status
  }));
  await service.initialize();
  await service.maintenance();
  return service;
}
