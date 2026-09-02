import { mockBooks, mockBoards, mockClasses, mockSubjects } from "../data/mockBooks";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const bookService = {
  async getBooks({ board, className, subject, query, sort } = {}) {
    await delay(350);
    let results = [...mockBooks];

    if (board && board !== "All") {
      results = results.filter((b) => b.board.toLowerCase() === board.toLowerCase());
    }

    if (className && className !== "All") {
      results = results.filter((b) => b.class === className);
    }

    if (subject && subject !== "All") {
      results = results.filter((b) => b.subject.toLowerCase() === subject.toLowerCase());
    }

    if (query && query.trim() !== "") {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.subtitle.toLowerCase().includes(q) ||
          b.subject.toLowerCase().includes(q) ||
          b.board.toLowerCase().includes(q)
      );
    }

    if (sort) {
      if (sort === "price-low") {
        results.sort((a, b) => a.price - b.price);
      } else if (sort === "price-high") {
        results.sort((a, b) => b.price - a.price);
      } else if (sort === "rating") {
        results.sort((a, b) => b.rating - a.rating);
      }
    }

    return results;
  },

  async getBookById(id) {
    await delay(250);
    const book = mockBooks.find((b) => b.id === id);
    if (!book) throw new Error("Book not found");
    return book;
  },

  async getBoards() {
    await delay(100);
    return mockBoards;
  },

  async getClasses() {
    await delay(100);
    return mockClasses;
  },

  async getSubjects() {
    await delay(100);
    return mockSubjects;
  },

  async getMyLibraryBooks() {
    await delay(300);
    // Returns books that are either purchased or free
    return mockBooks.filter((b) => b.isPurchased || b.isFree);
  },

  async purchaseBook(bookId, paymentMethod = "UPI") {
    await delay(600);
    const book = mockBooks.find((b) => b.id === bookId);
    if (!book) throw new Error("Book not found");
    
    // Mark as purchased in memory
    book.isPurchased = true;
    return {
      success: true,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      book,
      amount: book.price,
      paymentMethod,
      timestamp: new Date().toISOString()
    };
  }
};
