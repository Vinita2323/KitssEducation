import React from "react";
import { Download, Printer, CheckCircle2, Award, QrCode, ShieldCheck, ArrowLeft } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";
import { useToast } from "../../context/ToastContext";

export const ResultCard = ({ item, onView }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E6E8EC] p-3 sm:p-3.5 shadow-2xs hover:border-gray-300 transition-all flex items-center justify-between gap-2.5">
      <div className="space-y-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0A1D3F] text-white">
            {item.board}
          </span>
          <span className="text-[11px] text-[#667085] font-semibold">{item.year}</span>
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">{item.exam}</h4>
        <p className="text-[11px] text-[#667085] truncate">
          Roll No: <span className="font-mono font-bold text-[#0A1D3F]">{item.rollNumber}</span> • Status:{" "}
          <span className="text-[#17B26A] font-bold">{item.status}</span>
        </p>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          onClick={onView}
          className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-xs"
        >
          View Marksheet
        </button>
      </div>
    </div>
  );
};

export const ResultMarksheet = ({ result, onBack }) => {
  const { showSuccess } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    showSuccess("Downloading Official Digital Marksheet (PDF)...");
  };

  if (!result) return null;

  return (
    <div className="space-y-3 w-full box-border">
      {/* Top Actions Bar (Hidden on print) */}
      <div className="no-print flex items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-xl border border-[#E6E8EC] shadow-2xs">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Search Again</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <SecondaryButton
            size="sm"
            onClick={handlePrint}
            icon={Printer}
          >
            Print
          </SecondaryButton>
          <PrimaryButton
            variant="orange"
            size="sm"
            onClick={handleDownload}
            icon={Download}
          >
            Download PDF
          </PrimaryButton>
        </div>
      </div>

      {/* Official Marksheet Document Container */}
      <div className="bg-white rounded-2xl border border-[#0A1D3F]/20 p-3.5 sm:p-6 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:p-0 w-full box-border">
        {/* Subtle Watermark in Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <img
            src="/KitssLogo.png"
            alt="KITSS Watermark"
            className="w-72 h-auto"
          />
        </div>

        {/* Marksheet Header */}
        <div className="text-center border-b-2 border-[#0A1D3F] pb-3 mb-3.5">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <img
              src="/KitssLogo.png"
              alt="Board Emblem"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-xs sm:text-base font-extrabold text-[#0A1D3F] tracking-wide uppercase">
            {result.board} DIGITAL EXAMINATION RESULTS
          </h2>
          <p className="text-[11px] sm:text-xs font-semibold text-[#667085] mt-0.5 uppercase">
            {result.exam}
          </p>
          <p className="text-[10px] sm:text-[11px] font-bold text-[#FF8A00] mt-0.5">
            OFFICIAL DIGITAL MARKS STATEMENT • SESSION {result.year}
          </p>
        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#F7F8FA] p-3 rounded-xl border border-[#E6E8EC] mb-3.5">
          <div>
            <span className="text-[#667085] block text-[10px]">Roll Number:</span>
            <span className="font-mono font-bold text-[#0A1D3F] text-xs sm:text-sm">
              {result.rollNumber}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px]">Candidate's Name:</span>
            <span className="font-bold text-[#0A1D3F] text-xs sm:text-sm uppercase truncate block">
              {result.studentName}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px]">Mother's Name:</span>
            <span className="font-semibold text-[#0A1D3F] uppercase text-xs truncate block">
              {result.motherName}
            </span>
          </div>
          <div>
            <span className="text-[#667085] block text-[10px]">Father's Name:</span>
            <span className="font-semibold text-[#0A1D3F] uppercase text-xs truncate block">
              {result.fatherName}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[#667085] block text-[10px]">School Name:</span>
            <span className="font-semibold text-[#0A1D3F] uppercase text-xs">
              {result.schoolName} ({result.schoolCode})
            </span>
          </div>
        </div>

        {/* Subjects & Marks Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E6E8EC] mb-3.5 w-full">
          <table className="w-full text-xs text-left border-collapse min-w-[340px]">
            <thead>
              <tr className="bg-[#0A1D3F] text-white">
                <th className="p-2 font-bold uppercase tracking-wider text-[10px]">Code</th>
                <th className="p-2 font-bold uppercase tracking-wider text-[10px]">Subject</th>
                <th className="p-2 font-bold uppercase tracking-wider text-[10px] text-center">Theory</th>
                <th className="p-2 font-bold uppercase tracking-wider text-[10px] text-center">Prac</th>
                <th className="p-2 font-bold uppercase tracking-wider text-[10px] text-center">Total</th>
                <th className="p-2 font-bold uppercase tracking-wider text-[10px] text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EC]">
              {result.subjects.map((sub) => (
                <tr key={sub.code} className="hover:bg-gray-50 transition">
                  <td className="p-2 font-mono font-semibold text-[#667085] text-[11px]">{sub.code}</td>
                  <td className="p-2 font-bold text-[#0A1D3F] text-[11px]">{sub.name}</td>
                  <td className="p-2 text-center font-mono text-[11px]">{sub.theory}/{sub.maxTheory}</td>
                  <td className="p-2 text-center font-mono text-[11px]">{sub.practical}/{sub.maxPractical}</td>
                  <td className="p-2 text-center font-mono font-bold text-[#0A1D3F] text-[11px]">{sub.total}/100</td>
                  <td className="p-2 text-center">
                    <span className="inline-block px-1.5 py-0.2 rounded font-bold text-[10px] bg-blue-50 text-blue-800">
                      {sub.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Result Summary & Certification Footer */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-blue-50/60 to-emerald-50/60 rounded-xl border border-blue-200/60 mb-3.5 text-center">
          <div>
            <span className="text-[10px] text-[#667085] uppercase font-bold block">
              Total Score
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#0A1D3F]">
              {result.totalMarks} / {result.maxTotalMarks}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#667085] uppercase font-bold block">
              Percentage
            </span>
            <span className="text-sm sm:text-base font-extrabold text-[#FF8A00]">
              {result.percentage}%
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#667085] uppercase font-bold block">
              Status
            </span>
            <span className="inline-flex items-center justify-center gap-1 text-xs sm:text-sm font-extrabold text-[#17B26A] uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {result.status}
            </span>
          </div>
        </div>

        {/* Verification & Digital Signature */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#E6E8EC] text-xs text-[#667085]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#17B26A] shrink-0" />
            <div>
              <p className="font-bold text-[#0A1D3F] text-[11px]">{result.verificationStatus}</p>
              <p className="text-[10px]">Issued on: {result.issueDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] bg-[#F7F8FA] p-1.5 rounded-lg border border-[#E6E8EC]">
            <QrCode className="w-5 h-5 text-[#0A1D3F]" />
            <span>ID: {result.admitCardId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
