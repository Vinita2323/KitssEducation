import { escapeRegex } from '../../utils/escapeRegex.js';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { contentInput, settingInput, id, invalid, object, revision, text } from './validation.js';
export const modelNames = { books: 'Book', pages: 'PageContent', banners: 'Banner', faculty: 'FacultyProfile' };
export function cleanDTO(doc) { if (!doc) return null; const { _id, __v, auditOutbox, key: storageKey, requestHash, idempotencyKey, ownerUserId, sourceChecksum, cleanupKeys, cleanupAfterAt, ...data } = doc.toObject?.() ?? doc; if ('provider' in data) delete data.publishedSnapshot; return JSON.parse(JSON.stringify({ id: String(_id), ...data, ...(!('provider' in data) && storageKey !== undefined ? { key: storageKey } : {}) })); }
const snapshotOf = doc => { const { publishedSnapshot, auditOutbox, _id, __v, ...data } = doc.toObject?.() ?? doc; return JSON.parse(JSON.stringify(data)); };
const escaped = value => new RegExp(escapeRegex(value), 'i');
export function createPublishingService({ models, taxonomy, coordination, media }) {
  const Model = kind => models[modelNames[kind]];
  const notFound = () => new AppError(404, 'NOT_FOUND', 'The requested content was not found');
  const find = async (kind, value) => { const doc = await Model(kind).findById(id(value)); if (!doc || (kind === 'banners' && doc.deletedAt)) throw notFound(); return doc; };
  async function validate(kind, data, publishing, auth) {
    if (kind === 'books') {
      for (const [field, taxKind] of [['boardId', 'board'], ['classId', 'class'], ['subjectId', 'subject'], ['languageId', 'language']]) if (data[field] && !await taxonomy.exists({ _id: data[field], kind: taxKind, status: 'active', deletedAt: null })) throw invalid('Select an active ' + taxKind);
      for (const [child, parent] of [['classId', 'boardId'], ['subjectId', 'classId']]) if (data[child] && data[parent] && !await taxonomy.exists({ _id: data[child], parentIds: data[parent] })) throw invalid('Invalid educational hierarchy');
      if (data.priceMinor !== undefined && data.originalPriceMinor !== undefined && data.originalPriceMinor < data.priceMinor) throw invalid('Original price cannot be less than price');
      if (data.coverAssetId) await media.linkable(data.coverAssetId, 'book_cover', auth);
      let document;
      if (data.documentAssetId) document = await media.linkable(data.documentAssetId, 'book_full', auth);
      for (const assetId of data.previewAssetIds ?? []) {
        const sample = await media.linkable(assetId, 'book_preview', auth);
        if (document && (sample.checksum === document.checksum || sample.pageCount >= document.pageCount)) throw invalid('Preview must be a separate bounded subset of the full document');
      }
      if (document) data.pageCount = document.pageCount;
      if ((data.toc ?? []).some(row => !data.pageCount || row.page > data.pageCount)) throw invalid('TOC page exceeds the document');
      if (publishing && (!data.author || !data.languageId || !data.category || !data.description || !document || !data.coverAssetId || !data.rightsConfirmed || !data.rightsNote || !data.pricingApproved || data.priceMinor === undefined)) throw invalid('Publication requires author, category, language, description, clean cover/full PDF, rights evidence and explicitly approved pricing');
    } else {
      const assetPurpose = { banners: 'banner', faculty: 'faculty' }[kind];
      if (assetPurpose && data.imageAssetId) await media.linkable(data.imageAssetId, assetPurpose, auth);
      if (data.portraitAssetId) await media.linkable(data.portraitAssetId, 'faculty', auth);
      for (const section of data.sections ?? []) for (const assetId of section.mediaAssetIds ?? []) await media.linkable(assetId, 'cms', auth);
      if (data.startsAt && data.endsAt && new Date(data.endsAt) <= new Date(data.startsAt)) throw invalid('End must be after start');
      if (publishing && kind === 'pages' && !data.sections?.length) throw invalid('Add at least one approved section');
      if (publishing && kind === 'faculty' && (!data.sourceNote || !data.name || !data.role || !data.portraitAssetId)) throw invalid('Faculty publication requires name, role, portrait and approved source evidence');
      if (publishing && kind === 'banners' && (!data.title || !data.imageAssetId || !data.link)) throw invalid('Banner publication requires title, clean image and safe link');
    }
  }
  function publicData(kind, doc) {
    const data = doc.publishedSnapshot; if (!data) return null;
    const { documentAssetId, rightsConfirmed, rightsNote, pricingApproved, createdBy, updatedBy, sourceNote, revision: snapshotRevision, status, ...safe } = data;
    return { ...safe, id: String(doc._id), status: 'published', ...(kind === 'books' ? { canReadFull: false, accessStatus: 'entitlements_pending' } : {}), ...(safe.coverAssetId ? { coverUrl: '/api/v1/media/' + safe.coverAssetId + '/content' } : {}), ...(safe.imageAssetId ? { imageUrl: '/api/v1/media/' + safe.imageAssetId + '/content' } : {}), ...(safe.portraitAssetId ? { portraitUrl: '/api/v1/media/' + safe.portraitAssetId + '/content' } : {}) };
  }
  const service = {
    models,
    async create(kind, input, auth, ctx) { const { fields } = contentInput(kind, input, true); return coordination.run(async () => { await validate(kind, fields, false, auth); const doc = await Model(kind).create({ ...fields, ...(kind === 'books' ? { publicId: 'BOOK-' + randomUUID() } : {}), createdBy: ctx.actorId, updatedBy: ctx.actorId, auditOutbox: [coordination.event(kind + '_created', ctx)] }); await coordination.flush(Model(kind), doc); return cleanDTO(doc); }); },
    async edit(kind, value, input, auth, ctx) { const { fields, expectedRevision } = contentInput(kind, input); return coordination.run(async () => { const doc = await find(kind, value); if (doc.status === 'archived') throw invalid('Archived content cannot be edited'); if (kind === 'pages' && fields.key && fields.key !== doc.key) throw invalid('Page key is immutable'); const merged = { ...doc.toObject(), ...fields }; await validate(kind, merged, false, auth); return cleanDTO(await coordination.update(Model(kind), doc, { ...fields, ...(merged.pageCount ? { pageCount: merged.pageCount } : {}) }, expectedRevision, kind + '_edited', ctx)); }); },
    async publish(kind, value, input, auth, ctx) { object(input, ['expectedRevision', 'publish'], ['expectedRevision', 'publish']); revision(input.expectedRevision); if (typeof input.publish !== 'boolean') throw invalid('Choose publication state'); return coordination.run(async () => { const doc = await find(kind, value); if (doc.status === 'archived') throw invalid('Archived content cannot be published'); const data = doc.toObject(); if (input.publish) await validate(kind, data, true, auth); return cleanDTO(await coordination.update(Model(kind), doc, { status: input.publish ? 'published' : 'draft', publishedSnapshot: input.publish ? snapshotOf(data) : null, publishedAt: input.publish ? new Date() : null, ...(data.pageCount ? { pageCount: data.pageCount } : {}) }, input.expectedRevision, kind + (input.publish ? '_published' : '_unpublished'), ctx)); }); },
    async archive(kind, value, input, ctx) {
      object(input, kind === 'banners' ? ['expectedRevision', 'remove'] : ['expectedRevision'], ['expectedRevision']);
      if (input.remove !== undefined && typeof input.remove !== 'boolean') throw invalid('Choose a valid removal action');
      const remove = kind === 'banners' && input.remove === true;
      return coordination.run(async () => {
        const doc = await find(kind, value);
        return cleanDTO(await coordination.update(Model(kind), doc, { status: 'archived', publishedSnapshot: null, ...(remove ? { deletedAt: new Date() } : {}) }, revision(input.expectedRevision), kind + (remove ? '_deleted' : '_archived'), ctx));
      });
    },
    async detail(kind, value, admin = false) { const doc = await find(kind, value); if (!admin && (doc.status !== 'published' || !doc.publishedSnapshot)) throw notFound(); const data = admin ? cleanDTO(doc) : publicData(kind, doc); if (kind === 'books') for (const [field, label] of [['boardId','board'],['classId','class'],['subjectId','subject'],['languageId','language']]) if (data[field]) data[label] = (await taxonomy.findById(data[field]).select('label').lean())?.label ?? ''; return data; },
    async list(kind, query = {}, admin = false) {
      object(query, ['page', 'pageSize', 'q', 'status', 'sort', 'boardId', 'classId', 'subjectId', 'languageId', 'board', 'class', 'subject', 'language', 'category', 'type', 'minPriceMinor', 'maxPriceMinor', 'placement']);
      for (const v of Object.values(query)) if (typeof v !== 'string' || v.length > 160) throw invalid('Invalid query');
      const positive = (v, fallback, max) => { if (v !== undefined && !/^\d+$/.test(v)) throw invalid('Invalid pagination'); const n = Number(v ?? fallback); if (n < 1 || n > max) throw invalid('Invalid pagination'); return n; };
      const page = positive(query.page, 1, 100000), pageSize = positive(query.pageSize, 20, 100), filter = admin ? {} : { status: 'published', publishedSnapshot: { $ne: null } }, prefix = admin ? '' : 'publishedSnapshot.';
      if (kind === 'banners') filter.deletedAt = null;
      if (query.status) { if (!admin || !['draft', 'published', 'archived'].includes(query.status)) throw invalid('Invalid publication status'); filter.status = query.status; }
      if (query.q) filter.$or = (kind === 'books' ? ['title', 'subtitle', 'author', 'keywords', 'toc.title'] : kind === 'faculty' ? ['name', 'role'] : ['title', 'key', 'sections.heading']).map(k => ({ [prefix + k]: escaped(query.q) }));
      if (kind === 'books' && query.q) { const matches = await taxonomy.find({ label: escaped(query.q), status: 'active', deletedAt: null }).select('_id').lean(); const ids = matches.map(t => admin ? t._id : String(t._id)); filter.$or.push(...['boardId','classId','subjectId','languageId'].map(field => ({ [prefix + field]: { $in: ids } }))); }
      for (const field of ['boardId', 'classId', 'subjectId', 'languageId']) if (query[field]) filter[prefix + field] = admin ? id(query[field]) : String(id(query[field]));
      for (const [field, taxKind] of [['board', 'board'], ['class', 'class'], ['subject', 'subject'], ['language', 'language']]) if (query[field]) { const row = await taxonomy.findOne({ kind: taxKind, label: query[field], status: 'active', deletedAt: null }); filter[prefix + { board: 'boardId', class: 'classId', subject: 'subjectId', language: 'languageId' }[field]] = row ? admin ? row._id : String(row._id) : null; }
      if (query.category) filter[prefix + 'category'] = query.category;
      if (query.placement) filter[prefix + 'placement'] = query.placement;
      if (query.type && !['all', 'free', 'paid'].includes(query.type)) throw invalid('Invalid book type');
      if (query.type === 'free') filter[prefix + 'priceMinor'] = 0;
      if (query.type === 'paid') filter[prefix + 'priceMinor'] = { $gt: 0 };
      const min = query.minPriceMinor, max = query.maxPriceMinor;
      if (min !== undefined || max !== undefined) { if ([min, max].some(v => v !== undefined && (!/^\d+$/.test(v) || Number(v) > 1e9)) || min !== undefined && max !== undefined && Number(min) > Number(max)) throw invalid('Invalid price range'); const price = { ...(typeof filter[prefix + 'priceMinor'] === 'object' ? filter[prefix + 'priceMinor'] : {}), ...(min !== undefined ? { $gte: Number(min) } : {}), ...(max !== undefined ? { $lte: Number(max) } : {}) }; if (query.type === 'free') { price.$eq = 0; } filter[prefix + 'priceMinor'] = price; }
      if (kind === 'banners' && !admin) { const now = new Date().toISOString(); filter.$and = [{ $or: [{ [prefix + 'startsAt']: { $exists: false } }, { [prefix + 'startsAt']: null }, { [prefix + 'startsAt']: { $lte: now } }] }, { $or: [{ [prefix + 'endsAt']: { $exists: false } }, { [prefix + 'endsAt']: null }, { [prefix + 'endsAt']: { $gt: now } }] }]; }
      const sorts = { featured: { [prefix + 'title']: 1 }, newest: { publishedAt: -1 }, price_asc: { [prefix + 'priceMinor']: 1 }, price_desc: { [prefix + 'priceMinor']: -1 }, name: { [prefix + 'title']: 1 } };
      if (query.sort && !Object.hasOwn(sorts, query.sort)) throw invalid('Unsupported sort; ratings require an approved source');
      const total = await Model(kind).countDocuments(filter), rows = await Model(kind).find(filter).sort({ ...(kind === 'banners' || kind === 'faculty' ? { [prefix + 'sortOrder']: 1 } : sorts[query.sort ?? 'featured']), _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean();
      let data = rows.map(row => admin ? cleanDTO(row) : publicData(kind, row));
      if (kind === 'books') data = await Promise.all(data.map(async book => { for (const [field, label] of [['boardId', 'board'], ['classId', 'class'], ['subjectId', 'subject'], ['languageId', 'language']]) if (book[field]) book[label] = (await taxonomy.findById(book[field]).select('label').lean())?.label ?? ''; return book; }));
      return { data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
    },
    async facets(query = {}) { object(query, ['boardId', 'classId', 'languageId', 'board', 'class', 'language']); const rows = await models.Book.find({ status: 'published', publishedSnapshot: { $ne: null } }).lean(); let books = rows.map(r => r.publishedSnapshot); for (const field of ['boardId', 'classId', 'languageId']) if (query[field]) books = books.filter(b => b[field] === String(id(query[field]))); for (const [f, kind] of [['board', 'board'], ['class', 'class'], ['language', 'language']]) if (query[f]) { const t = await taxonomy.findOne({ kind, label: text(query[f]), status: 'active', deletedAt: null }); books = books.filter(b => b[f + 'Id'] === String(t?._id)); } const result = {}; for (const [field, name] of [['boardId', 'boards'], ['classId', 'classes'], ['subjectId', 'subjects'], ['languageId', 'languages']]) result[name] = (await taxonomy.find({ _id: { $in: books.map(b => b[field]).filter(Boolean) }, status: 'active', deletedAt: null }).sort({ sortOrder: 1, label: 1 }).lean()).map(r => ({ id: String(r._id), name: r.label, label: r.label })); result.categories = [...new Set(books.map(b => b.category))]; return result; },
    async preview(value) { const book = await service.detail('books', value); const assets = []; for (const assetId of book.previewAssetIds ?? []) { const asset = await media.publicMetadata(assetId); if (asset) assets.push({ ...asset, url: '/api/v1/media/' + assetId + '/content' }); } return { assets }; },
    async publicPage(key) { const doc = await models.PageContent.findOne({ key, status: 'published', publishedSnapshot: { $ne: null } }); const page = doc ? publicData('pages', doc) : { key, sections: [] }; if (key === 'about') page.faculty = (await service.list('faculty', { pageSize: '100' })).data; return page; },
    async settings(admin = false) { const rows = await models.SiteSettings.find(admin ? {} : { key: { $nin: ['registrationFees', 'businessPolicies'] } }).lean(); return Object.fromEntries(rows.map(r => [r.key, admin ? cleanDTO(r) : r.value])); },
    async setSetting(keyName, input, ctx) { const { value, expectedRevision } = settingInput(keyName, input); return coordination.run(async () => { let doc = await models.SiteSettings.findOne({ key: keyName }); if (!doc) { if (expectedRevision !== 0) throw new AppError(409, 'REVISION_CONFLICT', 'New settings require revision zero'); doc = await models.SiteSettings.create({ key: keyName, value, createdBy: ctx.actorId, updatedBy: ctx.actorId, auditOutbox: [coordination.event('settings_created', ctx)] }); await coordination.flush(models.SiteSettings, doc); return cleanDTO(doc); } return cleanDTO(await coordination.update(models.SiteSettings, doc, { value }, expectedRevision, 'settings_updated', ctx)); }); },
    publicData,
  }; return service;
}
