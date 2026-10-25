import { PdfCanvas } from './PdfCanvas';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, List } from 'lucide-react';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
export function SecurePdfReader({
  bookId,
  courseId
}) {
  const {
    user
  } = useAuth();
  const [state, setState] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [zoom, setZoom] = useState(100),
    [toc, setToc] = useState(false);
  const suffix = courseId ? '?courseId=' + encodeURIComponent(courseId) : '';
  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    setError('');
    const load = async () => {
      try {
        const r = await httpClient.request('/me/books/' + bookId + '/state' + suffix, {
          signal: controller.signal
        });
        setState(r.data);
      } catch (e) {
        if (e.code !== 'ABORTED') {
          setState(null);
          setError(e.message);
        }
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [bookId, courseId, user?.id]);
  async function mutate(path, method, fields) {
    setBusy(true);
    setError('');
    try {
      setState(await authenticatedWrite('/me/books/' + bookId + path, {
        ...fields,
        expectedRevision: state.revision,
        ...(courseId ? {
          courseId
        } : {})
      }, method));
    } catch (e) {
      setError(e.message);
      try {
        setState((await httpClient.request('/me/books/' + bookId + '/state' + suffix)).data);
      } catch {
        setState(null);
      }
    } finally {
      setBusy(false);
    }
  }
  if (!state) return <div className="p-6 bg-white rounded-2xl border space-y-3" role={error ? 'alert' : 'status'}><h1 className="font-bold text-[#0A1D3F]">{error ? 'Book unavailable' : 'Loading secure PDF…'}</h1>{error && <p>{error}</p>}<Link to={courseId ? '/coaching/' + courseId + '/dashboard' : '/my-books'}>Back to library</Link></div>;
  return <div className="w-full h-full overflow-y-auto max-w-7xl mx-auto space-y-3 min-w-0 p-3 sm:p-4">
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-xl border border-[#E6E8EC]">
      <Link aria-label="Back to library" to={courseId ? '/coaching/' + courseId + '/dashboard' : '/my-books'}><ArrowLeft size={20} /></Link>
      <h1 className="font-bold text-[#0A1D3F] basis-full sm:basis-auto order-first sm:order-none sm:flex-1 min-w-0 break-words">{state.title}</h1>
      <button aria-label="Contents and bookmarks" onClick={() => setToc(!toc)} className="p-2"><List size={18} /></button>
      <button aria-label="Previous page" disabled={busy || state.currentPage <= 1} onClick={() => mutate('/progress', 'PUT', {
        currentPage: state.currentPage - 1
      })} className="p-2 disabled:opacity-40"><ChevronLeft size={18} /></button>
      <label className="text-xs flex gap-1 items-center">Page <input aria-label="PDF page" type="number" key={state.currentPage} defaultValue={state.currentPage} min="1" max={state.pageCount} disabled={busy} onBlur={e => {
          const page = Number(e.target.value);
          if (Number.isInteger(page) && page >= 1 && page <= state.pageCount && page !== state.currentPage) mutate('/progress', 'PUT', {
            currentPage: page
          });
        }} className="w-14 border rounded p-1" /> / {state.pageCount}</label>
      <button aria-label="Next page" disabled={busy || state.currentPage >= state.pageCount} onClick={() => mutate('/progress', 'PUT', {
        currentPage: state.currentPage + 1
      })} className="p-2 disabled:opacity-40"><ChevronRight size={18} /></button>
      <button aria-label="Toggle bookmark" aria-pressed={state.bookmarkPages.includes(state.currentPage)} disabled={busy} onClick={() => mutate('/bookmarks/' + state.currentPage, state.bookmarkPages.includes(state.currentPage) ? 'DELETE' : 'PUT', {})} className="p-2"><Bookmark size={18} fill={state.bookmarkPages.includes(state.currentPage) ? '#FF8A00' : 'none'} /></button>
      <button aria-label="Zoom out" onClick={() => setZoom(v => Math.max(50, v - 10))} className="p-2"><ZoomOut size={18} /></button><span className="text-xs">{zoom}%</span><button aria-label="Zoom in" onClick={() => setZoom(v => Math.min(200, v + 10))} className="p-2"><ZoomIn size={18} /></button>
    </div>
    {error && <p role="alert" className="p-3 bg-amber-50 border rounded-xl">{error}</p>}
    {toc && <aside className="bg-white border rounded-xl p-3 flex flex-wrap gap-3"><h2 className="font-bold w-full">Contents and bookmarks</h2>{state.toc.map((item, i) => <button disabled={busy} key={i} onClick={() => mutate('/progress', 'PUT', {
        currentPage: item.page
      })}>{item.title} · {item.page}</button>)}{state.bookmarkPages.map(page => <button disabled={busy} key={'b' + page} onClick={() => mutate('/progress', 'PUT', {
        currentPage: page
      })}>Bookmark {page}</button>)}{!state.toc.length && !state.bookmarkPages.length && <p>No contents or bookmarks yet.</p>}</aside>}
    <PdfCanvas title="Secure book PDF" url={state.contentUrl} pageCount={state.pageCount} page={state.currentPage} zoom={zoom}/>
    <p className="text-xs text-[#667085]">{state.percentage}% read. Page controls above save your place. Use the bookmark and contents controls to resume on another device.</p>
  </div>;
}
