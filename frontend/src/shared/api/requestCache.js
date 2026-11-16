// Short-lived memory for read-only lookups that rarely change (filter menus, dropdown lists).
// Identical requests made at the same time share one network call, and any successful write
// made through this browser clears the memory, so an admin always sees their own changes.
// With ttlMs 0 nothing is remembered once the response arrives (only simultaneous requests share).
const entries = new Map();
const MAX_ENTRIES = 200;

export function cachedRequest(key, ttlMs, loader) {
  const hit = entries.get(key);
  if (hit && hit.expires > Date.now()) return hit.promise;
  const promise = Promise.resolve().then(loader);
  const entry = { promise, expires: Infinity }; // shared while the request is in flight
  entries.set(key, entry);
  if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value);
  const forget = () => { if (entries.get(key) === entry) entries.delete(key); };
  promise.then(() => { if (ttlMs > 0) entry.expires = Date.now() + ttlMs; else forget(); }, forget); // failures are never remembered
  return promise;
}

export function clearRequestCache() { entries.clear(); }
