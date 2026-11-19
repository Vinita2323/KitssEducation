import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { AppError } from './AppError.js';
import { invalidateReadCache } from './read-cache.js';

export const GLOBAL_LOCK_ID = 'stage4-hierarchy';
// Every lock is a lease. A holder that dies (a crash, or `node --watch` restarting the server mid-request) stops
// renewing it, and after LEASE_MS another request may take it over, so one dead process can no longer block all
// admin saves until someone clears the lock by hand. A holder still working renews the lease every HEARTBEAT_MS.
// Times come from the database clock ($$NOW), so servers whose clocks differ (a laptop and the live server
// sharing one database) agree on when a lease has run out.
export const LEASE_MS = 60000;
const HEARTBEAT_MS = 15000;
const pipeline = { updatePipeline: true };
const free = { $or: [{ owner: null }, { $expr: { $lt: ['$acquiredAt', { $subtract: ['$$NOW', LEASE_MS] }] } }] };
const claim = owner => [{ $set: { owner, acquiredAt: '$$NOW' } }];

async function acquire(lockModel, lockId, owner, scoped) {
  // Take over a free or expired lock row. ($expr cannot be combined with an upsert, so creation is a second step.)
  const taken = await lockModel.findOneAndUpdate({ _id: lockId, ...free }, claim(owner), { returnDocument: 'after', ...pipeline });
  if (taken || !scoped) return taken;
  // Scoped lock rows exist only while held: create one. If another request created it first, the insert fails.
  try {
    await lockModel.create({ _id: lockId, owner, acquiredAt: new Date() });
    return await lockModel.findOneAndUpdate({ _id: lockId, owner }, claim(owner), { returnDocument: 'after', ...pipeline });
  } catch (error) {
    if (error.code === 11000) return null; // held by another request for the same scope
    throw error;
  }
}

// Serialises writes. Without a scope this is the original single global lock, which protects
// cross-entity invariants (catalogue, institutions, media references, policies). A scope (for example
// 'user:<id>') serialises only one student's own self-service writes, so students no longer queue
// behind each other or behind staff. Scoped work must re-check shared state itself and rely on
// revision checks and unique indexes, as the self-service flows already do.
export async function withDomainLock({ lockModel, logger, scope, busyMessage, releaseFailedMessage }, work) {
  const owner = randomUUID(), deadline = Date.now() + 3000, lockId = scope ? 'scope:' + scope : GLOBAL_LOCK_ID;
  let lock;
  do {
    lock = await acquire(lockModel, lockId, owner, Boolean(scope));
    if (!lock) await delay(30);
  } while (!lock && Date.now() < deadline);
  if (!lock) throw new AppError(503, 'DOMAIN_BUSY', busyMessage);
  const heartbeat = setInterval(() => {
    lockModel.updateOne({ _id: lockId, owner }, [{ $set: { acquiredAt: '$$NOW' } }], pipeline)
      .then(result => { if (!result.matchedCount) logger?.error?.({ event: 'domain_lock_lease_lost' }, 'A long write outlived its lock lease'); })
      .catch(() => logger?.error?.({ event: 'domain_lock_renew_failed' }, 'Lock lease renewal failed; it will be retried'));
  }, HEARTBEAT_MS);
  heartbeat.unref?.();
  try { return await work(); }
  finally {
    clearInterval(heartbeat);
    invalidateReadCache();
    try {
      if (scope) await lockModel.deleteOne({ _id: lockId, owner });
      else await lockModel.updateOne({ _id: lockId, owner }, { $set: { owner: null }, $unset: { acquiredAt: 1 } });
    } catch { logger.error({ event: 'domain_lock_release_failed' }, releaseFailedMessage); }
  }
}

// One lane per person: a student's own actions and staff actions on that student's records queue together,
// while different people's records proceed in parallel.
export const ownerScope = userId => userId ? 'user:' + String(userId) : undefined;
export const userScope = auth => ownerScope(auth?.user?._id);
