import mongoose from 'mongoose';
export function createFcmTokenModel(connection) {
  const { Schema } = mongoose;
  const schema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    token: { type: String, required: true, select: false, maxlength: 4096 },
    sessionId: { type: String, required: true }, securityVersion: { type: Number, required: true },
    platform: { type: String, enum: ['web'], default: 'web' },
    deviceLabel: { type: String, maxlength: 100, default: '' }, lastSeenAt: Date,
  }, { timestamps: true, strict: 'throw', bufferCommands: false, writeConcern: { w: 1, j: true } });
  schema.index({ token: 1 }, { unique: true, name: 'unique_push_device' });
  return connection.models.FcmToken ?? connection.model('FcmToken', schema, 'fcmTokens');
}
