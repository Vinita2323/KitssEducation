import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { bookService } from "../../services/bookService";
import { SearchBar } from "../../components/common/SearchBar";
import { SectionHeader } from "../../components/common/SectionHeader";
import { BoardSelector, ClassSelector, SubjectCard } from "../../components/books/BoardSelector";
import { BookCard } from "../../components/books/BookCard";
import { BookFilterModal } from "../../components/books/BookFilterModal";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

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

  // Load initial options
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
    setSelectedClass(cls);
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

  return (
    <div className="space-y-5">
      {/* Header & Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Digital Books
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Access board-wise, class-wise, and subject-wise curriculum books
        </p>
      </div>

      {/* Search & Filter Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        onFilterClick={() => setShowFilterModal(true)}
        placeholder="Search books by title, chapter or author..."
      />

      {/* Board Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
            Select Board
          </h3>
          {selectedBoard !== "All" && (
            <button
              onClick={() => setSelectedBoard("All")}
              className="text-xs font-semibold text-[#FF8A00]"
            >
              Clear
            </button>
          )}
        </div>
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          onSelect={handleBoardClick}
        />
      </div>

      {/* Class Selector Pills */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
          Select Class
        </h3>
        <ClassSelector
          classes={classes}
          selectedClass={selectedClass}
          onSelect={handleClassClick}
        />
      </div>

      {/* Subjects Category Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
          Subjects
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {subjects.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              onClick={() => handleSubjectClick(sub.id)}
            />
          ))}
        </div>
      </div>

      {/* Books Listing Grid */}
      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between">
          <SectionHeader
            title={
              selectedSubject !== "All"
                ? `${selectedSubject} Books`
                : selectedBoard !== "All"
                ? `${selectedBoard} Books`
                : "All Books"
            }
            subtitle={`Showing ${books.length} accessible book${books.length === 1 ? "" : "s"}`}
          />

          {(selectedBoard !== "All" || selectedClass !== "All" || selectedSubject !== "All" || query) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-[#FF8A00] hover:underline"
            >
              Reset All
            </button>
          )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
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
