import test from 'node:test';
import assert from 'node:assert/strict';
import { contentInput } from '../src/modules/publishing/validation.js';
import { defaultCategoryCards, resolveCategoryCards } from '../../frontend/src/modules/user/pages/categories/categoryCards.js';
import mongoose from 'mongoose';
import { createPublishingModels } from '../src/modules/publishing/publishing.models.js';

test('category cards validate safe routes, limits, keys, icon and colour allowlists', () => {
  const parse = cards => contentInput('pages', { key: 'categories', categoryCards: cards }, true);
  assert.equal(parse(defaultCategoryCards).fields.categoryCards.length, defaultCategoryCards.length);
  assert.deepEqual(parse([]).fields.categoryCards, []);
  for (const patch of [{ path: '/admin' }, { path: 'javascript:alert(1)' }, { iconKey: 'script' }, { color: 'url(evil)' }, { hidden: 'false' }, { id: 'all' }, { title: '' }, { tabLabel: '' }, { tags: ['a','b','c','d'] }, { imageAssetId: '../file' }, { extra: true }]) {
    assert.throws(() => parse([{ ...defaultCategoryCards[0], ...patch }]), { status: 422 });
  }
  assert.throws(() => parse([defaultCategoryCards[0], defaultCategoryCards[0]]), { status: 422 });
  assert.throws(() => parse(Array(31).fill(defaultCategoryCards[0])), { status: 422 });
  assert.throws(() => contentInput('pages', { key: 'home', categoryCards: [] }, true), { status: 422 });
});
test('category defaults preserve old CMS overrides and intentional empty configuration', () => {
  assert.equal(resolveCategoryCards().length, defaultCategoryCards.length);
  assert.equal(resolveCategoryCards({ sections: [{ items: [{ linkKey: 'books', heading: 'Legacy books', body: 'Legacy description' }] }] }).find(card => card.id === 'books').title, 'Legacy books');
  assert.deepEqual(resolveCategoryCards({ categoryCards: [] }), []);
  assert.deepEqual(resolveCategoryCards({ categoryCards: [{ id: 'custom' }] }), [{ id: 'custom' }]);
});
test('category schema is additive and does not backfill an empty array into legacy pages', async () => {
  const connection = mongoose.createConnection();
  const models = createPublishingModels(connection);
  assert.equal(new models.PageContent({ key: 'categories' }).categoryCards, undefined);
  assert.deepEqual(new models.PageContent({ key: 'categories', categoryCards: [] }).toObject().categoryCards, []);
  await connection.close();
});
