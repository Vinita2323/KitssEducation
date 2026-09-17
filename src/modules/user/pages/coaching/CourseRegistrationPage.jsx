import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { useAuth } from "../../context/AuthContext";

export const CourseRegistrationPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "Male",
    state: "Madhya Pradesh",
    city: "Bhopal",
    board: "CBSE",
    class: "Class 10",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Full Name is required";
    if (!formData.phone.trim()) {
      errs.phone = "Mobile Number is required";
    } else if (!/^\+?[0-9\s-]{10,14}$/.test(formData.phone.trim())) {
      errs.phone = "Please enter a valid 10-digit mobile number";
    }
    if (!formData.email.trim()) {
      errs.email = "Email Address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!formData.dob) errs.dob = "Date of Birth is required";
    if (!formData.city.trim()) errs.city = "City is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await coachingService.registerStudent(formData);
      setIsSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-10 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] font-bold text-xs uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Student Coaching Registration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A1D3F] tracking-tight">
          Join KITSS Online Coaching
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto">
          Create your verified student profile to unlock high-definition video lectures and chapter notes.
        </p>
      </div>

      {isSuccess ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl border border-[#E6E8EC] p-8 sm:p-12 text-center card-shadow space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0A1D3F]">
              Registration Successful
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] max-w-md mx-auto leading-relaxed">
              Your student account has been created. You can now continue with your course selection.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#0A1D3F] space-y-1 text-left max-w-sm mx-auto">
            <p><strong>Student Name:</strong> {formData.name}</p>
            <p><strong>Board:</strong> {formData.board}</p>
            <p><strong>Class:</strong> {formData.class}</p>
            <p><strong>Contact:</strong> {formData.email}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/coaching/select")}
            className="w-full sm:w-auto min-w-[220px] py-3 px-6 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
          >
            <span>Continue to Course Selection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Registration Form */
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 card-shadow space-y-5"
        >
          {/* Row 1: Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input
                type="text"
                placeholder="e.g. Rohan Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
              />
            </div>
            {errors.name && <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>}
          </div>

          {/* Row 2: Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
                />
              </div>
              {errors.phone && <p className="text-[11px] text-red-500 font-medium">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-medium">{errors.email}</p>}
            </div>
          </div>

          {/* Row 3: Date of Birth & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Date of Birth *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
                />
              </div>
              {errors.dob && <p className="text-[11px] text-red-500 font-medium">{errors.dob}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Row 4: State & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
              >
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Delhi">Delhi</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Bihar">Bihar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                City *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
                <input
                  type="text"
                  placeholder="e.g. Bhopal, Indore, Delhi"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
                />
              </div>
              {errors.city && <p className="text-[11px] text-red-500 font-medium">{errors.city}</p>}
            </div>
          </div>

          {/* Row 5: Board & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Education Board
              </label>
              <select
                value={formData.board}
                onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
              >
                <option value="CBSE">CBSE (Central Board)</option>
                <option value="Madhya Pradesh Board">Madhya Pradesh Board (MPBSE)</option>
                <option value="Uttar Pradesh Board">UP Board</option>
                <option value="ICSE">ICSE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                Class / Grade
              </label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
              >
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-[#E6E8EC]">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>{submitting ? "Creating Student Account..." : "Create Account & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
