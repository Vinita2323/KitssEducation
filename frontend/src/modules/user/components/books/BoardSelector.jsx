import React from "react";
import { FilterSelect } from "../common/FilterSelect";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Library,
  Sparkles,
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
      <FilterSelect label="Filter by Board" value={selectedBoard} onChange={onSelect} searchPlaceholder="Search board" options={[{ value: "All", label: "All Boards" }, ...boards.map(b => ({ value: b.id, label: b.name }))]} />
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
      <FilterSelect label="Filter by Class" tone="orange" value={selectedClass} onChange={onSelect} searchPlaceholder="Search class" options={[{ value: "All", label: "All Classes" }, ...classes.map(cls => ({ value: cls, label: (cls.toLowerCase().startsWith('class') || cls.toLowerCase().startsWith('undergraduate') || cls.toLowerCase().startsWith('postgraduate') || cls.toLowerCase().startsWith('diploma') ? cls : `Class ${cls}`) }))]} />
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
      <FilterSelect label="Filter by Subject" value={selectedSubject} onChange={onSelect} searchPlaceholder="Search subject" options={[{ value: "All", label: "All Subjects" }, ...subjects.map(sub => ({ value: sub.id, label: sub.name }))]} />
    </div>
  );
};

export const LanguageDropdown = ({
  languages = [],
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
      <FilterSelect label="Filter by Language" value={selectedLanguage} onChange={onSelect} searchPlaceholder="Search language" options={[{ value: "All", label: "All Languages" }, ...languages.map(language => ({ value: language.id, label: language.name }))]} />
    </div>
  );
};

export const HierarchyDropdowns = ({
  languages = [],
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
          languages={languages}
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
