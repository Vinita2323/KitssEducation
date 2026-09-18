import React, { useEffect, useState } from "react";
import { ShieldAlert, Lock, AlertTriangle, ArrowRight } from "lucide-react";

export const ProtectedContentWarning = ({
  isActive = true,
  onDismiss,
  customTitle = "Protected Content",
  customMessage = "Screen capture or recording is not allowed for this lecture.",
}) => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // 1. Detect PrintScreen Key
    const handleKeyDown = (e) => {
      if (
        e.key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && e.key === "S") || // Windows Snipping shortcut
        (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4")) // Mac screenshot
      ) {
        setShowWarning(true);
      }
    };

    window.addEventListener("keyup", handleKeyDown);

    return () => {
      window.removeEventListener("keyup", handleKeyDown);
    };
  }, [isActive]);

  const handleReturn = () => {
    setShowWarning(false);
    if (onDismiss) onDismiss();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0A1D3F] border border-[#FF8A00]/40 rounded-2xl p-6 text-center text-white shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FF8A00]/20 border border-[#FF8A00]/40 mx-auto flex items-center justify-center text-[#FF8A00]">
          <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30">
            <Lock className="w-3 h-3" /> Digital Rights Protection
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
            {customTitle}
          </h2>
          <p className="text-sm text-white/80 leading-relaxed max-w-sm mx-auto">
            {customMessage}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/60 text-left space-y-1">
          <p className="font-semibold text-white/90">Platform Security Policy:</p>
          <p>• All video lectures & digital notes are licensed for single-student online viewing only.</p>
          <p>• Screen captures, screen mirroring, and recording attempts are logged for student account protection.</p>
        </div>

        <button
          type="button"
          onClick={handleReturn}
          className="w-full py-3 px-5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Return to Lecture</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
