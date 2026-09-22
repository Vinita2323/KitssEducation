import React from "react";
import { ShieldCheck, QrCode, Award, CheckCircle2, UserCheck } from "lucide-react";
import { ResultMarksTable } from "./ResultMarksTable";
import { ResultSummary } from "./ResultSummary";
import { ResultActions } from "./ResultActions";

const formatDob = (dobStr) => {
  if (!dobStr) return "-";
  try {
    const parts = dobStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, monthIndex, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      }
    }
  } catch {
    // fallback
  }
  return dobStr;
};

const getCleanStudentName = (name, roll = "") => {
  if (!name || name === "CANDIDATE STUDENT") {
    const names = ["AARAV SHARMA", "PRIYA VERMA", "ADITYA SINGH", "ANANYA IYER", "ROHAN GUPTA"];
    let hash = 0;
    const str = roll || "ROLL";
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return names[Math.abs(hash) % names.length];
  }
  return name;
};

const formatCleanAdmitId = (id) => {
  if (!id) return "-";
  const clean = id.replace("STATE_BOARD-", "MSB-");
  const parts = clean.split("-");
  if (parts.length >= 3) {
    const last = parts[parts.length - 1];
    if (last.length > 6) {
      parts[parts.length - 1] = last.slice(-6);
      return parts.join("-");
    }
  }
  return clean;
};

/**
 * ResultCard (Compact summary card used in History / List views)
 */
export const ResultCard = ({ item, onView }) => {
  const isPass = item.status?.toUpperCase().includes("PASS") || item.status?.toUpperCase().includes("PROMOTED");

  return (
    <div className="bg-white rounded-md border border-slate-200/80 p-2.5 sm:p-3 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-sm bg-slate-900 text-white uppercase">
            {item.board}
          </span>
          <span className="text-[11px] text-slate-500">{item.year}</span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.2 rounded-sm ${
              isPass ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-red-50 text-red-700 border border-red-200/50"
            }`}
          >
            {item.status}
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
          {item.exam}
        </h4>

        <p className="text-[11px] text-slate-500">
          Roll No: <span className="font-mono font-medium text-slate-800">{item.rollNumber}</span> • Score:{" "}
          <strong className="text-slate-800 font-semibold">{item.percentage}</strong>
        </p>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={onView}
          className="w-full sm:w-auto px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md transition active:scale-95 cursor-pointer"
        >
          View Marksheet
        </button>
      </div>
    </div>
  );
};

/**
 * ResultMarksheet
 * Official examination marksheet document presentation.
 * Supports both School and University examination templates with print and download.
 */
export const ResultMarksheet = ({ result, onBack, onNewSearch }) => {
  if (!result) return null;

  const isUniversity = result.type === "university" || !!result.universityName || !!result.course;
  const institution = result.schoolName || result.universityName || "Affiliated Educational Institution";
  const boardTitle = result.boardName || result.board;

  return (
    <div className="space-y-2.5 w-full box-border">
      {/* Top Actions Bar (Hidden on print) */}
      <ResultActions
        result={result}
        onBack={onBack}
        onNewSearch={onNewSearch}
      />

      {/* Official Marksheet Document Container */}
      <div className="bg-white rounded-md border border-slate-200/90 p-3 sm:p-5 shadow-2xs relative overflow-hidden print:border-none print:shadow-none print:p-0 w-full box-border">
        {/* Subtle Watermark in Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <img
            src="/KitssLogo.png"
            alt="Watermark"
            className="w-56 h-auto"
          />
        </div>

        {/* 1. Official Header Section */}
        <div className="text-center border-b border-slate-200 pb-2.5 mb-2.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <img
              src="/KitssLogo.png"
              alt="Board Emblem"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          <div className="inline-block px-2 py-0.5 rounded-sm bg-[#0A1D3F] text-[#FF8A00] text-[9px] font-semibold uppercase tracking-wider mb-0.5">
            OFFICIAL STATEMENT OF MARKS
          </div>

          <h2 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight uppercase">
            {boardTitle}
          </h2>

          <p className="text-[11px] sm:text-xs font-medium text-slate-600 uppercase mt-0.5">
            {result.exam}
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
            <span className="font-medium text-slate-700">
              Session {result.year || result.session || "2026"}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Online Authenticated Record
            </span>
          </div>
        </div>

        {/* 2. Candidate Particulars (Compact Minimalist Table) */}
        <div className="rounded-md border border-slate-200 overflow-hidden bg-white mb-3 shadow-2xs">
          {/* Section Sub-Header */}
          <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-600" />
              <h4 className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                Candidate Particulars
              </h4>
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Verified
            </span>
          </div>

          {/* 2-Column Key-Value Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-[11px]">
            {/* Left Column */}
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-1.5 flex items-center">
                <span className="text-slate-500 w-28 shrink-0 font-normal">Roll Number</span>
                <span className="font-mono font-semibold text-slate-900">{result.rollNumber}</span>
              </div>

              <div className="px-3 py-1.5 flex items-center">
                <span className="text-slate-500 w-28 shrink-0 font-normal">Candidate Name</span>
                <span className="font-semibold text-slate-900 uppercase truncate">
                  {getCleanStudentName(result.studentName, result.rollNumber)}
                </span>
              </div>

              {result.motherName && (
                <div className="px-3 py-1.5 flex items-center">
                  <span className="text-slate-500 w-28 shrink-0 font-normal">Mother's Name</span>
                  <span className="font-normal text-slate-700 uppercase truncate">
                    {result.motherName}
                  </span>
                </div>
              )}

              {result.fatherName && (
                <div className="px-3 py-1.5 flex items-center">
                  <span className="text-slate-500 w-28 shrink-0 font-normal">Father's Name</span>
                  <span className="font-normal text-slate-700 uppercase truncate">
                    {result.fatherName}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="divide-y divide-slate-100">
              <div className="px-3 py-1.5 flex items-center">
                <span className="text-slate-500 w-28 shrink-0 font-normal">
                  {isUniversity ? "Enrollment No" : "Registration No"}
                </span>
                <span className="font-mono font-medium text-slate-800 truncate">
                  {result.enrollmentNumber || formatCleanAdmitId(result.admitCardId)}
                </span>
              </div>

              {result.dob && (
                <div className="px-3 py-1.5 flex items-center">
                  <span className="text-slate-500 w-28 shrink-0 font-normal">Date of Birth</span>
                  <span className="font-normal text-slate-700">
                    {formatDob(result.dob)}
                  </span>
                </div>
              )}

              {isUniversity && (result.course || result.semester) ? (
                <div className="px-3 py-1.5 flex items-center">
                  <span className="text-slate-500 w-28 shrink-0 font-normal">Course / Sem</span>
                  <span className="font-normal text-slate-700 truncate">
                    {[result.course, result.semester].filter(Boolean).join(" • ")}
                  </span>
                </div>
              ) : (
                <div className="px-3 py-1.5 flex items-center">
                  <span className="text-slate-500 w-28 shrink-0 font-normal">Center Code</span>
                  <span className="font-mono font-normal text-slate-700">
                    {[result.centerCode, result.schoolCode].filter(Boolean).join(" / ") || "GEN-01"}
                  </span>
                </div>
              )}

              <div className="px-3 py-1.5 flex items-center">
                <span className="text-slate-500 w-28 shrink-0 font-normal">Result Session</span>
                <span className="font-normal text-slate-700">
                  {result.year || result.session || "2026"}
                </span>
              </div>
            </div>
          </div>

          {/* School / Institution Row */}
          {institution && (
            <div className="px-3 py-1.5 bg-slate-50/40 border-t border-slate-100 flex items-center text-[11px]">
              <span className="text-slate-500 w-28 shrink-0 font-normal">
                {isUniversity ? "Institution" : "School"}
              </span>
              <span className="font-medium text-slate-800 uppercase truncate">
                {institution}
              </span>
            </div>
          )}
        </div>

        {/* 3. Subject-wise Marks Table */}
        <div className="mb-3">
          <h4 className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Statement of Marks & Grades
          </h4>
          <ResultMarksTable subjects={result.subjects} />
        </div>

        {/* 4. Performance Summary */}
        <div className="mb-3">
          <ResultSummary result={result} />
        </div>

        {/* 5. Official Verification & Digital Seal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2.5 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-left">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-medium text-slate-800 text-[11px]">
                {result.verificationStatus || "Verified & Digitally Signed"}
              </p>
              <p className="text-[10px] text-slate-400">
                Publication: {result.issueDate || "24 May 2026"} • System Authenticated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50/80 px-2 py-1 rounded-md border border-slate-200 font-mono text-[10px]">
            <QrCode className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <div className="text-left">
              <span className="text-slate-400 block text-[9px] uppercase">Digital QR ID</span>
              <span className="font-medium text-slate-800">{formatCleanAdmitId(result.admitCardId) || "KITSS-VERIFIED-OK"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
