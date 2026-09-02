import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

export const SearchBar = ({
  value,
  onChange,
  onClear,
  onFilterClick,
  placeholder = "Search books, courses, topics...",
  className = ""
}) => {
  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E6E8EC] rounded-xl text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition shadow-xs"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className="p-2.5 bg-white border border-[#E6E8EC] rounded-xl text-[#0A1D3F] hover:bg-gray-50 active:scale-95 transition shrink-0 shadow-xs"
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const FilterChip = ({
  label,
  active = false,
  onClick,
  icon: Icon,
  badge
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 whitespace-nowrap active:scale-95 shrink-0 ${
        active
          ? "bg-[#0A1D3F] text-white shadow-xs"
          : "bg-white text-[#667085] border border-[#E6E8EC] hover:bg-gray-50 hover:text-[#0A1D3F]"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
