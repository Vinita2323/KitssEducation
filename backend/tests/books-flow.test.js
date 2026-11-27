import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createPublishingService } from '../src/modules/publishing/publishing.service.js';
import { PaymentService } from '../src/modules/commerce/payment.service.js';
import { contentInput } from '../src/modules/publishing/validation.js';
import { commerceFixture } from './commerce-fixture.js';

test('books validation rejects invalid pricing and page zero chapters', () => {
  assert.throws(() => contentInput('books', { title: 'Book', toc: [{ title: 'Ch1', page: 0 }] }, true));
  assert.throws(() => contentInput('books', { title: 'Book', priceMinor: -50 }, true));
  const parsed = contentInput('books', { title: 'Valid Book', priceMinor: 19900, rightsNote: 'In-house' }, true);
  assert.equal(parsed.fields.title, 'Valid Book');
  assert.equal(parsed.fields.priceMinor, 19900);
});

test('ownedBooks enriches live and off-sale books with batched taxonomy labels', async () => {
  const boardId = new mongoose.Types.ObjectId();
  const classId = new mongoose.Types.ObjectId();
  const subjectId = new mongoose.Types.ObjectId();
  const languageId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const bookId = new mongoose.Types.ObjectId();
  const assetId = new mongoose.Types.ObjectId();

  const taxRows = [
    { _id: boardId, label: 'CBSE' },
    { _id: classId, label: '10' },
    { _id: subjectId, label: 'Mathematics' },
    { _id: languageId, label: 'English' },
  ];

  const publishing = createPublishingService({
    models: { Book: {}, PageContent: {}, Banner: {}, FacultyProfile: {}, SiteSettings: {} },
    taxonomy: {
      find: () => ({
        select: () => ({
          lean: async () => taxRows,
        }),
      }),
    },
    coordination: {},
    media: {},
  });

  const bookRow = {
    _id: bookId,
    status: 'draft',
    publishedSnapshot: {
      title: 'Off-Sale Maths Guide',
      priceMinor: 0,
      rightsConfirmed: true,
      rightsNote: 'In-house copyright',
      documentAssetId: String(assetId),
      boardId: String(boardId),
      classId: String(classId),
      subjectId: String(subjectId),
      languageId: String(languageId),
      toc: [{ title: 'Algebra', page: 1 }],
      revision: 2,
    },
  };
  const assetRow = {
    _id: assetId,
    purpose: 'book_full',
    status: 'ready',
    pageCount: 42,
    scan: { status: 'clean' },
  };
  const entitlementRow = {
    _id: new mongoose.Types.ObjectId(),
    userId,
    bookId,
    source: 'free',
    simulated: false,
    revokedAt: null,
  };

  const service = new PaymentService({
    models: {
      BookEntitlement: {
        find: () => ({ lean: async () => [entitlementRow] }),
        findOne: async () => entitlementRow,
      },
      Order: { exists: async () => false },
    },
    publishingModule: {
      publishing,
      models: {
        Book: {
          find: (query) => query?._id ? ({ lean: async () => [bookRow] }) : ({ select: () => ({ lean: async () => [bookRow] }) }),
        },
        MediaAsset: {
          find: async () => [assetRow],
        },
      },
    },
    learning: null,
    authService: { models: {} },
    provider: { name: 'razorpay', scope: 'test', mode: 'test', simulated: true, ready: false },
    config: {},
    logger: { warn() {}, error() {}, info() {} },
  });

  const owned = await service.ownedBooks({ user: { _id: userId, status: 'active', emailVerifiedAt: new Date() } });
  assert.equal(owned.length, 1);
  assert.equal(owned[0].title, 'Off-Sale Maths Guide');
  assert.equal(owned[0].onSale, false);
  assert.equal(owned[0].canReadFull, true);
  assert.equal(owned[0].board, 'CBSE');
  assert.equal(owned[0].class, '10');
  assert.equal(owned[0].subject, 'Mathematics');
  assert.equal(owned[0].language, 'English');
});

const dbName = process.env.KITSS_BOOKS_FLOW_DB || process.env.KITSS_BOOK_LIFECYCLE_TEST_DB;
test('Books end-to-end free claim and taxonomy enrichment (MongoDB)', {
  skip: !dbName ? 'No isolated test DB supplied; MongoDB integration skipped' : false,
  timeout: 180000,
}, async t => {
  const f = await commerceFixture(dbName);
  t.after(() => f.close());
  const admin = await f.fixtureUser();
  const student = await f.fixtureUser(['student']);
  // The fixture's second argument is the title, and it creates a paid book: make it free and republish it.
  const book = await f.book(admin, 'BOOKS_FLOW_FREE_BOOK');
  const current = await f.models.Book.findById(book.id);
  const edited = await f.publishing.edit('books', book.id, { expectedRevision: current.revision, priceMinor: 0 }, admin.auth, f.ctx);
  await f.publishing.publish('books', book.id, { expectedRevision: edited.revision, publish: true }, admin.auth, f.ctx);
  await f.service.freeBook(book.id, student.auth, f.ctx);
  const owned = await f.service.ownedBooks(student.auth);
  assert.equal(owned.length, 1);
  assert.equal(owned[0].id, book.id);
});
