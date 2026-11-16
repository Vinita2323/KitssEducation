import { AppError } from './AppError.js';

// In-memory, per-client request limit for heavy public reads. Writes to the database would cost more
// than the reads being protected, so this deliberately does not use the auth throttle collection.
export function memoryRateLimit({ limit = 300, windowMs = 60000, maxClients = 10000 } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now(), key = req.ip ?? 'unknown';
    // Behind a reverse proxy without TRUST_PROXY_HOPS every visitor appears as loopback; limiting that
    // shared address would throttle all users together, so such requests are not counted.
    if (/^(127\.|::1$|::ffff:127\.)/.test(key)) return next();
    let entry = clients.get(key);
    if (!entry || entry.resetAt <= now) {
      if (clients.size >= maxClients) for (const [k, v] of clients) if (v.resetAt <= now) clients.delete(k);
      if (clients.size >= maxClients) clients.delete(clients.keys().next().value);
      entry = { count: 0, resetAt: now + windowMs };
      clients.set(key, entry);
    }
    if (++entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new AppError(429, 'RATE_LIMITED', 'Too many requests; please try again later'));
    }
    next();
  };
}
