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
      <div className="shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-[#E6E8EC] p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <Link to={`/books/${book.id}`} className="block group">
          {/* Book Cover Image / Graphic */}
          <div
            className={`w-full aspect-3/4 rounded-xl bg-gradient-to-br ${
              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
            } p-3 flex flex-col justify-between text-white relative shadow-inner overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                {book.board}
              </span>
              <IconComponent className="w-5 h-5 text-white/80" />
            </div>

            <div>
              <p className="text-[10px] text-white/70 font-medium">
                {book.subtitle || `Class ${book.class}`}
              </p>
              <h4 className="text-xs font-bold leading-tight line-clamp-2 mt-0.5">
                {book.title}
              </h4>
            </div>

            {/* Subtle decorative ring */}
            <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full border-4 border-white/10 pointer-events-none" />
          </div>

          {/* Book Info */}
          <div className="mt-2.5 space-y-1">
            <h4 className="text-xs font-bold text-[#0A1D3F] truncate group-hover:text-[#FF8A00] transition">
              {book.title}
            </h4>
            <div className="flex items-center justify-between text-[11px]">
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
      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition-all gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-14 h-18 rounded-xl bg-gradient-to-br ${
              book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
            } p-2 flex flex-col justify-between text-white shrink-0 shadow-xs`}
          >
            <IconComponent className="w-4 h-4 text-white/80" />
            <span className="text-[9px] font-bold truncate">Cl {book.class}</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#17B26A]/10 text-[#17B26A]">
                PDF E-Book
              </span>
              <span className="text-[11px] text-[#667085]">{book.fileSize}</span>
            </div>
            <h4 className="text-sm font-bold text-[#0A1D3F] truncate">
              {book.title}
            </h4>
            <p className="text-xs text-[#667085] truncate">
              {book.subtitle} • {book.pages} Pages
            </p>
          </div>
        </div>

        <Link
          to={`/books/${book.id}/read`}
          className="px-4 py-2 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl shrink-0 transition active:scale-95 shadow-xs"
        >
          Read Book
        </Link>
      </div>
    );
  }

  // Standard Grid Card
  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Book Cover */}
        <div className="relative">
          <Link to={`/books/${book.id}`} className="block">
            <div
              className={`w-full aspect-3/4 rounded-xl bg-gradient-to-br ${
                book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
              } p-4 flex flex-col justify-between text-white relative shadow-inner overflow-hidden`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                  {book.board}
                </span>
                <IconComponent className="w-6 h-6 text-white/80" />
              </div>

              <div>
                <p className="text-xs text-white/70 font-medium">
                  Class {book.class}
                </p>
                <h3 className="text-sm font-bold leading-snug line-clamp-2 mt-0.5">
                  {book.title}
                </h3>
              </div>

              {/* Decorative circle */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full border-4 border-white/10 pointer-events-none" />
            </div>
          </Link>

          {/* Wishlist toggle */}
          <button
            type="button"
            onClick={() => toggleWishlist(book.id)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xs text-[#0A1D3F] hover:bg-white transition shadow-xs"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-4 h-4 ${
                wishlisted ? "fill-red-500 text-red-500" : "text-[#0A1D3F]"
              }`}
            />
          </button>
        </div>

        {/* Content Info */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#FF8A00]">{book.subject}</span>
            <RatingBadge rating={book.rating} count={book.reviewCount} />
          </div>

          <Link to={`/books/${book.id}`} className="block">
            <h3 className="text-sm font-bold text-[#0A1D3F] line-clamp-1 group-hover:text-[#FF8A00] transition">
              {book.title}
            </h3>
            <p className="text-xs text-[#667085] line-clamp-1">{book.subtitle}</p>
          </Link>
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="mt-3 pt-3 border-t border-[#E6E8EC] flex items-center justify-between gap-2">
        <PriceDisplay
          price={book.price}
          originalPrice={book.originalPrice}
          discount={book.discount}
          isFree={book.isFree}
          size="sm"
        />

        {owned ? (
          <Link
            to={`/books/${book.id}/read`}
            className="px-3 py-1.5 bg-[#17B26A] hover:bg-[#0E9355] text-white text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>
        ) : (
          <Link
            to={`/books/${book.id}`}
            className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition active:scale-95"
          >
            {book.isFree ? "Read Free" : "Buy Now"}
          </Link>
        )}
      </div>
    </div>
  );
};
