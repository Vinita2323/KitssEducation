import React, { useState, useEffect } from "react";
import {
  Building2,
  GraduationCap,
  User,
  UserCheck,
  Mail,
  Phone,
  PhoneCall,
  MapPin,
  Calendar,
  Globe,
  FileText,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  AlertCircle,
  X,
  Search,
  ChevronDown,
  Loader2,
  Info,
  Lock,
  FileCheck,
  Trash2,
  Compass,
  Edit3,
  Award,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { collegeService } from "../../services/collegeService";
import { useToast } from "../../context/ToastContext";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other / Outside India"
];

const INSTITUTION_TYPES = [
  "College",
  "University",
  "Institute",
  "Coaching Centre",
  "Training Centre",
  "Other"
];

const DESIGNATIONS = [
  "Director",
  "Principal",
  "Dean",
  "Admission Head",
  "Franchise Coordinator",
  "Managing Trustee",
  "Other"
];

const DEFAULT_PROGRAM_OPTIONS = [
  "Engineering & Technology",
  "Management & Business (MBA/BBA)",
  "Computer Applications & IT (BCA/MCA)",
  "Medical & Healthcare Sciences",
  "Arts, Humanities & Social Sciences",
  "Commerce & Accounting",
  "Science & Applied Research",
  "Law & Legal Studies",
  "Vocational & Skill Diplomas",
  "Design, Media & Animation"
];

const STEPS = [
  { id: 1, key: "institution", title: "Institution", subtitle: "Basic Institute Details", icon: Building2 },
  { id: 2, key: "affiliation", title: "Affiliation", subtitle: "University & Franchise", icon: GraduationCap },
  { id: 3, key: "contact", title: "Contact", subtitle: "Authorized Representative", icon: UserCheck },
  { id: 4, key: "location", title: "Location", subtitle: "Campus Address", icon: MapPin },
  { id: 5, key: "documents", title: "Documents", subtitle: "Verification Papers", icon: FileText },
];

export const CollegeFranchiseForm = ({ onBack }) => {
  const { showSuccess, showError } = useToast();

  // Current Step: 1, 2, 3, 4, 5, or 6 (Review)
  const [currentStep, setCurrentStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);

  // University & College Dynamic Data
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Dropdown UI States
  const [uniDropdownOpen, setUniDropdownOpen] = useState(false);
  const [uniSearch, setUniSearch] = useState("");
  const [colDropdownOpen, setColDropdownOpen] = useState(false);
  const [colSearch, setColSearch] = useState("");

  // Custom Course / Other input state
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customCourseInput, setCustomCourseInput] = useState("");

  // Selected Entities
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Master Form Data State
  const [formData, setFormData] = useState({
    // Step 1: Institution Details
    institutionName: "",
    institutionType: "College",
    yearEstablished: "",
    website: "",
    institutionLogo: null, // { name, size, preview }

    // Step 2: Affiliation & Franchise Details
    programsOffered: ["Engineering & Technology", "Management & Business (MBA/BBA)"],

    // Step 3: Authorized Contact
    contactPerson: "",
    designation: "Director",
    email: "",
    mobile: "",
    alternateMobile: "",

    // Step 4: Campus Location
    address: "",
    city: "",
    state: "Delhi",
    pincode: "",
    googleMapsLocation: "",

    // Step 5: Documents & Verification
    documents: {
      registrationCert: null,
      affiliationCert: null,
      authLetter: null,
      panGstCert: null,
    },

    // Review & Agreement
    agreedToTerms: false,
  });

  // Step-level inline errors
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // 1. Fetch active approved universities on mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const data = await collegeService.getUniversities({ status: "active" });
        setUniversities(data || []);
      } catch (err) {
        console.error("Failed to load universities", err);
      } finally {
        setLoadingUniversities(false);
      }
    };
    fetchUniversities();
  }, []);

  // 2. Fetch colleges when selected University changes
  useEffect(() => {
    if (!selectedUniversity) {
      setColleges([]);
      setSelectedCollege(null);
      return;
    }

    const fetchColleges = async () => {
      try {
        setLoadingColleges(true);
        setSelectedCollege(null);
        const uniId = selectedUniversity._id || selectedUniversity.id;
        const data = await collegeService.getCollegesByUniversity(uniId, {
          status: "active",
        });
        setColleges(data || []);
      } catch (err) {
        console.error("Failed to load colleges for university", err);
      } finally {
        setLoadingColleges(false);
      }
    };
    fetchColleges();
  }, [selectedUniversity]);

  // Generic field change handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Program multi-select toggle
  const toggleProgram = (prog) => {
    setFormData((prev) => {
      const exists = prev.programsOffered.includes(prog);
      const updated = exists
        ? prev.programsOffered.filter((p) => p !== prog)
        : [...prev.programsOffered, prog];
      return { ...prev, programsOffered: updated };
    });
  };

  // Add custom user-entered course
  const handleAddCustomCourse = (e) => {
    e?.preventDefault();
    const trimmed = customCourseInput.trim();
    if (!trimmed) return;

    if (formData.programsOffered.includes(trimmed)) {
      showError("This course is already added.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      programsOffered: [...prev.programsOffered, trimmed],
    }));
    setCustomCourseInput("");
    showSuccess(`Added "${trimmed}" to courses offered`);
  };

  // Remove custom or selected course
  const removeCustomCourse = (prog) => {
    setFormData((prev) => ({
      ...prev,
      programsOffered: prev.programsOffered.filter((p) => p !== prog),
    }));
  };

  // Document file handler
  const handleFileUpload = (docKey, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("File size exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [docKey]: {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            type: file.type,
            dataUrl: e.target.result,
          },
        },
      }));
      showSuccess(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Remove document
  const removeDocument = (docKey) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: null,
      },
    }));
  };

  // Logo file upload handler
  const handleLogoUpload = (file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showError("Logo image size exceeds 3MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        institutionLogo: {
          name: file.name,
          preview: e.target.result,
          size: (file.size / 1024).toFixed(1) + " KB",
        },
      }));
      showSuccess("Institution logo attached.");
    };
    reader.readAsDataURL(file);
  };

  // Step Validation Logic
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.institutionName.trim()) {
        newErrors.institutionName = "Institution / College Name is required.";
      }
      if (!formData.institutionType) {
        newErrors.institutionType = "Please select the institution type.";
      }
      if (formData.yearEstablished && (!/^\d{4}$/.test(formData.yearEstablished) || Number(formData.yearEstablished) < 1850 || Number(formData.yearEstablished) > 2026)) {
        newErrors.yearEstablished = "Please enter a valid 4-digit year (e.g. 2012).";
      }
    }

    if (step === 2) {
      if (!selectedUniversity) {
        newErrors.university = "Please select an approved University / Franchise Provider.";
      }
      if (!selectedCollege) {
        newErrors.college = "Please select an authorized College / Institute.";
      }
      if (formData.programsOffered.length === 0) {
        newErrors.programs = "Please select or add at least one course/program.";
      }
    }

    if (step === 3) {
      if (!formData.contactPerson.trim()) {
        newErrors.contactPerson = "Authorized Contact Person Name is required.";
      }
      if (!formData.designation) {
        newErrors.designation = "Please specify the official designation.";
      }
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "A valid official email address is required.";
      }
      const rawMobile = formData.mobile.replace(/\D/g, "");
      if (!rawMobile || rawMobile.length < 10) {
        newErrors.mobile = "A valid 10-digit mobile number is required.";
      }
    }

    if (step === 4) {
      if (!formData.address.trim()) {
        newErrors.address = "Complete campus address is required.";
      }
      if (!formData.city.trim()) {
        newErrors.city = "City is required.";
      }
      if (!formData.state.trim()) {
        newErrors.state = "State is required.";
      }
      const rawPin = formData.pincode.replace(/\D/g, "");
      if (!rawPin || rawPin.length < 6) {
        newErrors.pincode = "A valid 6-digit postal pincode is required.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Next step transition
  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      const next = currentStep + 1;
      setCurrentStep(next);
      if (next > highestStepReached) {
        setHighestStepReached(next);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Previous step transition
  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onBack?.();
    }
  };

  // Direct step jump from Stepper or Review screen
  const jumpToStep = (targetStep) => {
    if (targetStep <= highestStepReached || targetStep <= currentStep || targetStep === 6) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Final Form Submission
  const handleSubmitApplication = async (e) => {
    e?.preventDefault();

    if (!formData.agreedToTerms) {
      setErrors({ agreement: "Please accept the franchise declaration and terms of partnership." });
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const payload = {
        universityId: selectedUniversity?._id || selectedUniversity?.id,
        collegeId: selectedCollege?._id || selectedCollege?.id,
        institutionName: formData.institutionName.trim() || selectedCollege?.name || "",
        institutionType: formData.institutionType,
        yearEstablished: formData.yearEstablished,
        website: formData.website.trim(),
        institutionLogo: formData.institutionLogo?.preview || "",
        programsOffered: formData.programsOffered,
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation,
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        alternateMobile: formData.alternateMobile.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        googleMapsLocation: formData.googleMapsLocation.trim(),
        documents: {
          registrationCert: formData.documents.registrationCert?.name || "",
          affiliationCert: formData.documents.affiliationCert?.name || "",
          authLetter: formData.documents.authLetter?.name || "",
          panGstCert: formData.documents.panGstCert?.name || "",
        },
      };

      const result = await collegeService.submitFranchiseRegistration(payload);

      setSuccessData({
        applicationId: result.applicationId,
        universityName: selectedUniversity?.name || "University Partner",
        universityShort: selectedUniversity?.shortName || "UNIV",
        collegeName: selectedCollege?.name || formData.institutionName || "Partner College",
        collegeCode: selectedCollege?.code || "N/A",
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        state: formData.state,
      });

      showSuccess("Franchise application submitted successfully for Admin review!");
    } catch (err) {
      console.error("Submission failed:", err);
      setErrors({ submit: err.message || "Failed to submit application. Please try again." });
      showError(err.message || "Submission error");
    } finally {
      setSubmitting(false);
    }
  };

  const copyApplicationId = () => {
    if (!successData?.applicationId) return;
    navigator.clipboard.writeText(successData.applicationId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    showSuccess("Application Reference ID copied!");
  };

  // Filtered dropdown lists for search
  const filteredUniversities = universities.filter(
    (u) =>
      u.name?.toLowerCase().includes(uniSearch.toLowerCase()) ||
      u.shortName?.toLowerCase().includes(uniSearch.toLowerCase())
  );

  const filteredColleges = colleges.filter(
    (c) =>
      c.name?.toLowerCase().includes(colSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(colSearch.toLowerCase()) ||
      c.code?.toLowerCase().includes(colSearch.toLowerCase())
  );

  // ========================================================
  // VIEW: SUCCESS / CONFIRMATION SCREEN
  // ========================================================
  if (successData) {
    return (
      <div className="bg-white p-5 sm:p-7 rounded-md border border-[#E2E8F0] shadow-md max-w-xl mx-auto text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto shadow-2xs">
          <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            Status: Pending Admin Approval
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0A1D3F] tracking-tight">
            Franchise Application Received
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-[#0A1D3F]">{successData.contactPerson}</strong> ({successData.designation}). Your institutional franchise request has been submitted to the Admin Verification Desk.
          </p>
        </div>

        {/* Application Reference ID Box */}
        <div className="p-4 bg-[#0A1D3F] rounded-md text-white text-left space-y-1.5 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-[#FF8A00] tracking-wider">
            Application Reference ID
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg sm:text-xl font-mono font-bold tracking-wider text-white">
              {successData.applicationId}
            </span>
            <button
              type="button"
              onClick={copyApplicationId}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hierarchy Placement Summary */}
        <div className="p-4 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
            Institutional Hierarchy Mapping
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <div className="w-7 h-7 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center shrink-0 font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block font-medium">Franchise Provider University</span>
              <span className="font-bold text-sm text-[#0A1D3F]">
                {successData.universityName} ({successData.universityShort})
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-[#EDF2F7]">
            <div className="w-7 h-7 rounded-lg bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center shrink-0 font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block font-medium">Applicant Institution / College</span>
              <span className="font-bold text-sm text-[#0A1D3F] block">
                {successData.collegeName}
              </span>
              <span className="text-[11px] text-[#64748B]">
                {successData.city}, {successData.state} • Code: {successData.collegeCode}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Timeline */}
        <div className="p-3.5 rounded-md bg-blue-50/70 border border-blue-100 text-left text-xs text-[#1E3A8A] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-xs text-[#0A1D3F]">
            <Info className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>Next Steps for Approval</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            1. <strong>Institutional Audit:</strong> Admin verifies your credentials and university franchise authorization.
          </p>
          <p className="text-[11px] leading-relaxed">
            2. <strong>Direct Verification Call:</strong> Verification officer will contact <strong>{successData.mobile}</strong> ({successData.email}).
          </p>
          <p className="text-[11px] leading-relaxed">
            3. <strong>Portal Credentials:</strong> Institutional franchise dashboard access will be activated upon MOU completion.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <span>Back to Registration</span>
          </button>
          <a
            href="/"
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-semibold text-[#0A1D3F] hover:bg-gray-100 rounded-md transition border border-[#E2E8F0] text-center"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  // ========================================================
  // VIEW: 5-STEP FORM + REVIEW SCREEN
  // ========================================================
  return (
    <div className="bg-white p-4 sm:p-6 lg:p-7 rounded-md border border-[#E2E8F0] shadow-md max-w-2xl sm:max-w-3xl mx-auto text-left transition-all">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5 mb-4">
        <button
          type="button"
          onClick={handleBackStep}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0A1D3F] hover:text-[#FF8A00] transition group cursor-pointer"
        >
          <div className="p-1 rounded-md bg-[#F8FAFC] group-hover:bg-[#FFF7ED] text-[#0A1D3F] group-hover:text-[#FF8A00] transition">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          <span>{currentStep === 1 ? "Back to Registration Options" : "Back to Previous Step"}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFF7ED] border border-[#FF8A00]/20 text-[#FF8A00] text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Franchise Network
        </span>
      </div>

      {/* Main Header */}
      <div className="text-center mb-5">
        <h1 className="text-lg sm:text-xl font-bold text-[#0A1D3F] tracking-tight">
          Franchise Registration
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-md mx-auto">
          Register your institution to join the verified franchise network.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        {/* Desktop / Tablet Horizontal Stepper */}
        <div className="hidden sm:flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#E2E8F0] -z-0" />
          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isClickable = step.id <= highestStepReached || currentStep === 6;

            return (
              <div
                key={step.id}
                onClick={() => isClickable && jumpToStep(step.id)}
                className={`flex flex-col items-center relative z-10 ${
                  isClickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    isCompleted
                      ? "bg-[#0A1D3F] text-white shadow-xs"
                      : isActive
                      ? "bg-[#FF8A00] text-white ring-4 ring-[#FF8A00]/20 shadow-xs"
                      : "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.id}
                </div>
                <span
                  className={`text-[11px] mt-1.5 font-medium transition-colors ${
                    isActive
                      ? "text-[#FF8A00] font-bold"
                      : isCompleted
                      ? "text-[#0A1D3F] font-semibold"
                      : "text-[#94A3B8]"
                  }`}
                >
                  {step.id} {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Stepper Header & Progress Bar */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#0A1D3F]">
              {currentStep <= 5 ? `Step ${currentStep} of 5:` : "Final Step:"}{" "}
              <span className="text-[#FF8A00]">
                {currentStep <= 5 ? STEPS[currentStep - 1].title : "Review Application"}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {currentStep <= 5 ? `${Math.round((currentStep / 5) * 100)}% Complete` : "Ready to Submit"}
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="bg-gradient-to-r from-[#0A1D3F] to-[#FF8A00] h-full transition-all duration-300 rounded-full"
              style={{
                width: `${currentStep <= 5 ? (currentStep / 5) * 100 : 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Global Form Error Message if any */}
      {errors.submit && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-[#D92D20] font-medium flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div>{errors.submit}</div>
        </div>
      )}

      {/* ========================================================
          STEP 1: INSTITUTION DETAILS
         ======================================================== */}
      {currentStep === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 1: Institution Details</span>
          </div>

          <div className="space-y-3.5">
            {/* Institution / College Name * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Institution / College Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => handleInputChange("institutionName", e.target.value)}
                  placeholder="e.g. Apex Institute of Technology & Management"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                    errors.institutionName ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.institutionName && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.institutionName}</p>
              )}
            </div>

            {/* 2-Column Grid: Institution Type * & Year Established */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Institution Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.institutionType}
                    onChange={(e) => handleInputChange("institutionType", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    {INSTITUTION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Year Established <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => handleInputChange("yearEstablished", e.target.value)}
                    placeholder="e.g. 2012"
                    min="1850"
                    max="2026"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.yearEstablished ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.yearEstablished && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.yearEstablished}</p>
                )}
              </div>
            </div>

            {/* Official Website */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Official Website <span className="text-[#64748B] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://institution.edu.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                />
              </div>
            </div>

            {/* Institution Logo Upload (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Institution Logo <span className="text-[#64748B] font-normal">(Optional — PNG/JPG up to 3MB)</span>
              </label>
              {formData.institutionLogo ? (
                <div className="flex items-center justify-between p-3 rounded-md bg-[#F8FAFC] border border-[#CBD5E1]">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.institutionLogo.preview}
                      alt="Logo Preview"
                      className="w-10 h-10 object-contain rounded-lg border border-[#E2E8F0] bg-white p-1"
                    />
                    <div>
                      <span className="text-xs font-bold text-[#0A1D3F] block truncate max-w-[200px]">
                        {formData.institutionLogo.name}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {formData.institutionLogo.size}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange("institutionLogo", null)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-md p-3.5 flex flex-col items-center justify-center gap-1.5 bg-[#F8FAFC] hover:bg-[#FFF7ED]/30 cursor-pointer transition">
                  <UploadCloud className="w-6 h-6 text-[#64748B]" />
                  <span className="text-xs font-semibold text-[#0A1D3F]">
                    Click or drag & drop institution logo
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    Square format recommended (1:1 aspect ratio)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Affiliation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STEP 2: AFFILIATION & FRANCHISE DETAILS
         ======================================================== */}
      {currentStep === 2 && (
        <motion.div
          key="step-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 2: University Affiliation & Programs Offered</span>
          </div>

          <div className="space-y-3.5">
            {/* Field 1: Select University / Franchise Provider * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Select University / Franchise Provider <span className="text-red-500">*</span>
              </label>

              {loadingUniversities ? (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF8A00]" />
                  <span>Loading approved Universities...</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setUniDropdownOpen(!uniDropdownOpen)}
                    className={`w-full p-2.5 rounded-md bg-white border ${
                      errors.university ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } flex items-center justify-between cursor-pointer hover:border-[#FF8A00] transition`}
                  >
                    {selectedUniversity ? (
                      <div className="flex items-center gap-2.5 truncate">
                        {selectedUniversity.logo ? (
                          <img
                            src={selectedUniversity.logo}
                            alt=""
                            className="w-6 h-6 rounded-md object-cover border border-[#E2E8F0] shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-[#0A1D3F] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                            {selectedUniversity.shortName || "U"}
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#0A1D3F] truncate">
                          {selectedUniversity.name} ({selectedUniversity.shortName})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">
                        -- Select Approved University / Franchise Provider --
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${uniDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {uniDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-md border border-[#CBD5E1] shadow-xl p-2 space-y-1.5 max-h-56 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search University..."
                          value={uniSearch}
                          onChange={(e) => setUniSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        {filteredUniversities.length === 0 ? (
                          <div className="p-2 text-center text-xs text-[#94A3B8]">
                            No universities found
                          </div>
                        ) : (
                          filteredUniversities.map((uni) => (
                            <div
                              key={uni._id || uni.id}
                              onClick={() => {
                                setSelectedUniversity(uni);
                                setUniDropdownOpen(false);
                                setUniSearch("");
                                if (errors.university) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.university;
                                    return next;
                                  });
                                }
                              }}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                                selectedUniversity?._id === uni._id || selectedUniversity?.id === uni.id
                                  ? "bg-[#FFF7ED] text-[#FF8A00] font-bold"
                                  : "hover:bg-[#F8FAFC] text-[#0A1D3F]"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-5 h-5 rounded bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {uni.shortName || "U"}
                                </div>
                                <span className="truncate">{uni.name}</span>
                              </div>
                              <span className="text-[10px] text-[#64748B] uppercase font-semibold shrink-0 ml-2">
                                {uni.shortName}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {errors.university && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.university}</p>
              )}
            </div>

            {/* Field 2: Select College / Institute * (Dependent on University) */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Select College / Institute <span className="text-red-500">*</span>
              </label>

              {!selectedUniversity ? (
                <div className="p-3 rounded-md bg-gray-50 border border-dashed border-[#CBD5E1] text-xs text-[#64748B] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>Please select a University / Franchise Provider above first to view authorized colleges.</span>
                </div>
              ) : loadingColleges ? (
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#F8FAFC] border border-[#CBD5E1] text-xs text-[#64748B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF8A00]" />
                  <span>Loading affiliated colleges for {selectedUniversity.shortName}...</span>
                </div>
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setColDropdownOpen(!colDropdownOpen)}
                    className={`w-full p-2.5 rounded-md bg-white border ${
                      errors.college ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } flex items-center justify-between cursor-pointer hover:border-[#FF8A00] transition`}
                  >
                    {selectedCollege ? (
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className="w-4 h-4 text-[#FF8A00] shrink-0" />
                        <span className="text-xs font-bold text-[#0A1D3F] truncate">
                          {selectedCollege.name}
                        </span>
                        <span className="text-[10px] text-[#64748B] shrink-0">
                          ({selectedCollege.city}, {selectedCollege.state})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">
                        -- Select College under {selectedUniversity.shortName} --
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${colDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {colDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-md border border-[#CBD5E1] shadow-xl p-2 space-y-1.5 max-h-56 overflow-y-auto">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search college name or city..."
                          value={colSearch}
                          onChange={(e) => setColSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        {filteredColleges.length === 0 ? (
                          <div className="p-2 text-center text-xs text-[#94A3B8]">
                            No affiliated colleges found under this university
                          </div>
                        ) : (
                          filteredColleges.map((col) => (
                            <div
                              key={col._id || col.id}
                              onClick={() => {
                                setSelectedCollege(col);
                                setColDropdownOpen(false);
                                setColSearch("");
                                if (errors.college) {
                                  setErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.college;
                                    return next;
                                  });
                                }
                              }}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                                selectedCollege?._id === col._id || selectedCollege?.id === col.id
                                  ? "bg-[#FFF7ED] text-[#FF8A00] font-bold"
                                  : "hover:bg-[#F8FAFC] text-[#0A1D3F]"
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-semibold block truncate">{col.name}</span>
                                <span className="text-[10px] text-[#64748B]">
                                  {col.city}, {col.state} • Code: {col.code || "N/A"}
                                </span>
                              </div>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 ml-2" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {errors.college && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.college}</p>
              )}
            </div>

            {/* Programs / Courses Offered (Multi-Select Chips + Custom "+ Other" Course Adder) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#0A1D3F]">
                  Programs / Courses Offered <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#64748B] font-medium">
                  {formData.programsOffered.length} selected
                </span>
              </div>

              {/* Programs Pill Selector */}
              <div className="p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {/* Standard predefined course pills */}
                  {DEFAULT_PROGRAM_OPTIONS.map((prog) => {
                    const isSelected = formData.programsOffered.includes(prog);
                    return (
                      <button
                        key={prog}
                        type="button"
                        onClick={() => toggleProgram(prog)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#0A1D3F] text-white shadow-2xs"
                            : "bg-white text-[#475569] border border-[#CBD5E1] hover:border-[#FF8A00]"
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-[#FF8A00]" /> : null}
                        <span>{prog}</span>
                      </button>
                    );
                  })}

                  {/* Custom user-added courses */}
                  {formData.programsOffered
                    .filter((p) => !DEFAULT_PROGRAM_OPTIONS.includes(p))
                    .map((customProg) => (
                      <span
                        key={customProg}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FF8A00] text-white flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-white" />
                        <span>{customProg}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomCourse(customProg);
                          }}
                          className="hover:bg-black/20 rounded-full p-0.5 transition cursor-pointer"
                          title="Remove this course"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                  {/* "+ Other" Button toggle */}
                  <button
                    type="button"
                    onClick={() => setShowOtherInput(!showOtherInput)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      showOtherInput
                        ? "bg-[#FFF7ED] text-[#FF8A00] border border-[#FF8A00]"
                        : "bg-white text-[#FF8A00] border border-dashed border-[#FF8A00] hover:bg-[#FFF7ED]/50"
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Other Course</span>
                  </button>
                </div>

                {/* Inline input for custom "+ Other" course */}
                {showOtherInput && (
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#0A1D3F] block">
                      Add Custom / Other Course or Program Name:
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customCourseInput}
                        onChange={(e) => setCustomCourseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomCourse();
                          }
                        }}
                        placeholder="e.g. Hotel Management, Aviation & Logistics, Data Science..."
                        className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCourse}
                        disabled={!customCourseInput.trim()}
                        className="py-2 px-3.5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] disabled:opacity-50 text-white text-xs font-semibold shrink-0 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherInput(false);
                          setCustomCourseInput("");
                        }}
                        className="p-2 text-[#64748B] hover:text-[#0A1D3F] rounded-lg hover:bg-gray-100 transition cursor-pointer"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.programs && (
                <p className="text-[11px] text-red-500 font-medium">{errors.programs}</p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Contact</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STEP 3: AUTHORIZED CONTACT
         ======================================================== */}
      {currentStep === 3 && (
        <motion.div
          key="step-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <UserCheck className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 3: Authorized Representative Details</span>
          </div>

          <div className="space-y-3.5">
            {/* 2-Column: Authorized Person Name * & Designation * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Authorized Person Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.contactPerson ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.contactPerson && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Official Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.designation}
                    onChange={(e) => handleInputChange("designation", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    {DESIGNATIONS.map((desig) => (
                      <option key={desig} value={desig}>
                        {desig}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Official Email Address * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Official Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="director@institution.edu.in"
                  className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                    errors.email ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.email}</p>
              )}
            </div>

            {/* 2-Column: Mobile Number * & Alternate Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    placeholder="10-digit mobile"
                    maxLength={14}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs bg-white border ${
                      errors.mobile ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                    } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Alternate Contact <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.alternateMobile}
                    onChange={(e) => handleInputChange("alternateMobile", e.target.value)}
                    placeholder="Landline or mobile"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Campus Location</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STEP 4: CAMPUS LOCATION
         ======================================================== */}
      {currentStep === 4 && (
        <motion.div
          key="step-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 4: Campus Location & Physical Address</span>
          </div>

          <div className="space-y-3.5">
            {/* Complete Campus Address * */}
            <div>
              <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                Complete Campus Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Building Name, Sector / Area, Road, Landmark..."
                  className={`w-full p-2.5 text-xs bg-white border ${
                    errors.address ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
              </div>
              {errors.address && (
                <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.address}</p>
              )}
            </div>

            {/* 3-Column: City *, State *, Pincode * */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="e.g. Pune"
                  className={`w-full px-3 py-2.5 text-xs bg-white border ${
                    errors.city ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
                {errors.city && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition cursor-pointer appearance-none"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A1D3F] mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={6}
                  className={`w-full px-3 py-2.5 text-xs bg-white border ${
                    errors.pincode ? "border-red-400 bg-red-50/20" : "border-[#CBD5E1]"
                  } rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition`}
                />
                {errors.pincode && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Optional Campus Google Maps Location */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#0A1D3F]">
                  Campus Google Maps Location <span className="text-[#64748B] font-normal">(Optional)</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <Compass className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={formData.googleMapsLocation}
                  onChange={(e) => handleInputChange("googleMapsLocation", e.target.value)}
                  placeholder="e.g. https://maps.google.com/?q=... or campus coordinates"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#CBD5E1] rounded-md text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00] focus:ring-2 focus:ring-[#FF8A00]/15 transition"
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STEP 5: DOCUMENTS & VERIFICATION
         ======================================================== */}
      {currentStep === 5 && (
        <motion.div
          key="step-5"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#0A1D3F] font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4 text-[#FF8A00]" />
            <span>Step 5: Institutional Documents & Verification</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Doc 1: Registration Certificate */}
            <div className="p-3.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0A1D3F]">
                  Institution Registration Certificate
                </span>
                <FileCheck className="w-4 h-4 text-[#FF8A00]" />
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight">
                Govt. recognition / Trust / Society incorporation certificate.
              </p>

              {formData.documents.registrationCert ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="truncate text-[11px] font-semibold text-emerald-800">
                    {formData.documents.registrationCert.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("registrationCert")}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-lg p-2.5 flex items-center justify-center gap-2 bg-white hover:bg-[#FFF7ED]/30 cursor-pointer transition text-xs font-semibold text-[#0A1D3F]">
                  <UploadCloud className="w-4 h-4 text-[#64748B]" />
                  <span>Attach PDF / Image</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload("registrationCert", e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Doc 2: Affiliation / Recognition Certificate */}
            <div className="p-3.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0A1D3F]">
                  Affiliation / Recognition Certificate
                </span>
                <Award className="w-4 h-4 text-[#FF8A00]" />
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight">
                UGC / AICTE / State Board approval letter or franchise license.
              </p>

              {formData.documents.affiliationCert ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="truncate text-[11px] font-semibold text-emerald-800">
                    {formData.documents.affiliationCert.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("affiliationCert")}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-lg p-2.5 flex items-center justify-center gap-2 bg-white hover:bg-[#FFF7ED]/30 cursor-pointer transition text-xs font-semibold text-[#0A1D3F]">
                  <UploadCloud className="w-4 h-4 text-[#64748B]" />
                  <span>Attach PDF / Image</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload("affiliationCert", e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Doc 3: Authorization Letter */}
            <div className="p-3.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0A1D3F]">
                  Authorization Letter
                </span>
                <FileText className="w-4 h-4 text-[#FF8A00]" />
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight">
                Letter authorizing the representative to act on behalf of the institute.
              </p>

              {formData.documents.authLetter ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="truncate text-[11px] font-semibold text-emerald-800">
                    {formData.documents.authLetter.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("authLetter")}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-lg p-2.5 flex items-center justify-center gap-2 bg-white hover:bg-[#FFF7ED]/30 cursor-pointer transition text-xs font-semibold text-[#0A1D3F]">
                  <UploadCloud className="w-4 h-4 text-[#64748B]" />
                  <span>Attach PDF / Image</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload("authLetter", e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Doc 4: PAN / GST Certificate */}
            <div className="p-3.5 rounded-md border border-[#CBD5E1] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0A1D3F]">
                  PAN / GST Certificate
                </span>
                <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
              </div>
              <p className="text-[10px] text-[#64748B] leading-tight">
                Tax identification or GST certificate of the institution/entity.
              </p>

              {formData.documents.panGstCert ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="truncate text-[11px] font-semibold text-emerald-800">
                    {formData.documents.panGstCert.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("panGstCert")}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-[#CBD5E1] hover:border-[#FF8A00] rounded-lg p-2.5 flex items-center justify-center gap-2 bg-white hover:bg-[#FFF7ED]/30 cursor-pointer transition text-xs font-semibold text-[#0A1D3F]">
                  <UploadCloud className="w-4 h-4 text-[#64748B]" />
                  <span>Attach PDF / Image</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload("panGstCert", e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="py-2.5 px-5 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <span>Review Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================
          STEP 6: REVIEW APPLICATION SCREEN
         ======================================================== */}
      {currentStep === 6 && (
        <motion.div
          key="step-review"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="p-3.5 bg-gradient-to-r from-[#0A1D3F] to-[#133C8B] text-white rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF8A00]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Review Your Franchise Application
              </span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
              Final Verification
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Section 1: Institution Details */}
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F]">
                  <Building2 className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>1. Institution Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(1)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#64748B] block">Institution Name:</span>
                  <strong className="text-[#0A1D3F]">
                    {formData.institutionName || selectedCollege?.name || "Not specified"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Type & Established:</span>
                  <strong className="text-[#0A1D3F]">
                    {formData.institutionType} {formData.yearEstablished ? `(Est. ${formData.yearEstablished})` : ""}
                  </strong>
                </div>
                {formData.website && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-[#64748B] block">Website:</span>
                    <a href={formData.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      {formData.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Affiliation & Hierarchy */}
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>2. Affiliation & Franchise Hierarchy</span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(2)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#64748B] block">Approved University:</span>
                  <strong className="text-[#0A1D3F]">
                    {selectedUniversity?.name} ({selectedUniversity?.shortName})
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Affiliated College:</span>
                  <strong className="text-[#0A1D3F]">
                    {selectedCollege?.name}
                  </strong>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[#64748B] block mb-1">Programs / Courses Offered ({formData.programsOffered.length}):</span>
                  <div className="flex flex-wrap gap-1">
                    {formData.programsOffered.map((prog, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[10px] text-[#0A1D3F] font-medium">
                        {prog}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Authorized Contact */}
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F]">
                  <UserCheck className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>3. Authorized Representative</span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(3)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#64748B] block">Representative Name:</span>
                  <strong className="text-[#0A1D3F]">
                    {formData.contactPerson} ({formData.designation})
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Email Address:</span>
                  <strong className="text-[#0A1D3F]">
                    {formData.email}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Mobile Number:</span>
                  <strong className="text-[#0A1D3F]">
                    {formData.mobile} {formData.alternateMobile ? `| Alt: ${formData.alternateMobile}` : ""}
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 4: Campus Location */}
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F]">
                  <MapPin className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>4. Campus Location</span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(4)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="text-[11px]">
                <span className="text-[#64748B] block">Address:</span>
                <strong className="text-[#0A1D3F] block">
                  {formData.address}
                </strong>
                <span className="text-[#64748B] text-[10px]">
                  {formData.city}, {formData.state} - {formData.pincode}
                </span>
              </div>
            </div>

            {/* Section 5: Documents */}
            <div className="p-3.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 font-bold text-[#0A1D3F]">
                  <FileText className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>5. Uploaded Documents</span>
                </div>
                <button
                  type="button"
                  onClick={() => jumpToStep(5)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF8A00] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-[#64748B]">Registration Cert: </span>
                  <strong className={formData.documents.registrationCert ? "text-emerald-700" : "text-[#94A3B8]"}>
                    {formData.documents.registrationCert ? "Attached" : "Not uploaded"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Affiliation Cert: </span>
                  <strong className={formData.documents.affiliationCert ? "text-emerald-700" : "text-[#94A3B8]"}>
                    {formData.documents.affiliationCert ? "Attached" : "Not uploaded"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">Authorization Letter: </span>
                  <strong className={formData.documents.authLetter ? "text-emerald-700" : "text-[#94A3B8]"}>
                    {formData.documents.authLetter ? "Attached" : "Not uploaded"}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B]">PAN / GST: </span>
                  <strong className={formData.documents.panGstCert ? "text-emerald-700" : "text-[#94A3B8]"}>
                    {formData.documents.panGstCert ? "Attached" : "Not uploaded"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Agreement Checkbox */}
          <div className="p-3 rounded-md bg-[#FFF7ED] border border-[#FF8A00]/20 space-y-1">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreedToTerms}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, agreedToTerms: e.target.checked }));
                  if (errors.agreement) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.agreement;
                      return next;
                    });
                  }
                }}
                className="mt-0.5 rounded border-[#CBD5E1] text-[#FF8A00] focus:ring-[#FF8A00] cursor-pointer"
              />
              <span className="text-xs text-[#0A1D3F] leading-snug">
                I hereby declare that the information and documents submitted above are accurate and authorized. I agree to KITSS Education's verified franchise code of conduct.
              </span>
            </label>
            {errors.agreement && (
              <p className="text-[11px] text-red-500 font-medium pl-6">{errors.agreement}</p>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleBackStep}
              className="w-full sm:w-auto py-2.5 px-4 rounded-md text-xs font-semibold text-[#64748B] hover:text-[#0A1D3F] hover:bg-[#F8FAFC] transition cursor-pointer text-center"
            >
              Back to Documents
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitApplication}
              className="w-full sm:w-auto py-3 px-6 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Submitting Franchise Application...</span>
                </>
              ) : (
                <>
                  <span>Submit Franchise Application</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
