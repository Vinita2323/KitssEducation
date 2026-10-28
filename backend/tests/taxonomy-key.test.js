import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTaxonomyKey } from '../src/modules/institutions/taxonomy-key.js';
import { definitionInput } from '../src/modules/institutions/validation.js';

test('taxonomy creation accepts automatic keys and preserves explicit API keys', () => {
  assert.deepEqual(definitionInput('taxonomy', { kind: 'state', label: 'Uttar Pradesh' }, true), { kind: 'state', label: 'Uttar Pradesh' });
  assert.equal(definitionInput('taxonomy', { kind: 'state', key: 'legacy-key', label: 'State' }, true).key, 'legacy-key');
  assert.throws(() => definitionInput('taxonomy', { kind: 'state', label: '' }, true));
  assert.throws(() => definitionInput('taxonomy', { kind: 'state', key: '../unsafe', label: 'State' }, true));
});

test('keys include parent identity, handle collisions including archived values, and fit the schema', async () => {
  const used = new Set(['cbse-class-10', 'cbse-class-10-2']);
  const model = { findById: async () => ({ key: 'cbse' }), exists: async filter => used.has(filter.key) };
  assert.equal(await generateTaxonomyKey({ kind: 'class', label: 'Class 10', parentIds: ['parent'] }, model), 'cbse-class-10-3');
  assert.equal(await generateTaxonomyKey({ kind: 'state', label: '  Uttar Pradesh!  ' }, model), 'uttar-pradesh');
  assert.equal(await generateTaxonomyKey({ kind: 'language', label: 'Fran\u00e7ais' }, model), 'francais');
  for (const label of ['\u0939\u093f\u0928\u094d\u0926\u0940', 'a'.repeat(160)]) {
    const key = await generateTaxonomyKey({ kind: 'language', label }, model);
    assert.match(key, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(key.length <= 80);
  }
});
