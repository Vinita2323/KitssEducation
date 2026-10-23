import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const BookLightbulbArt = () => (
  <svg
    viewBox="0 0 78 64"
    className="w-[46px] h-[40px] sm:w-[58px] sm:h-[48px] shrink-0"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M14 40c6 5 16 7 24 3" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M16 24h22l5 18H11l5-18Z" fill="#F97316" />
    <path d="M27 24h16l5 18H22l5-18Z" fill="#FDBA74" />
    <path d="M18 29h8" stroke="#FFF7ED" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M18 33h7" stroke="#FFF7ED" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M32 29h8" stroke="#FFF7ED" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M33 33h6" stroke="#FFF7ED" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M38 16l6-8 1.5 5 5 .8-5 4 .8 5-4-2.4-5 1.6 1.7-6Z" fill="#38BDF8" />
    <circle cx="52" cy="16" r="10" fill="#FDE68A" />
    <circle cx="52" cy="16" r="6.5" fill="#FBBF24" />
    <path d="M52 11.2v9.6" stroke="#FFFBEB" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M47.6 13.6l8.8 5" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M56.4 13.6l-8.8 5" stroke="#FFFBEB" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M48.6 23.5h6.8" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M64 8l1.6-3.2" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M67 14l3.2-.6" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M42 7l-2.4-2.4" stroke="#FBBF24" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const HomeAboutSection = () => {
  return (
    <section className="pt-1 pb-1 -mx-4 sm:mx-0">
      <Link
        to="/about"
        className="relative flex items-center gap-1.5 sm:gap-2 overflow-hidden rounded-[18px] bg-gradient-to-r from-[#FFF7ED] via-[#FFE7C4] to-[#FFD59A] pl-2 pr-2 py-2 sm:px-3.5 sm:py-2.5 shadow-xs group"
      >
        <span className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-[#FFE0B2]/80" />
        <span className="pointer-events-none absolute right-10 -bottom-12 h-24 w-28 rounded-full bg-white/45" />
        <span className="pointer-events-none absolute -right-4 -top-8 h-20 w-20 rounded-full bg-[#FFC98A]/40" />

        <span className="relative shrink-0">
          <BookLightbulbArt />
        </span>

        <span className="relative min-w-0 flex-1 overflow-hidden leading-tight">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#F97316]">
            About Us
          </span>
          <span className="mt-0.5 block text-[13px] sm:text-[15px] font-black text-[#0A1D3F] truncate">
            Know KITSS Education
          </span>
          <span className="mt-0.5 block text-[10.5px] sm:text-xs text-[#667085] truncate">
            Our story, mission & faculty
          </span>
        </span>

        <span className="relative z-10 inline-flex items-center gap-0.5 shrink-0 rounded-full bg-[#FF8A00] text-white text-[12px] font-bold pl-2.5 pr-1.5 py-1.5 shadow-sm group-hover:bg-[#E67A00] transition-colors">
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </section>
  );
};
