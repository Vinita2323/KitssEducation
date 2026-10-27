import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useEffect, useState } from 'react';
import { bookService } from '../../user/services/bookService';
import { collegeService } from '../../user/services/collegeService';
import { MediaPicker } from './MediaPicker';
export function BookEditor({ book, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ title: book?.title || '', subtitle: book?.subtitle || '', author: book?.author || '', description: book?.description || '', category: book?.category || '', languageId: book?.languageId || '', boardId: book?.boardId || '', classId: book?.classId || '', subjectId: book?.subjectId || '', price: book?.price ?? '', originalPrice: book?.originalPrice ?? '', pricingApproved: book?.pricingApproved || false, rightsConfirmed: book?.rightsConfirmed || false, rightsNote: book?.rightsNote || '', coverAssetId: book?.coverAssetId || null, documentAssetId: book?.documentAssetId || null, previewAssetId: book?.previewAssetIds?.[0] || null, toc: JSON.stringify(book?.toc || [], null, 2), keywords: (book?.keywords || []).join(', '), edition: book?.edition || '' }));
  const [tax, setTax] = useState({}), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { Promise.all(['board','class','subject','language'].map(async kind => [kind, await collegeService.getTaxonomies(kind)])).then(rows => setTax(Object.fromEntries(rows))).catch(e => setError(e.message)); }, []);
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const input = 'w-full p-2.5 mt-1 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-sm';
  const save = async e => { e.preventDefault(); setBusy(true); setError(''); try {
    const fields = Object.fromEntries(['title','subtitle','author','description','category','pricingApproved','rightsConfirmed','rightsNote','coverAssetId','documentAssetId','edition'].map(k => [k, form[k]]));
    for (const k of ['boardId','classId','subjectId','languageId']) if (form[k]) fields[k] = form[k]; else if (book?.[k]) fields[k] = null;
    if (form.price !== '') fields.priceMinor = Math.round(Number(form.price) * 100);
    if (form.originalPrice !== '') fields.originalPriceMinor = Math.round(Number(form.originalPrice) * 100);
    fields.previewAssetIds = form.previewAssetId ? [form.previewAssetId] : []; fields.toc = JSON.parse(form.toc); fields.keywords = form.keywords.split(',').map(x => x.trim()).filter(Boolean);
    const result = book ? await bookService.updateBook(book, fields) : await bookService.addBook(fields); onSaved(result);
  } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const editorDialog=useDialogFocus(true,onClose);
  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><form ref={editorDialog} tabIndex={-1} onSubmit={save} role="dialog" aria-modal="true" aria-label="Book editor" className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-[#0A1D3F]">
    <div className="flex justify-between"><h2 className="text-lg font-bold">{book ? 'Edit Book' : 'Add New Book'}</h2><button type="button" onClick={onClose}>Close</button></div>
    {error && <p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</p>}
    <p className="text-xs text-[#667085]">Save a draft first. Before publishing, attach clean files and confirm the licensing evidence and owner-approved price. Saving does not publish the book.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{['title','subtitle','author','category','edition'].map(k => <AdminField key={k} className="text-xs font-bold capitalize">{k}<AdminInput aria-label={'Book ' + k} className={input} value={form[k]} required={k === 'title'} onChange={e => change(k, e.target.value)} /></AdminField>)}
      {['board','class','subject','language'].map(kind => <AdminField key={kind} className="text-xs font-bold capitalize">{kind}<AdminSelect aria-label={'Book ' + kind} className={input} value={form[kind + 'Id']} onChange={e => { change(kind + 'Id', e.target.value); if (kind === 'board') { change('classId', ''); change('subjectId', ''); } if (kind === 'class') change('subjectId', ''); }}><option value="">Not specified</option>{(tax[kind] || []).filter(t => kind === 'class' && form.boardId ? t.parentIds.includes(form.boardId) : kind === 'subject' && form.classId ? t.parentIds.includes(form.classId) : true).map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</AdminSelect></AdminField>)}
    </div>
    <AdminField className="block text-xs font-bold">Description<AdminTextarea aria-label="Book description" className={input} value={form.description} rows={3} onChange={e => change('description', e.target.value)} /></AdminField>
    <div className="grid sm:grid-cols-2 gap-3">{['price','originalPrice'].map(k => <AdminField key={k} className="text-xs font-bold">{k === 'price' ? 'Price (INR)' : 'Original price (INR, optional)'}<AdminInput aria-label={'Book ' + k} type="number" min="0" step="0.01" className={input} value={form[k]} onChange={e => change(k, e.target.value)} /></AdminField>)}</div>
    <AdminField className="flex gap-2 text-xs"><AdminInput type="checkbox" checked={form.pricingApproved} onChange={e => change('pricingApproved', e.target.checked)} /> Pricing explicitly approved by the business owner (zero does not enable full reading).</AdminField>
    <AdminField className="flex gap-2 text-xs"><AdminInput type="checkbox" checked={form.rightsConfirmed} onChange={e => change('rightsConfirmed', e.target.checked)} /> Licensed rights for this book and its public sample are confirmed.</AdminField>
    <AdminField className="block text-xs font-bold">Licensing evidence/reference<AdminInput aria-label="Book rightsNote" className={input} value={form.rightsNote} onChange={e => change('rightsNote', e.target.value)} /></AdminField>
    <MediaPicker purpose="book_cover" label="Book cover" value={form.coverAssetId} onChange={v => change('coverAssetId', v)} />
    <MediaPicker purpose="book_full" label="Full book PDF" value={form.documentAssetId} onChange={v => change('documentAssetId', v)} />
    <MediaPicker purpose="book_preview" label="Public sample PDF" value={form.previewAssetId} onChange={v => change('previewAssetId', v)} />
    <AdminField className="block text-xs">Table of contents (title/page entries)<AdminTextarea aria-label="Book table of contents" className={input + ' font-mono'} rows={4} value={form.toc} onChange={e => change('toc', e.target.value)} /></AdminField>
    <AdminField className="block text-xs">Keywords, separated by commas<AdminInput className={input} value={form.keywords} onChange={e => change('keywords', e.target.value)} /></AdminField>
    <div className="flex gap-3"><button disabled={busy} className="px-5 py-2 rounded-xl bg-[#FF8A00] text-white text-sm font-bold">{busy ? 'Saving…' : 'Save Book Draft'}</button><button type="button" onClick={onClose}>Cancel</button></div>
  </form></div>;
}
