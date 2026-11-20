import { RegistrationDraftControls } from './RegistrationDraftControls';
import React, { useState } from "react";
import { isPhoneNumber, PHONE_MAX_LENGTH } from "../../../../shared/validation/phone";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  School,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  KeyRound,
  LogIn,
  UploadCloud,
  FileText,
  CreditCard,
  QrCode,
  Lock,
  Building,
  Image as ImageIcon,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SearchableSelect } from "../common/SearchableSelect";

const STEP_DEFINITIONS = [
  { id: 1, title: "Student Info", subtitle: "Personal & Parents" },
  { id: 2, title: "Academics", subtitle: "Class & School" },
  { id: 3, title: "Addresses", subtitle: "Current & Home" },
  { id: 4, title: "Documents", subtitle: "Aadhar & Photos" },
  { id: 5, title: "Checkout & Pay", subtitle: "Fee & Admission" }
];

import { RegistrationAccount } from './RegistrationAccount';
import { useOriginalRegistration } from './useOriginalRegistration';
import { OriginalDocumentNotes } from './OriginalDocumentNotes';
export const TuitionCoachingForm = ({ onBack }) => {

  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());

  // 20 Required Fields State
  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    studentClass: "",
    studyBoard: "",
    stateName: "",
    district: "",
    pincode: "",
    address: "",
    schoolName: "",
    schoolAddress: "",
    homeAddress: "",
    contactNo: "",
    whatsappNo: "",
    guardianContactNo: "",
    emailId: "",
    aadharNumber: "",
    aadharCardFile: null,
    aadharCardPreview: null,
    passportPhotoFile: null,
    passportPhotoPreview: null,
    classIdCardFile: null,
    classIdCardPreview: null
  });

  // Payment method & credentials
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCustomSelectChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleSameAsContact = (e) => {
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, whatsappNo: prev.contactNo }));
    }
  };

  const handleSameAsAddress = (e) => {
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, homeAddress: prev.address }));
    }
  };

  const handleFileChange = (field, file) => workflow.chooseDocument(field, file);
  const validateStep = (currentStep) => {
    const errs = {};

    if (currentStep === 1) {
      if (!formData.studentName.trim()) errs.studentName = "Student Full Name is required";
      if (!formData.fatherName.trim()) errs.fatherName = "Father's Name is required";
      if (!formData.motherName.trim()) errs.motherName = "Mother's Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!isPhoneNumber(formData.contactNo)) {
        errs.contactNo = "Enter a valid contact number (10 to 15 digits)";
      }
      if (formData.whatsappNo.trim() && !isPhoneNumber(formData.whatsappNo)) {
        errs.whatsappNo = "Enter a valid WhatsApp number (10 to 15 digits)";
      }
      if (!isPhoneNumber(formData.guardianContactNo)) {
        errs.guardianContactNo = "Enter a valid guardian contact number (10 to 15 digits)";
      }
      if (!formData.emailId.trim() || !formData.emailId.includes("@")) {
        errs.emailId = "Valid Email ID is required";
      }
    } else if (currentStep === 2) {
      if (!formData.studentClass) errs.studentClass = "Student Class is required";
      if (!formData.studyBoard) errs.studyBoard = "Study Board is required";
      if (!formData.schoolName.trim()) errs.schoolName = "School Name is required";
      if (!formData.schoolAddress.trim()) errs.schoolAddress = "School Address is required";
    } else if (currentStep === 3) {
      if (!formData.stateName) errs.stateName = "State Name is required";
      if (!formData.district.trim()) errs.district = "District is required";
      if (!formData.pincode.trim() || formData.pincode.length < 6) {
        errs.pincode = "Valid 6-digit PIN code is required";
      }
      if (!formData.address.trim()) errs.address = "Address is required";
      if (!formData.homeAddress.trim()) errs.homeAddress = "Home Address is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const workflow = useOriginalRegistration('tuition', formData, setFormData, setErrors);
  const canChooseDocument = workflow.canChooseDocument;
  const INDIAN_STATES = workflow.choices('state',formData.state || formData.stateName), BOARDS = workflow.choices('board',formData.studyBoard), CLASSES = workflow.choices('class',formData.studentClass), AVAILABLE_COURSES = workflow.choices('program',formData.applyCourseName), STUDY_LANGUAGES = workflow.choices('language',formData.studyLanguage), COACHING_COURSES = workflow.choices('program',formData.coachingCourse), EXPERIENCE_YEARS = workflow.choices('experience',formData.coachingExperience);
  const beforeSubmit = () => { for (let index = 1; index < 4; index++) if (!validateStep(index)) { setStep(index); return false; } return true; };
  const handleNext = () => { if (step === 4 || validateStep(step)) { setCompletedSteps(prev => new Set([...prev, step])); setStep(v => Math.min(v + 1, 5)); } };
  const handlePrev = () => setStep(v => Math.max(v - 1, 1));
  const locked = Boolean(workflow.application && !['draft', 'needs_changes'].includes(workflow.application.status));
  const stepDefinitions = STEP_DEFINITIONS.map(s => s.id === 5 ? { ...s, title: workflow.policy?.feeRequired ? 'Checkout & Pay' : 'Review & Submit' } : s);
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Top Banner & Header - Compact & Clean */}
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
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-[#FF8A00] border border-orange-200/60">
                Tuition & Coaching
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {step <= 5 ? `Step ${step} of 5` : "Completed"}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-[#0A1D3F] leading-tight">
              Student Tuition / Coaching Admission Form
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex w-8 h-8 rounded-md bg-[#FF8A00]/10 text-[#FF8A00] items-center justify-center font-bold shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
      </div>

      {/* Modern Stepper Indicator - Compact */}
      {(
        <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-slate-200/80">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            
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
                        ? "bg-[#0A1D3F] text-white ring-2 ring-orange-200 scale-105 shadow-2xs"
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
        {/* ========================================================
            STEP 6: CREATED USER AND ID (COMPACT SUCCESS SCREEN)
           ======================================================== */}
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        Student & Parent Information
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Please enter legal student name, parents and contact details.
                      </p>
                    </div>
                  </div>

                  {/* 1. Student Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      1. Student Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="studentName" aria-label="Student name"
                        placeholder="e.g. Rohan Sharma"
                        value={formData.studentName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.studentName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.studentName}</p>}
                  </div>

                  {/* 2 & 3. Father's & Mother's Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        2. Student Father's Name *
                      </label>
                      <input
                        type="text"
                        name="fatherName" aria-label="Father's name"
                        placeholder="Mr. Suresh Sharma"
                        value={formData.fatherName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.fatherName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.fatherName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        3. Student Mother's Name *
                      </label>
                      <input
                        type="text"
                        name="motherName" aria-label="Mother's name"
                        placeholder="Mrs. Anita Sharma"
                        value={formData.motherName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.motherName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.motherName}</p>}
                    </div>
                  </div>

                  {/* 4. DOB & 17. Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        4. Student Date of Birth *
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
                        17. Email ID *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          name="emailId" aria-label="Applicant email"
                          placeholder="student@example.com"
                          value={formData.emailId}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.emailId && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.emailId}</p>}
                    </div>
                  </div>

                  {/* 14. Contact No & 15. WhatsApp No */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        14. Student Contact No. *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          name="contactNo" maxLength={PHONE_MAX_LENGTH} aria-label="Contact number"
                          placeholder="+91 98765 43210"
                          value={formData.contactNo}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                          required
                        />
                      </div>
                      {errors.contactNo && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.contactNo}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#0A1D3F]">
                          15. WhatsApp No.
                        </label>
                        <label className="text-[10px] text-[#FF8A00] font-semibold flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            onChange={handleSameAsContact}
                            className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                          />
                          <span>Same as Contact</span>
                        </label>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="tel"
                          name="whatsappNo" maxLength={PHONE_MAX_LENGTH} aria-label="WhatsApp number"
                          placeholder="+91 98765 43210"
                          value={formData.whatsappNo}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        />
                      </div>
                      {errors.whatsappNo && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.whatsappNo}</p>}
                    </div>
                  </div>

                  {/* 16. Guardian Contact No */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      16. Guardian Contact No. *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="tel"
                        name="guardianContactNo" maxLength={PHONE_MAX_LENGTH} aria-label="Guardian contact number"
                        placeholder="Father / Mother Mobile (+91 98765 00000)"
                        value={formData.guardianContactNo}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.guardianContactNo && (
                      <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.guardianContactNo}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 2: ACADEMICS & SCHOOL (5, 6, 11, 12)
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        Academic & School Details
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Specify class, study board, and school information.
                      </p>
                    </div>
                  </div>

                  {/* 5. Class & 6. Board */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        5. Student Class *
                      </label>
                      <SearchableSelect disabled={locked}
                        options={CLASSES}
                        value={formData.studentClass}
                        onChange={(val) => handleCustomSelectChange("studentClass", val)}
                        placeholder="Select Class"
                        searchPlaceholder="Search class..."
                        error={errors.studentClass}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        6. Student Study Board *
                      </label>
                      <SearchableSelect disabled={locked}
                        options={BOARDS}
                        value={formData.studyBoard}
                        onChange={(val) => handleCustomSelectChange("studyBoard", val)}
                        placeholder="Select Board"
                        searchPlaceholder="Search board..."
                        error={errors.studyBoard}
                      />
                    </div>
                  </div>

                  {/* 11. School Name */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      11. School Name *
                    </label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        name="schoolName" aria-label="School name"
                        placeholder="e.g. Delhi Public School / St. Mary High School"
                        value={formData.schoolName}
                        onChange={handleChange}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                    </div>
                    {errors.schoolName && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.schoolName}</p>}
                  </div>

                  {/* 12. School Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      12. School Address *
                    </label>
                    <textarea
                      rows="2"
                      name="schoolAddress" aria-label="School address"
                      placeholder="School campus address, area, locality, city"
                      value={formData.schoolAddress}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                      required
                    />
                    {errors.schoolAddress && (
                      <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.schoolAddress}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 3: ADDRESSES (7, 8, 9, 10, 13)
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        Residential & Contact Addresses
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Enter current correspondence address and permanent home address.
                      </p>
                    </div>
                  </div>

                  {/* 7. State & 8. District */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        7. State Name *
                      </label>
                      <SearchableSelect disabled={locked}
                        options={INDIAN_STATES}
                        value={formData.stateName}
                        onChange={(val) => handleCustomSelectChange("stateName", val)}
                        placeholder="Select State"
                        searchPlaceholder="Search Indian State..."
                        icon={MapPin}
                        error={errors.stateName}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        8. District *
                      </label>
                      <input
                        type="text"
                        name="district" aria-label="District"
                        placeholder="e.g. Bhopal / Indore"
                        value={formData.district}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        required
                      />
                      {errors.district && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.district}</p>}
                    </div>
                  </div>

                  {/* 9. Pin Code */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      9. Pin Code *
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      name="pincode" aria-label="Pincode"
                      placeholder="462001"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                      required
                    />
                    {errors.pincode && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.pincode}</p>}
                  </div>

                  {/* 10. Address */}
                  <div>
                    <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                      10. Address (Current / Correspondence) *
                    </label>
                    <input
                      type="text"
                      name="address" aria-label="Address"
                      placeholder="House / Flat No., Street, Colony, Landmark"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                      required
                    />
                    {errors.address && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.address}</p>}
                  </div>

                  {/* 13. Home Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#0A1D3F]">
                        13. Home Address (Permanent) *
                      </label>
                      <label className="text-[10px] text-[#FF8A00] font-semibold flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={handleSameAsAddress}
                          className="rounded text-[#FF8A00] focus:ring-[#FF8A00]"
                        />
                        <span>Same as Current Address</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      name="homeAddress" aria-label="Home address"
                      placeholder="Permanent Home Address"
                      value={formData.homeAddress}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                      required
                    />
                    {errors.homeAddress && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.homeAddress}</p>}
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 4: DOCUMENTS (18, 19, 20)
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
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        Student Identity & Documents
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Upload Aadhar card copy, passport photograph, and student ID.
                      </p>
                    </div>
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
            <RegistrationAccount applicantName={formData.studentName} applicantEmail={formData.emailId} />
          </div>
          <div hidden={step !== 5 && !workflow.user?.emailVerified} className="mt-3">
            <RegistrationDraftControls kind="tuition" formData={formData} setFormData={setFormData} showSubmission={step === 5} onApplicationChange={workflow.setApplication} uploadSelected beforeSubmit={beforeSubmit} />
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            {step > 1 ? <button type="button" onClick={handlePrev} className="py-2 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center gap-1.5"><ArrowLeft className="w-3 h-3" />Previous</button> : <div />}
            {step < 5 && <button type="button" onClick={handleNext} className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 ml-auto">{step === 4 ? 'Continue to Review' : 'Continue'}<ArrowRight className="w-3 h-3" /></button>}
          </div>
      </div>
    </div>
  );
};
