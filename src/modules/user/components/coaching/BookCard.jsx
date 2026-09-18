import React from "react";
import { BookOpen, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export const BookCard = ({ book, onReadOnline }) => {
  if (!book) return null;

  const {
    id,
    title,
    subject,
    chapter,
    pages = 32,
    currentPage = 1,
    isLocked = false,
    cover,
    description,
  } = book;

  const progressPct = Math.min(100, Math.round((currentPage / pages) * 100));

  return (
    <div className="bg-white rounded-md border border-[#E6E8EC] p-3 shadow-2xs hover:shadow-xs flex flex-col justify-between space-y-3 transition-all group">
      <div className="space-y-2">
        {/* Top Cover Thumbnail & Lock Status */}
        <div className="relative aspect-16/9 sm:aspect-4/3 rounded-md overflow-hidden bg-[#0A1D3F]/5 border border-[#E6E8EC]">
          <img
            src={
              cover ||
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80"
            }
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Badges on Cover */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between">
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#0A1D3F]/85 text-white backdrop-blur-xs">
              {subject}
            </span>
            {isLocked && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/75 text-white flex items-center gap-1 backdrop-blur-xs">
                <Lock className="w-2.5 h-2.5 text-[#FF8A00]" /> Locked
              </span>
            )}
          </div>

          {/* Page Count on bottom */}
          <div className="absolute bottom-1.5 left-1.5 text-white text-[10px] font-medium flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-[#FF8A00]" />
            <span>{pages} Pages</span>
          </div>
        </div>

        {/* Content */}
        <div>
          <span className="text-[10px] font-semibold text-[#FF8A00] uppercase tracking-wider">
            {chapter}
          </span>
          <h3 className="font-bold text-xs sm:text-sm text-[#0A1D3F] line-clamp-1 group-hover:text-[#133C8B] transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-[11px] text-[#667085] line-clamp-1 mt-0.5 leading-tight">
              {description}
            </p>
          )}
        </div>

        {/* Reading Progress Indicator */}
        <div className="space-y-0.5 pt-0.5">
          <div className="flex items-center justify-between text-[10px] text-[#667085]">
            <span>Reading Progress</span>
            <span className="font-semibold text-[#0A1D3F]">
              Page {currentPage} of {pages} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-1 bg-[#F7F8FA] rounded overflow-hidden border border-[#E6E8EC]">
            <div
              className="h-full bg-[#17B26A] rounded transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="pt-1.5 border-t border-[#E6E8EC]/60">
        {isLocked ? (
          <div className="text-center py-1.5 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-[11px] text-[#667085] font-medium">
            Enrollment required to unlock
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReadOnline && onReadOnline(book)}
            className="w-full py-2 px-3 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Read Online</span>
            <ArrowRight className="w-3 h-3 ml-auto text-white/70" />
          </button>
        )}
      </div>
    </div>
  );
};
