import express from 'express';
import { requirePermission, requireSession } from '../auth/auth.routes.js';

// Mounted after the existing auth router so every mutation already has verified
// Origin/CSRF and every authenticated actor comes from the persistent session.
export function createInstitutionRouter(service) {
  const router = express.Router();
  const ctx = req => ({ actorId: req.auth?.user.publicId, requestId: req.requestId, ip: req.ip });
  const send = (req, res, data, status = 200) => res.status(status).json({ data, requestId: req.requestId });
  const list = (req, res, result) => res.json({ ...result, requestId: req.requestId });
  for (const [kind, path, read, write] of [
    ['university', '/admin/universities', 'institutions.read', 'institutions.write'],
    ['college', '/admin/colleges', 'institutions.read', 'institutions.write'],
    ['program', '/admin/colleges/:collegeId/programs', 'institutions.read', 'institutions.write'],
    ['taxonomy', '/admin/taxonomies', 'content.read', 'content.write'],
  ]) {
    router.get(path, requirePermission(read), async (req, res) => list(req, res, await service.list(kind, req.query, true, req.params.collegeId)));
    router.get(`${path}/:id`, requirePermission(read), async (req, res) => send(req, res, await service.detail(kind, req.params.id, true, req.params.collegeId)));
    router.post(path, requirePermission(write), async (req, res) => send(req, res, await service.create(kind, req.body, ctx(req), req.params.collegeId), 201));
    router.patch(`${path}/:id`, requirePermission(write), async (req, res) => send(req, res, await service.edit(kind, req.params.id, req.body, ctx(req), req.params.collegeId)));
    router.delete(`${path}/:id`, requirePermission(write), async (req, res) => send(req, res, await service.edit(kind, req.params.id, req.body, ctx(req), req.params.collegeId, true)));
  }
  router.get('/taxonomies', async (req, res) => list(req, res, await service.list('taxonomy', req.query)));
  router.get('/universities', async (req, res) => list(req, res, await service.list('university', req.query)));
  router.get('/universities/:id/colleges', async (req, res) => {
    await service.detail('university', req.params.id);
    list(req, res, await service.list('college', { ...req.query, universityId: req.params.id }));
  });
  router.get('/institutions/facets', async (req, res) => send(req, res, await service.facets(req.query)));
  router.get('/colleges', async (req, res) => list(req, res, await service.list('college', req.query)));
  router.get('/colleges/:id', async (req, res) => send(req, res, await service.detail('college', req.params.id)));
  router.get('/colleges/:id/programs', async (req, res) => list(req, res, await service.list('program', req.query, false, req.params.id)));
  router.post('/admission-applications', requireSession, async (req, res) => send(req, res, await service.submitAdmission(req.body, req.auth, ctx(req)), 201));
  router.post('/franchise-applications', async (req, res) => send(req, res, await service.createDraft(req.body, req.auth, ctx(req)), 201));
  router.patch('/franchise-applications/:id', async (req, res) => send(req, res, await service.editDraft(req.params.id, req.body, req.auth, req.get('X-Draft-Capability'), ctx(req))));
  router.post('/franchise-applications/:id/submit', async (req, res) => send(req, res, await service.submitFranchise(req.params.id, req.body, req.auth, req.get('X-Draft-Capability'), ctx(req))));
  router.get('/franchise-applications/:id/status', async (req, res) => send(req, res, await service.draftStatus(req.params.id, req.auth, req.get('X-Draft-Capability'))));
  for (const [kind, path, read, review] of [
    ['admission', '/admin/admission-applications', 'admissions.read', 'admissions.review'],
    ['franchise', '/admin/franchise-applications', 'franchises.read', 'franchises.review'],
  ]) {
    router.get(path, requirePermission(read), async (req, res) => list(req, res, await service.reviews(kind, req.query)));
    router.get(`${path}/:id`, requirePermission(read), async (req, res) => send(req, res, await service.reviewDetail(kind, req.params.id)));
    router.patch(`${path}/:id/status`, requirePermission(review), async (req, res) => send(req, res, await service.review(kind, req.params.id, req.body, ctx(req))));
    router.post(`${path}/:id/notes`, requirePermission(review), async (req, res) => send(req, res, await service.review(kind, req.params.id, req.body, ctx(req), true)));
  }
  return router;
}
