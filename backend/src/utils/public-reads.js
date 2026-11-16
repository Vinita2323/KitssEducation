import { createReadCache, queryKey } from './read-cache.js';
import { memoryRateLimit } from './rate-limit.js';

// Shared by the heavy public read endpoints (filter menus and the institution directory):
// one request budget per client across all of them, and one short-lived result cache.
export const heavyReadLimit = memoryRateLimit({ limit: 300, windowMs: 60000 });
const cache = createReadCache({ ttlMs: 10000, max: 500 });
export const cachedPublicRead = (name, query, loader) => cache.get(queryKey(name, query), loader);
