import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Share2,
  Bookmark,
  Sparkles,
  BookOpen
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { useToast } from "../../context/ToastContext";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

export const PdfReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showInfo } = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await bookService.getBookById(id);
        setBook(data);
      } catch (err) {
        console.error("Reader load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const totalPages = book?.pages || 320;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 20, 160));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 20, 80));
  };

  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    showSuccess(!isBookmarked ? `Page ${currentPage} bookmarked!` : "Bookmark removed");
  };

  if (loading) {
    return <SkeletonLoader type="card" count={2} />;
  }

  if (!book) {
    return (
      <ErrorState
        title="Book Not Found"
        message="Could not load the requested book reader."
        onRetry={() => navigate("/library")}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Reader Top Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#E6E8EC] shadow-xs flex items-center justify-between gap-3 sticky top-18 z-30">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Close Reader</span>
        </button>

        <div className="min-w-0 text-center flex-1">
          <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
            {book.title}
          </h2>
          <p className="text-[10px] text-[#667085] truncate">
            {book.subtitle} • Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition ${
              isBookmarked
                ? "bg-amber-50 border-amber-300 text-amber-600"
                : "bg-white border-[#E6E8EC] text-gray-500 hover:bg-gray-50"
            }`}
            aria-label="Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="hidden sm:flex p-2 rounded-xl bg-white border border-[#E6E8EC] text-gray-600 hover:bg-gray-50 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-block text-xs font-mono font-bold text-gray-500 px-1">
            {zoomLevel}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            className="hidden sm:flex p-2 rounded-xl bg-white border border-[#E6E8EC] text-gray-600 hover:bg-gray-50 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reader Page Paper Canvas */}
      <div className="flex justify-center p-2 sm:p-4 bg-gray-200/60 rounded-3xl min-h-[600px] overflow-auto">
        <div
          className="bg-white rounded-2xl shadow-xl border border-[#E6E8EC] p-6 sm:p-12 w-full max-w-2xl transition-all duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          {/* Header of Simulated Book Page */}
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6 text-[10px] text-[#667085] uppercase tracking-wider font-semibold">
            <span>KITSS Education • {book.board}</span>
            <span>{book.title} (Class {book.class})</span>
            <span>Page {currentPage}</span>
          </div>

          {/* Page Content Simulation */}
          <div className="space-y-4 text-xs sm:text-sm text-[#0A1D3F] leading-relaxed">
            <div className="p-3 bg-[#0A1D3F]/5 rounded-xl border border-[#0A1D3F]/10">
              <span className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-wider block">
                Chapter Overview
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] mt-0.5">
                {book.chapters ? book.chapters[(currentPage - 1) % (book.chapters.length || 1)] : "Fundamental Concepts & Principles"}
              </h3>
            </div>

            <p className="font-semibold text-gray-700">
              1. Introduction & Historical Background
            </p>
            <p className="text-gray-600">
              In this chapter, we explore key foundational definitions, theorems, and practical applications according to the latest {book.board} curriculum guidelines. Understanding the step-by-step derivations is critical for scoring maximum marks in board evaluations.
            </p>

            <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] font-mono text-xs space-y-1">
              <p className="font-bold text-[#0A1D3F]">Key Mathematical Identity / Formula:</p>
              <p className="text-[#FF8A00] font-bold">ax² + bx + c = 0 ⟹ x = (-b ± √(b² - 4ac)) / (2a)</p>
              <p className="text-gray-500 text-[11px]">Where D = b² - 4ac determines the nature of the roots (Real, Equal, or Complex).</p>
            </div>

            <p className="font-semibold text-gray-700">
              2. Solved Exemplar Problem
            </p>
            <p className="text-gray-600">
              <strong>Question:</strong> Find the roots of the given quadratic equation and verify the relationship between coefficients and zeroes.
            </p>
            <p className="text-gray-600">
              <strong>Solution:</strong> Applying standard factorisation method or the quadratic formula yields real and distinct roots. Ensure all intermediate steps are documented as per the marking scheme.
            </p>
          </div>

          {/* Footer of Page */}
          <div className="border-t border-gray-200 mt-10 pt-4 flex justify-between items-center text-[10px] text-[#667085]">
            <span>© {new Date().getFullYear()} KITSS Editorial Board</span>
            <span className="font-bold font-mono">Page {currentPage} of {totalPages}</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Pagination Controls */}
      <div className="bg-white p-3 rounded-2xl border border-[#E6E8EC] shadow-md flex items-center justify-between max-w-md mx-auto sticky bottom-20 z-30">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-[#0A1D3F] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="text-xs font-mono font-bold text-[#0A1D3F]">
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] disabled:opacity-40 disabled:pointer-events-none text-xs font-bold text-white transition"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
