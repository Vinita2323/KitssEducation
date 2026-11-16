import { VerifiedCoursePurchase } from '../../components/coaching/VerifiedCoursePurchase';
import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  BookOpen,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Share2,
  ArrowRight
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Plans are chosen and paid for only in the Course access section (VerifiedCoursePurchase).
  const courseAccess = useRef(null);

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

  const availablePlans = course?.subscriptionPlans ?? [];
  const lowestPlan = availablePlans.reduce((low, plan) => (low === null || plan.priceMinor < low.priceMinor ? plan : low), null);
  const showCourseAccess = () => {
    const section = courseAccess.current;
    if (!section) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    section.focus({ preventScroll: true });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="h-44 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-6 bg-slate-200 rounded-md w-2/3 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded-md w-1/3 animate-pulse" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center bg-white rounded-md border border-[#E6E8EC] shadow-xs space-y-3 my-6">
        <h2 className="text-lg font-bold text-[#0A1D3F]">Course Not Found</h2>
        <p className="text-xs text-[#667085]">{error || "The requested coaching course could not be located."}</p>
        <Link
          to="/coaching"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A1D3F] text-white font-bold text-xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Coaching
        </Link>
      </div>
    );
  }

  const isEnrolled = course.isEnrolled;

  return (
    <div className="max-w-5xl mx-auto space-y-3 sm:space-y-4">
      <section className="bg-white border border-[#E6E8EC] rounded-xl p-4 space-y-2"><h2 className="font-bold text-[#0A1D3F]">Course syllabus</h2>{course.syllabus?.lessons.map(lesson=><div key={lesson.id} className="p-2 border-b text-sm">{lesson.locked?<span>{lesson.title} — Enrollment required</span>:<Link to={`/coaching/${course.id}/lecture/${lesson.id}`}>{lesson.title}{lesson.previewAllowed?' — Public preview':''}</Link>}</div>)}</section>
      <div id="course-access" ref={courseAccess} tabIndex={-1} className="scroll-mt-20 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A00]">
        <VerifiedCoursePurchase course={course} onRefresh={async () => setCourse(await coachingService.getCourseById(id))} />
      </div>
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <Link
          to="/coaching"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </Link>

        <button
          type="button"
          onClick={handleShare}
          className="p-1.5 rounded-md bg-white border border-[#E6E8EC] text-[#667085] hover:text-[#0A1D3F] hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          title="Share Course"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Course Banner Section (Minimized Border Radius: rounded-md) */}
      <div className="relative rounded-md overflow-hidden bg-[#0A1D3F] border border-[#133C8B] shadow-md text-white min-h-[160px] sm:min-h-[190px] flex flex-col justify-end p-4 sm:p-6">
        {/* Banner Background Image with Gradient Overlay */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={course.banner || course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1D3F] via-[#0A1D3F]/65 to-transparent" />
        </div>

        {/* Compact Banner Details */}
        <div className="relative z-10 space-y-2 sm:space-y-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FF8A00] text-white shadow-2xs">
              {course.board}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
              Class {course.class}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#17B26A] text-white">
              {course.status}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
            {course.title}
          </h1>

          <p className="text-xs sm:text-sm text-white/80 max-w-2xl font-normal leading-relaxed line-clamp-2">
            {course.subtitle || course.description}
          </p>

          {/* Key Metrics Row */}
          <div className="flex items-center gap-3 sm:gap-5 pt-1 text-xs text-white/90 flex-wrap">
            <span className="flex items-center gap-1 font-semibold">
              <Video className="w-3.5 h-3.5 text-[#FF8A00]" /> {course.lecturesCount} Lectures
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-[#17B26A]" /> {course.booksCount} Study Materials
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> {course.duration} Validity
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Course Details vs CTA Sidebar Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-start">
        {/* Left Column: Full Details, Faculty, What You'll Learn, Benefits */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-3.5">
          {/* About Course Card (Minimized Border Radius: rounded-md) */}
          <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Course Description
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              {course.description}
            </p>

            {/* Covered Subjects */}
            <div className="pt-2 border-t border-[#E6E8EC] space-y-1.5">
              <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
                Covered Subjects
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {course.subjects?.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-xs font-semibold bg-[#F4F0FF] text-[#6C4AB6] border border-[#6C4AB6]/20"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* What You'll Learn Card (Minimized Border Radius: rounded-md) */}
          <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              What You'll Learn
            </h2>
            <div className="space-y-1.5">
              {(course.whatYouWillLearn || []).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-[#0A1D3F]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#17B26A] shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Faculty / Instructor Card (Minimized Border Radius: rounded-md) */}
          <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-2">
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Course Faculty & Mentors
            </h2>
            <div className="flex items-center gap-3">
              <img
                src={
                  course.teacherAvatar ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }
                alt={course.teacher}
                className="w-12 h-12 rounded-md object-cover border border-[#0A1D3F]/10 shadow-2xs shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-extrabold text-sm text-[#0A1D3F] truncate">
                  {course.teacher}
                </h3>
                <p className="text-[11px] text-[#FF8A00] font-semibold">
                  {course.teacherRole || "Published instructor profile"}
                </p>
                <p className="text-xs text-[#667085] leading-tight line-clamp-2">
                  Dedicated educator guiding students toward concept mastery and top board percentiles.
                </p>
              </div>
            </div>
          </div>

          {/* Course Benefits (Minimized Border Radius: rounded-md) */}
          <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
              Course Benefits & Protection
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(course.benefits || []).map((benefit, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#0A1D3F] flex items-start gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF8A00] shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Join / Registration CTA Card (Minimized Border Radius: rounded-md) */}
        <div className="lg:col-span-1 sticky top-20 space-y-3">
          <div className="bg-white rounded-md border border-[#E6E8EC] p-4 shadow-2xs space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
                Enrollment Status
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-[#0A1D3F]">
                {isEnrolled ? "You are Enrolled" : "Join this Course"}
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                {isEnrolled
                  ? "You have active access to all video lectures, chapter notes, and study material."
                  : "Register or log in to unlock complete video lectures and digital study materials."}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-1.5 pt-2 border-t border-[#E6E8EC] text-xs text-[#0A1D3F]">
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

            {/* Plan price summary. Plans are chosen and paid for in the Course access section. */}
            {!isEnrolled && (
              <div className="pt-2 border-t border-[#E6E8EC] space-y-1">
                {lowestPlan ? (
                  <>
                    <span className="text-xl sm:text-2xl font-black text-[#0A1D3F]">
                      {lowestPlan.priceMinor === 0 ? "Free" : (availablePlans.length > 1 ? "From " : "") + "₹" + lowestPlan.price}
                    </span>
                    <p className="text-[11px] text-[#667085] font-medium">
                      {availablePlans.length} approved plan{availablePlans.length === 1 ? "" : "s"} available
                      {lowestPlan.name ? <> · <span className="font-bold text-[#0A1D3F]">{lowestPlan.name}</span></> : null}
                    </p>
                    {lowestPlan.features?.length > 0 && <ul aria-label="Selected plan benefits" className="list-disc pl-4 text-xs text-[#667085] space-y-1">{lowestPlan.features.map((feature, index) => <li key={index}>{feature}</li>)}</ul>}
                  </>
                ) : (
                  <p className="text-xs text-[#667085]">No plan is on sale for this course yet.</p>
                )}
              </div>
            )}

            {/* CTA Buttons (Minimized Border Radius: rounded-md) */}
            <div className="pt-2">
              {!isAuthenticated ? (
                /* Not registered / logged in */
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#0A1D3F] text-center">
                    Register to Join This Course
                  </p>
                  <Link
                    to="/coaching/register"
                    className="w-full py-2.5 px-3 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 text-center cursor-pointer"
                  >
                    <span>Register Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : isEnrolled ? (
                /* Already enrolled */
                <Link
                  to={`/coaching/${course.id}/dashboard`}
                  className="w-full py-2.5 px-3 rounded-md bg-[#17B26A] hover:bg-[#067647] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 text-center cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Go to Course Dashboard</span>
                </Link>
              ) : (
                /* Logged in, not yet enrolled - take the student to the Course access section */
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={showCourseAccess}
                    className="w-full py-2.5 px-3 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
                  >
                    <span>View approved plans</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#667085]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#17B26A]" />
                    <span>Choose a plan in the Course access section</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
