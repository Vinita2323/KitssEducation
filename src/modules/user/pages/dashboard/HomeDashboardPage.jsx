import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, ArrowRight, ChevronRight } from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { HeroBannerCarousel } from "../../components/dashboard/HeroBannerCarousel";
import { HomeCollegeSection } from "../../components/college/HomeCollegeSection";
import { CourseCard } from "../../components/coaching/CourseCard";
import { SkeletonLoader } from "../../components/common/EmptyState";

export const HomeDashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const coursesData = await coachingService.getCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-8"
    >
      {/* 1. Edge-to-Edge Hero Carousel directly below header */}
      <HeroBannerCarousel />

      {/* 2. Partner Colleges Section */}
      <HomeCollegeSection />

      {/* 3. Popular Online Coaching Courses (Compact Horizontal Showcase) */}
      <section className="space-y-3 pt-1 pb-2">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FF8A00] mb-0.5">
              <Video className="w-3.5 h-3.5" />
              <span>Live Batches 2026</span>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-black text-[#0A1D3F] tracking-tight">
              Popular Courses
            </h2>
            <p className="text-xs text-slate-500 leading-normal hidden xs:block">
              Interactive video lectures & live test series with top mentors.
            </p>
          </div>

          <Link
            to="/coaching"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:text-[#E67A00] transition-colors shrink-0 group whitespace-nowrap bg-orange-50/80 px-3 py-1.5 rounded-xl border border-orange-200/50"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-[82vw] sm:w-[310px] shrink-0 bg-white rounded-3xl border border-slate-200/80 p-3.5 animate-pulse flex flex-col gap-3"
              >
                <div className="w-full h-38 bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                <div className="h-7 bg-slate-100 rounded-xl mt-1" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-2 shadow-xs">
            <p className="font-semibold text-sm text-slate-900">No courses available right now</p>
            <p className="text-xs text-slate-500">Check back soon for newly published batches.</p>
          </div>
        ) : (
          <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 snap-x snap-mandatory">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} layout="compact" />
            ))}

            {/* End Card */}
            <div className="w-52 sm:w-60 shrink-0 snap-start bg-gradient-to-br from-[#0A1D3F] via-[#0E2A5C] to-[#FF8A00]/25 rounded-3xl border border-slate-800 p-5 text-white flex flex-col justify-between shadow-xs">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF8A00] mb-3 border border-white/15">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white leading-snug">
                  All Online Batches
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Browse complete CBSE, ICSE, JEE & NEET coaching programs with all-India test series.
                </p>
              </div>

              <Link
                to="/coaching"
                className="mt-5 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-[#0A1D3F] text-xs font-black py-2.5 px-3 rounded-xl transition active:scale-98 shadow-sm group"
              >
                <span>Explore All Batches</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
};
