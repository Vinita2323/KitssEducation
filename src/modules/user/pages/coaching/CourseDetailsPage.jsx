import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  FileText,
  Star,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  Share2,
  PlayCircle,
  HelpCircle,
  BookOpen
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { PriceDisplay, RatingBadge } from "../../components/common/SectionHeader";
import { PrimaryButton, SecondaryButton } from "../../components/common/PrimaryButton";
import { ChapterAccordion } from "../../components/coaching/ChapterAccordion";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

export const CourseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCourseEnrolled } = useLibrary();
  const { showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourseById(id);
        setCourse(data);
      } catch (err) {
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
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Course link copied to clipboard!");
    }
  };

  if (loading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  if (error || !course) {
    return (
      <ErrorState
        title="Course Not Found"
        message={error || "Could not retrieve the course."}
        onRetry={() => navigate("/coaching")}
      />
    );
  }

  const enrolled = isCourseEnrolled(course.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="p-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 active:scale-95 transition text-[#0A1D3F]"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Course Hero Card */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-7 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Course Preview Media */}
          <div className="md:col-span-6">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-black shadow-md group">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                <Link
                  to={`/coaching/${course.id}/player`}
                  className="w-14 h-14 rounded-full bg-[#FF8A00] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
                >
                  <PlayCircle className="w-8 h-8 fill-current" />
                </Link>
              </div>

              <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
                ▶ Preview Lecture 1
              </div>
            </div>
          </div>

          {/* Details & CTA */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0A1D3F] text-white">
                  {course.board}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8A00]/15 text-[#FF8A00]">
                  Class {course.class}
                </span>
                <span className="text-xs text-[#667085]">{course.category}</span>
              </div>

              <h1 className="text-lg sm:text-xl font-extrabold text-[#0A1D3F] tracking-tight">
                {course.title}
              </h1>
              <p className="text-xs text-[#667085] mt-0.5">{course.subtitle}</p>

              <div className="flex items-center gap-3 text-xs text-[#667085] mt-2">
                <span className="flex items-center gap-1 font-semibold text-[#0A1D3F]">
                  <Video className="w-3.5 h-3.5 text-[#FF8A00]" />
                  <span>{course.videoCount}+ Videos</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-[#0A1D3F]">
                  <FileText className="w-3.5 h-3.5 text-[#17B26A]" />
                  <span>{course.testCount} Tests</span>
                </span>
                <span>•</span>
                <RatingBadge rating={course.rating} count={course.reviewCount} />
              </div>

              <div className="mt-4 p-3 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC]">
                <PriceDisplay
                  price={course.price}
                  originalPrice={course.originalPrice}
                  discount={course.discount}
                  size="md"
                />
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              {enrolled ? (
                <Link to={`/coaching/${course.id}/player`} className="block">
                  <PrimaryButton
                    variant="navy"
                    size="lg"
                    fullWidth
                    icon={PlayCircle}
                  >
                    Go to Video Player
                  </PrimaryButton>
                </Link>
              ) : (
                <Link to={`/coaching/${course.id}/subscribe`} className="block">
                  <PrimaryButton
                    variant="orange"
                    size="lg"
                    fullWidth
                  >
                    Subscribe Now for ₹{course.price}
                  </PrimaryButton>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Instructor Info */}
        <div className="pt-4 border-t border-[#E6E8EC] flex items-center gap-3">
          <img
            src={course.instructorAvatar}
            alt={course.instructor}
            className="w-11 h-11 rounded-full object-cover border border-[#E6E8EC]"
          />
          <div>
            <h4 className="text-xs font-bold text-[#0A1D3F]">
              Educator: {course.instructor}
            </h4>
            <p className="text-[11px] text-[#667085]">{course.instructorRole}</p>
          </div>
        </div>
      </div>

      {/* Course Features Checklist */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
          Course Highlights & Features
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {course.features?.map((feat) => (
            <div
              key={feat.id}
              className="p-3 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] flex items-start gap-2.5"
            >
              <div className="w-6 h-6 rounded-full bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0A1D3F]">{feat.title}</h4>
                <p className="text-[11px] text-[#667085] mt-0.5">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters & Syllabus */}
      <div className="space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
          Syllabus & Lecture Curriculum ({course.chapters?.length} Chapters)
        </h3>

        {course.chapters?.map((chapter) => (
          <ChapterAccordion
            key={chapter.id}
            chapter={chapter}
            defaultOpen={true}
            onSelectLecture={(lec) => navigate(`/coaching/${course.id}/player`)}
          />
        ))}
      </div>
    </div>
  );
};
