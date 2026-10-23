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
    <div className="space-y-2">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Marks */}
        <div className="p-2 sm:p-2.5 bg-slate-50/70 rounded-md border border-slate-200 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Marks
          </span>
          <div className="mt-0.5 font-mono text-xs sm:text-sm font-semibold text-slate-800">
            {maxTotal}
          </div>
        </div>

        {/* Marks Obtained */}
        <div className="p-2 sm:p-2.5 bg-slate-50/70 rounded-md border border-slate-200 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
            Obtained Marks
          </span>
          <div className="mt-0.5 font-mono text-xs sm:text-sm font-semibold text-slate-800">
            {obtainedTotal}
          </div>
        </div>

        {/* Percentage / CGPA */}
        <div className="p-2 sm:p-2.5 bg-orange-50/40 rounded-md border border-orange-200/60 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#FF8A00] block">
            {result.cgpa ? "Percentage / CGPA" : "Percentage"}
          </span>
          <div className="mt-0.5 text-xs sm:text-sm font-semibold text-[#FF8A00]">
            {percentage}% {result.cgpa ? `(${result.cgpa})` : ""}
          </div>
        </div>

        {/* Overall Grade */}
        <div className="p-2 sm:p-2.5 bg-slate-50/70 rounded-md border border-slate-200 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
            Overall Grade
          </span>
          <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
            {result.grade || "A"}
          </div>
        </div>
      </div>

      {/* Result Status Banner */}
      <div
        className={`p-2.5 sm:p-3 rounded-md border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left ${
          isPass
            ? "bg-emerald-50/60 border-emerald-200/60 text-emerald-950"
            : "bg-red-50/60 border-red-200 text-red-950"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              isPass ? "bg-[#17B26A] text-white" : "bg-red-600 text-white"
            }`}
          >
            {isPass ? (
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            ) : isCompartment ? (
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            ) : (
              <XCircle className="w-4 h-4 stroke-[2]" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Final Result Status:
              </span>
              <span
                className={`text-xs sm:text-sm font-bold uppercase ${
                  isPass ? "text-[#17B26A]" : "text-red-600"
                }`}
              >
                {result.status}
              </span>
            </div>
            {result.statusDetail && (
              <p className="text-[11px] font-normal text-slate-600 mt-0.5">
                {result.statusDetail}
              </p>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-[10px] font-medium text-slate-700">
          <Award className="w-3 h-3 text-[#FF8A00]" />
          <span>Session {result.year || "2026"}</span>
        </div>
      </div>
    </div>
  );
};
