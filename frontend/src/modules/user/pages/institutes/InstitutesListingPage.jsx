import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  GraduationCap,
  Building2,
  Building,
  Filter,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  Award,
  ExternalLink,
  X
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { STATE_DISTRICT_MAP } from "../../data/mockColleges";
import { EmptyState } from "../../components/common/EmptyState";
import { AdmissionApplicationModal } from "../../components/college/AdmissionApplicationModal";
import { CollegeDetailsModal } from "../../components/college/CollegeDetailsModal";

export const InstitutesListingPage = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedCollegeForApply, setSelectedCollegeForApply] = useState("");

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCollegeForDetails, setSelectedCollegeForDetails] = useState(null);

  const universityOptions = [
    { id: "All", name: "All University Tie-Ups" },
    { id: "univ-amity", name: "Amity University (AU)" },
    { id: "univ-du", name: "Delhi University (DU)" },
    { id: "univ-mahe", name: "Manipal Academy of Higher Education (MAHE)" },
    { id: "univ-lpu", name: "Lovely Professional University (LPU)" },
    { id: "univ-cu", name: "Chandigarh University (CU)" }
  ];

  const states = ["All", ...Object.keys(STATE_DISTRICT_MAP)];

  // Districts available based on selected state
  const availableDistricts = useMemo(() => {
    if (selectedState === "All") {
      const all = Object.values(STATE_DISTRICT_MAP).flat();
      return ["All", ...Array.from(new Set(all))];
    }
    return ["All", ...(STATE_DISTRICT_MAP[selectedState] || [])];
  }, [selectedState]);

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const data = await collegeService.getInstitutes({
        search: searchQuery,
        universityId: selectedUniversity,
        state: selectedState,
        district: selectedDistrict,
      });
      setInstitutes(data);
    } catch (err) {
      console.error("Error fetching institutes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, [selectedUniversity, selectedState, selectedDistrict]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInstitutes();
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedDistrict("All");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedUniversity("All");
    setSelectedState("All");
    setSelectedDistrict("All");
  };

  const openApplyModal = (collegeId) => {
    setSelectedCollegeForApply(collegeId);
    setApplyModalOpen(true);
  };

  const openDetailsModal = (college) => {
    setSelectedCollegeForDetails(college);
    setDetailsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-10 w-full min-w-0">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] text-white rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-[#FF8A00]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Authorized Franchise & Tie-Up Directory</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Partner <span className="text-[#FF8A00]">Institutes & Franchises</span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
            Explore verified institutes and colleges with active University franchise tie-ups. Check approved degree programs, transparent affiliation, and direct counseling seats.
          </p>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-60 h-60 bg-[#FF8A00]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E6E8EC] shadow-2xs space-y-3 w-full min-w-0">
        {/* Search Input + Submit */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search institute name, course (B.Tech, B.Pharm, MBA), city, or university..."
              className="w-full pl-9 pr-8 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#FF8A00] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchInstitutes();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* 3-Dropdown Filter Grid: Parent University, State, District */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E6E8EC]/60">
          {/* 1. Parent University Tie-Up Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Franchise Tie-Up</span>
              </label>
              {selectedUniversity !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedUniversity("All")}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset University"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedUniversity}
                onChange={(e) => setSelectedUniversity(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedUniversity !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                {universityOptions.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white text-[#0A1D3F] font-semibold">
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
                  selectedUniversity !== "All" ? "text-white" : "text-[#667085]"
                }`}
              />
            </div>
          </div>

          {/* 2. State Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                <span>State</span>
              </label>
              {selectedState !== "All" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState("All");
                    setSelectedDistrict("All");
                  }}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset State"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedState}
                onChange={handleStateChange}
                className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedState !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                {states.map((st) => (
                  <option key={st} value={st} className="bg-white text-[#0A1D3F] font-semibold">
                    {st === "All" ? "All States" : st}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
                  selectedState !== "All" ? "text-white" : "text-[#667085]"
                }`}
              />
            </div>
          </div>

          {/* 3. District Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#133C8B] shrink-0" />
                <span>District</span>
              </label>
              {selectedDistrict !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedDistrict("All")}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset District"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={availableDistricts.length <= 1}
                className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedDistrict !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                } ${availableDistricts.length <= 1 ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
                  All Districts
                </option>
                {availableDistricts.filter((d) => d !== "All").map((dist) => (
                  <option key={dist} value={dist} className="bg-white text-[#0A1D3F] font-semibold">
                    {dist}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
                  selectedDistrict !== "All" ? "text-white" : "text-[#667085]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Count Header */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F] uppercase tracking-wider truncate">
          {loading ? "Searching Institutes..." : `Showing ${institutes.length} Verified Institutes`}
        </h2>
        <span className="text-xs text-[#667085]">
          Authorized Franchise Network (Universities excluded)
        </span>
      </div>

      {/* Institutes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E6E8EC] p-3.5 animate-pulse space-y-2.5"
            >
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : institutes.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Matching Institutes Found"
          description="We couldn't find any partner institutes matching your current filters or search query."
          actionText="Reset All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {institutes.map((institute) => {
            const instId = institute._id || institute.id;
            return (
              <div
                key={instId}
                className="bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-blue-400"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={institute.banner || institute.image || "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80"}
                      alt={institute.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                    {/* Institute Type Badge */}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#0A1D3F] text-[11px] font-bold rounded-lg shadow-xs">
                      {institute.collegeType || institute.category || "Institute"}
                    </span>

                    {/* Verified Badge */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#17B26A]/95 text-white px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Partner</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] group-hover:text-blue-700 transition line-clamp-1">
                        {institute.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-[#667085] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                        <span className="truncate">
                          {institute.district ? `${institute.district}, ${institute.state}` : institute.location || `${institute.city}, ${institute.state}`}
                        </span>
                      </div>
                    </div>

                    {/* Prominent Franchise / Tie-Up Info Box */}
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-800">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-blue-700 shrink-0" />
                          Franchise & Tie-Up:
                        </span>
                        <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-100/90 px-1.5 py-0.2 rounded">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#0A1D3F] flex items-center gap-1 truncate">
                        <span>🏛️</span>
                        <span className="truncate">{institute.parentUniversityName || "Delhi University"}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                      {institute.description || institute.about || "Explore accredited courses, verified admissions, and dual certification pathways under partner university quota."}
                    </p>

                    {/* Popular Courses Chips */}
                    {institute.popularCourses && institute.popularCourses.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {institute.popularCourses.slice(0, 3).map((dt, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]"
                          >
                            {dt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3.5 sm:p-4 pt-0 border-t border-[#F0F2F5] mt-2">
                  <div className="flex items-center justify-between gap-2 pt-2.5">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(institute)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0A1D3F] bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => openApplyModal(instId)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FF8A00] hover:bg-[#E67C00] transition active:scale-95 shadow-2xs cursor-pointer"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Institutional Franchise Application Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-black uppercase tracking-wider">
            <Building className="w-3.5 h-3.5 text-[#FF8A00]" />
            <span>INSTITUTIONAL PARTNER</span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[#0A1D3F]">
            1. Franchise Form & Institutional Registration
          </h3>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Apply for institutional franchise under an approved University & College partner to offer accredited degree programs, counseling centers, and admissions.
          </p>
        </div>

        <Link
          to="/register?type=franchise"
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer w-full sm:w-auto text-center"
        >
          <span>Apply for Franchise</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Admission Application Modal */}
      <AdmissionApplicationModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        preselectedCollegeId={selectedCollegeForApply}
      />

      {/* In-App College/Institute Details Preview Modal */}
      <CollegeDetailsModal
        college={selectedCollegeForDetails}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </div>
  );
};
