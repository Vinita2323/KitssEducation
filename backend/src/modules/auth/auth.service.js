import { randomInt, randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { opaque, digest, mac, equal, hashPassword, checkPassword, email, invalidProof, invalidLogin, grantsFor, userDTO } from './security.js';

export async function createAuthService({ models, config, mail, logger, now = () => new Date() }) {
  if (!config.auth.secret || config.auth.secret.length < 32) throw new AppError(503, 'AUTH_CONFIGURATION', 'Configure AUTH_SECRET before starting authentication');
  const { User, Session, AuthThrottle, AuditLog } = models;
  const secret = config.auth.secret;
  const dummyHash = await hashPassword(opaque());
  const event = (action, ctx = {}) => ({ id: randomUUID(), action, actorId: ctx.actorId, requestId: ctx.requestId, at: now() });
  async function flushAudit(user) {
    if (!user) return;
    for (const item of user.auditOutbox ?? []) {
      try {
        await AuditLog.updateOne({ _id: item.id }, { $setOnInsert: { action: item.action, actorId: item.actorId, subjectId: user.publicId, requestId: item.requestId, at: item.at, ...(item.reason ? { reason: item.reason } : {}), ...(item.permissionChange ? { permissionChange: item.permissionChange } : {}) } }, { upsert: true });
        await User.updateOne({ _id: user._id }, { $pull: { auditOutbox: { id: item.id } } });
      } catch { logger.error({ event: 'audit_outbox_pending' }, 'Security audit remains durably pending'); break; }
    }
  }
  async function mutate(filter, update, action, ctx) {
    const user = await User.findOneAndUpdate({ ...filter, 'auditOutbox.999': { $exists: false } }, {
      ...update, $push: { auditOutbox: event(action, ctx) },
    }, { returnDocument: 'after', runValidators: true }).select('+passwordHash');
    await flushAudit(user);
    return user;
  }
  async function throttle(scope, value, limit, windowMs = 900000) {
    const bucket = Math.floor(now().getTime() / windowMs);
    const id = mac(secret, `${scope}:${value}:${bucket}`);
    let entry;
    try { entry = await AuthThrottle.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } }, { upsert: true, returnDocument: 'after' }); }
    catch (error) { if (error.code !== 11000) throw error; entry = await AuthThrottle.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: 'after' }); }
    if (!entry || entry.count > limit) throw new AppError(429, 'RATE_LIMITED', 'Too many requests; please try again later');
  }
  async function limit(ctx, identifier = '', scope = 'auth', limit = 10) {
    await throttle(`${scope}:ip`, ctx.ip ?? 'unknown', scope === 'login' ? 40 : 30);
    if (identifier) await throttle(`${scope}:account`, identifier.toLowerCase(), limit);
  }
  function challenge(purpose, code, options = {}) {
    const id = opaque();
    return { id, hash: mac(secret, `${purpose}:${id}:${code}`), expiresAt: new Date(now().getTime() + (purpose === 'invite' ? 86400000 : purpose === 'transfer' ? 120000 : config.auth.otpTtlMs)),
      attempts: 0, sentAt: now(), delivered: false, ...options };
  }
  const proofFilter = (purpose, id, code) => ({
    [`challenges.${purpose}.id`]: id, [`challenges.${purpose}.hash`]: mac(secret, `${purpose}:${id}:${code}`),
    [`challenges.${purpose}.expiresAt`]: { $gt: now() }, [`challenges.${purpose}.attempts`]: { $lt: 5 },
    [`challenges.${purpose}.delivered`]: true,
  });
  async function wrongProof(purpose, id) {
    await User.updateOne({ [`challenges.${purpose}.id`]: id, [`challenges.${purpose}.attempts`]: { $lt: 5 } }, { $inc: { [`challenges.${purpose}.attempts`]: 1 } });
    throw invalidProof();
  }
  async function deliver(user, purpose, code, item) {
    try {
      await mail.send({ to: user.emailNormalized, purpose, code, ttlMinutes: Math.ceil(config.auth.otpTtlMs / 60000),
        ...(purpose === 'invite' ? { link: `${config.appPublicUrl}/staff/accept#${item.id}.${code}` } : {}) });
      const result = await User.updateOne({ _id: user._id, [`challenges.${purpose}.id`]: item.id }, { $set: { [`challenges.${purpose}.delivered`]: true } });
      if (!result.matchedCount) throw new Error('Challenge replaced');
    } catch (error) {
      // Never authorize a proof for a failed/uncertain SMTP attempt.
      await User.updateOne({ _id: user._id, [`challenges.${purpose}.id`]: item.id }, { $unset: { [`challenges.${purpose}`]: 1 } });
      throw error instanceof AppError ? error : new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; please try again later');
    }
  }
  async function sendOtp(user, purpose, ctx) {
    const code = String(randomInt(100000, 1000000));
    const item = challenge(purpose, code);
    const updated = await mutate({ _id: user._id, status: purpose === 'verify' ? 'pending' : 'active',
      $or: [{ [`challenges.${purpose}.sentAt`]: { $exists: false } }, { [`challenges.${purpose}.sentAt`]: { $lte: new Date(now().getTime() - config.auth.resendMs) } }] },
    { $set: { [`challenges.${purpose}`]: item } }, `${purpose}_requested`, ctx);
    if (!updated) return opaque(); // Same generic response for cooldown/unknown account.
    await deliver(updated, purpose, code, item);
    return item.id;
  }
  async function sessionFor(user, rememberMe, label) {
    const staff = !user.roles.includes('student');
    const token = opaque();
    const session = await Session.create({ _id: randomUUID(), tokenHash: digest(token), userId: user._id,
      kind: staff ? 'admin' : 'student', deviceLabel: String(label || 'Browser').slice(0, 80),
      securityVersion: user.securityVersion, expiresAt: new Date(now().getTime() + (staff ? config.auth.staffSessionMs : rememberMe ? config.auth.rememberMs : config.auth.sessionMs)), lastSeenAt: now() });
    return { token, session, rememberMe };
  }
  const resultFor = (user, result) => ({ ...result, user: userDTO(user), permissions: grantsFor(user) });
  async function revokeCleanup(user) {
    try { await Session.updateMany({ userId: user._id, revokedAt: null, securityVersion: { $ne: user.securityVersion } }, { $set: { revokedAt: now() } }); }
    catch { logger.warn({ event: 'session_cleanup_pending' }, 'Version checks already deny obsolete sessions'); }
  }
  const service = {
    models, throttle, limit, flushAudit,
    async initialize() {
      // Additive index creation only. Never syncIndexes/drop/reset existing data.
      for (const model of Object.values(models)) await model.createIndexes();
      await service.maintenance();
    },
    async maintenance() {
      for (const purpose of ['verify', 'reset', 'invite', 'transfer', 'emailChange']) {
        await User.updateMany({ [`challenges.${purpose}.expiresAt`]: { $lte: now() } }, { $unset: { [`challenges.${purpose}`]: 1 } });
      }
      for await (const user of User.find({ 'auditOutbox.0': { $exists: true } }).cursor()) await flushAudit(user);
    },
    async register(input, ctx) {
      const identifier = email(input.email);
      await limit(ctx, identifier, 'register', 5);
      const passwordHash = await hashPassword(input.password);
      let user;
      try { user = await User.create({ publicId: `KITSS${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`, name: input.name.trim(), emailNormalized: identifier,
        passwordHash, roles: ['student'], status: 'pending', auditOutbox: [event('identity_created', ctx)] }); }
      catch (error) { if (error.code === 11000) return { message: 'If eligible, check your email to verify your account', challengeId: opaque() }; throw error; }
      await flushAudit(user);
      return { message: 'If eligible, check your email to verify your account', challengeId: await sendOtp(user, 'verify', ctx) };
    },
    async resend(input, ctx) {
      const identifier = email(input.email);
      await limit(ctx, identifier, 'resend', 5);
      const user = await User.findOne({ emailNormalized: identifier, status: 'pending', passwordHash: { $exists: true } });
      if (!mail.configured) throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; please try again later');
      return { message: 'If eligible, a verification code has been submitted for delivery', challengeId: user ? await sendOtp(user, 'verify', ctx) : opaque() };
    },
    async activate({ challengeId, otp }, ctx) {
      await limit(ctx, challengeId, 'verify');
      const user = await mutate({ ...proofFilter('verify', challengeId, otp), status: 'pending', passwordHash: { $exists: true } },
        { $set: { emailVerifiedAt: now(), status: 'active' }, $unset: { 'challenges.verify': 1 } }, 'email_verified', ctx);
      if (!user) return wrongProof('verify', challengeId);
      return { user: userDTO(user), message: 'Email verified. Please sign in.' };
    },
    async login({ identifier, password, rememberMe = false, deviceLabel, kind = 'student' }, ctx) {
      const normalized = identifier.trim().toLowerCase();
      await limit(ctx, normalized, 'login');
      const lookup = normalized.includes('@') ? { emailNormalized: normalized } : { publicId: normalized.toUpperCase() };
      const user = await User.findOne(lookup).select('+passwordHash');
      const valid = await checkPassword(user?.passwordHash ?? dummyHash, password);
      if (!valid || !user || user.status !== 'active' || !user.emailVerifiedAt || (kind === 'admin') !== !user.roles.includes('student')) throw invalidLogin();
      if (kind === 'student' && user.activeSessionId && user.activeSessionExpiresAt > now()) {
        const current = await Session.findOne({ _id: user.activeSessionId, revokedAt: null, expiresAt: { $gt: now() }, lastSeenAt: { $gt: new Date(now().getTime() - config.auth.idleMs) } });
        if (current) {
          const proof = opaque(); const item = challenge('transfer', proof, { targetSessionId: user.activeSessionId, version: user.securityVersion, rememberMe, delivered: true });
          const updated = await mutate({ _id: user._id, activeSessionId: user.activeSessionId, securityVersion: user.securityVersion, status: 'active' }, { $set: { 'challenges.transfer': item } }, 'session_transfer_requested', ctx);
          if (!updated) throw new AppError(409, 'SESSION_CHANGED', 'Session changed; sign in again');
          return { conflict: true, challengeId: item.id, proof, expiresAt: item.expiresAt, deviceLabel: current.deviceLabel };
        }
      }
      const result = await sessionFor(user, rememberMe, deviceLabel);
      if (kind === 'student') {
        const updated = await mutate({ _id: user._id, activeSessionId: user.activeSessionId, securityVersion: user.securityVersion, status: 'active', emailVerifiedAt: { $ne: null } },
          { $set: { activeSessionId: result.session._id, activeSessionExpiresAt: result.session.expiresAt }, $unset: { 'challenges.transfer': 1 } }, 'login', ctx);
        if (!updated) { await Session.deleteOne({ _id: result.session._id }); throw new AppError(409, 'SESSION_CHANGED', 'Session changed; sign in again'); }
      } else {
        const updated = await mutate({ _id: user._id, status: 'active', securityVersion: user.securityVersion }, { $set: { updatedAt: now(), lastLoginAt: now() } }, 'staff_login', ctx);
        if (!updated) { await Session.deleteOne({ _id: result.session._id }); throw invalidLogin(); }
      }
      return resultFor(user, result);
    },
    async transfer({ challengeId, proof, confirmed, deviceLabel }, ctx) {
      if (confirmed !== true) throw invalidProof();
      await limit(ctx, challengeId, 'transfer', 5);
      const user = await User.findOne({ ...proofFilter('transfer', challengeId, proof), status: 'active' });
      if (!user) return wrongProof('transfer', challengeId);
      const item = user.challenges.transfer;
      const result = await sessionFor(user, item.rememberMe, deviceLabel);
      const updated = await mutate({ _id: user._id, ...proofFilter('transfer', challengeId, proof), activeSessionId: item.targetSessionId, securityVersion: item.version, status: 'active' },
        { $set: { activeSessionId: result.session._id, activeSessionExpiresAt: result.session.expiresAt }, $unset: { 'challenges.transfer': 1 } }, 'session_transferred', ctx);
      if (!updated) { await Session.deleteOne({ _id: result.session._id }); throw invalidProof(); }
      try { await Session.updateOne({ _id: item.targetSessionId }, { $set: { revokedAt: now() } }); } catch { /* pointer already invalidates old session */ }
      return resultFor(updated, result);
    },
    async authenticate(token, kind) {
      if (!token || !/^[\w-]{43}$/.test(token)) return null;
      const session = await Session.findOne({ tokenHash: digest(token), kind, revokedAt: null, expiresAt: { $gt: now() }, lastSeenAt: { $gt: new Date(now().getTime() - (kind === 'admin' ? config.auth.staffIdleMs : config.auth.idleMs)) } });
      if (!session) return null;
      const user = await User.findById(session.userId);
      if (!user || user.status !== 'active' || !user.emailVerifiedAt || user.securityVersion !== session.securityVersion ||
        (kind === 'student' ? !user.roles.includes('student') || user.activeSessionId !== session._id : user.roles.includes('student'))) return null;
      await Session.updateOne({ _id: session._id, revokedAt: null }, { $set: { lastSeenAt: now() } });
      await flushAudit(user);
      return { user, session };
    },
    async logout(auth, ctx) {
      if (!auth) return;
      // Revoke first: failure must not claim logout while leaving the credential valid.
      await Session.updateOne({ _id: auth.session._id }, { $set: { revokedAt: now() } });
      if (auth.session.kind === 'student') await mutate({ _id: auth.user._id, activeSessionId: auth.session._id }, { $set: { activeSessionId: null }, $unset: { activeSessionExpiresAt: 1 } }, 'logout', ctx);
      else await mutate({ _id: auth.user._id }, { $set: { updatedAt: now() } }, 'staff_logout', ctx);
    },
    async forgot({ identifier }, ctx) {
      identifier = email(identifier);
      await limit(ctx, identifier, 'forgot', 5);
      if (!mail.configured) throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; please try again later');
      const user = await User.findOne({ emailNormalized: identifier, status: 'active', emailVerifiedAt: { $ne: null } });
      let challengeId = opaque();
      if (user) {
        try { challengeId = await sendOtp(user, 'reset', ctx); }
        catch (error) { if (error.code !== 'EMAIL_UNAVAILABLE') throw error; /* Generic uncertain delivery acknowledgment below. */ }
      }
      return { challengeId, message: 'If eligible, a recovery code was submitted for delivery. Delivery is not guaranteed; retry later if it does not arrive.' };
    },
    async reset({ challengeId, otp, newPassword }, ctx) {
      await limit(ctx, challengeId, 'reset');
      const passwordHash = await hashPassword(newPassword);
      const user = await mutate({ ...proofFilter('reset', challengeId, otp), status: 'active' }, { $set: { passwordHash, passwordChangedAt: now(), activeSessionId: null },
        $inc: { securityVersion: 1 }, $unset: { 'challenges.reset': 1, 'challenges.transfer': 1, activeSessionExpiresAt: 1 } }, 'password_reset', ctx);
      if (!user) return wrongProof('reset', challengeId);
      await revokeCleanup(user);
      return { message: 'Password reset. Sign in again.' };
    },
    async change(auth, { currentPassword, newPassword }, ctx) {
      await limit(ctx, auth.user.publicId, 'change', 5);
      const user = await User.findById(auth.user._id).select('+passwordHash');
      if (!await checkPassword(user?.passwordHash ?? dummyHash, currentPassword)) throw invalidLogin();
      const passwordHash = await hashPassword(newPassword);
      const updated = await mutate({ _id: user._id, securityVersion: auth.session.securityVersion, status: 'active', passwordHash: user.passwordHash },
        { $set: { passwordHash, passwordChangedAt: now(), activeSessionId: null }, $inc: { securityVersion: 1 }, $unset: { challenges: 1, activeSessionExpiresAt: 1 } }, 'password_changed', ctx);
      if (!updated) throw invalidLogin();
      await revokeCleanup(updated);
      return { message: 'Password changed. Sign in again.' };
    },
    async invite(auth, input, ctx) {
      await limit(ctx, auth.user.publicId, 'invite', 10);
      if (!grantsFor(auth.user).includes('accounts.roles.manage')) throw new AppError(403, 'FORBIDDEN', 'Permission denied');
      const identifier = email(input.email);
      // Invitations create ordinary staff only. Super-admin promotion is a later,
      // separately reviewed role-change workflow; no last-super-admin race exists.
      const allowed = input.permissions ?? [];
      if (allowed.some(p => !grantsFor(auth.user).includes(p) || ['accounts.roles.manage', 'results.publish'].includes(p))) throw new AppError(422, 'INVALID_GRANTS', 'Invalid permission assignment');
      let user = await User.findOne({ emailNormalized: identifier });
      if (!user) {
        try { user = await User.create({ publicId: `STAFF${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`, name: input.name.trim(), emailNormalized: identifier, roles: ['admin'], permissions: allowed, status: 'pending', auditOutbox: [event('staff_invited', { ...ctx, actorId: auth.user.publicId })] }); }
        catch (error) { if (error.code === 11000) throw new AppError(409, 'IDENTITY_EXISTS', 'Invitation cannot be created'); throw error; }
      }
      if (user.status !== 'pending' || !user.roles.includes('admin') || user.roles.includes('super_admin') || user.emailVerifiedAt) throw new AppError(409, 'IDENTITY_EXISTS', 'Invitation cannot be created');
      const token = opaque(); const item = challenge('invite', token);
      const updated = await mutate({ _id: user._id, status: 'pending', passwordHash: { $exists: false }, $or: [{ 'challenges.invite.sentAt': { $exists: false } }, { 'challenges.invite.sentAt': { $lte: new Date(now().getTime() - config.auth.resendMs) } }] },
        { $set: { 'challenges.invite': item, permissions: allowed } }, 'staff_invitation_issued', { ...ctx, actorId: auth.user.publicId });
      if (!updated) throw new AppError(409, 'INVITATION_PENDING', 'Invitation already pending or accepted; wait before resending');
      await deliver(updated, 'invite', token, item);
      return { id: updated.publicId, message: 'Invitation submitted to SMTP for delivery' };
    },
    async revokeInvitation(auth, id, ctx) {
      if (!grantsFor(auth.user).includes('accounts.roles.manage')) throw new AppError(403, 'FORBIDDEN', 'Permission denied');
      const updated = await mutate({ publicId: id, status: 'pending', roles: 'admin' }, { $unset: { challenges: 1, passwordHash: 1 }, $set: { status: 'archived' }, $inc: { securityVersion: 1 } }, 'staff_invitation_revoked', { ...ctx, actorId: auth.user.publicId });
      return { message: 'Invitation revoked or already unavailable', id: updated?.publicId ?? id };
    },
    async accept({ challengeId, token, newPassword }, ctx) {
      await limit(ctx, challengeId, 'accept', 5);
      const passwordHash = await hashPassword(newPassword);
      const user = await mutate({ ...proofFilter('invite', challengeId, token), status: 'pending', roles: 'admin', passwordHash: { $exists: false } },
        { $set: { passwordHash, passwordChangedAt: now() }, $unset: { 'challenges.invite': 1 } }, 'staff_invitation_accepted', ctx);
      if (!user) return wrongProof('invite', challengeId);
      return { message: 'Verify your email before signing in', challengeId: await sendOtp(user, 'verify', ctx) };
    },
    async bootstrap({ name, email: address, password, allowed }, ctx = {}) {
      if (allowed !== true) throw new AppError(403, 'BOOTSTRAP_DISABLED', 'Explicit operator approval is required');
      if (await User.exists({ roles: 'super_admin' })) throw new AppError(409, 'BOOTSTRAP_EXISTS', 'Initial administrator already exists');
      const passwordHash = await hashPassword(password);
      let user;
      try { user = await User.create({ publicId: `STAFF${randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`, name, emailNormalized: email(address), passwordHash, roles: ['super_admin'], status: 'pending', bootstrapKey: 'initial-super-admin', auditOutbox: [event('super_admin_bootstrap', ctx)] }); }
      catch (error) { if (error.code === 11000) throw new AppError(409, 'BOOTSTRAP_EXISTS', 'Bootstrap or identity already exists'); throw error; }
      await flushAudit(user);
      return { message: 'Initial account created; verify email before login', challengeId: await sendOtp(user, 'verify', ctx) };
    },
  };
  return service;
}
