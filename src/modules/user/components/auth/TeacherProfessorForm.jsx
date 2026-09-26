import React, { useState } from "react";
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
import { useToast } from "../../context/ToastContext";
import { SearchableSelect } from "../common/SearchableSelect";
import { openRazorpayCheckout } from "../../services/razorpayService";

const STUDY_LANGUAGES = [
  "Bilingual (Hindi + English)",
  "English Medium",
  "Hindi Medium",
  "Sanskrit",
  "Regional Language / Other"
];

const COACHING_COURSES = [
  "IIT-JEE (Main & Advanced)",
  "NEET-UG (Medical Prep)",
  "Classes 11 & 12 (Higher Secondary Board - Science PCM/PCB)",
  "Classes 11 & 12 (Commerce & Arts)",
  "Classes 9 & 10 (Foundation & Olympiads)",
  "Classes 6 to 8 (Middle School Foundation)",
  "UPSC / State PSC / Civil Services",
  "College / University Degree Courses",
  "Other Professional / Skill Coaching"
];

const EXPERIENCE_YEARS = [
  "Less than 1 Year",
  "1 to 3 Years",
  "3 to 5 Years",
  "5 to 10 Years",
  "10+ Years (Senior Faculty / Professor)"
];

const STEP_DEFINITIONS = [
  { id: 1, title: "Personal Info", subtitle: "Name & Contact" },
  { id: 2, title: "Experience Details", subtitle: "Institute & Course" },
  { id: 3, title: "Documents", subtitle: "Photo, ID & Aadhar" },
  { id: 4, title: "Checkout & Pay", subtitle: "Verification Fee" }
];

export const TeacherProfessorForm = ({ onBack }) => {
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [facultyId, setFacultyId] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiApp, setUpiApp] = useState("gpay");
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [verificationFee] = useState(199);
  const [transactionId, setTransactionId] = useState("");

  // All 11 Required Fields State
  const [formData, setFormData] = useState({
    // 1. Name
    title: "Prof.",
    fullName: "",

    // 2. Age & Date of Birth
    dob: "",
    age: "",

    // 3. Study Language
    studyLanguage: "Bilingual (Hindi + English)",

    // 4. Experience details
    instituteName: "", // A. Institute name
    startDate: "", // B. Date of start
    endDate: "", // C. End date
    isContinuing: true, // C. or continue
    coachingCourse: "IIT-JEE (Main & Advanced)", // D. Which Course of coaching
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
    coachingExperience: "3 to 5 Years",
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

  const handleFileChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        [`${field}File`]: file,
        [`${field}Preview`]: e.target.result
      }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep) => {
    const errs = {};

    // STEP 1 Validation: Personal & Contact
    if (currentStep === 1) {
      if (!formData.fullName.trim()) errs.fullName = "Full Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!formData.studyLanguage) errs.studyLanguage = "Select Study / Teaching Language";
      if (!formData.contactNumber.trim() || formData.contactNumber.length < 10) {
        errs.contactNumber = "Valid 10-digit Contact Number required";
      }
      if (!formData.whatsappNumber.trim() || formData.whatsappNumber.length < 10) {
        errs.whatsappNumber = "Valid 10-digit WhatsApp Number required";
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

    // STEP 3 Validation: Document uploads & Aadhar
    else if (currentStep === 3) {
      if (!formData.passportPhotoPreview && !formData.passportPhotoFile) {
        errs.passportPhoto = "Upload Passport size photo";
      }
      if (!formData.experienceDocPreview && !formData.experienceDocFile) {
        errs.experienceDoc = "Upload Experience Certificate copy or ID Card copy";
      }
      if (!formData.aadharNumber.trim() || formData.aadharNumber.length < 12) {
        errs.aadharNumber = "Valid 12-digit Aadhar Number required";
      }
      if (!formData.aadharCardPreview && !formData.aadharCardFile) {
        errs.aadharCard = "Upload Aadhar card copy";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const completeRegistrationSuccess = (txnId) => {
    const generatedTxn = txnId || `TXN-FAC-${Date.now().toString().slice(-8)}`;
    setTransactionId(generatedTxn);
    const generatedFacultyId = `KITSS-FAC-${Math.floor(100000 + Math.random() * 900000)}`;
    setFacultyId(generatedFacultyId);
    setIsSuccess(true);
    setStep(5);
    setSubmitting(false);
    showSuccess("Faculty verification fee paid & application registered!");
  };

  const handlePaymentAndSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

    setSubmitting(true);
    try {
      await openRazorpayCheckout({
        amountInRupees: verificationFee,
        course: {
          id: "FACULTY_ACCREDITATION",
          title: `Faculty Registration - ${formData.title} ${formData.fullName}`
        },
        plan: {
          name: "Faculty Onboarding & Verification",
          duration: "Accredited Access"
        },
        student: {
          name: `${formData.title} ${formData.fullName}`,
          email: formData.email,
          phone: formData.contactNumber
        },
        onSuccess: (response) => {
          completeRegistrationSuccess(response?.razorpay_payment_id);
        },
        onFailure: (err) => {
          setSubmitting(false);
          showError(err?.message || "Payment cancelled or failed.");
        },
        onDismiss: () => {
          setSubmitting(false);
        }
      });
    } catch (err) {
      setSubmitting(false);
      showError(err.message || "Unable to launch checkout payment gateway.");
    }
  };

  const copyFacultyId = () => {
    navigator.clipboard.writeText(facultyId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showSuccess("Application ID copied!");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Top Banner - Compact */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-7 h-7 rounded-md bg-slate-50 hover:bg-[#0A1D3F] hover:text-white text-[#0A1D3F] transition-colors border border-slate-200 flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
            title="Back to options"
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
      {!isSuccess && (
        <div className="bg-white rounded-lg border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            
            {STEP_DEFINITIONS.map((s) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;

              return (
                <div
                  key={s.id}
                  className="flex flex-col items-center relative z-10 cursor-pointer"
                  onClick={() => {
                    if (s.id < step) setStep(s.id);
                  }}
                >
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-150 ${
                      isCurrent
                        ? "bg-[#0A1D3F] text-white ring-2 ring-indigo-200 scale-105 shadow-2xs"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.id}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 transition-colors hidden sm:block ${
                      isCurrent
                        ? "text-[#0A1D3F] font-bold"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
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
      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
        {isSuccess ? (
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3.5 py-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Check className="w-3 h-3" /> Verification Fee Paid • Application Received
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] pt-0.5">
                Faculty Profile Registered!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong>{formData.title} {formData.fullName}</strong>. Your application & experience details have been registered.
              </p>
            </div>

            <div className="p-3.5 bg-[#0A1D3F] rounded-lg text-left text-white space-y-2.5 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-orange-300 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF8A00]" /> Faculty Tracking ID
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-md border border-white/10">
                <div>
                  <span className="text-[10px] text-slate-300 block">APPLICATION ID</span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-white tracking-wider">
                    {facultyId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyFacultyId}
                  className="px-2.5 py-1 rounded bg-[#FF8A00] hover:bg-[#e67c00] text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 max-w-md mx-auto text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Subject / Course:</span>
                <span className="font-bold text-[#0A1D3F]">{formData.coachingCourse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Language Medium:</span>
                <span className="font-bold text-[#0A1D3F]">{formData.studyLanguage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Institute Affiliation:</span>
                <span className="font-bold text-[#0A1D3F]">{formData.instituteName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Fee:</span>
                <span className="font-bold text-emerald-600">₹{verificationFee} (Paid Online)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{transactionId}</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#0A1D3F] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
              >
                Back to Registration Options
              </button>
            </div>
          </motion.div>
        ) : (
          <form
            onSubmit={(e) => {
              if (step === 4) {
                handlePaymentAndSubmit(e);
              } else {
                e.preventDefault();
                handleNext();
              }
            }}
            className="space-y-3.5"
          >
            <AnimatePresence mode="wait">
              {/* ========================================================
                  STEP 1: PERSONAL DETAILS (Name, Age/DOB, Language, Contacts)
                 ======================================================== */}
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
                      <SearchableSelect
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
                          name="fullName"
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
                          name="dob"
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
                          name="age"
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
                    <SearchableSelect
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
                          name="contactNumber"
                          placeholder="10-digit mobile number"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          maxLength={10}
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
                          name="email"
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
                        name="whatsappNumber"
                        placeholder="WhatsApp enabled mobile number"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        maxLength={10}
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
                        name="instituteName"
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
                        name="startDate"
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
                          name="endDate"
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
                    <SearchableSelect
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
                        name="instituteAddress"
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
                        name="instituteContact"
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
                    <SearchableSelect
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

                  {/* 8. Passport Photo & 9. Experience Certificate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 8. Passport photo */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#0A1D3F]">
                        8. Passport Photo *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-slate-50/70 hover:bg-white rounded-lg p-2.5 text-center cursor-pointer transition shadow-2xs">
                        {formData.passportPhotoPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={formData.passportPhotoPreview}
                              alt="Passport Photo Preview"
                              className="w-16 h-20 object-cover mx-auto rounded border shadow-2xs"
                            />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Photo Uploaded ✓</span>
                          </div>
                        ) : (
                          <div className="py-2 text-slate-500">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-bold block text-slate-700">Upload Passport Photo</span>
                            <span className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange("passportPhoto", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {errors.passportPhoto && <p className="text-[11px] text-red-500 font-medium">{errors.passportPhoto}</p>}
                    </div>

                    {/* 9. Experience Certificate / ID Card */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#0A1D3F]">
                        9. Experience Certificate / Faculty ID Card *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-slate-50/70 hover:bg-white rounded-lg p-2.5 text-center cursor-pointer transition shadow-2xs">
                        {formData.experienceDocPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={formData.experienceDocPreview}
                              alt="Experience Doc Preview"
                              className="w-16 h-20 object-cover mx-auto rounded border shadow-2xs"
                            />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Document Uploaded ✓</span>
                          </div>
                        ) : (
                          <div className="py-2 text-slate-500">
                            <FileText className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-bold block text-slate-700">Upload Certificate / ID Card</span>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("experienceDoc", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {errors.experienceDoc && <p className="text-[11px] text-red-500 font-medium">{errors.experienceDoc}</p>}
                    </div>
                  </div>

                  {/* 10. Aadhar Card Number & Upload */}
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0A1D3F]">10. Aadhar Card Details *</label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        UIDAI Encrypted
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        12-Digit Aadhar Number *
                      </label>
                      <input
                        type="text"
                        name="aadharNumber"
                        placeholder="XXXX XXXX XXXX (12 digits)"
                        value={formData.aadharNumber}
                        onChange={handleChange}
                        maxLength={12}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#0A1D3F] tracking-wider focus:outline-none focus:border-[#FF8A00]"
                        required
                      />
                      {errors.aadharNumber && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.aadharNumber}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Upload Aadhar Card Copy (Front/Back) *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-white rounded-lg p-2 text-center cursor-pointer transition shadow-2xs">
                        {formData.aadharCardPreview ? (
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src={formData.aadharCardPreview}
                              alt="Aadhar Preview"
                              className="w-14 h-10 object-cover rounded border"
                            />
                            <span className="text-[11px] text-emerald-600 font-bold">Aadhar Copy Attached ✓</span>
                          </div>
                        ) : (
                          <div className="py-1 text-slate-500 flex items-center justify-center gap-2">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700">Choose Aadhar Card Image / PDF</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("aadharCard", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {errors.aadharCard && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{errors.aadharCard}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 4: CHECKOUT & VERIFICATION PAYMENT
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
                        Checkout & Faculty Verification Fee
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Review order summary & proceed to secure Razorpay checkout.
                      </p>
                    </div>
                  </div>

                  {/* Fee Breakdown Banner */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#0A1D3F] to-[#133C8B] text-white space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-indigo-200 block font-semibold">Faculty Verification & Accreditation</span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {formData.title} {formData.fullName} • {formData.coachingCourse}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-[#FF8A00]">₹{verificationFee}</span>
                        <span className="text-[9px] text-emerald-300 block font-semibold">One-time accreditation</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-300 border-t border-white/10 pt-1.5 flex items-center justify-between">
                      <span>✓ Background Verification + Faculty Portal Profile</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> 100% Secure
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#0A1D3F]">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "upi", name: "UPI & QR", icon: QrCode },
                        { id: "card", name: "Card", icon: CreditCard },
                        { id: "netbanking", name: "Net Banking", icon: Building }
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <div
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`p-2 rounded-lg border text-center cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-orange-50 border-[#FF8A00] text-[#0A1D3F] font-bold shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <Icon className={`w-4 h-4 mx-auto mb-0.5 ${isSelected ? "text-[#FF8A00]" : "text-slate-400"}`} />
                            <span className="text-[11px] block leading-tight">{pm.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* UPI QR & Apps */}
                  {paymentMethod === "upi" && (
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#0A1D3F]">
                        <span>Pay directly via UPI</span>
                        <span className="text-[#FF8A00]">Instant ID Generation</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "gpay", label: "Google Pay" },
                          { id: "phonepe", label: "PhonePe" },
                          { id: "paytm", label: "Paytm" }
                        ].map((app) => (
                          <button
                            type="button"
                            key={app.id}
                            onClick={() => setUpiApp(app.id)}
                            className={`py-1.5 px-2 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                              upiApp === app.id
                                ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {app.label}
                          </button>
                        ))}
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 p-1 rounded-md border border-slate-200 flex items-center justify-center shrink-0">
                          <QrCode className="w-14 h-14 text-[#0A1D3F]" />
                        </div>
                        <div className="text-left text-xs space-y-0.5">
                          <p className="font-bold text-[#0A1D3F]">Scan with any UPI App</p>
                          <p className="text-[10px] text-slate-500">UPI ID: kitseducation@icici</p>
                          <p className="text-[11px] font-bold text-emerald-600">Amount: ₹{verificationFee}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <div>
                        <label className="block text-xs font-bold text-[#0A1D3F] mb-1">Card Number</label>
                        <input
                          type="text"
                          defaultValue="4532 8890 1234 5678"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-[#0A1D3F] mb-1">Expiry Date</label>
                          <input
                            type="text"
                            defaultValue="12/28"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#0A1D3F] mb-1">CVV</label>
                          <input
                            type="password"
                            defaultValue="789"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "netbanking" && (
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">Select Your Bank</label>
                      <SearchableSelect
                        options={[
                          "State Bank of India (SBI)",
                          "HDFC Bank",
                          "ICICI Bank",
                          "Axis Bank",
                          "Punjab National Bank (PNB)",
                          "Bank of Baroda",
                          "Kotak Mahindra Bank"
                        ]}
                        value={selectedBank}
                        onChange={setSelectedBank}
                        placeholder="Select Bank"
                      />
                    </div>
                  )}

                  <div className="p-2.5 bg-amber-50 border border-[#FF8A00]/30 rounded-lg flex items-center justify-between text-left text-xs text-[#0A1D3F]">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug">
                        Clicking <strong>Proceed to Pay ₹{verificationFee}</strong> will open the official <strong>Razorpay Checkout Gateway</strong> (UPI, QR, Cards, NetBanking).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeRegistrationSuccess()}
                      className="text-[10px] text-slate-500 hover:text-[#FF8A00] underline font-semibold shrink-0 ml-2 cursor-pointer"
                      title="Quick Test Simulation without opening Razorpay"
                    >
                      Instant Test Bypass
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="py-2 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : step === 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 rounded-lg bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{submitting ? "Processing..." : `Proceed to Pay ₹${verificationFee}`}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
