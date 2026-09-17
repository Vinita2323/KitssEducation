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
    <div className="space-y-6">
      {/* Overview Stats Card */}
      <div className="bg-gradient-to-br from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
              <TrendingUp className="w-3.5 h-3.5 text-[#FF8A00]" /> Student Learning Tracker
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {courseTitle}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-lg leading-relaxed">
              Track your syllabus completion, watched video lectures, and read digital notes. Consistency is key to academic excellence!
            </p>
          </div>

          {/* Progress Circular Indicator */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 flex items-center gap-4 shrink-0">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
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
              <span className="absolute font-black text-base sm:text-lg text-white">
                {progressPercentage}%
              </span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold block">
                Overall Progress
              </span>
              <span className="font-extrabold text-sm sm:text-base text-white">
                {completedLectures} / {totalLectures}
              </span>
              <span className="text-[11px] text-[#17B26A] font-bold block">
                Lectures Completed
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-6 pt-5 border-t border-white/15 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Course Syllabus Completion</span>
            <span className="font-bold text-white">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded-full transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subject-wise Progress Breakdown */}
      <div className="space-y-4">
        <h3 className="font-bold text-base sm:text-lg text-[#0A1D3F]">
          Subject-wise Completion Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(subjectsData || []).map((subj, idx) => {
            const total = subj.lectures?.length || 0;
            const done = (subj.lectures || []).filter((l) => l.isCompleted).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 card-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subj.color || "#133C8B" }}
                    />
                    <h4 className="font-bold text-sm sm:text-base text-[#0A1D3F]">
                      {subj.subjectName}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#0A1D3F] bg-[#F7F8FA] px-2 py-0.5 rounded-md border border-[#E6E8EC]">
                    {pct}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E6E8EC]">
                  <div
                    className="h-full bg-[#17B26A] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#667085] pt-1">
                  <span>
                    {done} of {total} lectures completed
                  </span>
                  {pct === 100 ? (
                    <span className="text-[#17B26A] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
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
