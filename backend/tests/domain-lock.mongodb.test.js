// Lock leases: a lock left by a dead process is taken over after the lease, a live lock still blocks, a long write
// keeps its lease by renewing it, and normal release still works. Runs only against a fresh, named test database.
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';
import { withDomainLock, GLOBAL_LOCK_ID, LEASE_MS } from '../src/utils/domain-lock.js';

const dbName = process.env.KITSS_DOMAIN_LOCK_TEST_DB;
test('domain lock leases', { skip: !dbName || !process.env.MONGODB_URI ? 'No isolated lock test database; integration not executed' : false, timeout: 120000 }, async t => {
  assert.match(dbName, /^kitss_stage10_test_[a-f0-9]{16}$/);
  const connection = await mongoose.createConnection(process.env.MONGODB_URI, { dbName, serverSelectionTimeoutMS: 10000 }).asPromise();
  t.after(async () => { await connection.dropDatabase(); await connection.close(); });
  const { DomainLock } = createInstitutionModels(connection);
  await DomainLock.createIndexes();
  const errors = [], logger = { error: event => errors.push(event.event) };
  const run = (work, scope) => withDomainLock({ lockModel: DomainLock, logger, scope, busyMessage: 'busy', releaseFailedMessage: 'release failed' }, work);
  const stale = new Date(Date.now() - LEASE_MS - 5000);

  await t.test('a global lock left by a dead process is taken over after the lease', async () => {
    await DomainLock.updateOne({ _id: GLOBAL_LOCK_ID }, { $set: { owner: 'dead-process', acquiredAt: stale } }, { upsert: true });
    assert.equal(await run(async () => 'saved'), 'saved');
    assert.equal((await DomainLock.findById(GLOBAL_LOCK_ID).lean()).owner, null, 'released afterwards');
  });

  await t.test('a live global lock still blocks other writers', async () => {
    await DomainLock.updateOne({ _id: GLOBAL_LOCK_ID }, { $set: { owner: 'live-process', acquiredAt: new Date() } });
    const started = Date.now();
    await assert.rejects(run(async () => 'should not run'), { code: 'DOMAIN_BUSY' });
    assert.ok(Date.now() - started >= 2900, 'waited for the acquire window');
    assert.equal((await DomainLock.findById(GLOBAL_LOCK_ID).lean()).owner, 'live-process', 'not stolen');
    await DomainLock.updateOne({ _id: GLOBAL_LOCK_ID }, { $set: { owner: null }, $unset: { acquiredAt: 1 } });
  });

  await t.test('scoped locks: a stale one is taken over, a live one blocks', async () => {
    await DomainLock.create({ _id: 'scope:user:a', owner: 'dead-process', acquiredAt: stale });
    assert.equal(await run(async () => 'scoped', 'user:a'), 'scoped');
    assert.equal(await DomainLock.exists({ _id: 'scope:user:a' }), null, 'scoped lock removed after release');
    await DomainLock.create({ _id: 'scope:user:b', owner: 'live-process', acquiredAt: new Date() });
    await assert.rejects(run(async () => 'no', 'user:b'), { code: 'DOMAIN_BUSY' });
  });

  await t.test('only one of two simultaneous writers holds the global lock at a time', async () => {
    let inside = 0, overlap = false;
    const work = async () => { inside++; if (inside > 1) overlap = true; await new Promise(r => setTimeout(r, 300)); inside--; };
    await Promise.all([run(work), run(work)]);
    assert.equal(overlap, false);
  });

  await t.test('two simultaneous writers on one person\'s lane never overlap, other lanes run in parallel', async () => {
    let inside = 0, overlap = false;
    const work = async () => { inside++; if (inside > 1) overlap = true; await new Promise(r => setTimeout(r, 300)); inside--; };
    await Promise.all([run(work, 'user:c'), run(work, 'user:c'), run(work, 'user:c')]);
    assert.equal(overlap, false);
    const started = Date.now();
    await Promise.all([run(() => new Promise(r => setTimeout(r, 500)), 'user:d'), run(() => new Promise(r => setTimeout(r, 500)), 'user:e')]);
    assert.ok(Date.now() - started < 950, 'different people do not queue behind each other');
  });

  await t.test('a long write renews its lease while it runs', async () => {
    let first, renewed;
    await run(async () => {
      first = (await DomainLock.findById(GLOBAL_LOCK_ID).lean()).acquiredAt;
      await new Promise(r => setTimeout(r, 16500));
      renewed = (await DomainLock.findById(GLOBAL_LOCK_ID).lean()).acquiredAt;
    });
    assert.ok(renewed > first, `lease renewed (${first.toISOString()} -> ${renewed.toISOString()})`);
    assert.deepEqual(errors, []);
  });
});
