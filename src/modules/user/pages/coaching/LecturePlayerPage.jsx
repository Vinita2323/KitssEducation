import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Video,
  Play,
  Lock,
  Clock,
  ChevronRight,
  BookOpen,
  Sparkles,
  ShieldAlert,
  List
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { ProtectedVideoPlayer } from "../../components/coaching/ProtectedVideoPlayer";
import { useToast } from "../../context/ToastContext";

export const LecturePlayerPage = () => {
  const { id: courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showInfo } = useToast();

  const [course, setCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [currentSubject, setCurrentSubject] = useState(location.state?.subjectName || "");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);

  useEffect(() => {
    const loadLectureData = async () => {
      try {
        setLoading(true);
        const [courseData, profileData] = await Promise.all([
          coachingService.getCourseById(courseId),
          coachingService.getStudentProfile(),
        ]);

        setCourse(courseData);
        setStudent(profileData);

        // Find current lecture
        let foundLecture = null;
        let foundSubject = "";

        (courseData.subjectsData || []).forEach((subj) => {
          (subj.lectures || []).forEach((lec) => {
            if (lec.id === lectureId) {
              foundLecture = lec;
              foundSubject = subj.subjectName;
            }
          });
        });

        // Fallback to first lecture if not found
        if (!foundLecture && courseData.subjectsData?.[0]?.lectures?.[0]) {
          foundLecture = courseData.subjectsData[0].lectures[0];
          foundSubject = courseData.subjectsData[0].subjectName;
        }

        setCurrentLecture(foundLecture);
        setCurrentSubject(foundSubject);
      } catch (err) {
        console.error("Lecture player load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadLectureData();
  }, [courseId, lectureId]);

  const handleLectureSelect = (lec, subjectName) => {
    setCurrentLecture(lec);
    setCurrentSubject(subjectName);
    navigate(`/coaching/${courseId}/lecture/${lec.id}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleCompletion = async () => {
    if (!currentLecture) return;
    const newStatus = currentLecture.isCompleted ? "In Progress" : "Completed";

    await coachingService.updateLectureProgress(courseId, currentLecture.id, newStatus);
    setCurrentLecture({ ...currentLecture, isCompleted: !currentLecture.isCompleted });

    if (newStatus === "Completed") {
      showSuccess("Lecture marked as completed! Progress updated.");
    } else {
      showInfo("Lecture status marked as in-progress.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="aspect-16/9 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!currentLecture || !course) {
    return (
      <div className="max-w-md mx-auto p-10 text-center bg-white rounded-2xl border border-[#E6E8EC] card-shadow space-y-3">
        <h3 className="font-bold text-base text-[#0A1D3F]">Lecture Not Found</h3>
        <Link
          to={`/coaching/${courseId}/dashboard`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#FF8A00]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  // Course Subscription Expiry Lock Guard
  if (course.isExpired) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-red-200 card-shadow space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
            Subscription Expired
          </span>
          <h2 className="text-xl font-black text-[#0A1D3F]">
            Course Access Expired
          </h2>
          <p className="text-xs text-[#667085] leading-relaxed max-w-sm mx-auto">
            Your subscription to <span className="font-semibold text-[#0A1D3F]">{course.title}</span> expired on {course.expiryDate}. Please renew your subscription pass to continue streaming protected video lectures.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => navigate(`/coaching/${courseId}/subscribe`)}
            className="px-5 py-2.5 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
          >
            Renew Course Subscription
          </button>
          <Link
            to={`/coaching/${courseId}/dashboard`}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0A1D3F] font-semibold text-xs transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Header Row with Back Button, Course Name, Subject, and Lecture Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E6E8EC]">
        <div className="flex items-center gap-3">
          <Link
            to={`/coaching/${courseId}/dashboard`}
            className="p-2 rounded-xl bg-white border border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#0A1D3F] transition card-shadow shrink-0"
            title="Back to Course Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2 text-xs text-[#667085]">
              <span className="font-bold text-[#0A1D3F]">{course.title}</span>
              <span>•</span>
              <span className="font-semibold text-[#FF8A00]">{currentSubject}</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-[#0A1D3F] truncate max-w-xl">
              {currentLecture.title}
            </h1>
          </div>
        </div>

        {/* Action: Mark Complete / Toggle completion */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleToggleCompletion}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              currentLecture.isCompleted
                ? "bg-[#17B26A] text-white"
                : "bg-white border border-[#E6E8EC] text-[#0A1D3F] hover:bg-[#F7F8FA]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{currentLecture.isCompleted ? "Completed ✓" : "Mark as Completed"}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Protected Video Player + Playlist Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Protected Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <ProtectedVideoPlayer
            lecture={currentLecture}
            courseTitle={course.title}
            subject={currentSubject}
            studentName={student?.name || "Rohan Sharma"}
            studentId={student?.id || "KITSS20261084"}
            isCompleted={currentLecture.isCompleted}
            onLectureComplete={handleToggleCompletion}
          />

          {/* Lecture Notes & Teacher Details Box */}
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
                  Lesson Concept Overview
                </span>
                <h3 className="font-black text-base text-[#0A1D3F]">
                  {currentLecture.title}
                </h3>
              </div>
              <span className="text-xs font-semibold text-[#667085] bg-[#F7F8FA] px-2.5 py-1 rounded-full border border-[#E6E8EC]">
                Duration: {currentLecture.duration}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
              {currentLecture.summary ||
                "In this class, we analyze fundamental laws, step-by-step mathematical reasoning, and high-yield board examination questions."}
            </p>

            <div className="pt-3 border-t border-[#E6E8EC] flex items-center justify-between text-xs text-[#0A1D3F]">
              <span className="font-semibold text-[#667085]">
                Instructor: <strong>{currentLecture.teacher || course.teacher}</strong>
              </span>
              <span className="text-[#17B26A] font-bold">
                Protected Classroom Mode
              </span>
            </div>
          </div>
        </div>

        {/* Right: Course Lectures Playlist */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-[#E6E8EC] p-4 card-shadow space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
            <h3 className="font-black text-sm text-[#0A1D3F] flex items-center gap-1.5">
              <List className="w-4 h-4 text-[#FF8A00]" />
              <span>Course Playlist</span>
            </h3>
            <span className="text-[11px] font-bold text-[#667085]">
              {course.lecturesCount} Lessons
            </span>
          </div>

          {/* Subject-wise lecture playlist items */}
          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {(course.subjectsData || []).map((subj, sIdx) => (
              <div key={sIdx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0A1D3F]">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subj.color || "#FF8A00" }}
                  />
                  <span>{subj.subjectName}</span>
                </div>

                <div className="space-y-1.5">
                  {(subj.lectures || []).map((lec) => {
                    const isSelected = currentLecture.id === lec.id;
                    return (
                      <div
                        key={lec.id}
                        onClick={() => {
                          if (!lec.isLocked) {
                            handleLectureSelect(lec, subj.subjectName);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                          isSelected
                            ? "bg-[#0A1D3F] text-white border-[#0A1D3F]"
                            : lec.isLocked
                            ? "bg-[#F7F8FA] border-[#E6E8EC] opacity-60 cursor-not-allowed text-[#667085]"
                            : "bg-white border-[#E6E8EC] hover:bg-[#F7F8FA] text-[#0A1D3F]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {lec.isLocked ? (
                            <Lock className="w-3.5 h-3.5 shrink-0 text-[#667085]" />
                          ) : lec.isCompleted ? (
                            <CheckCircle2
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-[#17B26A]" : "text-[#17B26A]"
                              }`}
                            />
                          ) : (
                            <Play
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? "text-[#FF8A00] fill-current" : "text-[#667085]"
                              }`}
                            />
                          )}
                          <span className="truncate font-medium">{lec.title}</span>
                        </div>

                        <span className="text-[10px] opacity-70 shrink-0 font-mono">
                          {lec.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
