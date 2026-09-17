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
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center mx-auto">
          <Video className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-[#0A1D3F]">No Lectures Available</h3>
        <p className="text-xs text-[#667085] max-w-sm mx-auto">
          Lectures for this course are being scheduled. Check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subjectsData.map((subj, sIdx) => {
        const isExpanded = expandedSubjects[subj.subjectName] !== false;
        const totalLecs = subj.lectures?.length || 0;
        const completedLecs = (subj.lectures || []).filter((l) => l.isCompleted).length;
        const subjectProgress = totalLecs > 0 ? Math.round((completedLecs / totalLecs) * 100) : 0;

        return (
          <div
            key={sIdx}
            className="bg-white rounded-2xl border border-[#E6E8EC] overflow-hidden card-shadow transition-all"
          >
            {/* Subject Accordion Header */}
            <button
              type="button"
              onClick={() => toggleSubject(subj.subjectName)}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-[#F7F8FA]/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                  style={{ backgroundColor: subj.color || "#0A1D3F" }}
                >
                  {subj.subjectName.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-[#0A1D3F]">
                      {subj.subjectName}
                    </h3>
                    <span className="text-[11px] font-semibold text-[#667085] bg-[#F7F8FA] px-2 py-0.5 rounded-full border border-[#E6E8EC]">
                      {totalLecs} Lectures
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#667085]">
                      {completedLecs} of {totalLecs} completed ({subjectProgress}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-24 h-2 bg-[#E6E8EC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#17B26A] rounded-full transition-all duration-300"
                    style={{ width: `${subjectProgress}%` }}
                  />
                </div>

                <div className="p-1 rounded-lg bg-[#F7F8FA] text-[#667085]">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </button>

            {/* Subject Lectures List */}
            {isExpanded && (
              <div className="px-4 sm:px-6 pb-4 pt-1 space-y-2.5 border-t border-[#E6E8EC]/60 bg-[#F7F8FA]/30">
                {(subj.lectures || []).map((lec) => (
                  <LectureCard
                    key={lec.id}
                    lecture={lec}
                    subjectName={subj.subjectName}
                    courseId={courseId}
                    isCurrent={currentLectureId === lec.id}
                    onSelectLecture={onSelectLecture}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
