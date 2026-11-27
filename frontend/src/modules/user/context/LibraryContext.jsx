import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { authenticatedWrite } from '../services/authService';
import { httpClient } from '../../../shared/api/httpClient';
import { readOptions } from '../services/collegeService';
const LibraryContext = createContext(null);
export function LibraryProvider({
  children
}) {
  const {
      user
    } = useAuth(),
    {
      showError
    } = useToast(),
    identity = useRef(user?.id);
  identity.current = user?.id;
  const wishlistVersion = useRef(0),
    pending = useRef(new Set());
  const [dataOwner, setDataOwner] = useState(user?.id),
    [pendingVersion, setPendingVersion] = useState(0);
  const [purchasedBookIds, setBooks] = useState([]),
    [wishlistBookIds, setWishlist] = useState([]),
    [subscribedCourseIds, setCourses] = useState([]);
  const loadLibrary = async (signal) => {
    if (!user) return;
    const owner = user.id;
    const issued = wishlistVersion.current;
    const options = signal ? { signal } : {};
    const [books, wishlist, courses] = await Promise.all([
      httpClient.request('/me/books', options),
      httpClient.request('/me/wishlist', options),
      readOptions('/me/enrollments', { state: 'active' }, signal),
    ]);
    if (identity.current === owner) {
      setBooks(books.data.filter(b => b.canReadFull).map(b => b.id));
      if (issued === wishlistVersion.current) setWishlist(wishlist.data);
      setCourses(courses.map(c => String(c.courseId)));
    }
  };
  useEffect(() => {
    setDataOwner(user?.id);
    setBooks([]);
    setWishlist([]);
    setCourses([]);
    if (!user) return;
    const controller = new AbortController();
    loadLibrary(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [user?.id]);
  const refreshLibrary = () => loadLibrary().catch(() => {});
  const toggleWishlist = async bookId => {
    if (!user) {
      showError('Sign in to save your wishlist.');
      return;
    }
    const owner = user.id,
      pendingKey = owner + ':' + bookId;
    if (pending.current.has(pendingKey)) return;
    pending.current.add(pendingKey);
    wishlistVersion.current++;
    setPendingVersion(v => v + 1);
    try {
      const result = await authenticatedWrite('/me/books/' + bookId + '/wishlist', {}, wishlistBookIds.includes(String(bookId)) ? 'DELETE' : 'PUT');
      if (identity.current === owner) setWishlist(previous => result.wishlisted ? [...new Set([...previous, String(bookId)])] : previous.filter(i => i !== String(bookId)));
    } catch (e) {
      if (identity.current === owner) showError(e.message);
    } finally {
      pending.current.delete(pendingKey);
      if (identity.current === owner) setPendingVersion(v => v + 1);
    }
  };
  const blocked = () => {
    throw new Error('Your access must be confirmed before this action is available.');
  };
  return <LibraryContext.Provider value={{
    purchasedBookIds: dataOwner === user?.id ? purchasedBookIds : [],
    wishlistBookIds: dataOwner === user?.id ? wishlistBookIds : [],
    subscribedCourseIds: dataOwner === user?.id ? subscribedCourseIds : [],
    completedLectureIds: [],
    readingProgress: {},
    bookmarks: {},
    isWishlistPending: id => pending.current.has(user?.id + ':' + id),
    isBookOwned: id => dataOwner === user?.id && purchasedBookIds.includes(String(id)),
    canAccessBook: book => book?.canReadFull === true,
    isWishlisted: id => dataOwner === user?.id && wishlistBookIds.includes(String(id)),
    refreshLibrary,
    toggleWishlist,
    markBookPurchased: blocked,
    markCourseSubscribed: blocked,
    getBookProgress: () => ({
      currentPage: null,
      totalPages: null,
      percentage: 0
    }),
    updateReadingProgress: blocked,
    toggleBookmark: blocked,
    isPageBookmarked: () => false,
    toggleLectureCompletion: blocked
  }}>{children}</LibraryContext.Provider>;
}
export const useLibrary = () => useContext(LibraryContext);
