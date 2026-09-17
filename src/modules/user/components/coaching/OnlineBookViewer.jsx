import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Lock,
  BookOpen,
  Bookmark,
  CheckCircle2,
  RotateCcw
} from "lucide-react";

export const OnlineBookViewer = ({
  book,
  courseTitle = "Class 10 CBSE Science",
  studentName = "Rohan Sharma",
  studentId = "KITSS20261084",
  onPageChange,
}) => {
  const totalPages = book?.pages || 48;
  const [currentPage, setCurrentPage] = useState(book?.currentPage || 1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      if (onPageChange) onPageChange(nextPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      if (onPageChange) onPageChange(prevPage);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 145));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 80));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  const progressPct = Math.round((currentPage / totalPages) * 100);

  // Content for mock reading pages
  const getPageContent = (page) => {
    return {
      title: `${book?.title || "Study Material"} - Section ${page}`,
      topic: `${book?.subject || "Subject"} | ${book?.chapter || "Chapter Notes"}`,
      bodyParagraphs: [
        `This digital study material is tailored exclusively for ${courseTitle} students enrolled on the KITSS Education portal. Review key conceptual principles, annotated formulas, and practice problems below.`,
        `1. Fundamental Principles: All natural phenomena discussed in this chapter adhere to standard conservation and equilibrium laws. In Class 10/12 board examinations, always support your descriptive answers with properly labeled diagrams and standard SI unit conversions.`,
        `2. Examiner Insights: When answering 3-mark and 5-mark structured questions, write your solution point-wise. Underline the main keywords and conclusion statements to maximize step-wise marks allocation.`,
        `3. Solved Case Problem (Page ${page}): A sample observation indicates a 15% increase in efficiency under controlled conditions. Calculate the resulting derivative using the standard formulae provided in the chapter overview.`
      ],
      formulaBox: `Formula Reference ${page}: ΔE = h·ν | F = m·a | V = I·R | pH = -log[H+]`
    };
  };

  const content = getPageContent(currentPage);

  return (
    <div className="bg-[#0A1D3F] rounded-2xl border border-[#133C8B] overflow-hidden shadow-2xl flex flex-col select-none">
      {/* Top Reader Controls Bar */}
      <div className="bg-[#061226] border-b border-[#133C8B] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Book Meta Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-xs sm:max-w-md">
              {book?.title || "Digital Study Material"}
            </h4>
            <span className="text-[11px] text-white/60">
              {book?.subject} • {book?.chapter}
            </span>
          </div>
        </div>

        {/* Center/Right: Zoom, Bookmark, Page Slider (NO DOWNLOAD BUTTON) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/10 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-[#FF8A00] transition cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-[#FF8A00] transition cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={resetZoom}
                className="p-1 text-white/60 hover:text-white transition"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isBookmarked
                ? "bg-[#FF8A00] text-white border-[#FF8A00]"
                : "bg-white/10 text-white/70 hover:text-white border-white/10"
            }`}
            title="Bookmark Page"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="w-full bg-black/40 h-1">
        <div
          className="h-full bg-[#17B26A] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Document Reader Canvas Viewport */}
      <div
        className="p-4 sm:p-8 bg-[#F7F8FA] min-h-[460px] sm:min-h-[560px] flex items-center justify-center overflow-auto relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Floating Moving Security Watermarks */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 opacity-30 select-none overflow-hidden">
          <div className="flex justify-between text-xs font-mono text-[#0A1D3F] rotate-[-12deg]">
            <span>{studentName} ({studentId})</span>
            <span>PROTECTED DIGITAL READER</span>
          </div>
          <div className="flex justify-center text-sm font-mono font-bold text-[#0A1D3F] rotate-[-12deg]">
            <span>{studentName} - LICENSED FOR SINGLE STUDENT USE</span>
          </div>
          <div className="flex justify-between text-xs font-mono text-[#0A1D3F] rotate-[-12deg]">
            <span>KITSS EDUCATION</span>
            <span>{studentId}</span>
          </div>
        </div>

        {/* Paper Document Canvas */}
        <div
          className="bg-white rounded-xl shadow-xl border border-[#E6E8EC] p-6 sm:p-10 max-w-2xl w-full mx-auto relative transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          {/* Paper Header */}
          <div className="border-b border-[#E6E8EC] pb-4 mb-6 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#FF8A00] uppercase tracking-wider">
                {content.topic}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F] mt-0.5">
                {content.title}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#667085] bg-[#F7F8FA] px-2.5 py-1 rounded-full border border-[#E6E8EC]">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Paper Content */}
          <div className="space-y-4 text-xs sm:text-sm text-[#0A1D3F] leading-relaxed">
            {content.bodyParagraphs.map((para, idx) => (
              <p key={idx} className="text-justify text-[#0A1D3F]/85">
                {para}
              </p>
            ))}

            {/* Formula Highlight Box */}
            <div className="my-6 p-4 rounded-xl bg-[#FFF4E5] border border-[#FF8A00]/30 font-mono text-xs sm:text-sm text-[#0A1D3F] font-bold text-center">
              {content.formulaBox}
            </div>

            <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#667085]">
              <span className="font-semibold text-[#0A1D3F]">Examination Tip: </span>
              Always write clear step-by-step reasoning for all intermediate calculations.
            </div>
          </div>

          {/* Paper Footer */}
          <div className="border-t border-[#E6E8EC] pt-4 mt-8 flex items-center justify-between text-[11px] text-[#667085]">
            <span>KITSS Education Verified Study Material</span>
            <span>Single Student Digital License</span>
          </div>
        </div>
      </div>

      {/* Bottom Reader Navigation Bar */}
      <div className="bg-[#061226] border-t border-[#133C8B] px-4 py-3 flex items-center justify-between text-white text-xs">
        {/* Prev Page Button */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
            currentPage <= 1
              ? "opacity-40 cursor-not-allowed bg-white/5"
              : "bg-white/10 hover:bg-[#FF8A00] text-white"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Page indicator */}
        <div className="flex items-center gap-2 font-mono text-xs sm:text-sm">
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= totalPages) {
                setCurrentPage(val);
                if (onPageChange) onPageChange(val);
              }
            }}
            className="w-12 px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-center font-bold text-white outline-none focus:border-[#FF8A00]"
          />
          <span className="text-white/60">/ {totalPages}</span>
        </div>

        {/* Next Page Button */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition cursor-pointer ${
            currentPage >= totalPages
              ? "opacity-40 cursor-not-allowed bg-white/5"
              : "bg-[#FF8A00] hover:bg-[#E67C00] text-white"
          }`}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Digital Rights Disclaimer Strip */}
      <div className="bg-black/60 px-4 py-2 flex items-center justify-center gap-2 text-center text-white/70 text-[11px]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A00]" />
        <span>Study material is available for online reading only. Download or print functionality is disabled.</span>
      </div>
    </div>
  );
};
