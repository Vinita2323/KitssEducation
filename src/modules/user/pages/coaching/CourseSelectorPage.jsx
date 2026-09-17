import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  SlidersHorizontal,
  Filter,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Video,
  Clock,
  Sparkles,
  Search,
  Check
} from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { CourseCard } from "../../components/coaching/CourseCard";
import { useToast } from "../../context/ToastContext";

export const CourseSelectorPage = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  const [selectedBoard, setSelectedBoard] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("All");

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enrollment modal state
  const [selectedCourseForJoin, setSelectedCourseForJoin] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await coachingService.getCourses({
          board: selectedBoard,
          state: selectedState,
          classGrade: selectedClass,
          subject: selectedSubject,
          courseType: selectedType,
        });
        setCourses(data);
      } catch (err) {
        console.error("Course selector fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedBoard, selectedState, selectedClass, selectedSubject, selectedType]);

  const handleJoinClick = (course) => {
    setSelectedCourseForJoin(course);
    setJoinSuccess(false);
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourseForJoin) return;
    try {
      setJoining(true);
      await coachingService.joinCourse(selectedCourseForJoin.id);
      setJoinSuccess(true);
      showSuccess("Course Joined Successfully!");
    } catch (err) {
      console.error("Enrollment error:", err);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 card-shadow space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF8A00]/10 text-[#FF8A00] font-bold text-xs uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Course Selection Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A1D3F] tracking-tight">
          Select Your Course
        </h1>
        <p className="text-xs sm:text-sm text-[#667085] max-w-xl">
          Choose your education board, home state, academic class, and subjects to find tailored online coaching programs.
        </p>
      </div>

      {/* Filter Matrix Controls */}
      <div className="bg-white rounded-2xl border border-[#E6E8EC] p-5 sm:p-6 card-shadow space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0A1D3F]">
          <Filter className="w-4 h-4 text-[#FF8A00]" />
          <span>Filter Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Board Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Boards</option>
              <option value="CBSE">CBSE</option>
              <option value="Madhya Pradesh Board">Madhya Pradesh Board</option>
              <option value="ICSE">ICSE</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All States</option>
              <option value="Delhi">Delhi</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Classes</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Subjects</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
            </select>
          </div>

          {/* Course Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Course Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Types</option>
              <option value="Comprehensive">Comprehensive</option>
              <option value="Foundation">Foundation</option>
              <option value="Competitive">Competitive (NEET/JEE)</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Action */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E6E8EC]/60 text-xs">
          <span className="text-[#667085]">
            Showing <strong>{courses.length}</strong> matching courses
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedBoard("All");
              setSelectedState("All");
              setSelectedClass("All");
              setSelectedSubject("All");
              setSelectedType("All");
            }}
            className="text-[#133C8B] hover:text-[#FF8A00] font-semibold transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Matching Courses Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-[#E6E8EC] p-4" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E6E8EC] p-10 text-center space-y-3 card-shadow">
            <h3 className="font-bold text-base text-[#0A1D3F]">No Matching Courses Found</h3>
            <p className="text-xs text-[#667085]">
              Try resetting your filters to view all available education programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showJoinAction={true}
                onJoinClick={handleJoinClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Course Enrollment / Confirmation Modal */}
      {selectedCourseForJoin && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E6E8EC] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in duration-150">
            {joinSuccess ? (
              /* After Confirming: Show "Course Joined Successfully" */
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#17B26A]/10 text-[#17B26A] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-[#0A1D3F]">
                    Course Joined Successfully
                  </h3>
                  <p className="text-xs text-[#667085]">
                    You have been enrolled in <strong>{selectedCourseForJoin.title}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-xs text-[#0A1D3F] text-left space-y-1">
                  <p>• Full video classes unlocked</p>
                  <p>• All digital chapter notes & books available</p>
                  <p>• Single-device protected student access active</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/coaching/${selectedCourseForJoin.id}/dashboard`)}
                  className="w-full py-3 px-4 rounded-xl bg-[#0A1D3F] hover:bg-[#133C8B] text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Go to My Course</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Confirmation Screen */
              <div className="space-y-4">
                <div className="border-b border-[#E6E8EC] pb-3">
                  <h3 className="text-lg font-black text-[#0A1D3F]">
                    Confirm Course Enrollment
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Review course information before confirming.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] space-y-2 text-xs text-[#0A1D3F]">
                  <h4 className="font-extrabold text-sm text-[#0A1D3F]">
                    {selectedCourseForJoin.title}
                  </h4>
                  <p><strong>Board:</strong> {selectedCourseForJoin.board}</p>
                  <p><strong>Class:</strong> {selectedCourseForJoin.class}</p>
                  <p><strong>Duration:</strong> {selectedCourseForJoin.duration}</p>
                  <p><strong>Subjects:</strong> {selectedCourseForJoin.subjects?.join(", ")}</p>
                </div>

                <p className="text-xs text-[#667085] text-center font-medium">
                  You are about to join this course.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCourseForJoin(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-[#E6E8EC] text-[#667085] hover:text-[#0A1D3F] font-semibold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmEnrollment}
                    disabled={joining}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#E67C00] text-white font-bold text-xs transition cursor-pointer"
                  >
                    {joining ? "Joining..." : "Confirm & Join"}
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
