import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Pagination } from '../../components/common/Pagination';
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

import { CourseCard } from "../../components/coaching/CourseCard";
import { SearchableSelect } from "../../components/common/SearchableSelect";
import { useToast } from "../../context/ToastContext";

const COURSE_PREFS_KEY = "kits_course_selector_prefs";

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
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();
  const savedPrefs = user ? null : readSavedCoursePrefs();
  const [preferenceReady,setPreferenceReady]=useState(false),[preferenceError,setPreferenceError]=useState(''),[savingPreference,setSavingPreference]=useState(false);
  const openSelector = searchParams.get("choose") === "1";

  const [filtersSaved] = useState(() => !openSelector && Boolean(savedPrefs));
  const [selectedBoard, setSelectedBoard] = useState(savedPrefs?.board || "All");
  const [selectedState, setSelectedState] = useState(savedPrefs?.state || "All");
  const [selectedSubject, setSelectedSubject] = useState(savedPrefs?.subject || "All");
  const [selectedType, setSelectedType] = useState(savedPrefs?.type || "All");
  const [selectedLanguage, setSelectedLanguage] = useState(savedPrefs?.language || "All");

  const [facets,setFacets]=useState({boards:[],subjects:[],languages:[],classes:[],states:[]});
  useEffect(()=>{const c=new AbortController();setPreferenceReady(false);setPreferenceError('');
    Promise.all([coachingService.getFacets(c.signal),user ? authService.getPreferences(c.signal) : Promise.resolve(null)]).then(([f,p])=>{if(c.signal.aborted)return;setFacets(f);
      if(p){const v=p.courseSelector||{};const label=(items,id)=>items.find(item=>item.id===id)?.name||'All';setSelectedBoard(label(f.boards,v.boardId));setSelectedState(label(f.states,v.stateId));setSelectedType(label(f.classes,v.classId));setSelectedSubject(label(f.subjects,v.subjectId));setSelectedLanguage(label(f.languages,v.languageId));}setPreferenceReady(true);
    }).catch(e=>{if(!c.signal.aborted)setPreferenceError(e.message);});return()=>c.abort();},[user?.id]);
  const boardOptions=facets.boards.map(i=>i.name);
  const subjectOptions=facets.subjects.map(i=>i.name);
  const handleStateChange=state=>{setSelectedState(state);setSelectedBoard('All');};
  useEffect(() => {
    if (selectedSubject !== "All" && !subjectOptions.includes(selectedSubject)) {
      setSelectedSubject("All");
    }
  }, [selectedSubject, subjectOptions]);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,setPage]=useState(1),[meta,setMeta]=useState(null);
  useEffect(()=>setPage(1),[selectedBoard,selectedState,selectedSubject,selectedType,selectedLanguage]);
  const [loadError, setLoadError] = useState("");

  // Enrollment modal state
  const [selectedCourseForJoin, setSelectedCourseForJoin] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    if (filtersSaved || user) return;
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
    const controller = new AbortController();
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const result = await coachingService.getCoursesPage({
          page,
          board: selectedBoard,
          state: selectedState,
          classGrade: selectedType,
          subject: selectedSubject,
          language: selectedLanguage,
        }, controller.signal);
        if (!controller.signal.aborted) {setCourses(result.data);setMeta(result.meta);}
      } catch (err) {
        if (!controller.signal.aborted) {
          setCourses([]);
          setLoadError(err.message || "Courses are unavailable. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchCourses();
    return () => controller.abort();
  }, [selectedBoard, selectedState, selectedSubject, selectedType, selectedLanguage,page]);

  const saveChoice=async()=>{setSavingPreference(true);setPreferenceError('');try{
    const courseSelector={};for(const [key,value,items] of [['boardId',selectedBoard,facets.boards],['classId',selectedType,facets.classes],['stateId',selectedState,facets.states],['subjectId',selectedSubject,facets.subjects],['languageId',selectedLanguage,facets.languages]])courseSelector[key]=items.find(item=>item.name===value||item.id===value)?.id||'';
    await authService.savePreferences({courseSelector});showSuccess('Course choices saved to your account.');
  }catch(e){setPreferenceError(e.message);}finally{setSavingPreference(false);}};
  const handleJoinClick = (course) => {
    setSelectedCourseForJoin(course);
    setJoinSuccess(false);
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourseForJoin) return;
    try {
      setJoining(true);
      try { await coachingService.joinCourse(selectedCourseForJoin.id); } catch (e) { showError(e.message); setJoining(false); return; }
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
        to="/coaching"
        className="block -mt-3 sm:-mt-5 -mx-3 sm:-mx-6 lg:-mx-8 overflow-hidden"
      >
        <img
          src="/banners/results-banner-coaching.jpg"
          alt="Explore published coaching courses"
          className="block w-full h-auto"
        />
      </Link>
      <h1 className="text-xl sm:text-2xl font-black text-[#0A1D3F] tracking-tight">
        Select Your Course
      </h1>

      {preferenceError&&<p role="alert" className="text-sm text-red-700">Course choices: {preferenceError}</p>}
      {user&&<button disabled={!preferenceReady||savingPreference} type="button" onClick={saveChoice} className="p-2 border rounded-xl bg-white text-sm disabled:opacity-40">{savingPreference?'Saving course choices...':'Save course choices'}</button>}
      <Pagination meta={meta} onChange={setPage} loading={loading}/>
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
              aria-label="Course selector state" value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All States</option>
              {facets.states.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          {/* Board Filter — options follow the selected state */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Board
            </label>
            <select
              aria-label="Course selector board" value={selectedBoard}
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
              options={[{value:'All',label:'All Courses'},...facets.classes.map(c=>({value:c.name,label:c.name}))]}
            />
          </div>

          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-[#667085]">
              Subject
            </label>
            <select
              aria-label="Course selector subject" value={selectedSubject}
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
              aria-label="Course selector language" value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-[#F7F8FA] border border-[#E6E8EC] text-xs font-semibold text-[#0A1D3F] focus:outline-none focus:border-[#FF8A00]"
            >
              <option value="All">All Languages</option>
              {facets.languages.map(l=><option key={l.id} value={l.name}>{l.name}</option>)}
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
        ) : loadError ? (
          <p role="alert" className="bg-white rounded-2xl border p-6 text-sm">{loadError}</p>
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
