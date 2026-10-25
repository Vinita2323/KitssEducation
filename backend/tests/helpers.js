import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { validateEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';

export const silentLogger = createLogger({ level: 'silent' });
export const testEnv = root => ({ NODE_ENV: 'test', MONGODB_URI: 'mongodb://127.0.0.1:27017/kitss_stage2_test?replicaSet=rs0', STORAGE_LOCAL_ROOT: root });

export async function tempDirectory(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kitss-stage2-'));
  t.after(async () => {
    const rel = path.relative(tmpdir(), root);
    if (!rel.startsWith('kitss-stage2-') || rel.includes(path.sep) || path.isAbsolute(rel)) throw new Error('Unsafe test cleanup target');
    await rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  });
  return root;
}

export async function testConfig(t, overrides = {}) {
  return validateEnv({ ...testEnv(await tempDirectory(t)), ...overrides });
}

export async function serve(t, app) {
  const server = http.createServer(app);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}
