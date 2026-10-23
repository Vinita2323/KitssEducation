import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Share2,
  HelpCircle,
  FileCheck,
  Award
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { ErrorState } from "../../components/common/EmptyState";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { AdmissionApplicationModal } from "../../components/college/AdmissionApplicationModal";
import { useToast } from "../../context/ToastContext";

export const CollegeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [college, setCollege] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const fetchCollege = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await collegeService.getCollegeById(id);
        setCollege(data);
      } catch (err) {
        console.error("Error loading college details:", err);
        setError(err.message || "Failed to load college details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCollege();
  }, [id]);

  const handleApplyClick = (courseId = "") => {
    setSelectedCourseForModal(courseId);
    setIsModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: college?.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess("College link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-64 sm:h-80 bg-gray-200 rounded-3xl w-full" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
          <div className="h-72 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !college) {
    return (
      <div className="max-w-md mx-auto py-12">
        <ErrorState
          title="College Not Found"
          message={error || "The requested college does not exist or has been deactivated."}
          onRetry={() => navigate("/colleges")}
        />
      </div>
    );
  }

  const courses = college.courses || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/colleges"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Colleges</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0A1D3F] bg-white border border-[#E6E8EC] rounded-xl hover:bg-gray-50 transition shadow-2xs"
        >
          <Share2 className="w-3.5 h-3.5 text-[#667085]" />
          <span>Share</span>
        </button>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E6E8EC] shadow-sm">
        {/* Banner Cover */}
        <div className="relative h-60 sm:h-80 md:h-96 w-full overflow-hidden bg-gray-900">
          <img
            src={college.banner || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"}
            alt={college.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1D3F] via-[#0A1D3F]/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 sm:left-6 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#0A1D3F] text-xs font-bold shadow-sm">
              {college.collegeType || "Partner University"}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>KITSS Verified Partner</span>
            </span>
          </div>

          {/* Bottom Hero Info inside Banner */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl border border-white/50 shrink-0 overflow-hidden flex items-center justify-center">
                {college.logo ? (
                  <img
                    src={college.logo}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-[#0A1D3F]" />
                )}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                  {college.name}
                </h1>
                <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                  <span>{college.location || college.city}</span>
                  {college.state && <span>• {college.state}</span>}
                </div>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleApplyClick("")}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#0A1D3F] hover:bg-gray-100 transition shadow-sm active:scale-95"
              >
                Enquire Now
              </button>

              <button
                onClick={() => handleApplyClick("")}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#FF8A00] text-white hover:bg-[#E67C00] transition shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply for Admission</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: About, Courses, Facilities, Admission Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* About College */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E8EC] shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF8A00]" />
              <span>About {college.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed whitespace-pre-line">
              {college.about || college.description || "Leading higher education partner institution with accredited coursework and top-tier placement record."}
            </p>
          </div>

          {/* Available Courses */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E8EC] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#FF8A00]" />
                  <span>Available Courses & Programs ({courses.length})</span>
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Degree programs approved for direct admission through franchise partnership.
                </p>
              </div>
            </div>

            {courses.length === 0 ? (
              <p className="text-xs text-[#667085] py-4 text-center">
                No active courses listed currently.
              </p>
            ) : (
              <div className="space-y-3">
                {courses.map((crs) => {
                  const crsId = crs._id || crs.id;
                  return (
                    <div
                      key={crsId}
                      className="p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] hover:border-[#FF8A00]/40 transition bg-[#FDFDFE] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0A1D3F] text-white">
                              {crs.degreeType}
                            </span>
                            <span className="text-xs font-semibold text-[#667085] bg-gray-100 px-2 py-0.5 rounded-md">
                              {crs.duration}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Admission: {crs.admissionStatus || "Open"}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] pt-0.5">
                            {crs.courseName}
                          </h3>
                        </div>

                        {/* Fee box */}
                        <div className="sm:text-right shrink-0">
                          <div className="text-base sm:text-lg font-extrabold text-[#0A1D3F]">
                            ₹{crs.fee ? crs.fee.toLocaleString() : "Contact"}
                          </div>
                          <span className="text-[11px] text-[#667085]">Annual Tuition Fee</span>
                        </div>
                      </div>

                      {/* Course Details */}
                      {crs.description && (
                        <p className="text-xs text-[#667085] leading-relaxed">
                          {crs.description}
                        </p>
                      )}

                      {/* Eligibility & Seats */}
                      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="text-[#667085]">
                          <strong className="text-[#0A1D3F]">Eligibility:</strong> {crs.eligibility}
                        </div>

                        <button
                          onClick={() => handleApplyClick(crsId)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF8A00] hover:bg-[#E67C00] transition active:scale-95 shadow-xs shrink-0 self-start sm:self-auto"
                        >
                          Apply for this Course
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campus Facilities */}
          {college.facilities && college.facilities.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E8EC] shadow-xs space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF8A00]" />
                <span>Campus Facilities & Highlights</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {college.facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admission Information */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E8EC] shadow-xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#FF8A00]" />
              <span>Admission & Enquiry Guidelines</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed whitespace-pre-line">
              {college.admissionInformation || "Admissions are conducted on a rolling basis. Candidates are evaluated on qualifying marks and counseling interview."}
            </p>
          </div>
        </div>

        {/* Right 1 Column: Summary Card, Sticky Apply & Contact Info */}
        <div className="space-y-6">
          {/* Quick Apply Card */}
          <div className="bg-gradient-to-br from-[#0A1D3F] to-[#133C8B] text-white p-6 rounded-3xl shadow-md space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FF8A00]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">Ready to Join?</h3>
              <p className="text-xs text-blue-100/80 mt-1 leading-relaxed">
                Submit an admission application now. Direct seat allocation through partner franchise quota.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <PrimaryButton
                variant="orange"
                fullWidth
                size="md"
                onClick={() => handleApplyClick("")}
              >
                Apply for Admission
              </PrimaryButton>

              <button
                onClick={() => handleApplyClick("")}
                className="w-full py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-semibold transition text-center"
              >
                Enquire Now
              </button>
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E6E8EC] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wider">
              Contact & Address
            </h3>

            <div className="space-y-3 text-xs text-[#667085]">
              {college.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                  <span>{college.address}, {college.city}, {college.state}</span>
                </div>
              )}

              {college.contactInformation?.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#FF8A00] shrink-0" />
                  <a
                    href={`tel:${college.contactInformation.phone}`}
                    className="hover:text-[#0A1D3F] font-semibold text-[#0A1D3F]"
                  >
                    {college.contactInformation.phone}
                  </a>
                </div>
              )}

              {college.contactInformation?.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#FF8A00] shrink-0" />
                  <a
                    href={`mailto:${college.contactInformation.email}`}
                    className="hover:text-[#0A1D3F] font-semibold text-[#0A1D3F]"
                  >
                    {college.contactInformation.email}
                  </a>
                </div>
              )}

              {college.contactInformation?.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#FF8A00] shrink-0" />
                  <a
                    href={college.contactInformation.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#0A1D3F] font-semibold text-[#FF8A00] truncate"
                  >
                    {college.contactInformation.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admission Application Modal */}
      <AdmissionApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedCollegeId={id}
        preselectedCourseId={selectedCourseForModal}
      />
    </div>
  );
};
