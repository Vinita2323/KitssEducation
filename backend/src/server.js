import http from 'node:http';
import { createMaintenanceWorker } from './utils/maintenance-worker.js';
import { createOperationalDiagnostics } from './modules/operations/diagnostics.js';
import { createResultModels } from './modules/results/results.models.js';
import { createResultService } from './modules/results/results.service.js';
import { createNotificationService } from './modules/notifications/notifications.js';
import { createFcmService } from './modules/notifications/fcm.service.js';
import { createAccountService } from './modules/auth/account.service.js';
import { createCoachingModule } from './modules/coaching/index.js';
import { createCommerceModule } from './modules/commerce/index.js';
import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { createDatabase } from './config/database.js';
import { createStorageProvider } from './storage/index.js';
import { AppError } from './utils/AppError.js';
import { createAuthModels } from './modules/auth/auth.models.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createEmailService } from './modules/email/email.service.js';
import { createInstitutionModels } from './modules/institutions/institutions.models.js';
import { createInstitutionService } from './modules/institutions/institutions.service.js';
import { createPublishingModule } from './modules/publishing/index.js';

export async function startServer({ config = loadConfig(), logger, database, storage, commerceProvider, port = config.port } = {}) {
  logger ??= createLogger({ level: config.logLevel, secrets: [config.mongo.uri, config.payment.keySecret, config.payment.webhookSecret, config.auth.secret, config.smtp.appPassword] });
  database ??= createDatabase(config.mongo, logger);
  storage ??= createStorageProvider(config.storage);
  const lifecycle = { draining: false };
  let server;
  const workers=[];
  const operationalDiagnostics=createOperationalDiagnostics({config,database,storage,workers:()=>workers.map(w=>w.state())});
  try {
    await storage.initialize();
    await database.connect(); // Fail closed: never listen before dependency validation.
    let authService;
    let institutionService;
    let publishingModule;
    let commerceService;
    let coachingService;
    let resultService, notificationService, accountService;
    if (database.connection) {
      authService = await createAuthService({ models: createAuthModels(database.connection), config, logger, mail: createEmailService(config.smtp, logger) });
      await authService.initialize();
      institutionService = createInstitutionService({ models: createInstitutionModels(database.connection), authService, config, logger });
      await institutionService.initialize();
      publishingModule = await createPublishingModule({ connection: database.connection, institutionService, authService, storage, config, logger });
      commerceService = await createCommerceModule({ connection: database.connection, publishingModule, authService, config, logger, provider: commerceProvider });
      coachingService = await createCoachingModule({ connection: database.connection, publishingModule, commerce: commerceService, institutions: institutionService, authService });
      resultService = await createResultService({ models: createResultModels(database.connection), publishingModule, authService, commerceService, config });
      const fcmService = await createFcmService({ connection: database.connection, config, logger, authService, coordination: publishingModule.coordination });
      await fcmService.initialize();
      notificationService = await createNotificationService({ connection: database.connection, publishingModule, authService, coachingService, fcmService, businessEvents: config.notifications?.businessEvents });
      accountService = createAccountService({ authService, config, mail: createEmailService(config.smtp, logger), institutions: institutionService });
      workers.push(createMaintenanceWorker({name:'commerce_notifications',intervalMs:15000,logger,tasks:[()=>commerceService.tick(),()=>notificationService.tick()]}));
      workers.push(createMaintenanceWorker({name:'audit_media',intervalMs:3600000,logger,tasks:[()=>authService.maintenance(),()=>institutionService.maintenance(),()=>publishingModule.maintenance(),()=>coachingService.maintenance(),()=>resultService.maintenance(),()=>notificationService.maintenance()]}));
      workers.forEach(worker=>worker.start());
    }
    server = http.createServer(createApp({ config, logger, database, storage, lifecycle, authService, institutionService, publishingModule, commerceService, coachingService, resultService, notificationService, accountService, operationalDiagnostics }));
    server.requestTimeout = Math.max(config.requestTimeoutMs, config.media?.videoUploadTimeoutMs ?? 0);
    server.headersTimeout = Math.min(15000, config.requestTimeoutMs);
    server.keepAliveTimeout = 5000;
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, config.host, () => { server.removeListener('error', reject); resolve(); });
    });
  } catch (error) {
    workers.forEach(worker=>worker.stop());
    await Promise.all(workers.map(worker=>worker.drain()));
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await database.disconnect().catch(() => {});
    throw error;
  }
  logger.info({ event: 'server_started', port: server.address().port }, 'Backend foundation listening');
  let closing;
  const close = () => {
    if (closing) return closing;
    lifecycle.draining = true;
    workers.forEach(worker=>worker.stop());
    closing = (async () => {
      let timer;
      try {
        await Promise.race([
          (async () => {
            await Promise.all([new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),...workers.map(worker=>worker.drain())]);
            await database.disconnect();
          })(),
          new Promise((resolve, reject) => {
            timer = setTimeout(() => {
              server.closeAllConnections();
              reject(new AppError(503, 'SHUTDOWN_TIMEOUT', 'Graceful shutdown timed out'));
            }, config.shutdownTimeoutMs);
          }),
        ]);
        logger.info({ event: 'server_stopped' }, 'Backend stopped');
      } finally { clearTimeout(timer); }
    })();
    return closing;
  };
  return { server, close, lifecycle, workers };
}

export function installSignalHandlers(runtime, { processRef = process, logger }) {
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    try { await runtime.close(); }
    catch (error) {
      logger.error({ event: 'shutdown_failed' }, 'Shutdown failed');
      processRef.exitCode = 1;
      // The deadline is a last resort after connections have been forced closed;
      // do not leave a process with a stuck DB operation alive indefinitely.
      if (error.code === 'SHUTDOWN_TIMEOUT') processRef.exit(1);
    }
    finally { dispose(); }
  };
  const dispose = () => { processRef.removeListener('SIGINT', stop); processRef.removeListener('SIGTERM', stop); };
  processRef.once('SIGINT', stop);
  processRef.once('SIGTERM', stop);
  return dispose;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let logger;
  try {
    const config = loadConfig();
    logger = createLogger({ level: config.logLevel, secrets: [config.mongo.uri, config.payment.keySecret, config.payment.webhookSecret, config.auth.secret, config.smtp.appPassword] });
    const runtime = await startServer({ config, logger });
    installSignalHandlers(runtime, { logger });
  } catch (error) {
    logger ??= createLogger();
    logger.fatal({ event: 'startup_failed', ...(error.name === 'ConfigurationError' ? { fields: error.fields } : {}) }, 'Startup failed; verify configuration, MongoDB and storage');
    process.exitCode = 1;
  }
}
