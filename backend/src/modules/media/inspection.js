import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { pipeline } from 'node:stream/promises';
import { AppError } from '../../utils/AppError.js';

export async function probeFile(storage, key, mime) {
  const file = await storage.getFile({ key });
  const child = spawn(process.execPath, ['--max-old-space-size=160', fileURLToPath(new URL('./probe-worker.js', import.meta.url)), mime], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
  const timer = setTimeout(() => child.kill(), 15000);
  let size = 0; const chunks = [];
  try {
    const output = (async () => { for await (const chunk of child.stdout) { size += chunk.length; if (size > 15 * 1024 * 1024) { child.kill(); throw new Error('Output limit'); } chunks.push(chunk); } })();
    const closed = once(child, 'close');
    await Promise.all([pipeline(file.stream, child.stdin), output]);
    const [code] = await closed; if (code !== 0) throw new Error('Invalid media');
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch { child.kill(); file.stream.destroy(); throw new AppError(415, 'INVALID_MEDIA', 'File signature, format or safe-content validation failed'); }
  finally { clearTimeout(timer); }
}

export function createScanner(config = {}) {
  return {
    configured: config.enabled === true,
    async scan(stream) {
      if (!config.enabled) { stream.destroy(); return 'pending'; }
      const socket = net.createConnection({ host: '127.0.0.1', port: config.port ?? 3310 });
      let response = ''; let resolved = false, deadline;
      const timeoutMs = config.scanTimeoutMs ?? 20000;
      const maxBytes = Math.max(config.videoMaxBytes ?? 268435456, 52428800);
      let bytes = 0;
      const result = new Promise(resolve => {
        const finish = value => { if (resolved) return; resolved = true; clearTimeout(deadline); stream.destroy(); resolve(value); socket.destroy(); };
        deadline = setTimeout(() => finish('error'), timeoutMs);
        socket.setTimeout(timeoutMs, () => finish('error'));
        socket.on('error', () => finish('error'));
        socket.on('close', () => finish('error'));
        socket.on('data', chunk => { response += chunk.toString(); if (response.length > 4096) return finish('error'); if (response.includes('\0')) finish(/^stream: OK\0$/.test(response) ? 'clean' : response.includes(' FOUND\0') ? 'infected' : 'error'); });
      });
      try {
        await Promise.race([once(socket, 'connect'), result.then(() => { throw new Error('Unavailable'); })]);
        socket.write('zINSTREAM\0');
        for await (const chunk of stream) { bytes += chunk.length; if (bytes > maxBytes) throw new Error('Scan size limit'); const header = Buffer.alloc(4); header.writeUInt32BE(chunk.length); if (!socket.write(Buffer.concat([header, chunk]))) await Promise.race([once(socket, 'drain'), result.then(() => { throw new Error('Closed'); })]); }
        socket.write(Buffer.alloc(4)); return await result;
      } catch { socket.destroy(); return await result; } finally { clearTimeout(deadline); stream.destroy(); }
    },
  };
}
