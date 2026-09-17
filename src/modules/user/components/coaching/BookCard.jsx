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
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 card-shadow card-shadow-hover flex flex-col justify-between space-y-4 transition-all group">
      <div className="space-y-3">
        {/* Top Cover Thumbnail & Lock Status */}
        <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#0A1D3F]/5 border border-[#E6E8EC]">
          <img
            src={
              cover ||
              "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80"
            }
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Badges on Cover */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0A1D3F]/85 text-white backdrop-blur-xs">
              {subject}
            </span>
            {isLocked && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 text-white flex items-center gap-1 backdrop-blur-xs">
                <Lock className="w-2.5 h-2.5 text-[#FF8A00]" /> Locked
              </span>
            )}
          </div>

          {/* Page Count on bottom */}
          <div className="absolute bottom-2 left-2 text-white text-[11px] font-medium flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>{pages} Pages</span>
          </div>
        </div>

        {/* Content */}
        <div>
          <span className="text-[11px] font-semibold text-[#FF8A00] uppercase tracking-wider">
            {chapter}
          </span>
          <h3 className="font-bold text-sm sm:text-base text-[#0A1D3F] line-clamp-2 mt-0.5 group-hover:text-[#133C8B] transition-colors">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[#667085] line-clamp-2 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Reading Progress Indicator */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[#667085]">
            <span>Reading Progress</span>
            <span className="font-semibold text-[#0A1D3F]">
              Page {currentPage} of {pages} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E6E8EC]">
            <div
              className="h-full bg-[#17B26A] rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* CTA Button: READ ONLINE (NO DOWNLOAD BUTTON) */}
      <div className="pt-2 border-t border-[#E6E8EC]/60">
        {isLocked ? (
          <div className="text-center py-2 px-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#667085] font-medium">
            Enrollment required to unlock
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onReadOnline && onReadOnline(book)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#FF8A00]" />
            <span>Read Online</span>
            <ArrowRight className="w-3.5 h-3.5 ml-auto text-white/70" />
          </button>
        )}
      </div>
    </div>
  );
};
