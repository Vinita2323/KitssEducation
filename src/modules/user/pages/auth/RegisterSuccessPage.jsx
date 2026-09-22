import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const RegisterSuccessPage = () => {
  const navigate = useNavigate();
  const { user, lastRegisteredCredentials } = useAuth();
  const { showSuccess } = useToast();

  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const credentials = lastRegisteredCredentials || {
    userId: user?.id || "KITSS20268492",
    password: "Kits@4892",
    name: user?.name || "Student",
    email: user?.email || "student@example.com",
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
      showSuccess("User ID copied");
    } else if (type === "password") {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      showSuccess("Password copied");
    } else if (type === "all") {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      showSuccess("Credentials copied");
    }
  };

  const copyAll = () => {
    const text = `User ID: ${credentials.userId}\nPassword: ${credentials.password}`;
    copyToClipboard(text, "all");
  };

  const handleGoToLogin = () => {
    navigate("/login", {
      state: {
        userId: credentials.userId,
        password: credentials.password,
        fromRegistration: true,
      },
    });
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E8EC] shadow-sm text-center max-w-sm w-full mx-auto space-y-3.5">
      {/* Success Badge */}
      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
        <Check className="w-5 h-5 stroke-[2.5]" />
      </div>

      {/* Header */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] leading-tight">
          Registration Successful
        </h2>
        <p className="text-xs text-[#667085] mt-0.5">
          Welcome, <span className="font-semibold text-[#0A1D3F]">{credentials.name}</span>! Save your login details below.
        </p>
      </div>

      {/* Simple Clean Credentials Card */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-left space-y-2">
        {/* User ID Row */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider block">
              Student User ID
            </span>
            <span className="text-xs font-mono font-bold text-[#0A1D3F]">
              {credentials.userId}
            </span>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(credentials.userId, "userId")}
            className="p-1 rounded-md hover:bg-white text-gray-400 hover:text-[#0A1D3F] border border-transparent hover:border-gray-200 transition cursor-pointer"
            title="Copy User ID"
          >
            {copiedUserId ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="border-t border-[#EDF2F7]" />

        {/* Password Row */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#667085] tracking-wider block">
              Password
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono font-bold text-[#0A1D3F]">
                {showPassword ? credentials.password : "••••••••"}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(credentials.password, "password")}
            className="p-1 rounded-md hover:bg-white text-gray-400 hover:text-[#0A1D3F] border border-transparent hover:border-gray-200 transition cursor-pointer"
            title="Copy Password"
          >
            {copiedPassword ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Copy Link */}
      <button
        type="button"
        onClick={copyAll}
        className="text-[11px] font-medium text-[#667085] hover:text-[#0A1D3F] inline-flex items-center gap-1 transition cursor-pointer"
      >
        {copiedAll ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
        <span>{copiedAll ? "Copied to clipboard" : "Copy both User ID & Password"}</span>
      </button>

      {/* Clean Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleGoToLogin}
          className="w-full py-2.5 px-4 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Login to Account</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => navigate("/home")}
          className="w-full py-2 px-4 rounded-lg bg-white hover:bg-gray-50 border border-[#E2E8F0] text-[#0A1D3F] text-xs font-medium transition cursor-pointer"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
