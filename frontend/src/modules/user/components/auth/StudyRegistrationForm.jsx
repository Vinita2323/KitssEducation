import { RegistrationDraftControls } from './RegistrationDraftControls';
import React, { useState } from "react";
import { isPhoneNumber, PHONE_MAX_LENGTH } from "../../../../shared/validation/phone";
import {
  User,
  Mail,
  Phone,
  Calendar,
  School,
  BookOpen,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  LogIn,
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  Lock,
  Sparkles,
  UploadCloud,
  FileText,
  Clock,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "../common/SearchableSelect";

const STEP_DEFINITIONS = [
  { id: 1, title: "Student Info", subtitle: "Name & Parents" },
  { id: 2, title: "Contact & Address", subtitle: "Phone & Location" },
  { id: 3, title: "Course & Institute", subtitle: "Applying Details" },
  { id: 4, title: "Documents", subtitle: "Photo, Aadhar, Result" },
  { id: 5, title: "Checkout & Pay", subtitle: "Enrollment Fee" }
];

import { RegistrationAccount } from './RegistrationAccount';
import { useOriginalRegistration } from './useOriginalRegistration';
import { OriginalDocumentNotes } from './OriginalDocumentNotes';
export const StudyRegistrationForm = ({ onBack }) => {

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());


  // All 14 Requested Fields State
  const [formData, setFormData] = useState({
    // 1. Name of Student
    studentName: "",

    // 2. Date of birth and age
    dob: "",
    age: "",

    // 8. Father's name & 9. Mother's name
    fatherName: "",
    motherName: "",

    // 5. Email, 6. WhatsApp no, 7. Calling no
    email: "",
    whatsappNo: "",
    callingNo: "",

    // 3. Address & 4. State, District, City, Pin code
    address: "",
    state: "",
    district: "",
    city: "",
    pincode: "",

    // 10. Apply Course name & 11. Apply Institute name
    applyCourseName: "",
    applyInstituteName: "",

    // 12. Submit your complete courses certificate or result
    courseCertificateFile: null,
    courseCertificatePreview: null,

    // 13. Submit your Aadhar card
    aadharNumber: "",
    aadharCardFile: null,
    aadharCardPreview: null,

    // 14. Submit your Passport photo
    passportPhotoFile: null,
    passportPhotoPreview: null
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

  const handleSameAsCalling = (e) => {
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, whatsappNo: prev.callingNo }));
      if (errors.whatsappNo) setErrors((prev) => ({ ...prev, whatsappNo: "" }));
    }
  };

  const handleFileChange = (field, file) => workflow.chooseDocument(field, file);
  const validateStep = (currentStep) => {
    const errs = {};

    // STEP 1: Student & Parents info
    if (currentStep === 1) {
      if (!formData.studentName.trim()) errs.studentName = "Student Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!formData.fatherName.trim()) errs.fatherName = "Father's Name is required";
      if (!formData.motherName.trim()) errs.motherName = "Mother's Name is required";
    }

    // STEP 2: Contact & Address
    else if (currentStep === 2) {
      if (!isPhoneNumber(formData.callingNo)) {
        errs.callingNo = "Enter a valid calling number (10 to 15 digits)";
      }
      if (!isPhoneNumber(formData.whatsappNo)) {
        errs.whatsappNo = "Enter a valid WhatsApp number (10 to 15 digits)";
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        errs.email = "Valid Email ID is required";
      }
      if (!formData.address.trim()) errs.address = "Address is required";
      if (!formData.state) errs.state = "State is required";
      if (!formData.district.trim()) errs.district = "District is required";
      if (!formData.city.trim()) errs.city = "City is required";
      if (!formData.pincode.trim() || formData.pincode.length < 6) {
        errs.pincode = "Valid 6-digit PIN code required";
      }
    }

    // STEP 3: Course & Institute
    else if (currentStep === 3) {
      if (!formData.applyCourseName) errs.applyCourseName = "Select Apply Course Name";
      if (!formData.applyInstituteName.trim()) errs.applyInstituteName = "Apply Institute Name is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const workflow = useOriginalRegistration('study', formData, setFormData, setErrors);
  const canChooseDocument = workflow.canChooseDocument;
  const INDIAN_STATES = workflow.choices('state',formData.state || formData.stateName), BOARDS = workflow.choices('board',formData.studyBoard), CLASSES = workflow.choices('class',formData.studentClass), AVAILABLE_COURSES = workflow.choices('program',formData.applyCourseName), STUDY_LANGUAGES = workflow.choices('language',formData.studyLanguage), COACHING_COURSES = workflow.choices('program',formData.coachingCourse), EXPERIENCE_YEARS = workflow.choices('experience',formData.coachingExperience);
  const beforeSubmit = () => { for (let index = 1; index < 4; index++) if (!validateStep(index)) { setStep(index); return false; } return true; };
  const handleNext = () => { if (step === 4 || validateStep(step)) { setCompletedSteps(prev => new Set([...prev, step])); setStep(v => Math.min(v + 1, 5)); } };
  const handlePrev = () => setStep(v => Math.max(v - 1, 1));
  const locked = Boolean(workflow.application && !['draft', 'needs_changes'].includes(workflow.application.status));
  const stepDefinitions = STEP_DEFINITIONS.map(s => s.id === 5 ? { ...s, title: workflow.policy?.feeRequired ? 'Checkout & Pay' : 'Review & Submit' } : s);
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Student Learning Portal
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {step <= 5 ? `Step ${step} of 5` : "Completed"}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#0A1D3F] leading-tight">
              Study Registration Form
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 items-center justify-center font-bold shrink-0">
          <BookOpen className="w-4 h-4" />
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
                        ? "bg-[#0A1D3F] text-white ring-2 ring-emerald-200 scale-105 shadow-2xs"
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

      {/* Main Form Body */}
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
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">1. Student & Parents Information</h2>
                    <p className="text-[11px] text-slate-500">Enter student full name, date of birth and parents' names.</p>
                  </div>

                  {/* 1. Name of Student */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      1. Name of Student *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="studentName" aria-label="Student name"
                        placeholder="Student's complete full name"
                        value={formData.studentName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.studentName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.studentName}</p>}
                  </div>

                  {/* 2. Date of birth and age */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        2. Date of Birth *
                      </label>
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
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Calculated Student Age
                      </label>
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

                  {/* 8. Father's name & 9. Mother's name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        8. Father's Name *
                      </label>
                      <input
                        type="text"
                        name="fatherName" aria-label="Father's name"
                        placeholder="Father's full name"
                        value={formData.fatherName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.fatherName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.fatherName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        9. Mother's Name *
                      </label>
                      <input
                        type="text"
                        name="motherName" aria-label="Mother's name"
                        placeholder="Mother's full name"
                        value={formData.motherName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.motherName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.motherName}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 2: CONTACT & ADDRESS (3, 4, 5, 6, 7)
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
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">2. Contact Numbers & Address Details</h2>
                    <p className="text-[11px] text-slate-500">Calling number, WhatsApp number, Email and residential address.</p>
                  </div>

                  {/* 7. Calling no & 5. Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        7. Calling No (Mobile) *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          name="callingNo" aria-label="Contact number"
                          placeholder="10-digit mobile number"
                          value={formData.callingNo}
                          onChange={handleChange}
                          maxLength={PHONE_MAX_LENGTH}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.callingNo && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.callingNo}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        5. Email ID *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          name="email" aria-label="Applicant email"
                          placeholder="student@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.email && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.email}</p>}
                    </div>
                  </div>

                  {/* 6. WhatsApp no */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#0A1D3F]">6. WhatsApp No *</label>
                      <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          onChange={handleSameAsCalling}
                          className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                        />
                        <span>Same as Calling No</span>
                      </label>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                      <input
                        type="tel"
                        name="whatsappNo" aria-label="WhatsApp number"
                        placeholder="WhatsApp enabled contact number"
                        value={formData.whatsappNo}
                        onChange={handleChange}
                        maxLength={PHONE_MAX_LENGTH}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.whatsappNo && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.whatsappNo}</p>}
                  </div>

                  {/* 3. Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      3. Full Residential Address *
                    </label>
                    <textarea
                      name="address" aria-label="Address"
                      rows={2}
                      placeholder="House/Flat No., Street, Landmark, Area"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition resize-none"
                      required
                    />
                    {errors.address && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.address}</p>}
                  </div>

                  {/* 4. State, District, City, Pin code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4. State *
                      </label>
                      <SearchableSelect disabled={locked}
                        options={INDIAN_STATES}
                        value={formData.state}
                        onChange={(val) => handleSelectChange("state", val)}
                        placeholder="Select State"
                      />
                      {errors.state && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4. District *
                      </label>
                      <input
                        type="text"
                        name="district" aria-label="District"
                        placeholder="e.g. Bhopal"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.district && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.district}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4. City *
                      </label>
                      <input
                        type="text"
                        name="city" aria-label="City"
                        placeholder="e.g. Bhopal"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.city && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4. PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pincode" aria-label="Pincode"
                        placeholder="6-digit PIN"
                        value={formData.pincode}
                        onChange={handleChange}
                        maxLength={6}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm font-mono text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.pincode && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.pincode}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 3: COURSE & INSTITUTE APPLICATION (10, 11)
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
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">3. Course & Institute Application</h2>
                    <p className="text-[11px] text-slate-500">Select course/class and enter your school/college or institute name.</p>
                  </div>

                  {/* 10. Apply Course name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      10. Apply Course Name / Target Class *
                    </label>
                    <SearchableSelect disabled={locked}
                      options={AVAILABLE_COURSES}
                      value={formData.applyCourseName}
                      onChange={(val) => handleSelectChange("applyCourseName", val)}
                      placeholder="Select Course / Class applying for"
                    />
                    {errors.applyCourseName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.applyCourseName}</p>}
                  </div>

                  {/* 11. Apply Institute name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      11. Apply Institute / School / College Name *
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="applyInstituteName" aria-label="Preferred institution"
                        placeholder="e.g. Model Higher Secondary School / National College"
                        value={formData.applyInstituteName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.applyInstituteName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.applyInstituteName}</p>}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 4: DOCUMENTS UPLOADS (12, 13, 14)
                 ======================================================== */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="pb-1.5 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">4. Document Verification Copies</h2>
                    <p className="text-[11px] text-slate-500">
                      Upload the required verification documents requested for this application.
                    </p>
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
          <div hidden={step !== 5} className="space-y-3">
            <div className="pb-1.5 border-b border-slate-100"><h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">5. Review, Account &amp; Submit</h2><p className="text-[11px] text-slate-500">Confirm your details and complete your application. {workflow.policy ? workflow.policy.feeRequired ? 'Application fee: INR ' + (workflow.policy.amountMinor / 100).toFixed(2) : 'No application fee.' : 'Fee details will appear when applications open.'}</p></div>
            <RegistrationAccount applicantName={formData.studentName} applicantEmail={formData.email} />
          </div>
          <div hidden={step !== 5 && !workflow.user?.emailVerified} className="mt-3">
            <RegistrationDraftControls kind="study" formData={formData} setFormData={setFormData} showSubmission={step === 5} onApplicationChange={workflow.setApplication} uploadSelected beforeSubmit={beforeSubmit} />
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            {step > 1 ? <button type="button" onClick={handlePrev} className="py-2 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5"><ArrowLeft className="w-3 h-3" />Previous</button> : <div />}
            {step < 5 && <button type="button" onClick={handleNext} className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 ml-auto">{step === 4 ? 'Continue to Review' : 'Continue'}<ArrowRight className="w-3 h-3" /></button>}
          </div>
      </div>
    </div>
  );
};
