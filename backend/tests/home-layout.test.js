import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { contentInput } from '../src/modules/publishing/validation.js';
import { createPublishingModels } from '../src/modules/publishing/publishing.models.js';
test('home appearance is optional, validated and retained by the existing page schema', async () => {
  const old = { key: 'home', sections: [{ key: 'services', type: 'cards', heading: 'Services', items: [{ heading: 'Books', body: 'Read', linkKey: 'books' }] }] };
  const legacy = contentInput('pages', old, true).fields;
  assert.equal(legacy.sections[0].layout, undefined);
  const updated = structuredClone(old); updated.sections[0].layout = 'services';
  Object.assign(updated.sections[0].items[0], { iconKey: 'BookOpen', color: 'blue' });
  const fields = contentInput('pages', updated, true).fields;
  const connection = mongoose.createConnection();
  try {
    const { PageContent } = createPublishingModels(connection);
    const doc = new PageContent(fields); await doc.validate();
    assert.equal(doc.sections[0].layout, 'services'); assert.equal(doc.sections[0].items[0].color, 'blue');
    assert.equal(doc.sections[0].items[0].linkKey, 'books');
  } finally { await connection.close(); }
  for (const field of ['layout', 'color', 'iconKey', 'linkKey']) {
    const bad = structuredClone(updated);
    (field === 'layout' ? bad.sections[0] : bad.sections[0].items[0])[field] = 'javascript:alert(1)';
    assert.throws(() => contentInput('pages', bad, true), { status: 422 });
  }
});
