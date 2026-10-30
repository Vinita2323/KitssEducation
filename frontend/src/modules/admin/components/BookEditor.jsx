import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Circle, Plus, Trash2, X } from 'lucide-react';
import { bookService } from '../../user/services/bookService';
import { collegeService } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { MediaPicker } from './MediaPicker';
import { bookRequirements, rupees } from './bookReadiness';

const mediaUrl = id => (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '') + '/media/' + encodeURIComponent(id) + '/content';
const minor = value => value === '' ? undefined : Math.round(Number(value) * 100);

function Section({ title, hint, children }) {
  return <section className="rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 space-y-4" aria-label={title}>
    <div><h3 className="font-bold text-[#0A1D3F]">{title}</h3>{hint && <p className="text-sm text-[#53647c] mt-0.5">{hint}</p>}</div>
    {children}
  </section>;
}

export function BookEditor({ book, onClose, onSaved }) {
  const { can } = useAuth();
  const [form, setForm] = useState(() => ({ title: book?.title || '', subtitle: book?.subtitle || '', author: book?.author || '', description: book?.description || '', languageId: book?.languageId || '', boardId: book?.boardId || '', classId: book?.classId || '', subjectId: book?.subjectId || '', free: book?.priceMinor === 0, price: book?.price ? String(book.price) : '', originalPrice: book?.originalPrice ? String(book.originalPrice) : '', rightsNote: book?.rightsNote || '', coverAssetId: book?.coverAssetId || null, documentAssetId: book?.documentAssetId || null, previewAssetId: book?.previewAssetIds?.[0] || null, chapters: (book?.toc || []).map(c => ({ title: c.title, page: String(c.page) })), keywords: (book?.keywords || []).join(', ') }));
  const [tax, setTax] = useState({}), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all(['board', 'class', 'subject', 'language'].map(async kind => [kind, await collegeService.getTaxonomies(kind)])).then(rows => setTax(Object.fromEntries(rows))).catch(e => setError(e.message)); }, []);
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setChapter = (i, key, value) => setForm(f => ({ ...f, chapters: f.chapters.map((c, n) => n === i ? { ...c, [key]: value } : c) }));
  const moveChapter = (i, by) => setForm(f => { const chapters = [...f.chapters]; [chapters[i], chapters[i + by]] = [chapters[i + by], chapters[i]]; return { ...f, chapters }; });

  const priceMinor = form.free ? 0 : minor(form.price), originalMinor = form.free ? undefined : minor(form.originalPrice);
  const draft = { ...form, priceMinor: priceMinor ?? book?.priceMinor, rightsConfirmed: Boolean(form.rightsNote.trim()) };
  const requirements = bookRequirements(draft), ready = requirements.filter(([, ok]) => ok).length;
  const discount = priceMinor > 0 && originalMinor > priceMinor ? Math.round((1 - priceMinor / originalMinor) * 100) : 0;

  const save = async e => {
    e.preventDefault(); setError('');
    const chapters = form.chapters.filter(c => c.title.trim() || c.page);
    if (chapters.some(c => !c.title.trim() || !(Number(c.page) >= 1) || !Number.isInteger(Number(c.page)))) { setError('Each chapter needs a title and a whole page number of 1 or more.'); return; }
    if (!form.free && form.price === '' && book?.priceMinor === 0) { setError('Enter a price, or tick “This book is free”.'); return; }
    if (originalMinor !== undefined && priceMinor !== undefined && originalMinor < priceMinor) { setError('Original price cannot be lower than the price.'); return; }
    setBusy(true);
    try {
      const fields = Object.fromEntries(['title', 'subtitle', 'author', 'description', 'rightsNote', 'coverAssetId', 'documentAssetId'].map(k => [k, form[k]]));
      fields.rightsConfirmed = Boolean(form.rightsNote.trim());
      for (const k of ['boardId', 'classId', 'subjectId', 'languageId']) if (form[k]) fields[k] = form[k]; else if (book?.[k]) fields[k] = null;
      if (priceMinor !== undefined) fields.priceMinor = priceMinor;
      if (originalMinor !== undefined) fields.originalPriceMinor = originalMinor;
      fields.previewAssetIds = form.previewAssetId ? [form.previewAssetId] : [];
      fields.toc = chapters.map(c => ({ title: c.title.trim(), page: Number(c.page) }));
      fields.keywords = form.keywords.split(',').map(x => x.trim()).filter(Boolean);
      onSaved(book ? await bookService.updateBook(book, fields) : await bookService.addBook(fields));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const editorDialog = useDialogFocus(true, onClose);
  const options = kind => (tax[kind] || []).filter(t => kind === 'class' && form.boardId ? t.parentIds.includes(form.boardId) : kind === 'subject' && form.classId ? t.parentIds.includes(form.classId) : true);

  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-2 sm:p-4 flex items-center justify-center"><form ref={editorDialog} tabIndex={-1} onSubmit={save} role="dialog" aria-modal="true" aria-label="Book editor" className="bg-white rounded-2xl w-full max-w-4xl max-h-[94vh] flex flex-col text-[#0A1D3F] overflow-hidden">
    <header className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#E6E8EC]">
      <div className="min-w-0"><h2 className="text-lg font-bold">{book ? 'Edit book' : 'Add new book'}</h2><p className="text-sm text-[#53647c]">Saving keeps this as a draft. {book?.status === 'published' ? 'Students see your changes after you publish them.' : 'Publish it from the book list when it is ready.'}</p></div>
      <button type="button" onClick={onClose} aria-label="Close" className="shrink-0"><X aria-hidden="true" size={18} /></button>
    </header>

    <div className="overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
      {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}
      <Section title="Basics">
        <AdminField>Title<AdminInput aria-label="Book title" value={form.title} required maxLength={160} onChange={e => change('title', e.target.value)} /></AdminField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminField help="">Subtitle<AdminInput aria-label="Book subtitle" value={form.subtitle} maxLength={160} onChange={e => change('subtitle', e.target.value)} /></AdminField>
          <AdminField help="">Author<AdminInput aria-label="Book author" value={form.author} maxLength={160} onChange={e => change('author', e.target.value)} /></AdminField>
        </div>
        <AdminField help="Shown on the book page. Plain text; line breaks are kept.">Description<AdminTextarea aria-label="Book description" value={form.description} rows={4} maxLength={20000} onChange={e => change('description', e.target.value)} /></AdminField>
      </Section>

      <Section title="Classification" hint="Students filter the catalogue by these. Each list narrows the next.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {['language', 'board', 'class', 'subject'].map(kind => <AdminField key={kind} help="">{kind[0].toUpperCase() + kind.slice(1)}<AdminSelect aria-label={'Book ' + kind} value={form[kind + 'Id']} onChange={e => { change(kind + 'Id', e.target.value); if (kind === 'board') { change('classId', ''); change('subjectId', ''); } if (kind === 'class') change('subjectId', ''); }}><option value="">Not specified</option>{options(kind).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</AdminSelect></AdminField>)}
        </div>
      </Section>

      <Section title="Pricing">
        <AdminField className="flex items-center gap-2 font-semibold"><AdminInput type="checkbox" checked={form.free} onChange={e => change('free', e.target.checked)} /> This book is free</AdminField>
        {!form.free && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminField>Price (₹)<AdminInput aria-label="Book price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={e => change('price', e.target.value)} /></AdminField>
          <AdminField help="Optional. Shown struck through, with the discount.">Original price (₹)<AdminInput aria-label="Book originalPrice" type="number" min="0" step="0.01" inputMode="decimal" value={form.originalPrice} onChange={e => change('originalPrice', e.target.value)} /></AdminField>
        </div>}
        <p className="text-sm" aria-live="polite">Students will see: <strong>{form.free ? 'Free' : priceMinor === undefined ? 'No price yet' : rupees(priceMinor)}</strong>{discount > 0 && <> <s className="text-[#53647c]">{rupees(originalMinor)}</s> <span className="font-semibold text-emerald-700">{discount}% OFF</span></>}</p>
      </Section>

      <Section title="Files" hint="Uploads are virus-scanned. The full PDF is only ever streamed to students with access.">
        <div className="grid grid-cols-1 sm:grid-cols-[7rem_1fr] gap-4 items-start">
          <div className="w-28 aspect-[3/4] rounded-xl border border-[#E6E8EC] bg-[#F7F8FA] grid place-items-center overflow-hidden text-xs text-[#53647c] text-center p-2">{form.coverAssetId && can('media.read') ? <img src={mediaUrl(form.coverAssetId)} alt="Selected book cover" className="w-full h-full object-cover" /> : 'No cover yet'}</div>
          <MediaPicker purpose="book_cover" label="Book cover" value={form.coverAssetId} onChange={v => change('coverAssetId', v)} />
        </div>
        <MediaPicker purpose="book_full" label="Full book PDF" value={form.documentAssetId} onChange={v => change('documentAssetId', v)} />
        <MediaPicker purpose="book_preview" label="Public sample PDF" value={form.previewAssetId} onChange={v => change('previewAssetId', v)} />
        <p className="text-sm text-[#53647c]">The sample is free for anyone to read, so it must be a shorter, separate PDF.</p>
      </Section>

      <Section title="Chapters" hint="Optional. Shown on the book page and searchable. Page numbers must exist in the full PDF.">
        {form.chapters.length > 0 && <ol className="space-y-2">{form.chapters.map((c, i) => <li key={i} className="grid grid-cols-[1fr_5.5rem_auto] gap-2 items-end">
          <AdminField help="">{'Chapter ' + (i + 1)}<AdminInput aria-label={'Chapter ' + (i + 1) + ' title'} value={c.title} maxLength={160} onChange={e => setChapter(i, 'title', e.target.value)} /></AdminField>
          <AdminField help="">Page<AdminInput aria-label={'Chapter ' + (i + 1) + ' page'} type="number" min="1" step="1" value={c.page} onChange={e => setChapter(i, 'page', e.target.value)} /></AdminField>
          <div className="flex gap-1 pb-0.5">
            <button type="button" aria-label={'Move chapter ' + (i + 1) + ' up'} disabled={i === 0} onClick={() => moveChapter(i, -1)} className="!px-2"><ArrowUp aria-hidden="true" size={15} /></button>
            <button type="button" aria-label={'Move chapter ' + (i + 1) + ' down'} disabled={i === form.chapters.length - 1} onClick={() => moveChapter(i, 1)} className="!px-2"><ArrowDown aria-hidden="true" size={15} /></button>
            <button type="button" aria-label={'Remove chapter ' + (i + 1)} onClick={() => change('chapters', form.chapters.filter((_, n) => n !== i))} className="!px-2 text-red-700"><Trash2 aria-hidden="true" size={15} /></button>
          </div>
        </li>)}</ol>}
        <button type="button" disabled={form.chapters.length >= 200} onClick={() => change('chapters', [...form.chapters, { title: '', page: '' }])} className="inline-flex items-center gap-1.5 text-sm"><Plus aria-hidden="true" size={15} />Add chapter</button>
      </Section>

      <Section title="Licensing & search">
        <AdminField help="Required to publish. Where your right to sell this book comes from, for example “Written in-house” or “Agreement 2026-14 with ABC Publishers”.">Licensing reference<AdminInput aria-label="Book licensing reference" value={form.rightsNote} maxLength={1000} onChange={e => change('rightsNote', e.target.value)} /></AdminField>
        <AdminField help="Optional extra search words, separated by commas.">Search keywords<AdminInput aria-label="Book keywords" value={form.keywords} onChange={e => change('keywords', e.target.value)} /></AdminField>
      </Section>
    </div>

    <footer className="border-t border-[#E6E8EC] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3 bg-[#F8FAFC]">
      <details className="flex-1 min-w-[14rem] text-sm">
        <summary className="cursor-pointer font-semibold">{ready === requirements.length ? 'Ready to publish' : `Ready to publish: ${ready} of ${requirements.length}`}</summary>
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1">{requirements.map(([label, ok]) => <li key={label} className={'flex items-center gap-1.5 ' + (ok ? 'text-emerald-800' : 'text-[#53647c]')}>{ok ? <CheckCircle2 aria-hidden="true" size={14} /> : <Circle aria-hidden="true" size={14} />}<span>{(ok ? 'Done: ' : 'Missing: ') + label}</span></li>)}</ul>
      </details>
      <button type="button" onClick={onClose}>Cancel</button>
      <button disabled={busy} className="px-5 py-2 rounded-xl bg-[#FF8A00] text-white text-sm font-bold disabled:opacity-60">{busy ? 'Saving…' : 'Save Book Draft'}</button>
    </footer>
  </form></div>;
}
