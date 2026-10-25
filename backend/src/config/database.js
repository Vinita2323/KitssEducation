import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export function createDatabase(config, logger, { connection = mongoose.createConnection() } = {}) {
  // Never log raw driver errors: they can include the credential-bearing URI.
  connection.on('error', () => logger.error({ event: 'database_error' }, 'Database unavailable'));
  connection.on('disconnected', () => logger.warn({ event: 'database_disconnected' }, 'Database disconnected'));
  return {
    connection,
    async connect() {
      try {
        const { uri, requireReplicaSet, ...options } = config;
        await connection.openUri(uri, { ...options, bufferCommands: false, autoIndex: false });
        if (requireReplicaSet) {
          const hello = await connection.db.admin().command({ hello: 1 }, { timeoutMS: config.serverSelectionTimeoutMS });
          if (!hello.setName) throw new Error('Replica set required');
        }
        logger.info({ event: 'database_connected' }, 'Database connected');
      } catch {
        await connection.close().catch(() => {});
        throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database connection or replica-set validation failed');
      }
    },
    async isReady() {
      if (connection.readyState !== 1 || !connection.db) return false;
      try {
        await connection.db.admin().command({ ping: 1 }, { timeoutMS: config.serverSelectionTimeoutMS });
        return true;
      } catch { return false; }
    },
    async disconnect() { await connection.close(); },
  };
}
