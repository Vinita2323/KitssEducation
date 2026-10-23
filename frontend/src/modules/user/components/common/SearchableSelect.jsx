import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Check, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CUSTOM_PREFIX = "__custom__:";

export const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Type to search...",
  searchable = true,
  allowCustom = false,
  forceOpenDirection = "auto",
  icon: Icon,
  disabled = false,
  error = "",
  className = "",
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openUpwards, setOpenUpwards] = useState(false);
  const [menuMaxHeight, setMenuMaxHeight] = useState(200);
  const [menuStyle, setMenuStyle] = useState({});
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "object" && opt !== null) {
      return {
        value: opt.value ?? opt.id ?? opt.name,
        label: opt.label ?? opt.name ?? opt.value ?? String(opt),
        group: opt.group,
      };
    }
    return { value: opt, label: String(opt) };
  });

  const isCustomValue = typeof value === "string" && value.startsWith(CUSTOM_PREFIX);
  const customLabel = isCustomValue ? value.slice(CUSTOM_PREFIX.length) : "";

  const selectedOption = useMemo(() => {
    if (isCustomValue) {
      return { value, label: customLabel };
    }
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value, isCustomValue, customLabel]);

  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const trimmedSearch = searchTerm.trim();
  const exactMatch = normalizedOptions.some(
    (opt) => opt.label.toLowerCase() === trimmedSearch.toLowerCase()
  );
  const showCustomOption =
    allowCustom && trimmedSearch.length >= 2 && !exactMatch;

  const showSearch = searchable || allowCustom;

  useEffect(() => {
    const handleOutsideClick = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
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

  const updateDropdownPlacement = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const topBar = 64;
    const bottomBar = viewportWidth < 768 ? 88 : 16;
    const gap = 4;
    const spaceBelow = viewportHeight - rect.bottom - bottomBar - gap;
    const spaceAbove = rect.top - topBar - gap;

    let shouldOpenUpwards = false;
    if (forceOpenDirection === "up") {
      shouldOpenUpwards = true;
    } else if (forceOpenDirection === "down") {
      shouldOpenUpwards = false;
    } else {
      shouldOpenUpwards = spaceBelow < 180 && spaceAbove > spaceBelow;
    }

    // If forced down but almost no room, still keep down and shrink hard
    const availableSpace = shouldOpenUpwards
      ? Math.max(100, spaceAbove)
      : Math.max(100, spaceBelow);

    const calculatedHeight = Math.max(100, Math.min(200, availableSpace - (showSearch ? 44 : 8)));
    setOpenUpwards(shouldOpenUpwards);
    setMenuMaxHeight(calculatedHeight);

    const left = Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8));
    const width = Math.min(rect.width, viewportWidth - 16);

    if (shouldOpenUpwards) {
      setMenuStyle({
        position: "fixed",
        left,
        width,
        bottom: viewportHeight - rect.top + gap,
        top: "auto",
        zIndex: 100,
      });
    } else {
      setMenuStyle({
        position: "fixed",
        left,
        width,
        top: rect.bottom + gap,
        bottom: "auto",
        zIndex: 100,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPlacement();
      window.addEventListener("scroll", updateDropdownPlacement, true);
      window.addEventListener("resize", updateDropdownPlacement);

      if (showSearch && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPlacement, true);
      window.removeEventListener("resize", updateDropdownPlacement);
    };
  }, [isOpen, showSearch, forceOpenDirection]);

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSelectCustom = () => {
    if (!trimmedSearch) return;
    handleSelect(`${CUSTOM_PREFIX}${trimmedSearch}`);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchTerm("");
  };

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: openUpwards ? 4 : -4, scale: 0.99 }}
          transition={{ duration: 0.12 }}
          style={{
            ...menuStyle,
            maxHeight: menuMaxHeight + (showSearch ? 48 : 8),
          }}
          className={`bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden ${
            openUpwards
              ? "shadow-[0_-8px_20px_-4px_rgba(0,0,0,0.12)]"
              : "shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12)]"
          }`}
        >
          {showSearch && (
            <div className="p-1.5 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={
                    allowCustom
                      ? "Search or type institute name"
                      : searchPlaceholder
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && showCustomOption) {
                      e.preventDefault();
                      handleSelectCustom();
                    }
                  }}
                  className="w-full pl-7 pr-6 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] text-[#0A1D3F] placeholder:text-slate-400 focus:outline-none focus:border-[#FF8A00]"
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

          <div
            style={{ maxHeight: `${menuMaxHeight}px` }}
            className="overflow-y-auto overflow-x-hidden p-1 space-y-0.5 overscroll-contain"
          >
            {showCustomOption && (
              <div
                onClick={handleSelectCustom}
                className="px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 bg-[#FFF7ED] text-[#FF8A00] hover:bg-orange-100 border border-orange-100 mb-0.5"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Use &quot;{trimmedSearch}&quot;</span>
              </div>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const showGroup =
                  opt.group && opt.group !== filteredOptions[index - 1]?.group;
                return (
                  <div key={String(opt.value)}>
                    {showGroup && (
                      <p className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wide text-[#667085]">
                        {opt.group}
                      </p>
                    )}
                    <div
                      onClick={() => handleSelect(opt.value)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-orange-50 text-[#FF8A00] font-bold"
                          : "text-[#0A1D3F] hover:bg-slate-50 hover:text-[#0A1D3F]"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-3 h-3 text-[#FF8A00] shrink-0 stroke-[2.5]" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : !showCustomOption ? (
              <div className="py-3 text-center text-[11px] text-slate-400 font-medium">
                {allowCustom
                  ? "Type your institute name above"
                  : "No matching options found"}
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
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
        className={`w-full ${compact ? "h-8 px-2.5 rounded-md" : "px-3 py-2 rounded-lg"} bg-[#F7F8FA] hover:bg-slate-50 border text-xs cursor-pointer transition-all duration-150 flex items-center justify-between gap-2 select-none ${
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

      {typeof document !== "undefined"
        ? createPortal(menuContent, document.body)
        : null}
    </div>
  );
};

export const isCustomSelectValue = (value) =>
  typeof value === "string" && value.startsWith(CUSTOM_PREFIX);

export const getCustomSelectLabel = (value) =>
  isCustomSelectValue(value) ? value.slice(CUSTOM_PREFIX.length) : "";
