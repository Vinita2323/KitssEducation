import { randomInt, randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { object, text, invalid, id } from '../publishing/validation.js';
import { email, checkPassword, mac, opaque, userDTO } from './security.js';
export function createAccountService({
  authService,
  config,
  mail,
  institutions
}) {
  const {
    User
  } = authService.models;
  const event = (action, ctx) => ({
    id: randomUUID(),
    action,
    actorId: ctx.actorId,
    requestId: ctx.requestId,
    at: new Date()
  });
  async function update(auth, fields, action, ctx, filter = {}, increments = {}) {
    const row = await User.findOneAndUpdate({
      _id: auth.user._id,
      status: 'active',
      securityVersion: auth.user.securityVersion,
      'auditOutbox.999': {
        $exists: false
      },
      ...filter
    }, {
      $set: fields,
      $inc: increments,
      $push: {
        auditOutbox: event(action, ctx)
      }
    }, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!row) throw new AppError(409, 'ACCOUNT_CHANGED', 'Refresh your account and try again');
    await authService.flushAudit(row);
    return row;
  }
  return {
    async profile(input, auth, ctx) {
      object(input, ['name', 'phone', 'profile']);
      const fields = {};
      if ('name' in input) {
        fields.name = text(input.name, 100);
        if (!fields.name) throw invalid('Name required');
      }
      if ('phone' in input) {
        fields.phone = text(input.phone, 24);
        const digits = fields.phone.replace(/\D/g, '');
        if (fields.phone && (!/^\+?[0-9 ()-]{7,24}$/.test(fields.phone) || digits.length < 7 || digits.length > 15)) throw invalid('Invalid phone number');
      }
      if (input.profile) {
        object(input.profile, ['board', 'class']);
        for (const k of Object.keys(input.profile)) fields['profile.' + k] = text(input.profile[k], 80);
      }
      return {
        user: userDTO(await update(auth, fields, 'profile_updated', ctx))
      };
    },
    preferences(auth) {
      return {
        notification: {
          examAlerts: auth.user.preferences?.notification?.examAlerts ?? true,
          courseUpdates: auth.user.preferences?.notification?.courseUpdates ?? true,
          promoAlerts: auth.user.preferences?.notification?.promoAlerts ?? false
        },
        courseSelector: auth.user.preferences?.courseSelector?.toObject?.() ?? auth.user.preferences?.courseSelector ?? {}
      };
    },
    async savePreferences(input, auth, ctx) {
      object(input, ['notification', 'courseSelector']);
      const fields = {};
      if (input.notification) {
        object(input.notification, ['examAlerts', 'courseUpdates', 'promoAlerts']);
        for (const [key, value] of Object.entries(input.notification)) {
          if (typeof value !== 'boolean') throw invalid('Preference must be boolean');
          fields['preferences.notification.' + key] = value;
        }
      }
      if (input.courseSelector) {
        const kinds = {
          boardId: 'board',
          classId: 'class',
          stateId: 'state',
          languageId: 'language',
          subjectId: 'subject'
        };
        object(input.courseSelector, Object.keys(kinds));
        for (const [key, value] of Object.entries(input.courseSelector)) {
          if (value !== '' && !(await institutions.models.Taxonomy.exists({
            _id: id(value),
            kind: kinds[key],
            status: 'active'
          }))) throw invalid('Invalid active taxonomy preference');
          fields['preferences.courseSelector.' + key] = value;
        }
      }
      return this.preferences({
        user: await update(auth, fields, 'preferences_updated', ctx)
      });
    },
    async emailChange(input, auth, ctx) {
      object(input, ['newEmail', 'currentPassword'], ['newEmail', 'currentPassword']);
      await authService.limit(ctx, String(auth.user._id), 'email-change', 5);
      const target = email(input.newEmail),
        current = await User.findById(auth.user._id).select('+passwordHash');
      if (!(await checkPassword(current.passwordHash, input.currentPassword))) throw new AppError(403, 'REAUTH_REQUIRED', 'Current password is incorrect');
      if (target === current.emailNormalized || (await User.exists({
        emailNormalized: target
      }))) throw new AppError(409, 'EMAIL_UNAVAILABLE', 'This email cannot be used');
      const code = String(randomInt(100000, 1000000)),
        challengeId = opaque();
      const challenge = {
        id: challengeId,
        hash: mac(config.auth.secret, 'emailChange:' + challengeId + ':' + code),
        newEmail: target,
        version: current.securityVersion,
        targetSessionId: auth.session._id,
        expiresAt: new Date(Date.now() + config.auth.otpTtlMs),
        sentAt: new Date(),
        attempts: 0,
        delivered: false
      };
      await update(auth, {
        'challenges.emailChange': challenge
      }, 'email_change_requested', ctx, {
        $or: [{
          'challenges.emailChange.sentAt': {
            $exists: false
          }
        }, {
          'challenges.emailChange.sentAt': {
            $lte: new Date(Date.now() - config.auth.resendMs)
          }
        }]
      });
      try {
        await mail.send({
          to: target,
          purpose: 'emailChange',
          code,
          ttlMinutes: Math.ceil(config.auth.otpTtlMs / 60000)
        });
        const delivered = await User.updateOne({
          _id: current._id,
          'challenges.emailChange.id': challengeId,
          securityVersion: current.securityVersion
        }, {
          $set: {
            'challenges.emailChange.delivered': true
          }
        });
        if (!delivered.matchedCount) throw new Error('Challenge changed');
      } catch {
        await User.updateOne({
          _id: current._id,
          'challenges.emailChange.id': challengeId
        }, {
          $unset: {
            'challenges.emailChange': 1
          }
        });
        throw new AppError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is unavailable; your email was not changed');
      }
      return {
        challengeId,
        message: 'Check the new email for a confirmation code'
      };
    },
    async confirm(input, auth, ctx) {
      object(input, ['challengeId', 'otp'], ['challengeId', 'otp']);
      if (typeof input.challengeId !== 'string' || input.challengeId.length > 100 || typeof input.otp !== 'string' || !/^\d{6}$/.test(input.otp)) throw invalid('Invalid confirmation');
      await authService.limit(ctx, String(auth.user._id), 'email-change-confirm', 10);
      const row = await User.findById(auth.user._id),
        c = row.challenges?.emailChange;
      if (!c?.newEmail) throw new AppError(422, 'INVALID_PROOF', 'Code is invalid, expired or already used');
      const filter = {
        'challenges.emailChange.id': input.challengeId,
        'challenges.emailChange.hash': mac(config.auth.secret, 'emailChange:' + input.challengeId + ':' + input.otp),
        'challenges.emailChange.delivered': true,
        'challenges.emailChange.expiresAt': {
          $gt: new Date()
        },
        'challenges.emailChange.attempts': {
          $lt: 5
        },
        'challenges.emailChange.targetSessionId': auth.session._id,
        'challenges.emailChange.version': auth.user.securityVersion
      };
      try {
        const changed = await User.findOneAndUpdate({
          _id: auth.user._id,
          status: 'active',
          securityVersion: auth.user.securityVersion,
          'auditOutbox.999': {
            $exists: false
          },
          ...filter
        }, {
          $set: {
            emailNormalized: c?.newEmail,
            emailVerifiedAt: new Date(),
            activeSessionId: null
          },
          $unset: {
            'challenges.emailChange': 1,
            'challenges.reset': 1,
            'challenges.transfer': 1
          },
          $inc: {
            securityVersion: 1
          },
          $push: {
            auditOutbox: event('email_changed', ctx)
          }
        }, {
          returnDocument: 'after',
          runValidators: true
        });
        if (!changed) {
          await User.updateOne({
            _id: row._id,
            'challenges.emailChange.id': input.challengeId,
            'challenges.emailChange.attempts': {
              $lt: 5
            }
          }, {
            $inc: {
              'challenges.emailChange.attempts': 1
            }
          });
          throw new AppError(422, 'INVALID_PROOF', 'Code is invalid, expired or already used');
        }
        await authService.flushAudit(changed);
        return {
          user: userDTO(changed),
          signInRequired: true
        };
      } catch (e) {
        if (e.code === 11000) throw new AppError(409, 'EMAIL_UNAVAILABLE', 'This email cannot be used');
        throw e;
      }
    }
  };
}
