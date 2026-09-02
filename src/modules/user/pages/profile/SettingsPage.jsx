import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Smartphone, ShieldCheck, Moon, Sun, Info, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [examAlerts, setExamAlerts] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const handleClearCache = () => {
    showSuccess("Local offline cache cleared successfully.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white border border-[#E6E8EC] text-[#0A1D3F] hover:bg-gray-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[#667085]">
            Manage application settings, device sync, and notifications
          </p>
        </div>
      </div>

      {/* Notifications Preferences */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
          <Bell className="w-4 h-4 text-[#FF8A00]" />
          <span>Notification Alerts</span>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl cursor-pointer">
            <div>
              <span className="font-bold text-[#0A1D3F] block">Board Exam Alerts</span>
              <span className="text-[11px] text-[#667085]">Instant notifications when result or date sheets publish</span>
            </div>
            <input
              type="checkbox"
              checked={examAlerts}
              onChange={(e) => setExamAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-[#0A1D3F]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl cursor-pointer">
            <div>
              <span className="font-bold text-[#0A1D3F] block">Course & Lecture Updates</span>
              <span className="text-[11px] text-[#667085]">When new video lectures and test papers are added</span>
            </div>
            <input
              type="checkbox"
              checked={courseUpdates}
              onChange={(e) => setCourseUpdates(e.target.checked)}
              className="w-5 h-5 rounded text-[#0A1D3F]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl cursor-pointer">
            <div>
              <span className="font-bold text-[#0A1D3F] block">Scholarships & Offers</span>
              <span className="text-[11px] text-[#667085]">Discounts on new course passes and books</span>
            </div>
            <input
              type="checkbox"
              checked={promoAlerts}
              onChange={(e) => setPromoAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-[#0A1D3F]"
            />
          </label>
        </div>
      </div>

      {/* Single Device Security */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-[#17B26A]" />
          <span>Device Security</span>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-[#17B26A]" />
            <div>
              <h4 className="text-xs font-bold text-[#0A1D3F]">
                Primary Active Device
              </h4>
              <p className="text-[11px] text-[#667085]">
                Chrome Web / Windows 11 • Verified Single Device Token
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#17B26A] text-white">
            Secured
          </span>
        </div>
      </div>

      {/* Storage & Clear Cache */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
          <Trash2 className="w-4 h-4 text-[#D92D20]" />
          <span>Storage & Offline Cache</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl">
          <div>
            <h4 className="text-xs font-bold text-[#0A1D3F]">Local Book & Video Cache</h4>
            <p className="text-[11px] text-[#667085]">Free up storage on this device (approx. 24.8 MB)</p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-3.5 py-1.5 bg-white border border-[#E6E8EC] hover:bg-gray-50 text-xs font-bold text-[#0A1D3F] rounded-xl transition"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* About Application */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs text-xs space-y-2 text-[#667085]">
        <div className="flex items-center gap-2 font-bold text-[#0A1D3F] text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-[#133C8B]" />
          <span>About KITSS Education</span>
        </div>
        <p>Application Version: <strong>v2.4.0-web-prod</strong></p>
        <p>© {new Date().getFullYear()} KITSS Education Private Limited. All Rights Reserved.</p>
      </div>
    </div>
  );
};
