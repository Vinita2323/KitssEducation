import { useAuth } from '../../context/AuthContext';
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { useLibrary } from "../../context/LibraryContext";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

const coverIconMap = {
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages,
  BookOpen
};

export const MyPurchasedBooksPage = () => {
  const { user } = useAuth();
  const [error,setError] = useState('');
  const navigate = useNavigate();
  const { purchasedBookIds, getBookProgress } = useLibrary();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBooks([]);
    const load = async () => {
      try {
        setLoading(true);
        const all = await bookService.getMyLibraryBooks();
        const idSet = new Set(purchasedBookIds.map(String));
        const purchased = all.filter(b => b.canReadFull === true);
        if (!cancelled) setBooks(purchased);
      } catch (err) {
        if(!cancelled)setError(err.message);
        if (!cancelled) setBooks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [purchasedBookIds,user?.id]);

  return (
    <div className="max-w-4xl w-full mx-auto space-y-4 box-border">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="p-2 rounded-xl bg-white border border-[#E6E8EC] text-[#0A1D3F] hover:bg-gray-50 transition active:scale-95 shrink-0 mt-0.5"
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            My Books
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
            Books you have purchased — open any title to keep reading
          </p>
        </div>
        {!loading && books.length > 0 && (
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#17B26A]/10 text-[#17B26A]">
            {books.length} purchased
          </span>
        )}
      </div>

      {error && <p role="alert">{error}</p>}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No purchased books yet"
          description="Pay for a book from the catalog and it will appear here."
          actionText="Browse Books"
          onAction={() => navigate("/books")}
        />
      ) : (
        <div className="space-y-2.5">
          {books.map((book) => {
            const IconComponent = coverIconMap[book.coverIcon] || BookOpen;
            const progress = book.readingState ?? getBookProgress(book.id);
            return (
              <div
                key={book.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-14 h-[4.5rem] rounded-xl bg-gradient-to-br ${
                      book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
                    } p-2 flex flex-col justify-between text-white shrink-0 shadow-xs`}
                  >
                    <IconComponent className="w-4 h-4 text-white/80" />
                    <span className="text-[9px] font-bold truncate">Cl {book.class}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#17B26A]/10 text-[#17B26A]">
                        <CheckCircle2 className="w-3 h-3" />
                        Purchased
                      </span>
                      <span className="text-[10px] text-[#667085]">
                        {book.subject} • Class {book.class} • {book.board}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0A1D3F] truncate">{book.title}</h3>
                    <p className="text-[11px] text-[#667085] truncate mt-0.5">
                      {book.pages} pages • {book.fileSize || "PDF"}
                    </p>

                    {progress?.percentage > 0 && (
                      <div className="mt-2 max-w-xs">
                        <div className="flex justify-between text-[10px] text-[#667085] mb-0.5">
                          <span>
                            Page {progress.currentPage || 1} of {book.pages || progress.totalPages}
                          </span>
                          <span className="font-semibold text-[#0A1D3F]">
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#17B26A] h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, progress.percentage)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Off-sale books have no public page; owners still read them. */}
                  {book.onSale !== false && <Link
                    to={`/books/${book.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-[#667085] hover:text-[#0A1D3F] border border-[#E6E8EC] rounded-lg transition"
                  >
                    Details
                  </Link>}
                  <a
                    href={`/books/${book.id}/read`} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-xs flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open secure PDF</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
