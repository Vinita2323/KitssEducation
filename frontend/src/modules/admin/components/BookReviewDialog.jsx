import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../shared/api/httpClient';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import { useAuth } from '../../user/context/AuthContext';
import { bookService } from '../../user/services/bookService';

const requirements = book => [
  ['Author', Boolean(book.author?.trim())], ['Category', Boolean(book.category?.trim())],
  ['Language', Boolean(book.languageId)], ['Description', Boolean(book.description?.trim())],
  ['Cover image attached', Boolean(book.coverAssetId)], ['Full PDF attached', Boolean(book.documentAssetId)],
  ['Price set (including zero for a free book)', Number.isSafeInteger(book.priceMinor) && book.priceMinor >= 0],
  ['Pricing approved by the business owner', book.pricingApproved === true],
  ['Licensing rights confirmed', book.rightsConfirmed === true], ['Licensing reference supplied', Boolean(book.rightsNote?.trim())],
];

export function BookReviewDialog({ bookId, intent, onClose, onEdit, onPublished }) {
  const { can } = useAuth();
  const [book, setBook] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [version, setVersion] = useState(0);
  const close = () => { if (!saving) onClose(); };
  const dialog = useDialogFocus(true, close);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setBook(null);
    httpClient.request('/admin/books/' + encodeURIComponent(bookId), { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setBook(result.data); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [bookId, version]);
  const title = intent === 'preview' ? 'Admin book preview' : intent === 'unpublish' ? 'Unpublish book' : 'Publish book';
  const missing = book ? requirements(book).filter(([, ready]) => !ready) : [];
  const stale = book && ((intent === 'publish' && book.status !== 'draft') || (intent === 'unpublish' && book.status !== 'published'));
  const submit = async () => {
    setSaving(true); setError('');
    try { await bookService.togglePublishStatus(book); onPublished(intent === 'unpublish' ? 'Book unpublished.' : 'Book published.'); }
    catch (failure) { setError((intent === 'unpublish' ? 'Book was not unpublished. ' : 'Book was not published. ') + failure.message); }
    finally { setSaving(false); }
  };
  const mediaUrl = id => (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '') + '/media/' + encodeURIComponent(id) + '/content';
  return <div className="fixed inset-0 z-50 bg-[#0A1D3F]/70 p-3 flex items-center justify-center"><section ref={dialog} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-[#0A1D3F]">
    <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2><button type="button" disabled={saving} onClick={close}>Close</button></div>
    {loading && <p role="status">Loading book details...</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    {book && <>
      <h3 className="font-bold break-words">{book.title}</h3>
      {intent === 'preview' && <p className="text-sm text-slate-600">Current saved admin version. Published pages keep their last published version until you publish again.</p>}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">{[['Author', book.author || 'Not supplied'], ['Category', book.category || 'Not supplied'], ['Status', book.status], ['Price', book.priceMinor === undefined ? 'Not configured' : 'INR ' + (book.priceMinor / 100).toFixed(2)], ['Pages', book.pageCount || 'Not supplied'], ['Edition', book.edition || 'Not supplied']].map(([label, value]) => <div key={label}><dt className="text-slate-600">{label}</dt><dd className="break-words">{value}</dd></div>)}</dl>
      {book.description && <p className="whitespace-pre-wrap break-words text-sm">{book.description}</p>}
      {intent !== 'unpublish' && <div className="rounded-xl border p-3 space-y-2"><h3 className="font-bold text-sm">Publication requirements</h3><ul className="space-y-1 text-sm">{requirements(book).map(([label, ready]) => <li key={label} className={ready ? 'text-slate-600' : 'text-red-800'}>{ready ? 'Complete: ' : 'Required: '}{label}</li>)}</ul><p className="text-xs text-slate-600">The server also checks active dropdown choices, file safety and PDF validity before publishing.</p></div>}
      {intent === 'unpublish' && <p>This removes the book from the public catalogue. Existing purchase records are retained.</p>}
      {can('media.read') && <div className="flex flex-wrap gap-3 text-sm">{[['Open cover', book.coverAssetId], ['Open full PDF', book.documentAssetId], ['Open sample PDF', book.previewAssetIds?.[0]]].filter(([, id]) => id).map(([label, id]) => <a key={label} href={mediaUrl(id)} target="_blank" rel="noopener noreferrer" className="underline">{label}</a>)}</div>}
      {stale && <p role="alert">The book status changed. Close this dialog and refresh the book list before continuing.</p>}
    </>}
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" disabled={loading || saving} className="border rounded-lg px-3 py-2" onClick={() => setVersion(v => v + 1)}>Refresh details</button>
      {book && can('books.edit') && book.status !== 'archived' && <button type="button" disabled={saving} className="border rounded-lg px-3 py-2" onClick={() => onEdit(book)}>Edit book</button>}
      {book && intent !== 'preview' && can('books.publish') && <button type="button" disabled={loading || saving || stale || (intent === 'publish' && missing.length > 0)} className="bg-[#0A1D3F] text-white rounded-lg px-3 py-2 disabled:opacity-50" onClick={submit}>{saving ? 'Saving...' : intent === 'unpublish' ? 'Confirm unpublish' : 'Confirm publish'}</button>}
    </div>
  </section></div>;
}
