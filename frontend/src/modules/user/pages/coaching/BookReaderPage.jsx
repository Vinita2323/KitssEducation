import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { coachingService } from "../../services/coachingService";
import { OnlineBookViewer } from "../../components/coaching/OnlineBookViewer";

export const BookReaderPage = () => {
  const { id: courseId, bookId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReaderData = async () => {
      try {
        setLoading(true);
        const [courseData, profileData] = await Promise.all([
          coachingService.getCourseById(courseId),
          coachingService.getStudentProfile(),
        ]);

        setCourse(courseData);
        setStudent(profileData);

        let foundBook = null;
        (courseData.subjectsData || []).forEach((subj) => {
          (subj.books || []).forEach((b) => {
            if (b.id === bookId) {
              foundBook = b;
            }
          });
        });

        // Fallback to first book if not found
        if (!foundBook && courseData.subjectsData?.[0]?.books?.[0]) {
          foundBook = courseData.subjectsData[0].books[0];
        }

        setCurrentBook(foundBook);
      } catch (err) {
        console.error("Reader load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReaderData();
  }, [courseId, bookId]);

  const handlePageChange = (page) => {
    if (currentBook) {
      coachingService.updateBookProgress(currentBook.id, page);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!currentBook || !course) {
    return (
      <div className="max-w-md mx-auto p-10 text-center bg-white rounded-2xl border border-[#E6E8EC] card-shadow space-y-3">
        <h3 className="font-bold text-base text-[#0A1D3F]">Study Material Not Found</h3>
        <Link
          to={`/coaching/${courseId}/dashboard`}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#FF8A00]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E6E8EC]">
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
              <span className="font-semibold text-[#FF8A00]">{currentBook.subject}</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-[#0A1D3F] truncate max-w-xl">
              {currentBook.title}
            </h1>
          </div>
        </div>

        <span className="text-xs font-bold text-[#17B26A] bg-[#17B26A]/10 px-3 py-1 rounded-full hidden sm:flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Protected Study Material</span>
        </span>
      </div>

      {/* Main Online Book Viewer */}
      <OnlineBookViewer
        book={currentBook}
        courseTitle={course.title}
        studentName={student?.name || "Rohan Sharma"}
        studentId={student?.id || "KITSS20261084"}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
