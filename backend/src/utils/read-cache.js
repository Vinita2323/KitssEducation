// Short-lived, in-process memory for expensive public reads (filter menus, the institution directory).
// Every write that goes through the application's domain lock calls invalidateReadCache(), so changes
// made through the app are visible on the next request. Writes made outside the app (scripts, another
// server process) become visible when the short TTL expires.
let generation = 0;
export function invalidateReadCache() { generation++; }

export function createReadCache({ ttlMs = 10000, max = 500 } = {}) {
  const entries = new Map();
  let seen = generation;
  return {
    get(key, loader) {
      if (seen !== generation) { entries.clear(); seen = generation; }
      const now = Date.now(), hit = entries.get(key);
      if (hit && hit.expires > now) return hit.promise;
      const promise = Promise.resolve().then(loader);
      entries.set(key, { promise, expires: now + ttlMs });
      if (entries.size > max) entries.delete(entries.keys().next().value);
      // Errors (validation, outages) are never remembered.
      promise.catch(() => { if (entries.get(key)?.promise === promise) entries.delete(key); });
      return promise;
    },
  };
}

// Stable cache key for a parsed query object.
export const queryKey = (prefix, query = {}) => prefix + '?' + JSON.stringify(Object.keys(query).sort().map(k => [k, query[k]]));
