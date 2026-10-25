import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  const incoming = req.get('X-Request-ID');
  const id = typeof incoming === 'string' && /^[A-Za-z0-9_-]{8,80}$/.test(incoming) ? incoming : randomUUID();
  req.requestId = id;
  res.locals.requestId = id;
  res.set('X-Request-ID', id);
  next();
}
