import React from "react";
import { Play, CheckCircle2, Lock, Clock, User, Sparkles } from "lucide-react";

export const LectureCard = ({
  lecture,
  subjectName,
  courseId,
  isCurrent = false,
  onSelectLecture,
}) => {
  if (!lecture) return null;

  const {
    id,
    title,
    duration,
    teacher,
    isCompleted,
    isInProgress,
    isLocked,
    summary,
  } = lecture;

  const handleClick = () => {
    if (isLocked) return;
    if (onSelectLecture) onSelectLecture(lecture, subjectName);
  };

  return (
    <div
      onClick={handleClick}
      className={`p-2 sm:p-2.5 rounded-md border transition-all duration-150 flex items-center justify-between gap-2.5 ${
        isLocked
          ? "bg-[#F7F8FA] border-[#E6E8EC] opacity-75 cursor-not-allowed"
          : isCurrent
          ? "bg-[#133C8B]/5 border-[#133C8B] shadow-2xs cursor-pointer"
          : "bg-white border-[#E6E8EC] hover:border-[#133C8B]/40 hover:shadow-2xs cursor-pointer"
      }`}
    >
      {/* Left: Status Icon, Title & Meta */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Status Indicator Icon */}
        <div className="shrink-0">
          {isLocked ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#667085]/10 flex items-center justify-center text-[#667085]">
              <Lock className="w-3.5 h-3.5" />
            </div>
          ) : isCompleted ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#17B26A]/10 flex items-center justify-center text-[#17B26A]" title="Completed">
              <CheckCircle2 className="w-3.5 h-3.5 fill-[#17B26A] text-white" />
            </div>
          ) : isInProgress ? (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#FF8A00]/10 flex items-center justify-center text-[#FF8A00]" title="In Progress">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
          ) : (
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#0A1D3F]/5 flex items-center justify-center text-[#0A1D3F]/60" title="Not Started">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-current" />
            </div>
          )}
        </div>

        {/* Title, Subject & Summary */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              className={`text-xs sm:text-sm font-semibold truncate ${
                isCurrent ? "text-[#133C8B] font-bold" : "text-[#0A1D3F]"
              }`}
            >
              {title}
            </h4>

            {isCompleted && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#17B26A]/10 text-[#17B26A]">
                Done
              </span>
            )}
            {isInProgress && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FF8A00]/10 text-[#FF8A00]">
                Watching
              </span>
            )}
            {isLocked && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#667085]/10 text-[#667085] flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </div>

          {/* Subtitle / Teacher & Duration */}
          <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] text-[#667085] mt-0.5 flex-wrap">
            {duration && (
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-[#133C8B]" /> {duration}
              </span>
            )}
            {teacher && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-[#667085]" /> {teacher}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action / Watch Button */}
      <div className="shrink-0">
        {isLocked ? (
          <span className="text-[10px] font-semibold text-[#667085] px-2 py-0.5 rounded bg-[#E6E8EC]/50">
            Locked
          </span>
        ) : (
          <button
            type="button"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              isCurrent
                ? "bg-[#133C8B] text-white"
                : "bg-[#0A1D3F]/5 hover:bg-[#0A1D3F] hover:text-white text-[#0A1D3F]"
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">{isCurrent ? "Playing" : "Watch"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
