import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Check, ShieldCheck, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const RegisterSuccessPage = () => {
  const navigate = useNavigate();
  const { user, lastRegisteredCredentials } = useAuth();
  const { showSuccess } = useToast();

  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const credentials = lastRegisteredCredentials || {
    userId: user?.id || "KITSS20268492",
    password: "Kits@4892",
    name: user?.name || "Student",
    email: user?.email || "student@example.com"
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
    showSuccess(`Copied ${type === "userId" ? "User ID" : "Password"} to clipboard!`);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E8EC] shadow-md text-center">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-[#ECFDF3] border border-[#17B26A]/30 flex items-center justify-center text-[#17B26A] mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
        Registration Successful!
      </h2>
      <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-xs mx-auto">
        Your student account has been created. Please save your auto-generated credentials below.
      </p>

      {/* Credentials Card */}
      <div className="my-6 p-4 bg-[#0A1D3F] rounded-2xl text-left text-white relative overflow-hidden space-y-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#FF8A00] font-bold uppercase tracking-wider">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Your Student Login Credentials</span>
        </div>

        {/* User ID */}
        <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-200 block uppercase font-medium">
              Student User ID
            </span>
            <span className="text-sm font-mono font-bold text-white tracking-wider">
              {credentials.userId}
            </span>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(credentials.userId, "userId")}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
            title="Copy User ID"
          >
            {copiedUserId ? <Check className="w-4 h-4 text-[#17B26A]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Password */}
        <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-blue-200 block uppercase font-medium">
              Temporary Password
            </span>
            <span className="text-sm font-mono font-bold text-[#FF8A00] tracking-wider">
              {credentials.password}
            </span>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(credentials.password, "password")}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition active:scale-95"
            title="Copy Password"
          >
            {copiedPassword ? <Check className="w-4 h-4 text-[#17B26A]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[10px] text-blue-200/80 leading-relaxed pt-1">
          💡 A confirmation SMS and Email have been simulated to your registered contact.
        </p>
      </div>

      {/* CTA */}
      <div className="space-y-2.5">
        <PrimaryButton
          variant="orange"
          size="lg"
          fullWidth
          onClick={() => navigate("/home")}
          icon={ArrowRight}
        >
          Proceed to Dashboard
        </PrimaryButton>

        <Link
          to="/login"
          className="inline-block text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition pt-1"
        >
          Or Go to Login Page
        </Link>
      </div>
    </div>
  );
};
