// Deliberate retained-fixture smoke tool, never server startup or a provider-connected test.
import { randomUUID, createHash } from 'node:crypto';
import http from 'node:http';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { commerceFixture, FakePaymentProvider } from '../tests/commerce-fixture.js';
import { loadConfig } from '../src/config/env.js';
import { startServer } from '../src/server.js';

if (!process.argv.includes('--confirm-development')) throw new Error('Explicit --confirm-development is required; this creates labelled retained fixtures');
const config = loadConfig(), isolated = process.argv.includes('--isolated');
if (config.nodeEnv !== 'development' || !/^kitss_(?:education_dev|stage6_dev_[a-f0-9]{16})$/.test(config.mongo.dbName || new URL(config.mongo.uri).pathname.replace(/^\//, ''))) throw new Error('Development database classification required');
const provider = new FakePaymentProvider('STAGE6_DEV_VERIFY_' + randomUUID());
const report = { label: 'STAGE6_DEV_VERIFY', isolated, environment: config.nodeEnv, provider: 'fake', simulated: true, realProviderCalls: 0, records: {}, checks: {}, destructiveOperations: false };
let f, actor, server, restarted;
const artifact = fileURLToPath(new URL(isolated ? '../STAGE6-ISOLATED-DEVELOPMENT-VERIFICATION.json' : '../STAGE6-DEVELOPMENT-VERIFICATION.json', import.meta.url));
try {
  f = await commerceFixture(undefined, { actual: true, provider }); report.database = f.connection.name;
  report.baselineCounts = {}; for (const c of await f.connection.db.listCollections({}, { nameOnly: true }).toArray()) report.baselineCounts[c.name] = await f.connection.db.collection(c.name).countDocuments();
  actor = await f.fixtureUser(['student']); report.records.verificationActorId = String(actor.user._id);
  const label = 'STAGE6_DEV_VERIFY_' + randomUUID();
  // Synthetic fixture is draft only. No licensed/public content or real product price is invented.
  const book = await f.models.Book.create({ publicId: label, title: label + '_DRAFT_NOT_FOR_SALE', createdBy: actor.user.publicId }); report.records.bookId = String(book._id);
  const idem = randomUUID(), product = { kind: 'book', id: String(book._id) }, requestHash = createHash('sha256').update(JSON.stringify(product)).digest('hex');
  const row = await f.models.Order.create({ reference: 'K6-' + randomUUID().replaceAll('-', ''), userId: actor.user._id, product: { ...product, title: label + '_SIMULATED_ORDER' }, amountMinor: 100, currency: 'INR', provider: 'fake', paymentMode: 'test', providerScope: provider.scope, simulated: true, idempotencyKey: idem, requestHash, expiresAt: new Date(Date.now() + 86400000) }); report.records.orderId = String(row._id);
  const ctx = { ip: 'development-verification', requestId: randomUUID(), actorId: actor.user.publicId };
  report.checks.idempotentInternalRead = (await f.service.create({ product, idempotencyKey: idem }, actor.auth, ctx)).id === String(row._id);
  const attemptKey = randomUUID(), attempt = await f.service.startAttempt(String(row._id), { idempotencyKey: attemptKey }, actor.auth, ctx);
  const payment = provider.pay(attempt.providerOrderId); report.records.fakeProviderOrderId = attempt.providerOrderId; report.records.fakePaymentId = payment.id;
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: payment.id, order_id: payment.order_id } } } }));
  const eventId = randomUUID(); await f.service.receiveWebhook(raw, provider.sign(raw), eventId); await f.service.tick();
  report.records.eventJobId = String((await f.models.Job.findOne({ paymentId: payment.id }))._id);
  const state = await f.models.Order.findById(row._id); report.checks.simulatedCapturePersisted = state.status === 'captured' && state.simulated === true;
  report.checks.fulfillmentRemainsRestricted = state.fulfillment.state !== 'applied' && await f.models.BookEntitlement.countDocuments({ orderId: row._id }) === 0;
  server = http.createServer(f.app()); await new Promise(r => server.listen(0, '127.0.0.1', r));
  let response = await fetch('http://127.0.0.1:' + server.address().port + '/api/v1/orders/' + row._id + '/status', { headers: { Cookie: 'kitss_student_session=' + actor.token } }); report.checks.authoritativeOwnerStatus = response.status === 200 && (await response.json()).data.simulated === true;
  await new Promise(r => { server.close(r); server.closeAllConnections(); }); server = null; await f.connection.close();
  restarted = await startServer({ config, logger: f.logger, commerceProvider: provider, port: 0 });
  report.checks.readinessAfterRestart = (await fetch('http://127.0.0.1:' + restarted.server.address().port + '/api/v1/health/ready')).status === 200;
  response = await fetch('http://127.0.0.1:' + restarted.server.address().port + '/api/v1/orders/' + row._id + '/status', { headers: { Cookie: 'kitss_student_session=' + actor.token } }); report.checks.persistsAfterRestart = response.status === 200 && (await response.json()).data.orderStatus === 'captured';
  await restarted.close(); restarted = null;
} catch (error) { report.blocker = error.code === 8000 ? 'Configured database host collection capacity exhausted; no reset or deletion attempted' : 'Verification did not complete; inspect locally without exposing credentials'; throw error; }
finally {
  if (server) await new Promise(r => { server.close(r); server.closeAllConnections(); }); await restarted?.close();
  if (f) {
    if (f.connection.readyState !== 1) await f.connection.openUri(config.mongo.uri, { ...(config.mongo.dbName ? { dbName: config.mongo.dbName } : {}), autoIndex: false });
    if (actor) { await f.models.User.updateOne({ _id: actor.user._id }, { $set: { status: 'suspended' }, $inc: { securityVersion: 1 } }); await f.models.Session.updateOne({ _id: actor.session._id }, { $set: { revokedAt: new Date() } }); report.checks.verificationActorRetired = true; }
    report.finalCounts = {}; for (const c of await f.connection.db.listCollections({}, { nameOnly: true }).toArray()) report.finalCounts[c.name] = await f.connection.db.collection(c.name).countDocuments();
    report.indexes = {}; for (const collection of ['orders', 'bookEntitlements', 'registrationApplications', 'jobs']) report.indexes[collection] = (await f.connection.db.collection(collection).indexes()).map(i => i.name);
    await f.connection.close();
  }
  await writeFile(artifact, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
