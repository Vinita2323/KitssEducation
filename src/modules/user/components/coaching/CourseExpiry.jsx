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
      className={`rounded-md p-3 sm:p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isExpired
          ? "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
          : "bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            isExpired ? "bg-[#FECDCA] text-[#B42318]" : "bg-[#D1FADF] text-[#067647]"
          }`}
        >
          {isExpired ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm">
              Course Access: {status}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                isExpired ? "bg-[#B42318] text-white" : "bg-[#067647] text-white"
              }`}
            >
              {isExpired ? "Needs Renewal" : "Active Subscription"}
            </span>
          </div>

          <p className="text-[11px] mt-0.5 opacity-90 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              {isExpired
                ? "Your course access has expired. Please renew your course to continue learning."
                : `Valid through ${expiryDate}. Enjoy uninterrupted lessons & notes.`}
            </span>
          </p>
        </div>
      </div>

      {isExpired && (
        <button
          type="button"
          onClick={() => onRenew && onRenew()}
          className="shrink-0 px-3 py-1.5 rounded-md bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Renew Course</span>
        </button>
      )}
    </div>
  );
};
