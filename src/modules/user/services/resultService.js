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

const INDIAN_STUDENT_NAMES = [
  "AARAV SHARMA",
  "PRIYA VERMA",
  "ADITYA SINGH",
  "ANANYA IYER",
  "ROHAN GUPTA",
  "SNEHA PATEL",
  "VIKRAMADITYA RAO",
  "ISHA CHATTERJEE",
  "HARSH VARDHAN",
  "POOJA NAIR",
  "ARJUN MEHTA",
  "RHEA SEN",
  "KARAN DESHMUKH",
  "DIVYA JOSHI"
];

const MOTHER_NAMES = [
  "SUNITA SHARMA",
  "ANITA VERMA",
  "MEENA GUPTA",
  "LAKSHMI RAO",
  "KAVITA SINGH",
  "SAROJ PATEL",
  "REKHA DEVI",
  "SHASHI MEHTA"
];

const FATHER_NAMES = [
  "RAJESH SHARMA",
  "SUNIL VERMA",
  "VIJAY GUPTA",
  "RAMESH PATEL",
  "SURESH SINGH",
  "ANIL MEHTA",
  "DATTATRAYA DESHMUKH",
  "MAHESH RAO"
];

function getDeterministicItem(list, seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return list[Math.abs(hash) % list.length];
}

function getRealisticAdmitCardId(boardId, cleanRoll) {
  const lastDigits = cleanRoll.replace(/\D/g, "").slice(-6) || cleanRoll.slice(-6);
  if (boardId === "STATE_BOARD") {
    return `MSB-HSC-2026-${lastDigits}`;
  }
  if (boardId === "CBSE") {
    return `CBSE2026-XII-${lastDigits}`;
  }
  if (boardId === "ICSE") {
    return `CISCE-2026-X-${lastDigits}`;
  }
  if (boardId === "STATE_TECH_UNIV") {
    return `STU-EXAM-2026-${lastDigits}`;
  }
  if (boardId === "CENTRAL_UNIV") {
    return `CU-2026-SEM4-${lastDigits}`;
  }
  return `REG-2026-${lastDigits}`;
}

/**
 * Generates a realistic, verified marksheet dynamically
 * for any student roll number entered by the user.
 */
function generateDynamicResult(searchParams, cleanRoll) {
  const isUniversity = searchParams.type === "university";
  const boardId = searchParams.boardId || (isUniversity ? "STATE_TECH_UNIV" : "CBSE");
  const boardName = searchParams.boardName || (isUniversity ? "State Technological University" : "Central Board of Secondary Education");

  const studentName = searchParams.studentName || getDeterministicItem(INDIAN_STUDENT_NAMES, cleanRoll);
  const motherName = searchParams.motherName || getDeterministicItem(MOTHER_NAMES, cleanRoll);
  const fatherName = searchParams.fatherName || getDeterministicItem(FATHER_NAMES, cleanRoll);
  const admitCardId = getRealisticAdmitCardId(boardId, cleanRoll);

  if (isUniversity) {
    const univName = searchParams.boardName || "State Technological University";
    const instName = "Faculty of Engineering & Technology";
    return {
      id: `res-gen-${cleanRoll}`,
      type: "university",
      board: boardId,
      boardName: univName,
      schoolName: instName,
      universityName: univName,
      exam: "Bachelor of Technology / Undergraduate Examination 2026",
      examLevel: "Undergraduate (B.Tech)",
      course: searchParams.course || "B.Tech Computer Science & Engineering",
      semester: "Semester VI (6th Semester)",
      year: "2026",
      session: "May - June 2026 Regular",
      studentName: studentName,
      motherName: motherName,
      fatherName: fatherName,
      rollNumber: cleanRoll,
      enrollmentNumber: `ENR-2023-${cleanRoll.slice(-5)}`,
      admitCardId: admitCardId,
      dob: searchParams.dob || "2004-09-10",
      subjects: [
        { code: "CS601", name: "Cloud Computing & Systems", maxMarks: 100, obtained: 92, grade: "O", credits: 4 },
        { code: "CS602", name: "Machine Learning Applications", maxMarks: 100, obtained: 88, grade: "A+", credits: 4 },
        { code: "CS603", name: "Software Architecture & Design", maxMarks: 100, obtained: 86, grade: "A+", credits: 4 },
        { code: "CS604", name: "Information Security & Cryptography", maxMarks: 100, obtained: 91, grade: "O", credits: 3 },
        { code: "CS605", name: "AI & ML Laboratory", maxMarks: 100, obtained: 95, grade: "O", credits: 2 }
      ],
      maxTotalMarks: 500,
      totalMarks: 452,
      obtainedMarks: 452,
      percentage: 90.4,
      sgpa: "9.15",
      cgpa: "8.88",
      grade: "O (Outstanding)",
      status: "PASS",
      statusDetail: "FIRST CLASS WITH DISTINCTION",
      issueDate: "15 June 2026",
      verificationStatus: "Verified & Digitally Signed by Registrar",
      qrCodeString: `KITSS-VERIFIED-${boardId}-${cleanRoll}-90.4`
    };
  }

  // School / Board Result
  let schoolName = "Model Senior Secondary School";
  let schoolCode = "85201";
  let centerCode = "1104";
  let boardDisplayName = boardName;

  if (boardId === "STATE_BOARD") {
    const state = searchParams.stateName || "State";
    schoolName = `${state} Model Higher Secondary School`;
    boardDisplayName = `${state} State Board of Secondary & Higher Secondary Education`;
    schoolCode = "MH-11.02.001";
    centerCode = "PUN-042";
  } else if (boardId === "CBSE") {
    schoolName = "Delhi Public School, R.K. Puram, New Delhi";
    schoolCode = "85201";
    centerCode = "1104";
  } else if (boardId === "ICSE") {
    schoolName = "The Heritage Academy, Kolkata";
    schoolCode = "WB084";
    centerCode = "WB-102";
  }

  return {
    id: `res-gen-${cleanRoll}`,
    type: "school",
    board: boardId,
    boardName: boardDisplayName,
    schoolName: schoolName,
    schoolCode: schoolCode,
    centerCode: centerCode,
    exam: "Senior School Certificate Examination (Class XII) 2026",
    examLevel: "Class XII",
    year: "2026",
    session: "2025-2026",
    studentName: studentName,
    motherName: motherName,
    fatherName: fatherName,
    rollNumber: cleanRoll,
    admitCardId: admitCardId,
    dob: searchParams.dob || "2008-08-15",
    subjects: [
      { code: "184", name: "English Core", theory: 74, maxTheory: 80, practical: 19, maxPractical: 20, maxMarks: 100, obtained: 93, grade: "A1" },
      { code: "041", name: "Mathematics", theory: 76, maxTheory: 80, practical: 20, maxPractical: 20, maxMarks: 100, obtained: 96, grade: "A1" },
      { code: "042", name: "Physics", theory: 63, maxTheory: 70, practical: 29, maxPractical: 30, maxMarks: 100, obtained: 92, grade: "A1" },
      { code: "043", name: "Chemistry", theory: 62, maxTheory: 70, practical: 30, maxPractical: 30, maxMarks: 100, obtained: 92, grade: "A1" },
      { code: "083", name: "Computer Science", theory: 65, maxTheory: 70, practical: 30, maxPractical: 30, maxMarks: 100, obtained: 95, grade: "A1" }
    ],
    maxTotalMarks: 500,
    totalMarks: 468,
    obtainedMarks: 468,
    percentage: 93.6,
    grade: "A1",
    status: "PASS",
    statusDetail: "PASS WITH DISTINCTION",
    issueDate: "24 May 2026",
    verificationStatus: "Verified & Digitally Signed",
    qrCodeString: `KITSS-VERIFIED-${boardId}-${cleanRoll}-93.6`
  };
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
      // Dynamic fallback for user-entered roll numbers so any entered roll displays a valid marksheet
      return generateDynamicResult(searchParams, cleanRoll);
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
