import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const LoginPage = ({ staff = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const stateUserId = location.state?.userId;


  const [userId, setUserId] = useState(() => stateUserId || '');
  const [password, setPassword] = useState(() => '');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (stateUserId) setUserId(stateUserId);

  }, [stateUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!userId.trim()) {
      setErrorMessage(staff ? "Please enter your staff email." : "Please enter your Student User ID.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your Password.");
      return;
    }

    try {
      setLoading(true);
      const res = await login(userId, password, rememberMe, staff ? 'admin' : 'student');
      if (res.success) {
        showSuccess(`Welcome back, ${res.user?.name || (staff ? "Staff" : "Student")}!`);
        const target = location.state?.returnTo;
        const safeTarget = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\');
        const adminTarget = safeTarget && (target === '/admin' || target.startsWith('/admin/')) && target !== '/admin/login';
        navigate(staff ? (adminTarget ? target : '/admin') : (safeTarget && !adminTarget && target !== '/admin/login' ? target : '/home'));
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid credentials. Please check your User ID and Password.");
      showError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E8EC] shadow-sm max-w-sm w-full mx-auto">
      {/* Logo & Header */}
      <div className="text-center mb-4">
        <img
          src="/KitssLogo.png"
          alt="KITSS EDUCATION Logo"
          className="h-10 sm:h-11 w-auto object-contain mx-auto mb-1.5"
        />
        <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] leading-tight">
          {staff ? 'Admin sign in' : 'Welcome Back'}
        </h2>
        <p className="text-xs text-[#667085] mt-0.5">
          {staff ? 'Sign in to your KITSS staff account' : 'Sign in to your student account'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User ID Field */}
        <div>
          <label className="block text-xs font-medium text-[#0A1D3F] mb-1">
            {staff ? 'Staff email' : 'Email or Student ID'}
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={staff ? 'Enter your staff email' : 'e.g. KITSS20261084'}
              aria-label={staff ? 'Staff email' : 'Email or Student ID'}
              autoComplete="username"
              className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:border-[#0A1D3F] transition"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor={staff ? 'admin-login-password' : 'student-login-password'} className="block text-xs font-medium text-[#0A1D3F] mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id={staff ? 'admin-login-password' : 'student-login-password'}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full pl-9 pr-9 py-2 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:border-[#0A1D3F] transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition cursor-pointer p-0.5"
              aria-label="Toggle Password Visibility"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#667085]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[#0A1D3F] focus:ring-[#0A1D3F]"
            />
            <span className="text-[11px]">Remember Me</span>
          </label>

          <Link
            to="/forgot-password"
            state={{ staff }}
            className="text-[11px] font-medium text-[#FF8A00] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold shadow-xs transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      <Link to="/account/verify" state={{ staff }} className="block text-center text-xs text-[#FF8A00] mt-3">Verify email / resend code</Link>
      {/* Register Link */}
      {!staff && <div className="text-center pt-3 mt-3 border-t border-[#F0F2F5] text-xs text-[#667085]">
        Don't have an account?{" "}
        <Link to="/account/create" className="font-semibold text-[#FF8A00] hover:underline">
          Register
        </Link>
      </div>}
    </div>
  );
};
