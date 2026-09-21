import React, { useState } from "react";
import {
  Building2,
  User,
  Mail,
  Phone,
  PhoneCall,
  MapPin,
  Globe,
  Upload,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  X,
  Sparkles,
  Info
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../common/PrimaryButton";

const COLLEGE_TYPES = [
  "University",
  "Deemed to be University",
  "Autonomous College",
  "Engineering & Technology Institute",
  "Management & Business School",
  "Medical / Paramedical / Nursing College",
  "Arts, Science & Commerce College",
  "Polytechnic / Vocational Training Institute",
  "Other Educational Institution"
];

const STUDENT_STRENGTH_OPTIONS = [
  "Less than 500 Students",
  "500 – 1,500 Students",
  "1,500 – 5,000 Students",
  "5,000+ Students"
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other / Outside India"
];

export const CollegeFranchiseForm = ({ onBack }) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    collegeName: "",
    collegeType: "Engineering & Technology Institute",
    address: "",
    city: "",
    state: "Delhi",
    pincode: "",
    website: "",
    studentCount: "500 – 1,500 Students",
    coursesOffered: "",
    proposedLocation: "",
    reason: "",
    agreedToTerms: false
  });

  const [documents, setDocuments] = useState({
    collegeApprovalDoc: null,
    authorizedIdProof: null,
    collegeLogo: null
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;
    setDocuments((prev) => ({
      ...prev,
      [field]: {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type
      }
    }));
  };

  const handleRemoveDocument = (field) => {
    setDocuments((prev) => ({
      ...prev,
      [field]: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validations
    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid official Email Address.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit Mobile Number.");
      return;
    }
    if (!formData.collegeName.trim()) {
      setErrorMessage("Please enter the College / Institution Name.");
      return;
    }
    if (!formData.address.trim()) {
      setErrorMessage("Please enter the College Address.");
      return;
    }
    if (!formData.city.trim()) {
      setErrorMessage("Please enter the City.");
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.length < 6) {
      setErrorMessage("Please enter a valid 6-digit Pincode.");
      return;
    }
    if (!formData.coursesOffered.trim()) {
      setErrorMessage("Please specify the major courses offered.");
      return;
    }
    if (!formData.proposedLocation.trim()) {
      setErrorMessage("Please provide your proposed franchise location.");
      return;
    }
    if (!formData.reason.trim() || formData.reason.trim().length < 20) {
      setErrorMessage("Please provide a brief statement (at least 20 characters) explaining why you want to partner.");
      return;
    }
    if (!formData.agreedToTerms) {
      setErrorMessage("Please agree to the terms and conditions to submit your application.");
      return;
    }

    try {
      setLoading(true);
      const res = await collegeService.submitFranchiseApplication({
        personalDetails: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          alternatePhone: formData.alternatePhone
        },
        collegeDetails: {
          collegeName: formData.collegeName,
          collegeType: formData.collegeType,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          website: formData.website
        },
        franchiseDetails: {
          studentCount: formData.studentCount,
          coursesOffered: formData.coursesOffered,
          proposedLocation: formData.proposedLocation,
          reason: formData.reason
        },
        documents: {
          collegeApprovalDoc: documents.collegeApprovalDoc?.name || "Uploaded document",
          authorizedIdProof: documents.authorizedIdProof?.name || "Uploaded ID proof",
          collegeLogo: documents.collegeLogo?.name || "Uploaded logo"
        }
      });

      setSuccessData(res);
      showSuccess("Franchise application submitted successfully!");
    } catch (err) {
      setErrorMessage(err.message || "Failed to submit franchise application. Please try again.");
      showError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const copyApplicationId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showSuccess("Application ID copied to clipboard!");
  };

  // Success Confirmation Screen
  if (successData) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-md text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#17B26A] mx-auto mb-2 shadow-2xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-1.5 border border-emerald-100">
          <Sparkles className="w-3 h-3" />
          Application Received
        </div>

        <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] tracking-tight">
          Franchise Application Submitted!
        </h2>
        <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto">
          Your proposal has been received. Our evaluation team will review it shortly.
        </p>

        {/* Compact Application Reference Card */}
        <div className="my-3.5 p-3.5 bg-[#0A1D3F] text-white rounded-xl text-left relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-blue-200 block uppercase font-semibold tracking-wider">
                Application Reference ID
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-[#FF8A00] tracking-wide block">
                {successData.applicationId}
              </span>
            </div>

            <button
              type="button"
              onClick={() => copyApplicationId(successData.applicationId)}
              className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white transition active:scale-95 cursor-pointer flex items-center gap-1 text-[11px] font-medium"
              title="Copy Application ID"
            >
              {copiedId ? (
                <>
                  <Check className="w-3 h-3 text-[#17B26A]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 mt-2.5 border-t border-white/10">
            <div>
              <span className="text-blue-200 block text-[9px] uppercase font-semibold">
                Institution
              </span>
              <span className="font-medium text-white truncate block text-[11px]">
                {formData.collegeName}
              </span>
            </div>
            <div>
              <span className="text-blue-200 block text-[9px] uppercase font-semibold">
                Location
              </span>
              <span className="font-medium text-white truncate block text-[11px]">
                {formData.proposedLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Next Steps Info */}
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-[11px] text-[#64748B] space-y-1 mb-3.5">
          <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F] text-xs">
            <Info className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Next Steps</span>
          </div>
          <p className="leading-snug">
            1. <strong>Verification:</strong> Credentials evaluated within 2–3 days.
          </p>
          <p className="leading-snug">
            2. <strong>Contact:</strong> Manager will call <strong>{formData.phone}</strong>.
          </p>
          <p className="leading-snug">
            3. <strong>Onboarding:</strong> MOU & partner setup will begin.
          </p>
        </div>

        {/* Compact Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-2 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#E67A00] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <span>Return to Options</span>
          </button>
          <a
            href="/"
            className="w-full sm:w-auto py-2 px-4 text-xs font-semibold text-[#0A1D3F] hover:bg-gray-100 rounded-xl transition border border-[#E6E8EC] text-center"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-md max-w-2xl sm:max-w-3xl mx-auto">
      {/* Back to Options Navigation */}
      <div className="flex items-center justify-between border-b border-[#E6E8EC] pb-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0A1D3F] hover:text-[#FF8A00] transition group cursor-pointer"
        >
          <div className="p-1 rounded-md bg-[#F7F8FA] group-hover:bg-[#FFF7ED] text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>Back to Registration Options</span>
        </button>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FF8A00]/20 text-[#FF8A00] text-[11px] font-bold">
          <ShieldCheck className="w-3 h-3" />
          Partner Network
        </span>
      </div>

      {/* Form Header */}
      <div className="text-center mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#0A1D3F] to-[#133C8B] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Building2 className="w-5 h-5 text-[#FF8A00]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#0A1D3F] tracking-tight">
          College Franchise Application
        </h2>
        <p className="text-xs text-[#667085] mt-0.5 max-w-lg mx-auto">
          Expand your institution’s horizons. Join KITSS Education’s partner network to drive admissions and build regional authority.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal / Contact Details */}
        <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <User className="w-4 h-4 text-[#FF8A00]" />
            <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wide">
              1. Personal / Contact Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="director@college.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                  required
                />
              </div>
            </div>

            {/* Alternate Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Alternate Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  placeholder="+91 98123 45678"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: College Details */}
        <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <Building2 className="w-4 h-4 text-[#FF8A00]" />
            <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wide">
              2. College / Institution Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* College Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                College / Institution Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="e.g. Apex Institute of Technology & Management"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                  required
                />
              </div>
            </div>

            {/* College Type */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                College Type <span className="text-red-500">*</span>
              </label>
              <select
                name="collegeType"
                value={formData.collegeType}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20"
              >
                {COLLEGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* College Website */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                College Website
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://www.apexcollege.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                />
              </div>
            </div>

            {/* College Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                College Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <textarea
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Campus Street, Sector / Area, Landmark..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 focus:border-[#0A1D3F] transition"
                  required
                />
              </div>
            </div>

            {/* City, State, Pincode */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Jaipur"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength="6"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit postal code (e.g. 110001)"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 transition"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Franchise Details */}
        <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <Sparkles className="w-4 h-4 text-[#FF8A00]" />
            <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wide">
              3. Franchise & Capacity Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of Students */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Current Number of Students <span className="text-red-500">*</span>
              </label>
              <select
                name="studentCount"
                value={formData.studentCount}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20"
              >
                {STUDENT_STRENGTH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Proposed Franchise Location */}
            <div>
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Proposed Franchise Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="proposedLocation"
                value={formData.proposedLocation}
                onChange={handleChange}
                placeholder="e.g. North Delhi / Greater Noida"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 transition"
                required
              />
            </div>

            {/* Courses Offered */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Courses Offered <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="coursesOffered"
                value={formData.coursesOffered}
                onChange={handleChange}
                placeholder="e.g. B.Tech Computer Science, MBA, BCA, B.Sc, Diploma in AI"
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 transition"
                required
              />
              <p className="text-[11px] text-[#64748B] mt-1">
                Enter comma-separated primary undergraduate & postgraduate programs.
              </p>
            </div>

            {/* Why do you want to become a franchise partner? */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                Why do you want to become a franchise partner? <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason"
                rows="3"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Briefly describe your vision, infrastructure, or why you wish to collaborate with KITSS Education..."
                className="w-full px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A1D3F]/20 transition"
                required
              />
              <div className="flex justify-between items-center text-[11px] text-[#64748B] mt-1">
                <span>Minimum 20 characters</span>
                <span className={formData.reason.length >= 20 ? "text-emerald-600 font-medium" : ""}>
                  {formData.reason.length} chars
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Documents / Verification */}
        <div className="bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2.5">
            <FileText className="w-4 h-4 text-[#FF8A00]" />
            <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wide">
              4. Documents / Verification
            </h3>
          </div>

          <p className="text-xs text-[#64748B]">
            Upload institutional registration certifications and identification for verified partner badge status. (PDF, JPG, PNG accepted, max 10MB each)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. College Registration / Approval Document */}
            <div className="p-3.5 bg-white rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0A1D3F] transition text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#0A1D3F] block mb-1">
                  College Approval Doc
                </span>
                <span className="text-[11px] text-gray-500 block mb-2">
                  UGC / AICTE / State Council
                </span>
              </div>

              {documents.collegeApprovalDoc ? (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-left">
                  <div className="truncate pr-2">
                    <span className="text-[11px] font-medium text-emerald-800 truncate block">
                      {documents.collegeApprovalDoc.name}
                    </span>
                    <span className="text-[9px] text-emerald-600">
                      {documents.collegeApprovalDoc.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument("collegeApprovalDoc")}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer py-3 px-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center gap-1.5 transition">
                  <Upload className="w-4 h-4 text-[#0A1D3F]" />
                  <span className="text-[11px] font-semibold text-[#0A1D3F]">
                    Choose Document
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) =>
                      handleFileUpload("collegeApprovalDoc", e.target.files[0])
                    }
                  />
                </label>
              )}
            </div>

            {/* 2. Authorized Person ID Proof */}
            <div className="p-3.5 bg-white rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0A1D3F] transition text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#0A1D3F] block mb-1">
                  Authorized Person ID
                </span>
                <span className="text-[11px] text-gray-500 block mb-2">
                  Aadhaar / PAN / Official ID
                </span>
              </div>

              {documents.authorizedIdProof ? (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-left">
                  <div className="truncate pr-2">
                    <span className="text-[11px] font-medium text-emerald-800 truncate block">
                      {documents.authorizedIdProof.name}
                    </span>
                    <span className="text-[9px] text-emerald-600">
                      {documents.authorizedIdProof.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument("authorizedIdProof")}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer py-3 px-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center gap-1.5 transition">
                  <Upload className="w-4 h-4 text-[#0A1D3F]" />
                  <span className="text-[11px] font-semibold text-[#0A1D3F]">
                    Choose ID Proof
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) =>
                      handleFileUpload("authorizedIdProof", e.target.files[0])
                    }
                  />
                </label>
              )}
            </div>

            {/* 3. College Logo */}
            <div className="p-3.5 bg-white rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#0A1D3F] transition text-center flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-[#0A1D3F] block mb-1">
                  College Logo
                </span>
                <span className="text-[11px] text-gray-500 block mb-2">
                  PNG / SVG / High-res JPG
                </span>
              </div>

              {documents.collegeLogo ? (
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-left">
                  <div className="truncate pr-2">
                    <span className="text-[11px] font-medium text-emerald-800 truncate block">
                      {documents.collegeLogo.name}
                    </span>
                    <span className="text-[9px] text-emerald-600">
                      {documents.collegeLogo.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument("collegeLogo")}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer py-3 px-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] flex flex-col items-center gap-1.5 transition">
                  <Upload className="w-4 h-4 text-[#0A1D3F]" />
                  <span className="text-[11px] font-semibold text-[#0A1D3F]">
                    Upload Logo
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={(e) =>
                      handleFileUpload("collegeLogo", e.target.files[0])
                    }
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Terms & Conditions Checkbox */}
        <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FF8A00]/20">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={formData.agreedToTerms}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#0A1D3F] focus:ring-[#0A1D3F] cursor-pointer"
              required
            />
            <span className="text-xs text-[#0A1D3F] leading-relaxed">
              I agree to the <strong>terms and conditions</strong>, code of conduct, and acknowledge that all data submitted is accurate and authorized by the governing board of the institution.
            </span>
          </label>
        </div>

        {/* Submit Button & Back Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <PrimaryButton
            type="submit"
            variant="navy"
            size="lg"
            fullWidth
            loading={loading}
            icon={ShieldCheck}
            className="shadow-lg shadow-[#0A1D3F]/15 cursor-pointer"
          >
            Submit Franchise Application
          </PrimaryButton>

          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-[#667085] hover:text-[#0A1D3F] transition text-center cursor-pointer"
          >
            Cancel & Back
          </button>
        </div>
      </form>
    </div>
  );
};
