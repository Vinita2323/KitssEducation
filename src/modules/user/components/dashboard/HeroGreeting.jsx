import React from "react";
import { Link } from "react-router-dom";
import { Play, Sparkles } from "lucide-react";
import { ProgressBar } from "../common/SectionHeader";

export const HeroGreeting = ({ user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 17) return "Good Afternoon!";
    return "Good Evening!";
  };

  const studentName = user ? user.name.split(" ")[0] : "Student";

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-white to-[#FFF8F0] p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs mb-4">
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF8A00]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{getGreeting()}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] mt-0.5 tracking-tight">
          Hi, {studentName} <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          What would you like to learn today?
        </p>
      </div>

      {/* Education Mascot / Illustration Graphic */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#0A1D3F]/5 rounded-2xl flex items-center justify-center p-1.5 border border-[#E6E8EC]/60">
        <div className="relative w-full h-full flex items-center justify-center">
          <span className="text-3xl sm:text-4xl select-none">🧑‍🎓</span>
          <span className="absolute -top-1 -right-1 text-sm">✨</span>
        </div>
      </div>
    </div>
  );
};

export const ContinueLearningCard = ({
  subject = "Mathematics",
  topic = "Linear Equations - Class 10",
  progress = 63,
  courseId = "course-201",
  lectureId = "lec-104"
}) => {
  return (
    <div className="bg-[#0A1D3F] text-white p-4 sm:p-5 rounded-2xl shadow-md border border-[#133C8B] relative overflow-hidden mb-5">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#133C8B]/40 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[#FF8A00]/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF8A00] text-white">
              Continue Learning
            </span>
            <span className="text-xs text-blue-200/80 font-medium">
              {subject}
            </span>
          </div>

          <span className="text-xs font-bold text-[#FF8A00]">{progress}%</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {topic}
            </h3>
            <div className="mt-2.5 max-w-md">
              <ProgressBar progress={progress} color="orange" height="h-2" />
            </div>
          </div>

          <Link
            to={`/coaching/${courseId}`}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#0A1D3F] hover:bg-[#FF8A00] hover:text-white flex items-center justify-center shrink-0 shadow-lg transition-all duration-200 active:scale-95 group"
            aria-label="Resume Lecture"
          >
            <Play className="w-5 h-5 fill-current ml-0.5 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
