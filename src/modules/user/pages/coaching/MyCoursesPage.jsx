import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Video,
  BookOpen,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { coachingService } from "../../services/coachingService";

export const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyCourses = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getMyCourses();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load my courses:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMyCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-[#133C8B]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white font-bold text-xs uppercase tracking-wider border border-white/20">
              <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00]" /> Student Learning Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              My Courses
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-lg">
              Access your enrolled online courses, resume lectures, and read digital study material.
            </p>
          </div>

          <Link
            to="/coaching/select"
            className="px-4 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
          >
            <span>Explore More Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Courses List */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#E6E8EC] p-6 h-64 animate-pulse space-y-4" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          /* Empty State: No Courses Yet */
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-8 sm:p-14 text-center space-y-4 card-shadow max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center mx-auto">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#0A1D3F]">
                No Courses Yet
              </h2>
              <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                Choose a course and start your learning journey.
              </p>
            </div>
            <Link
              to="/coaching"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Enrolled Courses Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 card-shadow card-shadow-hover flex flex-col justify-between space-y-5 transition-all"
              >
                <div className="space-y-4">
                  {/* Thumbnail & Title */}
                  <div className="flex items-start gap-4">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#E6E8EC] shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A1D3F] text-white">
                          {course.board}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]">
                          {course.class}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base sm:text-lg text-[#0A1D3F] line-clamp-1">
                        {course.title}
                      </h3>

                      <p className="text-xs text-[#667085] line-clamp-1">
                        {course.subjects?.join(" • ")}
                      </p>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="bg-[#F7F8FA] rounded-xl p-3.5 border border-[#E6E8EC] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0A1D3F] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FF8A00]" /> Progress: {course.progressPercentage || 0}%
                      </span>
                      <span className="text-[#667085] font-semibold">
                        {course.completedLectures || 0} / {course.totalLecturesCount || course.lecturesCount} Lectures Completed
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#E6E8EC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Stats Row: Study Material & Expiry Status */}
                  <div className="flex items-center justify-between text-xs text-[#667085] pt-1">
                    <span className="flex items-center gap-1.5 font-semibold text-[#0A1D3F]">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
                      {course.totalBooksCount || course.booksCount} Study Materials
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-bold text-[#17B26A] bg-[#17B26A]/10 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Active • Exp: {course.expiryDate || "15 March 2027"}
                    </span>
                  </div>
                </div>

                {/* Continue Learning Action */}
                <div className="pt-2 border-t border-[#E6E8EC]/70">
                  <Link
                    to={`/coaching/${course.id}/dashboard`}
                    className="w-full py-3 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                  >
                    <span>Continue Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
