import React, { useState } from "react";
import { ChevronDown, ChevronUp, Video, CheckCircle2, Lock, Sparkles, BookOpen } from "lucide-react";
import { LectureCard } from "./LectureCard";

export const LectureList = ({
  subjectsData = [],
  courseId,
  currentLectureId,
  onSelectLecture,
}) => {
  // By default, expand the first subject accordion
  const [expandedSubjects, setExpandedSubjects] = useState({
    [subjectsData[0]?.subjectName || "Physics"]: true,
  });

  const toggleSubject = (subjectName) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectName]: !prev[subjectName],
    }));
  };

  if (!subjectsData || subjectsData.length === 0) {
    return (
      <div className="bg-white rounded-md border border-[#E6E8EC] p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-md bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center mx-auto">
          <Video className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-sm text-[#0A1D3F]">No Lectures Available</h3>
        <p className="text-xs text-[#667085] max-w-sm mx-auto">
          Lectures for this course are being scheduled. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {subjectsData.map((subj, sIdx) => {
        const isExpanded = expandedSubjects[subj.subjectName] !== false;
        const totalLecs = subj.lectures?.length || 0;
        const completedLecs = (subj.lectures || []).filter((l) => l.isCompleted).length;
        const subjectProgress = totalLecs > 0 ? Math.round((completedLecs / totalLecs) * 100) : 0;

        return (
          <div
            key={sIdx}
            className="bg-white rounded-md border border-[#E6E8EC] overflow-hidden shadow-2xs transition-all"
          >
            {/* Subject Accordion Header (Minimized Border Radius: rounded-md) */}
            <button
              type="button"
              onClick={() => toggleSubject(subj.subjectName)}
              className="w-full px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2.5 text-left hover:bg-[#F7F8FA]/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-2xs shrink-0"
                  style={{ backgroundColor: subj.color || "#0A1D3F" }}
                >
                  {subj.subjectName.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-xs sm:text-sm text-[#0A1D3F] truncate">
                      {subj.subjectName}
                    </h3>
                    <span className="text-[10px] font-semibold text-[#667085] bg-[#F7F8FA] px-1.5 py-0.2 rounded border border-[#E6E8EC]">
                      {totalLecs} Lectures
                    </span>
                  </div>

                  <p className="text-[11px] text-[#667085] mt-0.5">
                    {completedLecs} of {totalLecs} completed ({subjectProgress}%)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block w-20 h-1.5 bg-[#E6E8EC] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#17B26A] rounded transition-all duration-300"
                    style={{ width: `${subjectProgress}%` }}
                  />
                </div>

                <div className="p-1 rounded bg-[#F7F8FA] text-[#667085]">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>

            {/* Subject Lectures List */}
            {isExpanded && (
              <div className="p-2 sm:p-2.5 space-y-1.5 border-t border-[#E6E8EC] bg-[#F8FAFC]/50">
                {subj.lectures && subj.lectures.length > 0 ? (
                  subj.lectures.map((lec) => (
                    <LectureCard
                      key={lec.id}
                      lecture={lec}
                      subjectName={subj.subjectName}
                      courseId={courseId}
                      isCurrent={lec.id === currentLectureId}
                      onSelectLecture={onSelectLecture}
                    />
                  ))
                ) : (
                  <p className="text-xs text-[#667085] p-3 text-center">
                    No lectures available under this subject yet.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
