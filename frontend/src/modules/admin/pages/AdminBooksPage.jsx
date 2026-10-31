import { AdminField, AdminInput, AdminSelect } from '../components/AdminFields';
import { useDialogFocus } from '../../../shared/ui/useDialogFocus';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search, Edit2, Trash2, Eye, CheckCircle2, AlertCircle, RotateCcw, Users, ExternalLink, UploadCloud } from "lucide-react";
import { bookService, bookDTO } from "../../user/services/bookService";
import { collegeService } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { BookReviewDialog } from '../components/BookReviewDialog';
import { BookEditor } from '../components/BookEditor';
import { bookState, rupees } from '../components/bookReadiness';
import { AdminPageHeader, AdminTable } from '../components/AdminUI';

const mediaUrl = id => (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '') + '/media/' + encodeURIComponent(id) + '/content';
const filterLabel = 'text-xs font-semibold text-[#53647c] block mb-1';
const iconButton = '!p-2 w-9 h-9';

function Stat({ label, value, detail }) {
  return <div className="admin-card p-4 min-w-0">
    <span className="text-sm font-semibold text-[#53647c] block">{label}</span>
    <div className="text-2xl font-extrabold text-[#0A1D3F] mt-1 leading-tight">{value ?? '–'}</div>
    {detail && <span className="text-sm text-[#53647c] block mt-0.5">{detail}</span>}
  </div>;
}

export const AdminBooksPage = () => {
  const { can } = useAuth();
  const [page, setPage] = useState(1), [meta, setMeta] = useState(null), [summary, setSummary] = useState(null), [loadError, setLoadError] = useState('');
  const [tax, setTax] = useState({ board: [], class: [], subject: [] });
  useEffect(() => { Promise.all(['board', 'class', 'subject'].map(async kind => [kind, await collegeService.getTaxonomies(kind)])).then(rows => setTax(Object.fromEntries(rows))).catch(e => setLoadError(e.message)); }, []);
  const [books, setBooks] = useState([]), [owners, setOwners] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBoard, setFilterBoard] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [review, setReview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const result = await bookService.adminPage({ page, board: filterBoard, className: filterClass, subject: filterSubject, type: filterType, status: filterStatus, query: searchQuery });
      setBooks(result.data); setMeta(result.meta); setSummary(result.summary ?? null); setLoadError('');
      if (result.data.length) bookService.ownerCounts(result.data.map(b => b.id)).then(setOwners).catch(() => setOwners({}));
    } catch (err) {
      setBooks([]); setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooks(); }, [filterBoard, filterClass, filterSubject, filterType, filterStatus, searchQuery, page]);
  useEffect(() => setPage(1), [filterBoard, filterClass, filterSubject, filterType, filterStatus, searchQuery]);

  const showToast = msg => { setToastMessage(msg); setTimeout(() => setToastMessage(null), 3500); };
  const handleOpenAddModal = () => { setEditingBook(null); setModalOpen(true); };
  const handleOpenEditModal = book => { setEditingBook(book); setModalOpen(true); };
  const handleRemove = async book => {
    try { await bookService.deleteBook(book); showToast("Book removed from the store. Owners keep access."); setRemoveConfirm(null); loadBooks(); }
    catch (err) { setRemoveConfirm(null); setLoadError(err.message); }
  };
  const handleRestore = async book => {
    try { await bookService.restoreBook(book); showToast("Book restored as a draft. Publish it to put it back on sale."); loadBooks(); }
    catch (err) { setLoadError(err.message); }
  };

  const filtersActive = filterBoard !== "All" || filterClass !== "All" || filterSubject !== "All" || filterType !== "all" || filterStatus !== "all" || searchQuery;
  const clearFilters = () => { setFilterBoard("All"); setFilterClass("All"); setFilterSubject("All"); setFilterType("all"); setFilterStatus("all"); setSearchQuery(""); };
  const removeDialog = useDialogFocus(Boolean(removeConfirm), () => setRemoveConfirm(null));

  return (
    <div className="space-y-6 text-[#0A1D3F]">
      {loadError && <p role="alert">{loadError}</p>}
      {toastMessage && (
        <div role="status" className="fixed top-20 right-6 left-6 sm:left-auto z-50 bg-[#0A1D3F] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#FF8A00] flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-[#17B26A]" /><span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <AdminPageHeader title={<span className="inline-flex items-center gap-2"><BookOpen aria-hidden="true" className="w-6 h-6 text-[#FF8A00] shrink-0" /><span>Digital Books</span></span>}
        description="Create books, set prices and decide what students can buy. Students who own a book always keep reading it."
        actions={<button type="button" disabled={!can('books.create')} onClick={handleOpenAddModal} className="admin-btn admin-btn-accent">
          <Plus aria-hidden="true" className="w-4 h-4" /><span>Add New Book</span>
        </button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Books" value={summary?.total ?? meta?.total} detail={summary?.removed ? summary.removed + ' removed' : 'In the catalogue'} />
        <Stat label="Live" value={summary?.live} detail={summary ? summary.liveFree + ' free · ' + summary.livePaid + ' paid' : null} />
        <Stat label="Drafts" value={summary?.drafts} detail="Never published" />
        <Stat label="Off sale" value={summary?.offSale} detail="Owners still read" />
      </div>

      <div className="admin-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <AdminInput type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by title, author, board, or subject..." />
          </div>
          {filtersActive && <button type="button" onClick={clearFilters} className="admin-btn admin-btn-ghost shrink-0">Clear Filters</button>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {[
            ['Board', filterBoard, setFilterBoard, [['All', 'All Boards'], ...tax.board.map(t => [t.id, t.label])]],
            ['Class', filterClass, setFilterClass, [['All', 'All Classes'], ...tax.class.map(t => [t.label, 'Class ' + t.label])]],
            ['Subject', filterSubject, setFilterSubject, [['All', 'All Subjects'], ...tax.subject.map(t => [t.id, t.label])]],
            ['Pricing', filterType, setFilterType, [['all', 'All Types'], ['free', 'Free Only'], ['paid', 'Paid Only']]],
            ['Status', filterStatus, setFilterStatus, [['all', 'All Statuses'], ['published', 'Live'], ['draft', 'Drafts & off sale'], ['archived', 'Removed']]]
          ].map(([label, value, set, choices], i) => <div key={label}>
            <AdminField htmlFor={'adminbookspage-field-' + (i + 1)} className={filterLabel}>{label}</AdminField>
            <AdminSelect helpLabel={label} id={'adminbookspage-field-' + (i + 1)} value={value} onChange={e => set(e.target.value)}>
              {choices.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
            </AdminSelect>
          </div>)}
        </div>
      </div>

      <AdminTable>
          <table className="w-full text-left text-sm">
            <thead><tr><th>Book</th><th>Class &amp; subject</th><th>Price</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="text-center text-[#53647c]">Loading books…</td></tr>
                : books.length === 0 ? <tr><td colSpan="5" className="text-center text-[#53647c]">{filtersActive ? 'No books match these filters. Try clearing them.' : 'No books yet. Add your first book to get started.'}</td></tr>
                : books.map(book => {
                  const state = bookState(book), live = book.status === 'published', removed = book.status === 'archived', owned = owners[book.id] ?? 0;
                  return <tr key={book.id}>
                    <td className="min-w-[16rem]">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-14 rounded-md bg-gradient-to-br ${book.coverColor} text-white grid place-items-center shrink-0 overflow-hidden`}>
                          {book.coverAssetId && can('media.read') ? <img src={mediaUrl(book.coverAssetId)} alt="" className="w-full h-full object-cover" loading="lazy" /> : <BookOpen aria-hidden="true" className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold break-words">{book.title}</h4>
                          {book.author && <p className="text-sm">{book.author}</p>}
                          <p className="text-sm text-[#53647c] flex items-center gap-1 mt-0.5"><Users aria-hidden="true" className="w-3.5 h-3.5" />{owned === 1 ? '1 owner' : owned + ' owners'}{book.pages ? ' · ' + book.pages + ' pages' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="min-w-[9rem]">
                      <span className="font-semibold block">{book.board || 'No board'}</span>
                      <span className="text-sm text-[#53647c] block">{[book.class && 'Class ' + book.class, book.subject, book.language].filter(Boolean).join(' · ') || 'Not classified'}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="font-bold block">{rupees(book.priceMinor)}</span>
                      {book.originalPriceMinor > book.priceMinor && <s className="text-sm text-[#53647c]">{rupees(book.originalPriceMinor)}</s>}
                    </td>
                    <td className="whitespace-nowrap"><span className={'px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ' + state.tone}>{state.label}</span></td>
                    <td className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5 ml-auto max-w-[15.5rem]">
                        {can('books.publish') && live && book.publication?.changesPending && <button type="button" className="inline-flex items-center gap-1 text-amber-800" onClick={() => setReview({ id: book.id, intent: 'publish' })}><UploadCloud className="w-4 h-4" aria-hidden="true" />Publish changes</button>}
                        {can('books.publish') && !removed && <button type="button" onClick={() => setReview({ id: book.id, intent: live ? 'unpublish' : 'publish' })}>{live ? 'Unpublish' : 'Publish'}</button>}
                        {removed && can('books.archive') && <button type="button" className="inline-flex items-center gap-1" onClick={() => handleRestore(book)}><RotateCcw className="w-4 h-4" aria-hidden="true" />Restore</button>}
                        <button type="button" className={iconButton} title="Admin preview" aria-label="Admin preview" onClick={() => setReview({ id: book.id, intent: 'preview' })}><Eye className="w-4 h-4" aria-hidden="true" /></button>
                        {live && <Link to={`/books/${book.id}`} className={iconButton + ' inline-grid place-items-center border border-[#cbd6e5] rounded-[10px]'} title="View public page" aria-label="View public page"><ExternalLink aria-hidden="true" className="w-4 h-4" /></Link>}
                        {!removed && <button type="button" disabled={!can('books.edit')} onClick={() => handleOpenEditModal(book)} className={iconButton + ' text-blue-700'} title="Edit Book" aria-label={'Edit ' + book.title}><Edit2 aria-hidden="true" className="w-4 h-4" /></button>}
                        {!removed && <button type="button" disabled={!can('books.archive')} onClick={() => setRemoveConfirm(book)} className={iconButton + ' text-red-700'} title="Remove from store" aria-label={'Remove ' + book.title + ' from store'}><Trash2 aria-hidden="true" className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>;
                })}
            </tbody>
          </table>
      </AdminTable>
      <Pagination meta={meta} onChange={setPage} loading={loading} />

      {review && <BookReviewDialog bookId={review.id} intent={review.intent} onClose={() => setReview(null)} onEdit={row => { setReview(null); handleOpenEditModal(bookDTO(row)); }} onPublished={message => { setReview(null); showToast(message); loadBooks(); }} />}
      {modalOpen && <BookEditor book={editingBook} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); showToast(editingBook?.status === 'published' ? 'Changes saved. Publish them when ready.' : 'Book draft saved.'); loadBooks(); }} />}

      {removeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRemoveConfirm(null)} />
          <div ref={removeDialog} role="dialog" aria-modal="true" aria-label="Remove book confirmation" tabIndex={-1} className="admin-dialog relative bg-white w-full max-w-sm rounded-2xl shadow-xl border z-10 p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto"><AlertCircle aria-hidden="true" className="w-6 h-6" /></div>
            <h3 className="font-bold">Remove “{removeConfirm.title}” from the store?</h3>
            <p className="text-sm">It leaves the catalogue and can no longer be bought or edited. {(owners[removeConfirm.id] ?? 0) > 0 ? `The ${owners[removeConfirm.id]} student${owners[removeConfirm.id] === 1 ? ' who owns' : 's who own'} it keep reading.` : 'Anyone who owns it keeps reading.'} You can restore it later from the Removed filter.</p>
            <div className="pt-2 flex justify-center gap-2">
              <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setRemoveConfirm(null)}>Cancel</button>
              <button type="button" onClick={() => handleRemove(removeConfirm)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">Yes, remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
