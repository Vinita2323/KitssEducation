import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const [userId, setUserId] = useState("KITSS20261084");
  const [password, setPassword] = useState("student123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!userId.trim()) {
      setErrorMessage("Please enter your Student User ID.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your Password.");
      return;
    }

    try {
      setLoading(true);
      await login(userId, password, rememberMe);
      showSuccess("Welcome back, Rohan!");
      navigate("/home");
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please try again.");
      showError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E6E8EC] shadow-lg max-w-sm sm:max-w-md mx-auto">
      {/* Logo & Header */}
      <div className="text-center mb-5">
        <img
          src="/KitssLogo.png"
          alt="KITSS EDUCATION Logo"
          className="h-16 sm:h-20 w-auto object-contain mx-auto mb-2"
        />
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Welcome Back!
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Login to continue learning
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* User ID Field */}
        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
            User ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. KITSS20261084"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-10 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition"
              aria-label="Toggle Password Visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-[#667085]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#0A1D3F] focus:ring-[#0A1D3F]"
            />
            <span>Remember Me</span>
          </label>

          <Link
            to="/forgot-password"
            className="font-semibold text-[#FF8A00] hover:text-[#E67C00] transition"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={loading}
          >
            Login
          </PrimaryButton>
        </div>
      </form>

      {/* Register Link */}
      <div className="text-center pt-4 text-xs text-[#667085]">
        Don't have an account?{" "}
        <Link to="/register" className="font-bold text-[#FF8A00] hover:underline">
          Register Now
        </Link>
      </div>
    </div>
  );
};
