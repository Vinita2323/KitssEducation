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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#FF8A00]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Education Partners Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
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
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-xs space-y-3 w-full min-w-0 overflow-hidden">
        {/* Search input + button */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search college, course, state, district..."
              className="w-full pl-9 sm:pl-10 pr-9 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#FF8A00] transition"
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
            className="px-4 sm:px-5 py-2.5 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Category Filter Chips - Dedicated Horizontal Scroll Row */}
        <div className="w-full min-w-0 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#FF8A00] text-white font-bold shadow-xs"
                    : "bg-[#F7F8FA] text-[#0A1D3F] hover:bg-gray-200 border border-[#E6E8EC]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Location Dropdowns & Reset Filters Row */}
        <div className="pt-2.5 border-t border-[#F0F2F5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 w-full min-w-0">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            {/* State Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F7F8FA] px-2.5 py-1.5 rounded-xl border border-[#E6E8EC] hover:border-[#FF8A00]/50 transition min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
              <select
                aria-label="Filter by State"
                value={selectedState}
                onChange={handleStateChange}
                className="w-full text-xs font-semibold bg-transparent text-[#0A1D3F] focus:outline-none cursor-pointer truncate"
              >
                <option value="All">All States</option>
                {states.filter((s) => s !== "All").map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* District Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F7F8FA] px-2.5 py-1.5 rounded-xl border border-[#E6E8EC] hover:border-[#FF8A00]/50 transition min-w-0">
              <Building2 className="w-3.5 h-3.5 text-[#667085] shrink-0" />
              <select
                aria-label="Filter by District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full text-xs font-semibold bg-transparent text-[#0A1D3F] focus:outline-none cursor-pointer truncate"
              >
                <option value="All">
                  {selectedState === "All" ? "All Districts" : `All Districts`}
                </option>
                {availableDistricts.filter((d) => d !== "All").map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(selectedCategory !== "All" || selectedState !== "All" || selectedDistrict !== "All" || searchQuery) && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#FF8A00] hover:underline cursor-pointer py-0.5"
              >
                Reset Filters
              </button>
            </div>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E6E8EC] p-4 animate-pulse space-y-3"
            >
              <div className="h-44 bg-gray-200 rounded-xl" />
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-10 bg-gray-200 rounded-xl mt-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {colleges.map((college) => {
            const collegeId = college._id || college.id;
            return (
              <div
                key={collegeId}
                className="bg-white rounded-3xl border border-[#E6E8EC] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-gray-300"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={college.banner || college.image || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"}
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* College Type Badge */}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-xs text-[#0A1D3F] text-xs font-bold rounded-full shadow-xs">
                      {college.collegeType || college.category || "University"}
                    </span>

                    {/* Logo & Verified Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                      <div className="text-white drop-shadow-sm flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#17B26A]/90 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Partner</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition line-clamp-1">
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
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {college.popularCourses.slice(0, 3).map((dt, idx) => (
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
                <div className="p-4 sm:p-5 pt-0 border-t border-[#F0F2F5] mt-3">
                  <div className="flex items-center justify-between gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(college)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A1D3F] bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      onClick={() => openApplyModal(collegeId)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF8A00] hover:bg-[#E67C00] transition active:scale-95 shadow-xs cursor-pointer"
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
