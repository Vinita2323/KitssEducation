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
  // The production composition supplies no trustedSource override: publication
  // stays closed until a separately approved owner/source authorization exists.
  const proof = (fields, issuer) => {
    object(fields, issuer.fieldSchema.map(f => f.id), issuer.fieldSchema.filter(f => f.required).map(f => f.id));
    const normalized = {};
    for (const f of [...issuer.fieldSchema].sort((a, b) => a.id.localeCompare(b.id))) {
      const value = text(fields[f.id] ?? '', 120);
      if (f.required && !value || f.type === 'date' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalid('Invalid verification details');
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
    async config() {
      return {
        types: ['school', 'university', 'institute'],
        publicationEnabled: false,
        message: 'Only authorized source-reviewed records are available. Official publication awaits source authorization.',
        issuers: (await Issuer.find({
          status: 'active'
        })).map(r => ({
          id: String(r._id),
          name: r.name,
          fullName: r.fullName,
          type: r.type
        }))
      };
    },
    async issuer(value) {
      const row = await get(Issuer, value);
      if (row.status !== 'active') throw absent();
      return {
        id: String(row._id),
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
    async list(kind, query = {}) {
      object(query, ['page', 'pageSize', 'q', 'status', 'issuerId', 'examId', 'year']);
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
      if (query.status) filter.status = text(query.status, 30);
      if (query.q) filter[kind === 'records' ? 'rollNormalized' : kind === 'issuers' ? 'name' : 'title'] = {
        $regex: escapeRegex(text(query.q, 80)),
        $options: 'i'
      };
      const total = await Model.countDocuments(filter);
      return {
        data: (await Model.find(filter).sort({
          createdAt: -1,
          _id: -1
        }).skip((page - 1) * pageSize).limit(pageSize)).map(dto),
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
      return {
        ...dto(row),
        audit
      };
    },
    async mutate(kind, value, input, ctx, archive = false) {
      const allowed = kind === 'issuers' ? ['key', 'type', 'name', 'fullName', 'fieldSchema', 'source', 'status'] : ['issuerId', 'key', 'title', 'year', 'session', 'level', 'status'];
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
              if (!/^[a-z][a-zA-Z0-9]{0,39}$/.test(f.id) || !['text', 'date'].includes(f.type) || typeof f.required !== 'boolean') throw invalid('Invalid verification schema');
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
          } else if (field === 'issuerId') fields[field] = id(input[field]);else if (field === 'year') fields[field] = integer(input[field], 1900, 2200);else fields[field] = text(input[field], 160);
        }
        if (fields.key && !/^[a-zA-Z0-9_-]{1,80}$/.test(fields.key)) throw invalid('Invalid key');
        for (const required of kind === 'issuers' ? ['key', 'name', 'fullName'] : ['key', 'title', 'session']) if (required in fields && !fields[required]) throw invalid('Required metadata cannot be empty');
        if (kind === 'issuers' && fields.type && !['school', 'university', 'institute'].includes(fields.type)) throw invalid('Invalid issuer type');
        if (fields.status && !(kind === 'issuers' ? ['draft', 'active', 'inactive'] : ['draft', 'published', 'withdrawn']).includes(fields.status)) throw invalid('Invalid status');
        if (archive) fields.status = kind === 'issuers' ? 'inactive' : 'withdrawn';
        if (kind === 'exams') {
          if (row && fields.issuerId && String(fields.issuerId) !== String(row.issuerId)) throw invalid('Exam issuer is immutable');
          const issuer = await get(Issuer, fields.issuerId ?? row?.issuerId);
          if (fields.status === 'published' && (issuer.status !== 'active' || !(await trustedSource(issuer)))) throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'Official publication requires separately approved trusted-source authorization');
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
    async validateRecord(input, issuer) {
      object(input, ['rollNumber', 'userPublicId', 'student', 'subjects', 'totals', 'verificationFields', 'issueDate', 'externalId'], ['rollNumber', 'userPublicId', 'student', 'subjects', 'totals', 'verificationFields', 'issueDate', 'externalId']);
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
        verificationHash: proof(input.verificationFields, issuer),
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
      } catch {
        errors.push({
          row: n + 1,
          code: 'INVALID_RESULT_ROW'
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
          publicationEnabled: false
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
    async changeRecord(value, action, input, ctx) {
      object(input, action === 'corrections' ? ['correctedFields', 'reason', 'source', 'expectedRevision'] : ['expectedRevision', 'sourceApproval', 'reason'], ['expectedRevision', ...(action === 'publish' ? [] : ['reason'])]);
      return coordination.run(async () => {
        const row = await get(Record, value),
          exam = await get(Exam, row.examId),
          issuer = await get(Issuer, exam.issuerId);
        if (integer(input.expectedRevision, 1, 1000000) !== row.__v + 1) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh result revision');
        if (action === 'publish') {
          if (row.status !== 'draft' || exam.status !== 'published' || issuer.status !== 'active' || !(await trustedSource(issuer))) throw new AppError(409, 'SOURCE_APPROVAL_REQUIRED', 'Official result publication is disabled without separately approved trusted-source evidence');
          if (!issuer.source?.authorizationReference || !row.source?.checksum) throw invalid('Source provenance required');
        } else if (!text(input.reason, 2000)) throw invalid('Reason required');
        if (action === 'corrections') {
          if (row.status === 'withdrawn' || !input.source || typeof input.source !== 'string' || !input.source.trim()) throw invalid('Correction source reference required');
          const corrected = await service.validateRecord(input.correctedFields, issuer);
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
    async lookup(input, auth, ctx) {
      object(input, ['issuerId', 'examId', 'rollNumber', 'verificationFields'], ['issuerId', 'examId', 'rollNumber', 'verificationFields']);
      await authService.limit(ctx, String(auth.user._id), 'result-lookup', 10);
      if (!auth.user.emailVerifiedAt) throw absent();
      const issuer = await get(Issuer, input.issuerId),
        exam = await get(Exam, input.examId);
      if (issuer.status !== 'active' || exam.status !== 'published' || String(exam.issuerId) !== String(issuer._id) || !(await trustedSource(issuer))) throw absent();
      const row = await Record.findOne({
        examId: exam._id,
        rollNormalized: canonicalRoll(input.rollNumber),
        userId: auth.user._id,
        status: 'published'
      }).select('+verificationHash');
      if (!row || !equal(row.verificationHash, proof(input.verificationFields, issuer))) throw absent();
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
      const available = [];
      for (const record of records) {
        const exam = await get(Exam, record.examId),
          issuer = await get(Issuer, exam.issuerId);
        if (exam.status === 'published' && issuer.status === 'active' && (await trustedSource(issuer))) available.push({
          ...dto(record),
          issuerId: String(issuer._id),
          issuerName: issuer.name,
          examTitle: exam.title
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
