import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { Readable } from 'node:stream';
import { createScanner } from '../src/modules/media/inspection.js';

test('scanner absolute deadline interrupts a stalled input, even with socket traffic', { timeout: 10000 }, async t => {
  const sockets = new Set(); let closing = false;
  const server = net.createServer(socket => {
    if (closing) { socket.destroy(); return; }
    sockets.add(socket); socket.on('error', () => {});
    const traffic = setInterval(() => socket.write(' '), 10);
    socket.once('close', () => { clearInterval(traffic); sockets.delete(socket); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { closing = true; await new Promise(resolve => { server.close(resolve); for (const socket of sockets) socket.destroy(); }); });
  const stream = new Readable({ read() {} });
  const start = Date.now();
  assert.equal(await createScanner({ enabled: true, port: server.address().port, scanTimeoutMs: 100 }).scan(stream), 'error');
  assert.equal(stream.destroyed, true);
  assert.ok(Date.now() - start < 2000);
});
