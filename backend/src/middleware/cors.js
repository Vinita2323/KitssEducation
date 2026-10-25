import { AppError } from '../utils/AppError.js';

const methods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
const headers = ['content-type', 'x-request-id', 'x-csrf-token', 'x-draft-capability', 'range'];

export function exactOriginCors(origins) {
  const allowed = new Set(origins);
  return (req, res, next) => {
    res.vary('Origin');
    const origin = req.get('Origin');
    if (!origin) return next(); // CLI/health probes; CORS is not authentication.
    if (!allowed.has(origin)) return next(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Request origin is not allowed'));
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Expose-Headers', 'X-Request-ID, Accept-Ranges, Content-Range, Content-Length');
    if (req.method !== 'OPTIONS') return next();
    res.vary('Access-Control-Request-Method');
    res.vary('Access-Control-Request-Headers');
    const method = req.get('Access-Control-Request-Method');
    const requestedHeaders = (req.get('Access-Control-Request-Headers') ?? '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
    if (!methods.includes(method) || requestedHeaders.some(v => !headers.includes(v))) {
      return next(new AppError(403, 'CORS_PREFLIGHT_DENIED', 'Preflight request is not allowed'));
    }
    res.set('Access-Control-Allow-Methods', methods.join(', '));
    res.set('Access-Control-Allow-Headers', headers.join(', '));
    res.set('Access-Control-Max-Age', '600');
    return res.status(204).end();
  };
}
