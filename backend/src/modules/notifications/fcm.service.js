import { createFcmTokenModel } from './fcmToken.model.js';
import { createFirebaseTransport } from './firebaseAdmin.js';
import { AppError } from '../../utils/AppError.js';
import { object, text, invalid } from '../publishing/validation.js';

export async function createFcmService({ connection, config, logger, authService, coordination, transport }) {
  const FcmToken = createFcmTokenModel(connection);
  const provider = transport ?? await createFirebaseTransport(config, logger);
  const { User, Session } = authService.models;
  const validToken = token => { if (typeof token !== 'string' || !/^[A-Za-z0-9_:\-]{20,4096}$/.test(token)) throw invalid('Invalid bounded push token'); return token; };
  async function active(row) {
    const user = await User.findById(row.userId), session = await Session.findById(row.sessionId);
    return Boolean(user?.status === 'active' && user.emailVerifiedAt && user.securityVersion === row.securityVersion && session && !session.revokedAt && session.expiresAt > new Date() && session.lastSeenAt > new Date(Date.now() - (session.kind === 'admin' ? config.auth.staffIdleMs : config.auth.idleMs)) && session.securityVersion === user.securityVersion && String(session.userId) === String(user._id) && (session.kind !== 'student' || user.activeSessionId === session._id));
  }
  return {
    models: { FcmToken }, isConfigured: () => provider.configured === true,
    async initialize() { await FcmToken.createIndexes(); },
    async saveToken(auth, input, ctx) {
      object(input, ['token', 'platform', 'deviceLabel'], ['token']); const token = validToken(input.token);
      if (input.platform && input.platform !== 'web') throw invalid('Only browser devices are supported');
      await authService.limit(ctx, String(auth.user._id), 'push-token', 20);
      return coordination.run(async () => {
        const prior = await FcmToken.findOne({ token });
        if (prior && String(prior.userId) !== String(auth.user._id) && await active(prior)) throw new AppError(409, 'DEVICE_ALREADY_BOUND', 'Disable push on the previous account before enabling this device');
        const count = await FcmToken.countDocuments({ userId: auth.user._id });
        if (count >= 10 && (!prior || String(prior.userId) !== String(auth.user._id))) throw new AppError(409, 'DEVICE_LIMIT', 'Remove an existing push device before adding another');
        const doc = await FcmToken.findOneAndUpdate({ token }, { $set: { userId: auth.user._id, sessionId: auth.session._id, securityVersion: auth.user.securityVersion, platform: 'web', deviceLabel: text(input.deviceLabel ?? '', 100), lastSeenAt: new Date() } }, { upsert: true, returnDocument: 'after', runValidators: true });
        return { id: String(doc._id), saved: true, platform: 'web' };
      });
    },
    async removeToken(auth, token) { validToken(token); const result = await FcmToken.deleteOne({ userId: auth.user._id, sessionId: auth.session._id, token }); return { removed: result.deletedCount > 0 }; },
    async tokensFor(userId) {
      const rows = await FcmToken.find({ userId }).select('+token'); const valid = [];
      for (const row of rows) if (await active(row)) valid.push(row);
      return valid;
    },
    async send(deviceId, notificationId) {
      if (!provider.configured) return { status: 'disabled' };
      const row = await FcmToken.findById(deviceId).select('+token');
      if (!row || !await active(row)) return { status: 'skipped' };
      let result; try { result = await provider.send(row.token, String(notificationId)); } catch { result = { status: 'retry' }; }
      if (result.status === 'invalid_token') await FcmToken.deleteOne({ _id: row._id, sessionId: row.sessionId });
      return { status: ['sent', 'invalid_token', 'retry'].includes(result.status) ? result.status : 'retry' };
    },
    async sendTestNotification() { throw new AppError(409, 'LIVE_PUSH_APPROVAL_REQUIRED', 'Live test delivery requires separate operator authorization; use in-app notifications'); },
  };
}
