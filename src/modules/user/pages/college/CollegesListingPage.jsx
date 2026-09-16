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
  CheckCircle,
  X
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { EmptyState, SkeletonLoader } from "../../components/common/EmptyState";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { AdmissionApplicationModal } from "../../components/college/AdmissionApplicationModal";

export const CollegesListingPage = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCollegeForModal, setSelectedCollegeForModal] = useState("");

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const data = await collegeService.getColleges({
        search: searchQuery,
        degree: selectedDegree,
        city: selectedCity,
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
  }, [selectedDegree, selectedCity]);

  // Debounced or on-submit search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchColleges();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDegree("All");
    setSelectedCity("All");
  };

  // Extract unique cities from currently known list or preset
  const cities = ["All", "Noida", "Pune", "Bangalore", "Jaipur"];
  const degrees = ["All", "Undergraduate", "Postgraduate", "Diploma"];

  const openApplyModal = (collegeId) => {
    setSelectedCollegeForModal(collegeId);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-[#FF8A00] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Education Franchise & Partner Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Partner Colleges & Universities
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-2 leading-relaxed">
            Discover institutions partnering with KITSS Education. Get direct admission assistance, accredited degree certifications, and expert career counseling.
          </p>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-20 w-60 h-60 bg-[#FF8A00]/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-xs space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colleges by name, city, or state..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#F7F8FA] border border-[#E6E8EC] rounded-xl text-xs sm:text-sm text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#FF8A00] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchColleges();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <PrimaryButton variant="orange" size="sm" type="submit">
            Search
          </PrimaryButton>
        </form>

        {/* Filter Dropdowns & Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0F2F5]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#667085] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>

            {/* Degree Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {degrees.map((deg) => (
                <button
                  key={deg}
                  onClick={() => setSelectedDegree(deg)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedDegree === deg
                      ? "bg-[#0A1D3F] text-white"
                      : "bg-[#F7F8FA] text-[#667085] hover:bg-gray-200"
                  }`}
                >
                  {deg}
                </button>
              ))}
            </div>

            {/* City Dropdown */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="text-xs font-semibold px-3 py-1 rounded-lg bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC] focus:outline-none"
            >
              <option value="All">All Cities</option>
              {cities.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {(selectedDegree !== "All" || selectedCity !== "All" || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-bold text-[#FF8A00] hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Result Count Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-[#0A1D3F] uppercase tracking-wider">
          {loading ? "Searching Colleges..." : `Showing ${colleges.length} Partner Colleges`}
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
                      src={college.banner || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"}
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* College Type Badge */}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-xs text-[#0A1D3F] text-xs font-bold rounded-full shadow-xs">
                      {college.collegeType || "Partner College"}
                    </span>

                    {/* Logo & Verified Badge */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md border border-white/60 shrink-0 overflow-hidden flex items-center justify-center">
                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-[#0A1D3F]" />
                        )}
                      </div>
                      <div className="text-white drop-shadow-sm">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600/80 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3 h-3" />
                          <span>Verified Franchise</span>
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
                      <span>{college.location || college.city}</span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                      {college.description || college.about || "Explore accredited undergraduate and postgraduate curriculum with 100% placement guidance."}
                    </p>

                    {/* Degree Types Chips */}
                    {college.degreeTypes && college.degreeTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {college.degreeTypes.map((dt) => (
                          <span
                            key={dt}
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
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F]">
                      <GraduationCap className="w-4 h-4 text-[#FF8A00]" />
                      <span>{college.coursesCount || 0} Courses</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/colleges/${collegeId}`}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A1D3F] bg-gray-100 hover:bg-gray-200 transition"
                      >
                        Details
                      </Link>

                      <button
                        onClick={() => openApplyModal(collegeId)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF8A00] hover:bg-[#E67C00] transition active:scale-95 shadow-xs"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admission Application Modal */}
      <AdmissionApplicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedCollegeId={selectedCollegeForModal}
      />
    </div>
  );
};
