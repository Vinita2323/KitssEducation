import pino from 'pino';

const sensitiveKey = /private_key|firebase_config|configJson|password|secret|token|proof|challenge|authorization|cookie|otp|csrf|aadha?r|cardnumber|cvv|mongodb_uri|^uri$|^body$|^query$|^headers$/i;

export function createLogger({ level = 'info', secrets = [], destination } = {}) {
  const scrubText = value => {
    let safe = value.replace(/mongodb(?:\+srv)?:\/\/[^\s"']+/gi, '[REDACTED]');
    for (const secret of secrets.filter(Boolean).sort((a, b) => b.length - a.length)) safe = safe.split(secret).join('[REDACTED]');
    return safe;
  };
  const scrub = (value, depth = 0, seen = new WeakSet()) => {
    if (typeof value === 'string') return scrubText(value);
    if (value instanceof Error) return { type: value.name, code: /^[A-Z_0-9]+$/.test(value.code ?? '') ? value.code : 'INTERNAL_ERROR' };
    if (!value || typeof value !== 'object') return value;
    if (depth > 8 || seen.has(value)) return '[OMITTED]';
    seen.add(value);
    if (Array.isArray(value)) return value.map(item => scrub(item, depth + 1, seen));
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveKey.test(key) ? '[REDACTED]' : scrub(item, depth + 1, seen)]));
  };
  return pino({ level, base: { service: 'kitss-backend' }, timestamp: pino.stdTimeFunctions.isoTime,
    hooks: { logMethod(args, method) { return method.apply(this, args.map(arg => scrub(arg))); } },
  }, destination);
}
