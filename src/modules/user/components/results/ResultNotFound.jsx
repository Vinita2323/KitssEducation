import React from "react";
import { SearchX, RotateCcw, ArrowLeft, HelpCircle } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";

/**
 * ResultNotFound
 * Renders frontend empty/error states when credentials do not match or API yields no record.
 */
export const ResultNotFound = ({
  title = "No Result Found",
  message = "We couldn't find a result matching the information provided. Please check your details and try again.",
  searchedRoll = "",
  onTryAgain,
  onReset
}) => {
  return (
    <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-10 text-center max-w-lg mx-auto shadow-xs space-y-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#FF8A00] mx-auto shadow-inner">
        <SearchX className="w-8 h-8" />
      </div>

      {/* Text Info */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#667085] leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {searchedRoll && (
          <div className="inline-block px-3 py-1 bg-[#F7F8FA] rounded-lg border border-[#E6E8EC] text-xs font-mono text-[#0A1D3F] mt-1">
            Searched Roll: <strong>{searchedRoll}</strong>
          </div>
        )}
      </div>

      {/* Suggested Fixes */}
      <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] text-left text-xs space-y-1.5 text-[#667085]">
        <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F] text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span>Troubleshooting Tips:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
          <li>Ensure the Roll Number matches your official examination hall ticket.</li>
          <li>Check that the correct Board and Examination Year were selected.</li>
          <li>Try sample demo roll numbers: <strong className="font-mono text-[#0A1D3F]">1024501</strong> or <strong className="font-mono text-[#0A1D3F]">1024502</strong>.</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {onTryAgain && (
          <PrimaryButton
            variant="orange"
            size="md"
            onClick={onTryAgain}
            icon={RotateCcw}
            className="w-full sm:w-auto"
          >
            Try Again
          </PrimaryButton>
        )}

        {onReset && (
          <SecondaryButton
            size="md"
            onClick={onReset}
            icon={ArrowLeft}
            className="w-full sm:w-auto"
          >
            Start New Search
          </SecondaryButton>
        )}
      </div>
    </div>
  );
};
