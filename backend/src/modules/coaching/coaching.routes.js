import express from 'express';
import { requireSession, requirePermission } from '../auth/auth.routes.js';
import { object, key } from '../publishing/validation.js';
import { AppError } from '../../utils/AppError.js';
export function createCoachingRouter(service) {
  const router = express.Router(),
    ctx = req => ({
      actorId: req.auth?.user.publicId,
      requestId: req.requestId,
      ip: req.ip
    });
  const send = (req, res, data, status = 200) => res.status(status).json({
    data,
    requestId: req.requestId
  });
  const page = (req, res, value) => res.json({
    ...value,
    meta: {
      ...value.meta,
      totalPages: Math.max(1, Math.ceil(value.meta.total / value.meta.pageSize))
    },
    requestId: req.requestId
  });
  router.use(async (req, res, next) => {
    if (req.auth && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) await service.limit(ctx(req), req.auth);
    next();
  });
  router.get('/coaching/facets', async (req, res) => send(req, res, await service.facets()));
  router.get('/coaching/courses', async (req, res) => page(req, res, await service.catalogue(req.query)));
  router.get('/coaching/courses/:id', async (req, res) => send(req, res, await service.publicDTO(await service.courseFor(req.params.id, req.auth))));
  router.get('/coaching/courses/:id/plans', async (req, res) => send(req, res, await service.plans(req.params.id)));
  router.get('/coaching/courses/:id/syllabus', async (req, res) => send(req, res, await service.syllabus(req.params.id, req.auth)));
  router.get('/coaching/courses/:id/lessons/:lessonId', async (req, res) => send(req, res, await service.lesson(req.params.id, req.params.lessonId, req.auth)));
  router.post('/coaching/courses/:id/enroll', requireSession, async (req, res) => {
    object(req.body, ['idempotencyKey'], ['idempotencyKey']); key(req.body.idempotencyKey);
    send(req, res, await service.enrollFree(req.params.id, req.auth, ctx(req)));
  });
  router.get('/me/enrollments', requireSession, async (req, res) => page(req, res, await service.enrollments(req.query, req.auth)));
  router.get('/me/enrollments/:courseId', requireSession, async (req, res) => {
    const row = await service.enrollment(req.params.courseId, req.auth, false);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Enrollment was not found');
    send(req, res, {
      ...row,
      syllabus: await service.syllabus(req.params.courseId, req.auth)
    });
  });
  router.put('/me/lessons/:lessonId/progress', requireSession, async (req, res) => send(req, res, await service.progressLesson(req.params.lessonId, req.body, req.auth)));
  router.get('/coaching/courses/:id/books/:bookId', requireSession, async (req, res) => send(req, res, await service.linkedBook(req.params.id, req.params.bookId, req.auth)));
  router.get('/me/books/:id/state', requireSession, async (req, res) => send(req, res, await service.bookState(req.params.id, req.auth, req.query.courseId)));
  router.get('/me/wishlist', requireSession, async (req, res) => send(req, res, (await service.models.LearningProgress.find({
    userId: req.auth.user._id,
    resourceType: 'book',
    wishlisted: true
  }).select('bookId')).map(r => String(r.bookId))));
  router.put('/me/books/:id/wishlist', requireSession, async (req, res) => {
    object(req.body, []);
    send(req, res, await service.wishlist(req.params.id, true, req.auth));
  });
  router.delete('/me/books/:id/wishlist', requireSession, async (req, res) => {
    object(req.body, []);
    send(req, res, await service.wishlist(req.params.id, false, req.auth));
  });
  router.put('/me/books/:id/progress', requireSession, async (req, res) => send(req, res, await service.bookProgress(req.params.id, req.body, req.auth, 'progress')));
  router.put('/me/books/:id/bookmarks/:page', requireSession, async (req, res) => send(req, res, await service.bookProgress(req.params.id, req.body, req.auth, 'add', req.params.page)));
  router.delete('/me/books/:id/bookmarks/:page', requireSession, async (req, res) => send(req, res, await service.bookProgress(req.params.id, req.body, req.auth, 'remove', req.params.page)));
  for (const kind of ['courses', 'lessons', 'plans']) {
    const base = kind === 'courses' ? '/admin/coaching/courses' : '/admin/coaching/courses/:courseId/' + kind;
    const read = kind === 'plans' ? 'commerce.read' : 'coaching.read',
      write = kind === 'plans' ? 'commerce.plans.write' : 'coaching.edit';
    router.get(base, requirePermission(read), async (req, res) => page(req, res, await service.adminList(kind, req.params.courseId, req.query)));
    router.get(base + '/:id', requirePermission(read), async (req, res) => send(req, res, await service.adminGet(kind, req.params.id, req.params.courseId)));
    router.post(base, requirePermission(kind === 'plans' ? write : 'coaching.create'), async (req, res) => send(req, res, await service.mutate(kind, null, req.params.courseId, req.body, req.auth, ctx(req)), 201));
    router.patch(base + '/:id', requirePermission(write), async (req, res) => send(req, res, await service.mutate(kind, req.params.id, req.params.courseId, req.body, req.auth, ctx(req))));
    router.delete(base + '/:id', requirePermission(kind === 'plans' ? write : 'coaching.archive'), async (req, res) => send(req, res, await service.mutate(kind, req.params.id, req.params.courseId, req.body, req.auth, ctx(req), true)));
    router.post(base + '/:id/restore', requirePermission(kind === 'plans' ? write : 'coaching.archive'), async (req, res) => send(req, res, await service.restore(kind, req.params.id, req.params.courseId, req.body, ctx(req))));
  }
  router.post('/admin/coaching/courses/:id/publish', requirePermission('coaching.publish'), async (req, res) => send(req, res, await service.publish(req.params.id, req.body, req.auth, ctx(req))));
  router.get('/admin/enrollments', requirePermission('learning.read'), async (req, res) => {
    if (req.query.kind === 'book') { const { kind, ...query } = req.query; return page(req, res, await service.bookEntitlements(query)); }
    return page(req, res, await service.enrollments(req.query, req.auth, true));
  });
  router.post('/admin/entitlements', requirePermission('learning.grants.manage'), async () => {
    throw new AppError(409, 'MANUAL_GRANT_POLICY_PENDING', 'Manual grants are not approved and cannot change payment truth');
  });
  router.post('/admin/entitlements/:id/revoke', requirePermission('access.revoke'), async (req, res) => send(req, res, await service.revoke(req.params.id, req.body, ctx(req))));
  return router;
}
