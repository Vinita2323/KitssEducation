import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { startServer } from '../src/server.js';
import { createCoachingModels } from '../src/modules/coaching/coaching.models.js';
const config = loadConfig();
if (!process.argv.includes('--confirm-development') || config.nodeEnv !== 'development' || config.mongo.dbName !== 'kitss_education_dev') throw new Error('Exact approved development environment and flag required');
const logger = createLogger({
    level: 'silent'
  }),
  report = {
    database: config.mongo.dbName,
    checks: {},
    realPayments: false,
    fixtures: {},
    collections: []
  };
let runtime, connection;
try {
  runtime = await startServer({
    config,
    logger,
    port: 0
  });
  let base = 'http://127.0.0.1:' + runtime.server.address().port + '/api/v1';
  report.checks.initialReadiness = (await fetch(base + '/health/ready')).status === 200;
  connection = await mongoose.createConnection(config.mongo.uri, {
    dbName: config.mongo.dbName,
    autoIndex: false
  }).asPromise();
  const hello = await connection.db.admin().command({
    hello: 1
  });
  report.topology = {
    replicaSetAdvertised: Boolean(hello.setName),
    changed: false,
    transactionsUsed: false
  };
  const models = createCoachingModels(connection),
    label = 'STAGE7_DEV_VERIFY_' + randomUUID();
  const course = await models.Course.findOne({
    title: /^STAGE7_DEV_VERIFY_.*_DRAFT_NOT_FOR_SALE$/,
    status: 'draft',
    rightsConfirmed: false,
    description: 'Synthetic development-only draft. No institution, qualification or access claims.'
  }).sort({ createdAt: -1 }) ?? await models.Course.create({
    title: label + '_DRAFT_NOT_FOR_SALE',
    description: 'Synthetic development-only draft. No institution, qualification or access claims.',
    syllabus: [{
      key: 'fixture',
      title: 'Synthetic draft section',
      sortOrder: 1
    }]
  });
  const lesson = await models.Lesson.findOne({
    courseId: course._id,
    status: 'draft',
    title: /^STAGE7_DEV_VERIFY_/,
    content: 'Synthetic unpublished verification content only'
  }) ?? await models.Lesson.create({
    courseId: course._id,
    title: label + '_DRAFT_LESSON',
    subjectKey: 'fixture',
    sortOrder: 1,
    content: 'Synthetic unpublished verification content only'
  });
  const plan = await models.CoursePlan.findOne({
    courseId: course._id,
    status: 'draft',
    name: /^STAGE7_DEV_VERIFY_/,
    rulesApproved: false,
    priceMinor: { $exists: false },
    durationDays: { $exists: false }
  }) ?? await models.CoursePlan.create({
    courseId: course._id,
    name: label + '_UNCONFIGURED_DRAFT_PLAN'
  });
  report.fixtures = {
    courseId: String(course._id),
    lessonId: String(lesson._id),
    planId: String(plan._id)
  };
  report.checks.draftExcluded = (await fetch(base + '/coaching/courses/' + course._id)).status === 404;
  report.checks.unpaidEnrollmentDenied = (await fetch(base + '/coaching/courses/' + course._id + '/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  })).status >= 400;
  report.checks.razorpayDisabled = !(await (await fetch(base + '/public/payment-config')).json()).data.available;
  report.checks.stage4Public = (await fetch(base + '/colleges')).status === 200;
  report.checks.stage5Public = (await fetch(base + '/books')).status === 200;
  report.checks.stage3Protected = (await fetch(base + '/auth/me')).status === 401;
  await runtime.close();
  runtime = null;
  await connection.close();
  connection = null;
  runtime = await startServer({
    config,
    logger,
    port: 0
  });
  base = 'http://127.0.0.1:' + runtime.server.address().port + '/api/v1';
  report.checks.restartReadiness = (await fetch(base + '/health/ready')).status === 200;
  connection = await mongoose.createConnection(config.mongo.uri, {
    dbName: config.mongo.dbName,
    autoIndex: false
  }).asPromise();
  report.checks.persistence = !!(await connection.db.collection('coachingCourses').findOne({
    _id: course._id
  })) && !!(await connection.db.collection('lessons').findOne({
    _id: lesson._id
  })) && !!(await connection.db.collection('coursePlans').findOne({
    _id: plan._id
  }));
  for (const c of await connection.db.listCollections({}, {
    nameOnly: true
  }).toArray()) report.collections.push({
    name: c.name,
    count: await connection.db.collection(c.name).countDocuments(),
    indexes: (await connection.db.collection(c.name).indexes()).map(i => ({
      name: i.name,
      unique: !!i.unique
    }))
  });
  report.checks.allStage3to7Collections = ['users', 'taxonomies', 'books', 'orders', 'jobs', 'coachingCourses', 'lessons', 'coursePlans', 'enrollments', 'learningProgress'].every(name => report.collections.some(c => c.name === name));
  report.checks.allPassed = Object.values(report.checks).every(Boolean);
  await writeFile('backend/STAGE7-DEVELOPMENT-VERIFICATION.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    database: report.database,
    checks: report.checks,
    collectionCount: report.collections.length
  }));
  if (!report.checks.allPassed) process.exitCode = 1;
} finally {
  await runtime?.close();
  await connection?.close();
}
