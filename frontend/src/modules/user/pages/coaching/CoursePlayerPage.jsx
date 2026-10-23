import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  FileText,
  Video,
  FileCheck,
  Sparkles,
  Play,
  HelpCircle,
  Clock
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { useLibrary } from "../../context/LibraryContext";
import { useToast } from "../../context/ToastContext";
import { VideoPlayerView } from "../../components/coaching/VideoPlayerView";
import { ChapterAccordion } from "../../components/coaching/ChapterAccordion";
import { PrimaryButton } from "../../components/common/PrimaryButton";
import { SkeletonLoader, ErrorState } from "../../components/common/EmptyState";

export const CoursePlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isCourseEnrolled, completedLectureIds, toggleLectureCompletion } = useLibrary();
  const { showSuccess, showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("lectures"); // 'overview' | 'lectures' | 'notes' | 'tests'
  const [currentLecture, setCurrentLecture] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourseById(id);
        setCourse(data);
        if (data.chapters?.[0]?.lectures?.[0]) {
          setCurrentLecture(data.chapters[0].lectures[0]);
        }
      } catch (err) {
        console.error("Course player fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleSelectLecture = (lecture) => {
    setCurrentLecture(lecture);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleMarkComplete = () => {
    if (!currentLecture) return;
    toggleLectureCompletion(currentLecture.id);
    showSuccess(`"${currentLecture.title}" marked as completed!`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentLecture?.title} - ${course?.title}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showInfo("Lecture link copied!");
    }
  };

  if (loading) {
    return <SkeletonLoader type="card" count={3} />;
  }

  if (!course) {
    return (
      <ErrorState
        title="Course Not Found"
        message="Could not load the lecture video player."
        onRetry={() => navigate("/coaching")}
      />
    );
  }

  const isCurrentCompleted = currentLecture && completedLectureIds.includes(currentLecture.id);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/coaching/${course.id}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Player</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-gray-50 active:scale-95 transition text-[#0A1D3F]"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <VideoPlayerView
        lecture={currentLecture}
        courseTitle={course.title}
        onComplete={handleMarkComplete}
        isCompleted={isCurrentCompleted}
      />

      {/* Lecture Info Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6E8EC] shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A1D3F] text-white">
            {course.board} • Class {course.class}
          </span>
          <span className="text-xs text-[#667085] flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentLecture?.duration}</span>
          </span>
        </div>

        <h1 className="text-base sm:text-lg font-extrabold text-[#0A1D3F]">
          {currentLecture?.title}
        </h1>
        <p className="text-xs text-[#667085]">
          {course.title} • Instructor: {course.instructor}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E6E8EC] bg-white rounded-t-2xl px-2">
        {[
          { id: "lectures", label: "Lectures", icon: Video },
          { id: "overview", label: "Overview", icon: FileText },
          { id: "notes", label: "PDF Notes", icon: Download },
          { id: "tests", label: "Chapter Tests", icon: FileCheck },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition duration-200 ${
                isActive
                  ? "border-[#FF8A00] text-[#FF8A00]"
                  : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white p-4 sm:p-5 rounded-b-2xl border border-[#E6E8EC] shadow-2xs">
        {activeTab === "lectures" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider mb-2">
              Course Chapters & Lectures
            </h3>
            {course.chapters?.map((chapter) => (
              <ChapterAccordion
                key={chapter.id}
                chapter={chapter}
                defaultOpen={true}
                activeLectureId={currentLecture?.id}
                onSelectLecture={handleSelectLecture}
              />
            ))}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-4 text-xs sm:text-sm text-[#0A1D3F]">
            <div>
              <h4 className="font-bold text-[#0A1D3F] mb-1">Lecture Synopsis</h4>
              <p className="text-[#667085] leading-relaxed">
                {currentLecture?.notes || "In this session, the instructor covers the fundamental definitions, geometric representations, and board-level problem solving patterns."}
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F8FA] rounded-2xl border border-[#E6E8EC] space-y-1.5">
              <h5 className="font-bold text-xs text-[#0A1D3F]">Learning Outcomes:</h5>
              <ul className="list-disc pl-4 text-xs text-[#667085] space-y-1">
                <li>Understand algebraic expressions and standard equation forms</li>
                <li>Master step-by-step substitution and elimination methods</li>
                <li>Solve previous 5 years' board exam questions with complete justification</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#0A1D3F] uppercase tracking-wider mb-2">
              Downloadable Chapter Resources
            </h4>
            {currentLecture?.resources?.length > 0 ? (
              currentLecture.resources.map((res, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-xl border border-[#E6E8EC]"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-[#FF8A00]" />
                    <div>
                      <h5 className="text-xs font-bold text-[#0A1D3F]">{res.name}</h5>
                      <span className="text-[10px] text-[#667085]">{res.size}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showSuccess(`Downloading ${res.name}...`)}
                    className="p-2 rounded-lg bg-white border border-[#E6E8EC] hover:bg-gray-50 text-[#0A1D3F] transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#667085]">No additional PDF notes attached to this lecture.</p>
            )}
          </div>
        )}

        {activeTab === "tests" && (
          <div className="space-y-3">
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-200/60 flex items-center justify-between gap-3">
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
                  Chapter 1 MCQ Practice Test
                </h5>
                <p className="text-xs text-[#667085]">
                  20 Questions • 30 Minutes • Instant Ranking
                </p>
              </div>
              <PrimaryButton
                variant="orange"
                size="sm"
                onClick={() => showInfo("Starting practice test session...")}
              >
                Start Test
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Completion Action Bar */}
      <div className="sticky bottom-20 z-30 pt-2">
        <button
          type="button"
          onClick={handleMarkComplete}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md active:scale-[0.99] touch-target ${
            isCurrentCompleted
              ? "bg-[#17B26A] text-white hover:bg-[#0E9355]"
              : "bg-white border-2 border-[#FF8A00] text-[#FF8A00] hover:bg-orange-50"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isCurrentCompleted ? "Completed (Click to Unmark)" : "Mark as Completed"}</span>
        </button>
      </div>
    </div>
  );
};
