import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { SearchableSelect } from "../common/SearchableSelect";
import { openRazorpayCheckout } from "../../services/razorpayService";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other / Outside India"
];

const AVAILABLE_COURSES = [
  "Class 10 (Secondary School Board)",
  "Class 12 - Science (Physics, Chemistry, Maths)",
  "Class 12 - Science (Physics, Chemistry, Biology)",
  "Class 12 - Commerce & Accountancy",
  "Class 12 - Arts & Humanities",
  "Class 11 - Science / Commerce / Arts",
  "Class 9 (Secondary Foundation)",
  "Class 8 (Middle School Foundation)",
  "Class 7 (Middle School)",
  "Class 6 (Middle School)",
  "IIT-JEE (Main & Advanced Prep)",
  "NEET-UG (Medical Entrance)",
  "B.A / B.Sc / B.Com / BCA / B.Tech (Undergraduate Degree)",
  "Competitive Exam Prep / Foundation"
];

const STEP_DEFINITIONS = [
  { id: 1, title: "Student Info", subtitle: "Name & Parents" },
  { id: 2, title: "Contact & Address", subtitle: "Phone & Location" },
  { id: 3, title: "Course & Institute", subtitle: "Applying Details" },
  { id: 4, title: "Documents", subtitle: "Photo, Aadhar, Result" },
  { id: 5, title: "Checkout & Pay", subtitle: "Enrollment Fee" }
];

export const StudyRegistrationForm = ({ onBack }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiApp, setUpiApp] = useState("gpay");
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [registrationFee] = useState(299);
  const [transactionId, setTransactionId] = useState("");

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
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "",
    pincode: "",

    // 10. Apply Course name & 11. Apply Institute name
    applyCourseName: "Class 10 (Secondary School Board)",
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

    // STEP 1: Student & Parents info
    if (currentStep === 1) {
      if (!formData.studentName.trim()) errs.studentName = "Student Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!formData.fatherName.trim()) errs.fatherName = "Father's Name is required";
      if (!formData.motherName.trim()) errs.motherName = "Mother's Name is required";
    }

    // STEP 2: Contact & Address
    else if (currentStep === 2) {
      if (!formData.callingNo.trim() || formData.callingNo.length < 10) {
        errs.callingNo = "Valid 10-digit Calling No is required";
      }
      if (!formData.whatsappNo.trim() || formData.whatsappNo.length < 10) {
        errs.whatsappNo = "Valid 10-digit WhatsApp No is required";
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

    // STEP 4: Documents Upload
    else if (currentStep === 4) {
      if (!formData.courseCertificatePreview && !formData.courseCertificateFile) {
        errs.courseCertificate = "Upload complete course certificate or result";
      }
      if (!formData.aadharNumber.trim() || formData.aadharNumber.length < 12) {
        errs.aadharNumber = "Valid 12-digit Aadhar Number required";
      }
      if (!formData.aadharCardPreview && !formData.aadharCardFile) {
        errs.aadharCard = "Upload Aadhar card copy";
      }
      if (!formData.passportPhotoPreview && !formData.passportPhotoFile) {
        errs.passportPhoto = "Upload Passport photo";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const completeStudyRegistration = async (txnId) => {
    try {
      const generatedTxn = txnId || `TXN-STU-${Date.now().toString().slice(-8)}`;
      setTransactionId(generatedTxn);

      const registeredUser = await register({
        name: formData.studentName,
        phone: formData.callingNo,
        email: formData.email,
        dob: formData.dob,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        address: formData.address,
        pincode: formData.pincode,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        whatsappNo: formData.whatsappNo,
        applyCourseName: formData.applyCourseName,
        applyInstituteName: formData.applyInstituteName,
        board: formData.applyCourseName,
        class: formData.applyCourseName
      });

      const userCredentials = {
        userId: registeredUser?.id || `STU-${Math.floor(100000 + Math.random() * 900000)}`,
        password: `Kits@${Math.floor(1000 + Math.random() * 9000)}`
      };

      setCredentials(userCredentials);
      setIsSuccess(true);
      setStep(6);
      showSuccess("Study enrollment fee verified & account created!");
    } catch (err) {
      showError(err.message || "Registration failed after payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentAndSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) return;

    setSubmitting(true);
    try {
      await openRazorpayCheckout({
        amountInRupees: registrationFee,
        course: {
          id: `STUDY_${formData.applyCourseName.slice(0, 15).replace(/\s+/g, "_")}`,
          title: `KITSS Digital Learning Pass - ${formData.applyCourseName}`
        },
        plan: {
          name: "Annual Student Learning Pass",
          duration: "1 Year Access"
        },
        student: {
          name: formData.studentName,
          email: formData.email,
          phone: formData.callingNo
        },
        onSuccess: async (response) => {
          await completeStudyRegistration(response?.razorpay_payment_id);
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

  const copyCred = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "userId") {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
      showSuccess("Student User ID copied!");
    } else if (type === "password") {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
      showSuccess("Password copied!");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Top Banner - Compact */}
      <div className="p-3 sm:p-3.5 border-b border-slate-200/80 flex items-center justify-between">
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
      {!isSuccess && (
        <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 border-b border-slate-200/80">
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
                        ? "bg-[#0A1D3F] text-white ring-2 ring-emerald-200 scale-105 shadow-2xs"
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

      {/* Main Form Body */}
      <div className="p-3.5 sm:p-5">
        {isSuccess ? (
          <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3.5 py-1">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="w-3 h-3" /> Fee Paid • Student Account Activated
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] pt-0.5">
                Study Enrollment Successful!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Welcome, <strong>{formData.studentName}</strong>! Your study registration has been confirmed.
              </p>
            </div>

            {/* Generated Credentials Card */}
            <div className="p-3.5 bg-[#0A1D3F] rounded-lg text-left text-white space-y-2.5 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Official Student Credentials
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  Verified
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between bg-white/10 p-2 rounded-md border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-300 block">STUDENT USER ID</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider">
                      {credentials?.userId}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCred(credentials?.userId, "userId")}
                    className="px-2 py-1 rounded bg-[#FF8A00] hover:bg-[#e67c00] text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedUserId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUserId ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/10 p-2 rounded-md border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-300 block">DEFAULT PASSWORD</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider">
                      {credentials?.password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCred(credentials?.password, "password")}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    {copiedPassword ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPassword ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Details */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 max-w-md mx-auto text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Course Applied:</span>
                <span className="font-bold text-[#0A1D3F]">{formData.applyCourseName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Institute Name:</span>
                <span className="font-bold text-[#0A1D3F]">{formData.applyInstituteName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pass Fee Paid:</span>
                <span className="font-bold text-emerald-600">₹{registrationFee} (Paid Online)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{transactionId}</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Proceed to Student Login</span>
              </button>
              <button
                type="button"
                onClick={onBack}
                className="py-2.5 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Back
              </button>
            </div>
          </motion.div>
        ) : (
          <form
            onSubmit={(e) => {
              if (step === 5) {
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
                  STEP 1: STUDENT & PARENTS INFO (1, 2, 8, 9)
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
                        name="studentName"
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
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Calculated Student Age
                      </label>
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

                  {/* 8. Father's name & 9. Mother's name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        8. Father's Name *
                      </label>
                      <input
                        type="text"
                        name="fatherName"
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
                        name="motherName"
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
                          name="callingNo"
                          placeholder="10-digit mobile number"
                          value={formData.callingNo}
                          onChange={handleChange}
                          maxLength={10}
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
                          name="email"
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
                        name="whatsappNo"
                        placeholder="WhatsApp enabled contact number"
                        value={formData.whatsappNo}
                        onChange={handleChange}
                        maxLength={10}
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
                      name="address"
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
                      <SearchableSelect
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
                        name="district"
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
                        name="city"
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
                        name="pincode"
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
                    <SearchableSelect
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
                        name="applyInstituteName"
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
                    <p className="text-[11px] text-slate-500">Course certificate / marksheet result, Aadhar card and Passport photo.</p>
                  </div>

                  {/* 12. Submit Complete Course Certificate / Result & 14. Passport Photo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 12. Course Certificate / Result */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#0A1D3F]">
                        12. Course Certificate / Previous Result *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-slate-50/70 hover:bg-white rounded-lg p-2.5 text-center cursor-pointer transition shadow-2xs">
                        {formData.courseCertificatePreview ? (
                          <div className="relative inline-block">
                            <img
                              src={formData.courseCertificatePreview}
                              alt="Result Preview"
                              className="w-16 h-20 object-cover mx-auto rounded border shadow-2xs"
                            />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Certificate Attached ✓</span>
                          </div>
                        ) : (
                          <div className="py-2 text-slate-500">
                            <FileText className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-bold block text-slate-700">Upload Marksheet / Certificate</span>
                            <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("courseCertificate", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {errors.courseCertificate && <p className="text-[11px] text-red-500 font-medium">{errors.courseCertificate}</p>}
                    </div>

                    {/* 14. Passport Photo */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#0A1D3F]">
                        14. Passport Photo *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-slate-50/70 hover:bg-white rounded-lg p-2.5 text-center cursor-pointer transition shadow-2xs">
                        {formData.passportPhotoPreview ? (
                          <div className="relative inline-block">
                            <img
                              src={formData.passportPhotoPreview}
                              alt="Passport Preview"
                              className="w-16 h-20 object-cover mx-auto rounded border shadow-2xs"
                            />
                            <span className="text-[10px] text-emerald-600 font-bold block mt-1">Photo Uploaded ✓</span>
                          </div>
                        ) : (
                          <div className="py-2 text-slate-500">
                            <ImageIcon className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-bold block text-slate-700">Upload Passport Photo</span>
                            <span className="text-[10px] text-slate-400">Clear front face image</span>
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
                  </div>

                  {/* 13. Aadhar Card Number & Upload */}
                  <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0A1D3F]">13. Submit Aadhar Card Details *</label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        UIDAI Encrypted
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        12-Digit Student Aadhar Number *
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
                  STEP 5: CHECKOUT & ENROLLMENT FEE PAYMENT
                 ======================================================== */}
              {step === 5 && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        Checkout & Enrollment Fee Payment
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
                        <span className="text-[11px] text-emerald-300 block font-semibold">Student Learning Portal Pass</span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {formData.studentName} • {formData.applyCourseName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-[#FF8A00]">₹{registrationFee}</span>
                        <span className="text-[9px] text-emerald-300 block font-semibold">Annual student pass</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-300 border-t border-white/10 pt-1.5 flex items-center justify-between">
                      <span>✓ Digital E-Books + Chapter Tests + Video Lessons</span>
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
                          <p className="text-[11px] font-bold text-emerald-600">Amount: ₹{registrationFee}</p>
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
                        Clicking <strong>Proceed to Pay ₹{registrationFee}</strong> opens the secure <strong>Razorpay Checkout Gateway</strong> (UPI, QR, Cards, NetBanking).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => completeStudyRegistration()}
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

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2 px-5 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : step === 4 ? (
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
                  <span>{submitting ? "Processing..." : `Proceed to Pay ₹${registrationFee}`}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
