import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { AppError } from './AppError.js';
import { invalidateReadCache } from './read-cache.js';

export const GLOBAL_LOCK_ID = 'stage4-hierarchy';
// A scoped lock left behind by a crashed request is reclaimed after this lease; the global lock never
// expires (it stays fail-closed for operator recovery, as before).
const SCOPED_LEASE_MS = 60000;

async function acquireScoped(lockModel, lockId, owner) {
  try {
    return await lockModel.findOneAndUpdate(
      { _id: lockId, $or: [{ owner: null }, { acquiredAt: { $lt: new Date(Date.now() - SCOPED_LEASE_MS) } }] },
      { $set: { owner, acquiredAt: new Date() } },
      { upsert: true, returnDocument: 'after' });
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
    lock = scope
      ? await acquireScoped(lockModel, lockId, owner)
      : await lockModel.findOneAndUpdate({ _id: lockId, owner: null }, { $set: { owner, acquiredAt: new Date() } }, { returnDocument: 'after' });
    if (!lock) await delay(30);
  } while (!lock && Date.now() < deadline);
  if (!lock) throw new AppError(503, 'DOMAIN_BUSY', busyMessage);
  try { return await work(); }
  finally {
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
