import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { bookService } from "../../services/bookService";
import { SearchBar } from "../../components/common/SearchBar";
import { HierarchyDropdowns } from "../../components/books/BoardSelector";
import { BookCard } from "../../components/books/BookCard";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";
import { X, RotateCcw } from "lucide-react";

export const BooksHomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedBoard, setSelectedBoard] = useState(searchParams.get("board") || "All");
  const [selectedClass, setSelectedClass] = useState(searchParams.get("class") || "All");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subject") || "All");
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get("lang") || "All");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMinPrice, setSelectedMinPrice] = useState("");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState("");

  const [books, setBooks] = useState([]);
  const [boards, setBoards] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load static board list once
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const bData = await bookService.getBoards();
        setBoards(bData);
      } catch (err) {
        console.error("Error loading boards:", err);
      }
    };
    loadBoards();
  }, []);

  // Compute dynamic dependent classes when selectedBoard changes
  useEffect(() => {
    let isCurrent = true;
    const updateClasses = async () => {
      try {
        const clsList = await bookService.getAvailableClasses(selectedBoard);
        if (!isCurrent) return;
        setAvailableClasses(clsList);

        // Auto-reset class if current selection is invalid under the newly selected board
        if (selectedClass !== "All" && !clsList.includes(String(selectedClass))) {
          setSelectedClass("All");
        }
      } catch (err) {
        console.error("Error updating dependent classes:", err);
      }
    };
    updateClasses();
    return () => {
      isCurrent = false;
    };
  }, [selectedBoard]);

  // Compute dynamic dependent subjects when selectedBoard or selectedClass changes
  useEffect(() => {
    let isCurrent = true;
    const updateSubjects = async () => {
      try {
        const subList = await bookService.getAvailableSubjects(selectedBoard, selectedClass);
        if (!isCurrent) return;
        setAvailableSubjects(subList);

        // Auto-reset subject if current selection is invalid under board + class
        if (
          selectedSubject !== "All" &&
          !subList.some(
            (s) =>
              s.id.toLowerCase() === selectedSubject.toLowerCase() ||
              s.name.toLowerCase() === selectedSubject.toLowerCase()
          )
        ) {
          setSelectedSubject("All");
        }
      } catch (err) {
        console.error("Error updating dependent subjects:", err);
      }
    };
    updateSubjects();
    return () => {
      isCurrent = false;
    };
  }, [selectedBoard, selectedClass]);

  // Fetch filtered books whenever any filter, search, or sort changes
  useEffect(() => {
    let isCurrent = true;
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await bookService.getBooks({
          board: selectedBoard,
          className: selectedClass,
          subject: selectedSubject,
          query,
          sort: selectedSort,
          type: selectedType,
          language: selectedLanguage,
          minPrice: selectedMinPrice,
          maxPrice: selectedMaxPrice
        });
        if (!isCurrent) return;
        setBooks(data);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    fetchBooks();
    return () => {
      isCurrent = false;
    };
  }, [
    selectedBoard,
    selectedClass,
    selectedSubject,
    query,
    selectedSort,
    selectedType,
    selectedLanguage,
    selectedMinPrice,
    selectedMaxPrice
  ]);

  // Handlers for Board, Class, Subject, and Language dropdowns
  const handleBoardClick = (boardId) => {
    setSelectedBoard(boardId);
  };

  const handleClassClick = (cls) => {
    setSelectedClass(cls);
  };

  const handleSubjectClick = (subjectId) => {
    setSelectedSubject(subjectId);
  };

  const handleLanguageClick = (lang) => {
    setSelectedLanguage(lang);
  };

  const handleResetFilters = () => {
    setSelectedBoard("All");
    setSelectedClass("All");
    setSelectedSubject("All");
    setSelectedLanguage("All");
    setSelectedSort("featured");
    setSelectedType("all");
    setSelectedMinPrice("");
    setSelectedMaxPrice("");
    setQuery("");
  };

  // Determine dynamic hierarchy heading
  const headingContext = useMemo(() => {
    const parts = [];
    if (selectedBoard !== "All") parts.push(selectedBoard);
    if (selectedClass !== "All") parts.push(`Class ${selectedClass}`);
    if (selectedSubject !== "All") parts.push(selectedSubject);
    if (selectedLanguage !== "All") parts.push(selectedLanguage === "Hindi" ? "Hindi Medium" : "English Medium");

    if (parts.length === 0) return "All Educational Books";
    return parts.join(" • ");
  }, [selectedBoard, selectedClass, selectedSubject, selectedLanguage]);

  const hasActiveFilters =
    selectedBoard !== "All" ||
    selectedClass !== "All" ||
    selectedSubject !== "All" ||
    selectedLanguage !== "All" ||
    selectedType !== "all" ||
    selectedMinPrice !== "" ||
    selectedMaxPrice !== "" ||
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
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:text-[#E67A00] px-2.5 py-1.5 rounded-lg bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20 transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* Clean Search Bar without separate filter button */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search books, chapters, topics, authors..."
      />

      {/* 4 Dropdown Filters (Board -> Class -> Subject -> Language) */}
      <HierarchyDropdowns
        boards={boards}
        classes={availableClasses}
        subjects={availableSubjects}
        selectedBoard={selectedBoard}
        selectedClass={selectedClass}
        selectedSubject={selectedSubject}
        selectedLanguage={selectedLanguage}
        onSelectBoard={handleBoardClick}
        onSelectClass={handleClassClick}
        onSelectSubject={handleSubjectClick}
        onSelectLanguage={handleLanguageClick}
      />

      {/* Active Filter Chips */}
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
          {selectedLanguage !== "All" && (
            <button
              onClick={() => setSelectedLanguage("All")}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-semibold shrink-0 cursor-pointer hover:bg-rose-200"
            >
              <span>{selectedLanguage === "Hindi" ? "Hindi Medium" : "English Medium"}</span>
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

      {/* Dynamic Hierarchy Heading & Book Count */}
      <div className="space-y-2 pt-1 min-w-0">
        <div className="flex items-center justify-between pb-1 border-b border-[#E6E8EC]/80">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F] tracking-tight truncate">
              {headingContext}
            </h2>
            <p className="text-[11px] text-[#667085]">
              Showing {books.length} book{books.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="text-[11px] text-[#667085] shrink-0 font-medium">
            {selectedSort === "rating"
              ? "Top Rated"
              : selectedSort === "price-low"
              ? "Price: Low to High"
              : selectedSort === "price-high"
              ? "Price: High to Low"
              : "Curated Selection"}
          </div>
        </div>

        {/* Book Grid */}
        {loading ? (
          <SkeletonLoader type="book" count={6} />
        ) : books.length === 0 ? (
          <EmptyState
            title="No Matching Books Found"
            description={
              selectedBoard !== "All" || selectedClass !== "All" || selectedSubject !== "All" || selectedLanguage !== "All"
                ? `No books found for ${headingContext}. Try clearing a filter or selecting another option.`
                : "No books match your current search and filter criteria."
            }
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
    </div>
  );
};
