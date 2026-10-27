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

import { contentService } from '../../services/contentService';

export const HeroBannerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [published, setPublished] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => { const controller = new AbortController(); contentService.banners('home',controller.signal).then(rows=>{setPublished(rows);setCurrent(0);}).catch(e=>{if(e.code!=='ABORTED')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[]);
  const banners = published.map(b => ({...b,tagIcon:Sparkles,ctaLink:b.link?.target,gradient:b.variant==='teal'?'from-[#071739] to-[#0D9488]':b.variant==='orange'?'from-[#0A1D3F] to-[#FF8A00]':'from-[#0A1D3F] to-[#133C8B]',accentGlow:'bg-[#FF8A00]/25',graphic:<img src={b.imageUrl} alt={b.title} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover" />}));

  // Auto-advance carousel
  useEffect(() => {
    if (isHovered || banners.length < 2) return;
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

  if (!banners.length) return <div className="p-6 rounded-xl bg-[#0A1D3F] text-white text-sm" role={error ? 'alert' : 'status'}>{error || (loading ? 'Loading announcements?' : 'No published announcements.')}</div>;
  const activeBanner = banners[current % banners.length];
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
                <a
                  href={activeBanner.ctaLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#0A1D3F] text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all active:scale-95 group cursor-pointer"
                >
                  <span>{activeBanner.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-1 transition-transform" />
                </a>

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
            <div className="flex shrink-0">{activeBanner.graphic}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
