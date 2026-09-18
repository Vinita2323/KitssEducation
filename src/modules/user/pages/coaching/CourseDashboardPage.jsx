import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Video,
  BookOpen,
  TrendingUp,
  User,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Calendar,
  Sparkles,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { CoachingSidebar } from "../../components/coaching/CoachingSidebar";
import { LectureList } from "../../components/coaching/LectureList";
import { BookList } from "../../components/coaching/BookList";
import { CourseProgress } from "../../components/coaching/CourseProgress";
import { CourseExpiry } from "../../components/coaching/CourseExpiry";
import { StudentProfile } from "../../components/coaching/StudentProfile";
import { useAuth } from "../../context/AuthContext";

export const CourseDashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [student, setStudent] = useState(null);
  const [allEnrolled, setAllEnrolled] = useState([]);
  const [activeTab, setActiveTab] = useState("lectures"); // 'lectures' | 'books' | 'progress' | 'overview' | 'profile'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [courseData, profileData, myCoursesData] = await Promise.all([
          coachingService.getCourseById(id),
          coachingService.getStudentProfile(),
          coachingService.getMyCourses(),
        ]);
        setCourse(courseData);
        setStudent(profileData);
        setAllEnrolled(myCoursesData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [id]);

  const handleSelectLecture = (lecture, subjectName) => {
    navigate(`/coaching/${id}/lecture/${lecture.id}`, {
      state: { subjectName, lectureTitle: lecture.title },
    });
  };

  const handleReadOnline = (book) => {
    navigate(`/coaching/${id}/book/${book.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="h-28 bg-slate-200 rounded-md animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-md animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto p-6 text-center bg-white rounded-md border border-[#E6E8EC] shadow-xs space-y-3 my-6">
        <h3 className="font-bold text-base text-[#0A1D3F]">Course Not Found</h3>
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0A1D3F] text-white font-bold text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Go to My Courses
        </Link>
      </div>
    );
  }

  const completedCount = course.completedLectures || 0;
  const totalCount = course.totalLecturesCount || course.lecturesCount || 0;
  const progressPct = course.progressPercentage || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
      {/* Top Breadcrumb & Access Status */}
      <div className="flex items-center justify-between">
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>My Courses</span>
        </Link>

        <span className="text-[11px] font-bold text-[#17B26A] bg-[#17B26A]/10 px-2.5 py-0.5 rounded flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          <span>Access Active</span>
        </span>
      </div>

      {/* Main Responsive Layout: Desktop Sidebar vs Tab Content */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-start">
        {/* Left Sidebar on Desktop / Single Top Tab Strip on Mobile */}
        <CoachingSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          courseTitle={course.title}
          courseId={course.id}
          progressPercentage={progressPct}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-3 sm:space-y-3.5">
          {/* Compact Course Header Card (No Duplicate Tabs!) */}
          <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A1D3F] text-white">
                    {course.board}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]">
                    Class {course.class}
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-[#0A1D3F] mt-1 leading-snug">
                  {course.title}
                </h1>
                <p className="text-xs text-[#667085] line-clamp-1 mt-0.5">
                  {course.subtitle || course.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 bg-[#F7F8FA] border border-[#E6E8EC] px-2.5 py-1 rounded text-right self-start sm:self-center">
                <Calendar className="w-3 h-3 text-[#FF8A00]" />
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#0A1D3F]">
                  Expires: <span className="font-bold">{course.expiryDate || "30 April 2027"}</span>
                </span>
              </div>
            </div>

            {/* Compact Progress Strip */}
            <div className="pt-1.5 border-t border-[#E6E8EC] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0A1D3F] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FF8A00]" />
                  Course Progress: <span className="text-[#FF8A00]">{progressPct}%</span>
                </span>
                <span className="text-[11px] text-[#667085] font-semibold">
                  {completedCount} of {totalCount} Completed
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E6E8EC] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* TAB 1: LECTURES */}
          {activeTab === "lectures" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
                    Course Lectures by Subject
                  </h2>
                  <p className="text-[11px] text-[#667085]">
                    Select any lesson to open the protected online player.
                  </p>
                </div>
              </div>

              <LectureList
                subjectsData={course.subjectsData}
                courseId={course.id}
                onSelectLecture={handleSelectLecture}
              />
            </div>
          )}

          {/* TAB 2: BOOKS & STUDY MATERIAL */}
          {activeTab === "books" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#0A1D3F]">
                    Digital Books & Study Materials
                  </h2>
                  <p className="text-[11px] text-[#667085]">
                    Read chapter notes, workbooks, and formula sheets online.
                  </p>
                </div>
              </div>

              <BookList
                subjectsData={course.subjectsData}
                onReadOnline={handleReadOnline}
              />
            </div>
          )}

          {/* TAB 3: PROGRESS */}
          {activeTab === "progress" && (
            <div className="space-y-3">
              <CourseProgress
                courseTitle={course.title}
                progressPercentage={progressPct}
                completedLectures={completedCount}
                totalLectures={totalCount}
                subjectsData={course.subjectsData}
              />

              <CourseExpiry
                status="Active"
                expiryDate={course.expiryDate || "30 April 2027"}
              />
            </div>
          )}

          {/* TAB 4: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-3">
              <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 sm:p-4 shadow-2xs space-y-3">
                <h3 className="font-extrabold text-sm sm:text-base text-[#0A1D3F]">
                  About This Course
                </h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  {course.description}
                </p>

                <div className="pt-2.5 border-t border-[#E6E8EC] space-y-1.5">
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#667085]">
                    Syllabus Coverage
                  </h4>
                  <div className="space-y-1">
                    {(course.whatYouWillLearn || []).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-[#0A1D3F]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#17B26A] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <CourseExpiry
                status="Active"
                expiryDate={course.expiryDate || "30 April 2027"}
              />
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === "profile" && (
            <StudentProfile
              student={student}
              enrolledCourses={allEnrolled}
            />
          )}
        </main>
      </div>
    </div>
  );
};
