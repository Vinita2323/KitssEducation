import { LessonVideo } from '../../components/coaching/LessonVideo';
import { PdfCanvas } from '../../components/coaching/PdfCanvas';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  const [searchParams,setSearchParams]=useSearchParams();const selectedLessonId=searchParams.get("lesson");

  const { showSuccess, showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [error,setError]=useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("lectures"); // 'overview' | 'lectures' | 'notes' | 'tests'
  const [currentLecture, setCurrentLecture] = useState(null);

  useEffect(()=>{let active=true;const controller=new AbortController();setLoading(true);setCourse(null);setCurrentLecture(null);setError("");
    (async()=>{try{const data=await coachingService.getCourseById(id,controller.signal);if(!active)return;data.chapters=data.subjectsData.map(s=>({id:s.id,title:s.subjectName,lectures:s.lectures}));setCourse(data);const selected=selectedLessonId??data.syllabus.lastLessonId;if(selected){const item=data.chapters.flatMap(c=>c.lectures).find(l=>l.id===selected);if(!item)throw new Error('Lesson does not belong to this course');const resource=await coachingService.getLesson(id,selected,controller.signal);if(!active)return;setCurrentLecture({...item,...resource});if(data.isEnrolled&&!item.progress)await coachingService.updateLectureProgress(id,selected,'In Progress',0);}}catch(e){if(active)setError(e.message);}finally{if(active)setLoading(false);}})();return()=>{active=false;controller.abort();};
  },[id,selectedLessonId]);
  const handleSelectLecture=lecture=>{if(!lecture.isLocked)setSearchParams({lesson:lecture.id});};
  const handleMarkComplete=async()=>{if(!currentLecture||!course.isEnrolled)return;try{const result=await coachingService.updateLectureProgress(id,currentLecture.id,currentLecture.isCompleted?'In Progress':'Completed');setCurrentLecture(l=>({...l,isCompleted:result.status==='completed'}));setCourse(c=>({...c,chapters:c.chapters.map(ch=>({...ch,lectures:ch.lectures.map(l=>l.id===currentLecture.id?{...l,isCompleted:result.status==='completed'}:l)}))}));showSuccess('Learning progress saved.');}catch(e){showInfo(e.message);}};

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

  const isCurrentCompleted = currentLecture?.isCompleted===true;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {error&&<p role="alert" className="p-3 bg-amber-50 border rounded-xl text-sm">{error}</p>}
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
      <section className="bg-white border border-[#E6E8EC] rounded-2xl p-4 sm:p-5 space-y-3">
        {!currentLecture?<p>Select an available lesson from the syllabus.</p>:<><h2 className="font-bold text-[#0A1D3F]">{currentLecture.title}</h2><div className="whitespace-pre-wrap break-words text-sm">{currentLecture.content}</div>{currentLecture.media&&<PdfCanvas title="Legacy player lesson PDF" url={currentLecture.media.url} pageCount={currentLecture.media.pageCount}/>}{currentLecture.video&&<LessonVideo key={currentLecture.id + currentLecture.video.assetId} courseId={id} lesson={currentLecture} canSave={course.isEnrolled}/>}</>}
      </section>

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
          {course.title} • Instructor: {course.teacher}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-[#E6E8EC] bg-white rounded-t-2xl px-2">
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
              className={`flex-1 py-3 text-center text-[10px] sm:text-sm min-w-0 font-bold flex items-center justify-center gap-1 sm:gap-2 border-b-2 transition duration-200 ${
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
                {currentLecture?.description || "Select a lesson to view its authored summary."}
              </p>
            </div>


          </div>
        )}

        {activeTab === "notes" && <div className="space-y-3"><h4 className="font-bold text-sm">Lesson PDF</h4>{currentLecture?.media?<a className="text-[#FF8A00] underline" target="_blank" rel="noreferrer" href={currentLecture.media.url}>Open authorized lesson PDF</a>:<p className="text-xs text-[#667085]">No PDF is attached to the selected lesson.</p>}</div>}
        {activeTab === "tests" && <p className="text-sm text-[#667085]">Assessments are not implemented. No test, ranking or certificate is issued.</p>}

      </div>

      {/* Bottom Completion Action Bar */}
      <div className="sticky bottom-20 z-30 pt-2">
        <button
          type="button"
          onClick={handleMarkComplete}
          disabled={!currentLecture || !course.isEnrolled}
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
