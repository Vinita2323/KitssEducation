import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Award } from "lucide-react";

/**
 * ResultSummary
 * Renders the overall performance summary metrics:
 * Total Marks, Obtained Marks, Percentage, Grade, and Status (PASS / FAIL).
 */
export const ResultSummary = ({ result }) => {
  if (!result) return null;

  const isPass = result.status?.toUpperCase().includes("PASS") || result.status?.toUpperCase().includes("PROMOTED");
  const isCompartment = result.status?.toUpperCase().includes("COMPARTMENT");
  const isFail = result.status?.toUpperCase().includes("FAIL") || isCompartment;

  const maxTotal = result.maxTotalMarks || 500;
  const obtainedTotal = result.obtainedMarks || result.totalMarks || 0;
  const percentage = result.percentage || (obtainedTotal && maxTotal ? ((obtainedTotal / maxTotal) * 100).toFixed(1) : 0);

  return (
    <div className="space-y-3">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Marks */}
        <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#667085] block">
            Total Marks
          </span>
          <div className="mt-1 font-mono text-sm sm:text-lg font-extrabold text-[#0A1D3F]">
            {maxTotal}
          </div>
        </div>

        {/* Marks Obtained */}
        <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#667085] block">
            Obtained Marks
          </span>
          <div className="mt-1 font-mono text-sm sm:text-lg font-extrabold text-[#0A1D3F]">
            {obtainedTotal}
          </div>
        </div>

        {/* Percentage / CGPA */}
        <div className="p-3.5 bg-orange-50/50 rounded-2xl border border-orange-200/60 text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FF8A00] block">
            {result.cgpa ? "Percentage / CGPA" : "Percentage"}
          </span>
          <div className="mt-1 font-extrabold text-sm sm:text-lg text-[#FF8A00]">
            {percentage}% {result.cgpa ? `(${result.cgpa})` : ""}
          </div>
        </div>

        {/* Overall Grade */}
        <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] text-center">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#667085] block">
            Overall Grade
          </span>
          <div className="mt-1 font-extrabold text-sm sm:text-lg text-[#0A1D3F]">
            {result.grade || "A"}
          </div>
        </div>
      </div>

      {/* Result Status Banner */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
          isPass
            ? "bg-emerald-50/70 border-emerald-200/70 text-emerald-950"
            : "bg-red-50/80 border-red-200 text-red-950"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPass ? "bg-[#17B26A] text-white" : "bg-red-600 text-white"
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            ) : isCompartment ? (
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <XCircle className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Final Result Status:
              </span>
              <span
                className={`text-sm sm:text-base font-extrabold uppercase ${
                  isPass ? "text-[#17B26A]" : "text-red-600"
                }`}
              >
                {result.status}
              </span>
            </div>
            {result.statusDetail && (
              <p className="text-xs font-semibold text-[#475467] mt-0.5">
                {result.statusDetail}
              </p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-current text-[11px] font-bold">
          <Award className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span>Session {result.year || "2026"}</span>
        </div>
      </div>
    </div>
  );
};
