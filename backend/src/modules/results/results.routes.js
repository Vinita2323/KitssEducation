import express from 'express';
import { requireSession, requirePermission } from '../auth/auth.routes.js';
export function createResultRouter(service) {
  const router = express.Router();
  const ctx = req => ({
    actorId: req.auth?.user.publicId,
    requestId: req.requestId,
    ip: req.ip
  });
  const send = (req, res, data, status = 200) => res.status(status).json({
    data,
    requestId: req.requestId
  });
  router.get('/admin/results/organizations', requirePermission('results.read'), async (req,res) => res.json({ ...await service.organizations(req.query), requestId:req.requestId }));
  router.get('/results/config', async (req, res) => send(req, res, await service.config()));
  router.get('/results/issuers/:id', async (req, res) => send(req, res, await service.issuer(req.params.id)));
  router.post('/results/lookup', requireSession, async (req, res) => send(req, res, await service.lookup(req.body, req.auth, ctx(req))));
  router.get('/me/results', requireSession, async (req, res) => res.json({
    ...(await service.history(req.query, req.auth)),
    requestId: req.requestId
  }));
  for (const [kind, path] of [['issuers', '/admin/result-issuers'], ['exams', '/admin/exams']]) {
    router.get(path, requirePermission('results.read'), async (req, res) => res.json({
      ...(await service.list(kind, req.query)),
      requestId: req.requestId
    }));
    router.get(path + '/:id', requirePermission('results.read'), async (req, res) => send(req, res, await service.detail(kind, req.params.id)));
    const publishGuard = (req, res, next) => req.body?.status === 'published' ? requirePermission('results.publish')(req, res, next) : next();
    router.post(path, requirePermission('results.manage'), publishGuard, async (req, res) => send(req, res, await service.mutate(kind, null, req.body, ctx(req)), 201));
    router.patch(path + '/:id', requirePermission('results.manage'), publishGuard, async (req, res) => send(req, res, await service.mutate(kind, req.params.id, req.body, ctx(req))));
    router.delete(path + '/:id', requirePermission('results.manage'), async (req, res) => send(req, res, await service.mutate(kind, req.params.id, req.body, ctx(req), true)));
  }
  router.get('/admin/results/records', requirePermission('results.read'), async (req, res) => res.json({
    ...(await service.list('records', req.query)),
    requestId: req.requestId
  }));
  router.get('/admin/results/records/:id', requirePermission('results.read'), async (req, res) => send(req, res, await service.detail('records', req.params.id)));
  router.post('/admin/results/imports', requirePermission('results.manage'), async (req, res) => send(req, res, await service.importRecords(req.body, req.auth, ctx(req))));
  for (const action of ['submit', 'approve', 'reject', 'publish', 'corrections', 'withdraw']) router.post('/admin/results/records/:id/' + action, requirePermission(['submit', 'approve', 'reject', 'corrections'].includes(action) ? 'results.manage' : 'results.publish'), async (req, res) => send(req, res, await service.changeRecord(req.params.id, action, req.body, ctx(req))));
  return router;
}
