import mongoose from 'mongoose';

// Embedded challenges allow proof consumption and the authorized identity change
// to commit in ONE document on standalone MongoDB. TTL is never authorization.
export function createAuthModels(connection) {
  const { Schema } = mongoose;
  const challenge = new Schema({ id: String, hash: String, expiresAt: Date, attempts: { type: Number, default: 0 },
    sentAt: Date, delivered: { type: Boolean, default: false }, targetSessionId: String,
    version: Number, rememberMe: Boolean, newEmail: String }, { _id: false });
  const event = new Schema({ id: String, action: String, actorId: String, requestId: String, permissionChange: { before: [String], after: [String] }, reason: { type: String, maxlength: 500 }, at: Date }, { _id: false });
  const userSchema = new Schema({
    publicId: { type: String, required: true, unique: true }, name: { type: String, required: true, maxlength: 100 },
    emailNormalized: { type: String, required: true, unique: true }, passwordHash: { type: String, select: false },
    roles: { type: [String], enum: ['student', 'admin', 'super_admin'], required: true },
    permissions: { type: [String], default: [] }, status: { type: String, enum: ['pending', 'active', 'suspended', 'archived'], default: 'pending' },
    emailVerifiedAt: Date, passwordChangedAt: Date, lastLoginAt: Date, securityVersion: { type: Number, default: 0 },
    activeSessionId: { type: String, default: null }, activeSessionExpiresAt: Date,
    phone: String, profile: { board: String, class: String },
    preferences: { notification: { examAlerts: { type: Boolean, default: true }, courseUpdates: { type: Boolean, default: true }, promoAlerts: { type: Boolean, default: false } }, courseSelector: { boardId: String, classId: String, stateId: String, languageId: String, subjectId: String } },
    challenges: { verify: challenge, reset: challenge, transfer: challenge, invite: challenge, emailChange: challenge },
    auditOutbox: { type: [event], default: [] }, bootstrapKey: String, adminRevision: { type: Number, default: 0 },
  }, { timestamps: true, strict: 'throw', bufferCommands: false });
  userSchema.index({ bootstrapKey: 1 }, { unique: true, sparse: true });
  for (const purpose of ['verify', 'reset', 'transfer', 'invite', 'emailChange']) userSchema.index({ [`challenges.${purpose}.id`]: 1 }, { sparse: true });
  const sessionSchema = new Schema({
    _id: String, tokenHash: { type: String, unique: true, required: true }, userId: { type: Schema.Types.ObjectId, required: true, index: true },
    kind: { type: String, enum: ['student', 'admin'] }, deviceLabel: String,
    securityVersion: Number, expiresAt: { type: Date, required: true }, lastSeenAt: Date, revokedAt: Date,
  }, { timestamps: true, bufferCommands: false });
  sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const throttleSchema = new Schema({ _id: String, count: Number, expiresAt: Date }, { versionKey: false, bufferCommands: false });
  throttleSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const auditSchema = new Schema({ _id: String, action: String, actorId: String, subjectId: String, requestId: String, permissionChange: { before: [String], after: [String] }, reason: { type: String, maxlength: 500 }, at: Date }, { versionKey: false, bufferCommands: false });
  const model = (name, schema) => connection.models[name] ?? connection.model(name, schema);
  return { User: model('User', userSchema), Session: model('Session', sessionSchema),
    AuthThrottle: model('AuthThrottle', throttleSchema), AuditLog: model('AuditLog', auditSchema) };
}
