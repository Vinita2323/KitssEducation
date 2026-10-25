import React, { useEffect, useRef, useState } from 'react';
import { coachingService } from '../../services/coachingService';

export function LessonVideo({ courseId, lesson, canSave }) {
  const element = useRef(null), busy = useRef(false), lastSave = useRef(0), lastPosition = useRef(-1);
  const lifecycle = useRef(null), completionPending = useRef(false);
  const [state, setState] = useState('Loading video…'), [error, setError] = useState(''), [saveError, setSaveError] = useState('');
  const [rate, setRate] = useState('1');
  const video = lesson.video;
  const save = async (ended = false) => {
    const player = element.current;
    const signal = lifecycle.current?.signal;
    if (!canSave || !player || !Number.isFinite(player.currentTime) || !signal || signal.aborted) return;
    if (busy.current) { if (ended) completionPending.current = true; return; }
    const position = Math.min(player.currentTime, video.durationSeconds);
    if (!ended && (Date.now() - lastSave.current < 5000 || Math.abs(position - lastPosition.current) < 1)) return;
    busy.current = true; lastSave.current = Date.now();
    try { await coachingService.saveVideoProgress(courseId, lesson.id, video, position, ended, signal); lastPosition.current = position; if (!signal.aborted) setSaveError(''); }
    catch (e) { if (!signal.aborted) setSaveError('Progress was not saved: ' + e.message); }
    finally { busy.current = false; if (completionPending.current && !signal.aborted) { completionPending.current = false; save(true); } }
  };
  useEffect(() => {
    const controller = new AbortController(); lifecycle.current = controller;
    const tick = setInterval(() => { if (!element.current?.paused) save(); }, 15000);
    const hide = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', hide);
    return () => { controller.abort(); clearInterval(tick); document.removeEventListener('visibilitychange', hide); };
  }, [courseId, lesson.id, video.assetId, canSave]);
  return <div className="space-y-2 min-w-0">
    <video ref={element} aria-label={'Lesson video: ' + lesson.title} controls playsInline preload="metadata"
      className="w-full aspect-video bg-black rounded-xl" src={video.url}
      onLoadedMetadata={e => { const p = lesson.progress; if (String(p?.videoAssetId) === video.assetId && p.positionSeconds > 0) e.currentTarget.currentTime = Math.min(p.positionSeconds, video.durationSeconds); setState('Ready'); }}
      onPlaying={() => setState('Playing')} onWaiting={() => setState('Buffering…')}
      onPause={() => { setState('Paused'); save(); }} onEnded={() => { setState('Completed'); save(true); }}
      onError={() => { setError('Video could not be played. Access may have changed, or the connection was interrupted. Reload to check your access and retry.'); setState(''); }} />
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label>Playback speed <select aria-label="Playback speed" className="p-1 border rounded-lg" value={rate} onChange={e => { setRate(e.target.value); if(element.current) element.current.playbackRate = Number(e.target.value); }}>{['0.5','0.75','1','1.25','1.5','2'].map(v => <option key={v} value={v}>{v}×</option>)}</select></label>
      {state && <span role="status">{state}</span>}
      {canSave && <button type="button" className="p-1 border rounded-lg" onClick={() => save()}>Save playback position</button>}
    </div>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    {saveError && <p role="alert" className="text-xs text-red-700">{saveError}</p>}
  </div>;
}
