import { createHash, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { AppError } from '../../utils/AppError.js';
import { grantsFor } from '../auth/security.js';
import { cleanDTO } from '../publishing/publishing.service.js';
import { id, key as validateKey, invalid, object, revision } from '../publishing/validation.js';
import { inspectVideo } from './video-inspection.js';
import { createScanner, probeFile } from './inspection.js';

export const purposes = Object.freeze({ lesson_video: { mime: ['video/mp4'], max: 256 * 1024 * 1024 }, result_import: { mime: ['application/json'], max: 2 * 1024 * 1024 }, course_thumbnail: { mime: ['image/png', 'image/jpeg', 'image/webp'], max: 5 * 1024 * 1024 }, lesson_document: { mime: ['application/pdf'], max: 50 * 1024 * 1024 }, book_cover: { mime: ['image/png', 'image/jpeg', 'image/webp'], max: 5 * 1024 * 1024 }, banner: { mime: ['image/png', 'image/jpeg', 'image/webp'], max: 5 * 1024 * 1024 }, faculty: { mime: ['image/png', 'image/jpeg', 'image/webp'], max: 5 * 1024 * 1024 }, cms: { mime: ['image/png', 'image/jpeg', 'image/webp'], max: 5 * 1024 * 1024 }, book_preview: { mime: ['application/pdf'], max: 10 * 1024 * 1024 }, book_full: { mime: ['application/pdf'], max: 50 * 1024 * 1024 } });
export function createMediaService({ models, storage, coordination, config, authService, scanner = createScanner(config.media) }) {
  const Media = models.MediaAsset;
  const inspect = (key, mime) => mime === 'video/mp4' ? inspectVideo(storage, key, config.media) : probeFile(storage, key, mime);
  const maxUploadBytes = Math.min(storage.maxBytes, config.media?.videoMaxBytes ?? purposes.lesson_video.max);
  const inspectionFields = i => Object.fromEntries(['width','height','pageCount','durationSeconds','videoCodec','audioCodec','inspectionVersion'].filter(k => i[k] !== undefined).map(k => [k,i[k]]));
  const missing = () => new AppError(404, 'NOT_FOUND', 'Media was not found');
  const find = async value => { const doc = await Media.findById(id(value)).select('+key +cleanupKeys'); if (!doc || ['deleted', 'failed', 'deleting'].includes(doc.status)) throw missing(); return doc; };
  const fieldsByModel = { Book: ['coverAssetId', 'documentAssetId', 'previewAssetIds'], Banner: ['imageAssetId'], FacultyProfile: ['portraitAssetId'], PageContent: ['sections.mediaAssetIds'] };
  const conditions = (fields, value, prefix = '') => fields.map(field => ({ [prefix + field]: prefix ? String(value) : id(String(value)) }));
  async function references(value, onlyPublic = false) {
    const refs = [];
    for (const [name, fields] of Object.entries(fieldsByModel)) {
      const publicFields = fields.filter(f => f !== 'documentAssetId');
      const filter = onlyPublic ? { status: 'published', $or: conditions(publicFields, value, 'publishedSnapshot.') } : { $or: [...conditions(fields, value), ...conditions(fields, value, 'publishedSnapshot.')] };
      for (const doc of await models[name].find(filter).select('_id status publishedSnapshot').lean()) {
        if (onlyPublic && name === 'Banner') { const b = doc.publishedSnapshot, now = Date.now(); if (b?.startsAt && Date.parse(b.startsAt) > now || b?.endsAt && Date.parse(b.endsAt) <= now) continue; }
        refs.push({ kind: name, id: String(doc._id), status: doc.status });
      }
    } if (service.resultReferences) refs.push(...await service.resultReferences(value, onlyPublic)); if (service.learningReferences) refs.push(...await service.learningReferences(value, onlyPublic)); return refs;
  }
  const service = {
    scannerConfigured: scanner.configured,
    maxUploadBytes,
    references,
    async linkable(value, purpose, auth) { const doc = await find(String(value)); if (doc.purpose !== purpose || doc.status !== 'ready' || doc.scan.status !== 'clean' || purpose === 'lesson_video' && (!doc.durationSeconds || doc.inspectionVersion !== 'mp4-h264-aac-v1')) throw invalid('Select a clean, ready asset with the correct purpose'); if (!auth || String(doc.ownerUserId) !== String(auth.user._id) && !grantsFor(auth.user).includes('media.write')) throw new AppError(403, 'FORBIDDEN', 'Media linking is not authorized'); const meta = await storage.getMetadata({key:doc.key}); if(meta.bytes !== doc.bytes || meta.checksum !== doc.checksum) throw new AppError(503,'MEDIA_INTEGRITY_FAILED','Media is temporarily unavailable'); return doc; },
    async upload({ purpose, originalName, mime, stream, idempotencyKey, auth, ctx }) {
      const rule = purposes[purpose]; if (!rule) throw invalid('This media purpose is not enabled');
      validateKey(idempotencyKey);
      if (typeof originalName !== 'string' || !/^[\p{L}\p{N}][\p{L}\p{N} ._()-]{0,149}\.(?:mp4|json|pdf|png|jpe?g|webp)$/iu.test(originalName) || originalName.includes('..') || !rule.mime.includes(mime)) throw new AppError(415, 'INVALID_MEDIA', 'Unsafe filename or unsupported MIME type');
      const extension = originalName.split('.').at(-1).toLowerCase();
      if (!(mime === 'video/mp4' ? ['mp4'] : mime === 'application/json' ? ['json'] : mime === 'application/pdf' ? ['pdf'] : mime === 'image/png' ? ['png'] : mime === 'image/jpeg' ? ['jpg', 'jpeg'] : ['webp']).includes(extension)) throw invalid('Filename extension does not match media type');
      await authService.limit(ctx, String(auth.user._id), 'media-upload', 20);
      let stored, asset, attempt;
      const reservedKey = storage.createKey({ visibility:'quarantine', purpose:purpose.replaceAll('_','-'), extension });
      // Persist an IO intent before writing bytes. Even a lost DB response/crash
      // leaves a known generated key for bounded, idempotent reconciliation.
      attempt = await coordination.run(async () => {
        if (await Media.countDocuments({ownerUserId:auth.user._id,status:{$nin:['deleted','failed']}})>=200) throw new AppError(429,'MEDIA_QUOTA','Unreleased media quota reached');
        const row = await Media.create({key:reservedKey,purpose,visibility:['book_full','lesson_document','lesson_video','result_import'].includes(purpose)?'private':'public',originalName,mime,sourceMime:mime,ownerUserId:auth.user._id,uploadActor:ctx.actorId,idempotencyKey:'attempt-'+randomUUID(),status:'staged',auditOutbox:[coordination.event('media_upload_intent',ctx)]});
        await coordination.flush(Media,row);return row;
      });
      const timer=setTimeout(()=>stream.destroy(new AppError(408,'UPLOAD_TIMEOUT','Upload timed out')),config.media?.videoUploadTimeoutMs ?? 120000);
      try {
        stored = await storage.upload({ stream, key:reservedKey, contentType:mime, maxBytes:Math.min(purpose === 'lesson_video' ? maxUploadBytes : rule.max,storage.maxBytes??rule.max) });
        if(!stored.bytes)throw invalid('Empty files are not permitted');
        const inspection=await inspect(stored.key,mime);
        const requestHash=createHash('sha256').update(JSON.stringify({purpose,originalName,mime,checksum:stored.checksum})).digest('hex');
        asset=await coordination.run(async()=>{
          const prior=await Media.findOne({ownerUserId:auth.user._id,idempotencyKey});
          if(prior){if(prior.requestHash!==requestHash)throw new AppError(409,'IDEMPOTENCY_CONFLICT','Upload key was used for another file');return prior;}
          return coordination.update(Media,attempt,{idempotencyKey,requestHash,bytes:stored.bytes,checksum:stored.checksum,sourceChecksum:stored.checksum,sourceBytes:stored.bytes,status:'quarantined',...inspectionFields(inspection)},attempt.revision,'media_quarantined',ctx);
        });
        if(String(asset._id)!==String(attempt._id))return cleanDTO(asset);
        const result=await scanner.scan((await storage.getFile({key:stored.key})).stream);
        if(result!=='clean')return cleanDTO(await coordination.run(()=>coordination.update(Media,asset,{scan:{status:result,checkedAt:new Date(),engine:scanner.configured?'clamav':'not_configured'}},asset.revision,'media_scan_'+result,ctx)));
        return await service.promote(asset,inspection,ctx);
      } finally {
        clearTimeout(timer);
        if(!asset||String(asset._id)!==String(attempt._id)) {
          try {await coordination.run(async()=>{const current=await Media.findById(attempt._id).select('+key');if(!current||!['staged','deleting'].includes(current.status))return;const deleting=current.status==='deleting'?current:await coordination.update(Media,current,{status:'deleting'},current.revision,'media_attempt_cleanup',ctx);await storage.delete({key:reservedKey});await coordination.update(Media,deleting,{status:'deleted'},deleting.revision,'media_attempt_deleted',ctx);});}
          catch { /* Durable intent remains; maintenance retries without guessing paths. */ }
        }
      }
    },
    async promote(doc, inspection, ctx) {
      const key=doc.key;
      const destination=storage.createKey({visibility:doc.visibility,purpose:doc.purpose.replaceAll('_','-'),extension:inspection.mime==='video/mp4'?'mp4':inspection.mime==='application/json'?'json':inspection.data?'png':'pdf'});
      // Journal the destination before IO. The current source remains quarantined
      // unless the single-record CAS commits the clean destination.
      const prepared=await coordination.run(()=>coordination.update(Media,doc,{cleanupKeys:[...(doc.cleanupKeys??[]),destination],cleanupAfterAt:new Date(Date.now()+900000)},doc.revision,'media_promotion_intent',ctx));
      let safe;
      try {
        const source=inspection.data?Readable.from(Buffer.from(inspection.data,'base64')):(await storage.getFile({key})).stream;
        safe=await storage.upload({stream:source,key:destination,contentType:inspection.mime,maxBytes:Math.min(doc.purpose === 'lesson_video' ? maxUploadBytes : 50*1024*1024,storage.maxBytes)});
        const updated=await coordination.run(()=>coordination.update(Media,prepared,{key:safe.key,cleanupKeys:[key],cleanupAfterAt:new Date(),mime:inspection.mime,bytes:safe.bytes,checksum:safe.checksum,...inspectionFields(inspection),status:'ready',scan:{status:'clean',checkedAt:new Date(),engine:'clamav'}},prepared.revision,'media_ready',ctx));
        try {await storage.delete({key});await Media.updateOne({_id:updated._id,key:destination},{$pull:{cleanupKeys:key}});} catch { /* Ready bytes are valid; durable source cleanup retries. */ }
        return cleanDTO(updated);
      } catch(error) {throw error;}
    },
    async rescan(value, input, ctx) { object(input, ['expectedRevision'], ['expectedRevision']); const doc = await find(value); if (doc.revision !== revision(input.expectedRevision) || doc.status !== 'quarantined') throw new AppError(409, 'REVISION_CONFLICT', 'Only the current quarantine revision can be rescanned'); const scan = await scanner.scan((await storage.getFile({ key: doc.key })).stream); if (scan !== 'clean') return cleanDTO(await coordination.run(() => coordination.update(Media, doc, { scan: { status: scan, checkedAt: new Date(), engine: scanner.configured ? 'clamav' : 'not_configured' } }, doc.revision, 'media_rescan_' + scan, ctx))); const inspection = await inspect(doc.key, doc.sourceMime); return service.promote(doc, inspection, ctx); },
    async metadata(value, auth) { const doc = await find(value); if (!auth || !grantsFor(auth.user).includes('media.read')) throw missing(); return { ...cleanDTO(doc), references: await references(value) }; },
    async publicMetadata(value) { try { const doc = await find(String(value)); if (doc.visibility !== 'public' || doc.status !== 'ready' || doc.scan.status !== 'clean' || !(await references(value, true)).length) return null; return { id: String(doc._id), mime: doc.mime, bytes: doc.bytes, width: doc.width, height: doc.height, pageCount: doc.pageCount }; } catch { return null; } },
    async open(value, auth, rangeHeader) {
      const doc = await find(value);
      const publiclyReadable = doc.visibility === 'public' && doc.status === 'ready' && doc.scan.status === 'clean' && (await references(value, true)).length > 0;
      const entitled = !publiclyReadable && await service.authorizeEntitlement?.(doc, auth);
      if (!publiclyReadable && !entitled && (!auth || !grantsFor(auth.user).includes('media.read') || doc.status !== 'ready' || doc.scan.status !== 'clean')) throw missing();
      const meta = await storage.getMetadata({ key: doc.key }); if (meta.bytes !== doc.bytes || meta.checksum !== doc.checksum) throw new AppError(503, 'MEDIA_INTEGRITY_FAILED', 'Media is temporarily unavailable');
      let range;
      if (rangeHeader) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader); if (!match || !match[1] && !match[2]) throw Object.assign(new AppError(416, 'INVALID_RANGE', 'Range is not satisfiable'), { rangeBytes: doc.bytes });
        let start = match[1] ? Number(match[1]) : Math.max(0, doc.bytes - Number(match[2])), end = match[1] ? match[2] ? Math.min(Number(match[2]), doc.bytes - 1) : doc.bytes - 1 : doc.bytes - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= doc.bytes || !match[1] && Number(match[2]) === 0) throw Object.assign(new AppError(416, 'INVALID_RANGE', 'Range is not satisfiable'), { rangeBytes: doc.bytes }); range = { start, end };
      }
      return { ...(await storage.getFile({ key: doc.key, range })), asset: cleanDTO(doc), totalBytes: doc.bytes, range, publiclyReadable };
    },
    async remove(value, input, ctx) { object(input, ['expectedRevision'], ['expectedRevision']); return coordination.run(async () => { const doc = await find(value); if ((await references(value)).length) throw new AppError(409, 'MEDIA_REFERENCED', 'Detach this media from all draft and published content before deletion'); const deleting = await coordination.update(Media, doc, { status: 'deleting' }, revision(input.expectedRevision), 'media_deleting', ctx); await storage.delete({ key: doc.key }); await coordination.update(Media, deleting, { status: 'deleted' }, deleting.revision, 'media_deleted', ctx); return null; }); },
    async maintenance() {
      for await(const doc of Media.find({$or:[{status:'deleting'},{status:'staged',createdAt:{$lt:new Date(Date.now()-900000)}},{'cleanupKeys.0':{$exists:true},cleanupAfterAt:{$lte:new Date()}}]}).select('+key +cleanupKeys').cursor())await coordination.run(async()=>{
        let current=await Media.findById(doc._id).select('+key +cleanupKeys');
        if(current.status==='staged'&&current.createdAt<new Date(Date.now()-900000))current=await coordination.update(Media,current,{status:'deleting'},current.revision,'media_abandoned_upload',{actorId:'system'});
        for(const oldKey of current.cleanupAfterAt<=new Date()?current.cleanupKeys??[]:[])if(oldKey!==current.key){await storage.delete({key:oldKey});await Media.updateOne({_id:current._id},{$pull:{cleanupKeys:oldKey}});}
        if(current.status!=='deleting'||(await references(current._id)).length)return;
        await storage.delete({key:current.key});await coordination.update(Media,current,{status:'deleted'},current.revision,'media_deleted_retry',{actorId:'system'});
      });
    },
    async list(query = {}) { object(query, ['page', 'pageSize', 'status', 'purpose']); const page = Number(query.page ?? 1), pageSize = Number(query.pageSize ?? 20); if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw invalid('Invalid pagination'); const filter = {}; if (query.status) { if (!['staged', 'quarantined', 'ready', 'deleting', 'deleted', 'failed'].includes(query.status)) throw invalid('Invalid media status'); filter.status = query.status; } if (query.purpose) { if (!purposes[query.purpose]) throw invalid('Invalid purpose'); filter.purpose = query.purpose; } const total = await Media.countDocuments(filter); return { data: (await Media.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize)).map(cleanDTO), meta: { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, scannerConfigured: scanner.configured }; },
  }; return service;
}
