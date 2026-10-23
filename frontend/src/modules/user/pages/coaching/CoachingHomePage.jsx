import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Video,
  Search,
  ArrowRight,
  BookOpen,
  Award,
  Filter,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Layers,
  X
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { CourseCard } from "../../components/coaching/CourseCard";
import { useAuth } from "../../context/AuthContext";

export const CoachingHomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load categories
  useEffect(() => {
    const loadCats = async () => {
      try {
        const cats = await coachingService.getCategories();
        setCategories(cats);
      } catch (e) {
        console.error("Categories error:", e);
      }
    };
    loadCats();
  }, []);

  // Fetch courses with filter
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourses({
          category: selectedCategory,
          classGrade: selectedClass,
          query,
        });
        setCourses(data);
      } catch (err) {
        console.error("Failed to load coaching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedCategory, selectedClass, query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query, category: selectedCategory });
  };

  return (
    <div className="space-y-3.5 sm:space-y-5 max-w-7xl mx-auto">
      {/* 1. Compact Search & Quick Filters Bar */}
      <div className="bg-white rounded-xl border border-[#E6E8EC] p-3 sm:p-4 shadow-2xs space-y-2.5">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
          <input
            type="text"
            placeholder="Search by title, subject (Physics, Math), board..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-20 py-2 rounded-lg bg-[#F7F8FA] border border-[#E6E8EC] text-xs sm:text-sm text-[#0A1D3F] placeholder-[#667085] focus:outline-none focus:border-[#FF8A00] transition"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-[#0A1D3F] text-white text-[11px] font-semibold hover:bg-[#133C8B] transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-[#E6E8EC]/60">
          {/* Board / Category Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                <span>Board / Category</span>
              </label>
              {selectedCategory !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset Category"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedCategory !== "All"
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] focus:ring-[#0A1D3F]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-white text-[#0A1D3F] font-semibold">
                    {cat.name}
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

          {/* Class / Grade Dropdown */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#0A1D3F] uppercase tracking-wider flex items-center gap-1.5 truncate">
                <Layers className="w-3.5 h-3.5 text-[#133C8B] shrink-0" />
                <span>Class / Grade</span>
              </label>
              {selectedClass !== "All" && (
                <button
                  type="button"
                  onClick={() => setSelectedClass("All")}
                  className="text-[10px] font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 cursor-pointer"
                  title="Reset Class"
                >
                  <span>Reset</span>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-bold transition appearance-none cursor-pointer border focus:outline-none focus:ring-1 ${
                  selectedClass !== "All"
                    ? "bg-[#FF8A00] text-white border-[#FF8A00] focus:ring-[#FF8A00]"
                    : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300 focus:ring-[#0A1D3F] focus:border-[#0A1D3F]"
                }`}
              >
                <option value="All" className="bg-white text-[#0A1D3F] font-semibold">
                  All Classes
                </option>
                {["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((cls) => (
                  <option key={cls} value={cls} className="bg-white text-[#0A1D3F] font-semibold">
                    {cls}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition ${
                  selectedClass !== "All" ? "text-white" : "text-[#667085]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Available Courses Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#0A1D3F] leading-tight">
              Available Courses
            </h2>
            <span className="text-[11px] font-bold text-[#667085] bg-gray-100 px-2 py-0.5 rounded-md border border-[#E6E8EC]">
              {courses.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/coaching/select"
              className="px-2.5 py-1 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition active:scale-95"
            >
              <span>Course Selector</span>
            </Link>

            <Link
              to="/coaching/my-courses"
              className="px-2.5 py-1 rounded-md bg-white hover:bg-gray-50 text-[#0A1D3F] border border-[#E6E8EC] font-bold text-[11px] flex items-center gap-1 shadow-2xs transition active:scale-95"
            >
              <span>My Courses</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-[#E6E8EC] h-72 animate-pulse p-3 space-y-3"
              >
                <div className="bg-[#E6E8EC] h-36 rounded-lg w-full" />
                <div className="h-4 bg-[#E6E8EC] rounded w-3/4" />
                <div className="h-3 bg-[#E6E8EC] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E6E8EC] p-8 text-center space-y-2.5 shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#0A1D3F]">No Courses Match Your Criteria</h3>
            <p className="text-xs text-[#667085] max-w-sm mx-auto">
              Try adjusting your search query, selecting "All Courses", or explore our full course selector.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("All");
                setSelectedClass("All");
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A1D3F] text-white font-bold text-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      {/* 3. Highlights / Protected Learning Features Banner */}
      <div className="bg-white rounded-xl border border-[#E6E8EC] p-3.5 sm:p-5 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#133C8B]/10 text-[#133C8B] flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
              Protected Video Lectures
            </h4>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              High-definition classes with watermarked single-device viewing.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
              Digital Study Materials
            </h4>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Curated workbooks, formula cheat sheets, and board question banks.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F]">
              Student Progress Tracking
            </h4>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Keep tab on finished lectures and chapter percentage dashboards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
