import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  searchable = true,
  icon: Icon,
  disabled = false,
  error = "",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpwards, setOpenUpwards] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(200);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.name,
        label: opt.label ?? opt.name ?? opt.value ?? String(opt)
      };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Filter options by search term
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Check if dropdown should open upwards and compute optimal height to avoid screen overflow
  const updateDropdownPlacement = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;

      // If space below is tighter than 230px and space above is larger, open upwards
      const shouldOpenUpwards = spaceBelow < 230 && spaceAbove > spaceBelow;
      setOpenUpwards(shouldOpenUpwards);

      const availableSpace = shouldOpenUpwards ? spaceAbove : spaceBelow;
      const calculatedHeight = Math.max(120, Math.min(200, availableSpace - 40));
      setMenuMaxHeight(calculatedHeight);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPlacement();
      window.addEventListener("scroll", updateDropdownPlacement, true);
      window.addEventListener("resize", updateDropdownPlacement);

      // Focus search input on open
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPlacement, true);
      window.removeEventListener("resize", updateDropdownPlacement);
    };
  }, [isOpen, searchable]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Compact Trigger Button with Clean Border Radius */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`w-full px-3 py-2 bg-slate-50/80 hover:bg-slate-50 border rounded-lg text-xs cursor-pointer transition-all duration-150 flex items-center justify-between gap-2 select-none ${
          isOpen
            ? "border-[#FF8A00] ring-1.5 ring-orange-200/60 bg-white shadow-2xs"
            : error
            ? "border-red-300 bg-red-50/20"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-slate-100" : ""}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span
            className={`truncate text-xs ${
              selectedOption ? "text-[#0A1D3F] font-semibold" : "text-slate-400"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#FF8A00]" : ""
          }`}
        />
      </div>

      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className={`absolute left-0 right-0 z-50 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden ${
              openUpwards
                ? "bottom-full mb-1 shadow-[0_-8px_20px_-4px_rgba(0,0,0,0.1)]"
                : "top-full mt-1 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1)]"
            }`}
          >
            {/* Search Input Filter */}
            {searchable && normalizedOptions.length > 5 && (
              <div className="p-1.5 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-6 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-[#0A1D3F] placeholder:text-slate-400 focus:outline-none focus:border-[#FF8A00]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm("");
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div
              style={{ maxHeight: `${menuMaxHeight}px` }}
              className="overflow-y-auto p-1 space-y-0.5 overscroll-contain"
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-orange-50 text-[#FF8A00] font-bold"
                          : "text-[#0A1D3F] hover:bg-slate-50 hover:text-[#0A1D3F]"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#FF8A00] shrink-0 stroke-[2.5]" />}
                    </div>
                  );
                })
              ) : (
                <div className="py-3 text-center text-[11px] text-slate-400 font-medium">
                  No matching options found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
