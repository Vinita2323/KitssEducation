import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  List,
  ZoomIn,
  ZoomOut,
  X,
  BookOpen,
  Award,
  Lightbulb,
  FileCheck2,
  Check,
  ShieldAlert,
  Lock,
  EyeOff,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { coachingService } from "../../services/coachingService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { ErrorState } from "../../components/common/EmptyState";

export const PdfReaderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canAccessBook, updateReadingProgress, getBookProgress, toggleBookmark, isPageBookmarked } = useLibrary();
  const { showSuccess, showInfo, showWarning } = useToast();

  const [book, setBook] = useState(null);
  const [student, setStudent] = useState({ name: "Rohan Sharma", id: "KITSS20261084" });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showToc, setShowToc] = useState(false);

  // Anti-Screenshot & DRM Protection States
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Load Book and Student Profile Data
  useEffect(() => {
    const fetchReaderData = async () => {
      try {
        setLoading(true);
        const [bookData, profileData] = await Promise.all([
          bookService.getBookById(id),
          coachingService.getStudentProfile().catch(() => null)
        ]);
        setBook(bookData);
        if (profileData) {
          setStudent(profileData);
        }

        // Resume reading position
        const savedProgress = getBookProgress(id);
        if (savedProgress && savedProgress.currentPage) {
          setCurrentPage(savedProgress.currentPage);
        }
      } catch (err) {
        console.error("Reader load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReaderData();
  }, [id]);

  // Update reading progress whenever currentPage changes
  useEffect(() => {
    if (book && currentPage) {
      const total = book.pages || 195;
      updateReadingProgress(book.id, currentPage, total);
    }
  }, [currentPage, book]);

  // DRM & Screenshot prevention listeners
  useEffect(() => {
    const triggerScreenshotBlock = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(
            "⚠️ Screenshots and screen captures of KITSS Education digital textbooks are strictly prohibited under copyright law."
          );
        }
      } catch (err) {
        // clipboard access restricted
      }

      setShowScreenshotModal(true);
      showWarning("Screenshot Blocked! Digital Rights Protection is active.");
    };

    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        triggerScreenshotBlock(e);
        return false;
      }

      if (
        (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === "S" || e.key === "s")) ||
        (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s"))
      ) {
        triggerScreenshotBlock(e);
        return false;
      }

      if (
        e.metaKey &&
        e.shiftKey &&
        (e.key === "3" || e.key === "4" || e.key === "5" || e.code === "Digit3" || e.code === "Digit4" || e.code === "Digit5")
      ) {
        triggerScreenshotBlock(e);
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        showWarning("Printing is disabled for protected digital textbooks.");
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        showWarning("Saving offline files is disabled for protected books.");
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        showWarning("Text copying is disabled on licensed study material.");
        return false;
      }

      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C" || e.key === "i" || e.key === "j" || e.key === "c"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        triggerScreenshotBlock(e);
        return false;
      }
    };

    const handleWindowBlur = () => {
      setIsWindowBlurred(true);
    };

    const handleWindowFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsWindowBlurred(true);
      } else {
        setIsWindowBlurred(false);
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      showInfo("Right-click context menu is disabled on protected textbooks.");
      return false;
    };

    const handleCopy = (e) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData(
          "text/plain",
          "Protected Content - Copying is prohibited by KITSS Education."
        );
      }
      showWarning("Copying text is disabled on protected curriculum material.");
      return false;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
    };
  }, [showWarning, showInfo]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F1F3F7] p-8">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-md border border-slate-200 space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
          <div className="h-64 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F1F3F7] p-4">
        <ErrorState
          title="Book Not Found"
          message="Could not load the requested digital book."
          actionText="Back to Books"
          onAction={() => navigate("/books")}
        />
      </div>
    );
  }

  // Access check: Free books or Owned paid books only
  const hasAccess = canAccessBook(book);

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F1F3F7] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 text-center shadow-lg space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-[#FF8A00] flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0A1D3F] text-white uppercase tracking-wider">
              {book.board} • Class {book.class}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F] mt-2">
              Purchase Required
            </h2>
            <p className="text-xs text-[#667085] mt-1 leading-relaxed">
              "{book.title}" is a premium curriculum book. Purchase once to read anytime with lifetime access.
            </p>
          </div>

          <div className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] flex items-center justify-between">
            <div className="text-left">
              <span className="text-xs text-[#667085] block">Price</span>
              <span className="text-base font-extrabold text-[#0A1D3F]">₹{book.price}</span>
            </div>
            {book.originalPrice && (
              <span className="text-xs text-[#667085] line-through">
                ₹{book.originalPrice}
              </span>
            )}
            {book.discount && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {book.discount}
              </span>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <Link to={`/books/${book.id}/checkout`} className="block">
              <PrimaryButton
                variant="orange"
                size="md"
                fullWidth
                icon={ShoppingBag}
              >
                Buy Now for ₹{book.price}
              </PrimaryButton>
            </Link>

            <Link
              to={`/books/${book.id}`}
              className="block text-xs font-semibold text-slate-600 hover:text-slate-900 py-1"
            >
              View Book Details & Preview Sample
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = book?.pages || 195;
  const chapters = book?.chapters || [
    "1. Resources and Development",
    "2. Forest and Wildlife Resources",
    "3. Water Resources",
    "4. Agriculture",
    "5. Minerals and Energy Resources",
    "6. Manufacturing Industries"
  ];

  const chapterIndex = Math.min(
    Math.floor(((currentPage - 1) / totalPages) * chapters.length),
    chapters.length - 1
  );
  const currentChapterTitle = chapters[chapterIndex] || "Chapter Overview";
  const isBookmarked = isPageBookmarked(book.id, currentPage);

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

  const handleJumpToChapter = (idx) => {
    const targetPage = Math.max(1, Math.floor((idx / chapters.length) * totalPages) + 1);
    setCurrentPage(targetPage);
    setShowToc(false);
    showInfo(`Jumped to ${chapters[idx]}`);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 15, 130));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 15, 90));
  };

  const handleToggleBookmark = () => {
    toggleBookmark(book.id, currentPage);
    if (!isBookmarked) {
      showSuccess(`Page ${currentPage} bookmarked!`);
    } else {
      showInfo("Bookmark removed");
    }
  };

  const progressPct = Math.round((currentPage / totalPages) * 100);
  const isGeography = book?.subject === "Social Science" || book?.id === "book-105";

  return (
    <div className="flex-1 flex flex-col h-full w-full max-w-full overflow-hidden bg-[#F1F3F7] relative select-none">
      {/* 1. Top Reader App Bar */}
      <header className="no-print-reader shrink-0 h-14 bg-white border-b border-[#E6E8EC] px-3 sm:px-5 flex items-center justify-between gap-2 z-20 shadow-2xs">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 p-2 rounded-xl text-[#0A1D3F] hover:bg-slate-100 transition font-bold text-xs shrink-0 cursor-pointer"
          title="Close Reader"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="min-w-0 text-center flex-1 px-2">
          <h2 className="text-xs sm:text-sm font-extrabold text-[#0A1D3F] truncate flex items-center justify-center gap-1.5">
            <span>{book.title}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Lock className="w-2.5 h-2.5" /> DRM
            </span>
          </h2>
          <p className="text-[11px] text-[#667085] truncate font-medium">
            Class {book.class} ({book.board}) • {currentChapterTitle}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowToc(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#E6E8EC] text-[#0A1D3F] hover:bg-slate-50 transition text-xs font-semibold cursor-pointer"
            title="Chapters & Contents"
          >
            <List className="w-4 h-4 text-[#0A1D3F]" />
            <span className="hidden md:inline">Chapters</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isBookmarked
                ? "bg-amber-50 border-amber-300 text-amber-500 shadow-2xs"
                : "bg-white border-[#E6E8EC] text-[#667085] hover:bg-slate-50"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Page"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
          </button>

          <div className="hidden sm:flex items-center border border-[#E6E8EC] rounded-xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 90}
              className="p-1.5 hover:bg-slate-50 disabled:opacity-30 text-[#667085] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-[#0A1D3F] px-1">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 130}
              className="p-1.5 hover:bg-slate-50 disabled:opacity-30 text-[#667085] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Reading Canvas */}
      <div className="no-print-reader flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex justify-center items-start relative">
        {isWindowBlurred && !showScreenshotModal && (
          <div
            onClick={() => setIsWindowBlurred(false)}
            className="absolute inset-0 z-30 bg-[#0A1D3F]/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-white cursor-pointer select-none transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#FF8A00]/20 border border-[#FF8A00]/40 flex items-center justify-center text-[#FF8A00] mb-4 shadow-xl">
              <EyeOff className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30 mb-2">
              Privacy Protection Active
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              Reader Paused
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-sm mb-5 leading-relaxed">
              Book content is temporarily obscured to prevent background screen recording or capture.
            </p>
            <button
              type="button"
              onClick={() => setIsWindowBlurred(false)}
              className="px-6 py-2.5 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              Click Anywhere to Resume Reading
            </button>
          </div>
        )}

        <div
          className={`bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 sm:p-10 w-full max-w-2xl min-h-[680px] flex flex-col justify-between my-2 transition-transform duration-150 origin-top relative overflow-hidden select-none ${
            isWindowBlurred ? "filter blur-lg" : ""
          }`}
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Watermark overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 opacity-[0.14] select-none overflow-hidden z-10">
            <div className="flex justify-between text-[11px] font-mono font-bold text-[#0A1D3F] rotate-[-15deg] whitespace-nowrap">
              <span>{student.name.toUpperCase()} ({student.id})</span>
              <span>KITSS EDUCATION DRM PROTECTED</span>
            </div>
            <div className="flex justify-around text-xs font-mono font-bold text-[#0A1D3F] rotate-[-15deg] whitespace-nowrap">
              <span>SINGLE STUDENT LICENSED VIEW</span>
              <span>DO NOT DISTRIBUTE</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono font-bold text-[#0A1D3F] rotate-[-15deg] whitespace-nowrap">
              <span>{student.name.toUpperCase()} • {student.id}</span>
              <span>UNAUTHORIZED COPYING PROHIBITED</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 text-[10px] sm:text-[11px] font-bold text-[#667085] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[#0A1D3F]">
                <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
                KITSS Education • {book.board}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                {book.title} (Class {book.class})
              </span>
              <span className="font-mono text-[#0A1D3F]">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="mb-5">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#FFF7ED] text-[#FF8A00] text-[11px] font-bold uppercase tracking-wider mb-1">
                Chapter {chapterIndex + 1}
              </span>
              <h1 className="text-base sm:text-xl font-black text-[#0A1D3F] tracking-tight">
                {currentChapterTitle.replace(/^\d+\.\s*/, "")}
              </h1>
            </div>

            {isGeography ? (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
                    1. Concept & Classification of Resources
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-justify">
                    Everything available in our environment which can be used to satisfy our needs, provided it is technologically accessible, economically feasible and culturally acceptable can be termed as a <strong>'Resource'</strong>. The process of transformation of things available in our environment involves an interdependent relationship between nature, technology, and institutions.
                  </p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 shadow-2xs font-mono text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#0A1D3F] font-sans font-bold text-xs">
                    <Award className="w-4 h-4 text-[#FF8A00]" />
                    <span>Four-Fold Classification of Resources:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans pt-1">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="font-bold text-[#0A1D3F] block">On the Basis of Origin:</span>
                      <span className="text-slate-600">• Biotic (Flora, Fauna, Fisheries)</span><br />
                      <span className="text-slate-600">• Abiotic (Rocks, Metals, Minerals)</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                      <span className="font-bold text-[#0A1D3F] block">On Exhaustibility:</span>
                      <span className="text-slate-600">• Renewable (Solar, Wind, Forests)</span><br />
                      <span className="text-slate-600">• Non-Renewable (Fossil fuels, Coal)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Board Solved Exemplar
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      3 Marks
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    <strong>Question:</strong> "India has enormous diversity in the availability of resources." Justify this statement with three suitable examples.
                  </p>
                  <div className="space-y-1.5 text-slate-600 text-xs pl-2.5 border-l-2 border-emerald-300">
                    <p><strong>Point 1: Mineral Wealth:</strong> States like Jharkhand, Chhattisgarh, and Madhya Pradesh are exceptionally rich in mineral deposits and coal.</p>
                    <p><strong>Point 2: Water Resources:</strong> Arunachal Pradesh possesses abundance of water resources but lacks adequate infrastructural connectivity.</p>
                    <p><strong>Point 3: Renewable Energy:</strong> Rajasthan and Gujarat are richly endowed with solar and wind energy potential.</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 flex items-start gap-2.5 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-900 leading-relaxed text-[11px] sm:text-xs">
                    <strong>Examiner's Marking Tip:</strong> When answering 3-mark and 5-mark geography questions, always structure answers with bold point headings and cite specific Indian state names.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF8A00]" />
                    1. Core Principles & Theoretical Background
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    In this chapter, students investigate key foundational theorems, standard definitions, and analytical methods strictly aligned with the latest {book.board} examination framework.
                  </p>
                </div>

                <div className="p-4 bg-[#F8FAFC] rounded-xl border border-slate-200 shadow-2xs font-mono text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#0A1D3F] font-sans font-bold text-xs">
                    <Award className="w-4 h-4 text-[#FF8A00]" />
                    <span>Key Identities & Theoretical Formulae:</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/80 text-[#0A1D3F] font-bold text-center">
                    ax² + bx + c = 0 &nbsp;⟹&nbsp; x = (-b ± √(b² - 4ac)) / (2a)
                  </div>
                  <p className="font-sans text-[11px] text-[#667085] leading-normal pt-0.5">
                    <strong>Discriminant Rule:</strong> When D = b² - 4ac &gt; 0, roots are real and distinct. When D = 0, roots are real and equal.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      Board Solved Exemplar
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      3 Marks
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">
                    <strong>Problem:</strong> Determine whether 2x² - 7x + 3 = 0 has real roots, and if so, find them using the quadratic formula.
                  </p>
                  <div className="space-y-1 text-slate-600 text-xs pl-2 border-l-2 border-emerald-300">
                    <p><strong>Step 1:</strong> a = 2, b = -7, c = 3.</p>
                    <p><strong>Step 2:</strong> D = (-7)² - 4(2)(3) = 49 - 24 = 25 &gt; 0 (Two real distinct roots).</p>
                    <p className="font-bold text-emerald-700">⟹ x = (7 ± 5) / 4 ⟹ x = 3 or x = 1/2.</p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 flex items-start gap-2.5 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-amber-900 leading-relaxed text-[11px] sm:text-xs">
                    <strong>Examiner's Marking Tip:</strong> Always state the formula explicitly and show intermediate substitution before writing final roots to ensure full step-marks.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 mt-8 pt-3 flex items-center justify-between text-[10px] sm:text-[11px] text-[#667085]">
            <span>© {new Date().getFullYear()} KITSS Academic Editorial Board • DRM Protected</span>
            <span className="font-mono font-bold text-[#0A1D3F]">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Pagination Bar */}
      <footer className="no-print-reader shrink-0 h-14 bg-white border-t border-[#E6E8EC] px-3 sm:px-6 flex items-center justify-between gap-2 z-20 shadow-xs">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A1D3F] text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex flex-col items-center min-w-0 max-w-[200px] w-full px-2">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0A1D3F]">
            <span>Page {currentPage}</span>
            <span className="text-slate-400">/</span>
            <span className="text-[#667085]">{totalPages}</span>
            <span className="text-[10px] font-sans text-[#FF8A00] font-bold ml-1">
              ({progressPct}%)
            </span>
          </div>

          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#FF8A00] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-2xs"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* 4. Table of Contents Drawer Modal */}
      {showToc && (
        <div className="no-print-reader fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setShowToc(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-[#FF8A00]" />
                <h3 className="text-sm font-bold text-[#0A1D3F]">
                  Table of Contents
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowToc(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto divide-y divide-slate-100">
              {chapters.map((chap, idx) => {
                const isActive = chapterIndex === idx;
                const chapterStartPage = Math.max(1, Math.floor((idx / chapters.length) * totalPages) + 1);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleJumpToChapter(idx)}
                    className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-left transition cursor-pointer ${
                      isActive
                        ? "bg-[#0A1D3F] text-white font-bold shadow-2xs"
                        : "hover:bg-slate-50 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-[11px] flex items-center justify-center shrink-0 font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-[#0A1D3F]"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs truncate">{chap}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={`text-[10px] font-mono ${
                          isActive ? "text-white/80" : "text-slate-400"
                        }`}
                      >
                        P. {chapterStartPage}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#FF8A00]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Screenshot Blocked Modal */}
      {showScreenshotModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#0A1D3F] border border-[#FF8A00]/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-4">
            <div className="w-18 h-18 rounded-2xl bg-[#FF8A00]/20 border border-[#FF8A00]/40 mx-auto flex items-center justify-center text-[#FF8A00] shadow-lg">
              <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30">
                <Lock className="w-3 h-3" /> Digital Rights Protection Active
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Screenshot Attempt Blocked
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-sm mx-auto">
                Screen capture, recording, or saving offline copies is strictly prohibited on KITSS Education digital textbooks.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-white/70 text-left space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-white/10 text-white font-semibold">
                <span>Security Audit Log</span>
                <span className="text-emerald-400 font-mono text-[11px]">Protected Session</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">Licensed Student:</span>
                <span className="font-bold text-white">{student.name}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">Student Roll ID:</span>
                <span className="font-mono font-bold text-[#FF8A00]">{student.id}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowScreenshotModal(false)}
              className="w-full py-3 px-5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>I Acknowledge & Return to Book</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
