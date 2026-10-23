import React from "react";
import { ShieldCheck, AlertTriangle, Calendar, RefreshCw } from "lucide-react";

export const CourseExpiry = ({
  status = "Active",
  expiryDate = "15 March 2027",
  daysRemaining = 180,
  onRenew,
}) => {
  const isExpired = status === "Expired" || daysRemaining === 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 15;

  return (
    <div
      className={`rounded-md p-3 sm:p-3.5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isExpired
          ? "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
          : isExpiringSoon
          ? "bg-[#FFFAEB] border-[#FEDF89] text-[#B54708]"
          : "bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            isExpired
              ? "bg-[#FECDCA] text-[#B42318]"
              : isExpiringSoon
              ? "bg-[#FEF0C7] text-[#B54708]"
              : "bg-[#D1FADF] text-[#067647]"
          }`}
        >
          {isExpired || isExpiringSoon ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs sm:text-sm">
              Course Access: {isExpired ? "Expired" : "Active"}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                isExpired
                  ? "bg-[#B42318] text-white"
                  : isExpiringSoon
                  ? "bg-[#B54708] text-white"
                  : "bg-[#067647] text-white"
              }`}
            >
              {isExpired ? "Needs Renewal" : isExpiringSoon ? `Expiring in ${daysRemaining} Days` : "Active Subscription"}
            </span>
          </div>

          <p className="text-[11px] mt-0.5 opacity-90 flex items-center gap-1 flex-wrap">
            <Calendar className="w-3 h-3" />
            <span>
              {isExpired
                ? "Your subscription pass has expired. Please renew your course to resume video lectures & chapter notes."
                : `Valid through ${expiryDate} (${daysRemaining} days remaining). Enjoy uninterrupted lessons.`}
            </span>
          </p>
        </div>
      </div>

      {(isExpired || isExpiringSoon) && (
        <button
          type="button"
          onClick={() => onRenew && onRenew()}
          className={`shrink-0 px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer text-white ${
            isExpired ? "bg-[#D92D20] hover:bg-[#B42318]" : "bg-[#FF8A00] hover:bg-[#E67C00]"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isExpired ? "Renew Course Pass" : "Extend Subscription"}</span>
        </button>
      )}
    </div>
  );
};
