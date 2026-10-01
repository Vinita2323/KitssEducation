import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
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
import { getCoachingStore } from "../../data/mockCoachingData";
import { CourseCard } from "../../components/coaching/CourseCard";
import { SearchableSelect } from "../../components/common/SearchableSelect";
import { useToast } from "../../context/ToastContext";

const COURSE_PREFS_KEY = "kits_course_selector_prefs";

const courseMatchesType = (course, selectedType) => {
  if (!selectedType || selectedType === "All") return true;
  if (selectedType.startsWith("Class ")) {
    const grade = selectedType.toLowerCase().replace(/\s+/g, "");
    return (course.class || "").toLowerCase().replace(/\s+/g, "") === grade;
  }
  const selected = selectedType.toLowerCase();
  return [course.courseType, course.program, course.title]
    .filter(Boolean)
    .some((name) => name.toLowerCase() === selected);
};

const subjectsForSelection = ({ selectedType, selectedBoard, selectedState, selectedLanguage }) => {
  const names = new Set();
  (getCoachingStore().courses || []).forEach((course) => {
    if (!courseMatchesType(course, selectedType)) return;
    if (selectedBoard && selectedBoard !== "All") {
      const board = (course.board || "All").toLowerCase();
      if (board !== "all" && board !== selectedBoard.toLowerCase()) return;
    }
    if (selectedState && selectedState !== "All") {
      const state = (course.state || "All").toLowerCase();
      if (state !== "all" && state !== selectedState.toLowerCase()) return;
    }
    if (selectedLanguage && selectedLanguage !== "All") {
      if ((course.language || "English").toLowerCase() !== selectedLanguage.toLowerCase()) return;
    }
    (course.subjects || []).forEach((subject) => {
      if (subject) names.add(subject);
    });
  });
  return [...names].sort((a, b) => a.localeCompare(b));
};

const readSavedCoursePrefs = () => {
  try {
    const raw = localStorage.getItem(COURSE_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.saved) return null;
    if (["Comprehensive", "Foundation", "Competitive"].includes(parsed.type)) {
      parsed.type = "All";
    }
    return parsed;
  } catch {
    return null;
  }
};

export const CourseSelectorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess } = useToast();
  const savedPrefs = readSavedCoursePrefs();
  const openSelector = searchParams.get("choose") === "1";

  const [filtersSaved] = useState(() => !openSelector && Boolean(savedPrefs));
  const [selectedBoard, setSelectedBoard] = useState(savedPrefs?.board || "All");
  const [selectedState, setSelectedState] = useState(savedPrefs?.state || "All");
  const [selectedSubject, setSelectedSubject] = useState(savedPrefs?.subject || "All");
  const [selectedType, setSelectedType] = useState(savedPrefs?.type || "All");
  const [selectedLanguage, setSelectedLanguage] = useState(savedPrefs?.language || "All");

  const boardsByState = {
    Delhi: ["CBSE", "ICSE"],
    "Madhya Pradesh": ["Madhya Pradesh Board", "CBSE", "ICSE"],
    "Uttar Pradesh": ["Uttar Pradesh Board", "CBSE", "ICSE"],
    Maharashtra: ["Maharashtra State Board", "CBSE", "ICSE"],
  };

  const boardOptions =
    selectedState === "All"
      ? [...new Set(Object.values(boardsByState).flat())]
      : boardsByState[selectedState] || [];

  const handleStateChange = (state) => {
    setSelectedState(state);
    const nextBoards = state === "All" ? Object.values(boardsByState).flat() : boardsByState[state] || [];
    if (selectedBoard !== "All" && !nextBoards.includes(selectedBoard)) {
      setSelectedBoard("All");
    }
  };

  const subjectOptions = useMemo(
    () =>
      subjectsForSelection({
        selectedType,
        selectedBoard,
        selectedState,
        selectedLanguage,
      }),
    [selectedType, selectedBoard, selectedState, selectedLanguage]
  );

  useEffect(() => {
    if (selectedSubject !== "All" && !subjectOptions.includes(selectedSubject)) {
      setSelectedSubject("All");
    }
  }, [selectedSubject, subjectOptions]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Enrollment modal state
  const [selectedCourseForJoin, setSelectedCourseForJoin] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (filtersSaved) return;
    const hasChoice = [selectedBoard, selectedState, selectedSubject, selectedType, selectedLanguage].some(
      (value) => value && value !== "All"
    );
    if (!hasChoice) {
      localStorage.removeItem(COURSE_PREFS_KEY);
      return;
    }
    localStorage.setItem(
      COURSE_PREFS_KEY,
      JSON.stringify({
        saved: true,
        board: selectedBoard,
        state: selectedState,
        subject: selectedSubject,
        type: selectedType,
        language: selectedLanguage,
      })
    );
  }, [filtersSaved, selectedBoard, selectedState, selectedSubject, selectedType, selectedLanguage]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const isClassFilter = selectedType.startsWith("Class ");
        const data = await coachingService.getCourses({
          board: selectedBoard,
          state: selectedState,
          classGrade: isClassFilter ? selectedType : "All",
          subject: selectedSubject,
          courseType: isClassFilter ? "All" : selectedType,
          language: selectedLanguage,
        });
        setCourses(data);
      } catch (err) {
        console.error("Course selector fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedBoard, selectedState, selectedSubject, selectedType, selectedLanguage]);

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
    <div className="max-w-7xl mx-auto space-y-3">
      <Link
        to="/coaching/course-cbse-10-sci"
        className="block -mt-3 sm:-mt-5 -mx-3 sm:-mx-6 lg:-mx-8 overflow-hidden"
      >
        <img
          src="/banners/results-banner-coaching.jpg"
          alt="Live batches 2026. Crack CBSE, JEE and NEET with expert mentors."
          className="block w-full h-auto"
        />
      </Link>
      <h1 className="text-xl sm:text-2xl font-black text-[#0A1D3F] tracking-tight">
        Select Your Course
      </h1>

      {/* Filter Matrix Controls — shown only until the student saves a choice */}
      {!filtersSaved && (
      <div className="bg-white rounded-md border border-[#E6E8EC] p-3 card-shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* State Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All States</option>
              <option value="Delhi">Delhi</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          {/* Board Filter — options follow the selected state */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Boards</option>
              {boardOptions.map((board) => (
                <option key={board} value={board}>
                  {board}
                </option>
              ))}
            </select>
          </div>

          {/* Course Type — replaces the class field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Course Type
            </label>
            <SearchableSelect
              compact
              searchable
              value={selectedType}
              onChange={setSelectedType}
              placeholder="All Courses"
              searchPlaceholder="Search course"
              options={[
                { value: "All", label: "All Courses" },
                { value: "Class 9", label: "Class 9", group: "Classes" },
                { value: "Class 10", label: "Class 10", group: "Classes" },
                { value: "Class 11", label: "Class 11", group: "Classes" },
                { value: "Class 12", label: "Class 12", group: "Classes" },
                { value: "MBA", label: "MBA", group: "Courses" },
                { value: "M.Tech", label: "M.Tech", group: "Courses" },
                { value: "B.Tech", label: "B.Tech", group: "Courses" },
                { value: "BBA", label: "BBA", group: "Courses" },
                { value: "BCA", label: "BCA", group: "Courses" },
                { value: "MCA", label: "MCA", group: "Courses" },
                { value: "B.Com", label: "B.Com", group: "Courses" },
                { value: "B.Sc", label: "B.Sc", group: "Courses" },
                { value: "B.A.", label: "B.A.", group: "Courses" },
                { value: "B.Pharm", label: "B.Pharm", group: "Courses" },
                { value: "B.Sc Nursing", label: "B.Sc Nursing", group: "Courses" },
                { value: "LL.B.", label: "LL.B.", group: "Courses" },
                { value: "LL.M.", label: "LL.M.", group: "Courses" },
                { value: "M.Sc", label: "M.Sc", group: "Courses" },
                { value: "B.Des", label: "B.Des", group: "Courses" },
                { value: "Diploma", label: "Diploma", group: "Courses" },
              ]}
            />
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Language — replaces the old course type field */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Action */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#E6E8EC]/60 text-[11px]">
          <span className="text-[#667085]">
            Showing <strong>{courses.length}</strong> matching courses
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedBoard("All");
              setSelectedState("All");
              setSelectedSubject("All");
              setSelectedType("All");
              setSelectedLanguage("All");
            }}
            className="text-[#133C8B] hover:text-[#FF8A00] font-semibold transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>
      )}

      {filtersSaved && (
        <p className="text-[11px] text-[#667085]">
          Showing <strong className="text-[#0A1D3F]">{courses.length}</strong> courses for your saved selection
        </p>
      )}

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
