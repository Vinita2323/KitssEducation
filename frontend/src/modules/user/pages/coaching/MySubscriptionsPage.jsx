import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Video, Calendar, Clock, AlertTriangle, RefreshCw, CheckCircle2, Play } from "lucide-react";
import { subscriptionService } from "../../services/subscriptionService";
import { useToast } from "../../context/ToastContext";
import { StatusBadge, ProgressBar } from "../../components/common/SectionHeader";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

export const MySubscriptionsPage = () => {
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'expired'
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess } = useToast();

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        setLoading(true);
        const data = await subscriptionService.getSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        console.error("Subs fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const handleRenew = async (subId) => {
    try {
      const res = await subscriptionService.renewSubscription(subId);
      if (res.success) {
        showSuccess("Subscription renewed for 1 Year!");
        const updated = await subscriptionService.getSubscriptions();
        setSubscriptions(updated);
        setActiveTab("active");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeSubs = subscriptions.filter((s) => s.status.toLowerCase() === "active");
  const expiredSubs = subscriptions.filter((s) => s.status.toLowerCase() === "expired");

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A1D3F] tracking-tight">
          My Subscriptions
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
          Manage your active learning passes and renewal periods
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E8EC]">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition duration-200 touch-target ${
            activeTab === "active"
              ? "border-[#17B26A] text-[#17B26A]"
              : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Plans</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-100 text-green-800">
            {activeSubs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("expired")}
          className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition duration-200 touch-target ${
            activeTab === "expired"
              ? "border-[#D92D20] text-[#D92D20]"
              : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Expired Plans</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800">
            {expiredSubs.length}
          </span>
        </button>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <SkeletonLoader type="card" count={2} />
      ) : activeTab === "active" ? (
        <div className="space-y-4">
          {activeSubs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Active Subscriptions"
              description="Explore online coaching to start learning with structured video courses."
              actionText="Explore Courses"
              onAction={() => {}}
            />
          ) : (
            activeSubs.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status="Active" size="sm" />
                      <span className="text-xs text-[#667085] font-semibold">
                        {sub.plan}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                      {sub.title}
                    </h3>
                  </div>

                  <Link
                    to={`/coaching/${sub.courseId}/player`}
                    className="px-4 py-2.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Watch Lectures</span>
                  </Link>
                </div>

                {/* Dates & Validity */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] text-xs">
                  <div>
                    <span className="text-[#667085] block text-[11px]">Activated On</span>
                    <span className="font-semibold text-[#0A1D3F]">{sub.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[#667085] block text-[11px]">Valid Until</span>
                    <span className="font-semibold text-[#0A1D3F]">{sub.expiryDate}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[#667085] block text-[11px]">Time Left</span>
                    <span className="font-bold text-[#17B26A]">
                      {sub.daysRemaining} Days Remaining
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-[#667085] mb-1">
                    <span>Course Progress</span>
                    <span className="font-bold text-[#FF8A00]">{sub.progress}%</span>
                  </div>
                  <ProgressBar progress={sub.progress} color="orange" height="h-2" />
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {expiredSubs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Expired Subscriptions"
              description="All your active passes are up to date."
            />
          ) : (
            expiredSubs.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-red-100 p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status="Expired" size="sm" />
                      <span className="text-xs text-[#667085] font-semibold">
                        {sub.plan}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
                      {sub.title}
                    </h3>
                  </div>

                  <PrimaryButton
                    variant="orange"
                    size="md"
                    onClick={() => handleRenew(sub.id)}
                    icon={RefreshCw}
                  >
                    Renew Subscription
                  </PrimaryButton>
                </div>

                <div className="p-3 bg-red-50/50 rounded-2xl border border-red-100 text-xs flex items-center justify-between text-[#667085]">
                  <span>Expired on: <strong>{sub.expiryDate}</strong></span>
                  <span className="text-red-700 font-semibold">Access Paused</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
