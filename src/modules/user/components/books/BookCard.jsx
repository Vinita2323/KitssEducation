import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calculator, Atom, BookMarked, Globe2, Languages, Star, Heart, CheckCircle2 } from "lucide-react";
import { PriceDisplay, RatingBadge } from "../common/SectionHeader";
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
  const { isBookOwned, isWishlisted, toggleWishlist } = useLibrary();
  const owned = isBookOwned(book.id);
  const wishlisted = isWishlisted(book.id);

  const IconComponent = iconMap[book.coverIcon] || BookOpen;

  if (layout === "horizontal") {
    return (
      <div className="shrink-0 w-36 sm:w-44 bg-white rounded-xl sm:rounded-2xl border border-[#E6E8EC] p-2 sm:p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden min-w-0">
        <Link to={`/books/${book.id}`} className="block group">
          {/* Book Cover Image / Graphic */}
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

          {/* Book Info */}
          <div className="mt-2 space-y-0.5 min-w-0">
            <h4 className="text-xs font-bold text-[#0A1D3F] truncate group-hover:text-[#FF8A00] transition">
              {book.title}
            </h4>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
              <span className="text-[#667085]">Class {book.class}</span>
              <RatingBadge rating={book.rating} />
            </div>
            <div className="pt-1">
              <PriceDisplay
                price={book.price}
                originalPrice={book.originalPrice}
                isFree={book.isFree}
                size="sm"
              />
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (layout === "library") {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition-all gap-3 min-w-0 overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-16 sm:w-14 sm:h-18 rounded-lg sm:rounded-xl bg-gradient-to-br ${
              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
            } p-2 flex flex-col justify-between text-white shrink-0 shadow-xs`}
          >
            <IconComponent className="w-4 h-4 text-white/80" />
            <span className="text-[9px] font-bold truncate">Cl {book.class}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#17B26A]/10 text-[#17B26A]">
                PDF E-Book
              </span>
              <span className="text-[10px] text-[#667085]">{book.fileSize}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
              {book.title}
            </h4>
            <p className="text-[11px] text-[#667085] truncate">
              {book.subtitle} • {book.pages} Pages
            </p>
          </div>
        </div>

        <Link
          to={`/books/${book.id}/read`}
          className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-lg shrink-0 transition active:scale-95 shadow-xs"
        >
          Read Book
        </Link>
      </div>
    );
  }

  // Standard Compact Grid Card (Zero overflow guaranteed)
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

      {/* Pricing & CTA Button (Responsive Stacked Layout - No Grid Blowout) */}
      <div className="mt-2 pt-2 border-t border-[#E6E8EC] min-w-0">
        <div className="flex items-baseline justify-between gap-1 mb-1.5 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0 truncate">
            <span className="text-xs sm:text-sm font-black text-[#0A1D3F]">
              {book.isFree || book.price === 0 ? "FREE" : `₹${book.price}`}
            </span>
            {book.originalPrice && !book.isFree && (
              <span className="text-[10px] sm:text-[11px] line-through text-[#667085] truncate">
                ₹{book.originalPrice}
              </span>
            )}
          </div>
          {book.discount && !book.isFree && (
            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-[#ECFDF3] text-[#17B26A] shrink-0">
              {book.discount}
            </span>
          )}
        </div>

        {owned ? (
          <Link
            to={`/books/${book.id}/read`}
            className="w-full py-1.5 bg-[#17B26A] hover:bg-[#0E9355] text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>
        ) : (
          <Link
            to={`/books/${book.id}`}
            className="w-full py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-lg transition active:scale-95 flex items-center justify-center text-center shadow-2xs cursor-pointer"
          >
            {book.isFree ? "Read Free" : "Buy Now"}
          </Link>
        )}
      </div>
    </div>
  );
};
