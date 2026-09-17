import React from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import { BookCard } from "./BookCard";

export const BookList = ({ subjectsData = [], onReadOnline }) => {
  // Aggregate all books across all subjects or group them by subject
  const subjectsWithBooks = (subjectsData || []).filter(
    (subj) => subj.books && subj.books.length > 0
  );

  if (subjectsWithBooks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-8 sm:p-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-[#0A1D3F]">No Study Material Available</h3>
        <p className="text-xs text-[#667085] max-w-sm mx-auto">
          Digital handbooks and formula sheets for this course are being prepared. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Security Disclaimer Banner */}
      <div className="bg-[#FFF4E5] border border-[#FF8A00]/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-[#0A1D3F]">
        <div className="w-8 h-8 rounded-xl bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
            Protected Online Study Materials
          </h4>
          <p className="text-[#667085] mt-0.5 text-[11px] sm:text-xs">
            All chapter workbooks, formula sheets, and mock tests are available for in-app reading only. Direct downloads or PDF exports are restricted.
          </p>
        </div>
      </div>

      {/* Grouped by Subjects */}
      {subjectsWithBooks.map((subj, sIdx) => (
        <div key={sIdx} className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E6E8EC]">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: subj.color || "#FF8A00" }}
            />
            <h3 className="font-bold text-base sm:text-lg text-[#0A1D3F]">
              {subj.subjectName} Study Material
            </h3>
            <span className="text-xs font-semibold text-[#667085] bg-[#F7F8FA] px-2 py-0.5 rounded-md border border-[#E6E8EC] ml-auto">
              {subj.books.length} Books
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {subj.books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onReadOnline={onReadOnline}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
