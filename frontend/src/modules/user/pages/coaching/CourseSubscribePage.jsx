import { VerifiedCoursePurchase } from '../../components/coaching/VerifiedCoursePurchase';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

// Buying or renewing a course plan. All prices, plans and access come from the server
// through VerifiedCoursePurchase; this page only frames it.
export const CourseSubscribePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    coachingService.getCourseById(id, controller.signal).then(setCourse).catch(() => { if (!controller.signal.aborted) setCourse(null); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  if (loading) return <SkeletonLoader type="card" count={2} />;
  if (!course) return <ErrorState title="Course unavailable" message="This course is not available to buy right now." onRetry={() => navigate("/coaching")} />;

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition">
        <ArrowLeft className="w-4 h-4" /><span>Back to Course</span>
      </button>
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-4 sm:p-5 flex items-center gap-3">
        {course.thumbnail && <img src={course.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-[#0A1D3F] break-words">{course.title}</h1>
          <p className="text-xs text-[#667085]">{[course.board, course.class && 'Class ' + course.class, course.teacher].filter(Boolean).join(' • ')}</p>
        </div>
      </div>
      <VerifiedCoursePurchase course={course} onRefresh={async () => setCourse(await coachingService.getCourseById(id))} />
      <p className="flex items-center gap-2 text-xs text-[#667085]"><ShieldCheck className="w-4 h-4 text-[#FF8A00] shrink-0" />Secure payment through Razorpay. Access starts as soon as the payment is confirmed.</p>
    </div>
  );
};
