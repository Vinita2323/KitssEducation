import { RESULT_TYPES, MOCK_BOARDS } from "../data/mockBoards";
import { mockResults, mockMyResultsHistory } from "../data/mockResults";

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export class ResultNotFoundError extends Error {
  constructor(message = "We couldn't find a result matching the information provided. Please check your details and try again.") {
    super(message);
    this.name = "ResultNotFoundError";
  }
}

export class ResultValidationError extends Error {
  constructor(message = "Please check your details and fill all required fields.") {
    super(message);
    this.name = "ResultValidationError";
  }
}

/**
 * Result Service Layer
 * Abstracted API boundary designed for future backend/API endpoints.
 * Currently backed by realistic mock data and asynchronous latency simulation.
 */
export const resultService = {
  /**
   * Get available Result Types (School / University)
   */
  async getResultTypes() {
    await delay(100);
    return RESULT_TYPES;
  },

  /**
   * Get boards by result type ('school' | 'university')
   */
  async getBoards(type = "school") {
    await delay(150);
    const boards = MOCK_BOARDS[type] || [];
    return boards;
  },

  /**
   * Get configuration & fields for a specific board
   */
  async getBoardConfig(boardId, type = "school") {
    await delay(100);
    const boards = MOCK_BOARDS[type] || [];
    const board = boards.find((b) => b.id === boardId || b.code === boardId);
    return board || null;
  },

  /**
   * Search student examination marksheet
   * @param {Object} searchParams { type, boardId, rollNumber, dob, ... }
   */
  async searchResult(searchParams = {}) {
    await delay(650); // Simulate network query latency

    const { boardId, rollNumber, dob, stateName, course, motherName } = searchParams;

    if (!rollNumber || !rollNumber.trim()) {
      throw new ResultValidationError("Examination Roll Number is required.");
    }

    const cleanRoll = rollNumber.trim().toUpperCase();

    // Explicit test for 'Not Found' simulation
    if (cleanRoll === "999999" || cleanRoll.includes("NOTFOUND")) {
      throw new ResultNotFoundError();
    }

    // Lookup in mock results by exact match or suffix or normalized roll
    const matched = mockResults.find((r) => {
      const rRoll = (r.rollNumber || "").toUpperCase();
      const rAdmit = (r.admitCardId || "").toUpperCase();
      const rEnroll = (r.enrollmentNumber || "").toUpperCase();

      const rollMatches =
        rRoll === cleanRoll ||
        rAdmit.includes(cleanRoll) ||
        rEnroll.includes(cleanRoll) ||
        rRoll.endsWith(cleanRoll.slice(-4));

      // Optional board filter if specified
      if (boardId && r.board && r.board !== boardId && !cleanRoll.includes(r.board)) {
        // Still allow if exact roll matched to facilitate quick testing
        if (rRoll === cleanRoll) return true;
        return false;
      }

      return rollMatches;
    });

    if (!matched) {
      throw new ResultNotFoundError();
    }

    return matched;
  },

  /**
   * Fetch previously checked / published results for current student
   */
  async getMyResults() {
    await delay(250);
    return mockMyResultsHistory;
  }
};
