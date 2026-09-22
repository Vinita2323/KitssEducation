import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  GraduationCap,
  Building2,
  Filter,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  X
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { STATE_DISTRICT_MAP } from "../../data/mockColleges";
import { EmptyState, SkeletonLoader } from "../../components/common/EmptyState";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { AdmissionApplicationModal } from "../../components/college/AdmissionApplicationModal";
import { CollegeDetailsModal } from "../../components/college/CollegeDetailsModal";

export const CollegesListingPage = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Application Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedCollegeForApply, setSelectedCollegeForApply] = useState("");

  // Details Modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedCollegeForDetails, setSelectedCollegeForDetails] = useState(null);

  const categories = ["All", "University", "College", "School", "Institute"];
  const states = ["All", ...Object.keys(STATE_DISTRICT_MAP)];

  // Districts available based on selected state
  const availableDistricts = React.useMemo(() => {
    if (selectedState === "All") {
      const all = Object.values(STATE_DISTRICT_MAP).flat();
      return ["All", ...Array.from(new Set(all))];
    }
    return ["All", ...(STATE_DISTRICT_MAP[selectedState] || [])];
  }, [selectedState]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const data = await collegeService.getColleges({
        search: searchQuery,
        category: selectedCategory,
        state: selectedState,
        district: selectedDistrict,
      });
      setColleges(data);
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [selectedCategory, selectedState, selectedDistrict]);

  // Debounced or on-submit search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchColleges();
  };

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedDistrict("All");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] text-white rounded-xl p-5 sm:p-7 shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-[11px] font-semibold text-[#FF8A00]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Education Partners Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Find Your <span className="text-[#FF8A00]">College</span>
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-normal">
            Explore our partner colleges and find the right course for your future. Get direct counseling and certified degree pathways.
          </p>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-60 h-60 bg-[#FF8A00]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E8EC] shadow-2xs space-y-3 w-full min-w-0">
        {/* Search input + button */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search college, course, state, district..."
              className="w-full pl-9 pr-8 py-2 bg-[#F7F8FA] border border-[#E6E8EC] rounded-lg text-xs sm:text-sm text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#FF8A00] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchColleges();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold rounded-lg shadow-2xs transition shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* 3-Dropdown Filter Grid: Type, State, District */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E6E8EC]/60">
          {/* 1. Institution Type / Category Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                <span>Institution Type</span>
              </label>
              {selectedCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset Type"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                aria-label="Filter by Institution Type"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedCategory !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
                  All Types
                </option>
                {categories.filter((c) => c !== "All").map((cat) => (
                  <option key={cat} value={cat} className="bg-white text-[#0A1D3F] font-semibold">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
                  selectedCategory !== "All" ? "text-white" : "text-[#667085]"
                }`}
              />
            </div>
          </div>

          {/* 2. State Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#133C8B] shrink-0" />
                <span>Select State</span>
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
                aria-label="Filter by State"
                value={selectedState}
                onChange={handleStateChange}
                className={`w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedState !== "All"
                    ? "bg-[#FF8A00] text-white border-[#FF8A00] focus:ring-[#FF8A00]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
                  All States
                </option>
                {states.filter((s) => s !== "All").map((st) => (
                  <option key={st} value={st} className="bg-white text-[#0A1D3F] font-semibold">
                    {st}
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
                <Building2 className="w-3.5 h-3.5 text-[#17B26A] shrink-0" />
                <span>Select District</span>
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
                aria-label="Filter by District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedDistrict !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
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
          {loading ? "Searching Colleges..." : `Showing ${colleges.length} Partner Institutions`}
        </h2>
        <span className="text-xs text-[#667085]">
          Verified Franchise Network
        </span>
      </div>

      {/* Colleges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-md border border-[#E6E8EC] p-3.5 animate-pulse space-y-2.5"
            >
              <div className="h-40 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded mt-3" />
            </div>
          ))}
        </div>
      ) : colleges.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Partner Colleges Found"
          description="We couldn't find any colleges matching your current filters or search query."
          actionText="Reset All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {colleges.map((college) => {
            const collegeId = college._id || college.id;
            return (
              <div
                key={collegeId}
                className="bg-white rounded-md border border-[#E6E8EC] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-gray-300"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={college.banner || college.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"}
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* College Type Badge */}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#0A1D3F] text-[11px] font-bold rounded shadow-xs">
                      {college.collegeType || college.category || "University"}
                    </span>

                    {/* Logo & Verified Badge */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
                      <div className="text-white drop-shadow-sm flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#17B26A]/90 px-2 py-0.5 rounded backdrop-blur-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Partner</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 sm:p-4 space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition line-clamp-1">
                      {college.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-[#667085]">
                      <MapPin className="w-4 h-4 text-[#FF8A00] shrink-0" />
                      <span>{college.district ? `${college.district}, ${college.state}` : college.location || `${college.city}, ${college.state}`}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                      {college.description || college.about || "Explore accredited undergraduate and postgraduate curriculum with 100% placement guidance."}
                    </p>

                    {/* Popular Courses Chips */}
                    {college.popularCourses && college.popularCourses.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {college.popularCourses.slice(0, 3).map((dt, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]"
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
                      onClick={() => openDetailsModal(college)}
                      className="px-3 py-1.5 rounded-md text-xs font-bold text-[#0A1D3F] bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => openApplyModal(collegeId)}
                      className="px-3.5 py-1.5 rounded-md text-xs font-bold text-white bg-[#FF8A00] hover:bg-[#E67C00] transition active:scale-95 shadow-2xs cursor-pointer"
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

      {/* Admission Application Modal */}
      <AdmissionApplicationModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        preselectedCollegeId={selectedCollegeForApply}
      />

      {/* In-App College Details Preview Modal */}
      <CollegeDetailsModal
        college={selectedCollegeForDetails}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </div>
  );
};
