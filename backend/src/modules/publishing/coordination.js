import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { AppError } from '../../utils/AppError.js';

// Shares Stage 4's durable mutex: taxonomy/media reference checks cannot race
// a concurrent publication, archive or deletion on standalone MongoDB.
export function createPublishingCoordination({ lockModel, auditModel, logger, models }) {
  const event = (action, ctx) => ({ id: randomUUID(), action, actorId: ctx.actorId, requestId: ctx.requestId, at: new Date() });
  async function flush(Model, doc) {
    for (const item of doc.auditOutbox ?? []) try {
      const value = item.toObject?.() ?? item;
      await auditModel.updateOne({ _id: item.id }, { $setOnInsert: { action: value.action, actorId: value.actorId, requestId: value.requestId, at: value.at, subjectId: String(doc._id) } }, { upsert: true, writeConcern: { w: 1, j: true } });
      await Model.updateOne({ _id: doc._id }, { $pull: { auditOutbox: { id: item.id } } }, { writeConcern: { w: 1, j: true } });
    } catch { logger.error({ event: 'publishing_audit_pending' }, 'Publishing audit will retry'); break; }
  }
  return {
    event, flush,
    async run(work) {
      const owner = randomUUID(), deadline = Date.now() + 3000;
      let lock;
      do { lock = await lockModel.findOneAndUpdate({ _id: 'stage4-hierarchy', owner: null }, { $set: { owner, acquiredAt: new Date() } }, { returnDocument: 'after' }); if (!lock) await delay(30); } while (!lock && Date.now() < deadline);
      if (!lock) throw new AppError(503, 'DOMAIN_BUSY', 'Content changes are busy; retry later');
      try { return await work(); } finally { try { await lockModel.updateOne({ _id: 'stage4-hierarchy', owner }, { $set: { owner: null }, $unset: { acquiredAt: 1 } }); } catch { logger.error({ event: 'domain_lock_release_failed' }, 'Content writes require operator recovery'); } }
    },
    async update(Model, doc, fields, revision, action, ctx) {
      const query = Model.findOneAndUpdate({ _id: doc._id, revision, 'auditOutbox.999': { $exists: false } }, { $set: { ...fields, updatedBy: ctx.actorId }, $inc: { revision: 1 }, $push: { auditOutbox: event(action, ctx) } }, { returnDocument: 'after', runValidators: true });
      if (Model.modelName === 'MediaAsset') query.select('+key +cleanupKeys');
      const value = await query;
      if (!value) throw new AppError(409, 'REVISION_CONFLICT', 'Record changed or audit backlog is full; refresh before retrying');
      await flush(Model, value); return value;
    },
    async maintenance() { for (const Model of Object.values(models)) for await (const doc of Model.find({ 'auditOutbox.0': { $exists: true } }).cursor()) await flush(Model, doc); },
  };
}
