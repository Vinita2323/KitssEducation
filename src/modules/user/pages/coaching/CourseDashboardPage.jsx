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
  const [activeTab, setActiveTab] = useState("lectures"); // 'overview' | 'lectures' | 'books' | 'progress' | 'profile'
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
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="h-44 bg-gray-200 rounded-3xl animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto p-10 text-center bg-white rounded-2xl border border-[#E6E8EC] card-shadow space-y-3">
        <h3 className="font-bold text-base text-[#0A1D3F]">Course Not Found</h3>
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#FF8A00]"
        >
          <ArrowLeft className="w-4 h-4" /> Go to My Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Mobile Course Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Courses</span>
        </Link>

        <span className="text-xs font-bold text-[#17B26A] bg-[#17B26A]/10 px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Access Active</span>
        </span>
      </div>

      {/* Main Responsive Layout: Desktop Sidebar vs Tab Content */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar on Desktop / Top Tabs on Mobile */}
        <CoachingSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          courseTitle={course.title}
          courseId={course.id}
          progressPercentage={course.progressPercentage || 0}
        />

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 w-full space-y-6">
          {/* Course Header Banner */}
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-5 sm:p-7 card-shadow space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0A1D3F] text-white">
                    {course.board}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F7F8FA] text-[#0A1D3F] border border-[#E6E8EC]">
                    {course.class}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0A1D3F] mt-1">
                  {course.title}
                </h1>
                <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                  {course.subtitle || course.description}
                </p>
              </div>

              <div className="text-right sm:text-right shrink-0">
                <span className="text-[11px] font-bold uppercase text-[#667085] block">
                  Course Expiry
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#0A1D3F]">
                  {course.expiryDate || "15 March 2027"}
                </span>
              </div>
            </div>

            {/* Course Overall Progress Bar */}
            <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#E6E8EC] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0A1D3F] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#FF8A00]" />
                  Course Progress: {course.progressPercentage || 0}%
                </span>
                <span className="text-[#667085] font-semibold">
                  {course.completedLectures || 0} / {course.totalLecturesCount || course.lecturesCount} Lectures Completed
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#E6E8EC] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF8A00] to-[#17B26A] rounded-full transition-all duration-700"
                  style={{ width: `${course.progressPercentage || 0}%` }}
                />
              </div>
            </div>

            {/* In-page Tab Navigation Headers for Quick Access */}
            <div className="flex items-center gap-2 border-b border-[#E6E8EC] pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("lectures")}
                className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "lectures"
                    ? "border-[#FF8A00] text-[#FF8A00]"
                    : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Lectures & Classes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("books")}
                className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "books"
                    ? "border-[#FF8A00] text-[#FF8A00]"
                    : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Books & Study Material</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("progress")}
                className={`pb-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition cursor-pointer ${
                  activeTab === "progress"
                    ? "border-[#FF8A00] text-[#FF8A00]"
                    : "border-transparent text-[#667085] hover:text-[#0A1D3F]"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Detailed Progress</span>
              </button>
            </div>
          </div>

          {/* Tab 1: LECTURES TAB */}
          {activeTab === "lectures" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#0A1D3F]">
                    Course Lectures by Subject
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Select any lecture to open the protected video player.
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

          {/* Tab 2: BOOKS TAB */}
          {activeTab === "books" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#0A1D3F]">
                    Digital Books & Study Materials
                  </h2>
                  <p className="text-xs text-[#667085]">
                    Read your chapter workbooks and formula sheets online.
                  </p>
                </div>
              </div>

              <BookList
                subjectsData={course.subjectsData}
                onReadOnline={handleReadOnline}
              />
            </div>
          )}

          {/* Tab 3: PROGRESS TAB */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              <CourseProgress
                courseTitle={course.title}
                progressPercentage={course.progressPercentage || 0}
                completedLectures={course.completedLectures || 0}
                totalLectures={course.totalLecturesCount || course.lecturesCount}
                subjectsData={course.subjectsData}
              />

              {/* Course Expiry Component */}
              <CourseExpiry
                status="Active"
                expiryDate={course.expiryDate || "15 March 2027"}
              />
            </div>
          )}

          {/* Tab 4: PROFILE TAB */}
          {activeTab === "profile" && (
            <StudentProfile
              student={student}
              enrolledCourses={allEnrolled}
            />
          )}

          {/* Tab 5: OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#E6E8EC] p-6 card-shadow space-y-4">
                <h3 className="font-extrabold text-base text-[#0A1D3F]">
                  About This Course
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  {course.description}
                </p>

                <div className="pt-3 border-t border-[#E6E8EC] space-y-2">
                  <h4 className="font-bold text-xs uppercase text-[#667085]">
                    Syllabus Coverage
                  </h4>
                  <div className="space-y-1.5">
                    {(course.whatYouWillLearn || []).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#0A1D3F]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#17B26A] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <CourseExpiry
                status="Active"
                expiryDate={course.expiryDate || "15 March 2027"}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
