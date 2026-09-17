import React from "react";
import { ShieldCheck, AlertTriangle, Calendar, RefreshCw } from "lucide-react";

export const CourseExpiry = ({
  status = "Active",
  expiryDate = "15 March 2027",
  onRenew,
}) => {
  const isExpired = status === "Expired";

  return (
    <div
      className={`rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isExpired
          ? "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
          : "bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isExpired ? "bg-[#FECDCA] text-[#B42318]" : "bg-[#D1FADF] text-[#067647]"
          }`}
        >
          {isExpired ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base">
              Course Access: {status}
            </span>
            <span
              className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isExpired ? "bg-[#B42318] text-white" : "bg-[#067647] text-white"
              }`}
            >
              {isExpired ? "Needs Renewal" : "Active Subscription"}
            </span>
          </div>

          <p className="text-xs mt-0.5 opacity-90 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isExpired
                ? "Your course access has expired. Please renew your course to continue learning."
                : `Valid through ${expiryDate}. Enjoy uninterrupted video lectures & digital notes.`}
            </span>
          </p>
        </div>
      </div>

      {isExpired && (
        <button
          type="button"
          onClick={() => onRenew && onRenew()}
          className="shrink-0 px-4 py-2 rounded-xl bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Renew Course</span>
        </button>
      )}
    </div>
  );
};
