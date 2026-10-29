import { authService } from '../../services/authService';
import { EmailChangeForm } from '../../components/auth/EmailChangeForm';
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Smartphone, Laptop, ShieldCheck, Moon, Sun, Info, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { deviceInfo, handleTransferDeviceSession, deviceConflict } = useAuth();

  const [examAlerts, setExamAlerts] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const [preferencesReady,setPreferencesReady]=useState(false),[saving,setSaving]=useState(false);
  useEffect(()=>{const c=new AbortController();authService.getPreferences(c.signal).then(p=>{if(!c.signal.aborted){setExamAlerts(p.notification.examAlerts);setCourseUpdates(p.notification.courseUpdates);setPromoAlerts(p.notification.promoAlerts);setPreferencesReady(true);}}).catch(e=>{if(!c.signal.aborted)showError(e.message);});return()=>c.abort();},[]);
  const savePreferences=async()=>{setSaving(true);try{await authService.savePreferences({notification:{examAlerts,courseUpdates,promoAlerts}});showSuccess('Preferences saved');}catch(e){showError(e.message);}finally{setSaving(false);}};
  const handleClearCache = () => {
    try { localStorage.removeItem('kits_course_selector_prefs'); showSuccess('Saved course filter preferences cleared on this browser. Your account records are kept.'); } catch(e) { showError('Browser storage is unavailable'); }
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
              disabled={!preferencesReady || saving} checked={examAlerts}
              onChange={(e) => setExamAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-[#0A1D3F]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl cursor-pointer">
            <div>
              <span className="font-bold text-[#0A1D3F] block">Course & Lecture Updates</span>
              <span className="text-[11px] text-[#667085]">When course and lesson notices are published</span>
            </div>
            <input
              type="checkbox"
              disabled={!preferencesReady || saving} checked={courseUpdates}
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
              disabled={!preferencesReady || saving} checked={promoAlerts}
              onChange={(e) => setPromoAlerts(e.target.checked)}
              className="w-5 h-5 rounded text-[#0A1D3F]"
            />
          </label>
        </div>
      </div>

      <button disabled={!preferencesReady || saving} onClick={savePreferences} className="bg-[#0A1D3F] text-white rounded-xl p-3 disabled:opacity-40">{saving?'Saving...':'Save preferences'}</button>
      <EmailChangeForm />
      {/* Single Device Security */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#17B26A]" />
            <span>Single Device Security</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            Enforced (1 Device)
          </span>
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {deviceInfo?.type === "Mobile" ? (
              <Smartphone className="w-5 h-5 text-[#17B26A] shrink-0" />
            ) : (
              <Laptop className="w-5 h-5 text-[#17B26A] shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-xs font-bold text-[#0A1D3F]">
                  {deviceInfo?.label || "Primary Active Device"}
                </h4>
                <span className="text-[10px] font-semibold text-[#17B26A] bg-white px-2 py-0.2 rounded-full border border-emerald-200">
                  Current Session
                </span>
              </div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Verified sign-in • Authorized Single Session
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!deviceConflict}
            title="Transfer requires a fresh login challenge and explicit confirmation"
            onClick={() => {
              handleTransferDeviceSession();
            }}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 text-[11px] font-bold text-[#0A1D3F] shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Deauthorize Others
          </button>
        </div>
      </div>

      {/* Storage & Clear Cache */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
          <Trash2 className="w-4 h-4 text-[#D92D20]" />
          <span>Browser Preferences</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-2xl">
          <div>
            <h4 className="text-xs font-bold text-[#0A1D3F]">Saved Course Filters</h4>
            <p className="text-[11px] text-[#667085]">Clear this browser's saved filters. Your account records and reading progress are kept.</p>
          </div>

          <button
            type="button"
            onClick={handleClearCache}
            className="px-3.5 py-1.5 bg-white border border-[#E6E8EC] hover:bg-gray-50 text-xs font-bold text-[#0A1D3F] rounded-xl transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* About Application */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs text-xs space-y-2 text-[#667085]">
        <div className="flex items-center gap-2 font-bold text-[#0A1D3F] text-xs uppercase tracking-wider">
          <Info className="w-4 h-4 text-[#133C8B]" />
          <span>About KITSS Education</span>
        </div>
        <p>Application: <strong>KITSS Education web</strong></p>
        <p>© {new Date().getFullYear()} KITSS Education. All Rights Reserved.</p>
      </div>
    </div>
  );
};
