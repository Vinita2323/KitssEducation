import express from 'express';
import { createOperationalDiagnostics } from './modules/operations/diagnostics.js';
import { createOperationsService, createOperationsRouter } from './modules/operations/operations.js';
import { createResultRouter } from './modules/results/results.routes.js';
import { createNotificationRouter } from './modules/notifications/notifications.js';
import { requireSession, sessionCookie } from './modules/auth/auth.routes.js';
import { createCoachingRouter } from './modules/coaching/coaching.routes.js';
import { createCommerceRouter, createCommerceWebhookRouter } from './modules/commerce/commerce.routes.js';
import helmet from 'helmet';
import { requestId } from './middleware/requestId.js';
import { exactOriginCors } from './middleware/cors.js';
import { httpLog } from './middleware/httpLog.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createInstitutionRouter } from './modules/institutions/institutions.routes.js';
import { createPublishingRouter } from './modules/publishing/publishing.routes.js';

export function createApp({ config, logger, database, storage, authService, institutionService, publishingModule, commerceService, coachingService, resultService, notificationService, accountService, operationalDiagnostics, lifecycle = { draining: false } }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxyHops === 0 ? false : config.trustProxyHops);
  app.set('query parser', 'simple');
  app.use(requestId);
  app.use(httpLog(logger));
  app.use(helmet());
  app.use(exactOriginCors(config.corsOrigins));
  app.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  if (commerceService) app.use(createCommerceWebhookRouter(commerceService));
  // Signed provider callbacks are deliberately outside browser Origin/CSRF middleware.
  app.use(express.json({ limit: config.jsonBodyLimitBytes, strict: true, inflate: false }));
  // Auth router validates persistent sessions and Origin/CSRF before mutations.
  // Future business routers must explicitly use the shared permission/owner guards.
  const api = express.Router();
  api.use('/health', createHealthRouter({ database, storage, lifecycle, timeoutMs: config.readinessTimeoutMs }));
  if (authService) api.use(createAuthRouter({ service: authService, config }));
  if (authService && institutionService) api.use(createInstitutionRouter(institutionService));
  if (authService && publishingModule) api.use(createPublishingRouter(publishingModule));
  const operations = authService?.models?.User ? createOperationsService(authService, { diagnostics: operationalDiagnostics ?? createOperationalDiagnostics({config,database,storage}) }) : null;
  if (operations) api.use(createOperationsRouter(operations, authService));
  if (authService && commerceService) api.use(createCommerceRouter(commerceService, { operations }));
  if (authService && coachingService) api.use(createCoachingRouter(coachingService));
  if (authService && resultService) api.use(createResultRouter(resultService));
  if (authService && notificationService) api.use(createNotificationRouter(notificationService));
  if (authService && accountService) {
    const context = req => ({ actorId: req.auth.user.publicId, ip: req.ip, requestId: req.requestId });
    const reply = (req, res, data) => res.json({ data, requestId: req.requestId });
    api.patch('/me/profile', requireSession, async (req, res) => reply(req, res, await accountService.profile(req.body, req.auth, context(req))));
    api.get('/me/preferences', requireSession, (req, res) => reply(req, res, accountService.preferences(req.auth)));
    api.patch('/me/preferences', requireSession, async (req, res) => reply(req, res, await accountService.savePreferences(req.body, req.auth, context(req))));
    api.post('/me/email-change', requireSession, async (req, res) => reply(req, res, await accountService.emailChange(req.body, req.auth, context(req))));
    api.post('/me/email-change/confirm', requireSession, async (req, res) => {
      const result = await accountService.confirm(req.body, req.auth, context(req));
      for (const kind of ['student', 'admin']) res.clearCookie(sessionCookie(kind), { path: '/', httpOnly: true, sameSite: 'lax', secure: config.nodeEnv === 'production' });
      reply(req, res, result);
    });
  }
  app.use('/api/v1', api);
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}
