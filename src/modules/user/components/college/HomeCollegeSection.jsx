import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Building2,
  MapPin,
  CheckCircle2,
  X
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { CollegeCard } from "./CollegeCard";
import { CollegeDetailsModal } from "./CollegeDetailsModal";

export const HomeCollegeSection = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & category filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // College details modal state
  const [selectedCollegeForModal, setSelectedCollegeForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ["All", "University", "College", "School", "Institute"];

  useEffect(() => {
    let isMounted = true;
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const data = await collegeService.getColleges();
        if (isMounted) setColleges(data);
      } catch (err) {
        console.error("Error fetching partner colleges for home:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchColleges();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter colleges locally in real-time
  const filteredColleges = useMemo(() => {
    let result = [...colleges];

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter((c) => {
        const cat = (c.category || c.collegeType || "").toLowerCase();
        return cat.includes(selectedCategory.toLowerCase());
      });
    }

    // Search query filter (name, city, course)
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const cityMatch = c.city?.toLowerCase().includes(q);
        const stateMatch = c.state?.toLowerCase().includes(q);
        const locationMatch = c.location?.toLowerCase().includes(q);
        const courseMatch = c.popularCourses?.some((crs) => crs.toLowerCase().includes(q));
        const descMatch = c.description?.toLowerCase().includes(q);
        return nameMatch || cityMatch || stateMatch || locationMatch || courseMatch || descMatch;
      });
    }

    return result;
  }, [colleges, selectedCategory, searchQuery]);

  const handleOpenCollege = (college) => {
    setSelectedCollegeForModal(college);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCollegeForModal(null);
  };

  return (
    <section className="space-y-4 pt-3 pb-2">
      {/* 1. Section Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Partner Colleges
            </h2>
            <p className="text-xs text-slate-500 leading-normal mt-0.5">
              Explore verified institutions and course admissions.
            </p>
          </div>

          <Link
            to="/colleges"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-950 transition-colors shrink-0 group whitespace-nowrap"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400 group-hover:text-slate-950" />
          </Link>
        </div>
      </div>

      {/* 2. College Search Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by college name, city or course..."
          className="w-full h-10 pl-9 pr-9 rounded-xl bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 shadow-xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer active:scale-98 ${
                isSelected
                  ? "bg-slate-900 text-white shadow-xs font-semibold"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:text-slate-900 shadow-2xs"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. Horizontal Swipeable Featured College Cards Carousel */}
      {loading ? (
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[80vw] sm:w-[290px] shrink-0 bg-white rounded-xl border border-slate-200/80 p-3.5 animate-pulse flex flex-col gap-3"
            >
              <div className="w-full aspect-16/10 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
              <div className="h-8 bg-slate-100 rounded-lg mt-1" />
            </div>
          ))}
        </div>
      ) : filteredColleges.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 text-center space-y-2 shadow-xs">
          <p className="font-semibold text-sm text-slate-900">No colleges found</p>
          <p className="text-xs text-slate-500">
            Try searching with another college name, city or course.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-2 text-xs font-semibold text-slate-900 hover:underline transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Cards Carousel: ~1.15 cards visible on mobile with peeking edge */
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 snap-x snap-mandatory">
          {filteredColleges.map((college) => (
            <CollegeCard
              key={college._id || college.id}
              college={college}
              onViewCollege={handleOpenCollege}
            />
          ))}

          {/* End Card linking to full directory */}
          <div className="w-48 sm:w-56 shrink-0 snap-start bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-xl border border-slate-800 p-4 text-white flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-400 mb-3">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-white leading-snug">
                More Partner Colleges
              </h3>
              <p className="text-[11px] text-slate-300/80 mt-1 leading-relaxed">
                Explore our full verified colleges directory and course admissions.
              </p>
            </div>

            <Link
              to="/colleges"
              className="mt-4 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-semibold py-2 px-3 rounded-lg transition active:scale-98 shadow-xs"
            >
              <span>Explore Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 5. In-App College Details Preview Modal */}
      <CollegeDetailsModal
        college={selectedCollegeForModal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};
