import { mockBooks, mockBoards, mockClasses, mockSubjects } from "../data/mockBooks";

const STORAGE_KEY = "kitss_books_store";

// Helper to initialize or retrieve books from localStorage
const getStoredBooks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockBooks));
      return [...mockBooks];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockBooks));
      return [...mockBooks];
    }
    // Auto-merge any new mock books by ID into existing storage
    const existingIds = new Set(parsed.map((b) => b.id));
    let hasNew = false;
    for (const b of mockBooks) {
      if (!existingIds.has(b.id)) {
        parsed.push(b);
        hasNew = true;
      }
    }
    if (hasNew) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error("Error reading kitss_books_store from localStorage:", e);
    return [...mockBooks];
  }
};

const saveStoredBooks = (books) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.error("Error saving kitss_books_store to localStorage:", e);
  }
};

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export const bookService = {
  // Query books for public listing
  async getBooks({ board, className, subject, query, type, language, minPrice, maxPrice, sort } = {}) {
    await delay(120);
    const books = getStoredBooks();
    let results = books.filter((b) => b.status === undefined || b.status === "published");

    // Board filter
    if (board && board !== "All") {
      const bNorm = board.toLowerCase();
      results = results.filter(
        (b) => (b.boardId && b.boardId.toLowerCase() === bNorm) || (b.board && b.board.toLowerCase() === bNorm)
      );
    }

    // Class filter
    if (className && className !== "All") {
      results = results.filter(
        (b) => (b.classId && String(b.classId) === String(className)) || (b.class && String(b.class) === String(className))
      );
    }

    // Subject filter
    if (subject && subject !== "All") {
      const sNorm = subject.toLowerCase();
      results = results.filter(
        (b) => (b.subjectId && b.subjectId.toLowerCase() === sNorm) || (b.subject && b.subject.toLowerCase() === sNorm)
      );
    }

    // Free vs Paid filter
    if (type && type !== "all") {
      if (type === "free") {
        results = results.filter((b) => b.isFree === true || b.price === 0);
      } else if (type === "paid") {
        results = results.filter((b) => !b.isFree && b.price > 0);
      }
    }

    // Language filter
    if (language && language !== "All") {
      results = results.filter(
        (b) => b.language && b.language.toLowerCase() === language.toLowerCase()
      );
    }

    // Price range
    if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
      results = results.filter((b) => (b.price || 0) >= Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      results = results.filter((b) => (b.price || 0) <= Number(maxPrice));
    }

    // Comprehensive query search across title, subtitle, author, board, class, subject, chapters, keywords
    if (query && query.trim() !== "") {
      const q = query.toLowerCase().trim();
      results = results.filter((b) => {
        const titleMatch = b.title && b.title.toLowerCase().includes(q);
        const subtitleMatch = b.subtitle && b.subtitle.toLowerCase().includes(q);
        const authorMatch = b.author && b.author.toLowerCase().includes(q);
        const boardMatch = b.board && b.board.toLowerCase().includes(q);
        const classMatch = b.class && String(b.class).toLowerCase().includes(q);
        const subjectMatch = b.subject && b.subject.toLowerCase().includes(q);
        const chapterMatch = Array.isArray(b.chapters) && b.chapters.some((ch) => ch.toLowerCase().includes(q));
        const keywordMatch = Array.isArray(b.keywords) && b.keywords.some((kw) => kw.toLowerCase().includes(q));

        return (
          titleMatch ||
          subtitleMatch ||
          authorMatch ||
          boardMatch ||
          classMatch ||
          subjectMatch ||
          chapterMatch ||
          keywordMatch
        );
      });
    }

    // Sorting
    if (sort) {
      if (sort === "price-low") {
        results.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === "price-high") {
        results.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === "rating") {
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === "newest") {
        results.sort((a, b) => (b.id > a.id ? 1 : -1));
      }
    }

    return results;
  },

  // Dynamic helper: get classes that have published books for the selected board
  async getAvailableClasses(board) {
    const books = getStoredBooks().filter((b) => b.status === undefined || b.status === "published");
    let filtered = books;
    if (board && board !== "All") {
      const bNorm = board.toLowerCase();
      filtered = books.filter(
        (b) => (b.boardId && b.boardId.toLowerCase() === bNorm) || (b.board && b.board.toLowerCase() === bNorm)
      );
    }
    const classSet = new Set(filtered.map((b) => String(b.classId || b.class)).filter(Boolean));

    // Guarantee standard classes (Class 8, 9, 10, 11, 12) are always available
    ["8", "9", "10", "11", "12"].forEach((cls) => classSet.add(cls));

    // Sort numerically if possible
    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  },

  // Dynamic helper: get subjects for the selected board and class
  async getAvailableSubjects(board, className) {
    const books = getStoredBooks().filter((b) => b.status === undefined || b.status === "published");
    let filtered = books;

    if (board && board !== "All") {
      const bNorm = board.toLowerCase();
      filtered = filtered.filter(
        (b) => (b.boardId && b.boardId.toLowerCase() === bNorm) || (b.board && b.board.toLowerCase() === bNorm)
      );
    }

    if (className && className !== "All") {
      filtered = filtered.filter(
        (b) => (b.classId && String(b.classId) === String(className)) || (b.class && String(b.class) === String(className))
      );
    }

    const availableSubjectIds = new Set(
      filtered.map((b) => (b.subjectId || b.subject)).filter(Boolean)
    );

    // Guarantee multiple core subject options for all boards/classes:
    // Senior secondary (11, 12): Mathematics, Physics, Chemistry, Biology, English
    // Secondary & Middle (8, 9, 10): Mathematics, Science, English, Social Science, Hindi
    if (String(className) === "11" || String(className) === "12") {
      ["Mathematics", "Physics", "Chemistry", "Biology", "English"].forEach((s) => availableSubjectIds.add(s));
    } else {
      ["Mathematics", "Science", "English", "Social Science", "Hindi"].forEach((s) => availableSubjectIds.add(s));
    }

    // Return subject objects matching mockSubjects or create placeholder object
    const result = [];
    availableSubjectIds.forEach((subj) => {
      const found = mockSubjects.find(
        (s) => s.id.toLowerCase() === subj.toLowerCase() || s.name.toLowerCase() === subj.toLowerCase()
      );
      if (found) {
        if (!result.some((r) => r.id === found.id)) {
          result.push(found);
        }
      } else {
        result.push({
          id: subj,
          name: subj,
          icon: "BookOpen",
          color: "#133C8B"
        });
      }
    });

    return result;
  },

  async getBookById(id) {
    await delay(100);
    const books = getStoredBooks();
    const book = books.find((b) => String(b.id) === String(id));
    if (!book) throw new Error("Book not found");
    return book;
  },

  async getBoards() {
    return mockBoards;
  },

  async getClasses() {
    return mockClasses;
  },

  async getMyLibraryBooks() {
    await delay(100);
    const books = getStoredBooks();
    return books;
  },

  async purchaseBook(bookId, paymentMethod = "UPI") {
    await delay(300);
    const books = getStoredBooks();
    const book = books.find((b) => String(b.id) === String(bookId));
    if (!book) throw new Error("Book not found");
    return {
      success: true,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      book,
      amount: book.price,
      paymentMethod,
      timestamp: new Date().toISOString()
    };
  },

  // --- Admin API Methods ---
  async getAllBooksForAdmin({ board, className, subject, type, status, query } = {}) {
    await delay(100);
    let results = getStoredBooks();

    if (board && board !== "All") {
      const bNorm = board.toLowerCase();
      results = results.filter(
        (b) => (b.boardId && b.boardId.toLowerCase() === bNorm) || (b.board && b.board.toLowerCase() === bNorm)
      );
    }

    if (className && className !== "All") {
      results = results.filter(
        (b) => (b.classId && String(b.classId) === String(className)) || (b.class && String(b.class) === String(className))
      );
    }

    if (subject && subject !== "All") {
      const sNorm = subject.toLowerCase();
      results = results.filter(
        (b) => (b.subjectId && b.subjectId.toLowerCase() === sNorm) || (b.subject && b.subject.toLowerCase() === sNorm)
      );
    }

    if (type && type !== "all") {
      if (type === "free") {
        results = results.filter((b) => b.isFree === true || b.price === 0);
      } else if (type === "paid") {
        results = results.filter((b) => !b.isFree && b.price > 0);
      }
    }

    if (status && status !== "all") {
      results = results.filter((b) => (b.status || "published") === status);
    }

    if (query && query.trim() !== "") {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.board && b.board.toLowerCase().includes(q)) ||
          (b.subject && b.subject.toLowerCase().includes(q))
      );
    }

    return results;
  },

  async addBook(bookData) {
    await delay(200);
    const books = getStoredBooks();
    const newId = `book-${Date.now()}`;
    const newBook = {
      id: newId,
      title: bookData.title || "Untitled Book",
      subtitle: bookData.subtitle || `Class ${bookData.class || "10"} (${bookData.board || "CBSE"})`,
      boardId: bookData.board || "CBSE",
      board: bookData.board || "CBSE",
      classId: String(bookData.class || "10"),
      class: String(bookData.class || "10"),
      subjectId: bookData.subject || "General",
      subject: bookData.subject || "General",
      price: bookData.isFree ? 0 : Number(bookData.price) || 0,
      originalPrice: bookData.isFree ? 0 : Number(bookData.originalPrice) || Number(bookData.price) || 0,
      discount: bookData.discount || (bookData.isFree ? "" : "30% OFF"),
      isFree: Boolean(bookData.isFree),
      rating: Number(bookData.rating) || 4.5,
      reviewCount: Number(bookData.reviewCount) || 10,
      coverColor: bookData.coverColor || "from-[#0A1D3F] to-[#133C8B]",
      coverIcon: bookData.coverIcon || "BookOpen",
      coverTag: `${bookData.board || "CBSE"} Standard`,
      description: bookData.description || "Comprehensive educational study material and guide.",
      pages: Number(bookData.pages) || 200,
      language: bookData.language || "English",
      format: "PDF",
      fileSize: bookData.fileSize || "10.0 MB",
      publishedDate: bookData.publishedDate || "2026",
      author: bookData.author || "KITSS Academic Team",
      status: bookData.status || "published",
      keywords: Array.isArray(bookData.keywords) ? bookData.keywords : (bookData.keywords || "").split(",").map((k) => k.trim()).filter(Boolean),
      chapters: Array.isArray(bookData.chapters) ? bookData.chapters : (bookData.chapters || "").split("\n").map((c) => c.trim()).filter(Boolean),
      samplePages: [
        { pageNum: 1, title: "Overview & Table of Contents", previewText: "Detailed chapter outline and curriculum standards." },
        { pageNum: 2, title: "Chapter 1 Starter", previewText: "Core formulas, introductory concepts and exam strategies." }
      ]
    };

    books.unshift(newBook);
    saveStoredBooks(books);
    return newBook;
  },

  async updateBook(id, updatedData) {
    await delay(150);
    const books = getStoredBooks();
    const index = books.findIndex((b) => String(b.id) === String(id));
    if (index === -1) throw new Error("Book not found for update");

    const existing = books[index];
    const updated = {
      ...existing,
      ...updatedData,
      id: existing.id, // keep stable
      price: updatedData.isFree ? 0 : (updatedData.price !== undefined ? Number(updatedData.price) : existing.price),
      originalPrice: updatedData.isFree ? 0 : (updatedData.originalPrice !== undefined ? Number(updatedData.originalPrice) : existing.originalPrice),
      boardId: updatedData.board || existing.boardId,
      board: updatedData.board || existing.board,
      classId: updatedData.class ? String(updatedData.class) : existing.classId,
      class: updatedData.class ? String(updatedData.class) : existing.class,
      subjectId: updatedData.subject || existing.subjectId,
      subject: updatedData.subject || existing.subject,
      keywords: Array.isArray(updatedData.keywords)
        ? updatedData.keywords
        : typeof updatedData.keywords === "string"
        ? updatedData.keywords.split(",").map((k) => k.trim()).filter(Boolean)
        : existing.keywords,
      chapters: Array.isArray(updatedData.chapters)
        ? updatedData.chapters
        : typeof updatedData.chapters === "string"
        ? updatedData.chapters.split("\n").map((c) => c.trim()).filter(Boolean)
        : existing.chapters
    };

    books[index] = updated;
    saveStoredBooks(books);
    return updated;
  },

  async deleteBook(id) {
    await delay(150);
    let books = getStoredBooks();
    books = books.filter((b) => String(b.id) !== String(id));
    saveStoredBooks(books);
    return { success: true, id };
  },

  async togglePublishStatus(id) {
    await delay(100);
    const books = getStoredBooks();
    const index = books.findIndex((b) => String(b.id) === String(id));
    if (index === -1) throw new Error("Book not found");
    const current = books[index].status || "published";
    books[index].status = current === "published" ? "draft" : "published";
    saveStoredBooks(books);
    return books[index];
  },

  // Reset to original mock data
  resetToDefaults() {
    saveStoredBooks(mockBooks);
    return mockBooks;
  }
};
