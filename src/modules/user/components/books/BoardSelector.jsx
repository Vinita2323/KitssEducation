import React from "react";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Library,
  Sparkles,
  ChevronRight,
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages,
  Layers
} from "lucide-react";

const boardIcons = {
  GraduationCap,
  BookOpen,
  Building2,
  Library,
  Sparkles,
  Layers
};

const subjectIcons = {
  Calculator,
  Atom,
  BookMarked,
  Globe2,
  Languages,
  BookOpen
};

export const BoardSelector = ({ boards = [], selectedBoard = "All", onSelect }) => {
  const allBoards = [
    { id: "All", name: "All Boards", icon: "Layers" },
    ...boards
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 w-auto max-w-full min-w-0 scroll-smooth">
      {allBoards.map((board) => {
        const isSelected = selectedBoard === board.id;
        const Icon = boardIcons[board.icon] || GraduationCap;

        return (
          <button
            key={board.id}
            type="button"
            onClick={() => onSelect(board.id)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-150 shrink-0 w-[68px] sm:w-20 cursor-pointer ${
              isSelected
                ? "bg-[#0A1D3F] border-[#0A1D3F] text-white shadow-xs font-bold"
                : "bg-white border-[#E6E8EC] text-[#0A1D3F] hover:border-gray-300"
            }`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1 transition-colors ${
                isSelected ? "bg-white/20 text-white" : "bg-[#F7F8FA] text-[#0A1D3F]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate w-full text-center px-0.5">
              {board.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export const ClassSelector = ({ classes = [], selectedClass = "All", onSelect }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 w-auto max-w-full min-w-0 scroll-smooth">
      <button
        type="button"
        onClick={() => onSelect("All")}
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
          selectedClass === "All"
            ? "bg-[#0A1D3F] text-white shadow-xs"
            : "bg-white text-[#667085] border border-[#E6E8EC] hover:bg-gray-50"
        }`}
      >
        All Classes
      </button>
      {classes.map((cls) => {
        const isSelected = selectedClass === cls;
        return (
          <button
            key={cls}
            type="button"
            onClick={() => onSelect(cls)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
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

export const SubjectSelector = ({ subjects = [], selectedSubject = "All", onSelect }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0 w-auto max-w-full min-w-0 scroll-smooth">
      <button
        type="button"
        onClick={() => onSelect("All")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
          selectedSubject === "All"
            ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-xs"
            : "bg-white text-[#475467] border-[#E6E8EC] hover:bg-gray-50 hover:text-[#0A1D3F]"
        }`}
      >
        <span>All Subjects</span>
      </button>

      {subjects.map((sub) => {
        const isSelected = selectedSubject === sub.id;
        const Icon = subjectIcons[sub.icon] || BookOpen;

        return (
          <button
            key={sub.id}
            type="button"
            onClick={() => onSelect(sub.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer border ${
              isSelected
                ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-xs"
                : "bg-white text-[#475467] border-[#E6E8EC] hover:bg-gray-50 hover:text-[#0A1D3F]"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: isSelected ? "#FF8A00" : (sub.color || "#0A1D3F") }}
            />
            <span>{sub.name}</span>
            {sub.bookCount !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-[#667085]"
                }`}
              >
                {sub.bookCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export const SubjectCard = ({ subject, isSelected = false, onClick }) => {
  const Icon = subjectIcons[subject.icon] || BookOpen;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl border shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] text-left group cursor-pointer ${
        isSelected
          ? "bg-[#0A1D3F] border-[#0A1D3F] text-white"
          : "bg-white border-[#E6E8EC] hover:border-gray-300 text-[#0A1D3F]"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs text-white"
          style={{ backgroundColor: isSelected ? "#FF8A00" : (subject.color || "#0A1D3F") }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4
            className={`text-xs font-bold truncate ${
              isSelected ? "text-white" : "text-[#0A1D3F] group-hover:text-[#FF8A00]"
            } transition`}
          >
            {subject.name}
          </h4>
          <p className={`text-[11px] truncate ${isSelected ? "text-white/70" : "text-[#667085]"}`}>
            {subject.bookCount} Books Available
          </p>
        </div>
      </div>

      <ChevronRight
        className={`w-4 h-4 shrink-0 transition-all ${
          isSelected
            ? "text-white/80"
            : "text-gray-300 group-hover:text-[#0A1D3F] group-hover:translate-x-0.5"
        }`}
      />
    </button>
  );
};
