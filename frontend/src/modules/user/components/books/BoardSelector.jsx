import React from "react";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Library,
  Sparkles,
  ChevronDown,
  Layers,
  Languages,
  X
} from "lucide-react";

export const BoardDropdown = ({
  boards = [],
  selectedBoard = "All",
  onSelect
}) => {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
          <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
          <span>1. Select Board</span>
        </label>
        {selectedBoard !== "All" && (
          <button
            type="button"
            onClick={() => onSelect("All")}
            className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
            title="Reset Board"
          >
            <span>Reset</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="relative">
        <select
          value={selectedBoard}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
            selectedBoard !== "All"
              ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
              : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
          }`}
        >
          <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
            All Boards
          </option>
          {boards.map((b) => (
            <option key={b.id} value={b.id} className="bg-white text-[#0A1D3F] font-semibold">
              {b.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
            selectedBoard !== "All" ? "text-white" : "text-[#667085]"
          }`}
        />
      </div>
    </div>
  );
};

export const ClassDropdown = ({
  classes = [],
  selectedClass = "All",
  onSelect
}) => {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
          <Layers className="w-3.5 h-3.5 text-[#133C8B] shrink-0" />
          <span>2. Select Class</span>
        </label>
        {selectedClass !== "All" && (
          <button
            type="button"
            onClick={() => onSelect("All")}
            className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
            title="Reset Class"
          >
            <span>Reset</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="relative">
        <select
          value={selectedClass}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
            selectedClass !== "All"
              ? "bg-[#FF8A00] text-white border-[#FF8A00] focus:ring-[#FF8A00]"
              : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
          }`}
        >
          <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
            All Classes
          </option>
          {classes.map((cls) => (
            <option key={cls} value={cls} className="bg-white text-[#0A1D3F] font-semibold">
              Class {cls}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
            selectedClass !== "All" ? "text-white" : "text-[#667085]"
          }`}
        />
      </div>
    </div>
  );
};

export const SubjectDropdown = ({
  subjects = [],
  selectedSubject = "All",
  onSelect
}) => {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
          <BookOpen className="w-3.5 h-3.5 text-[#17B26A] shrink-0" />
          <span>3. Select Subject</span>
        </label>
        {selectedSubject !== "All" && (
          <button
            type="button"
            onClick={() => onSelect("All")}
            className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
            title="Reset Subject"
          >
            <span>Reset</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="relative">
        <select
          value={selectedSubject}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
            selectedSubject !== "All"
              ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
              : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
          }`}
        >
          <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
            All Subjects
          </option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id} className="bg-white text-[#0A1D3F] font-semibold">
              {sub.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
            selectedSubject !== "All" ? "text-white" : "text-[#667085]"
          }`}
        />
      </div>
    </div>
  );
};

export const LanguageDropdown = ({
  selectedLanguage = "All",
  onSelect
}) => {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
          <Languages className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
          <span>4. Language Medium</span>
        </label>
        {selectedLanguage !== "All" && (
          <button
            type="button"
            onClick={() => onSelect("All")}
            className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
            title="Reset Language"
          >
            <span>Reset</span>
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => onSelect(e.target.value)}
          className={`w-full pl-3 pr-8 py-2.5 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
            selectedLanguage !== "All"
              ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
              : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
          }`}
        >
          <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
            All Languages
          </option>
          <option value="English" className="bg-white text-[#0A1D3F] font-semibold">
            English Medium
          </option>
          <option value="Hindi" className="bg-white text-[#0A1D3F] font-semibold">
            Hindi Medium (हिंदी)
          </option>
        </select>
        <ChevronDown
          className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
            selectedLanguage !== "All" ? "text-white" : "text-[#667085]"
          }`}
        />
      </div>
    </div>
  );
};

export const HierarchyDropdowns = ({
  boards = [],
  classes = [],
  subjects = [],
  selectedBoard = "All",
  selectedClass = "All",
  selectedSubject = "All",
  selectedLanguage = "All",
  onSelectBoard,
  onSelectClass,
  onSelectSubject,
  onSelectLanguage
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3 sm:p-4 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <BoardDropdown
          boards={boards}
          selectedBoard={selectedBoard}
          onSelect={onSelectBoard}
        />
        <ClassDropdown
          classes={classes}
          selectedClass={selectedClass}
          onSelect={onSelectClass}
        />
        <SubjectDropdown
          subjects={subjects}
          selectedSubject={selectedSubject}
          onSelect={onSelectSubject}
        />
        <LanguageDropdown
          selectedLanguage={selectedLanguage}
          onSelect={onSelectLanguage}
        />
      </div>
    </div>
  );
};

// Legacy alias exports if needed anywhere
export const BoardSelector = BoardDropdown;
export const ClassSelector = ClassDropdown;
export const SubjectSelector = SubjectDropdown;
