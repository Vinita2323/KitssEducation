import React from "react";
import { BookOpen, ShieldCheck } from "lucide-react";
import { BookCard } from "./BookCard";

export const BookList = ({ subjectsData = [], onReadOnline }) => {
  const subjectsWithBooks = (subjectsData || []).filter(
    (subj) => subj.books && subj.books.length > 0
  );

  if (subjectsWithBooks.length === 0) {
    return (
      <div className="bg-white rounded-md border border-[#E6E8EC] p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-md bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center mx-auto">
          <BookOpen className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-sm text-[#0A1D3F]">No Study Material Available</h3>
        <p className="text-xs text-[#667085] max-w-sm mx-auto">
          Digital handbooks and formula sheets for this course are being prepared. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Disclaimer Banner (Minimized Border Radius: rounded-md) */}
      <div className="bg-[#FFF4E5] border border-[#FF8A00]/30 rounded-md p-2.5 sm:p-3 flex items-center gap-2.5 text-xs text-[#0A1D3F]">
        <div className="w-7 h-7 rounded-md bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00] shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-[#0A1D3F]">
            Protected Online Study Materials
          </h4>
          <p className="text-[#667085] text-[11px]">
            Chapter workbooks and formula sheets are available for in-app reading. Direct downloads are restricted.
          </p>
        </div>
      </div>

      {/* Grouped by Subjects */}
      {subjectsWithBooks.map((subj, sIdx) => (
        <div key={sIdx} className="space-y-2.5">
          <div className="flex items-center gap-2 pb-1.5 border-b border-[#E6E8EC]">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: subj.color || "#FF8A00" }}
            />
            <h3 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
              {subj.subjectName} Study Material
            </h3>
            <span className="text-[10px] font-semibold text-[#667085] bg-[#F7F8FA] px-1.5 py-0.2 rounded border border-[#E6E8EC] ml-auto">
              {subj.books.length} Books
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
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
