import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const BOARDS = [
  "CBSE (Central Board of Secondary Education)",
  "ICSE / ISC Board",
  "State Board (MPBSE, UP Board, Bihar Board, RBSE, etc.)",
  "NCERT Curriculum",
  "NIOS (National Institute of Open Schooling)",
  "Other Educational Board"
];

const CLASSES = [
  "Class 6", "Class 7", "Class 8",
  "Class 9", "Class 10",
  "Class 11 (Science - PCM)", "Class 11 (Science - PCB)", "Class 11 (Commerce)", "Class 11 (Arts / Humanities)",
  "Class 12 (Science - PCM)", "Class 12 (Science - PCB)", "Class 12 (Commerce)", "Class 12 (Arts / Humanities)",
  "IIT-JEE Target Batch", "NEET-UG Target Batch", "Foundation Olympiads"
];

const STEP_DEFINITIONS = [
  { id: 1, title: "Student Info", subtitle: "Personal & Parents" },
  { id: 2, title: "Academics", subtitle: "Class & School" },
  { id: 3, title: "Addresses", subtitle: "Current & Home" },
  { id: 4, title: "Documents", subtitle: "Aadhar & Photos" },
  { id: 5, title: "Checkout & Pay", subtitle: "Fee & Admission" }
];

export const TuitionCoachingForm = ({ onBack }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 20 Required Fields State
  const [formData, setFormData] = useState({
    studentName: "",
    fatherName: "",
    motherName: "",
    dob: "",
    studentClass: "Class 10",
    studyBoard: "CBSE (Central Board of Secondary Education)",
    stateName: "Madhya Pradesh",
    district: "Bhopal",
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
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [upiApp, setUpiApp] = useState("gpay");
  const [selectedBank, setSelectedBank] = useState("State Bank of India (SBI)");
  const [registrationFee] = useState(499);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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

  const handleFileChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        [`${field}File`]: file,
        [`${field}Preview`]: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep) => {
    const errs = {};

    if (currentStep === 1) {
      if (!formData.studentName.trim()) errs.studentName = "Student Full Name is required";
      if (!formData.fatherName.trim()) errs.fatherName = "Father's Name is required";
      if (!formData.motherName.trim()) errs.motherName = "Mother's Name is required";
      if (!formData.dob) errs.dob = "Date of Birth is required";
      if (!formData.contactNo.trim() || formData.contactNo.length < 10) {
        errs.contactNo = "Valid 10-digit Contact No is required";
      }
      if (!formData.guardianContactNo.trim() || formData.guardianContactNo.length < 10) {
        errs.guardianContactNo = "Guardian Contact No is required";
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
    } else if (currentStep === 4) {
      if (!formData.aadharNumber.trim() || formData.aadharNumber.length < 12) {
        errs.aadharNumber = "Valid 12-digit Aadhar Number is required";
      }
      if (!formData.aadharCardPreview && !formData.aadharCardFile) {
        errs.aadharCard = "Please upload Aadhar Card copy";
      }
      if (!formData.passportPhotoPreview && !formData.passportPhotoFile) {
        errs.passportPhoto = "Please upload passport size photo";
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

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const completeTuitionRegistration = async (txnId) => {
    try {
      const generatedTxn = txnId || `TXN-KTS-${Date.now().toString().slice(-8)}`;
      setTransactionId(generatedTxn);

      const registeredUser = await register({
        name: formData.studentName,
        phone: formData.contactNo,
        email: formData.emailId,
        dob: formData.dob,
        state: formData.stateName,
        board: formData.studyBoard,
        class: formData.studentClass
      });

      const creds = {
        userId: registeredUser?.id || `KTS-TC-${Math.floor(100000 + Math.random() * 900000)}`,
        password: `Pass@${Math.floor(1000 + Math.random() * 9000)}`,
        applicationNo: `TC-APP-2026-${Math.floor(10000 + Math.random() * 90000)}`
      };

      setCreatedCredentials(creds);
      setIsSuccess(true);
      setStep(6);
      showSuccess("Tuition admission completed & Student ID generated!");
    } catch (err) {
      showError(err.message || "User registration failed after payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePaymentAndCreateUser = async (e) => {
    if (e) e.preventDefault();
    setSubmittingPayment(true);

    try {
      await openRazorpayCheckout({
        amountInRupees: registrationFee,
        course: {
          id: `TUITION_${formData.studentClass.replace(/\s+/g, "_")}`,
          title: `Tuition & Coaching Admission - ${formData.studentClass}`
        },
        plan: {
          name: "Annual Coaching Batch Enrollment",
          duration: "1 Year Access"
        },
        student: {
          name: formData.studentName,
          email: formData.emailId,
          phone: formData.contactNo
        },
        onSuccess: async (response) => {
          await completeTuitionRegistration(response?.razorpay_payment_id);
        },
        onFailure: (err) => {
          setSubmittingPayment(false);
          showError(err?.message || "Payment cancelled or failed.");
        },
        onDismiss: () => {
          setSubmittingPayment(false);
        }
      });
    } catch (err) {
      setSubmittingPayment(false);
      showError(err.message || "Unable to launch checkout payment gateway.");
    }
  };

  const copyText = (text, type) => {
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
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Top Banner & Header - Compact & Clean */}
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
      {!isSuccess && (
        <div className="bg-white rounded-lg border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-100 -z-0" />
            
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
                        ? "bg-[#0A1D3F] text-white ring-2 ring-orange-200 scale-105 shadow-2xs"
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
      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs">
        {/* ========================================================
            STEP 6: CREATED USER AND ID (COMPACT SUCCESS SCREEN)
           ======================================================== */}
        {isSuccess && createdCredentials ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-3.5 py-1"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="w-3 h-3" /> Payment Verified • Admission Confirmed
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] pt-0.5">
                Tuition & Coaching Account Created!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Welcome to KITSS Education, <strong>{formData.studentName}</strong>. Your coaching admission is processed.
              </p>
            </div>

            {/* Generated Login Credentials Card - Sleek with Rounded-lg */}
            <div className="p-3.5 bg-[#0A1D3F] rounded-lg text-left text-white space-y-2.5 max-w-md mx-auto shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-orange-300 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#FF8A00]" /> Student Login Credentials
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                  Active
                </span>
              </div>

              {/* User ID */}
              <div className="p-2.5 bg-white/10 rounded-md border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-blue-200 block uppercase font-medium">Student User ID</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white tracking-wide">
                    {createdCredentials.userId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(createdCredentials.userId, "userId")}
                  className="px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                >
                  {copiedUserId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUserId ? "Copied!" : "Copy ID"}</span>
                </button>
              </div>

              {/* Password */}
              <div className="p-2.5 bg-white/10 rounded-md border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-blue-200 block uppercase font-medium">Auto-Generated Password</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-[#FF8A00] tracking-wide">
                    {createdCredentials.password}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(createdCredentials.password, "password")}
                  className="px-2 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                >
                  {copiedPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPassword ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Admission Summary Breakdown - Compact */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left text-xs max-w-md mx-auto space-y-1.5 text-[#0A1D3F]">
              <div className="flex justify-between py-0.5 border-b border-slate-200/80">
                <span className="text-slate-500">Student & Parents:</span>
                <span className="font-bold">{formData.studentName} (S/O {formData.fatherName})</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200/80">
                <span className="text-slate-500">Class & Board:</span>
                <span className="font-bold">{formData.studentClass} • {formData.studyBoard.split(" ")[0]}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200/80">
                <span className="text-slate-500">Registration Fee:</span>
                <span className="font-bold text-emerald-600">₹{registrationFee} (Paid Online)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-700">{transactionId}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/login", {
                    state: {
                      userId: createdCredentials.userId,
                      password: createdCredentials.password,
                      fromRegistration: true
                    }
                  })
                }
                className="py-2.5 px-5 rounded-lg bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Now</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <form
            onSubmit={(e) => {
              if (step === 5) {
                handlePaymentAndCreateUser(e);
              } else {
                e.preventDefault();
                handleNext();
              }
            }}
            className="space-y-3.5"
          >
            <AnimatePresence mode="wait">
              {/* ========================================================
                  STEP 1: STUDENT & PARENTS (1, 2, 3, 4, 14, 15, 16, 17)
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
                        name="studentName"
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
                        name="fatherName"
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
                        name="motherName"
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
                        17. Email ID *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          name="emailId"
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
                          name="contactNo"
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
                          name="whatsappNo"
                          placeholder="+91 98765 43210"
                          value={formData.whatsappNo}
                          onChange={handleChange}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:bg-white transition"
                        />
                      </div>
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
                        name="guardianContactNo"
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
                      <SearchableSelect
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
                      <SearchableSelect
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
                        name="schoolName"
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
                      name="schoolAddress"
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
                      <SearchableSelect
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
                        name="district"
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
                      name="pincode"
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
                      name="address"
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
                      name="homeAddress"
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

                  {/* 18. Aadhar Number & Card Upload */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                    <label className="block text-xs font-bold text-[#0A1D3F]">
                      18. Aadhar Card Number & Document *
                    </label>
                    <input
                      type="text"
                      maxLength="12"
                      name="aadharNumber"
                      placeholder="12-digit Aadhar Number (e.g. 1234 5678 9012)"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] transition"
                      required
                    />
                    {errors.aadharNumber && <p className="text-[11px] text-red-500 font-medium">{errors.aadharNumber}</p>}

                    <div className="flex items-center gap-2.5">
                      <label className="flex-1 border border-dashed border-slate-300 hover:border-[#FF8A00] bg-white rounded-lg p-2.5 text-center cursor-pointer transition flex items-center justify-center gap-2 text-xs text-slate-600 font-medium shadow-2xs">
                        <UploadCloud className="w-4 h-4 text-[#FF8A00]" />
                        <span className="truncate">{formData.aadharCardFile ? formData.aadharCardFile.name : "Select Aadhar (Photo/PDF)"}</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("aadharCard", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {formData.aadharCardPreview && (
                        <img
                          src={formData.aadharCardPreview}
                          alt="Aadhar Preview"
                          className="w-12 h-9 object-cover rounded-md border border-slate-200 shadow-2xs shrink-0"
                        />
                      )}
                    </div>
                    {errors.aadharCard && <p className="text-[11px] text-red-500 font-medium">{errors.aadharCard}</p>}
                  </div>

                  {/* 19. Passport Photo & 20. Class ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 19. Passport Photo */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5 text-center">
                      <label className="block text-xs font-bold text-[#0A1D3F] text-left">
                        19. Passport Photo *
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-white rounded-lg p-2 cursor-pointer transition shadow-2xs">
                        {formData.passportPhotoPreview ? (
                          <img
                            src={formData.passportPhotoPreview}
                            alt="Passport Preview"
                            className="w-14 h-16 object-cover mx-auto rounded-md border shadow-2xs"
                          />
                        ) : (
                          <div className="py-2 text-slate-500">
                            <ImageIcon className="w-5 h-5 mx-auto mb-0.5 text-slate-400" />
                            <span className="text-xs font-semibold block text-slate-600">Upload Photo</span>
                            <span className="text-[10px] text-slate-400">JPG, PNG</span>
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

                    {/* 20. Class ID Card */}
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5 text-center">
                      <label className="block text-xs font-bold text-[#0A1D3F] text-left">
                        20. Class / School ID
                      </label>
                      <label className="block border border-dashed border-slate-300 hover:border-[#FF8A00] bg-white rounded-lg p-2 cursor-pointer transition shadow-2xs">
                        {formData.classIdCardPreview ? (
                          <img
                            src={formData.classIdCardPreview}
                            alt="ID Preview"
                            className="w-14 h-16 object-cover mx-auto rounded-md border shadow-2xs"
                          />
                        ) : (
                          <div className="py-2 text-slate-500">
                            <FileText className="w-5 h-5 mx-auto mb-0.5 text-slate-400" />
                            <span className="text-xs font-semibold block text-slate-600">Upload ID Card</span>
                            <span className="text-[10px] text-slate-400">Optional</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileChange("classIdCard", e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  STEP 5: PAYMENT & VERIFICATION
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
                        Checkout & Admission Fee Payment
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Review order summary & complete payment to activate student account and generate Student ID.
                      </p>
                    </div>
                  </div>

                  {/* Fee Breakdown Banner - Compact */}
                  <div className="p-3 rounded-lg bg-gradient-to-r from-[#0A1D3F] to-[#133C8B] text-white space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-blue-200 block font-medium">Coaching Admission Fee</span>
                        <span className="text-xs sm:text-sm font-bold text-white">{formData.studentName} • {formData.studentClass}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-[#FF8A00]">₹{registrationFee}</span>
                        <span className="text-[9px] text-emerald-300 block font-semibold">One-time enrollment</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-300 border-t border-white/10 pt-1.5 flex items-center justify-between">
                      <span>✓ Video Lectures + PDF Notes + Tests</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> 100% Secure
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#0A1D3F]">
                      Choose Payment Method
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

                  {/* UPI Apps & QR Simulator */}
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
                      onClick={() => completeTuitionRegistration()}
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
                  disabled={submittingPayment}
                  className="py-2.5 px-5 rounded-lg bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ml-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{submittingPayment ? "Processing Payment..." : `Proceed to Pay ₹${registrationFee}`}</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
