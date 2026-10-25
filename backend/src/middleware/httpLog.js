import { performance } from 'node:perf_hooks';

export function httpLog(logger) {
  return (req, res, next) => {
    const start = performance.now();
    res.once('finish', () => {
      // Do not log URL/query, headers, body, cookies or route parameters.
      logger.info({ event: 'http_request', requestId: req.requestId, method: req.method,
        route: req.route?.path ?? 'unmatched', status: res.statusCode,
        durationMs: Math.round(performance.now() - start) }, 'HTTP request completed');
    });
    next();
  };
}
