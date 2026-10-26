import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { readFile } from 'node:fs/promises';
import { realMediaFixture, realMediaEnabled, clamCommand } from './real-media-fixture.js';
import { pdfBytes } from './publishing-fixture.js';
import { createScanner } from '../src/modules/media/inspection.js';
import { createMediaService } from '../src/modules/media/media.service.js';
import { serve } from './helpers.js';

test('Stage 15 real ClamAV/FFmpeg/FFprobe, isolated MongoDB and protected media HTTP acceptance', { skip: !realMediaEnabled || !process.env.KITSS_STAGE15_TEST_DB ? 'Real media acceptance not explicitly configured' : false, timeout: 360000 }, async t => {
  const f = await realMediaFixture(process.env.KITSS_STAGE15_TEST_DB); t.after(() => f.close());
  const d = await f.seed(), url = await serve(t, f.app());
  const proof = await fetch(url + '/api/v1/auth/csrf'), cookie = proof.headers.getSetCookie()[0].split(';')[0], csrf = (await proof.json()).data.csrfToken;
  const api = (path, actor = d.student, options = {}) => fetch(url + '/api/v1' + path, { ...options, headers: { Origin: f.config.corsOrigins[0], Cookie: cookie + (actor ? '; ' + (actor.user.roles.includes('student') ? 'kitss_student_session=' : 'kitss_staff_session=') + actor.token : ''), 'X-CSRF-Token': csrf, ...options.headers } });
  const upload = (bytes, purpose, mime, filename, key = randomUUID(), actor = d.admin) => { const data = new FormData(); data.append('purpose', purpose); data.append('idempotencyKey', key); data.append('file', new Blob([bytes], { type: mime }), filename); return api('/media', actor, { method: 'POST', body: data }); };
  const pdf = await pdfBytes(3, 'Stage 15 self-generated clean document'), video = await readFile(new URL('./fixtures/lesson-generated.mp4', import.meta.url));
  let asset, lesson;
  await t.test('official-signature daemon scans a real clean file and harmless EICAR in memory', async () => {
    assert.equal(await clamCommand('PING'), 'PONG');
    assert.equal(await f.scanner.scan(Readable.from(pdf)), 'clean');
    // Standard harmless AV test pattern; never written to disk, logs or reports.
    const eicar = Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=', 'base64');
    assert.equal(await f.scanner.scan(Readable.from(eicar)), 'infected');
  });
  await t.test('authorized multipart PDF upload persists real scan, inspection and checksum; duplicate upload is stable', async () => {
    const key = randomUUID(), response = await upload(pdf, 'book_full', 'application/pdf', 'self-generated.pdf', key);
    assert.equal(response.status, 201, await response.clone().text()); asset = (await response.json()).data;
    assert.equal(asset.status, 'ready'); assert.equal(asset.scan.status, 'clean'); assert.equal(asset.visibility, 'private'); assert.equal(asset.pageCount, 3); assert.equal(asset.key, undefined);
    assert.equal(asset.checksum, createHash('sha256').update(pdf).digest('hex'));
    assert.equal((await (await upload(pdf, 'book_full', 'application/pdf', 'self-generated.pdf', key)).json()).data.id, asset.id);
    assert.equal((await api('/media/' + asset.id + '/content', null)).status, 404);
    assert.equal((await api('/media/public/' + asset.id, null)).status, 404);
  });
  await t.test('free book publication/entitlement delivers exact private PDF without fake orders', async () => {
    const book = await f.models.Book.findById(d.book.id);
    const edited = await f.publishing.edit('books', d.book.id, { expectedRevision: book.revision, documentAssetId: asset.id, priceMinor: 0 }, d.admin.auth, f.ctx);
    await f.publishing.publish('books', d.book.id, { expectedRevision: edited.revision, publish: true }, d.admin.auth, f.ctx);
    await f.service.freeBook(d.book.id, d.student.auth, f.ctx);
    const response = await api('/media/' + asset.id + '/content'); assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf); assert.equal(response.headers.get('cache-control').includes('no-store'), true);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(await f.models.Order.countDocuments(), 0);
    assert.equal((await api('/media/' + asset.id + '/content', d.other)).status, 404);
  });
  await t.test('paid book denies unpaid user, verified synthetic capture gives lifetime rights; revocation and unpublication deny', async () => {
    const book = await f.book(d.admin, 'Stage 15 self-generated paid fixture');
    assert.equal((await api('/media/' + book.documentAssetId + '/content')).status, 404);
    const order = await f.service.create({ product: { kind: 'book', id: book.id }, idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
    await f.service.startAttempt(order.id, { idempotencyKey: randomUUID() }, d.student.auth, f.ctx);
    const stored = await f.models.Order.findById(order.id), payment = f.provider.pay(stored.providerOrderId);
    await f.service.observe(order.id, payment.id, 'isolated_stage15_synthetic_capture', f.ctx);
    const rights = await f.models.BookEntitlement.findOne({ orderId: order.id }); assert.equal(rights.expiresAt == null, true);
    assert.equal((await api('/media/' + book.documentAssetId + '/content')).status, 200);
    await f.models.BookEntitlement.updateOne({ _id: rights._id }, { $set: { revokedAt: new Date() } });
    assert.equal((await api('/media/' + book.documentAssetId + '/content')).status, 404);
    await f.publishing.publish('books', d.book.id, { expectedRevision: (await f.models.Book.findById(d.book.id)).revision, publish: false }, d.admin.auth, f.ctx);
    assert.equal((await api('/media/' + asset.id + '/content')).status, 404);
    // Restore the licensed linked book before independently publishing its course.
    await f.publishing.publish('books', d.book.id, { expectedRevision: (await f.models.Book.findById(d.book.id)).revision, publish: true }, d.admin.auth, f.ctx);
  });
  await t.test('real video scan, FFprobe metadata and complete FFmpeg decode precede free-course publication', async () => {
    const response = await upload(video, 'lesson_video', 'video/mp4', 'self-generated.mp4'); assert.equal(response.status, 201, await response.clone().text());
    const media = (await response.json()).data; assert.equal(media.scan.status, 'clean'); assert.equal(media.durationSeconds, 20); assert.equal(media.inspectionVersion, 'mp4-h264-aac-v1');
    let course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    const plan = await f.models.CoursePlan.findById(d.plan.id); await f.learning.mutate('plans', d.plan.id, d.course.id, { expectedRevision: plan.revision, priceMinor: 0 }, d.admin.auth, f.ctx);
    lesson = await f.learning.mutate('lessons', null, d.course.id, { title: 'Stage 15 generated video', subjectKey: 'section-1', sortOrder: 4, videoAssetId: media.id, status: 'published' }, d.admin.auth, f.ctx);
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: true }, d.admin.auth, f.ctx);
    await f.learning.enrollFree(d.course.id, d.student.auth, f.ctx);
    const range = await api('/media/' + media.id + '/content', d.student, { headers: { Range: 'bytes=0-31' } }); assert.equal(range.status, 206); assert.equal((await range.arrayBuffer()).byteLength, 32);
    assert.equal((await api('/media/' + media.id + '/content', null)).status, 404); assert.equal((await api('/media/' + media.id + '/content', d.other)).status, 404);
    const enrollment = await f.models.Enrollment.findOne({ userId: d.student.user._id, courseId: d.course.id });
    await f.models.Enrollment.updateOne({ _id: enrollment._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } }); assert.equal((await api('/media/' + media.id + '/content')).status, 404);
    await f.models.Enrollment.updateOne({ _id: enrollment._id }, { $set: { expiresAt: new Date(Date.now() + 86400000), revokedAt: new Date() } }); assert.equal((await api('/media/' + media.id + '/content')).status, 404);
    // Actual replacement removes the old lesson reference; no entitlement can read obsolete bytes.
    course = await f.models.Course.findById(d.course.id); await f.learning.publish(d.course.id, { expectedRevision: course.revision, publish: false }, d.admin.auth, f.ctx);
    await f.learning.mutate('lessons', lesson.id, d.course.id, { expectedRevision: lesson.revision, videoAssetId: null, content: 'Self-authored replacement lesson' }, d.admin.auth, f.ctx);
    assert.equal((await api('/media/' + media.id + '/content')).status, 404);
  });
  await t.test('real unavailable scanner quarantines; actual daemon rescan safely recovers', async () => {
    const service = createMediaService({ models: f.models, storage: f.storage, coordination: f.coordination, config: f.config, authService: f.auth, scanner: createScanner({ enabled: true, port: 1, scanTimeoutMs: 1000 }) });
    const quarantined = await service.upload({ purpose: 'book_full', originalName: 'recover.pdf', mime: 'application/pdf', stream: Readable.from(pdf), idempotencyKey: randomUUID(), auth: d.admin.auth, ctx: f.ctx });
    assert.equal(quarantined.status, 'quarantined'); assert.equal(quarantined.scan.status, 'error');
    assert.equal((await api('/media/' + quarantined.id + '/content', d.admin)).status, 404);
    const recovered = await f.media.rescan(quarantined.id, { expectedRevision: quarantined.revision }, f.ctx); assert.equal(recovered.status, 'ready'); assert.equal(recovered.scan.status, 'clean');
  });
  await t.test('real scanned registration PDF remains private to owner and authorized document reviewers', async () => {
    await f.service.business.save({ value: { registrations: { study: { status: 'active', feeRequired: false, amountMinor: 0, currency: 'INR', documents: [{ key: 'proof', label: 'Generated synthetic evidence' }], documentsApproved: true, privacyApproved: true } } }, expectedRevision: 0, reason: 'Isolated generated document acceptance only' }, d.admin.auth, f.ctx);
    const response = await upload(pdf, 'registration_document', 'application/pdf', 'private-proof.pdf', randomUUID(), d.student); assert.equal(response.status, 201, await response.clone().text());
    const doc = (await response.json()).data; assert.equal(doc.scan.status, 'clean'); assert.equal(doc.visibility, 'private');
    assert.equal((await api('/media/' + doc.id + '/content')).status, 200);
    assert.equal((await api('/media/' + doc.id + '/content', d.admin)).status, 200);
    assert.equal((await api('/media/' + doc.id + '/content', d.other)).status, 404);
    const generic = await f.fixtureUser(['admin'], ['media.read']); assert.equal((await api('/media/' + doc.id + '/content', generic)).status, 404);
    assert.equal((await api('/media/public/' + doc.id, null)).status, 404);
  });
  await t.test('unsupported MIME, malformed PDF, corrupt video, unauthorized staff and path guesses fail safely', async () => {
    const staff = await f.fixtureUser(['admin'], ['books.read']);
    assert.equal((await upload(pdf, 'book_full', 'application/pdf', 'forbidden.pdf', randomUUID(), staff)).status, 403);
    for (const [bytes, purpose, mime, name] of [[Buffer.from('not PDF'), 'book_full', 'application/pdf', 'bad.pdf'], [pdf, 'book_full', 'image/png', 'bad.pdf'], [video.subarray(0, 1000), 'lesson_video', 'video/mp4', 'bad.mp4']]) {
      const response = await upload(bytes, purpose, mime, name); assert.ok([415, 422].includes(response.status)); const json = await response.json(); assert.equal(JSON.stringify(json).includes(f.storage.root), false);
    }
    assert.equal((await api('/media/..%2F..%2Fbackend%2F.env/content')).status >= 400, true);
    assert.ok(f.scans.length >= await f.models.MediaAsset.countDocuments({ status: 'ready' })); assert.ok(f.scans.every(result => result === 'clean'));
    assert.ok(await f.models.AuditLog.countDocuments({ action: 'media_ready' }) > 0);
  });
});
