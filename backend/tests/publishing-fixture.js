import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { createAuthModels } from '../src/modules/auth/auth.models.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';
import { createInstitutionService } from '../src/modules/institutions/institutions.service.js';
import { createPublishingModule } from '../src/modules/publishing/index.js';
import { LocalStorageProvider } from '../src/storage/LocalStorageProvider.js';
import { opaque, digest, hashPassword } from '../src/modules/auth/security.js';
import { createApp } from '../src/app.js';

export async function publishingFixture(dbName, { actual = false, scanner, mail } = {}) {
  if (!actual && !/^kitss_stage(?:[5-9]|10)_(?:test|browser)_[a-f0-9]{16}$/.test(dbName)) throw new Error('Fresh publishing-family test DB name required');
  const config = loadConfig(), logger = createLogger({ level: 'silent' });
  if (actual && (config.nodeEnv !== 'development' || !/dev|development|local|test/i.test(config.mongo.dbName ?? new URL(config.mongo.uri).pathname))) throw new Error('Actual database is not clearly development');
  const connection = mongoose.createConnection(config.mongo.uri, { ...(!actual ? { dbName } : config.mongo.dbName ? { dbName: config.mongo.dbName } : {}), autoIndex: false, serverSelectionTimeoutMS: 30000 });
  try { await connection.asPromise(); } catch (error) { await connection.close().catch(() => {}); throw error; }
  console.info('Stage 5 fixture: database connected');
  if (!actual && (await connection.db.listCollections({}, { nameOnly: true }).toArray()).length) { await connection.close(); throw new Error('Refuse existing test database'); }
  let root;
  try {
  root = actual ? config.storage.root : await mkdtemp(path.join(os.tmpdir(), 'kitss-stage5-'));
  const storage = new LocalStorageProvider({ ...config.storage, root }); await storage.initialize();
  const authModels = createAuthModels(connection), institutionModels = createInstitutionModels(connection);
  const auth = await createAuthService({ models: authModels, config, logger, mail: mail ?? { configured: false, send: async () => { throw new Error('No real mail'); } } }); await auth.initialize();
  console.info('Stage 5 fixture: authentication indexes ready');
  const institutions = createInstitutionService({ models: institutionModels, authService: auth, config, logger }); await institutions.initialize();
  console.info('Stage 5 fixture: institution indexes ready');
  const publishing = await createPublishingModule({ connection, institutionService: institutions, authService: auth, storage, config, logger, scanner });
  console.info('Stage 5 fixture: publishing/media indexes ready');
  const fixtureUser = async (roles = ['super_admin'], permissions = []) => {
    const user = await authModels.User.create({ publicId: 'STAGE5_DEV_VERIFY_' + randomUUID(), name: 'STAGE5_DEV_VERIFY_TEST_ACTOR', emailNormalized: randomUUID() + '@example.invalid', passwordHash: await hashPassword(opaque()), roles, permissions, status: 'active', emailVerifiedAt: new Date() });
    const token = opaque(), session = await authModels.Session.create({ _id: randomUUID(), tokenHash: digest(token), userId: user._id, kind: roles.includes('student') ? 'student' : 'admin', securityVersion: 0, expiresAt: new Date(Date.now() + 3600000), lastSeenAt: new Date() });
    if (roles.includes('student')) await authModels.User.updateOne({ _id: user._id }, { $set: { activeSessionId: session._id, activeSessionExpiresAt: session.expiresAt } });
    return { user, session, token, auth: { user, session } };
  };
  const models = { ...authModels, ...institutionModels, ...publishing.models };
  return { config, connection, logger, storage, auth, institutions, ...publishing, fixtureUser, models, ctx: { actorId: 'isolated-test-fixture', requestId: randomUUID(), ip: 'isolated' }, app: () => createApp({ config, logger, database: { isReady: async () => true }, storage, authService: auth, institutionService: institutions, publishingModule: publishing }),
    async close() { if (actual) throw new Error('Actual verification records must be retained; close the connection explicitly'); try { for (const Model of Object.values(models)) { const ids = (await Model.find({}, { _id: 1 }).lean()).map(r => r._id); if (ids.length) await Model.deleteMany({ _id: { $in: ids } }); } } finally { await connection.close(); const resolved = path.resolve(root); if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(root).startsWith('kitss-stage5-')) throw new Error('Unsafe test cleanup path'); await rm(root, { recursive: true, force: true }); } } };
  } catch (error) { await connection.close().catch(() => {}); if (!actual && root && path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(root).startsWith('kitss-stage5-')) await rm(root, { recursive: true, force: true }); throw error; }
}
export async function pdfBytes(pages = 3, title = 'Isolated Stage 5 fixture') { const doc = await PDFDocument.create(); for (let i = 0; i < pages; i++) doc.addPage().drawText(title + ' ' + (i + 1), { x: 30, y: 700, size: 18 }); return Buffer.from(await doc.save()); }
export const imageBytes = () => sharp({ create: { width: 40, height: 60, channels: 3, background: '#0a1d3f' } }).png().toBuffer();
export const fakeCleanScanner = { configured: true, async scan(stream) { for await (const _ of stream) { /* isolated test fake; never used by application startup */ } return 'clean'; } };
