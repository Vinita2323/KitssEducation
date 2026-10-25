import { Router } from 'express';
import { AppError } from '../../utils/AppError.js';
import { sendSuccess } from '../../utils/response.js';

export function createHealthRouter({ database, storage, lifecycle, timeoutMs }) {
  const router = Router();
  router.get('/live', (req, res) => sendSuccess(res, { status: 'ok' }));
  router.get('/ready', async (req, res, next) => {
    let timer;
    try {
      if (lifecycle.draining) throw new Error('Draining');
      const ready = await Promise.race([
        Promise.all([database.isReady(), storage.isReady()]).then(results => results.every(Boolean)),
        new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); }),
      ]);
      if (!ready || lifecycle.draining) throw new Error('Not ready');
      return sendSuccess(res, { status: 'ready' });
    } catch { return next(new AppError(503, 'NOT_READY', 'Service is not ready')); }
    finally { clearTimeout(timer); }
  });
  return router;
}
