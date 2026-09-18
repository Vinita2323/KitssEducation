import React from "react";
import { CheckCircle2, Video, BookOpen, Clock, Award, Sparkles, TrendingUp } from "lucide-react";

export const CourseProgress = ({
  courseTitle = "Class 10 CBSE Science",
  progressPercentage = 42,
  completedLectures = 36,
  totalLectures = 85,
  subjectsData = [],
}) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Overview Stats Card (Minimized Border Radius: rounded-md) */}
      <div className="bg-gradient-to-br from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] rounded-md p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF8A00]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
              <TrendingUp className="w-3 h-3 text-[#FF8A00]" /> Learning Tracker
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {courseTitle}
            </h2>
            <p className="text-xs text-white/80 max-w-lg leading-relaxed">
              Track your syllabus completion, watched lessons, and digital notes consistency.
            </p>
          </div>

          {/* Compact Progress Circular Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-md p-3 border border-white/15 flex items-center gap-3 shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#FF8A00] transition-all duration-700 ease-out"
                  strokeDasharray={`${progressPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-sm text-white">
                {progressPercentage}%
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold block">
                Overall Progress
              </span>
              <span className="font-extrabold text-xs sm:text-sm text-white">
                {completedLectures} / {totalLectures}
              </span>
              <span className="text-[10px] text-[#17B26A] font-bold block">
                Lectures Done
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-4 pt-3 border-t border-white/15 space-y-1">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Syllabus Completion</span>
            <span className="font-bold text-white">{progressPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/20 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject-wise Progress Breakdown */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
          Subject-wise Completion Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {(subjectsData || []).map((subj, idx) => {
            const total = subj.lectures?.length || 0;
            const done = (subj.lectures || []).filter((l) => l.isCompleted).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={idx}
                className="bg-white rounded-md border border-[#E6E8EC] p-3 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: subj.color || "#133C8B" }}
                    />
                    <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
                      {subj.subjectName}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-[#0A1D3F] bg-[#F7F8FA] px-1.5 py-0.2 rounded border border-[#E6E8EC]">
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#F7F8FA] rounded overflow-hidden border border-[#E6E8EC]">
                  <div
                    className="h-full bg-[#17B26A] rounded transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#667085] pt-0.5">
                  <span>
                    {done} of {total} lectures completed
                  </span>
                  {pct === 100 ? (
                    <span className="text-[#17B26A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Mastered
                    </span>
                  ) : (
                    <span className="text-[#FF8A00] font-semibold">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
