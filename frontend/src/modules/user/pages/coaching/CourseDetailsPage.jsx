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
  ArrowRight,
  CreditCard,
  Zap,
  Check
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { orderService } from "../../services/orderService";
import { openRazorpayCheckout, RAZORPAY_CONFIG } from "../../services/razorpayService";
import { useAuth } from "../../context/AuthContext";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { markCourseSubscribed } = useLibrary();
  const { showSuccess, showError, showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enrollment & Razorpay modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("plan-12m");
  const [paymentDetails, setPaymentDetails] = useState(null);

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

  const defaultPlans = [
    {
      id: "plan-12m",
      name: "12 Months Full NEET Master Pass",
      duration: "12 Months Access",
      price: course?.price || 1499,
      originalPrice: course?.originalPrice || 4999,
      discount: course?.discountText || "70% OFF",
      isPopular: true,
      features: [
        `All ${course?.lecturesCount || 95} Video Lectures`,
        `All ${course?.booksCount || 14} Digital Handbooks`,
        "Weekly NEET Assessments",
        "Doubt Resolution Mentorship"
      ]
    },
    {
      id: "plan-6m",
      name: "6 Months Semester Sprint",
      duration: "6 Months Access",
      price: 899,
      originalPrice: 2999,
      discount: "70% OFF",
      isPopular: false,
      features: [
        `All ${course?.lecturesCount || 95} Video Lectures`,
        "Digital Handbooks",
        "Monthly Mock Tests"
      ]
    },
    {
      id: "plan-3m",
      name: "3 Months Exam Crash Course",
      duration: "3 Months Access",
      price: 499,
      originalPrice: 1499,
      discount: "66% OFF",
      isPopular: false,
      features: [
        "High-Yield Concept Lectures",
        "Formula Sheets & Revision Handbooks"
      ]
    }
  ];

  const availablePlans =
    course?.subscriptionPlans && course.subscriptionPlans.length > 0
      ? course.subscriptionPlans
      : defaultPlans;

  const currentSelectedPlan =
    availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  const handleRazorpayPayment = async () => {
    if (!course) return;

    try {
      setJoining(true);
      await openRazorpayCheckout({
        amountInRupees: currentSelectedPlan.price,
        course,
        plan: currentSelectedPlan,
        student: {
          name: user?.name || "Rohan Sharma",
          email: user?.email || "rohan.sharma@example.com",
          phone: user?.phone || "+91 98765 43210",
        },
        onSuccess: async (razorpayResponse) => {
          try {
            await coachingService.joinCourse(course.id);

            await orderService.createOrder({
              productName: `${course.title} (${currentSelectedPlan.name})`,
              type: "Course",
              category: "Online Coaching",
              amount: currentSelectedPlan.price,
              originalAmount: currentSelectedPlan.originalPrice,
              discountAmount: currentSelectedPlan.originalPrice - currentSelectedPlan.price,
              paymentMethod: `Razorpay (${razorpayResponse.razorpay_payment_id})`,
              transactionId: razorpayResponse.razorpay_payment_id,
            });

            if (markCourseSubscribed) {
              markCourseSubscribed(course.id);
            }

            setPaymentDetails({
              paymentId: razorpayResponse.razorpay_payment_id,
              amount: currentSelectedPlan.price,
              planName: currentSelectedPlan.name,
            });
            setJoinedSuccess(true);
            setCourse((prev) => ({ ...prev, isEnrolled: true }));
            showSuccess(`Payment Successful! Payment ID: ${razorpayResponse.razorpay_payment_id}`);
          } catch (enrollErr) {
            console.error("Post-payment enrollment error:", enrollErr);
            showError("Payment received, error activating subscription. Please refresh.");
          } finally {
            setJoining(false);
          }
        },
        onFailure: (err) => {
          console.error("Razorpay error:", err);
          showError(err.message || "Payment transaction could not be processed.");
          setJoining(false);
        },
        onDismiss: () => {
          showInfo("Razorpay checkout dismissed.");
          setJoining(false);
        },
      });
    } catch (err) {
      console.error("Razorpay launch error:", err);
      showError("Could not launch Razorpay checkout.");
      setJoining(false);
    }
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
                  {course.teacherRole || "Senior Subject Specialist"}
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

            {/* Pricing & Plan Highlight */}
            {!isEnrolled && (
              <div className="pt-2 border-t border-[#E6E8EC] space-y-1">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-black text-[#0A1D3F]">
                      ₹{currentSelectedPlan.price}
                    </span>
                    {currentSelectedPlan.originalPrice && (
                      <span className="text-xs text-[#667085] line-through">
                        ₹{currentSelectedPlan.originalPrice}
                      </span>
                    )}
                  </div>
                  {currentSelectedPlan.discount && (
                    <span className="text-[10px] font-bold text-[#17B26A] bg-[#17B26A]/10 px-2 py-0.5 rounded-full border border-[#17B26A]/20">
                      {currentSelectedPlan.discount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#667085] font-medium">
                  Selected Plan: <span className="font-bold text-[#0A1D3F]">{currentSelectedPlan.name}</span>
                </p>
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
                /* Logged in, not yet enrolled - Open Razorpay Purchase Modal */
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full py-2.5 px-3 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
                  >
                    <span>Join Course • ₹{currentSelectedPlan.price}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#667085]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#17B26A]" />
                    <span>Secured by <strong>Razorpay</strong> (Test Key Active)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Plan Selection & Checkout Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-lg border border-[#E6E8EC] p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in duration-150 my-8">
            {joinedSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 rounded-full bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center mx-auto ring-8 ring-[#17B26A]/5">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#17B26A] bg-[#17B26A]/10 px-2.5 py-0.5 rounded-full">
                    Payment Verified
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#0A1D3F] mt-1.5">
                    Course Enrolled Successfully!
                  </h3>
                  <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                    You now have complete access to all video lectures, chapter notes, and study material for {course.title}.
                  </p>
                </div>

                {/* Receipt Summary Box */}
                <div className="p-3.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-left space-y-2 text-xs text-[#0A1D3F]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
                    <span className="text-[#667085]">Payment Gateway:</span>
                    <span className="font-bold text-[#133C8B] flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" /> Razorpay (Test Mode)
                    </span>
                  </div>
                  {paymentDetails?.paymentId && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#667085]">Payment ID:</span>
                      <span className="font-mono font-bold text-[#0A1D3F] bg-white px-2 py-0.5 rounded border border-[#E6E8EC]">
                        {paymentDetails.paymentId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[#667085]">Plan Subscribed:</span>
                    <span className="font-semibold text-[#0A1D3F]">{paymentDetails?.planName || currentSelectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E6E8EC]">
                    <span className="font-bold text-[#0A1D3F]">Amount Paid:</span>
                    <span className="font-black text-sm text-[#17B26A]">₹{paymentDetails?.amount || currentSelectedPlan.price}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    to={`/coaching/${course.id}/dashboard`}
                    className="flex-1 py-2.5 px-4 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <span>Go to Course Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="py-2.5 px-4 rounded-md border border-[#E6E8EC] text-xs font-semibold text-[#667085] hover:text-[#0A1D3F] transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Modal Header */}
                <div className="border-b border-[#E6E8EC] pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
                      Checkout & Enrollment
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-[#0A1D3F]">
                      Choose Your Plan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1 rounded-md text-[#667085] hover:text-[#0A1D3F] hover:bg-[#F7F8FA] transition text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* Course Mini Badge */}
                <div className="p-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-[#0A1D3F] truncate">{course.title}</h4>
                    <p className="text-[11px] text-[#667085]">{course.board} • {course.class} • {course.duration}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-[#133C8B]/10 text-[#133C8B]">
                    {course.courseType || "Standard"}
                  </span>
                </div>

                {/* Subscription Plans Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#0A1D3F] block">
                    Available Access Plans:
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {availablePlans.map((plan) => {
                      const isSelected = plan.id === currentSelectedPlan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-3 rounded-md border text-xs cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? "bg-[#FFF8F0] border-[#FF8A00] shadow-xs ring-1 ring-[#FF8A00]"
                              : "bg-white border-[#E6E8EC] hover:border-[#FF8A00]/50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-[#FF8A00] bg-[#FF8A00]"
                                  : "border-[#D0D5DD] bg-white"
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[#0A1D3F]">{plan.name}</span>
                                {plan.isPopular && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FF8A00] text-white">
                                    Best Value
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#667085]">{plan.duration}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 pl-2">
                            <div className="font-black text-sm text-[#0A1D3F]">
                              ₹{plan.price}
                            </div>
                            {plan.originalPrice && (
                              <div className="text-[10px] text-[#667085] line-through">
                                ₹{plan.originalPrice}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-3 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] space-y-1.5 text-xs text-[#0A1D3F]">
                  <div className="flex justify-between text-[#667085]">
                    <span>Original Price:</span>
                    <span className="line-through">₹{currentSelectedPlan.originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-[#17B26A] font-semibold">
                    <span>Discount Applied:</span>
                    <span>-₹{currentSelectedPlan.originalPrice - currentSelectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-[#E6E8EC] font-black text-sm">
                    <span className="text-[#0A1D3F]">Total Amount:</span>
                    <span className="text-[#FF8A00]">₹{currentSelectedPlan.price}</span>
                  </div>
                </div>

                {/* Razorpay Gateway Badge & Credential Info */}
                <div className="p-2.5 rounded-md bg-[#0A1D3F]/5 border border-[#0A1D3F]/10 flex items-center justify-between text-[11px] text-[#0A1D3F]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#FF8A00] shrink-0" />
                    <div>
                      <p className="font-bold">Razorpay Test Gateway</p>
                      <p className="text-[10px] text-[#667085]">Key: <code className="font-mono bg-white px-1 rounded border border-[#E6E8EC]">rzp_test_TRZdg2aAOYv4KK</code></p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#17B26A]/10 text-[#17B26A] border border-[#17B26A]/20 shrink-0">
                    Live Test
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-md border border-[#E6E8EC] text-[#667085] hover:text-[#0A1D3F] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={joining}
                    className="flex-2 py-2.5 px-3 rounded-md bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {joining ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay ₹{currentSelectedPlan.price} with Razorpay</span>
                      </>
                    )}
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
