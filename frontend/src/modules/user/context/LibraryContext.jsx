import React, { createContext, useContext, useState, useEffect } from "react";
import { mockBooks } from "../data/mockBooks";
import { mockCourses } from "../data/mockCourses";

const LibraryContext = createContext(null);

const PURCHASES_KEY = "kitss_purchased_books";
const PROGRESS_KEY = "kitss_reading_progress";
const BOOKMARKS_KEY = "kitss_book_bookmarks";

export const LibraryProvider = ({ children }) => {
  // Initialize purchased books from localStorage, fallback to pre-seeded purchased mock books
  const [purchasedBookIds, setPurchasedBookIds] = useState(() => {
    try {
      const stored = localStorage.getItem(PURCHASES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading kitss_purchased_books:", e);
    }
    // Default seed: book-102 is purchased
    return mockBooks.filter((b) => b.isPurchased).map((b) => b.id);
  });

  // Reading progress: { [bookId]: { currentPage: number, totalPages: number, percentage: number, lastRead: string } }
  const [readingProgress, setReadingProgress] = useState(() => {
    try {
      const stored = localStorage.getItem(PROGRESS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading kitss_reading_progress:", e);
    }
    return {
      "book-102": { currentPage: 48, totalPages: 290, percentage: 16, lastRead: new Date().toISOString() },
      "book-104": { currentPage: 12, totalPages: 180, percentage: 7, lastRead: new Date().toISOString() }
    };
  });

  // Bookmarks: { [bookId]: number[] }
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error reading kitss_book_bookmarks:", e);
    }
    return {
      "book-102": [1, 15, 48]
    };
  });

  const [subscribedCourseIds, setSubscribedCourseIds] = useState(
    mockCourses.filter((c) => c.isSubscribed).map((c) => c.id)
  );

  const [completedLectureIds, setCompletedLectureIds] = useState([
    "lec-101",
    "lec-102",
    "lec-103"
  ]);

  const [wishlistBookIds, setWishlistBookIds] = useState(["book-101", "book-106"]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchasedBookIds));
    } catch (e) {
      console.error("Error saving kitss_purchased_books:", e);
    }
  }, [purchasedBookIds]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(readingProgress));
    } catch (e) {
      console.error("Error saving kitss_reading_progress:", e);
    }
  }, [readingProgress]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error("Error saving kitss_book_bookmarks:", e);
    }
  }, [bookmarks]);

  // Check if a paid book has been bought
  const isBookOwned = (bookId) => purchasedBookIds.includes(String(bookId));

  // Check if user has reading rights (Free book OR Purchased paid book)
  const canAccessBook = (book) => {
    if (!book) return false;
    if (book.isFree || Number(book.price) === 0) return true;
    return isBookOwned(book.id);
  };

  const markBookPurchased = (bookId) => {
    const sId = String(bookId);
    if (!purchasedBookIds.includes(sId)) {
      setPurchasedBookIds((prev) => [...prev, sId]);
    }
  };

  const updateReadingProgress = (bookId, currentPage, totalPages) => {
    const sId = String(bookId);
    const pages = Math.max(1, totalPages || 100);
    const current = Math.min(Math.max(1, currentPage || 1), pages);
    const percentage = Math.round((current / pages) * 100);

    setReadingProgress((prev) => ({
      ...prev,
      [sId]: {
        currentPage: current,
        totalPages: pages,
        percentage,
        lastRead: new Date().toISOString()
      }
    }));
  };

  const getBookProgress = (bookId) => {
    return readingProgress[String(bookId)] || { currentPage: 1, totalPages: 100, percentage: 0 };
  };

  const toggleBookmark = (bookId, pageNumber) => {
    const sId = String(bookId);
    setBookmarks((prev) => {
      const currentList = prev[sId] || [];
      const updated = currentList.includes(pageNumber)
        ? currentList.filter((p) => p !== pageNumber)
        : [...currentList, pageNumber].sort((a, b) => a - b);
      return { ...prev, [sId]: updated };
    });
  };

  const isPageBookmarked = (bookId, pageNumber) => {
    const sId = String(bookId);
    return (bookmarks[sId] || []).includes(pageNumber);
  };

  const markCourseSubscribed = (courseId) => {
    if (!subscribedCourseIds.includes(courseId)) {
      setSubscribedCourseIds((prev) => [...prev, courseId]);
    }
  };

  const toggleWishlist = (bookId) => {
    const sId = String(bookId);
    setWishlistBookIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    );
  };

  const isWishlisted = (bookId) => wishlistBookIds.includes(String(bookId));

  const toggleLectureCompletion = (lectureId) => {
    setCompletedLectureIds((prev) =>
      prev.includes(lectureId) ? prev.filter((id) => id !== lectureId) : [...prev, lectureId]
    );
  };

  return (
    <LibraryContext.Provider
      value={{
        purchasedBookIds,
        subscribedCourseIds,
        completedLectureIds,
        wishlistBookIds,
        readingProgress,
        bookmarks,
        isBookOwned,
        canAccessBook,
        markBookPurchased,
        updateReadingProgress,
        getBookProgress,
        toggleBookmark,
        isPageBookmarked,
        markCourseSubscribed,
        toggleWishlist,
        isWishlisted,
        toggleLectureCompletion
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
};
