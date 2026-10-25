import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { AppError } from '../../utils/AppError.js';

// Validate ISO BMFF framing incrementally, without buffering media payloads.
export async function validateMp4(storage, key) {
  const { stream, metadata } = await storage.getFile({ key });
  let header = Buffer.alloc(0), remaining = 0, offset = 0;
  const seen = new Set();
  try {
    for await (const chunk of stream) {
      let at = 0;
      while (at < chunk.length) {
        if (remaining) { const n = Math.min(remaining, chunk.length - at); remaining -= n; at += n; offset += n; continue; }
        const need = header.length >= 8 && header.readUInt32BE(0) === 1 ? 16 : 8;
        const n = Math.min(need - header.length, chunk.length - at);
        header = Buffer.concat([header, chunk.subarray(at, at + n)]); at += n; offset += n;
        if (header.length < need || need === 8 && header.readUInt32BE(0) === 1) continue;
        const size = need === 16 ? Number(header.readBigUInt64BE(8)) : header.readUInt32BE(0);
        const type = header.toString('ascii', 4, 8);
        if (!Number.isSafeInteger(size) || size < need || offset - need + size > metadata.bytes) throw new Error('Framing');
        if (!seen.size && type !== 'ftyp' || type === 'mdat' && !seen.has('moov')) throw new Error('Fast start MP4 required');
        seen.add(type); remaining = size - need; header = Buffer.alloc(0);
      }
    }
    if (remaining || header.length || !['ftyp', 'moov', 'mdat'].every(t => seen.has(t))) throw new Error('Incomplete MP4');
  } catch { throw new AppError(415, 'INVALID_VIDEO', 'Upload a complete fast-start MP4 (H.264 and optional AAC audio)'); }
}

async function run(storage, key, command, args, timeout) {
  const { stream } = await storage.getFile({ key });
  const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let timedOut = false, size = 0, stderr = 0;
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeout);
  const chunks = [];
  const exit = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', code => code === 0 && !timedOut ? resolve() : reject(new Error('Inspection failed'))); });
  const read = (async () => { for await (const chunk of child.stdout) { size += chunk.length; if (size > 65536) throw new Error('Output limit'); chunks.push(chunk); } })();
  const errors = (async () => { for await (const chunk of child.stderr) { stderr += chunk.length; if (stderr > 65536) throw new Error('Error output limit'); } })();
  try {
    await Promise.all([exit, read, errors, pipeline(stream, child.stdin)]);
    return Buffer.concat(chunks).toString('utf8');
  } catch (error) {
    child.kill(); stream.destroy();
    throw new AppError(error.code === 'ENOENT' ? 503 : 415, error.code === 'ENOENT' ? 'VIDEO_INSPECTION_UNAVAILABLE' : 'INVALID_VIDEO', error.code === 'ENOENT' ? 'Configure installed FFprobe and FFmpeg before uploading video' : 'Video inspection or complete decode failed');
  } finally { clearTimeout(timer); }
}

let inspecting = 0;
export async function inspectVideo(storage, key, config = {}) {
  if (inspecting >= 2) throw new AppError(429, 'VIDEO_INSPECTION_BUSY', 'Video inspection is busy; retry this upload later');
  inspecting++;
  try { return await inspect(storage, key, config); } finally { inspecting--; }
}

async function inspect(storage, key, config) {
  await validateMp4(storage, key);
  const output = await run(storage, key, config.ffprobe || 'ffprobe', ['-v', 'error', '-max_alloc', '67108864', '-threads', '1', '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-count_packets', '-show_streams', '-show_format', '-of', 'json'], config.videoInspectionTimeoutMs ?? 120000);
  let probe;
  try { probe = JSON.parse(output); } catch { throw new AppError(415, 'INVALID_VIDEO', 'Invalid video metadata'); }
  const streams = probe.streams ?? [], videos = streams.filter(s => s.codec_type === 'video'), audio = streams.filter(s => s.codec_type === 'audio');
  const v = videos[0], duration = Number(probe.format?.duration), rate = String(v?.avg_frame_rate).split('/').map(Number);
  if (!['isom','iso2','iso5','iso6','mp41','mp42','avc1'].includes(probe.format?.tags?.major_brand) || videos.length !== 1 || audio.length > 1 || streams.length !== videos.length + audio.length || v.codec_name !== 'h264' || v.pix_fmt !== 'yuv420p' || !['Baseline', 'Constrained Baseline', 'Main', 'High'].includes(v.profile) || v.level > 42 || !v.width || !v.height || v.width > 1920 || v.height > 1080 || !Number.isFinite(rate[0] / rate[1]) || rate[0] / rate[1] > 60 || !Number.isFinite(duration) || duration <= 0 || duration > 7200 || audio.some(a => a.codec_name !== 'aac' || a.channels > 2 || !['LC'].includes(a.profile))) throw new AppError(415, 'UNSUPPORTED_VIDEO', 'Use fast-start MP4, H.264 8-bit 4:2:0 up to 1080p/60fps/level 4.2, optional stereo AAC-LC, maximum two hours');
  // Probe metadata alone cannot certify that all packets decode successfully.
  await run(storage, key, config.ffmpeg || 'ffmpeg', ['-v', 'error', '-max_alloc', '67108864', '-xerror', '-err_detect', 'explode', '-threads', '1', '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-map', '0:v:0', '-map', '0:a?', '-f', 'null', '-'], config.videoInspectionTimeoutMs ?? 120000);
  return { mime: 'video/mp4', width: v.width, height: v.height, durationSeconds: duration, videoCodec: 'h264', audioCodec: audio.length ? 'aac' : null, inspectionVersion: 'mp4-h264-aac-v1' };
}
