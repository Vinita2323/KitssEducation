import React from "react";
import { BottomSheet } from "../common/Modal";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";

export const BookFilterModal = ({
  isOpen,
  onClose,
  boards = [],
  classes = [],
  subjects = [],
  selectedBoard,
  selectedClass,
  selectedSubject,
  selectedSort,
  onApply,
  onReset
}) => {
  const [board, setBoard] = React.useState(selectedBoard);
  const [cls, setCls] = React.useState(selectedClass);
  const [sub, setSub] = React.useState(selectedSubject);
  const [sort, setSort] = React.useState(selectedSort);

  const handleApply = () => {
    onApply({ board, className: cls, subject: sub, sort });
    onClose();
  };

  const handleReset = () => {
    setBoard("All");
    setCls("All");
    setSub("All");
    setSort("featured");
    onReset();
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Filter & Sort Books">
      <div className="space-y-4">
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
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  sort === s.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                    : "bg-white text-[#667085] border-[#E6E8EC]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Board */}
        <div>
          <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider block mb-2">
            Select Board
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoard("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                board === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                  : "bg-white text-[#667085] border-[#E6E8EC]"
              }`}
            >
              All Boards
            </button>
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBoard(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  board === b.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                    : "bg-white text-[#667085] border-[#E6E8EC]"
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
            Select Class
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCls("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                cls === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                  : "bg-white text-[#667085] border-[#E6E8EC]"
              }`}
            >
              All Classes
            </button>
            {classes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCls(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  cls === c
                    ? "bg-[#FF8A00] text-white border-[#FF8A00]"
                    : "bg-white text-[#667085] border-[#E6E8EC]"
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
            Select Subject
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSub("All")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                sub === "All"
                  ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                  : "bg-white text-[#667085] border-[#E6E8EC]"
              }`}
            >
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSub(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  sub === s.id
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                    : "bg-white text-[#667085] border-[#E6E8EC]"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

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
