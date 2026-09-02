import { mockResults, mockMyResultsHistory } from "../data/mockResults";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const resultService = {
  async searchResult(board, rollNumber, dob) {
    await delay(500);
    if (!rollNumber) {
      throw new Error("Please enter your Roll Number.");
    }

    const cleanRoll = rollNumber.trim();
    const result = mockResults.find(
      (r) => r.rollNumber === cleanRoll || r.rollNumber.endsWith(cleanRoll.slice(-4))
    );

    if (!result) {
      // Return the primary mock result if exact roll not found so student can preview marksheet
      const fallback = { ...mockResults[0], rollNumber: cleanRoll };
      return fallback;
    }

    return result;
  },

  async getMyResults() {
    await delay(300);
    return mockMyResultsHistory;
  }
};
