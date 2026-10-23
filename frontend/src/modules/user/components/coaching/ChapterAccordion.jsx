import React, { useState } from "react";
import { ChevronDown, ChevronUp, Play, CheckCircle2, Circle, Clock, FileText } from "lucide-react";
import { useLibrary } from "../../context/LibraryContext";

export const LectureItem = ({
  lecture,
  isActive = false,
  onSelect
}) => {
  const { completedLectureIds } = useLibrary();
  const isCompleted = completedLectureIds.includes(lecture.id) || lecture.isCompleted;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left group ${
        isActive
          ? "bg-[#0A1D3F] text-white shadow-xs"
          : "bg-white hover:bg-gray-50 text-[#0A1D3F] border border-[#E6E8EC]/60"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-[#FF8A00] text-white"
              : isCompleted
              ? "bg-[#17B26A]/10 text-[#17B26A]"
              : "bg-gray-100 text-gray-500 group-hover:bg-[#0A1D3F] group-hover:text-white"
          }`}
        >
          {isCompleted && !isActive ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </div>

        <div className="min-w-0">
          <h5
            className={`text-xs font-bold truncate ${
              isActive ? "text-white" : "text-[#0A1D3F]"
            }`}
          >
            {lecture.title}
          </h5>
          <div
            className={`flex items-center gap-2 text-[11px] mt-0.5 ${
              isActive ? "text-blue-200" : "text-[#667085]"
            }`}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{lecture.duration}</span>
            </span>
            {lecture.resources?.length > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span>{lecture.resources.length} Notes</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 pl-2">
        {isCompleted ? (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-[#17B26A]/10 text-[#17B26A]"
            }`}
          >
            Done
          </span>
        ) : (
          <span
            className={`text-[10px] font-semibold ${
              isActive ? "text-[#FF8A00]" : "text-gray-400"
            }`}
          >
            {lecture.duration}
          </span>
        )}
      </div>
    </button>
  );
};

export const ChapterAccordion = ({
  chapter,
  defaultOpen = true,
  activeLectureId,
  onSelectLecture
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { completedLectureIds } = useLibrary();

  const completedCount = chapter.lectures.filter(
    (l) => completedLectureIds.includes(l.id) || l.isCompleted
  ).length;

  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 bg-[#F7F8FA] hover:bg-gray-100 transition text-left"
      >
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
            {chapter.title}
          </h4>
          <p className="text-[11px] text-[#667085] mt-0.5">
            {chapter.lectures.length} Lectures • {chapter.duration} •{" "}
            <span className="text-[#17B26A] font-semibold">
              {completedCount}/{chapter.lectures.length} Completed
            </span>
          </p>
        </div>

        <div className="p-1 rounded-lg bg-white border border-[#E6E8EC] text-gray-500 shrink-0 ml-2">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 space-y-2 bg-white">
          {chapter.lectures.map((lecture) => (
            <LectureItem
              key={lecture.id}
              lecture={lecture}
              isActive={activeLectureId === lecture.id}
              onSelect={() => onSelectLecture(lecture)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
