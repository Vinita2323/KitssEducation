import net from 'node:net';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { statfs } from 'node:fs/promises';
const exec = promisify(execFile);

export async function scannerReadiness(config) {
  if (!config.enabled) return { enabled:false,ready:false,status:'disabled_uploads_blocked' };
  return new Promise(resolve => {
    const socket = net.createConnection({ host:'127.0.0.1',port:config.port });
    let data='',done=false;
    const finish = result => { if(done)return;done=true;clearTimeout(timer);socket.destroy();resolve(result); };
    const timer=setTimeout(()=>finish({enabled:true,ready:false,status:'unavailable'}),1500);
    socket.on('error',()=>finish({enabled:true,ready:false,status:'unavailable'}));
    socket.on('close',()=>finish({enabled:true,ready:false,status:'unavailable'}));
    socket.on('connect',()=>socket.write('zVERSION\0'));
    socket.on('data',chunk=>{
      data+=chunk.toString();
      if(data.length>1024)return finish({enabled:true,ready:false,status:'invalid_response'});
      if(!data.includes('\0'))return;
      const match=/^ClamAV ([\d.]+)\/(\d+)\/(.+)\0/.exec(data);
      const stamp=match ? Date.parse(match[3]) : NaN;
      const ageDays=Number.isFinite(stamp)?Math.max(0,(Date.now()-stamp)/86400000):null;
      finish({enabled:true,ready:Boolean(match && ageDays!==null && ageDays<=7),status:!match?'invalid_response':ageDays===null||ageDays>7?'signatures_stale':'ready',...(match?{engine:match[1],signatureAgeDays:ageDays}: {})});
    });
  });
}

export async function processorReadiness(binary) {
  try { const {stdout}=await exec(binary,['-version'],{windowsHide:true,timeout:3000,maxBuffer:65536});const version=/^(?:ffmpeg|ffprobe) version ([A-Za-z0-9._-]+)/.exec(stdout)?.[1];return {ready:Boolean(version),...(version?{version}:{})}; }
  catch { return {ready:false}; }
}

export function createOperationalDiagnostics({config,database,storage,workers=()=>[]}) {
  let cached,until=0;
  return async () => {
    if(cached && Date.now()<until)return cached;
    const safe=async fn=>{try{return await fn();}catch{return false;}};
    const [mongo,files,scanner,ffmpeg,ffprobe,disk]=await Promise.all([safe(()=>database.isReady()),safe(()=>storage.isReady()),scannerReadiness(config.media),processorReadiness(config.media.ffmpeg),processorReadiness(config.media.ffprobe),safe(()=>statfs(storage.root))]);
    cached={asOf:new Date(),database:{ready:mongo===true},storage:{ready:files===true,...(disk?{freeBytes:disk.bavail*disk.bsize}: {})},scanner,processors:{ffmpeg,ffprobe},workers:workers(),uploadSafety:scanner.ready && ffmpeg.ready && ffprobe.ready?'ready':'blocked_or_degraded'};
    until=Date.now()+2000;
    return cached;
  };
}
