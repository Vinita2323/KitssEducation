import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Calendar,
  GraduationCap,
  Building2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { CollegeFranchiseForm } from "../../components/auth/CollegeFranchiseForm";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other / Outside India"
];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  // Screen state: null = Selection, 'user' = User Form, 'franchise' = Franchise Registration Form
  const [selectedType, setSelectedType] = useState(null);

  // User form data & state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    state: "",
    board: "CBSE",
    class: "Class 10"
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Mobile Number.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid Email Address.");
      return;
    }
    if (!formData.state) {
      setErrorMessage("Please select your State.");
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      showSuccess("Account created successfully!");
      navigate("/register-success");
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
      showError(err.message || "Registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full transition-all duration-300">
      <AnimatePresence mode="wait">
        {/* ========================================================
            STATE 1: REGISTRATION TYPE SELECTION SCREEN
           ======================================================== */}
        {selectedType === null && (
          <motion.div
            key="selection-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl mx-auto"
          >
            {/* Header Section */}
            <div className="text-center mb-4 sm:mb-5">
              <img
                src="/KitssLogo.png"
                alt="KITSS EDUCATION Logo"
                className="h-9 sm:h-10 w-auto object-contain mx-auto mb-1.5"
              />
              <h1 className="text-lg sm:text-xl font-bold text-[#0A1D3F] tracking-tight">
                How would you like to register?
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto">
                Choose an option to continue with the appropriate registration process.
              </p>
            </div>

            {/* Compact Role Selection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-3.5">
              {/* Option 1 — User Registration */}
              <div
                onClick={() => setSelectedType("user")}
                className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0A1D3F] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center shrink-0 group-hover:bg-[#0A1D3F] group-hover:text-white transition-colors duration-200">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F] leading-tight">
                      User Registration
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed mb-3">
                    Create student account to explore colleges, video courses and digital learning materials.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl bg-[#0A1D3F] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs group-hover:bg-[#133C8B] transition-colors cursor-pointer"
                >
                  <span>Continue as User</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Option 2 — Franchise Registration */}
              <div
                onClick={() => setSelectedType("franchise")}
                className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#FF8A00] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-left active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center shrink-0 group-hover:bg-[#FF8A00] group-hover:text-white transition-colors duration-200">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors leading-tight">
                      Franchise Registration
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#64748B] leading-relaxed mb-3">
                    Apply for an institutional franchise under an approved University & College partner.
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl bg-[#FF8A00] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs group-hover:bg-[#E67C00] transition-colors cursor-pointer"
                >
                  <span>Apply for Franchise</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Bottom Footer / Login Link */}
            <div className="text-center text-xs text-[#64748B]">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-[#FF8A00] hover:underline">
                Login here
              </Link>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            STATE 2: USER REGISTRATION FORM
           ======================================================== */}
        {selectedType === "user" && (
          <motion.div
            key="user-form"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm sm:max-w-md mx-auto"
          >
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-[#E6E8EC] shadow-sm">
              {/* Back to Options Button */}
              <div className="border-b border-[#E6E8EC] pb-2.5 mb-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A1D3F] hover:text-[#FF8A00] transition group cursor-pointer"
                >
                  <div className="p-1 rounded-md bg-[#F7F8FA] group-hover:bg-[#FFF7ED] text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                  <span>Back to Options</span>
                </button>
              </div>

              {/* Logo & Title */}
              <div className="text-center mb-4">
                <img
                  src="/KitssLogo.png"
                  alt="KITSS EDUCATION Logo"
                  className="h-10 sm:h-11 w-auto object-contain mx-auto mb-1.5"
                />
                <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] tracking-tight">
                  Register as User
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Let's get you started with KITSS Education
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleUserSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                      required
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rohan@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition cursor-pointer"
                    />
                  </div>
                </div>

                {/* State Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                    State
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition cursor-pointer"
                      required
                    >
                      <option value="" disabled>
                        Select your State
                      </option>
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Board & Class Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      Board
                    </label>
                    <select
                      name="board"
                      value={formData.board}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20"
                    >
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="NCERT">NCERT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      Class
                    </label>
                    <select
                      name="class"
                      value={formData.class}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20"
                    >
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>
                </div>

                {/* Auto-Generated Credentials Notice */}
                <div className="p-3 bg-amber-50/80 border border-[#FF8A00]/30 rounded-xl flex items-start gap-2.5 text-left">
                  <div className="p-1 rounded-md bg-[#FF8A00]/10 text-[#FF8A00] shrink-0 mt-0.5">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-[#0A1D3F] leading-relaxed">
                    <span className="font-bold text-[#FF8A00]">Automatic Credentials:</span> A unique <strong>Student User ID</strong> and <strong>Login Password</strong> will be automatically generated upon registration for you to log in.
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <PrimaryButton
                    type="submit"
                    variant="navy"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="cursor-pointer"
                  >
                    Register & Generate Login Credentials
                  </PrimaryButton>
                </div>
              </form>

              {/* Login Link */}
              <div className="text-center pt-4 text-xs text-[#667085]">
                Already have an account?{" "}
                <Link to="/login" className="font-bold text-[#FF8A00] hover:underline">
                  Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            STATE 3: FRANCHISE APPLICATION FORM
           ======================================================== */}
        {selectedType === "franchise" && (
          <motion.div
            key="franchise-form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <CollegeFranchiseForm onBack={() => setSelectedType(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
