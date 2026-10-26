import { hasPermission } from './granular-permissions.js';
import express from 'express';
import { AppError } from '../../utils/AppError.js';
import { opaque, mac, equal, userDTO, grantsFor } from './security.js';

export const sessionCookie = kind => kind === 'admin' ? 'kitss_staff_session' : 'kitss_student_session';
const csrfCookie = 'kitss_csrf';
function cookies(req) {
  const result = Object.create(null);
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const index = part.indexOf('=');
    if (index > 0) {
      const key = part.slice(0, index).trim();
      if (Object.hasOwn(result, key)) result[key] = ''; // ambiguous cookies fail closed
      else result[key] = part.slice(index + 1).trim();
    }
  }
  return result;
}
export function body(req, allowed, required = []) {
  const input = req.body;
  if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some(key => !allowed.includes(key))) throw new AppError(422, 'INVALID_INPUT', 'Unexpected or missing request fields');
  for (const field of required) if (typeof input[field] !== 'string' || !input[field] || input[field].length > (field.toLowerCase().includes('password') ? 128 : 254)) throw new AppError(422, 'INVALID_INPUT', 'Required fields are invalid');
  if ('name' in input && (!input.name.trim() || input.name.length > 100)) throw new AppError(422, 'INVALID_INPUT', 'Name must contain 1 to 100 characters');
  if ('rememberMe' in input && typeof input.rememberMe !== 'boolean') throw new AppError(422, 'INVALID_INPUT', 'Invalid remember-me preference');
  if ('deviceLabel' in input && (typeof input.deviceLabel !== 'string' || input.deviceLabel.length > 80)) throw new AppError(422, 'INVALID_INPUT', 'Invalid device label');
  if ('kind' in input && !['student', 'admin'].includes(input.kind)) throw new AppError(422, 'INVALID_INPUT', 'Invalid login kind');
  if ('permissions' in input && (!Array.isArray(input.permissions) || input.permissions.length > 100 || input.permissions.some(p => typeof p !== 'string'))) throw new AppError(422, 'INVALID_INPUT', 'Invalid permissions');
  return input;
}
export function requireSession(req, res, next) {
  if (!req.auth) return next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in again'));
  next();
}
export function requireRecentStaffAuthentication(req, res, next) {
  const issued = req.auth?.session?.createdAt;
  if (!issued || req.auth.session.kind !== 'admin' || Date.now() - new Date(issued).getTime() > 15 * 60000) return next(new AppError(403, 'REAUTH_REQUIRED', 'Sign in again before changing staff access'));
  next();
}
export const requirePermission = permission => (req, res, next) => {
  if (!req.auth) return next(new AppError(401, 'UNAUTHENTICATED', 'Please sign in again'));
  if (!hasPermission(req.auth.user, permission, grantsFor(req.auth.user))) return next(new AppError(403, 'FORBIDDEN', 'Permission denied'));
  next();
};
export function requireOwner(req, ownerId) {
  if (!req.auth || String(req.auth.user._id) !== String(ownerId)) throw new AppError(403, 'FORBIDDEN', 'Permission denied');
}
export function createAuthRouter({ service, config }) {
  const router = express.Router();
  const cookieOptions = { httpOnly: true, secure: config.nodeEnv === 'production', sameSite: 'lax', path: '/' };
  const context = req => ({ ip: req.ip, requestId: req.requestId, actorId: req.auth?.user.publicId });
  const reply = (req, res, data, status = 200) => res.status(status).json({ data, requestId: req.requestId });
  function validCsrf(value) {
    if (!value || value.length > 200) return false;
    const [nonce, issued, signature] = value.split('.');
    const age = Date.now() - Number(issued);
    return /^[\w-]{43}$/.test(nonce ?? '') && Number.isFinite(age) && age >= 0 && age < 3600000 && equal(signature, mac(config.auth.secret, `${nonce}.${issued}`));
  }
  router.use(async (req, res, next) => {
    req.authCookies = cookies(req);
    // Distinct cookies; the staff portal never upgrades a student session.
    req.auth = await service.authenticate(req.authCookies[sessionCookie('admin')], 'admin')
      ?? await service.authenticate(req.authCookies[sessionCookie('student')], 'student');
    next();
  });
  router.get('/auth/csrf', async (req, res) => {
    await service.throttle('csrf', req.ip, 120, 60000);
    let token = req.authCookies[csrfCookie];
    if (!validCsrf(token)) { const value = `${opaque()}.${Date.now()}`; token = `${value}.${mac(config.auth.secret, value)}`; }
    res.cookie(csrfCookie, token, { ...cookieOptions, maxAge: 3600000 });
    reply(req, res, { csrfToken: token });
  });
  router.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (!config.corsOrigins.includes(req.get('Origin'))) return next(new AppError(403, 'INVALID_ORIGIN', 'Request origin is not permitted'));
    const token = req.authCookies[csrfCookie];
    if (!validCsrf(token) || !equal(token, req.get('X-CSRF-Token'))) return next(new AppError(403, 'CSRF_INVALID', 'Refresh the page and try again'));
    next();
  });
  function signedIn(req, res, result) {
    const name = sessionCookie(result.session.kind);
    res.cookie(name, result.token, { ...cookieOptions, ...(result.rememberMe ? { maxAge: new Date(result.session.expiresAt).getTime() - Date.now() } : {}) });
    // A single browser identity: remove the other portal's cookie on account switch.
    res.clearCookie(sessionCookie(result.session.kind === 'student' ? 'admin' : 'student'), cookieOptions);
    reply(req, res, { user: result.user, permissions: result.permissions, session: { expiresAt: result.session.expiresAt, kind: result.session.kind } });
  }
  router.post('/auth/accounts', async (req, res) => reply(req, res, await service.register(body(req, ['name', 'email', 'password'], ['name', 'email', 'password']), context(req)), 202));
  router.post('/auth/email/resend', async (req, res) => reply(req, res, await service.resend(body(req, ['email'], ['email']), context(req)), 202));
  router.post('/auth/activate', async (req, res) => reply(req, res, await service.activate(body(req, ['challengeId', 'otp'], ['challengeId', 'otp']), context(req))));
  router.post('/auth/login', async (req, res) => {
    const result = await service.login(body(req, ['identifier', 'password', 'rememberMe', 'deviceLabel', 'kind'], ['identifier', 'password']), context(req));
    if (result.conflict) return res.status(409).json({ error: { code: 'DEVICE_CONFLICT', message: 'Account active in another session; confirm transfer to continue' }, data: result, requestId: req.requestId });
    signedIn(req, res, result);
  });
  router.post('/auth/session/transfer', async (req, res) => signedIn(req, res, await service.transfer(body(req, ['challengeId', 'proof', 'confirmed', 'deviceLabel'], ['challengeId', 'proof']), context(req))));
  router.get('/auth/me', requireSession, (req, res) => reply(req, res, { user: userDTO(req.auth.user), permissions: grantsFor(req.auth.user), session: { expiresAt: req.auth.session.expiresAt, kind: req.auth.session.kind }, summary: {} }));
  router.post('/auth/logout', async (req, res) => {
    body(req, []);
    // Logout both cookies if a browser still holds credentials from both portals.
    for (const kind of ['student', 'admin']) await service.logout(await service.authenticate(req.authCookies[sessionCookie(kind)], kind), context(req));
    for (const kind of ['student', 'admin']) res.clearCookie(sessionCookie(kind), cookieOptions);
    res.clearCookie(csrfCookie, cookieOptions);
    res.status(204).end();
  });
  router.post('/auth/password/forgot', async (req, res) => reply(req, res, await service.forgot(body(req, ['identifier'], ['identifier']), context(req)), 202));
  router.post('/auth/password/reset', async (req, res) => {
    const result = await service.reset(body(req, ['challengeId', 'otp', 'newPassword'], ['challengeId', 'otp', 'newPassword']), context(req));
    for (const kind of ['student', 'admin']) res.clearCookie(sessionCookie(kind), cookieOptions);
    reply(req, res, result);
  });
  router.post('/auth/password/change', requireSession, async (req, res) => {
    const result = await service.change(req.auth, body(req, ['currentPassword', 'newPassword'], ['currentPassword', 'newPassword']), context(req));
    for (const kind of ['student', 'admin']) res.clearCookie(sessionCookie(kind), cookieOptions);
    reply(req, res, result);
  });
  router.post('/admin/users/invitations', requirePermission('accounts.roles.manage'), requireRecentStaffAuthentication, async (req, res) => reply(req, res, await service.invite(req.auth, body(req, ['name', 'email', 'permissions'], ['name', 'email']), context(req)), 201));
  router.delete('/admin/users/invitations/:id', requirePermission('accounts.roles.manage'), requireRecentStaffAuthentication, async (req, res) => {
    if (!/^STAFF[A-F0-9]{16}$/.test(req.params.id)) throw new AppError(422, 'INVALID_INPUT', 'Invalid staff reference');
    body(req, []);
    reply(req, res, await service.revokeInvitation(req.auth, req.params.id, context(req)));
  });
  router.post('/auth/invitations/accept', async (req, res) => reply(req, res, await service.accept(body(req, ['challengeId', 'token', 'newPassword'], ['challengeId', 'token', 'newPassword']), context(req))));
  return router;
}
