import React from "react";
import { ShieldCheck, QrCode, Award, CheckCircle2 } from "lucide-react";
import { ResultMarksTable } from "./ResultMarksTable";
import { ResultSummary } from "./ResultSummary";
import { ResultActions } from "./ResultActions";

/**
 * ResultCard (Compact summary card used in History / List views)
 */
export const ResultCard = ({ item, onView }) => {
  const isPass = item.status?.toUpperCase().includes("PASS") || item.status?.toUpperCase().includes("PROMOTED");

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-white uppercase">
            {item.board}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">{item.year}</span>
          <span
            className={`text-[10px] font-semibold px-2 py-0.2 rounded-md ${
              isPass ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-red-50 text-red-700 border border-red-200/50"
            }`}
          >
            {item.status}
          </span>
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
          {item.exam}
        </h4>

        <p className="text-[11px] text-slate-500">
          Roll No: <span className="font-mono font-semibold text-slate-800">{item.rollNumber}</span> • Score:{" "}
          <strong className="text-slate-900">{item.percentage}</strong>
        </p>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={onView}
          className="w-full sm:w-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
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
    <div className="space-y-3 w-full box-border">
      {/* Top Actions Bar (Hidden on print) */}
      <ResultActions
        result={result}
        onBack={onBack}
        onNewSearch={onNewSearch}
      />

      {/* Official Marksheet Document Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-6 shadow-xs relative overflow-hidden print:border-none print:shadow-none print:p-0 w-full box-border">
        {/* Subtle Watermark in Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <img
            src="/KitssLogo.png"
            alt="Watermark"
            className="w-60 h-auto"
          />
        </div>

        {/* 1. Header Section */}
        <div className="text-center border-b border-slate-200 pb-3 mb-3">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <img
              src="/KitssLogo.png"
              alt="Board Emblem"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>

          <div className="inline-block px-2.5 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
            RESULT STATEMENT
          </div>

          <h2 className="text-xs sm:text-base font-bold text-slate-900 tracking-tight uppercase">
            {institution}
          </h2>

          <p className="text-[11px] sm:text-xs font-semibold text-slate-700 uppercase mt-0.5">
            {boardTitle}
          </p>

          <p className="text-[11px] font-medium text-slate-500 uppercase mt-0.5">
            {result.exam}
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-800">
              Session {result.year || result.session || "2026"}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">
              Authenticated Marksheet
            </span>
          </div>
        </div>

        {/* 2. Student Information Grid */}
        <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-lg border border-slate-200/70 mb-3.5">
          <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Candidate & Examination Credentials
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {/* Student Name */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                Student Name
              </span>
              <span className="font-extrabold text-[#0A1D3F] text-xs sm:text-sm uppercase block truncate">
                {result.studentName}
              </span>
            </div>

            {/* Roll Number */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                Roll Number
              </span>
              <span className="font-mono font-extrabold text-[#0A1D3F] text-xs sm:text-sm block">
                {result.rollNumber}
              </span>
            </div>

            {/* Enrollment / Admit Card ID */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                {isUniversity ? "Enrollment Number" : "Admit Card / ID"}
              </span>
              <span className="font-mono font-semibold text-[#0A1D3F] text-xs block truncate">
                {result.enrollmentNumber || result.admitCardId || "-"}
              </span>
            </div>

            {/* Class or Course */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                {isUniversity ? "Course / Program" : "Class / Level"}
              </span>
              <span className="font-semibold text-[#0A1D3F] text-xs block truncate">
                {result.course || result.examLevel || "Standard Examination"}
              </span>
            </div>

            {/* Semester or Exam Type */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                {isUniversity ? "Semester" : "Examination"}
              </span>
              <span className="font-semibold text-[#0A1D3F] text-xs block truncate">
                {result.semester || "Annual Main"}
              </span>
            </div>

            {/* Academic Year */}
            <div>
              <span className="text-[#667085] block text-[10px] uppercase font-bold">
                Academic Year
              </span>
              <span className="font-semibold text-[#0A1D3F] text-xs block">
                {result.year}
              </span>
            </div>

            {/* Parents / School info if available */}
            {result.motherName && (
              <div>
                <span className="text-[#667085] block text-[10px] uppercase font-bold">
                  Mother's Name
                </span>
                <span className="font-semibold text-[#0A1D3F] text-xs block uppercase truncate">
                  {result.motherName}
                </span>
              </div>
            )}

            {result.fatherName && (
              <div>
                <span className="text-[#667085] block text-[10px] uppercase font-bold">
                  Father's Name
                </span>
                <span className="font-semibold text-[#0A1D3F] text-xs block uppercase truncate">
                  {result.fatherName}
                </span>
              </div>
            )}

            {result.dob && (
              <div>
                <span className="text-[#667085] block text-[10px] uppercase font-bold">
                  Date of Birth
                </span>
                <span className="font-semibold text-[#0A1D3F] text-xs block">
                  {result.dob}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Subject-wise Marks Table */}
        <div className="mb-3.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
            Statement of Marks & Grades
          </h4>
          <ResultMarksTable subjects={result.subjects} />
        </div>

        {/* 4. Performance Summary */}
        <div className="mb-3.5">
          <ResultSummary result={result} />
        </div>

        {/* 5. Official Verification & Digital Seal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-left">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/50">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-xs">
                {result.verificationStatus || "Verified & Digitally Signed"}
              </p>
              <p className="text-[10px] text-slate-500">
                Date of Publication: {result.issueDate || "24 May 2026"} • System Authenticated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono text-[10px]">
            <QrCode className="w-4 h-4 text-slate-800 shrink-0" />
            <div className="text-left">
              <span className="text-slate-400 block text-[9px] uppercase">Digital QR ID</span>
              <span className="font-semibold text-slate-800">{result.admitCardId || "KITSS-VERIFIED-OK"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
