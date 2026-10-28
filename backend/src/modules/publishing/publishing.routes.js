import express from 'express';
import busboy from 'busboy';
import { pipeline } from 'node:stream/promises';
import { requirePermission, requireSession } from '../auth/auth.routes.js';
import { AppError } from '../../utils/AppError.js';
import { purposes } from '../media/media.service.js';

export function createPublishingRouter({ publishing, media }) {
  const router = express.Router();
  const ctx = req => ({ actorId: req.auth?.user.publicId, requestId: req.requestId, ip: req.ip });
  const reply = (req, res, data, status = 200) => res.status(status).json({ data, requestId: req.requestId });
  const list = (req, res, data) => res.json({ ...data, requestId: req.requestId });
  for (const [kind, path, read, write, publish] of [['books', '/admin/books', 'books.read', 'books.edit', 'books.publish'], ['pages', '/admin/content/pages', 'content.read', 'content.write', 'content.publish'], ['banners', '/admin/content/banners', 'content.read', 'content.write', 'content.publish'], ['faculty', '/admin/content/faculty', 'content.read', 'content.write', 'content.publish']]) {
    router.get(path, requirePermission(read), async (req, res) => list(req, res, await publishing.list(kind, req.query, true)));
    router.get(path + '/:id', requirePermission(read), async (req, res) => reply(req, res, await publishing.detail(kind, req.params.id, true)));
    router.post(path, requirePermission(kind === 'books' ? 'books.create' : write), async (req, res) => reply(req, res, await publishing.create(kind, req.body, req.auth, ctx(req)), 201));
    router.patch(path + '/:id', requirePermission(write), async (req, res) => reply(req, res, await publishing.edit(kind, req.params.id, req.body, req.auth, ctx(req))));
    router.delete(path + '/:id', requirePermission(kind === 'books' ? 'books.archive' : write), async (req, res) => reply(req, res, await publishing.archive(kind, req.params.id, req.body, ctx(req))));
    router.post(path + '/:id/publish', requirePermission(publish), async (req, res) => reply(req, res, await publishing.publish(kind, req.params.id, req.body, req.auth, ctx(req))));
  }
  router.get('/books/facets', async (req, res) => reply(req, res, await publishing.facets(req.query)));
  router.get('/books', async (req, res) => list(req, res, await publishing.list('books', req.query)));
  router.get('/books/:id/preview', async (req, res) => reply(req, res, await publishing.preview(req.params.id)));
  router.get('/books/:id', async (req, res) => reply(req, res, await publishing.detail('books', req.params.id)));
  router.get('/public/content/:key', async (req, res) => reply(req, res, await publishing.publicPage(req.params.key)));
  router.get('/public/banners', async (req, res) => list(req, res, await publishing.list('banners', req.query)));
  router.get('/public/faculty', async (req, res) => list(req, res, await publishing.list('faculty', req.query)));
  router.get('/public/settings', async (req, res) => reply(req, res, await publishing.settings()));
  router.get('/admin/settings', requirePermission('settings.read'), async (req, res) => reply(req, res, await publishing.settings(true)));
  router.patch('/admin/settings/:key', requirePermission('settings.write'), async (req, res) => reply(req, res, await publishing.setSetting(req.params.key, req.body, ctx(req))));
  router.get('/admin/media', requirePermission('media.read'), async (req, res) => list(req, res, await media.list(req.query, req.auth)));
  router.post('/admin/media/:id/scan', requirePermission('media.write'), async (req, res) => { await media.assertDocumentManagement(req.params.id, req.auth); reply(req, res, await media.rescan(req.params.id, req.body, ctx(req))); });
  router.post('/media', requireSession, async (req, res) => {
    if (!req.is('multipart/form-data')) throw new AppError(415, 'MULTIPART_REQUIRED', 'Use multipart file upload');
    let parser; try { parser = busboy({ headers: req.headers, preservePath: true, limits: { files: 1, fields: 2, parts: 4, fieldSize: 160, fileSize: Math.max(50 * 1024 * 1024, media.maxUploadBytes) } }); } catch { throw new AppError(400, 'MALFORMED_UPLOAD', 'Invalid multipart request'); }
    let upload, bad, fileSeen = false;
    const fields = {};
    const done = new Promise((resolve, reject) => {
      const fail = message => { bad ??= new AppError(400, 'MALFORMED_UPLOAD', message); };
      parser.on('field', (name, value, info) => { if (!['purpose', 'idempotencyKey'].includes(name) || Object.hasOwn(fields, name) || info.valueTruncated || fileSeen) fail('Send purpose and idempotencyKey once, before the file'); else fields[name] = value; });
      parser.on('file', (name, file, info) => {
        fileSeen = true;
        file.on('error', error => { if (error instanceof AppError) bad ??= error; req.unpipe(parser); req.resume(); parser.destroy(error); });
        if (name !== 'file' || !purposes[fields.purpose] || !fields.idempotencyKey || bad) { fail('Valid purpose and idempotencyKey must precede one file'); file.resume(); return; }
        const abort = () => file.destroy(new Error('Upload aborted'));
        req.once('aborted', abort);
        file.on('limit', () => { bad ??= new AppError(413, 'FILE_TOO_LARGE', 'File exceeds upload limit'); file.destroy(bad); });
        if (!['registration_document','franchise_document'].includes(fields.purpose) && !req.auth.user.roles.includes('super_admin') && !req.auth.user.permissions.includes('media.write')) { bad ??= new AppError(403, 'FORBIDDEN', 'Media upload permission required'); file.resume(); return; }
        upload = media.upload({ ...fields, originalName: info.filename, mime: info.mimeType, stream: file, auth: req.auth, ctx: ctx(req) }).then(data => { file.resume(); return { data }; }, error => { file.resume(); return { error }; }).finally(() => req.removeListener('aborted', abort));
      });
      parser.on('filesLimit', () => fail('Only one file is allowed')); parser.on('fieldsLimit', () => fail('Too many fields')); parser.on('partsLimit', () => fail('Too many parts'));
      parser.on('error', () => reject(new AppError(400, 'MALFORMED_UPLOAD', 'Invalid or interrupted multipart request')));
      req.on('aborted', () => { parser.destroy(); reject(new AppError(400, 'UPLOAD_ABORTED', 'Upload interrupted')); });
      parser.on('close', resolve);
    });
    req.pipe(parser); let parseError; try { await done; } catch (error) { parseError = error; }
    const result = await upload;
    if ((bad || parseError) && result?.data) await media.remove(result.data.id, { expectedRevision: result.data.revision }, ctx(req));
    if (bad) throw bad; if (result?.error) throw result.error; if (parseError) throw parseError; if (!result) throw new AppError(400, 'FILE_REQUIRED', 'Upload one file');
    reply(req, res, result.data, 201);
  });
  router.get('/media/:id/metadata', async (req, res) => reply(req, res, await media.metadata(req.params.id, req.auth)));
  router.delete('/media/:id', requirePermission('media.write'), async (req, res) => { await media.assertDocumentManagement(req.params.id, req.auth); await media.remove(req.params.id, req.body, ctx(req)); res.status(204).end(); });
  router.get('/media/:id/content', async (req, res) => {
    const result = await media.open(req.params.id, req.auth, req.get('Range'));
    res.status(result.range ? 206 : 200);
    res.set({ 'Content-Type': result.asset.mime, 'Content-Length': String(result.range ? result.range.end - result.range.start + 1 : result.totalBytes), 'Accept-Ranges': 'bytes', 'Content-Disposition': `inline; filename="media-${result.asset.id}.${result.asset.mime === 'video/mp4' ? 'mp4' : result.asset.mime === 'application/pdf' ? 'pdf' : 'png'}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'" });
    if (result.range) res.set('Content-Range', `bytes ${result.range.start}-${result.range.end}/${result.totalBytes}`);
    try { await pipeline(result.stream, res); } catch { result.stream.destroy(); if (!res.destroyed) res.destroy(); }
  });
  return router;
}
