import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createPublishingRouter } from '../src/modules/publishing/publishing.routes.js';
import { createPublishingService } from '../src/modules/publishing/publishing.service.js';
import { serve } from './helpers.js';

test('public faculty API uses published snapshots, safe fields and validated pagination without a session', async t => {
  const rows = [
    { _id: 'published-one', status: 'published', name: 'Unsaved public name', sourceNote: 'Private review', publishedSnapshot: { name: 'Published Instructor', role: 'Tutor', portraitAssetId: 'portrait-one', sortOrder: 0, sourceNote: 'Private evidence', createdBy: 'private-actor', updatedBy: 'private-editor', revision: 3, status: 'draft' } },
    { _id: 'published-two', status: 'published', publishedSnapshot: { name: 'Second Instructor', role: 'Tutor', sortOrder: 1 } },
    { _id: 'draft', status: 'draft', publishedSnapshot: null },
    { _id: 'archived', status: 'archived', publishedSnapshot: null },
  ];
  const matches = filter => {
    assert.deepEqual(filter, { status: 'published', publishedSnapshot: { $ne: null } });
    return rows.filter(row => row.status === filter.status && row.publishedSnapshot !== null);
  };
  const FacultyProfile = {
    countDocuments: async filter => matches(filter).length,
    find: filter => {
      let offset = 0, limit = 20;
      const query = {
        sort: sort => { assert.deepEqual(sort, { 'publishedSnapshot.sortOrder': 1, _id: 1 }); return query; },
        skip: value => { offset = value; return query; }, limit: value => { limit = value; return query; },
        lean: async () => matches(filter).slice(offset, offset + limit),
      };
      return query;
    },
  };
  const publishing = createPublishingService({ models: { FacultyProfile } });
  const app = express();
  app.use((req, res, next) => { req.requestId = 'faculty-test'; next(); });
  app.use('/api/v1', createPublishingRouter({ publishing, media: {} }));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ error: { code: error.code, message: error.message } }));
  const base = await serve(t, app);
  const first = await fetch(base + '/api/v1/public/faculty?page=1&pageSize=1');
  assert.equal(first.status, 200);
  const body = await first.json();
  assert.deepEqual(body.meta, { page: 1, pageSize: 1, total: 2, totalPages: 2 });
  assert.equal(body.data[0].name, 'Published Instructor');
  assert.equal(body.data[0].status, 'published');
  assert.equal(body.data[0].portraitUrl, '/api/v1/media/portrait-one/content');
  for (const key of ['sourceNote', 'createdBy', 'updatedBy', 'publishedSnapshot', 'revision', 'auditOutbox']) assert.equal(Object.hasOwn(body.data[0], key), false);
  const second = await (await fetch(base + '/api/v1/public/faculty?page=2&pageSize=1')).json();
  assert.equal(second.data[0].id, 'published-two');
  for (const query of ['status=draft', 'status=published', 'page=-1', 'pageSize=101', 'unknown=value']) {
    assert.equal((await fetch(base + '/api/v1/public/faculty?' + query)).status, 422);
  }
});
