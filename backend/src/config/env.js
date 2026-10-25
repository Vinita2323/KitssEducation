import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
const workspaceRoot = path.resolve(backendRoot, '..');

export class ConfigurationError extends Error {
  constructor(fields) {
    super(`Invalid configuration: ${[...new Set(fields)].join(', ')}`);
    this.name = 'ConfigurationError';
    this.fields = [...new Set(fields)];
  }
}

// Process environment wins; .env is read relative to backend, not the caller's cwd.
export function loadConfig({ env = process.env, envFile = path.join(backendRoot, '.env') } = {}) {
  let fileEnv = {};
  try { fileEnv = parseEnv(readFileSync(envFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw new ConfigurationError(['ENV_FILE']);
  }
  return validateEnv({ ...fileEnv, ...env });
}

export function validateEnv(env) {
  const errors = [];
  const text = (key, fallback = '') => String(env[key] ?? fallback).trim();
  const integer = (key, fallback, min, max) => {
    const raw = text(key, fallback);
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < min || value > max) errors.push(key);
    return value;
  };
  const boolean = (key, fallback) => {
    const value = text(key, fallback);
    if (!['true', 'false'].includes(value)) errors.push(key);
    return value === 'true';
  };
  const origin = (key, value) => {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.origin !== value) throw new Error();
      return value;
    } catch { errors.push(key); return value; }
  };
  const nodeEnv = text('NODE_ENV', 'development');
  if (!['development', 'test', 'production'].includes(nodeEnv)) errors.push('NODE_ENV');
  const appPublicUrl = origin('APP_PUBLIC_URL', text('APP_PUBLIC_URL', 'http://localhost:5173'));
  const apiPublicUrl = origin('API_PUBLIC_URL', text('API_PUBLIC_URL', 'http://127.0.0.1:5000'));
  const corsOrigins = text('CORS_ORIGINS', appPublicUrl).split(',').map(v => origin('CORS_ORIGINS', v.trim()));
  if (nodeEnv === 'production' && [appPublicUrl, apiPublicUrl, ...corsOrigins].some(v => !v.startsWith('https://'))) errors.push('PRODUCTION_HTTPS_ORIGINS');
  const mongoUri = text('MONGODB_URI');
  // URI contents are never included in errors/logs. No connection occurs here.
  if (!/^mongodb(?:\+srv)?:\/\/[^\s/?]+(?:\/[\w-]*)?(?:\?[^\s]*)?$/.test(mongoUri)) errors.push('MONGODB_URI');
  const mongoDbName = text('MONGODB_DB_NAME');
  if (mongoDbName && !/^[a-zA-Z0-9_-]{1,63}$/.test(mongoDbName)) errors.push('MONGODB_DB_NAME');
  const hasUriDatabase = /^mongodb(?:\+srv)?:\/\/[^/]+\/[\w-]+(?:\?|$)/.test(mongoUri);
  if (nodeEnv === 'production' && !mongoDbName && !hasUriDatabase) errors.push('MONGODB_DB_NAME');
  const storageRoot = text('STORAGE_LOCAL_ROOT');
  const within = (parent, child) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
  if (!path.isAbsolute(storageRoot) || path.parse(storageRoot).root === storageRoot) errors.push('STORAGE_LOCAL_ROOT');
  if (within(path.join(workspaceRoot, 'frontend'), storageRoot) || within(path.join(workspaceRoot, '.git'), storageRoot)) errors.push('STORAGE_LOCAL_ROOT');
  const storageProvider = text('STORAGE_PROVIDER', 'local');
  if (storageProvider !== 'local') errors.push('STORAGE_PROVIDER');
  const publicBaseUrl = text('STORAGE_PUBLIC_BASE_URL', '/api/v1/media/public');
  if (!/^\/[a-zA-Z0-9/_-]+$/.test(publicBaseUrl) || publicBaseUrl.includes('//') || publicBaseUrl.endsWith('/')) errors.push('STORAGE_PUBLIC_BASE_URL');
  const logLevel = text('LOG_LEVEL', 'info');
  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(logLevel)) errors.push('LOG_LEVEL');
  const paymentProvider = text('PAYMENT_PROVIDER', 'razorpay');
  const paymentMode = text('PAYMENT_MODE', 'test');
  if (paymentProvider !== 'razorpay') errors.push('PAYMENT_PROVIDER');
  // Live processing is deliberately unavailable in Stage 2, including production mode.
  if (paymentMode !== 'test') errors.push('PAYMENT_MODE');
  const razorpayKeyId = text('RAZORPAY_KEY_ID');
  if (razorpayKeyId && !/^rzp_test_[A-Za-z0-9]+$/.test(razorpayKeyId)) errors.push('RAZORPAY_KEY_ID');
  const host = text('HOST', '127.0.0.1');
  if (!['127.0.0.1', '0.0.0.0', '::1', '::'].includes(host)) errors.push('HOST');
  const config = {
    nodeEnv, host,
    port: integer('PORT', 5000, 1, 65535),
    appPublicUrl, apiPublicUrl, corsOrigins: [...new Set(corsOrigins)],
    trustProxyHops: integer('TRUST_PROXY_HOPS', 0, 0, 5),
    jsonBodyLimitBytes: integer('JSON_BODY_LIMIT_BYTES', 65536, 256, 1048576),
    requestTimeoutMs: integer('REQUEST_TIMEOUT_MS', 30000, 1000, 120000),
    shutdownTimeoutMs: integer('SHUTDOWN_TIMEOUT_MS', 10000, 100, 60000),
    readinessTimeoutMs: integer('READINESS_TIMEOUT_MS', 2000, 50, 10000),
    logLevel,
    mongo: {
      uri: mongoUri,
      ...(!hasUriDatabase || mongoDbName ? { dbName: mongoDbName || 'kitss_education_dev' } : {}),
      serverSelectionTimeoutMS: integer('MONGODB_SERVER_SELECTION_TIMEOUT_MS', 5000, 100, 30000),
      connectTimeoutMS: integer('MONGODB_CONNECT_TIMEOUT_MS', 5000, 100, 30000),
      socketTimeoutMS: integer('MONGODB_SOCKET_TIMEOUT_MS', 10000, 100, 120000),
      maxPoolSize: integer('MONGODB_MAX_POOL_SIZE', 10, 1, 100),
      requireReplicaSet: boolean('MONGODB_REQUIRE_REPLICA_SET', 'false'),
    },
    storage: { provider: storageProvider, root: storageRoot, publicBaseUrl,
      minFreeBytes: integer('STORAGE_MIN_FREE_BYTES', 1073741824, 0, 107374182400),
      maxBytes: integer('UPLOAD_MAX_BYTES', 1073741824, 1, 10737418240) },
    media: { ffprobe: text('MEDIA_FFPROBE_PATH', 'ffprobe'), ffmpeg: text('MEDIA_FFMPEG_PATH', 'ffmpeg'),
      videoMaxBytes: integer('MEDIA_VIDEO_MAX_BYTES', 268435456, 1024, 1073741824),
      videoUploadTimeoutMs: integer('MEDIA_VIDEO_UPLOAD_TIMEOUT_MS', 120000, 1000, 600000),
      videoInspectionTimeoutMs: integer('MEDIA_VIDEO_INSPECTION_TIMEOUT_MS', 120000, 1000, 600000), enabled: boolean('MEDIA_CLAMAV_ENABLED', 'false'), port: integer('MEDIA_CLAMAV_PORT', 3310, 1, 65535) },
    payment: { provider: paymentProvider, mode: paymentMode, rotated: boolean('RAZORPAY_CREDENTIALS_ROTATED', 'false'), keyId: razorpayKeyId,
      keySecret: text('RAZORPAY_KEY_SECRET'), webhookSecret: text('RAZORPAY_WEBHOOK_SECRET') },
    auth: {
      secret: text('AUTH_SECRET'),
      otpTtlMs: integer('AUTH_OTP_TTL_SECONDS', 600, 60, 1800) * 1000,
      resendMs: integer('AUTH_RESEND_SECONDS', 60, 30, 600) * 1000,
      sessionMs: integer('AUTH_SESSION_HOURS', 24, 1, 24) * 3600000,
      rememberMs: integer('AUTH_REMEMBER_DAYS', 30, 1, 30) * 86400000,
      staffSessionMs: integer('AUTH_STAFF_SESSION_HOURS', 8, 1, 8) * 3600000,
      idleMs: integer('AUTH_IDLE_MINUTES', 1440, 5, 1440) * 60000,
      staffIdleMs: integer('AUTH_STAFF_IDLE_MINUTES', 30, 5, 30) * 60000,
    },
    smtp: {
      host: text('SMTP_HOST'), port: integer('SMTP_PORT', 587, 1, 65535),
      secure: boolean('SMTP_SECURE', 'false'), user: text('SMTP_USER'),
      appPassword: String(env.SMTP_APP_PASSWORD ?? ''), from: text('SMTP_FROM'),
    },
  };
  if (config.auth.secret && config.auth.secret.length < 32) errors.push('AUTH_SECRET');
  if (nodeEnv === 'production' && !config.auth.secret) errors.push('AUTH_SECRET');
  if (config.smtp.host && (!/^[a-zA-Z0-9.-]+$/.test(config.smtp.host) || !config.smtp.user || !config.smtp.appPassword || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(config.smtp.from))) errors.push('SMTP_CONFIGURATION');
  if (errors.length) throw new ConfigurationError(errors);
  return config;
}
