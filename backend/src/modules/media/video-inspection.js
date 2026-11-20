import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { AppError } from '../../utils/AppError.js';

// Messages shown to the admin who uploads a video, in plain words: what is wrong, then how to fix it.
// The admin panel shows each line on its own line.
const HOW_TO_FIX = [
  'How to fix it:',
  '1. Install HandBrake (free, from handbrake.fr) and open this video in it.',
  '2. Choose the preset "Fast 1080p30" and tick "Web Optimized".',
  '3. Click Start, then upload the new video file it creates.',
].join('\n');
const structureMessages = {
  'not-mp4': 'This file is not a real MP4 video, even though its name ends in .mp4.\n' + HOW_TO_FIX,
  'not-fast-start': 'This video is not ready for the website yet. It plays on your computer, but it was saved in a way that cannot play online.\n' + HOW_TO_FIX,
  damaged: 'This video file is broken or incomplete. It may not have finished downloading or saving.\nHow to fix it: download or export the video again, then upload the new file.',
};
// Lists every format rule the video breaks, in plain words (same rules as before, one line per problem).
export function videoProblems(probe) {
  const streams = probe.streams ?? [], videos = streams.filter(s => s.codec_type === 'video'), audio = streams.filter(s => s.codec_type === 'audio');
  const v = videos[0], duration = Number(probe.format?.duration), rate = String(v?.avg_frame_rate).split('/').map(Number), fps = rate[0] / rate[1];
  const problems = [];
  if (!['isom','iso2','iso5','iso6','mp41','mp42','avc1'].includes(probe.format?.tags?.major_brand)) problems.push('It is an iPhone/QuickTime (MOV) type of file, not a standard MP4.');
  if (!videos.length) problems.push('It has no picture, only sound.');
  if (videos.length > 1) problems.push('It has more than one video track.');
  if (audio.length > 1) problems.push('It has more than one sound track.');
  if (streams.length !== videos.length + audio.length) problems.push('It has extra tracks, such as subtitles.');
  if (v) {
    if (v.codec_name !== 'h264') problems.push(v.codec_name === 'hevc' ? 'It is recorded in HEVC (H.265), the space-saving format used by iPhones and many new phones.' : `It uses the ${String(v.codec_name || 'unknown').toUpperCase()} video format, which is not supported.`);
    else if (!['Baseline', 'Constrained Baseline', 'Main', 'High'].includes(v.profile) || v.level > 42) problems.push('Its video settings are too advanced for playing online.');
    if (v.pix_fmt !== 'yuv420p') problems.push('It uses HDR or 10-bit colour.');
    if (!v.width || !v.height) problems.push('Its picture size could not be read.');
    else if (v.width > 1920 || v.height > 1080) problems.push(`It is too large (${v.width} x ${v.height}). The maximum is Full HD, 1920 x 1080.`);
    if (!Number.isFinite(fps)) problems.push('Its frame rate could not be read.');
    else if (fps > 60) problems.push(`It has ${Math.round(fps)} frames per second. The maximum is 60.`);
  }
  if (!Number.isFinite(duration) || duration <= 0) problems.push('Its length could not be read.');
  else if (duration > 7200) problems.push(`It is ${Math.round(duration / 60)} minutes long. The maximum is 2 hours, so split it into shorter videos.`);
  for (const a of audio) {
    if (a.codec_name !== 'aac') problems.push(`Its sound is in ${String(a.codec_name || 'an unknown').toUpperCase()} format, which is not supported.`);
    else if (a.profile !== 'LC') problems.push('Its sound settings are not supported.');
    if (a.channels > 2) problems.push('It has surround sound (more than 2 channels).');
  }
  return problems;
}

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
        if (!Number.isSafeInteger(size) || size < need || offset - need + size > metadata.bytes) throw new Error('damaged');
        if (!seen.size && type !== 'ftyp') throw new Error('not-mp4');
        if (type === 'mdat' && !seen.has('moov')) throw new Error('not-fast-start');
        seen.add(type); remaining = size - need; header = Buffer.alloc(0);
      }
    }
    if (remaining || header.length || !['ftyp', 'moov', 'mdat'].every(t => seen.has(t))) throw new Error('damaged');
  } catch (error) { throw new AppError(415, 'INVALID_VIDEO', structureMessages[error.message] || structureMessages.damaged); }
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
    if (error.code === 'ENOENT') throw new AppError(503, 'VIDEO_INSPECTION_UNAVAILABLE', 'Video checking is not set up on this server: FFmpeg and FFprobe must be installed before videos can be uploaded. Ask your technical administrator.');
    throw new AppError(415, 'INVALID_VIDEO', timedOut ? 'Checking this video took too long. Use a shorter video, or convert it to Full HD first.\n' + HOW_TO_FIX : 'This video could not be played during checking. The file may be damaged or only partly saved.\n' + HOW_TO_FIX);
  } finally { clearTimeout(timer); }
}

let inspecting = 0;
export async function inspectVideo(storage, key, config = {}) {
  if (inspecting >= 2) throw new AppError(429, 'VIDEO_INSPECTION_BUSY', 'Two videos are already being checked. Wait a minute, then upload this video again.');
  inspecting++;
  try { return await inspect(storage, key, config); } finally { inspecting--; }
}

async function inspect(storage, key, config) {
  await validateMp4(storage, key);
  const output = await run(storage, key, config.ffprobe || 'ffprobe', ['-v', 'error', '-max_alloc', '67108864', '-threads', '1', '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-count_packets', '-show_streams', '-show_format', '-of', 'json'], config.videoInspectionTimeoutMs ?? 120000);
  let probe;
  try { probe = JSON.parse(output); } catch { throw new AppError(415, 'INVALID_VIDEO', 'The details of this video could not be read.\n' + HOW_TO_FIX); }
  const streams = probe.streams ?? [], videos = streams.filter(s => s.codec_type === 'video'), audio = streams.filter(s => s.codec_type === 'audio');
  const v = videos[0], duration = Number(probe.format?.duration), rate = String(v?.avg_frame_rate).split('/').map(Number);
  const problems = videoProblems(probe);
  if (problems.length) throw new AppError(415, 'UNSUPPORTED_VIDEO', 'This video cannot be used because:\n' + problems.map(problem => '- ' + problem).join('\n') + '\n' + HOW_TO_FIX);
  // Probe metadata alone cannot certify that all packets decode successfully.
  await run(storage, key, config.ffmpeg || 'ffmpeg', ['-v', 'error', '-max_alloc', '67108864', '-xerror', '-err_detect', 'explode', '-threads', '1', '-protocol_whitelist', 'pipe', '-i', 'pipe:0', '-map', '0:v:0', '-map', '0:a?', '-f', 'null', '-'], config.videoInspectionTimeoutMs ?? 120000);
  return { mime: 'video/mp4', width: v.width, height: v.height, durationSeconds: duration, videoCodec: 'h264', audioCodec: audio.length ? 'aac' : null, inspectionVersion: 'mp4-h264-aac-v1' };
}
