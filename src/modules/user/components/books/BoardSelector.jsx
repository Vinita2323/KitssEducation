import React from "react";
import { GraduationCap, BookOpen, Building2, Library, Sparkles, ChevronRight, Calculator, Atom, BookMarked, Globe2, Languages } from "lucide-react";

const boardIcons = {
  GraduationCap,
  BookOpen,
  Building2,
  Library,
  Sparkles
};

const subjectIcons = {
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages
};

export const BoardSelector = ({ boards = [], selectedBoard, onSelect }) => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
      {boards.map((board) => {
        const isSelected = selectedBoard === board.id;
        const Icon = boardIcons[board.icon] || GraduationCap;

        return (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelect(board.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 shrink-0 w-20 sm:w-24 touch-target ${
              isSelected
                ? "bg-[#0A1D3F] border-[#0A1D3F] text-white shadow-xs"
                : "bg-white border-[#E6E8EC] text-[#0A1D3F] hover:border-gray-300"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${
                isSelected ? "bg-white/20 text-white" : "bg-[#F7F8FA] text-[#0A1D3F]"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold tracking-tight truncate w-full text-center">
              {board.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const ClassSelector = ({ classes = [], selectedClass, onSelect }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        type="button"
        onClick={() => onSelect("All")}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 touch-target ${
          selectedClass === "All"
            ? "bg-[#0A1D3F] text-white shadow-xs"
            : "bg-white text-[#667085] border border-[#E6E8EC] hover:bg-gray-50"
        }`}
      >
        All
      </button>
      {classes.map((cls) => {
        const isSelected = selectedClass === cls;
        return (
          <button
            key={cls}
            type="button"
            onClick={() => onSelect(cls)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 touch-target ${
              isSelected
                ? "bg-[#FF8A00] text-white shadow-xs"
                : "bg-white text-[#0A1D3F] border border-[#E6E8EC] hover:bg-gray-50"
            }`}
          >
            Class {cls}
          </button>
        );
      })}
    </div>
  );
};

export const SubjectCard = ({ subject, onClick }) => {
  const Icon = subjectIcons[subject.icon] || BookOpen;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between p-3.5 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all active:scale-[0.99] text-left group"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white"
          style={{ backgroundColor: subject.color || "#0A1D3F" }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
            {subject.name}
          </h4>
          <p className="text-xs text-[#667085]">
            {subject.bookCount} Books Available
          </p>
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0A1D3F] group-hover:translate-x-0.5 transition-all" />
    </button>
  );
};
