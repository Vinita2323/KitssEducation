import React from "react";
import { Loader2, GraduationCap, ShieldCheck } from "lucide-react";

/**
 * ResultLoading
 * Displays animated educational searching state while fetching marksheet.
 */
export const ResultLoading = ({ boardName = "Examination Board" }) => {
  return (
    <div className="bg-white rounded-3xl border border-[#E6E8EC] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs space-y-6">
      <div className="relative inline-flex items-center justify-center">
        {/* Pulsing Outer Rings */}
        <div className="w-20 h-20 rounded-full bg-[#0A1D3F]/5 animate-ping absolute" />
        <div className="w-16 h-16 rounded-full bg-[#0A1D3F]/10 flex items-center justify-center relative">
          <GraduationCap className="w-8 h-8 text-[#0A1D3F] animate-bounce" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
          Searching Result...
        </h3>
        <p className="text-xs sm:text-sm text-[#667085] max-w-sm mx-auto">
          Please wait while we fetch your result from <span className="font-bold text-[#0A1D3F]">{boardName}</span> records.
        </p>
      </div>

      {/* Progress Bar Animation */}
      <div className="w-full max-w-xs mx-auto bg-[#F2F4F7] h-2 rounded-full overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A1D3F] via-[#FF8A00] to-[#17B26A] h-full rounded-full animate-[shimmer_1.5s_infinite] w-full" />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#667085] pt-2">
        <ShieldCheck className="w-4 h-4 text-[#17B26A]" />
        <span>Authenticating digital examination seal...</span>
      </div>

      {/* Skeleton Preview Lines */}
      <div className="pt-4 border-t border-[#F2F4F7] space-y-2.5 opacity-60">
        <div className="h-3 bg-gray-200 rounded-full w-3/4 mx-auto animate-pulse" />
        <div className="h-3 bg-gray-200 rounded-full w-1/2 mx-auto animate-pulse" />
      </div>
    </div>
  );
};
