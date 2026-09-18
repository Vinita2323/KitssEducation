import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { bookService } from "../../services/bookService";
import { SearchBar } from "../../components/common/SearchBar";
import { BoardSelector, ClassSelector, SubjectSelector } from "../../components/books/BoardSelector";
import { BookCard } from "../../components/books/BookCard";
import { BookFilterModal } from "../../components/books/BookFilterModal";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";
import { X, RotateCcw } from "lucide-react";

export const BooksHomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedBoard, setSelectedBoard] = useState(searchParams.get("board") || "All");
  const [selectedClass, setSelectedClass] = useState(searchParams.get("class") || "All");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") || "All");
  const [selectedSort, setSelectedSort] = useState("featured");

  const [books, setBooks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Load initial metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [bData, cData, sData] = await Promise.all([
          bookService.getBoards(),
          bookService.getClasses(),
          bookService.getSubjects()
        ]);
        setBoards(bData);
        setClasses(cData);
        setSubjects(sData);
      } catch (err) {
        console.error("Metadata load error:", err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch filtered books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await bookService.getBooks({
          board: selectedBoard,
          className: selectedClass,
          subject: selectedSubject,
          query,
          sort: selectedSort
        });
        setBooks(data);
      } catch (err) {
        console.error("Books fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [selectedBoard, selectedClass, selectedSubject, query, selectedSort]);

  const handleBoardClick = (boardId) => {
    setSelectedBoard((prev) => (prev === boardId ? "All" : boardId));
  };

  const handleClassClick = (cls) => {
    setSelectedClass((prev) => (prev === cls ? "All" : cls));
  };

  const handleSubjectClick = (subjectId) => {
    setSelectedSubject((prev) => (prev === subjectId ? "All" : subjectId));
  };

  const handleFilterApply = ({ board, className, subject, sort }) => {
    setSelectedBoard(board);
    setSelectedClass(className);
    setSelectedSubject(subject);
    setSelectedSort(sort);
  };

  const handleResetFilters = () => {
    setSelectedBoard("All");
    setSelectedClass("All");
    setSelectedSubject("All");
    setSelectedSort("featured");
    setQuery("");
  };

  const hasActiveFilters =
    selectedBoard !== "All" ||
    selectedClass !== "All" ||
    selectedSubject !== "All" ||
    Boolean(query);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-3 sm:space-y-4">
      {/* Compact Page Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#0A1D3F] tracking-tight">
            Digital Books
          </h1>
          <p className="text-xs text-[#667085] truncate">
            Board-wise, class-wise, & subject curriculum books
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:text-[#E67A00] px-2.5 py-1 rounded-lg bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20 transition shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Compact Search & Filter Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        onFilterClick={() => setShowFilterModal(true)}
        placeholder="Search books, chapters, authors..."
      />

      {/* Board Selector Strip */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider">
            Select Board
          </span>
          {selectedBoard !== "All" && (
            <span className="text-[10px] font-semibold text-[#FF8A00]">
              Active: {selectedBoard}
            </span>
          )}
        </div>
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          onSelect={handleBoardClick}
        />
      </div>

      {/* Class Selector Strip */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider">
            Select Class
          </span>
          {selectedClass !== "All" && (
            <span className="text-[10px] font-semibold text-[#FF8A00]">
              Class {selectedClass}
            </span>
          )}
        </div>
        <ClassSelector
          classes={classes}
          selectedClass={selectedClass}
          onSelect={handleClassClick}
        />
      </div>

      {/* Subject Filter Pills (Compact horizontal scroll) */}
      <div className="space-y-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider">
            Select Subject
          </span>
          {selectedSubject !== "All" && (
            <span className="text-[10px] font-semibold text-[#FF8A00]">
              {selectedSubject}
            </span>
          )}
        </div>
        <SubjectSelector
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelect={handleSubjectClick}
        />
      </div>

      {/* Active Filter Chips (if any filter is applied) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
          <span className="text-[11px] font-medium text-[#667085] shrink-0">Filters:</span>
          {selectedBoard !== "All" && (
            <button
              onClick={() => setSelectedBoard("All")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0A1D3F]/10 text-[#0A1D3F] text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-[#0A1D3F]/15"
            >
              <span>{selectedBoard}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedClass !== "All" && (
            <button
              onClick={() => setSelectedClass("All")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FF8A00]/15 text-[#FF8A00] text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-[#FF8A00]/20"
            >
              <span>Class {selectedClass}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedSubject !== "All" && (
            <button
              onClick={() => setSelectedSubject("All")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0D9488]/15 text-[#0D9488] text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-[#0D9488]/20"
            >
              <span>{selectedSubject}</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-gray-300"
            >
              <span>"{query}"</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Books Listing Grid Section */}
      <div className="space-y-2 pt-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F] tracking-tight">
              {selectedSubject !== "All"
                ? `${selectedSubject} Books`
                : selectedBoard !== "All"
                ? `${selectedBoard} Books`
                : "All Curriculum Books"}
            </h2>
            <p className="text-[11px] text-[#667085]">
              Showing {books.length} accessible book{books.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="book" count={6} />
        ) : books.length === 0 ? (
          <EmptyState
            title="No Books Found"
            description="We could not find any books matching your selected filters or search query."
            actionText="Reset Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 w-full min-w-0">
            {books.map((book) => (
              <BookCard key={book.id} book={book} layout="grid" />
            ))}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet Modal */}
      <BookFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        boards={boards}
        classes={classes}
        subjects={subjects}
        selectedBoard={selectedBoard}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        selectedSort={selectedSort}
        onApply={handleFilterApply}
        onReset={handleResetFilters}
      />
    </div>
  );
};
