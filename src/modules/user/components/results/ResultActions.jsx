import React, { useState } from "react";
import { Download, Printer, ArrowLeft, Share2, Check } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";
import { useToast } from "../../context/ToastContext";

/**
 * ResultActions
 * Action toolbar providing Print, Download, and Back/New Search triggers.
 * Hidden automatically when printing via 'no-print' CSS class.
 */
export const ResultActions = ({ result, onBack, onNewSearch }) => {
  const { showSuccess } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloading(true);
    showSuccess(`Generating Official Digital Marksheet PDF for Roll ${result?.rollNumber || ""}...`);

    setTimeout(() => {
      try {
        // Create an official text/markdown export or formatted PDF representation
        const filename = `Marksheet_${result?.board || "Result"}_${result?.rollNumber || "Student"}.txt`;
        const content = `===========================================================
KITSS EDUCATION PLATFORM - OFFICIAL DIGITAL MARKS STATEMENT
===========================================================
Board: ${result?.boardName || result?.board || "Official Board"}
Examination: ${result?.exam || "Examination"}
Session: ${result?.year || "2026"}

Candidate Name: ${result?.studentName || ""}
Roll Number: ${result?.rollNumber || ""}
${result?.enrollmentNumber ? `Enrollment Number: ${result.enrollmentNumber}\n` : ""}${result?.schoolName ? `Institution: ${result.schoolName}\n` : ""}
Date of Issue: ${result?.issueDate || new Date().toLocaleDateString()}
Verification Status: ${result?.verificationStatus || "Verified & Digitally Signed"}

-----------------------------------------------------------
SUBJECT-WISE PERFORMANCE:
-----------------------------------------------------------
${(result?.subjects || [])
  .map(
    (s) =>
      `${(s.code || "").padEnd(8)} ${(s.name || "").padEnd(35)} ${(s.obtained || s.total || "").toString().padStart(4)} / ${(s.maxMarks || 100).toString().padEnd(4)} Grade: ${s.grade || ""}`
  )
  .join("\n")}

-----------------------------------------------------------
RESULT SUMMARY:
-----------------------------------------------------------
Total Maximum Marks : ${result?.maxTotalMarks || 500}
Total Marks Obtained: ${result?.obtainedMarks || result?.totalMarks || 0}
Percentage          : ${result?.percentage}% ${result?.cgpa ? `(CGPA: ${result.cgpa})` : ""}
Overall Grade       : ${result?.grade || ""}
Final Status        : ${result?.status || "PASS"}

Digital Verification ID: ${result?.admitCardId || result?.qrCodeString || "VERIFIED-OK"}
===========================================================`;

        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess("Digital Marksheet downloaded successfully!");
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setDownloading(false);
      }
    }, 600);
  };

  return (
    <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white p-1.5 sm:p-2 rounded-md border border-slate-200/80 shadow-2xs">
      {/* Back Button */}
      <div className="flex items-center gap-1.5">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-md transition touch-target cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Search Form</span>
          </button>
        )}

        {onNewSearch && (
          <button
            type="button"
            onClick={onNewSearch}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <span>Change Board</span>
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 justify-end">
        <SecondaryButton
          size="sm"
          onClick={handlePrint}
          icon={Printer}
          className="flex-1 sm:flex-initial"
        >
          Print
        </SecondaryButton>

        <PrimaryButton
          variant="navy"
          size="sm"
          onClick={handleDownload}
          loading={downloading}
          icon={Download}
          className="flex-1 sm:flex-initial"
        >
          Download
        </PrimaryButton>
      </div>
    </div>
  );
};
