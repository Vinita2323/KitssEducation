import React, { useState } from "react";
import { Download, Printer, ArrowLeft } from "lucide-react";
import { toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";

/** A4 width at ~96dpi — forces desktop document layout for PDF capture */
const EXPORT_WIDTH_PX = 794;

/**
 * ResultActions
 * Print → browser print dialog
 * Download → A4-style PDF of the full marksheet (not the mobile scroll view)
 */
export const ResultActions = ({ result, onBack, onNewSearch }) => {
  const [downloading, setDownloading] = useState(false);

  const getFileBaseName = () => {
    const safeBoard = String(result?.board || result?.boardName || "Result")
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 24);
    const safeRoll = String(result?.rollNumber || "Student").replace(/[^\w\-]+/g, "_");
    return `Marksheet_${safeBoard}_${safeRoll}`;
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handlePrint = () => {
    document.body.classList.add("printing-marksheet");
    const cleanup = () => {
      document.body.classList.remove("printing-marksheet");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  /**
   * Build an off-screen A4-width clone so capture is a proper document,
   * not the phone scroll/swipe UI.
   */
  const buildExportClone = (sourceEl) => {
    // Keep clone in viewport (hidden) so the browser fully lays out all table rows.
    // Off-screen (-10000px) clones often get clipped height → missing subjects in PDF.
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      `width:${EXPORT_WIDTH_PX}px`,
      "background:#ffffff",
      "z-index:2147483646",
      "pointer-events:none",
      "opacity:0",
      "overflow:visible",
      "height:auto"
    ].join(";");

    const clone = sourceEl.cloneNode(true);
    clone.id = "export-marksheet-clone";
    clone.classList.add("exporting-marksheet", "printable-marksheet");
    clone.style.height = "auto";
    clone.style.maxHeight = "none";
    clone.style.overflow = "visible";
    clone.querySelectorAll(".marks-swipe-hint, .no-print").forEach((n) => n.remove());

    clone.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (src && src.startsWith("/")) {
        img.setAttribute("src", `${window.location.origin}${src}`);
      }
    });

    host.appendChild(clone);
    document.body.appendChild(host);
    return { host, clone };
  };

  const handleDownload = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const sourceEl = document.getElementById("printable-marksheet");
    if (!sourceEl) {
      console.error("printable-marksheet element not found");
      return;
    }

    setDownloading(true);
    const fileBase = getFileBaseName();
    let host = null;

    try {
      await new Promise((r) => setTimeout(r, 60));

      const built = buildExportClone(sourceEl);
      host = built.host;
      const { clone } = built;

      // Wait for images in clone to load
      const imgs = Array.from(clone.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 1500);
            })
        )
      );

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Force full document height so every subject row is included
      const exportWidth = EXPORT_WIDTH_PX;
      const exportHeight = Math.max(
        clone.scrollHeight,
        clone.offsetHeight,
        clone.getBoundingClientRect().height
      );

      const dataUrl = await toJpeg(clone, {
        quality: 0.96,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: exportWidth,
        height: exportHeight,
        style: {
          width: `${exportWidth}px`,
          maxWidth: `${exportWidth}px`,
          height: `${exportHeight}px`,
          maxHeight: "none",
          overflow: "visible",
          transform: "none",
          margin: "0"
        },
        filter: (node) => node?.tagName !== "SCRIPT"
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = usableWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // Slice full marksheet across pages so no subject is cut off
      let remaining = imgHeight;
      let yOffset = margin;

      pdf.addImage(dataUrl, "JPEG", margin, yOffset, imgWidth, imgHeight);
      remaining -= usableHeight;

      while (remaining > 2) {
        yOffset = margin - (imgHeight - remaining);
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", margin, yOffset, imgWidth, imgHeight);
        remaining -= usableHeight;
      }

      downloadBlob(pdf.output("blob"), `${fileBase}.pdf`);
    } catch (err) {
      console.error("Marksheet download failed:", err);
      alert("Could not download marksheet. Please try again.");
    } finally {
      if (host?.parentNode) host.parentNode.removeChild(host);
      setDownloading(false);
    }
  };

  return (
    <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white p-1.5 sm:p-2 rounded-md border border-slate-200/80 shadow-2xs">
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

      <div className="flex items-center gap-1.5 justify-end">
        <SecondaryButton
          size="sm"
          type="button"
          onClick={handlePrint}
          icon={Printer}
          className="flex-1 sm:flex-initial"
        >
          Print
        </SecondaryButton>

        <PrimaryButton
          variant="navy"
          size="sm"
          type="button"
          onClick={handleDownload}
          loading={downloading}
          disabled={downloading}
          icon={Download}
          className="flex-1 sm:flex-initial"
        >
          {downloading ? "Downloading..." : "Download"}
        </PrimaryButton>
      </div>
    </div>
  );
};
