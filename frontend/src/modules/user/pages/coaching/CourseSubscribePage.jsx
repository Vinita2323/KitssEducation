import { VerifiedCoursePurchase } from '../../components/coaching/VerifiedCoursePurchase';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Smartphone,
  CreditCard,
  Building,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { orderService } from "../../services/orderService";
import { openRazorpayCheckout } from "../../services/razorpayService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { Modal } from "../../components/common/Modal";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

export const CourseSubscribePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { markCourseSubscribed } = useLibrary();
  const { showSuccess, showError } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionResult, setSubscriptionResult] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourseById(id);
        setCourse(data);
      } catch (err) {
        console.error("Course load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const plans = course?.subscriptionPlans ?? [];
  const currentPlan = plans.find((p) => p.id === selectedPlan) || plans[0] || { name: 'No approved plan', duration: 'Not configured', price: null };

  const handleSubscribe = async () => showError('Razorpay Test Mode is disabled. Renewal policy requires separate approval.');

  if (loading) {
    return <SkeletonLoader type="card" count={2} />;
  }

  if (!course) {
    return (
      <ErrorState
        title="Coaching Checkout Unavailable"
        message="Purchases and renewals require an approved course catalogue, real plans, validity and eligibility policies. No enrollment is granted."
        onRetry={() => navigate("/coaching")}
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <VerifiedCoursePurchase course={course} onRefresh={async () => setCourse(await coachingService.getCourseById(id))} />
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course</span>
        </button>
        <span className="text-xs font-semibold text-[#667085]">Course Subscription</span>
      </div>

      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-7 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
            Select Subscription Plan
          </h2>
          <p className="text-xs text-[#667085] mt-0.5">
            Prepaid access according to the explicitly configured plan
          </p>
        </div>

        {/* Course Header */}
        <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] flex items-center gap-3">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
              {course.title}
            </h4>
            <p className="text-[11px] text-[#667085] truncate">
              {course.board} • Class {course.class} • {course.videoCount}+ Videos
            </p>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="space-y-2.5">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? "bg-orange-50/50 border-[#FF8A00] ring-1 ring-[#FF8A00]"
                    : "bg-white border-[#E6E8EC] hover:bg-gray-50"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                      {plan.name}
                    </h5>
                    {plan.isPopular && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FF8A00] text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#667085]">{plan.duration}</p>
                  {plan.features?.length > 0 && <ul aria-label={plan.name+' benefits'} className="list-disc pl-4 text-xs text-[#667085]">{plan.features.map((feature,index)=><li key={index}>{feature}</li>)}</ul>}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm sm:text-base font-bold text-[#0A1D3F]">
                    ₹{plan.price}
                  </span>
                  {plan.originalPrice != null && <span className="text-xs text-[#667085] line-through block">
                    ₹{plan.originalPrice}
                  </span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment Gateway Info */}
        <div className="p-3 bg-[#0A1D3F]/5 rounded-xl border border-[#0A1D3F]/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF8A00] shrink-0" />
            <div>
              <span className="font-bold text-[#0A1D3F]">Razorpay Payment Gateway</span>
              <p className="text-[11px] text-[#667085]">Supports UPI, Cards, Net Banking & Wallets</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#17B26A]/10 text-[#17B26A] border border-[#17B26A]/20">
            Test Mode
          </span>
        </div>

        {/* Order Bill Summary */}
        <div className="p-4 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#667085]">
            <span>Subscription Plan:</span>
            <span className="font-semibold text-[#0A1D3F]">{currentPlan.name}</span>
          </div>
          <div className="flex justify-between text-[#667085]">
            <span>Duration:</span>
            <span>{currentPlan.duration}</span>
          </div>
          <div className="border-t border-[#E6E8EC] pt-2 flex justify-between text-sm font-bold text-[#0A1D3F]">
            <span>Total Payable:</span>
            <span className="text-[#FF8A00]">₹{currentPlan.price}</span>
          </div>
        </div>

        {/* CTA */}
        <div>
          <PrimaryButton
            variant="orange"
            size="lg"
            fullWidth
            onClick={handleSubscribe}
            loading={processing}
            disabled
          >
            Test payments unavailable
          </PrimaryButton>
        </div>
      </div>

      {/* Subscription Active Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/coaching/${course.id}/player`);
        }}
        title="Subscription Activated!"
        showClose={false}
      >
        <div className="text-center py-2 space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#ECFDF3] border border-[#17B26A]/30 flex items-center justify-center text-[#17B26A] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-base font-extrabold text-[#0A1D3F]">
            You're Ready to Learn!
          </h3>
          <p className="text-xs text-[#667085]">
            Your access pass to <strong>{course.title}</strong> is now live.
          </p>

          {subscriptionResult && (
            <div className="p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC] text-left text-xs space-y-1">
              <div className="flex justify-between text-[#667085]">
                <span>Status:</span>
                <span className="font-bold text-[#17B26A]">Active</span>
              </div>
              <div className="flex justify-between text-[#667085]">
                <span>Start Date:</span>
                <span className="font-semibold text-[#0A1D3F]">{subscriptionResult.startDate}</span>
              </div>
              <div className="flex justify-between text-[#667085]">
                <span>Expiry Date:</span>
                <span className="font-semibold text-[#0A1D3F]">{subscriptionResult.expiryDate}</span>
              </div>
            </div>
          )}

          <div className="pt-3">
            <PrimaryButton
              variant="navy"
              size="md"
              fullWidth
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/coaching/${course.id}/player`);
              }}
              icon={ArrowRight}
            >
              Start Watching Lectures
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};
