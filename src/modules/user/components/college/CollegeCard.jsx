import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  CheckCircle2,
  Star,
  ArrowRight,
  GraduationCap,
  BookOpen
} from "lucide-react";

export const CollegeCard = ({ college, onViewCollege }) => {
  if (!college) return null;

  const typeBadge = college.collegeType || college.category || "University";
  const rating = college.rating || 4.8;
  const courses = college.popularCourses || [];
  const coursesCount = college.coursesCount || (courses.length > 0 ? courses.length : 12);

  const handleCardClick = () => {
    if (onViewCollege) {
      onViewCollege(college);
    }
  };

  return (
    <motion.div
      onClick={handleCardClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="w-[82vw] sm:w-[310px] md:w-[320px] shrink-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Campus Cover Image with Ambient Overlay */}
        <div className="relative h-38 sm:h-40 w-full overflow-hidden bg-slate-900">
          <img
            src={
              college.image ||
              college.banner ||
              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"
            }
            alt={college.name}
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1D3F] via-[#0A1D3F]/30 to-black/20 pointer-events-none" />

          {/* Top Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
            {/* Type & Verified Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#0A1D3F]/85 text-white backdrop-blur-md border border-white/15 shadow-xs uppercase tracking-wider">
              {college.verified && (
                <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />
              )}
              <span>{typeBadge}</span>
            </span>

            {/* Rating Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 text-[#0A1D3F] backdrop-blur-md shadow-xs border border-slate-100">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>{rating}</span>
            </span>
          </div>

          {/* College Name & Logo Overlaid on Bottom of Image */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2.5">
            {college.logo ? (
              <img
                src={college.logo}
                alt=""
                className="w-8 h-8 rounded-xl object-cover border-2 border-white/90 bg-white shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-white/90 border-2 border-white flex items-center justify-center text-[#0A1D3F] shrink-0 shadow-sm">
                <GraduationCap className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight line-clamp-1 group-hover:text-amber-200 transition-colors drop-shadow-sm">
              {college.name}
            </h3>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-3.5 space-y-2.5">
          {/* Location & Courses Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 truncate max-w-[65%]">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{college.district ? `${college.district}, ${college.state}` : college.location || `${college.city}, ${college.state}`}</span>
            </div>
            <span className="text-[11px] font-semibold text-[#0A1D3F] bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
              {coursesCount}+ Courses
            </span>
          </div>

          {/* Popular Courses Chips */}
          {courses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {courses.slice(0, 2).map((crs) => (
                <span
                  key={crs}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 line-clamp-1 max-w-[135px] truncate"
                >
                  {crs}
                </span>
              ))}
              {courses.length > 2 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-lg bg-orange-50 text-[#FF8A00] border border-orange-200/60">
                  +{courses.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Admission Status & Sleek CTA Strip */}
      <div className="px-3.5 pb-3.5 pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-700">
            Admissions Open
          </span>
        </div>

        <div className="inline-flex items-center gap-1 font-bold text-[#FF8A00] group-hover:text-[#E67A00] transition-colors">
          <span>View Campus</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};
