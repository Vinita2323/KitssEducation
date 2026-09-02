import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Phone, Mail, Calendar, GraduationCap, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    board: "CBSE",
    class: "Class 10"
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
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

    try {
      setLoading(true);
      const res = await register(formData);
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
    <div className="bg-white p-5 sm:p-7 rounded-3xl border border-[#E6E8EC] shadow-lg max-w-sm sm:max-w-md mx-auto">
      {/* Logo & Title */}
      <div className="text-center mb-5">
        <img
          src="/KitssLogo.png"
          alt="KITSS EDUCATION Logo"
          className="h-14 sm:h-16 w-auto object-contain mx-auto mb-2"
        />
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          Create Account
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Let's get you started with KITSS Education
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
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
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
            />
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

        {/* Submit */}
        <div className="pt-3">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={loading}
          >
            Register
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
  );
};
