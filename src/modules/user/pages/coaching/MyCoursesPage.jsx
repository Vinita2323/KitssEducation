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
    <div className="max-w-7xl mx-auto space-y-3">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#0A1D3F] via-[#133C8B] to-[#0A1D3F] rounded-md p-4 sm:p-5 text-white relative overflow-hidden shadow-xs border border-[#133C8B]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8A00]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider border border-white/20">
              <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00]" /> Student Learning Desk
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              My Courses
            </h1>
            <p className="text-xs text-white/80 max-w-lg">
              Access your enrolled online courses, resume lectures, and read digital study material.
            </p>
          </div>

          <Link
            to="/coaching/select?choose=1"
            className="px-3 py-2 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
          >
            <span>Explore More Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Courses List */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-md border border-[#E6E8EC] p-3 h-44 animate-pulse space-y-3" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          /* Empty State: No Courses Yet */
          <div className="bg-white rounded-md border border-[#E6E8EC] p-6 sm:p-8 text-center space-y-3 card-shadow max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-md bg-[#0A1D3F]/5 text-[#0A1D3F] flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs shadow-md transition active:scale-95"
            >
              <span>Explore Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Enrolled Courses Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-md border border-[#E6E8EC] p-3 card-shadow card-shadow-hover flex flex-col justify-between space-y-2.5 transition-all"
              >
                <div className="space-y-2.5">
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-12 h-12 rounded-md object-cover border border-[#E6E8EC] shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#0A1D3F] text-white">
                          {course.board}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]">
                          {course.class}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-[#0A1D3F] line-clamp-1">
                        {course.title}
                      </h3>

                      <p className="text-[11px] text-[#667085] line-clamp-1">
                        {course.subjects?.join(" • ")}
                      </p>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="bg-[#F7F8FA] rounded-md p-2 border border-[#E6E8EC] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="font-bold text-[#0A1D3F] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#FF8A00]" /> {course.progressPercentage || 0}%
                      </span>
                      <span className="text-[#667085] font-semibold truncate">
                        {course.completedLectures || 0} / {course.totalLecturesCount || course.lecturesCount} lectures
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-[#E6E8EC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Stats Row: Study Material & Expiry Status */}
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#667085]">
                    <span className="flex items-center gap-1 font-semibold text-[#0A1D3F]">
                      <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" />
                      {course.totalBooksCount || course.booksCount} Study Materials
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#17B26A] bg-[#17B26A]/10 px-1.5 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3" />
                      Active • Exp: {course.expiryDate || "15 March 2027"}
                    </span>
                  </div>
                </div>

                {/* Continue Learning Action */}
                <div className="pt-2 border-t border-[#E6E8EC]/70">
                  <Link
                    to={`/coaching/${course.id}/dashboard`}
                    className="w-full py-2 px-3 rounded-md bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
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
