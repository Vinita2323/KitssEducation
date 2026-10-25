import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
  RotateCcw,
  X,
  Sparkles,
  Layers,
  FileText,
  DollarSign
} from "lucide-react";
import { bookService } from "../../user/services/bookService";
import { collegeService } from '../../user/services/collegeService';
import { useAuth } from '../../user/context/AuthContext';
import { Pagination } from '../../user/components/common/Pagination';
import { BookEditor } from '../components/BookEditor';

const COLOR_PRESETS = [
  { label: "Navy Blue", value: "from-[#0A1D3F] to-[#133C8B]" },
  { label: "Emerald Green", value: "from-emerald-700 to-teal-800" },
  { label: "Vibrant Orange", value: "from-amber-600 to-orange-700" },
  { label: "Purple Indigo", value: "from-indigo-700 to-purple-800" },
  { label: "Cyan Blue", value: "from-cyan-700 to-blue-800" },
  { label: "Crimson Rose", value: "from-rose-700 to-pink-800" }
];

const ICON_PRESETS = ["BookOpen", "Calculator", "Atom", "BookMarked", "Globe2", "Languages"];

export const AdminBooksPage = () => {
  const { can } = useAuth();
  const [page, setPage] = useState(1), [meta, setMeta] = useState(null), [loadError, setLoadError] = useState('');
  const [tax, setTax] = useState({board:[],class:[],subject:[]});
  const taxonomyBoards = tax.board.map(t => ({id:t.id,name:t.label})), taxonomyClasses = tax.class.map(t => t.label), taxonomySubjects = tax.subject.map(t => ({id:t.id,name:t.label}));
  useEffect(() => { Promise.all(['board','class','subject'].map(async kind => [kind,await collegeService.getTaxonomies(kind)])).then(rows=>setTax(Object.fromEntries(rows))).catch(e=>setLoadError(e.message)); }, []);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBoard, setFilterBoard] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const result = await bookService.adminPage({ page,
        board: filterBoard,
        className: filterClass,
        subject: filterSubject,
        type: filterType,
        status: filterStatus,
        query: searchQuery
      });
      setBooks(result.data); setMeta(result.meta); setLoadError('');
    } catch (err) {
      setBooks([]); setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [filterBoard, filterClass, filterSubject, filterType, filterStatus, searchQuery, page]);
  useEffect(()=>setPage(1),[filterBoard,filterClass,filterSubject,filterType,filterStatus,searchQuery]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAddModal = () => { setEditingBook(null); setModalOpen(true); };
  const handleOpenEditModal = book => { setEditingBook(book); setModalOpen(true); };
  const handleDeleteBook = async (id) => {
    try {
      await bookService.deleteBook(books.find(b=>b.id===id));
      showToast("Book archived; historical records retained.");
      setDeleteConfirmId(null);
      loadBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
      setLoadError(err.message);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const updated = await bookService.togglePublishStatus(books.find(b=>b.id===id));
      showToast(`Status changed to ${updated.status}.`);
      loadBooks();
    } catch (err) {
      setLoadError(err.message);
    }
  };

  // Stats calculation
  const totalCount = meta?.total ?? 0;
  const publishedCount = books.filter((b) => (b.status || "published") === "published").length;
  const freeCount = books.filter((b) => b.isFree || b.price === 0).length;
  const paidCount = books.filter((b) => !b.isFree && b.price > 0).length;

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700">{loadError}</p>}
      <Pagination meta={meta} onChange={setPage} loading={loading} />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A1D3F] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#FF8A00] flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#17B26A]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0A1D3F] tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#FF8A00]" />
            <span>Digital Books Management</span>
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Administer curriculum books, manage pricing, hierarchy, and publishing status
          </p>
        </div>

        <div className="flex items-center gap-2">


          <button
            type="button"
            disabled={!can('learning.write')} onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#FF8A00] hover:bg-[#E67C00] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#667085] block">Total Books</span>
          <span className="text-xl font-black text-[#0A1D3F] mt-1 block">{totalCount}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#667085] block">Published (page)</span>
          <span className="text-xl font-black text-[#17B26A] mt-1 block">{publishedCount}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#667085] block">Zero-priced (page)</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{freeCount}</span>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs">
          <span className="text-[11px] font-semibold text-[#667085] block">Paid (page)</span>
          <span className="text-xl font-black text-[#FF8A00] mt-1 block">{paidCount}</span>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, board, or subject..."
              className="w-full pl-9 pr-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
            />
          </div>

          {/* Reset Filters button */}
          {(filterBoard !== "All" || filterClass !== "All" || filterSubject !== "All" || filterType !== "all" || filterStatus !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setFilterBoard("All");
                setFilterClass("All");
                setFilterSubject("All");
                setFilterType("all");
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition shrink-0 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 border-t border-[#E6E8EC]/80 text-xs">
          <div>
            <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
              Board
            </label>
            <select
              value={filterBoard}
              onChange={(e) => setFilterBoard(e.target.value)}
              className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none"
            >
              <option value="All">All Boards</option>
              {taxonomyBoards.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
              Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none"
            >
              <option value="All">All Classes</option>
              {taxonomyClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
              Subject
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none"
            >
              <option value="All">All Subjects</option>
              {taxonomySubjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
              Pricing
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0A1D3F]">
            <thead className="bg-[#F7F8FA] border-b border-[#E6E8EC] text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Book Details</th>
                <th className="p-3.5">Hierarchy</th>
                <th className="p-3.5">Pricing</th>
                <th className="p-3.5">Specs</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#667085]">
                    Loading books catalog...
                  </td>
                </tr>
              ) : books.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[#667085]">
                    No books matching current filters. Try resetting filters or adding a new book.
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const isFree = book.isFree || book.price === 0;
                  const isPublished = (book.status || "published") === "published";

                  return (
                    <tr key={book.id} className="hover:bg-slate-50/70 transition">
                      {/* Title & Author */}
                      <td className="p-3.5 min-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-12 rounded-lg bg-gradient-to-br ${
                              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
                            } text-white flex items-center justify-center shrink-0 text-[10px] font-bold shadow-xs`}
                          >
                            Cl {book.class}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-[#0A1D3F] truncate">{book.title}</h4>
                            <p className="text-[11px] text-[#667085] truncate">{book.subtitle}</p>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {book.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Hierarchy */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#0A1D3F]">{book.board}</span>
                          <span className="text-[11px] text-[#FF8A00] font-semibold">Class {book.class}</span>
                          <span className="text-[11px] text-[#667085]">{book.subject}</span>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="p-3.5 whitespace-nowrap">
                        {isFree ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            FREE
                          </span>
                        ) : (
                          <div>
                            <span className="font-black text-sm text-[#0A1D3F]">{book.price === undefined ? 'Not configured' : `₹${book.price}`}</span>
                            {book.originalPrice && (
                              <span className="text-[11px] text-[#667085] line-through block">
                                ₹{book.originalPrice}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Specs */}
                      <td className="p-3.5 whitespace-nowrap text-[11px] text-[#667085]">
                        <div>{book.pages} pages</div>
                        <div>{book.language || "Not supplied"}</div>
                        <div>{book.fileSize || "Private PDF"}</div>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={!can('learning.publish') || book.status === 'archived'} onClick={() => handleTogglePublish(book.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          }`}
                          title="Click to toggle status"
                        >
                          {isPublished ? "● Published" : book.status === 'archived' ? 'Archived' : "○ Draft"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/books/${book.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
                            title="View Public Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            disabled={!can('learning.write') || book.status === 'archived'} onClick={() => handleOpenEditModal(book)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Book"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={!can('learning.write')} onClick={() => setDeleteConfirmId(book.id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Archive Book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <BookEditor book={editingBook} onClose={()=>setModalOpen(false)} onSaved={()=>{setModalOpen(false);showToast('Book draft saved in MongoDB');loadBooks();}} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl border border-[#E6E8EC] z-10 p-5 text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#0A1D3F]">
              Confirm Archive Book?
            </h3>
            <p className="text-xs text-[#667085]">
              Are you sure you want to remove this book from the catalog? This action will remove it for all students.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-1.5 border border-[#E6E8EC] rounded-xl text-xs font-semibold text-[#667085] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBook(deleteConfirmId)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
