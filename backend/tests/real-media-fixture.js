import net from 'node:net';
import { existsSync } from 'node:fs';
import { createScanner } from '../src/modules/media/inspection.js';
import { coachingFixture } from './coaching-fixture.js';

export const realMediaEnabled = process.env.KITSS_REAL_MEDIA_ACCEPTANCE === 'true';
export async function clamCommand(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: '127.0.0.1', port: Number(process.env.MEDIA_CLAMAV_PORT) });
    let reply = '';
    const timer = setTimeout(() => { socket.destroy(); reject(new Error('Local ClamAV command timed out')); }, 10000);
    socket.once('error', reject);
    socket.once('connect', () => socket.write('z' + command + '\0'));
    socket.on('data', chunk => { reply += chunk; if (reply.includes('\0')) { clearTimeout(timer); socket.destroy(); resolve(reply.replace(/\0.*$/s, '')); } });
    socket.once('close', () => { clearTimeout(timer); if (!reply.includes('\0')) reject(new Error('Local ClamAV closed without a complete response')); });
  });
}
export async function realMediaFixture(name) {
  if (!realMediaEnabled || !/^mongodb:\/\/127\.0\.0\.1:(?:27245\/kitss_stage15_local|27247\/kitss_stage17_local)$/.test(process.env.MONGODB_URI ?? '') || !/^kitss_stage10_(test|browser)_[a-f0-9]{16}$/.test(name ?? '')) throw new Error('Real media acceptance requires explicit opt-in and fresh guarded databases on the dedicated Stage 15/17 loopback instance');
  if (process.env.MEDIA_CLAMAV_ENABLED !== 'true' || Number(process.env.MEDIA_CLAMAV_PORT) !== 3315 || !existsSync(process.env.MEDIA_FFMPEG_PATH ?? '') || !existsSync(process.env.MEDIA_FFPROBE_PATH ?? '')) throw new Error('Installed real media tools and the task-local scanner must be explicitly configured');
  const version = await clamCommand('VERSION');
  if (!version.startsWith('ClamAV ') || !version.includes('/')) throw new Error('ClamAV with loaded official signatures is required');
  const scanner = createScanner({ enabled: true, port: 3315, scanTimeoutMs: 120000 });
  const scans = [];
  const f = await coachingFixture(name, { scanner: { configured: true, async scan(stream) { const result = await scanner.scan(stream); scans.push(result); return result; } } });
  return { ...f, scanner, scans, scannerVersion: version };
}
