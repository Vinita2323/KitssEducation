import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Video, Sparkles, Trophy, HeartPulse, GraduationCap, Building2, Search, ArrowRight } from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { SearchBar } from "../../components/common/SearchBar";
import { SectionHeader } from "../../components/common/SectionHeader";
import { CourseCard } from "../../components/coaching/CourseCard";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";
import { PrimaryButton } from "../../components/common/PrimaryButton";

const catIcons = {
  GraduationCap,
  Building2,
  Trophy,
  HeartPulse
};

export const CoachingHomePage = () => {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await coachingService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Categories load error:", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourses({
          category: selectedCategory,
          query
        });
        setCourses(data);
      } catch (err) {
        console.error("Courses load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedCategory, query]);

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-6xl mx-auto">
      {/* 1. Compact Hero Banner */}
      <div className="bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-md border border-[#133C8B]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF8A00]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] sm:text-xs font-bold text-[#FF8A00] border border-white/10">
              <Sparkles className="w-3 h-3" />
              <span>Live & Recorded Online Coaching</span>
            </div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight leading-tight">
              Learn from India's Top Educators
            </h1>
            <p className="text-[11px] sm:text-xs text-blue-100/80 line-clamp-1 sm:line-clamp-2">
              HD chapter video lectures, live interactive doubt classes, and chapter test series.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a href="#courses-list">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
              >
                <span>Courses</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </a>
            <Link to="/subscriptions">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95"
              >
                My Subscriptions
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Compact Search Bar */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onClear={() => setQuery("")}
        placeholder="Search courses by subject, board or instructor..."
      />

      {/* 3. Compact Category Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-[#667085] uppercase tracking-wider">
            Categories
          </h3>
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-[11px] font-semibold text-[#FF8A00] hover:underline"
            >
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = catIcons[cat.icon] || GraduationCap;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "All" : cat.id)}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 active:scale-95 flex items-center gap-2.5 shadow-2xs ${
                  isSelected
                    ? "bg-[#0A1D3F] border-[#0A1D3F] text-white shadow-xs"
                    : "bg-white border-[#E6E8EC] text-[#0A1D3F] hover:border-gray-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#F7F8FA] text-[#0A1D3F]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold truncate leading-tight">{cat.name}</h4>
                  <p className={`text-[10px] truncate ${isSelected ? "text-blue-200" : "text-[#667085]"}`}>
                    Coaching
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Popular Courses Grid */}
      <div id="courses-list" className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#0A1D3F]">
              {selectedCategory !== "All" ? `${selectedCategory} Coaching Courses` : "Popular Coaching Courses"}
            </h2>
            <p className="text-[11px] text-[#667085]">
              {courses.length} courses available
            </p>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader type="course" count={4} />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No Courses Found"
            description="No coaching courses match your search criteria."
            actionText="Reset Search"
            onAction={() => {
              setQuery("");
              setSelectedCategory("All");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} layout="grid" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
