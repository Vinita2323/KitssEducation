import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { commerceFixture } from './commerce-fixture.js';

const dbName = process.env.KITSS_BOOK_LIFECYCLE_TEST_DB;
test('book lifecycle keeps owners reading through unpublish, removal, restore and price changes', { skip: !dbName ? 'No KITSS_BOOK_LIFECYCLE_TEST_DB; real book lifecycle tests not executed' : false, timeout: 300000 }, async t => {
  const f = await commerceFixture(dbName); t.after(() => f.close());
  const admin = await f.fixtureUser(), buyer = await f.fixtureUser(['student']), newcomer = await f.fixtureUser(['student']);
  const book = await f.book(admin), ctx = { ...f.ctx, actorId: admin.user.publicId };
  const current = () => f.models.Book.findById(book.id);
  const asset = async () => f.models.MediaAsset.findById(book.documentAssetId);
  const canRead = async actor => f.service.canReadAsset(await asset(), actor.auth);
  const publish = async value => f.publishing.publish('books', book.id, { expectedRevision: (await current()).revision, publish: value }, admin.auth, ctx);

  // A real fake-provider purchase: order, attempt, verified capture, fulfilment.
  const order = await f.service.create({ product: { kind: 'book', id: book.id }, idempotencyKey: randomUUID() }, buyer.auth, { ...f.ctx, actorId: buyer.user.publicId });
  const attemptKey = randomUUID(), attempt = await f.service.startAttempt(order.id, { idempotencyKey: attemptKey }, buyer.auth, f.ctx);
  const payment = f.provider.pay(attempt.providerOrderId);
  await f.service.verify({ orderId: order.id, attemptId: attemptKey, razorpay_order_id: attempt.providerOrderId, razorpay_payment_id: payment.id, razorpay_signature: f.provider.sign(attempt.providerOrderId + '|' + payment.id) }, buyer.auth, f.ctx);
  await f.service.fulfill(order.id);

  await t.test('publish state reports pending changes and admin summary counts all books', async () => {
    assert.equal(await canRead(buyer), true);
    let detail = await f.publishing.detail('books', book.id, true);
    assert.deepEqual(detail.publication, { everPublished: true, changesPending: false });
    await f.publishing.edit('books', book.id, { expectedRevision: detail.revision, subtitle: 'Edited after publish' }, admin.auth, ctx);
    detail = await f.publishing.detail('books', book.id, true);
    assert.equal(detail.publication.changesPending, true);
    assert.equal((await f.publishing.detail('books', book.id)).subtitle, undefined, 'students still see the published snapshot');
    await publish(true);
    assert.equal((await f.publishing.detail('books', book.id, true)).publication.changesPending, false);
    assert.equal((await f.publishing.detail('books', book.id)).subtitle, 'Edited after publish');
    const summary = (await f.publishing.list('books', {}, true)).summary;
    assert.equal(summary.live, 1); assert.equal(summary.livePaid, 1); assert.equal(summary.drafts, 0);
    assert.deepEqual(await f.service.ownerCounts([(await current())._id]), { [book.id]: 1 });
  });

  await t.test('taking a book off sale stops new sales but owners keep reading and see it in their library', async () => {
    await publish(false);
    const doc = await current();
    assert.equal(doc.status, 'draft'); assert.ok(doc.publishedSnapshot, 'snapshot retained for owners');
    assert.equal(await canRead(buyer), true);
    assert.equal(await canRead(newcomer), false);
    const owned = await f.service.ownedBooks(buyer.auth);
    assert.equal(owned.length, 1); assert.equal(owned[0].onSale, false); assert.equal(owned[0].title, doc.publishedSnapshot.title);
    await assert.rejects(() => f.service.create({ product: { kind: 'book', id: book.id }, idempotencyKey: randomUUID() }, newcomer.auth, f.ctx), { code: 'PRODUCT_NOT_PURCHASABLE' });
    await assert.rejects(() => f.publishing.detail('books', book.id), { code: 'NOT_FOUND' });
    assert.equal((await f.publishing.list('books', {})).meta.total, 0);
    assert.equal((await f.publishing.list('books', {}, true)).summary.offSale, 1);
  });

  await t.test('removal keeps owner access; restore returns a draft that can be republished', async () => {
    const removed = await f.publishing.archive('books', book.id, { expectedRevision: (await current()).revision }, ctx);
    assert.equal(removed.status, 'archived');
    assert.equal(await canRead(buyer), true);
    assert.equal((await f.service.ownedBooks(buyer.auth)).length, 1);
    await assert.rejects(() => f.publishing.publish('books', book.id, { expectedRevision: removed.revision, publish: true }, admin.auth, ctx), { code: 'INVALID_INPUT' });
    const restored = await f.publishing.restore('books', book.id, { expectedRevision: removed.revision }, ctx);
    assert.equal(restored.status, 'draft'); assert.equal(restored.publication.everPublished, true);
    await assert.rejects(() => f.publishing.restore('books', book.id, { expectedRevision: restored.revision }, ctx), { code: 'INVALID_INPUT' });
    await publish(true);
    assert.equal((await current()).status, 'published');
    assert.equal((await f.publishing.list('books', {})).meta.total, 1);
  });

  await t.test('publishing approves the saved price and category is optional', async () => {
    const draft = await f.publishing.create('books', { title: 'LIFECYCLE NO CATEGORY', author: 'Fixture', description: 'Synthetic only', languageId: String((await current()).languageId), priceMinor: 500, rightsConfirmed: true, rightsNote: 'Synthetic', coverAssetId: String((await current()).coverAssetId), documentAssetId: book.documentAssetId }, admin.auth, ctx);
    assert.equal(draft.pricingApproved, false);
    const live = await f.publishing.publish('books', draft.id, { expectedRevision: draft.revision, publish: true }, admin.auth, ctx);
    assert.equal(live.status, 'published'); assert.equal(live.pricingApproved, true); assert.equal(live.publishedSnapshot.pricingApproved, true);
    const noPrice = await f.publishing.create('books', { title: 'LIFECYCLE NO PRICE', author: 'Fixture', description: 'Synthetic only', languageId: String((await current()).languageId), rightsConfirmed: true, rightsNote: 'Synthetic', coverAssetId: String((await current()).coverAssetId), documentAssetId: book.documentAssetId }, admin.auth, ctx);
    await assert.rejects(() => f.publishing.publish('books', noPrice.id, { expectedRevision: noPrice.revision, publish: true }, admin.auth, ctx), { code: 'INVALID_INPUT' });
  });

  await t.test('free claims survive a later price change; new free claims stop', async () => {
    let doc = await current();
    await f.publishing.edit('books', book.id, { expectedRevision: doc.revision, priceMinor: 0 }, admin.auth, ctx); await publish(true);
    await f.service.freeBook(book.id, newcomer.auth, f.ctx);
    assert.equal(await canRead(newcomer), true);
    doc = await current();
    await f.publishing.edit('books', book.id, { expectedRevision: doc.revision, priceMinor: 9900 }, admin.auth, ctx); await publish(true);
    assert.equal(await canRead(newcomer), true);
    const late = await f.fixtureUser(['student']);
    await assert.rejects(() => f.service.freeBook(book.id, late.auth, f.ctx), { code: 'FREE_ACCESS_UNAVAILABLE' });
    assert.equal(await canRead(late), false);
  });

  await t.test('revocation still removes access and drops the owner count', async () => {
    await f.models.BookEntitlement.updateOne({ userId: buyer.user._id, bookId: book.id }, { $set: { revokedAt: new Date() } });
    assert.equal(await canRead(buyer), false);
    assert.equal((await f.service.ownedBooks(buyer.auth)).length, 0);
  });
});
