import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star } from "lucide-react";

export const SectionHeader = ({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "View All",
  onViewAll,
  className = ""
}) => {
  return (
    <div className={`flex items-end justify-between gap-2 mb-3.5 ${className}`}>
      <div>
        <h2 className="text-lg md:text-xl font-bold text-[#0A1D3F] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs md:text-sm text-[#667085] mt-0.5">{subtitle}</p>
        )}
      </div>

      {(viewAllLink || onViewAll) && (
        viewAllLink ? (
          <Link
            to={viewAllLink}
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#FF8A00] hover:text-[#E67C00] transition group shrink-0"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-[#FF8A00] hover:text-[#E67C00] transition group shrink-0"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )
      )}
    </div>
  );
};

export const PriceDisplay = ({
  price,
  originalPrice,
  discount,
  isFree = false,
  size = "md"
}) => {
  const sizeMap = {
    sm: { price: "text-sm", orig: "text-xs", badge: "text-[10px] px-1.5 py-0.5" },
    md: { price: "text-lg", orig: "text-sm", badge: "text-xs px-2 py-0.5" },
    lg: { price: "text-2xl", orig: "text-base", badge: "text-xs px-2.5 py-1" }
  };

  const curr = sizeMap[size] || sizeMap.md;

  if (isFree || price === 0) {
    return (
      <div className="inline-flex items-center gap-2">
        <span className={`${curr.price} font-bold text-[#17B26A]`}>FREE</span>
        {originalPrice && (
          <span className={`${curr.orig} line-through text-[#667085]`}>
            ₹{originalPrice}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      <span className={`${curr.price} font-bold text-[#0A1D3F]`}>₹{price}</span>
      {originalPrice && (
        <span className={`${curr.orig} line-through text-[#667085]`}>
          ₹{originalPrice}
        </span>
      )}
      {discount && (
        <span
          className={`${curr.badge} font-bold rounded-md bg-[#ECFDF3] text-[#17B26A] whitespace-nowrap`}
        >
          {discount}
        </span>
      )}
    </div>
  );
};

export const RatingBadge = ({ rating, count, size = "sm" }) => {
  return (
    <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="text-[#0A1D3F]">{rating}</span>
      {count !== undefined && (
        <span className="text-[#667085] font-normal">({count})</span>
      )}
    </div>
  );
};

export const StatusBadge = ({ status, size = "sm" }) => {
  const s = (status || "").toLowerCase();

  let styles = "bg-gray-100 text-gray-700 border-gray-200";
  if (s.includes("active") || s.includes("paid") || s.includes("pass") || s.includes("promoted")) {
    styles = "bg-[#ECFDF3] text-[#17B26A] border-[#17B26A]/30";
  } else if (s.includes("expired") || s.includes("failed") || s.includes("cancel")) {
    styles = "bg-red-50 text-[#D92D20] border-red-200";
  } else if (s.includes("pending") || s.includes("processing")) {
    styles = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border px-2.5 py-0.5 capitalize ${styles} ${
        size === "sm" ? "text-[11px]" : "text-xs"
      }`}
    >
      {status}
    </span>
  );
};

export const ProgressBar = ({ progress = 0, color = "orange", height = "h-2" }) => {
  const colorMap = {
    orange: "bg-[#FF8A00]",
    navy: "bg-[#0A1D3F]",
    green: "bg-[#17B26A]",
    purple: "bg-[#6C4AB6]"
  };

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${height}`}>
      <div
        className={`${height} ${colorMap[color] || colorMap.orange} rounded-full transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
