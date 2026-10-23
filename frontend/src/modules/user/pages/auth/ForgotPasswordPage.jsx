import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, ArrowRight, KeyRound } from "lucide-react";
import { authService } from "../../services/authService";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      showError("Please enter your User ID or Email.");
      return;
    }

    try {
      setLoading(true);
      await authService.forgotPassword(identifier);
      showSuccess("Verification code sent! Enter OTP to reset password.");
      navigate("/reset-password", { state: { identifier } });
    } catch (err) {
      showError(err.message || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E8EC] shadow-md">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#FF8A00] mb-4">
        <KeyRound className="w-6 h-6" />
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Forgot Password?
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Enter your registered User ID or Email address to receive an OTP.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1.5">
            User ID or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. KITSS20261084 or student@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
              required
            />
          </div>
        </div>

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={loading}
          >
            Send Reset OTP
          </PrimaryButton>
        </div>
      </form>

      <div className="text-center pt-5 text-xs text-[#667085]">
        Remember your password?{" "}
        <Link to="/login" className="font-bold text-[#FF8A00] hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [otp, setOtp] = useState("123456");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      showError("Please enter the 6-digit OTP.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(otp, newPassword);
      showSuccess("Password reset successfully! Please login with your new password.");
      navigate("/login");
    } catch (err) {
      showError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6E8EC] shadow-md">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-1">
          Enter the 6-digit OTP and choose your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1.5">
            Verification OTP
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-center font-mono font-bold tracking-widest text-base text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1.5">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full px-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
            required
          />
        </div>

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={loading}
          >
            Update Password
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};
