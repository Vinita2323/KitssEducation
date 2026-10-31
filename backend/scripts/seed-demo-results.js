import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { createDatabase } from '../src/config/database.js';
import { createStorageProvider } from '../src/storage/index.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createEmailService } from '../src/modules/email/email.service.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';
import { createInstitutionService } from '../src/modules/institutions/institutions.service.js';
import { createPublishingModule } from '../src/modules/publishing/index.js';
import { createCommerceModule } from '../src/modules/commerce/index.js';
import { createCoachingModule } from '../src/modules/coaching/index.js';
import { createResultModels } from '../src/modules/results/results.models.js';
import { createResultService } from '../src/modules/results/results.service.js';

// Seeds clearly labelled DEMO results through the normal admin result workflow:
// create institution and examinations, dry-run then import marks, submit, main-admin
// approval and publication. Every record belongs to one existing verified student.
// Dry run by default; pass --apply to write. Re-running after a completed seed does nothing.
// Usage: node --env-file=.env scripts/seed-demo-results.js --student=<publicId> [--apply]
const apply = process.argv.includes('--apply');
const studentPublicId = process.argv.find(arg => arg.startsWith('--student='))?.slice(10);
if (!studentPublicId) throw new Error('Pass --student=<publicId> of a verified student account');

const source = { description: 'DEMO walkthrough results. Fictional marks for demonstrating the results feature; not an official record.', authorizationReference: 'DEMO-WALKTHROUGH-2026' };
const verification = { studentName: 'Demo Student', dateOfBirth: '2006-08-15', motherName: 'Demo Parent' };
const field = { studentName: { id: 'studentName', label: 'Student Name', type: 'text', required: true }, dateOfBirth: { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true }, motherName: { id: 'motherName', label: "Mother's Name", type: 'text', required: true } };
const marks = (rows, status = 'PASS', extra = {}) => {
  const subjects = rows.map(([code, name, maxMarks, obtained, grade]) => ({ code, name, maxMarks, obtained, grade }));
  const max = subjects.reduce((n, s) => n + s.maxMarks, 0), obtained = subjects.reduce((n, s) => n + s.obtained, 0);
  return { subjects, totals: { max, obtained, percentage: Math.round(obtained / max * 10000) / 100, status, ...extra } };
};
const plan = [
  { key: 'DEMO-HLU', type: 'university', organization: ['university', 'DEMO Horizon Learning University'], name: 'DEMO Horizon Learning University', fullName: 'DEMO Horizon Learning University Examination Cell', fields: ['studentName', 'dateOfBirth'], exams: [
    { key: 'DEMO-HLU-BCOM-S4-2026', title: 'B.Com (Hons) - Semester IV', level: 'Undergraduate', year: 2026, session: 'May', roll: 'HLU-BCOM-2026-0142', school: 'DEMO Horizon College of Learning', ...marks([['BC401', 'Corporate Accounting', 100, 78, 'A'], ['BC402', 'Business Law', 100, 71, 'B+'], ['BC403', 'Income Tax', 100, 84, 'A'], ['BC404', 'Cost Accounting', 100, 69, 'B'], ['BC405', 'Business Statistics', 100, 88, 'A+']], 'PASS', { grade: 'A', sgpa: 8.2 }) },
    { key: 'DEMO-HLU-BSC-S2-2026', title: 'B.Sc Computer Science - Semester II', level: 'Undergraduate', year: 2026, session: 'May', roll: 'HLU-BSC-2026-0087', school: 'DEMO Horizon College of Learning', ...marks([['CS201', 'Data Structures', 100, 82, 'A'], ['CS202', 'Discrete Mathematics', 100, 75, 'B+'], ['CS203', 'Digital Electronics', 100, 79, 'A'], ['CS204', 'Python Programming', 100, 91, 'A+']], 'PASS', { grade: 'A', sgpa: 8.6 }) },
  ] },
  { key: 'DEMO-MSU', type: 'university', organization: ['university', 'DEMO Meadow Skills University'], name: 'DEMO Meadow Skills University', fullName: 'DEMO Meadow Skills University Examination Board', fields: ['studentName', 'dateOfBirth'], exams: [
    { key: 'DEMO-MSU-DDS-FY-2026', title: 'Diploma in Digital Skills - Final Year', level: 'Diploma', year: 2026, session: 'April', roll: 'MSU-DDS-2026-0210', school: 'DEMO Meadow Institute of Skills', ...marks([['DD301', 'Web Design', 100, 85, 'A'], ['DD302', 'Spreadsheet Analytics', 100, 80, 'A'], ['DD303', 'Digital Marketing', 100, 77, 'B+']], 'PASS', { grade: 'A' }) },
  ] },
  { key: 'DEMO-HCL', type: 'institute', organization: ['college', 'DEMO Horizon College of Learning'], name: 'DEMO Horizon College of Learning', fullName: 'DEMO Horizon College of Learning', fields: ['studentName', 'motherName', 'dateOfBirth'], exams: [
    { key: 'DEMO-HCL-XII-SCI-2026', title: 'Class XII (Science) - Annual Examination', year: 2026, session: 'March', roll: 'HCL-XII-2026-0315', school: 'DEMO Horizon College of Learning', ...marks([['PHY', 'Physics', 100, 76, 'B+'], ['CHE', 'Chemistry', 100, 81, 'A'], ['MAT', 'Mathematics', 100, 88, 'A+'], ['ENG', 'English', 100, 84, 'A'], ['CSC', 'Computer Science', 100, 92, 'A+']], 'PASS', { grade: 'A' }) },
    { key: 'DEMO-HCL-X-2026', title: 'Class X - Annual Examination', year: 2026, session: 'March', roll: 'HCL-X-2026-0458', school: 'DEMO Horizon College of Learning', ...marks([['MAT', 'Mathematics', 100, 90, 'A+'], ['SCI', 'Science', 100, 86, 'A'], ['SST', 'Social Science', 100, 82, 'A'], ['ENG', 'English', 100, 88, 'A+'], ['HIN', 'Hindi', 100, 79, 'B+']], 'PASS', { grade: 'A' }) },
  ] },
  { key: 'DEMO-MIS', type: 'institute', organization: ['college', 'DEMO Meadow Institute of Skills'], name: 'DEMO Meadow Institute of Skills', fullName: 'DEMO Meadow Institute of Skills', fields: ['studentName', 'dateOfBirth'], exams: [
    { key: 'DEMO-MIS-SEC-T1-2026', title: 'Spoken English Certificate - Term 1', year: 2026, session: 'June', roll: 'MIS-SEC-2026-0033', school: 'DEMO Meadow Institute of Skills', ...marks([['LIS', 'Listening', 50, 42], ['SPK', 'Speaking', 50, 45], ['RDG', 'Reading', 50, 40], ['WRT', 'Writing', 50, 38]], 'PASS', { grade: 'A' }) },
  ] },
  { key: 'DEMO-MATH', type: 'institute', organization: ['course', 'DEMO Mathematics Foundations'], name: 'DEMO Mathematics Foundations', fullName: 'DEMO Mathematics Foundations (KITSS Coaching)', fields: ['studentName', 'dateOfBirth'], exams: [
    { key: 'DEMO-MATH-FINAL-2026', title: 'Mathematics Foundations - Final Assessment', year: 2026, session: 'July', roll: 'KMF-2026-0019', school: 'KITSS Coaching', ...marks([['ALG', 'Algebra', 50, 46], ['GEO', 'Geometry', 50, 41], ['ARI', 'Arithmetic', 50, 48], ['DAT', 'Data Handling', 50, 44]], 'PASS', { grade: 'A+' }) },
  ] },
];

const config = loadConfig(), logger = createLogger({ level: 'warn' });
const database = createDatabase(config.mongo, logger), storage = createStorageProvider(config.storage);
await storage.initialize(); await database.connect();
try {
  const auth = await createAuthService({ models: createAuthModels(database.connection), config, logger, mail: createEmailService(config.smtp, logger) });
  const institutions = createInstitutionService({ models: createInstitutionModels(database.connection), authService: auth, config, logger });
  const publishing = await createPublishingModule({ connection: database.connection, institutionService: institutions, authService: auth, storage, config, logger });
  const commerce = await createCommerceModule({ connection: database.connection, publishingModule: publishing, authService: auth, config, logger });
  await createCoachingModule({ connection: database.connection, publishingModule: publishing, commerce, institutions, authService: auth });
  const results = await createResultService({ models: createResultModels(database.connection), publishingModule: publishing, authService: auth, commerceService: commerce, config });
  const { User } = auth.models, { ResultIssuer, Exam: ResultExam, ResultRecord } = results.models;
  const admin = await User.findOne({ roles: 'super_admin', status: 'active', emailVerifiedAt: { $ne: null } }).sort({ createdAt: 1 });
  const student = await User.findOne({ publicId: studentPublicId, status: 'active', emailVerifiedAt: { $ne: null } });
  if (!admin) throw new Error('No active verified main admin found');
  if (!student) throw new Error('Student ' + studentPublicId + ' is not an active verified account');
  const adminAuth = { user: admin }, ctx = { actorId: admin.publicId, requestId: randomUUID(), ip: 'seed-demo-results' };
  const models = { university: institutions.models.University, college: institutions.models.College, course: commerce.learning.models.Course };
  const titleKey = { university: 'name', college: 'name', course: 'publishedSnapshot.title' };
  for (const item of plan) {
    const [kind, title] = item.organization;
    const org = await models[kind].findOne({ [titleKey[kind]]: title, deletedAt: null }).select('_id');
    if (!org) throw new Error('Missing ' + kind + ' "' + title + '"; seed the DEMO institutions first');
    item.organizationId = String(org._id);
  }
  const existing = await ResultIssuer.find({ key: { $in: plan.map(p => p.key) } }).select('key');
  console.log('Admin:', admin.publicId, '| student:', student.publicId, '| existing DEMO result institutions:', existing.map(e => e.key).join(', ') || 'none');
  for (const item of plan) console.log(item.type.padEnd(10), item.key.padEnd(10), item.name, '->', item.exams.length, 'exam(s)');
  if (!apply) { console.log('Dry run only. Re-run with --apply to write.'); process.exitCode = 0; }
  else {
    for (const item of plan) {
      let issuer = await ResultIssuer.findOne({ key: item.key });
      if (!issuer) issuer = await results.mutate('issuers', null, { key: item.key, type: item.type, name: item.name, fullName: item.fullName, status: 'active', sourceMode: 'admin', organizationKind: item.organization[0], organizationId: item.organizationId, fieldSchema: item.fields.map(f => field[f]), source }, ctx);
      const issuerId = String(issuer._id ?? issuer.id);
      for (const e of item.exams) {
        let exam = await ResultExam.findOne({ key: e.key });
        if (!exam) exam = await results.mutate('exams', null, { issuerId, key: e.key, title: e.title, ...(e.level ? { level: e.level } : {}), year: e.year, session: e.session, status: 'published' }, ctx);
        const examId = String(exam._id ?? exam.id);
        if (!(await ResultRecord.exists({ examId, rollNormalized: e.roll }))) {
          const row = { rollNumber: e.roll, userPublicId: student.publicId, student: { name: 'Demo Student', schoolName: e.school, enrollmentNumber: e.roll }, subjects: e.subjects, totals: e.totals, verificationFields: Object.fromEntries(item.fields.map(f => [f, verification[f]])), issueDate: '2026-' + String(['March', 'April', 'May', 'June', 'July'].indexOf(e.session) + 3).padStart(2, '0') + '-20', externalId: e.key + ':' + e.roll };
          let asset = await publishing.media.upload({ purpose: 'result_import', originalName: e.key.toLowerCase() + '.json', mime: 'application/json', stream: Readable.from([Buffer.from(JSON.stringify([row]))]), idempotencyKey: 'seed-v2-' + e.key.toLowerCase(), auth: adminAuth, ctx });
          // A retry reuses the same upload; rescan it if an earlier scan could not complete.
          if (asset.status === 'quarantined') asset = await publishing.media.rescan(asset.id, { expectedRevision: asset.revision }, ctx);
          const importKey = 'seed-import-' + e.key.toLowerCase();
          const dry = await results.importRecords({ examId, assetId: asset.id, mappingVersion: 'kitss-results-v1', idempotencyKey: importKey }, adminAuth, ctx);
          if (!dry.validationToken) throw new Error('Dry run rejected ' + e.key + ': ' + JSON.stringify(dry.errors));
          await results.importRecords({ examId, assetId: asset.id, mappingVersion: 'kitss-results-v1', idempotencyKey: importKey, dryRun: false, validationToken: dry.validationToken }, adminAuth, ctx);
        }
        let record = await ResultRecord.findOne({ examId, rollNormalized: e.roll });
        const step = async (action, reason) => { record = await ResultRecord.findById(record._id); await results.changeRecord(String(record._id), action, { expectedRevision: record.__v + 1, ...(reason ? { reason } : {}) }, ctx); };
        if ((record.review?.status ?? 'draft') === 'draft' && record.status === 'draft') await step('submit', 'DEMO walkthrough marks checked against the sample source');
        record = await ResultRecord.findById(record._id);
        if (record.review?.status === 'submitted') await step('approve', 'DEMO walkthrough approved by main admin');
        record = await ResultRecord.findById(record._id);
        if (record.status === 'draft' && record.review?.status === 'approved') await step('publish');
        record = await ResultRecord.findById(record._id);
        console.log('  ', e.key.padEnd(24), e.roll.padEnd(20), record.status, record.totals.obtained + '/' + record.totals.max);
      }
    }
    console.log('Done. Sign in as', student.publicId, 'and use verification:', JSON.stringify(verification));
  }
} finally {
  await database.disconnect();
}
