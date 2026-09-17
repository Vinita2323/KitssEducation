import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  BookOpen,
  Video,
  Award,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export const StudentProfile = ({ student, enrolledCourses = [] }) => {
  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 card-shadow space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b border-[#E6E8EC]">
          <div className="relative">
            <img
              src={
                student.avatar ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              }
              alt={student.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#133C8B] shadow-sm"
            />
            <div className="absolute -bottom-1.5 -right-1.5 bg-[#17B26A] text-white p-1 rounded-full border-2 border-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[#0A1D3F]">
                {student.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/30 font-mono">
                {student.id}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#667085]">
              Registered Online Coaching Scholar • {student.board} ({student.class})
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#133C8B]/10 text-[#133C8B] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Email Address
              </span>
              <span className="font-semibold text-[#0A1D3F] truncate block">
                {student.email || "Not Provided"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/10 text-[#FF8A00] flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Mobile Number
              </span>
              <span className="font-semibold text-[#0A1D3F] truncate block">
                {student.phone || "Not Provided"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Academic Board & Class
              </span>
              <span className="font-semibold text-[#0A1D3F] truncate block">
                {student.board} • {student.class}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Location
              </span>
              <span className="font-semibold text-[#0A1D3F] truncate block">
                {student.city}, {student.state}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A1D3F]/10 text-[#0A1D3F] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Date of Birth
              </span>
              <span className="font-semibold text-[#0A1D3F] truncate block">
                {student.dob || "15 Aug 2009"}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#133C8B]/10 text-[#133C8B] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] block">
                Security Profile
              </span>
              <span className="font-semibold text-[#17B26A] truncate block">
                Single-Device Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* "My Learning" Section with Enrolled Courses and Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0A1D3F]">
            My Learning ({enrolledCourses.length} Enrolled Courses)
          </h3>
          <Link
            to="/coaching"
            className="text-xs font-semibold text-[#133C8B] hover:text-[#FF8A00] flex items-center gap-1 transition"
          >
            <span>Explore More Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-8 text-center space-y-3">
            <h4 className="font-bold text-sm text-[#0A1D3F]">No Courses Joined Yet</h4>
            <p className="text-xs text-[#667085]">
              Enroll in a coaching course to begin watching lectures and reading books.
            </p>
            <Link
              to="/coaching"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF8A00] text-white font-bold text-xs"
            >
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-[#E6E8EC] p-4 sm:p-5 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E6E8EC] shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm sm:text-base text-[#0A1D3F] truncate">
                      {course.title}
                    </h4>
                    <span className="text-xs text-[#667085] block">
                      {course.board} • {course.class} • {course.duration}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#17B26A] font-semibold">
                      <span>{course.progressPercentage || 0}% Completed</span>
                      <span>•</span>
                      <span>{course.completedLectures || 0} Lectures Finished</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/coaching/${course.id}/dashboard`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
