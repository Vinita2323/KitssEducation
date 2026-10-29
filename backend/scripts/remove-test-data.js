import mongoose from 'mongoose';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadConfig } from '../src/config/env.js';

// Removes records left behind by automated verification runs (STAGE*_DEV_VERIFY...), and with
// --include-demo also the seeded "DEMO ..." walkthrough content. Dry run by default; --apply
// writes a JSON backup of every matched record to .runtime/backups first, then deletes them.
// Records with orders or enrollments are never deleted.
const apply = process.argv.includes('--apply'), includeDemo = process.argv.includes('--include-demo');
const config = loadConfig();
const connection = await mongoose.createConnection(config.mongo.uri, { dbName: config.mongo.dbName, autoIndex: false, serverSelectionTimeoutMS: 30000 }).asPromise();
const verify = /^STAGE\d+_DEV_VERIFY/, demo = /^DEMO\b|^Demo (Mathematics|Science) Mentor$|^Demo School Board$/;
const named = { coachingCourses: 'title', lessons: 'title', coursePlans: 'name', books: 'title', facultyProfiles: 'name', banners: 'title', universities: 'name', colleges: 'name', collegePrograms: 'name', taxonomies: 'label' };
try {
  const db = connection.db, plan = {};
  for (const [name, field] of Object.entries(named)) {
    const rows = await db.collection(name).find({ [field]: includeDemo ? { $in: [verify, demo] } : verify }).toArray();
    if (rows.length) plan[name] = rows;
  }
  const users = await db.collection('users').find({ name: 'STAGE5_DEV_VERIFY_TEST_ACTOR', emailNormalized: /@example\.invalid$/ }).toArray();
  if (users.length) plan.users = users;
  // Safety: refuse to touch anything a real student paid for or enrolled in.
  const ids = Object.values(plan).flat().map(r => r._id);
  const paid = await db.collection('orders').countDocuments({ $or: [{ 'product.id': { $in: ids } }, { 'product.courseId': { $in: ids } }, { userId: { $in: ids } }] });
  const enrolled = await db.collection('enrollments').countDocuments({ $or: [{ courseId: { $in: ids } }, { userId: { $in: ids } }] });
  if (paid || enrolled) throw new Error(`Refusing: ${paid} orders and ${enrolled} enrollments reference these records`);
  console.log(`Database: ${connection.name}${includeDemo ? ' (including DEMO content)' : ''}`);
  for (const [name, rows] of Object.entries(plan)) console.log(`  ${name}: ${rows.length} — ${rows.map(r => r[named[name]] ?? r.name).join(' | ')}`);
  if (!apply) { console.log('Dry run only. Re-run with --apply to back up and delete.'); process.exit(0); }
  const dir = path.resolve('.runtime', 'backups'); await mkdir(dir, { recursive: true });
  const file = path.join(dir, `removed-test-data-${Date.now()}.json`);
  await writeFile(file, JSON.stringify({ database: connection.name, at: new Date(), includeDemo, records: plan }, null, 2));
  console.log('Backup written:', file);
  for (const [name, rows] of Object.entries(plan)) {
    const { deletedCount } = await db.collection(name).deleteMany({ _id: { $in: rows.map(r => r._id) } });
    console.log(`  deleted ${deletedCount} from ${name}`);
  }
  if (plan.users) for (const name of ['sessions']) await db.collection(name).deleteMany({ userId: { $in: plan.users.map(u => u._id) } });
} finally { await connection.close(); }
