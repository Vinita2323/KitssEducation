import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calculator, Atom, BookMarked, Globe2, Languages, Heart, CheckCircle2 } from "lucide-react";
import { RatingBadge } from "../common/SectionHeader";
import { useLibrary } from "../../context/LibraryContext";

const iconMap = {
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages,
  BookOpen
};

export const BookCard = ({
  book,
  layout = "grid", // 'grid' | 'horizontal' | 'library'
  onRead,
  onBuy
}) => {
  const { isBookOwned, isWishlisted, toggleWishlist, getBookProgress } = useLibrary();
  const owned = isBookOwned(book.id);
  const isFree = book.isFree === true || Number(book.price) === 0;
  const wishlisted = isWishlisted(book.id);
  const progress = getBookProgress(book.id);

  const IconComponent = iconMap[book.coverIcon] || BookOpen;

  // Horizontal Card (Used in carousels/recommendations)
  if (layout === "horizontal") {
    return (
      <div className="shrink-0 w-36 sm:w-44 bg-white rounded-xl sm:rounded-2xl border border-[#E6E8EC] p-2 sm:p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden min-w-0">
        <Link to={`/books/${book.id}`} className="block group">
          <div
            className={`w-full aspect-3/4 rounded-lg sm:rounded-xl bg-gradient-to-br ${
              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
            } p-2.5 flex flex-col justify-between text-white relative shadow-inner overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded">
                {book.board}
              </span>
              <IconComponent className="w-4 h-4 text-white/80" />
            </div>

            <div>
              <p className="text-[10px] text-white/70 font-medium">
                {book.subtitle || `Class ${book.class}`}
              </p>
              <h4 className="text-xs font-bold leading-tight line-clamp-2 mt-0.5">
                {book.title}
              </h4>
            </div>

            <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full border-4 border-white/10 pointer-events-none" />
          </div>

          <div className="mt-2 space-y-0.5 min-w-0">
            <h4 className="text-xs font-bold text-[#0A1D3F] truncate group-hover:text-[#FF8A00] transition">
              {book.title}
            </h4>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-[#667085]">Class {book.class}</span>
              <RatingBadge rating={book.rating} />
            </div>
            <div className="pt-1 flex items-baseline justify-between">
              <span className="text-xs font-bold text-[#0A1D3F]">
                {isFree ? "FREE" : `₹${book.price}`}
              </span>
              {owned && !isFree && (
                <span className="text-[9px] font-bold text-[#17B26A] flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Owned
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Library Card (Purchased/Accessible books in My Library with progress bar)
  if (layout === "library") {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white rounded-xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition-all gap-3 min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-14 h-18 rounded-xl bg-gradient-to-br ${
              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
            } p-2 flex flex-col justify-between text-white shrink-0 shadow-xs`}
          >
            <IconComponent className="w-4 h-4 text-white/80" />
            <span className="text-[9px] font-bold truncate">Cl {book.class}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#17B26A]/10 text-[#17B26A]">
                {isFree ? "Free E-Book" : "Purchased"}
              </span>
              <span className="text-[10px] text-[#667085]">{book.fileSize || "PDF"}</span>
              <span className="text-[10px] text-[#667085]">• {book.board}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
              {book.title}
            </h4>
            <p className="text-[11px] text-[#667085] truncate">
              {book.subject} • Class {book.class} • {book.pages} Pages
            </p>

            {/* Reading progress bar */}
            {progress && progress.totalPages && (
              <div className="mt-2 max-w-xs">
                <div className="flex justify-between text-[10px] text-[#667085] font-medium mb-1">
                  <span>Page {progress.currentPage || 1} of {book.pages || progress.totalPages}</span>
                  <span className="font-semibold text-[#0A1D3F]">{progress.percentage || 0}% completed</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#17B26A] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, progress.percentage || 0)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link
            to={`/books/${book.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-[#667085] hover:text-[#0A1D3F] border border-[#E6E8EC] rounded-lg transition"
          >
            Details
          </Link>
          <Link
            to={`/books/${book.id}/read`}
            className="px-4 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-lg shrink-0 transition active:scale-95 shadow-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Continue Reading</span>
          </Link>
        </div>
      </div>
    );
  }

  // Standard Compact Grid Card
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-[#E6E8EC] p-2.5 sm:p-3 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group overflow-hidden min-w-0 w-full">
      <div className="min-w-0">
        {/* Book Cover */}
        <div className="relative overflow-hidden rounded-lg sm:rounded-xl">
          <Link to={`/books/${book.id}`} className="block">
            <div
              className={`w-full aspect-3/4 rounded-lg sm:rounded-xl bg-gradient-to-br ${
                book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
              } p-2.5 sm:p-3.5 flex flex-col justify-between text-white relative shadow-inner overflow-hidden`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded">
                  {book.board}
                </span>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-white/85" />
              </div>

              <div>
                <p className="text-[10px] sm:text-xs text-white/75 font-medium">
                  Class {book.class}
                </p>
                <h3 className="text-xs sm:text-sm font-bold leading-tight line-clamp-2 mt-0.5">
                  {book.title}
                </h3>
              </div>

              {/* Decorative circle */}
              <div className="absolute -bottom-8 -right-8 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white/10 pointer-events-none" />
            </div>
          </Link>

          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={() => toggleWishlist(book.id)}
            className="absolute top-1.5 right-1.5 p-1 sm:p-1.5 rounded-full bg-white/85 backdrop-blur-xs text-[#0A1D3F] hover:bg-white transition shadow-xs cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                wishlisted ? "fill-red-500 text-red-500" : "text-[#0A1D3F]"
              }`}
            />
          </button>
        </div>

        {/* Content Info */}
        <div className="mt-2 space-y-0.5 min-w-0">
          <div className="flex items-center justify-between text-[11px] gap-1 min-w-0">
            <span className="font-bold text-[#FF8A00] truncate">{book.subject}</span>
            <RatingBadge rating={book.rating} />
          </div>

          <Link to={`/books/${book.id}`} className="block min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate group-hover:text-[#FF8A00] transition">
              {book.title}
            </h3>
            <p className="text-[11px] text-[#667085] truncate">{book.subtitle}</p>
          </Link>
        </div>
      </div>

      {/* Pricing & Accurate CTA Buttons */}
      <div className="mt-2 pt-2 border-t border-[#E6E8EC] min-w-0">
        <div className="flex items-baseline justify-between gap-1 mb-1.5 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
            <span className="text-xs sm:text-sm font-black text-[#0A1D3F]">
              {isFree ? "FREE" : `₹${book.price}`}
            </span>
            {book.originalPrice && !isFree && (
              <span className="text-[10px] sm:text-[11px] line-through text-[#667085] truncate">
                ₹{book.originalPrice}
              </span>
            )}
          </div>

          {/* Discount or Free tag */}
          {isFree ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              FREE
            </span>
          ) : book.discount ? (
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-[#ECFDF3] text-[#17B26A] shrink-0">
              {book.discount}
            </span>
          ) : null}
        </div>

        {/* CTA Logic:
            1. Free Book: [ Read ] -> /books/:id/read
            2. Paid Book (Purchased): [ ✓ Purchased / Read ] -> /books/:id/read
            3. Paid Book (Unpurchased): [ Buy Now ] -> /books/:id/checkout (or details)
            NEVER show "Read" for unpaid paid books!
        */}
        {isFree ? (
          <Link
            to={`/books/${book.id}/read`}
            className="w-full py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>
        ) : owned ? (
          <Link
            to={`/books/${book.id}/read`}
            className="w-full py-1.5 bg-[#17B26A] hover:bg-[#0E9355] text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>
        ) : (
          <Link
            to={`/books/${book.id}/checkout`}
            className="w-full py-1.5 bg-[#FF8A00] hover:bg-[#e07b00] text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center text-center shadow-2xs cursor-pointer"
          >
            Buy Now
          </Link>
        )}
      </div>
    </div>
  );
};
