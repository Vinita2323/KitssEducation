import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Video,
  FileCheck,
  BookOpen,
  GraduationCap,
  Flame
} from "lucide-react";

export const HeroBannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const banners = [
    {
      id: "coaching",
      tag: "LIVE BATCHES 2026",
      tagIcon: Flame,
      tagStyle: "bg-rose-500/20 text-rose-300 border-rose-400/30",
      title: "Crack CBSE, JEE & NEET with Expert Mentors",
      subtitle: "Daily interactive classes, recorded vaults & All-India live tests.",
      ctaText: "Explore Courses",
      ctaLink: "/coaching",
      gradient: "from-[#0A1D3F] via-[#112D60] to-[#FF8A00]/40",
      accentGlow: "bg-[#FF8A00]/25",
      accentBadge: "text-[#FF8A00]",
      icon: Video,
      graphic: (
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#FF8A00] to-amber-300 rounded-2xl rotate-6 opacity-30 blur-md" />
          <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-xl">
            <Video className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF8A00] mb-0.5 stroke-[1.8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
              Live Stream
            </span>
          </div>
        </div>
      )
    },
    {
      id: "results",
      tag: "OFFICIAL MARKSHEETS 2026",
      tagIcon: FileCheck,
      tagStyle: "bg-teal-500/20 text-teal-300 border-teal-400/30",
      title: "Instant Examination Results & Verification",
      subtitle: "Check School & University board examination marksheets online.",
      ctaText: "Check Result",
      ctaLink: "/results",
      gradient: "from-[#071739] via-[#0A2647] to-[#0D9488]/40",
      accentGlow: "bg-teal-500/25",
      accentBadge: "text-teal-400",
      icon: FileCheck,
      graphic: (
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500 to-emerald-300 rounded-2xl -rotate-6 opacity-30 blur-md" />
          <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-xl">
            <FileCheck className="w-8 h-8 sm:w-9 sm:h-9 text-teal-400 mb-0.5 stroke-[1.8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200">
              Verified
            </span>
          </div>
        </div>
      )
    },
    {
      id: "books",
      tag: "CURRICULUM TEXTBOOKS",
      tagIcon: BookOpen,
      tagStyle: "bg-amber-500/20 text-amber-300 border-amber-400/30",
      title: "Digital Books with Smart In-App Reader",
      subtitle: "NCERT, CBSE & State Board textbooks with interactive exercises.",
      ctaText: "Browse Library",
      ctaLink: "/books",
      gradient: "from-[#0A1D3F] via-[#1E293B] to-[#FF8A00]/30",
      accentGlow: "bg-[#FF8A00]/20",
      accentBadge: "text-amber-400",
      icon: BookOpen,
      graphic: (
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-2xl rotate-3 opacity-30 blur-md" />
          <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-xl">
            <BookOpen className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF8A00] mb-0.5 stroke-[1.8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-200">
              Digital PDF
            </span>
          </div>
        </div>
      )
    },
    {
      id: "colleges",
      tag: "ADMISSIONS OPEN 2026",
      tagIcon: GraduationCap,
      tagStyle: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
      title: "Find Verified Partner Colleges & Degrees",
      subtitle: "Explore top universities, fee structures, and scholarship options.",
      ctaText: "Explore Colleges",
      ctaLink: "/colleges",
      gradient: "from-[#061226] via-[#0A1D3F] to-[#0D9488]/30",
      accentGlow: "bg-indigo-500/25",
      accentBadge: "text-teal-300",
      icon: GraduationCap,
      graphic: (
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-teal-400 rounded-2xl -rotate-3 opacity-30 blur-md" />
          <div className="relative w-20 h-20 sm:w-26 sm:h-26 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-white shadow-xl">
            <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9 text-teal-300 mb-0.5 stroke-[1.8]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-100">
              Partner Hub
            </span>
          </div>
        </div>
      )
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered, banners.length]);

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

  const activeBanner = banners[current];
  const TagIcon = activeBanner.tagIcon;

  return (
    <div
      className="relative -mt-3.5 sm:-mt-6 -mx-3.5 sm:-mx-6 lg:-mx-8 overflow-hidden shadow-xs mb-4 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`relative bg-gradient-to-br ${activeBanner.gradient} px-4.5 py-5 sm:px-7 sm:py-6 min-h-[165px] sm:min-h-[190px] flex flex-col justify-center text-white overflow-hidden`}
        >
          {/* Ambient Glows */}
          <div
            className={`absolute -top-12 -right-12 w-44 h-44 sm:w-56 sm:h-56 rounded-full ${activeBanner.accentGlow} blur-2xl pointer-events-none`}
          />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

          {/* Main Slide Content */}
          <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
            <div className="max-w-md sm:max-w-lg space-y-1.5 sm:space-y-2">
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs">
                <TagIcon className="w-3.5 h-3.5 shrink-0" />
                <span>{activeBanner.tag}</span>
              </div>

              {/* Title */}
              <h2 className="text-base sm:text-2xl font-black tracking-tight leading-tight sm:leading-snug drop-shadow-xs">
                {activeBanner.title}
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-1 sm:line-clamp-2 leading-relaxed font-normal">
                {activeBanner.subtitle}
              </p>

              {/* Action Button & Subtle Desktop Navigation */}
              <div className="pt-1.5 flex items-center gap-2.5">
                <Link
                  to={activeBanner.ctaLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A1D3F] text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-95 group cursor-pointer"
                >
                  <span>{activeBanner.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Compact Desktop Arrows */}
                <div className="hidden sm:flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition cursor-pointer"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition cursor-pointer"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Graphic / Floating Badge */}
            <div className="hidden xs:flex">{activeBanner.graphic}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
