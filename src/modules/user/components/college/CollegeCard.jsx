import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CheckCircle2,
  Heart,
  ArrowRight,
  GraduationCap
} from "lucide-react";

export const CollegeCard = ({ college, onViewCollege }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  if (!college) return null;

  const collegeId = college._id || college.id;
  const typeBadge = college.collegeType || college.category || "University";

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsFavorite(!isFavorite);
  };

  const handleCardClick = () => {
    if (onViewCollege) {
      onViewCollege(college);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-[78vw] sm:w-[280px] md:w-[300px] shrink-0 snap-start bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 hover:shadow-md flex flex-col justify-between transition-all duration-200 group cursor-pointer"
    >
      {/* Top Image Box */}
      <div>
        <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
          <img
            src={
              college.image ||
              college.banner ||
              "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"
            }
            alt={college.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* College Type Badge (Top-Left) */}
          <div className="absolute top-2.5 left-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-md shadow-xs border border-white/15 tracking-wide">
              {typeBadge}
            </span>
          </div>

          {/* Favorite Heart Button (Top-Right) */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-slate-400 hover:text-rose-500 shadow-xs flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
            aria-label="Add to favorites"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${
                isFavorite ? "fill-rose-500 text-rose-500" : "stroke-[2]"
              }`}
            />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-3.5 space-y-1.5">
          {/* Title with Verified Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 line-clamp-1 tracking-tight group-hover:text-slate-700 transition-colors">
              {college.name}
            </h3>
            {college.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 fill-blue-50" />
            )}
          </div>

          {/* Location with Pin */}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{college.location || `${college.city}, ${college.state}`}</span>
          </div>

          {/* Short Description */}
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed pt-0.5">
            {college.description || college.about}
          </p>
        </div>
      </div>

      {/* Card Footer: View College CTA */}
      <div className="p-3.5 pt-0">
        <button
          type="button"
          onClick={handleCardClick}
          className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-[0.99] cursor-pointer"
        >
          <span>View College</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
