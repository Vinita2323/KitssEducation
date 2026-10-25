import React, { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './pdf-text-layer.css';

// Vite emits the pinned renderer's resources locally, with hashed asset URLs.
// A strict filename map avoids external font/CMap/decoder fetches from PDFs.
const packagedAssets = new Map(Object.entries({
  ...import.meta.glob('/node_modules/pdfjs-dist/cmaps/*.bcmap', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('/node_modules/pdfjs-dist/standard_fonts/*', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('/node_modules/pdfjs-dist/wasm/*', { eager: true, query: '?url', import: 'default' }),
}).map(([name, asset]) => [name.split('/').at(-1), asset]));
async function packagedData(filename) {
  const asset = packagedAssets.get(filename);
  if (!asset) throw new Error('Packaged PDF resource is unavailable');
  const response = await fetch(asset, { credentials: 'same-origin', redirect: 'error' });
  if (!response.ok) throw new Error('Packaged PDF resource could not be loaded');
  return new Uint8Array(await response.arrayBuffer());
}
class LocalCMapReader { async fetch({ name }) { return { cMapData: await packagedData(name + '.bcmap'), compressionType: 1 }; } }
class LocalFontReader { async fetch({ filename }) { return packagedData(filename); } }
class LocalWasmReader { async fetch({ filename }) { return packagedData(filename); } }

// Render approved PDF bytes, never generated textbook HTML. Business APIs keep
// using the shared client; PDF.js owns its authenticated byte/range transport.
export function PdfCanvas({ url, pageCount, page, zoom = 100, title = 'Secure PDF' }) {
  const canvasRef = useRef(null), containerRef = useRef(null), textRef = useRef(null), pageRef = useRef(null);
  const [pageText, setPageText] = useState(''), [textError, setTextError] = useState('');
  const [document, setDocument] = useState(null), [localPage, setLocalPage] = useState(1);
  const [width, setWidth] = useState(0), [ready, setReady] = useState(false), [error, setError] = useState('');
  const currentPage = page ?? localPage;

  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(1, Math.floor(entries[0].contentRect.width) - 10)));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true, loadingTask;
    setDocument(null); setReady(false); setError(''); setLocalPage(1);
    (async () => {
      try {
        const source = new URL(url, window.location.origin);
        if (source.origin !== window.location.origin || !/^\/api\/v1\/media\/[a-f\d]{24}\/content$/i.test(source.pathname) || source.search || source.hash) throw new Error('Invalid secure PDF source');
        const pdfjs = await import('pdfjs-dist');
        if (!active) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        loadingTask = pdfjs.getDocument({ url: source.href, withCredentials: true,
          httpHeaders: { 'X-Request-ID': crypto.randomUUID() },
          isEvalSupported: false, stopAtErrors: true, useSystemFonts: true,
          useWorkerFetch: false, CMapReaderFactory: LocalCMapReader,
          StandardFontDataFactory: LocalFontReader, WasmFactory: LocalWasmReader,
          maxImageSize: 16000000, canvasMaxAreaInBytes: 64000000 });
        const parsed = await loadingTask.promise;
        if (!active) return;
        if (parsed.numPages !== pageCount) throw new Error('The PDF changed. Refresh to retrieve its current verified page count.');
        setDocument(parsed);
      } catch (failure) {
        if (active) { setReady(false); setError(failure.message?.includes('PDF changed') ? failure.message : 'PDF unavailable. Access may have expired or the document could not be loaded.'); }
      }
    })();
    return () => { active = false; loadingTask?.destroy().catch(() => {}); };
  }, [url, pageCount]);

  useEffect(() => {
    let active = true, renderTask, textLayer;
    setReady(false);
    setPageText(''); setTextError(''); textRef.current?.replaceChildren();
    if (!document || !width) return;
    (async () => {
      try {
        if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > document.numPages) throw new Error('Invalid PDF page');
        const pdfPage = await document.getPage(currentPage);
        if (!active) return;
        const original = pdfPage.getViewport({ scale: 1 });
        const cssScale = Math.min(1, width / original.width) * zoom / 100;
        const view = pdfPage.getViewport({ scale: cssScale });
        if (!Number.isFinite(view.width) || !Number.isFinite(view.height) || view.width > 20000 || view.height > 20000) throw new Error('Unsupported PDF page dimensions');
        const ratio = Math.min(window.devicePixelRatio || 1, 2, 4096 / view.width, 4096 / view.height, Math.sqrt(16000000 / (view.width * view.height)));
        const viewport = pdfPage.getViewport({ scale: cssScale * ratio });
        const canvas = canvasRef.current;
        pageRef.current.style.width = view.width + 'px';
        pageRef.current.style.height = view.height + 'px';
        pageRef.current.style.setProperty('--total-scale-factor', String(view.scale));
        canvas.width = Math.max(1, Math.floor(viewport.width)); canvas.height = Math.max(1, Math.floor(viewport.height));
        canvas.style.width = view.width + 'px'; canvas.style.height = view.height + 'px';
        renderTask = pdfPage.render({ canvas, viewport });
        await renderTask.promise;
        if (active) { setError(''); setReady(true); }
        if (!active) return;
        try {
          const content = await pdfPage.getTextContent();
          if (!active) return;
          // Bound selectable/accessibility content from the current authorized page.
          if (content.items.length > 20000 || content.items.reduce((sum,item) => sum + (item.str?.length || 0),0) > 200000) throw new Error('Text complexity');
          setPageText(content.items.map(item => (item.str || '') + (item.hasEOL ? '\n' : ' ')).join(''));
          const { TextLayer } = await import('pdfjs-dist');
          if (!active) return;
          textLayer = new TextLayer({ textContentSource: content, container: textRef.current, viewport: view });
          await textLayer.render();
        } catch (failure) { if (active && failure.name !== 'AbortException') setTextError('Selectable text is unavailable for this page. Open the original PDF for other viewing options.'); }
      } catch (failure) {
        if (active && failure.name !== 'RenderingCancelledException') { setReady(false); setError('This PDF page could not be rendered. Refresh or open the original PDF.'); }
      }
    })();
    return () => { active = false; renderTask?.cancel(); textLayer?.cancel(); textRef.current?.replaceChildren(); };
  }, [document, currentPage, width, zoom]);

  return <section ref={containerRef} className="w-full min-w-0 space-y-2" aria-label={title}>
    {page === undefined && <div className="flex flex-wrap items-center gap-3 text-xs"><button disabled={localPage <= 1} onClick={() => setLocalPage(p => p - 1)}>Previous PDF page</button><span>Page {localPage} / {pageCount}</span><button disabled={localPage >= pageCount} onClick={() => setLocalPage(p => p + 1)}>Next PDF page</button></div>}
    {error ? <p role="alert" className="p-3 bg-amber-50 border rounded-xl text-sm">{error}</p> : !ready && <p role="status" className="p-3 text-sm">Rendering PDF page…</p>}
    <div className="max-w-full overflow-auto rounded-xl border bg-slate-100 p-1">
      <div ref={pageRef} className="kitss-pdf-page" style={{ visibility: ready ? 'visible' : 'hidden' }}>
        <canvas ref={canvasRef} role="img" aria-label={title + ', page ' + currentPage} data-rendered-page={ready ? currentPage : undefined} className="bg-white" />
        <div ref={textRef} className="kitss-pdf-text" aria-hidden="true" />
      </div>
    </div>
    {textError && <p role="status" className="text-xs">{textError}</p>}
    {ready && <details className="select-text text-sm bg-white border rounded-xl p-3"><summary className="cursor-pointer">Accessible page text</summary><div aria-label={'PDF page ' + currentPage + ' text'} className="whitespace-pre-wrap break-words mt-2">{pageText || 'No embedded text on this page. Image-only pages require an accessible source document; OCR is not provided.'}</div></details>}
    <a className="text-xs underline" href={url + '#page=' + currentPage} target="_blank" rel="noreferrer">Open original PDF in browser</a>
  </section>;
}
