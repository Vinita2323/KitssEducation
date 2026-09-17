import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Users,
  ShieldCheck,
  Star,
  User,
  Share2,
  Lock,
  ArrowRight
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enrollment confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await coachingService.getCourseById(id);
        setCourse(data);
      } catch (err) {
        console.error("Course load error:", err);
        setError(err.message || "Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: course?.title,
        text: `Explore ${course?.title} on KITSS Education!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Course link copied to clipboard!");
    }
  };

  const handleConfirmJoin = async () => {
    try {
      setJoining(true);
      await coachingService.joinCourse(course.id);
      setJoinedSuccess(true);
      showSuccess("Course Joined Successfully!");
    } catch (err) {
      console.error("Join error:", err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center bg-white rounded-2xl border border-[#E6E8EC] card-shadow space-y-4">
        <h2 className="text-xl font-bold text-[#0A1D3F]">Course Not Found</h2>
        <p className="text-xs text-[#667085]">{error || "The requested coaching course could not be located."}</p>
        <Link
          to="/coaching"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A1D3F] text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Coaching
        </Link>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <Link
          to="/coaching"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#667085] hover:text-[#0A1D3F] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="p-2 rounded-xl bg-white border border-[#E6E8EC] text-[#667085] hover:text-[#0A1D3F] transition card-shadow cursor-pointer"
          title="Share Course"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Course Banner Section */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0A1D3F] border border-[#133C8B] shadow-xl text-white">
        <div className="relative aspect-21/9 sm:aspect-16/7 w-full overflow-hidden">
          <img
            src={course.banner || course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1D3F] via-[#0A1D3F]/60 to-transparent" />
        </div>

        {/* Floating Banner Details */}
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF8A00] text-white shadow-xs">
              {course.board}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
              {course.class}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#17B26A] text-white">
              {course.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-2xl font-normal leading-relaxed">
            {course.subtitle || course.description}
          </p>

          {/* Key Metrics Row */}
          <div className="flex items-center gap-4 sm:gap-6 pt-2 text-xs sm:text-sm text-white/90 flex-wrap">
            <span className="flex items-center gap-1.5 font-semibold">
              <Video className="w-4 h-4 text-[#FF8A00]" /> {course.lecturesCount} Lectures
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <BookOpen className="w-4 h-4 text-[#17B26A]" /> {course.booksCount} Study Materials
            </span>
            <span className="flex items-center gap-1.5 font-semibold">
              <Clock className="w-4 h-4 text-sky-400" /> {course.duration} Duration
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Course Details vs CTA Sidebar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Left Column: Full Details, Faculty, What You'll Learn, Benefits */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Course */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-6 card-shadow space-y-3">
            <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F]">
              Course Description
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              {course.description}
            </p>

            {/* Subjects included */}
            <div className="pt-3 border-t border-[#E6E8EC] space-y-2">
              <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">
                Covered Subjects
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {course.subjects?.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#F4F0FF] text-[#6C4AB6] border border-[#6C4AB6]/20"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* What You'll Learn */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-6 card-shadow space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F]">
              What You'll Learn
            </h2>
            <div className="space-y-2.5">
              {(course.whatYouWillLearn || []).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#0A1D3F]">
                  <CheckCircle2 className="w-4 h-4 text-[#17B26A] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty / Instructor Card */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-6 card-shadow space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F]">
              Course Faculty & Mentors
            </h2>
            <div className="flex items-center gap-4">
              <img
                src={
                  course.teacherAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }
                alt={course.teacher}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#0A1D3F]/10 shadow-xs"
              />
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-[#0A1D3F]">
                  {course.teacher}
                </h3>
                <p className="text-xs text-[#FF8A00] font-semibold">
                  {course.teacherRole || "Senior Subject Specialist"}
                </p>
                <p className="text-xs text-[#667085]">
                  Dedicated educator guiding students toward concept mastery and top board percentiles.
                </p>
              </div>
            </div>
          </div>

          {/* Course Benefits */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-6 card-shadow space-y-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0A1D3F]">
              Course Benefits & Protection
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(course.benefits || []).map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#0A1D3F] flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-[#FF8A00] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Join / Registration CTA Card */}
        <div className="lg:col-span-1 sticky top-24 space-y-4">
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 card-shadow space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A00]">
                Enrollment Status
              </span>
              <h3 className="font-black text-xl text-[#0A1D3F]">
                {isEnrolled ? "You are Enrolled" : "Join this Course"}
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                {isEnrolled
                  ? "You have active access to all video lectures, chapter notes, and study material."
                  : "Register or log in to unlock complete video lectures and digital study materials."}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-2.5 pt-2 border-t border-[#E6E8EC] text-xs text-[#0A1D3F]">
              <div className="flex items-center justify-between">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#133C8B]" /> Video Lectures
                </span>
                <span className="font-bold">{course.lecturesCount} Lessons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#FF8A00]" /> Study Materials
                </span>
                <span className="font-bold">{course.booksCount} Handbooks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#17B26A]" /> Access Validity
                </span>
                <span className="font-bold">{course.duration}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-3">
              {!isAuthenticated ? (
                /* Not registered / logged in: Show "Register to Join This Course" */
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#0A1D3F] text-center">
                    Register to Join This Course
                  </p>
                  <Link
                    to="/coaching/register"
                    className="w-full py-3 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-center"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : isEnrolled ? (
                /* Already enrolled */
                <Link
                  to={`/coaching/${course.id}/dashboard`}
                  className="w-full py-3 px-4 rounded-xl bg-[#17B26A] hover:bg-[#067647] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 text-center"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Go to Course Dashboard</span>
                </Link>
              ) : (
                /* Logged in, not yet enrolled */
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full py-3 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>Join Course</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-150">
            {joinedSuccess ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-[#0A1D3F]">
                  Course Joined Successfully
                </h3>
                <p className="text-xs sm:text-sm text-[#667085]">
                  You now have access to all video lectures, notes, and study material for {course.title}.
                </p>
                <Link
                  to={`/coaching/${course.id}/dashboard`}
                  className="w-full py-3 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Go to My Course</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-b border-[#E6E8EC] pb-3">
                  <h3 className="text-lg font-black text-[#0A1D3F]">
                    Confirm Course Enrollment
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    You are about to join this course.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] space-y-2 text-xs text-[#0A1D3F]">
                  <h4 className="font-extrabold text-sm text-[#0A1D3F]">
                    {course.title}
                  </h4>
                  <p><strong>Board:</strong> {course.board}</p>
                  <p><strong>Class:</strong> {course.class}</p>
                  <p><strong>Duration:</strong> {course.duration}</p>
                  <p><strong>Subjects:</strong> {course.subjects?.join(", ")}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-[#E6E8EC] text-[#667085] hover:text-[#0A1D3F] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmJoin}
                    disabled={joining}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs transition cursor-pointer"
                  >
                    {joining ? "Joining..." : "Confirm & Join"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
