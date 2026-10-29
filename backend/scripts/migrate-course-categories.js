import mongoose from 'mongoose';
import { loadConfig } from '../src/config/env.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';
import { generateTaxonomyKey } from '../src/modules/institutions/taxonomy-key.js';

// Turns free-text coaching categories into managed "Course categories" dropdown entries.
// Spelling variants that differ only by case or spacing are merged onto the most used one.
// Dry run by default; pass --apply to write. Additive: no course or taxonomy is deleted.
const apply = process.argv.includes('--apply');
const config = loadConfig();
const connection = await mongoose.createConnection(config.mongo.uri, { dbName: config.mongo.dbName, autoIndex: false, serverSelectionTimeoutMS: 30000 }).asPromise();
try {
  const { Taxonomy } = createInstitutionModels(connection), courses = connection.collection('coachingCourses');
  const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
  const groups = new Map();
  for (const course of await courses.find({}, { projection: { category: 1, 'publishedSnapshot.category': 1 } }).toArray())
    for (const raw of [course.category, course.publishedSnapshot?.category]) {
      const label = clean(raw); if (!label) continue;
      const group = groups.get(label.toLowerCase()) ?? new Map();
      group.set(label, (group.get(label) ?? 0) + 1); groups.set(label.toLowerCase(), group);
    }
  const canonical = new Map([...groups].map(([lower, spellings]) => [lower, [...spellings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]]));
  console.log(`Database: ${connection.name}. ${canonical.size} categor${canonical.size === 1 ? 'y' : 'ies'}: ${[...canonical.values()].join(', ') || 'none'}`);
  let created = 0, updated = 0;
  for (const label of canonical.values()) {
    const exists = await Taxonomy.findOne({ kind: 'course_category', label: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'), deletedAt: null });
    if (exists) { console.log(`  keep existing dropdown entry: ${exists.label}`); continue; }
    console.log(`  ${apply ? 'create' : 'would create'} dropdown entry: ${label}`); created++;
    if (apply) await Taxonomy.create({ kind: 'course_category', label, key: await generateTaxonomyKey({ kind: 'course_category', label, parentIds: [] }, Taxonomy), status: 'active', parentIds: [], createdBy: 'migration', updatedBy: 'migration' });
  }
  for (const course of await courses.find({}, { projection: { title: 1, category: 1, 'publishedSnapshot.category': 1 } }).toArray()) {
    const set = {};
    for (const [path, raw] of [['category', course.category], ['publishedSnapshot.category', course.publishedSnapshot?.category]]) {
      const target = raw ? canonical.get(clean(raw).toLowerCase()) : undefined;
      if (target && target !== raw) set[path] = target;
    }
    if (!Object.keys(set).length) continue;
    console.log(`  ${apply ? 'update' : 'would update'} "${course.title}": ${JSON.stringify(set)}`); updated++;
    if (apply) await courses.updateOne({ _id: course._id }, { $set: set });
  }
  console.log(`${apply ? 'Applied' : 'Dry run'}: ${created} dropdown entr${created === 1 ? 'y' : 'ies'}, ${updated} course${updated === 1 ? '' : 's'} normalised.${apply ? '' : ' Re-run with --apply to write.'}`);
} finally { await connection.close(); }
