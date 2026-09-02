import React, { createContext, useContext, useState } from "react";
import { mockBooks } from "../data/mockBooks";
import { mockCourses } from "../data/mockCourses";

const LibraryContext = createContext(null);

export const LibraryProvider = ({ children }) => {
  const [purchasedBookIds, setPurchasedBookIds] = useState(
    mockBooks.filter((b) => b.isPurchased || b.isFree).map((b) => b.id)
  );

  const [subscribedCourseIds, setSubscribedCourseIds] = useState(
    mockCourses.filter((c) => c.isSubscribed).map((c) => c.id)
  );

  const [completedLectureIds, setCompletedLectureIds] = useState([
    "lec-101",
    "lec-102",
    "lec-103"
  ]);

  const [wishlistBookIds, setWishlistBookIds] = useState(["book-106", "book-107"]);

  const isBookOwned = (bookId) => purchasedBookIds.includes(bookId);
  const isCourseEnrolled = (courseId) => subscribedCourseIds.includes(courseId);

  const markBookPurchased = (bookId) => {
    if (!purchasedBookIds.includes(bookId)) {
      setPurchasedBookIds((prev) => [...prev, bookId]);
    }
  };

  const markCourseSubscribed = (courseId) => {
    if (!subscribedCourseIds.includes(courseId)) {
      setSubscribedCourseIds((prev) => [...prev, courseId]);
    }
  };

  const toggleWishlist = (bookId) => {
    setWishlistBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const isWishlisted = (bookId) => wishlistBookIds.includes(bookId);

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
        isBookOwned,
        isCourseEnrolled,
        markBookPurchased,
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
