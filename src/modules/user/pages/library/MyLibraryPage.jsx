import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Video,
  FileText,
  ArrowLeft,
  Search,
  Sparkles,
  Play,
  Clock,
  CheckCircle2
} from "lucide-react";
import { bookService } from "../../services/bookService";
import { coachingService } from "../../services/coachingService";
import { useLibrary } from "../../context/LibraryContext";
import { ProgressBar } from "../../components/common/SectionHeader";
import { SkeletonLoader, EmptyState } from "../../components/common/EmptyState";

export const MyLibraryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("books"); // 'books' | 'videos' | 'tests'
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const { purchasedBookIds, subscribedCourseIds } = useLibrary();

  useEffect(() => {
    const fetchLibraryData = async () => {
      try {
        setLoading(true);
        const [booksData, coursesData] = await Promise.all([
          bookService.getMyLibraryBooks(),
          coachingService.getCourses()
        ]);

        const filteredBooks = booksData.filter(
          (b) => purchasedBookIds.includes(b.id) || b.isFree
        );
        const filteredCourses = coursesData.filter((c) =>
          subscribedCourseIds.includes(c.id)
        );

        setLibraryBooks(filteredBooks);
        setEnrolledCourses(filteredCourses.length ? filteredCourses : [coursesData[0]]);
      } catch (err) {
        console.error("Library load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [purchasedBookIds, subscribedCourseIds]);

  const mockTests = [
    {
      id: "test-01",
      title: "Class 10 CBSE Mathematics Mock Test 1",
      duration: "90 Mins",
      questions: 40,
      marks: 80,
      subject: "Mathematics",
      status: "Available"
    },
    {
      id: "test-02",
      title: "Science: Life Processes & Chemical Reactions Drill",
      duration: "45 Mins",
      questions: 30,
      marks: 60,
      subject: "Science",
      status: "Available"
    },
    {
      id: "test-03",
      title: "English Grammar & Comprehension Speed Test",
      duration: "30 Mins",
      questions: 25,
      marks: 50,
      subject: "English",
      status: "Completed (46/50)"
    }
  ];

  const filteredBooksList = libraryBooks.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoursesList = enrolledCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTestsList = mockTests.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] w-full overflow-x-hidden">
      {/* Clean Dedicated Top Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E6E8EC] shadow-2xs">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-[#F7F8FA] border border-[#E6E8EC] text-[#0A1D3F] hover:bg-gray-100 transition active:scale-95 shrink-0"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base sm:text-lg font-extrabold text-[#0A1D3F] tracking-tight leading-none">
            My Library
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl w-full mx-auto px-3 sm:px-6 py-3 space-y-3 box-border">
        {/* Responsive Compact Tabs (Grid-based so never overflows) */}
        <div className="w-full space-y-2.5">
          <div className="grid grid-cols-3 w-full p-1 bg-[#EAECF0] rounded-xl gap-1 box-border">
            {[
              { id: "books", label: "Books", icon: BookOpen, count: libraryBooks.length },
              { id: "videos", label: "Videos", icon: Video, count: enrolledCourses.length },
              { id: "tests", label: "Tests", icon: FileText, count: mockTests.length }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery("");
                  }}
                  className={`w-full py-1.5 px-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all min-w-0 ${
                    isActive
                      ? "bg-white text-[#0A1D3F] shadow-xs"
                      : "text-[#667085] hover:text-[#0A1D3F]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] shrink-0 ${
                      isActive ? "bg-[#FF8A00] text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E6E8EC] rounded-xl text-xs text-[#0A1D3F] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0A1D3F] box-border"
            />
          </div>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <SkeletonLoader type="card" count={3} />
        ) : activeTab === "books" ? (
          <div>
            {filteredBooksList.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Books Found"
                description={searchQuery ? "No books matched your search query." : "Explore our catalog to add books to your library."}
                actionText="Browse Books"
                onAction={() => navigate("/books")}
              />
            ) : (
              <div className="space-y-2.5">
                {filteredBooksList.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition-all gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-14 rounded-lg bg-gradient-to-br ${
                          book.coverColor || "from-[#0A1D3F] to-[#133C8B]"
                        } p-1.5 flex flex-col justify-between text-white shrink-0 shadow-xs`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-[8px] font-bold truncate">Cl {book.class}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#17B26A]/10 text-[#17B26A]">
                            {book.subject || "E-Book"}
                          </span>
                          <span className="text-[10px] text-[#667085]">{book.fileSize}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">
                          {book.title}
                        </h4>
                        <p className="text-[11px] text-[#667085] truncate">
                          {book.subtitle} • {book.pages} Pages
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/books/${book.id}/read`}
                      className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl shrink-0 transition active:scale-95 shadow-xs flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "videos" ? (
          <div>
            {filteredCoursesList.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No Courses Found"
                description={searchQuery ? "No courses matched your search query." : "You have not enrolled in any online coaching courses yet."}
                actionText="Explore Coaching"
                onAction={() => navigate("/coaching")}
              />
            ) : (
              <div className="space-y-3">
                {filteredCoursesList.map((course) => (
                  <div
                    key={course.id}
                    className="p-3.5 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E6E8EC]"
                        />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0A1D3F] text-white">
                            {course.category} • Class {course.class}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate mt-0.5">
                            {course.title}
                          </h3>
                          <p className="text-[11px] text-[#667085] truncate">
                            {course.videoCount}+ Videos • {course.testCount} Tests • {course.instructor}
                          </p>
                        </div>
                      </div>

                      <Link
                        to={`/coaching/${course.id}`}
                        className="px-3.5 py-1.5 bg-[#0A1D3F] hover:bg-[#133C8B] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shrink-0 transition active:scale-95 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch</span>
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-[#E6E8EC] flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-[#667085] mb-0.5">
                          <span>Progress</span>
                          <span className="font-bold text-[#FF8A00]">63%</span>
                        </div>
                        <ProgressBar progress={63} color="orange" height="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTestsList.map((test) => (
              <div
                key={test.id}
                className="p-3 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 transition flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-[#0A1D3F]">
                      {test.subject}
                    </span>
                    <span className="text-[11px] text-[#667085] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>{test.duration}</span>
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#0A1D3F] truncate">{test.title}</h4>
                  <p className="text-[11px] text-[#667085] truncate">
                    {test.questions} Questions • Max: {test.marks} •{" "}
                    <span className="text-[#17B26A] font-semibold">{test.status}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold rounded-xl transition active:scale-95 shrink-0 shadow-xs"
                >
                  {test.status.includes("Completed") ? "Analysis" : "Start"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
