import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  BookOpen,
  FileText,
  Languages,
  HardDrive,
  CheckCircle2,
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { PriceDisplay, RatingBadge } from "../../components/common/SectionHeader";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { BookPreviewModal } from "../../components/books/BookFilterModal";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

const iconMap = {
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages,
  BookOpen
};

export const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isBookOwned, isWishlisted, toggleWishlist, getBookProgress } = useLibrary();
  const { showSuccess, showInfo } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await bookService.getBookById(id);
        setBook(data);
      } catch (err) {
        setError(err.message || "Failed to load book details.");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book?.title,
        text: `Check out ${book?.title} on KITSS Education!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Book link copied to clipboard!");
    }
  };

  if (loading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  if (error || !book) {
    return (
      <ErrorState
        title="Book Not Found"
        message={error || "Could not retrieve the requested book details."}
        onRetry={() => navigate("/books")}
      />
    );
  }

  const isFree = book.isFree === true || Number(book.price) === 0;
  const owned = isBookOwned(book.id);
  const wishlisted = isWishlisted(book.id);
  const progress = getBookProgress(book.id);
  const IconComponent = iconMap[book.coverIcon] || BookOpen;

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Top Header Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleWishlist(book.id)}
            className="p-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 active:scale-95 transition text-[#0A1D3F] cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart
              className={`w-4 h-4 ${
                wishlisted ? "fill-red-500 text-red-500" : "text-[#0A1D3F]"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 active:scale-95 transition text-[#0A1D3F] cursor-pointer"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          {/* Left: Book Cover & Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div
              className={`w-full max-w-[260px] aspect-3/4 rounded-2xl bg-gradient-to-br ${
                book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
              } p-5 flex flex-col justify-between text-white shadow-xl relative overflow-hidden`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-md">
                  {book.board}
                </span>
                <IconComponent className="w-8 h-8 text-white/80" />
              </div>

              <div>
                <p className="text-xs text-white/70 font-medium">
                  Class {book.class} • {book.subject}
                </p>
                <h3 className="text-lg font-extrabold leading-snug mt-1">
                  {book.title}
                </h3>
              </div>

              <div className="text-[10px] text-white/60">
                {book.author}
              </div>

              {/* Decorative circle */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full border-4 border-white/10 pointer-events-none" />
            </div>

            {/* Quick Preview Button */}
            <div className="w-full max-w-[260px] mt-4">
              <SecondaryButton
                fullWidth
                size="md"
                onClick={() => setShowPreviewModal(true)}
                icon={Sparkles}
              >
                Preview Sample Pages
              </SecondaryButton>
            </div>
          </div>

          {/* Right: Book Details & Specs */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              {/* Hierarchy Badges: Board -> Class -> Subject */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0A1D3F] text-white">
                  {book.board}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FF8A00]/15 text-[#FF8A00]">
                  Class {book.class}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  {book.subject}
                </span>
                {owned && !isFree && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Purchased
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
                {book.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                {book.subtitle}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2.5">
                <RatingBadge rating={book.rating} count={book.reviewCount} />
                <span className="text-xs text-[#667085]">• Verified Educational Curriculum</span>
              </div>

              {/* Price Block */}
              <div className="mt-4 p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC]">
                <PriceDisplay
                  price={book.price}
                  originalPrice={book.originalPrice}
                  discount={book.discount}
                  isFree={isFree}
                  size="lg"
                />
              </div>

              {/* About This Book */}
              <div className="mt-4">
                <h3 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-1.5">
                  About This Book
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                <div className="p-3 bg-white rounded-xl border border-[#E6E8EC] text-center">
                  <FileText className="w-4 h-4 mx-auto text-[#0A1D3F] mb-1" />
                  <span className="text-[10px] text-[#667085] block">Pages</span>
                  <span className="text-xs font-bold text-[#0A1D3F]">{book.pages}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E6E8EC] text-center">
                  <Languages className="w-4 h-4 mx-auto text-[#17B26A] mb-1" />
                  <span className="text-[10px] text-[#667085] block">Language</span>
                  <span className="text-xs font-bold text-[#0A1D3F]">{book.language}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E6E8EC] text-center">
                  <BookOpen className="w-4 h-4 mx-auto text-[#FF8A00] mb-1" />
                  <span className="text-[10px] text-[#667085] block">Format</span>
                  <span className="text-xs font-bold text-[#0A1D3F]">{book.format || "PDF"}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E6E8EC] text-center">
                  <HardDrive className="w-4 h-4 mx-auto text-[#6C4AB6] mb-1" />
                  <span className="text-[10px] text-[#667085] block">File Size</span>
                  <span className="text-xs font-bold text-[#0A1D3F]">{book.fileSize || "10 MB"}</span>
                </div>
              </div>
            </div>

            {/* CTAs strictly matching access rules:
                1. Free book: [ Read Free PDF ] -> /books/:id/read
                2. Paid book (owned): [ ✓ Purchased — Read Book ] -> /books/:id/read
                3. Paid book (unpurchased): [ Buy Now for ₹Price ] -> /books/:id/checkout
            */}
            <div className="pt-4 border-t border-[#E6E8EC] space-y-2">
              {isFree ? (
                <Link to={`/books/${book.id}/read`} className="block">
                  <PrimaryButton
                    variant="navy"
                    size="lg"
                    fullWidth
                    icon={BookOpen}
                  >
                    Read Free E-Book
                  </PrimaryButton>
                </Link>
              ) : owned ? (
                <Link to={`/books/${book.id}/read`} className="block">
                  <PrimaryButton
                    variant="green"
                    size="lg"
                    fullWidth
                    icon={CheckCircle2}
                  >
                    {progress?.currentPage > 1
                      ? `Continue Reading (Page ${progress.currentPage})`
                      : "Read Book in PDF Viewer"}
                  </PrimaryButton>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link to={`/books/${book.id}/checkout`} className="block">
                    <PrimaryButton
                      variant="orange"
                      size="lg"
                      fullWidth
                      icon={ShoppingBag}
                    >
                      Buy Now for ₹{book.price}
                    </PrimaryButton>
                  </Link>
                  <p className="text-[11px] text-[#667085] text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#17B26A]" />
                    Instant access to complete PDF upon checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters Covered Section */}
      {book.chapters && book.chapters.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Table of Contents
            </h3>
            <span className="text-xs font-semibold text-[#667085]">
              {book.chapters.length} Chapters Covered
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {book.chapters.map((ch, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-medium text-[#0A1D3F] flex items-center gap-2.5"
              >
                <span className="w-6 h-6 rounded-lg bg-white border border-[#E6E8EC] flex items-center justify-center text-[10px] font-bold text-[#0A1D3F] shrink-0 shadow-2xs">
                  {idx + 1}
                </span>
                <span className="truncate">{ch}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Preview Modal */}
      <BookPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        book={book}
      />
    </div>
  );
};
