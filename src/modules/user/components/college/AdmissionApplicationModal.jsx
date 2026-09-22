import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Building2,
  GraduationCap,
  User,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton, SecondaryButton } from "../common/PrimaryButton";

export const AdmissionApplicationModal = ({
  isOpen,
  onClose,
  preselectedCollegeId = "",
  preselectedCourseId = "",
  onSuccess
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data lists
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);

  // Form state
  const [selectedCollegeId, setSelectedCollegeId] = useState(preselectedCollegeId);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId);

  const [studentDetails, setStudentDetails] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    dob: "",
    city: "",
    educationalQualification: "12th Standard / Intermediate",
    passingYear: "2025",
    additionalInfo: "",
  });

  // Success result
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initialize data and pre-fill user profile
  useEffect(() => {
    if (!isOpen) return;

    // Reset steps if opening fresh
    if (!submissionResult) {
      setStep(preselectedCollegeId && preselectedCourseId ? 3 : preselectedCollegeId ? 2 : 1);
    }

    if (preselectedCollegeId) setSelectedCollegeId(preselectedCollegeId);
    if (preselectedCourseId) setSelectedCourseId(preselectedCourseId);

    // Pre-fill user profile
    if (user) {
      setStudentDetails((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        mobileNumber: prev.mobileNumber || user.phone || "",
        email: prev.email || user.email || "",
        dob: prev.dob || user.dob || "2008-05-14",
        city: prev.city || user.city || "New Delhi",
      }));
    }

    // Fetch colleges
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const data = await collegeService.getColleges();
        setColleges(data);
      } catch (err) {
        console.error("Error loading colleges for modal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, [isOpen, preselectedCollegeId, preselectedCourseId, user]);

  // Load courses whenever selectedCollegeId changes
  useEffect(() => {
    if (!selectedCollegeId) {
      setCourses([]);
      return;
    }
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const college = await collegeService.getCollegeById(selectedCollegeId);
        setCourses(college?.courses || []);
      } catch (err) {
        console.error("Error loading courses for selected college:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedCollegeId]);

  if (!isOpen) return null;

  const selectedCollege = colleges.find(
    (c) => String(c._id || c.id) === String(selectedCollegeId)
  );
  const selectedCourse = courses.find(
    (crs) => String(crs._id || crs.id) === String(selectedCourseId)
  );

  const handleInputChange = (field, value) => {
    setStudentDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedCollegeId) {
        showError("Please select a partner college.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCourseId) {
        showError("Please select a course to apply for.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!studentDetails.fullName.trim()) {
        showError("Please enter your full name.");
        return;
      }
      if (!studentDetails.mobileNumber.trim()) {
        showError("Please enter your mobile number.");
        return;
      }
      if (!studentDetails.email.trim()) {
        showError("Please enter your email address.");
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmitApplication = async () => {
    try {
      setSubmitting(true);
      const payload = {
        collegeId: selectedCollegeId,
        courseId: selectedCourseId,
        studentId: user?.id || "",
        studentDetails,
      };

      const res = await collegeService.submitApplication(payload);
      setSubmissionResult(res);
      showSuccess("Application submitted successfully!");
      if (onSuccess) onSuccess(res);
    } catch (err) {
      showError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submissionResult?.applicationId) {
      navigator.clipboard.writeText(submissionResult.applicationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Lock background page scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearance to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  const handleModalClose = () => {
    setSubmissionResult(null);
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs transition-opacity"
        onClick={handleModalClose}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#E6E8EC] z-10 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#E6E8EC] bg-white sticky top-0 z-10">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FF8A00]">
              Partner College Admissions
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] leading-tight">
              {submissionResult ? "Application Submitted" : "Admission Application & Enquiry"}
            </h3>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar (if not finished) */}
        {!submissionResult && (
          <div className="px-4 sm:px-5 pt-2.5 pb-2 bg-[#F7F8FA] border-b border-[#E6E8EC]">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-[#667085] mb-1.5 whitespace-nowrap gap-1">
              <span className={step >= 1 ? "text-[#0A1D3F] font-bold" : ""}>1. College</span>
              <span className={step >= 2 ? "text-[#0A1D3F] font-bold" : ""}>2. Course</span>
              <span className={step >= 3 ? "text-[#0A1D3F] font-bold" : ""}>3. Details</span>
              <span className={step >= 4 ? "text-[#0A1D3F] font-bold" : ""}>4. Summary</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FF8A00] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3">
          {submissionResult ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#0A1D3F]">
                  Application Received!
                </h4>
                <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-md mx-auto leading-relaxed">
                  Your admission enquiry has been submitted successfully. Our admission team will contact you shortly.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-[#F7F8FA] border border-[#E6E8EC] rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#667085]">Application Reference ID</span>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:text-[#E67C00] transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="text-lg font-extrabold text-[#0A1D3F] tracking-wide font-mono">
                  {submissionResult.applicationId}
                </div>
                <div className="pt-2 border-t border-gray-200 text-xs text-[#667085] space-y-1">
                  <div>
                    <strong className="text-[#0A1D3F]">College:</strong> {selectedCollege?.name}
                  </div>
                  <div>
                    <strong className="text-[#0A1D3F]">Course:</strong> {selectedCourse?.courseName}
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <PrimaryButton variant="navy" fullWidth onClick={handleModalClose}>
                  Done
                </PrimaryButton>
              </div>
            </div>
          ) : (
            /* 4-STEP WIZARD */
            <>
              {/* STEP 1: SELECT COLLEGE */}
              {step === 1 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#FF8A00]" />
                    <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                      Step 1: Choose Partner College
                    </label>
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {colleges.map((col) => {
                        const colId = col._id || col.id;
                        const isSelected = String(selectedCollegeId) === String(colId);
                        return (
                          <div
                            key={colId}
                            onClick={() => {
                              setSelectedCollegeId(colId);
                              setSelectedCourseId(""); // reset course selection when college changes
                            }}
                            className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "border-[#FF8A00] bg-orange-50/60 shadow-xs ring-1 ring-[#FF8A00]"
                                : "border-[#E6E8EC] hover:border-gray-300 hover:bg-gray-50/80"
                            }`}
                          >
                            <img
                              src={col.logo || "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=100&auto=format&fit=crop&q=80"}
                              alt={col.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
                                {col.name}
                              </h4>
                              <p className="text-[11px] text-[#667085] truncate mt-0.5">
                                {col.location || col.city} • {col.collegeType}
                              </p>
                            </div>
                            <input
                              type="radio"
                              name="partnerCollege"
                              checked={isSelected}
                              onChange={() => {}}
                              className="accent-[#FF8A00] w-3.5 h-3.5 shrink-0 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SELECT COURSE */}
              {step === 2 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#FF8A00]" />
                      <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                        Step 2: Choose Course / Program
                      </label>
                    </div>
                    {selectedCollege && (
                      <span className="text-[11px] text-[#667085] truncate max-w-[180px]">
                        {selectedCollege.name}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="p-5 text-center bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-[#667085]">
                        No active courses currently listed for this college. Please choose another partner college.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {courses.map((crs) => {
                        const crsId = crs._id || crs.id;
                        const isSelected = String(selectedCourseId) === String(crsId);
                        return (
                          <div
                            key={crsId}
                            onClick={() => setSelectedCourseId(crsId)}
                            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "border-[#FF8A00] bg-orange-50/60 shadow-xs ring-1 ring-[#FF8A00]"
                                : "border-[#E6E8EC] hover:border-gray-300 hover:bg-gray-50/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0A1D3F] text-white leading-none">
                                    {crs.degreeType}
                                  </span>
                                  <span className="text-[11px] text-[#667085] leading-none">
                                    {crs.duration}
                                  </span>
                                  <span className="text-gray-300 text-[10px]">•</span>
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                                    Seats: {crs.availableSeats || 60}
                                  </span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] leading-snug">
                                  {crs.courseName}
                                </h4>
                                {crs.eligibility && (
                                  <p className="text-[11px] text-[#667085] mt-0.5 line-clamp-1">
                                    Eligibility: {crs.eligibility}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end justify-between self-stretch">
                                <div>
                                  <div className="text-xs sm:text-sm font-extrabold text-[#0A1D3F] leading-tight">
                                    ₹{crs.fee ? crs.fee.toLocaleString() : "Contact"}
                                  </div>
                                  <span className="text-[10px] text-[#667085]">Per Year</span>
                                </div>
                                <input
                                  type="radio"
                                  name="partnerCourse"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="accent-[#FF8A00] w-3.5 h-3.5 mt-1 shrink-0 cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: STUDENT DETAILS */}
              {step === 3 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#FF8A00]" />
                    <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                      Step 3: Student Details
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={studentDetails.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        placeholder="e.g. Rohan Sharma"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        value={studentDetails.mobileNumber}
                        onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={studentDetails.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="student@example.com"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={studentDetails.dob}
                        onChange={(e) => handleInputChange("dob", e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Current City
                      </label>
                      <input
                        type="text"
                        value={studentDetails.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="e.g. Bangalore, Noida, Patna"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Qualification
                      </label>
                      <select
                        value={studentDetails.educationalQualification}
                        onChange={(e) => handleInputChange("educationalQualification", e.target.value)}
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      >
                        <option value="10th Standard / Matriculation">10th Standard / Matriculation</option>
                        <option value="12th Standard / Intermediate">12th Standard / Intermediate</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Passing Year
                      </label>
                      <input
                        type="text"
                        value={studentDetails.passingYear}
                        onChange={(e) => handleInputChange("passingYear", e.target.value)}
                        placeholder="e.g. 2024 or 2025"
                        className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#0A1D3F] mb-1">
                        Additional Questions or Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={studentDetails.additionalInfo}
                        onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                        placeholder="Ask regarding scholarships, hostel facilities, or syllabus..."
                        className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-[#E6E8EC] focus:border-[#FF8A00] focus:outline-none bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY & SUBMIT */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FF8A00]" />
                    <label className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider">
                      Step 4: Application Summary
                    </label>
                  </div>

                  <div className="bg-[#F7F8FA] border border-[#E6E8EC] rounded-2xl p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-wider">
                        Selected Partner College
                      </span>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#0A1D3F]">
                        {selectedCollege?.name}
                      </h4>
                      <p className="text-xs text-[#667085]">
                        {selectedCollege?.location || selectedCollege?.city}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-wider">
                        Program & Course
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                        {selectedCourse?.courseName}
                      </h4>
                      <p className="text-xs text-[#667085]">
                        {selectedCourse?.degreeType} • {selectedCourse?.duration} • Fee: ₹
                        {selectedCourse?.fee ? selectedCourse.fee.toLocaleString() : "N/A"} / year
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-[10px] font-bold text-[#FF8A00] uppercase tracking-wider">
                        Student Applicant
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs text-[#0A1D3F] mt-1">
                        <div>
                          <span className="text-[#667085]">Name:</span> {studentDetails.fullName}
                        </div>
                        <div>
                          <span className="text-[#667085]">Phone:</span> {studentDetails.mobileNumber}
                        </div>
                        <div>
                          <span className="text-[#667085]">Email:</span> {studentDetails.email}
                        </div>
                        <div>
                          <span className="text-[#667085]">City:</span> {studentDetails.city || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#667085] leading-relaxed">
                    By submitting, your enquiry will be registered with our authorized franchise admission desk. A dedicated educational counselor will assist with document verification and seat booking.
                  </p>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#E6E8EC] gap-3">
                {step > 1 ? (
                  <SecondaryButton size="sm" onClick={handlePrevStep} icon={ArrowLeft}>
                    Back
                  </SecondaryButton>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <PrimaryButton
                    variant="orange"
                    size="sm"
                    onClick={handleNextStep}
                    icon={ArrowRight}
                  >
                    Continue
                  </PrimaryButton>
                ) : (
                  <PrimaryButton
                    variant="orange"
                    size="sm"
                    loading={submitting}
                    onClick={handleSubmitApplication}
                    icon={CheckCircle2}
                  >
                    Submit Application
                  </PrimaryButton>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
