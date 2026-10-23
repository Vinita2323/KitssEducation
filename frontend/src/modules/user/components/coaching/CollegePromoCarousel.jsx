import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  MapPin
} from "lucide-react";

const BANNERS = [
  {
    id: "promo-du",
    tag: "ADMISSIONS OPEN 2026",
    collegeName: "Delhi University",
    subtitle: "CUET & partner pathways — premier collegiate programs.",
    location: "New Delhi, Delhi",
    website: "https://du.ac.in",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-[#0A1D3F]/95 via-[#0A1D3F]/75 to-[#0A1D3F]/35"
  },
  {
    id: "promo-lpu",
    tag: "SCHOLARSHIPS VIA LPUNEST",
    collegeName: "Lovely Professional University",
    subtitle: "India's largest campus — global placements & industry labs.",
    location: "Phagwara, Punjab",
    website: "https://lpu.in",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-[#133C8B]/95 via-[#133C8B]/70 to-[#FF8A00]/25"
  },
  {
    id: "promo-manipal",
    tag: "INSTITUTION OF EMINENCE",
    collegeName: "Manipal University",
    subtitle: "Top-ranked engineering, health sciences & management.",
    location: "Manipal, Karnataka",
    website: "https://manipal.edu",
    image:
      "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1200&auto=format&fit=crop&q=80",
    gradient: "from-[#0F766E]/95 via-[#0F766E]/70 to-[#0A1D3F]/30"
  }
];

export const CollegePromoCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHovered]);

  const handleNext = () => setCurrent((prev) => (prev + 1) % BANNERS.length);
  const handlePrev = () =>
    setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
  };

  const banner = BANNERS[current];

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-sm sm:text-base font-extrabold text-[#0A1D3F]">
          Partner College Offers
        </h2>
        <p className="text-[11px] text-[#667085] mt-0.5">
          Explore admissions and campus programs from partner colleges
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-md border border-[#E6E8EC] shadow-xs select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative min-h-[168px] sm:min-h-[190px] text-white overflow-hidden"
          >
            <img
              src={banner.image}
              alt={banner.collegeName}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`}
            />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FF8A00]/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 px-4 py-4 sm:px-6 sm:py-5 flex flex-col justify-center min-h-[168px] sm:min-h-[190px]">
              <div className="max-w-md space-y-1.5 sm:space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/25 bg-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                  <span>{banner.tag}</span>
                </div>

                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-white/85">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {banner.location}
                </span>

                <h3 className="text-base sm:text-2xl font-black tracking-tight leading-tight drop-shadow-xs">
                  {banner.collegeName}
                </h3>

                <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 leading-relaxed">
                  {banner.subtitle}
                </p>

                <div className="pt-1.5 flex items-center gap-2.5">
                  <a
                    href={banner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs sm:text-sm font-bold shadow-xs transition active:scale-95"
                  >
                    <span>Explore Now</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="hidden sm:flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition cursor-pointer"
                      aria-label="Previous banner"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-7 h-7 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:text-white transition cursor-pointer"
                      aria-label="Next banner"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to ${b.collegeName}`}
              className={`h-1.5 rounded-full transition-all ${
                i === current
                  ? "w-5 bg-[#FF8A00]"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
