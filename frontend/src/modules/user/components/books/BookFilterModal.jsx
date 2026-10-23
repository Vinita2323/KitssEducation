import React, { useState, useEffect } from "react";
import { BottomSheet } from "../common/Modal";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";
import { bookService } from "../../services/bookService";

export const BookFilterModal = ({
  isOpen,
  onClose,
  boards = [],
  classes = [],
  subjects = [],
  selectedBoard = "All",
  selectedClass = "All",
  selectedSubject = "All",
  selectedSort = "featured",
  selectedType = "all",
  selectedLanguage = "All",
  selectedMinPrice = "",
  selectedMaxPrice = "",
  onApply,
  onReset
}) => {
  const [board, setBoard] = useState(selectedBoard);
  const [cls, setCls] = useState(selectedClass);
  const [sub, setSub] = useState(selectedSubject);
  const [sort, setSort] = useState(selectedSort);
  const [type, setType] = useState(selectedType);
  const [language, setLanguage] = useState(selectedLanguage);
  const [minPrice, setMinPrice] = useState(selectedMinPrice);
  const [maxPrice, setMaxPrice] = useState(selectedMaxPrice);

  const [availableClasses, setAvailableClasses] = useState(classes);
  const [availableSubjects, setAvailableSubjects] = useState(subjects);

  // Sync internal state with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setBoard(selectedBoard);
      setCls(selectedClass);
      setSub(selectedSubject);
      setSort(selectedSort);
      setType(selectedType);
      setLanguage(selectedLanguage);
      setMinPrice(selectedMinPrice);
      setMaxPrice(selectedMaxPrice);
    }
  }, [isOpen, selectedBoard, selectedClass, selectedSubject, selectedSort, selectedType, selectedLanguage, selectedMinPrice, selectedMaxPrice]);

  // Dynamic dependent classes & subjects inside modal
  useEffect(() => {
    let isMounted = true;
    const fetchDependentFilters = async () => {
      const clsList = await bookService.getAvailableClasses(board);
      if (!isMounted) return;
      setAvailableClasses(clsList);

      // If current class isn't in new list, reset to All
      let validCls = cls;
      if (cls !== "All" && !clsList.includes(cls)) {
        validCls = "All";
        setCls("All");
      }

      const subList = await bookService.getAvailableSubjects(board, validCls);
      if (!isMounted) return;
      setAvailableSubjects(subList);

      if (sub !== "All" && !subList.some((s) => s.id === sub || s.name === sub)) {
        setSub("All");
      }
    };

    fetchDependentFilters();
    return () => {
      isMounted = false;
    };
  }, [board, cls]);

  const handleApply = () => {
    onApply({
      board,
      className: cls,
      subject: sub,
      sort,
      type,
      language,
      minPrice,
      maxPrice
    });
    onClose();
  };

  const handleReset = () => {
    setBoard("All");
    setCls("All");
    setSub("All");
    setSort("featured");
    setType("all");
    setLanguage("All");
    setMinPrice("");
    setMaxPrice("");
    onReset();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Refine Books">
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Sort */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Sort By
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "featured", label: "Featured" },
              { id: "rating", label: "Top Rated" },
              { id: "price-low", label: "Price: Low to High" },
              { id: "price-high", label: "Price: High to Low" }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSort(s.id)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  sort === s.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free / Paid Filter */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Pricing Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All Types" },
              { id: "free", label: "Free Books" },
              { id: "paid", label: "Paid Only" }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  type === t.id
                    ? "bg-[#FF8A00] text-white border-[#FF8A00] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Board */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Board / Curriculum
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoard("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                board === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                  : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
              }`}
            >
              All Boards
            </button>
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBoard(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  board === b.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Class */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Class {board !== "All" && `(${board})`}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCls("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                cls === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                  : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
              }`}
            >
              All Classes
            </button>
            {availableClasses.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCls(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  cls === c
                    ? "bg-[#FF8A00] text-white border-[#FF8A00] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                Class {c}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Subject
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSub("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                sub === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                  : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
              }`}
            >
              All Subjects
            </button>
            {availableSubjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSub(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  sub === s.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Language Medium
          </label>
          <div className="flex gap-2">
            {["All", "English", "Hindi"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  language === lang
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                {lang === "All" ? "All Languages" : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        {type !== "free" && (
          <div>
            <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
              Price Range (₹)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
              />
              <span className="text-[#667085] text-xs">to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:border-[#0A1D3F]"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-3 border-t border-[#E6E8EC] flex gap-3">
          <SecondaryButton fullWidth size="md" onClick={handleReset}>
            Reset Filters
          </SecondaryButton>
          <PrimaryButton variant="navy" fullWidth size="md" onClick={handleApply}>
            Apply Filters
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
};

export const BookPreviewModal = ({ isOpen, onClose, book }) => {
  if (!book) return null;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Sample: ${book.title}`}>
      <div className="space-y-4">
        <div className="p-3 bg-[#0A1D3F]/5 rounded-xl border border-[#E6E8EC]">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0A1D3F]">{book.subtitle}</span>
            <span className="font-semibold text-[#FF8A00]">Free Preview</span>
          </div>
        </div>

        <div className="space-y-3">
          {book.samplePages?.map((page, idx) => (
            <div
              key={idx}
              className="p-4 bg-white rounded-xl border border-[#E6E8EC] shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0A1D3F]">{page.title}</span>
                <span className="text-[11px] text-[#667085]">Page {page.pageNum}</span>
              </div>
              <p className="text-xs text-[#667085] leading-relaxed">
                {page.previewText}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2">
          <PrimaryButton
            variant="orange"
            fullWidth
            size="md"
            onClick={onClose}
          >
            Close Preview
          </PrimaryButton>
        </div>
      </div>
    </BottomSheet>
  );
};
