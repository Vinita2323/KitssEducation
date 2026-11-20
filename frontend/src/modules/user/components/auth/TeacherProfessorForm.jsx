import { RegistrationDraftControls } from './RegistrationDraftControls';
import React, { useState } from "react";
import { isPhoneNumber, PHONE_MAX_LENGTH } from "../../../../shared/validation/phone";
import {
  GraduationCap,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Building,
  Building2,
  FileText,
  UploadCloud,
  CreditCard,
  QrCode,
  Lock,
  Sparkles,
  BookOpen,
  Image as ImageIcon,
  Clock,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "../common/SearchableSelect";

const STEP_DEFINITIONS = [
  { id: 1, title: "Personal Info", subtitle: "Name & Contact" },
  { id: 2, title: "Experience Details", subtitle: "Institute & Course" },
  { id: 3, title: "Documents", subtitle: "Photo, ID & Aadhar" },
  { id: 4, title: "Checkout & Pay", subtitle: "Verification Fee" }
];

import { RegistrationAccount } from './RegistrationAccount';
import { useOriginalRegistration } from './useOriginalRegistration';
import { OriginalDocumentNotes } from './OriginalDocumentNotes';
export const TeacherProfessorForm = ({ onBack }) => {

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());


  // All 11 Required Fields State
  const [formData, setFormData] = useState({
    // 1. Name
    title: "Prof.",
    fullName: "",

    // 2. Age & Date of Birth
    dob: "",
    age: "",

    // 3. Study Language
    studyLanguage: "",

    // 4. Experience details
    instituteName: "", // A. Institute name
    startDate: "", // B. Date of start
    endDate: "", // C. End date
    isContinuing: true, // C. or continue
    coachingCourse: "", // D. Which Course of coaching
    instituteAddress: "", // E. Institute address
    instituteContact: "", // E. Institute contact details

    // 5. Contact Number
    contactNumber: "",

    // 6. WhatsApp Number
    whatsappNumber: "",

    // 7. Email
    email: "",

    // 8. Passport photo
    passportPhotoFile: null,
    passportPhotoPreview: null,

    // 9. Experience certificate copy or ID card copy
    experienceDocFile: null,
    experienceDocPreview: null,

    // 10. Aadhar card
    aadharNumber: "",
    aadharCardFile: null,
    aadharCardPreview: null,

    // 11. Experience in coaching / Total experience
    coachingExperience: "",
    specializationNotes: ""
  });

  const [errors, setErrors] = useState({});

  // Auto calculate age when DOB changes
  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age} Years` : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "dob") {
      const calculatedAge = calculateAge(value);
      setFormData((prev) => ({ ...prev, dob: value, age: calculatedAge }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleSameAsContact = (e) => {
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, whatsappNumber: prev.contactNumber }));
      if (errors.whatsappNumber) setErrors((prev) => ({ ...prev, whatsappNumber: "" }));
    }
  };

  const handleContinuingToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isContinuing: checked,
      endDate: checked ? "" : prev.endDate
    }));
  };

  const handleFileChange = (field, file) => workflow.chooseDocument(field, file);
  const validateStep = (currentStep) => {
    const errs = {};

    // STEP 1 Validation: Personal & Contact
    if (currentStep === 1) {
      if (!formData.fullName.trim()) errs.fullName = "Full Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!formData.studyLanguage) errs.studyLanguage = "Select Study / Teaching Language";
      if (!isPhoneNumber(formData.contactNumber)) {
        errs.contactNumber = "Enter a valid contact number (10 to 15 digits)";
      }
      if (!isPhoneNumber(formData.whatsappNumber)) {
        errs.whatsappNumber = "Enter a valid WhatsApp number (10 to 15 digits)";
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        errs.email = "Valid Email Address is required";
      }
    }

    // STEP 2 Validation: Experience details
    else if (currentStep === 2) {
      if (!formData.instituteName.trim()) errs.instituteName = "Institute name is required";
      if (!formData.startDate) errs.startDate = "Date of start is required";
      if (!formData.isContinuing && !formData.endDate) {
        errs.endDate = "End date or check 'Currently Continuing'";
      }
      if (!formData.coachingCourse) errs.coachingCourse = "Select Coaching Course / Batch";
      if (!formData.instituteAddress.trim()) errs.instituteAddress = "Institute address is required";
      if (!formData.instituteContact.trim()) errs.instituteContact = "Institute contact details required";
      if (!formData.coachingExperience) errs.coachingExperience = "Select Total Coaching Experience";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const workflow = useOriginalRegistration('teacher', formData, setFormData, setErrors);
  const canChooseDocument = workflow.canChooseDocument;
  const INDIAN_STATES = workflow.choices('state',formData.state || formData.stateName), BOARDS = workflow.choices('board',formData.studyBoard), CLASSES = workflow.choices('class',formData.studentClass), AVAILABLE_COURSES = workflow.choices('program',formData.applyCourseName), STUDY_LANGUAGES = workflow.choices('language',formData.studyLanguage), COACHING_COURSES = workflow.choices('program',formData.coachingCourse), EXPERIENCE_YEARS = workflow.choices('experience',formData.coachingExperience);
  const beforeSubmit = () => { for (let index = 1; index < 3; index++) if (!validateStep(index)) { setStep(index); return false; } return true; };
  const handleNext = () => { if (step === 3 || validateStep(step)) { setCompletedSteps(prev => new Set([...prev, step])); setStep(v => Math.min(v + 1, 4)); } };
  const handlePrev = () => setStep(v => Math.max(v - 1, 1));
  const locked = Boolean(workflow.application && !['draft', 'needs_changes'].includes(workflow.application.status));
  const stepDefinitions = STEP_DEFINITIONS.map(s => s.id === 4 ? { ...s, title: workflow.policy?.feeRequired ? 'Checkout & Pay' : 'Review & Submit' } : s);
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Top Banner - Compact */}
      <div className="p-3 sm:p-3.5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-md bg-slate-50 hover:bg-[#0A1D3F] hover:text-white text-[#0A1D3F] transition-colors border border-slate-200 flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
            aria-label="Back to registration options" title="Back to options"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Academic Faculty Portal
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {step <= 4 ? `Step ${step} of 4` : "Completed"}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#0A1D3F] leading-tight">
              Teacher / Professor Registration Form
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 items-center justify-center font-bold shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
      </div>

      {/* Stepper - Compact */}
      {(
        <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-slate-200/80">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            
            {stepDefinitions.map((s) => {
              const isCompleted = completedSteps.has(s.id);
              const isCurrent = step === s.id;

              return (
                <div
                  key={s.id}
                  role="button" tabIndex={0} aria-label={s.title} aria-current={isCurrent ? "step" : undefined} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setStep(s.id); } }}
                  className="flex flex-col items-center relative z-10 cursor-pointer group"
                  onClick={() => setStep(s.id)}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-150 ${
                      isCurrent
                        ? "bg-[#0A1D3F] text-white ring-2 ring-indigo-200 scale-105 shadow-2xs"
                        : isCompleted
                        ? "bg-emerald-600 text-white group-hover:bg-emerald-700"
                        : "bg-slate-100 text-slate-500 border border-slate-200 group-hover:border-slate-400 group-hover:bg-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 transition-colors hidden sm:block ${
                      isCurrent
                        ? "text-[#0A1D3F] font-bold"
                        : isCompleted
                        ? "text-emerald-700 group-hover:text-emerald-800"
                        : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-3.5 sm:p-5">
          <fieldset disabled={locked} className="min-w-0"><AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="pb-1.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">1. Personal & Contact Details</h2>
                    <p className="text-[11px] text-slate-500">Name, Date of Birth, Age, Study Language & Contacts.</p>
                  </div>

                  {/* 1. Name */}
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">Title</label>
                      <SearchableSelect disabled={locked}
                        options={["Prof.", "Dr.", "Mr.", "Ms.", "Mrs."]}
                        value={formData.title}
                        onChange={(val) => handleSelectChange("title", val)}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">1. Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          name="fullName" aria-label="Full name"
                          placeholder="e.g. Anand Kumar Sharma"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.fullName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.fullName}</p>}
                    </div>
                  </div>

                  {/* 2. Age & Date of Birth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">2. Date of Birth *</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="date"
                          name="dob" aria-label="Date of birth"
                          value={formData.dob}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.dob && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.dob}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">Calculated Age</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          name="age" aria-label="Calculated age"
                          value={formData.age || "Auto-calculated from DOB"}
                          readOnly
                          className="w-full pl-9 pr-3 py-2 bg-slate-100/80 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-600 font-semibold cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Study Language */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">3. Study / Teaching Language *</label>
                    <SearchableSelect disabled={locked}
                      options={STUDY_LANGUAGES}
                      value={formData.studyLanguage}
                      onChange={(val) => handleSelectChange("studyLanguage", val)}
                      placeholder="Select Medium / Language"
                    />
                    {errors.studyLanguage && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.studyLanguage}</p>}
                  </div>

                  {/* 5. Contact Number & 7. Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">5. Contact Number (Calling) *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          name="contactNumber" aria-label="Contact number"
                          placeholder="10-digit mobile number"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          maxLength={PHONE_MAX_LENGTH}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.contactNumber && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.contactNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">7. Email ID *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          name="email" aria-label="Applicant email"
                          placeholder="professor@university.edu"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.email}</p>}
                    </div>
                  </div>

                  {/* 6. WhatsApp Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#0A1D3F]">6. WhatsApp Number *</label>
                      <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          onChange={handleSameAsContact}
                          className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                        />
                        <span>Same as Contact Number</span>
                      </label>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                      <input
                        type="tel"
                        name="whatsappNumber" aria-label="WhatsApp number"
                        placeholder="WhatsApp enabled mobile number"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        maxLength={PHONE_MAX_LENGTH}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.whatsappNumber && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.whatsappNumber}</p>}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 2: EXPERIENCE DETAILS (Institute, Dates, Course, Contact, Coaching Exp)
                 ======================================================== */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="pb-1.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">4 & 11. Experience & Coaching Details</h2>
                    <p className="text-[11px] text-slate-500">Institute details, start/end dates, coaching courses & total experience.</p>
                  </div>

                  {/* 4A. Institute Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      4A. Institute / College / Coaching Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="instituteName" aria-label="Institution name"
                        placeholder="e.g. Government Science College / Allen / Resonance / Self-Academy"
                        value={formData.instituteName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.instituteName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.instituteName}</p>}
                  </div>

                  {/* 4B & 4C. Date of Start and End of Date / Continue */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">4B. Date of Start *</label>
                      <input
                        type="date"
                        name="startDate" aria-label="Start date"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.startDate && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.startDate}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#0A1D3F]">4C. End Date / Status *</label>
                        <label className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={formData.isContinuing}
                            onChange={handleContinuingToggle}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Currently Continue / Working</span>
                        </label>
                      </div>
                      {formData.isContinuing ? (
                        <div className="w-full px-3 py-2 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Present / Continuing</span>
                        </div>
                      ) : (
                        <input
                          type="date"
                          name="endDate" aria-label="End date"
                          value={formData.endDate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        />
                      )}
                      {errors.endDate && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.endDate}</p>}
                    </div>
                  </div>

                  {/* 4D. Which Course of Coaching */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      4D. Which Course of Coaching / Target Batch *
                    </label>
                    <SearchableSelect disabled={locked}
                      options={COACHING_COURSES}
                      value={formData.coachingCourse}
                      onChange={(val) => handleSelectChange("coachingCourse", val)}
                      placeholder="Select coaching batch / course"
                    />
                    {errors.coachingCourse && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.coachingCourse}</p>}
                  </div>

                  {/* 4E. Institute Address & Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4E. Institute Address *
                      </label>
                      <textarea
                        name="instituteAddress" aria-label="Institution address"
                        rows={2}
                        placeholder="Complete campus / branch address"
                        value={formData.instituteAddress}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition resize-none"
                        required
                      />
                      {errors.instituteAddress && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.instituteAddress}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4E. Institute Contact Details *
                      </label>
                      <textarea
                        name="instituteContact" aria-label="Institution contact number"
                        rows={2}
                        placeholder="Institute Phone, Official Email, or Website"
                        value={formData.instituteContact}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition resize-none"
                        required
                      />
                      {errors.instituteContact && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.instituteContact}</p>}
                    </div>
                  </div>

                  {/* 11. Experience in Coaching */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      11. Total Experience in Coaching / Teaching *
                    </label>
                    <SearchableSelect disabled={locked}
                      options={EXPERIENCE_YEARS}
                      value={formData.coachingExperience}
                      onChange={(val) => handleSelectChange("coachingExperience", val)}
                      placeholder="Select Total Coaching Experience"
                    />
                    {errors.coachingExperience && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.coachingExperience}</p>}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 3: DOCUMENT UPLOADS (Passport Photo, Exp Cert / ID, Aadhar Card)
                 ======================================================== */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="pb-1.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">8, 9 & 10. Document Verification Copies</h2>
                    <p className="text-[11px] text-slate-500">Upload passport photo, experience certificate / ID card & Aadhar card copy.</p>
                  </div>

                  {workflow.policy?.documents && workflow.policy.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {workflow.policy.documents.map((d, index) => {
                        const normKey = d.key.replace(/[-_\s]/g, '');
                        const file = formData[d.key + 'File'] || formData[normKey + 'File'];
                        const preview = formData[d.key + 'Preview'] || formData[normKey + 'Preview'];
                        const error = errors[d.key] || errors[normKey];
                        const canUpload = canChooseDocument(d.key);
                        const isPrivate = d.key.includes('aadhar') || d.label.toLowerCase().includes('aadhar');
                        const isPhoto = d.key.includes('photo') || d.label.toLowerCase().includes('photo');

                        return (
                          <div key={d.key} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <label className="text-xs font-bold text-[#0A1D3F]">
                                {index + 1}. {d.label}
                                {d.required !== false ? (
                                  <span className="text-red-500 font-bold ml-1">*</span>
                                ) : (
                                  <span className="text-[11px] text-slate-400 font-normal ml-1.5">(Optional)</span>
                                )}
                              </label>
                              {isPrivate && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Private document
                                </span>
                              )}
                            </div>

                            <label
                              className={`block border border-dashed rounded-xl p-3 text-center transition shadow-2xs ${
                                canUpload
                                  ? 'border-slate-300 hover:border-[#FF8A00] bg-white cursor-pointer hover:shadow-xs'
                                  : 'border-slate-200 bg-slate-100/60 opacity-70 cursor-not-allowed'
                              }`}
                            >
                              {preview ? (
                                <div className="flex items-center justify-center gap-3 py-1">
                                  <img
                                    src={preview}
                                    alt={d.label + ' Preview'}
                                    className="w-14 h-16 object-cover rounded-lg border border-slate-200 shadow-2xs"
                                  />
                                  <div className="text-left space-y-0.5 min-w-0">
                                    <span className="text-xs font-bold text-emerald-700 block">
                                      File Selected ✓
                                    </span>
                                    <span className="text-[11px] text-slate-600 block truncate max-w-[170px]">
                                      {file?.name || d.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">Click to change</span>
                                  </div>
                                </div>
                              ) : file ? (
                                <div className="flex items-center justify-center gap-2.5 py-2">
                                  <FileText className="w-6 h-6 text-slate-500 shrink-0" />
                                  <div className="text-left min-w-0">
                                    <span className="text-xs font-bold text-[#0A1D3F] block truncate max-w-[170px]">
                                      {file.name}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 font-semibold block">Attached ✓ (Click to change)</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-2.5 text-slate-500 space-y-1">
                                  {isPhoto ? (
                                    <ImageIcon className="w-6 h-6 mx-auto text-slate-400" />
                                  ) : (
                                    <UploadCloud className="w-6 h-6 mx-auto text-slate-400" />
                                  )}
                                  <span className="text-xs font-bold block text-slate-700">
                                    Upload {d.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    PDF, JPG, PNG (Max 10MB)
                                  </span>
                                </div>
                              )}

                              <input
                                type="file"
                                aria-label={'Select ' + d.key}
                                disabled={!canUpload}
                                accept={workflow.policy?.upload?.mime?.join(',') || 'application/pdf,image/png,image/jpeg'}
                                onChange={e => handleFileChange(d.key, e.target.files?.[0])}
                                className="hidden"
                              />
                            </label>

                            {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-xs text-slate-500 space-y-1">
                      <FileText className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <p className="font-semibold text-slate-700">
                        {!workflow.enabled ? "Document requirements will be shown when applications open." : "No documents are required for this application."}
                      </p>
                      <p className="text-[11px] text-slate-400">You can continue entering and reviewing your details.</p>
                    </div>
                  )}

                  <OriginalDocumentNotes workflow={workflow} formData={formData} />
                </motion.div>
              )}

          </AnimatePresence></fieldset>
          <div hidden={step !== 4} className="space-y-3">
            <div className="pb-1.5 border-b border-slate-100"><h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">4. Review, Account &amp; Submit</h2><p className="text-[11px] text-slate-500">Confirm your details and complete your application. {workflow.policy ? workflow.policy.feeRequired ? 'Application fee: INR ' + (workflow.policy.amountMinor / 100).toFixed(2) : 'No application fee.' : 'Fee details will appear when applications open.'}</p></div>
            <RegistrationAccount applicantName={formData.fullName} applicantEmail={formData.email} />
          </div>
          <div hidden={step !== 4 && !workflow.user?.emailVerified} className="mt-3">
            <RegistrationDraftControls kind="teacher" formData={formData} setFormData={setFormData} showSubmission={step === 4} onApplicationChange={workflow.setApplication} uploadSelected beforeSubmit={beforeSubmit} />
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            {step > 1 ? <button type="button" onClick={handlePrev} className="py-2 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5"><ArrowLeft className="w-3 h-3" />Previous</button> : <div />}
            {step < 4 && <button type="button" onClick={handleNext} className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 ml-auto">{step === 3 ? 'Continue to Review' : 'Continue'}<ArrowRight className="w-3 h-3" /></button>}
          </div>
      </div>
    </div>
  );
};
