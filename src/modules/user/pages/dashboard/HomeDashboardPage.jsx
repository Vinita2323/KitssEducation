import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { bookService } from "../../services/bookService";
import { coachingService } from "../../services/coachingService";
import { notificationService } from "../../services/notificationService";
import { QuickAccessGrid, AnnouncementBanner } from "../../components/dashboard/QuickAccessGrid";
import { HomeCollegeSection } from "../../components/college/HomeCollegeSection";
import { SectionHeader } from "../../components/common/SectionHeader";
import { BookCard } from "../../components/books/BookCard";
import { CourseCard } from "../../components/coaching/CourseCard";
import { SkeletonLoader } from "../../components/common/EmptyState";

export const HomeDashboardPage = () => {

  const [books, setBooks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [booksData, coursesData, annData] = await Promise.all([
          bookService.getBooks(),
          coachingService.getCourses(),
          notificationService.getAnnouncements()
        ]);
        setBooks(booksData);
        setCourses(coursesData);
        setAnnouncements(annData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. Quick Access 4-Category Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
            Explore Categories
          </h3>
          <Link
            to="/books"
            className="text-xs font-bold text-[#FF8A00] hover:text-[#E67C00] transition"
          >
            View All
          </Link>
        </div>
        <QuickAccessGrid />
      </div>

      {/* 2. Latest Announcements */}
      <AnnouncementBanner announcements={announcements} />

      {/* 3. Find Your College (Education Franchise / Partner Colleges) */}
      <HomeCollegeSection />

      {/* 4. Popular Digital Books */}
      <div className="space-y-3">
        <SectionHeader
          title="Popular Books"
          subtitle="Top recommended books for CBSE & NCERT"
          viewAllLink="/books"
        />

        {loading ? (
          <SkeletonLoader type="book" count={4} />
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:overflow-visible">
            {books.slice(0, 4).map((book) => (
              <div key={book.id} className="sm:hidden">
                <BookCard book={book} layout="horizontal" />
              </div>
            ))}
            {books.slice(0, 4).map((book) => (
              <div key={`grid-${book.id}`} className="hidden sm:block">
                <BookCard book={book} layout="grid" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Popular Online Coaching Courses */}
      <div className="space-y-3 pt-2">
        <SectionHeader
          title="Popular Courses"
          subtitle="Comprehensive video lectures & live test series"
          viewAllLink="/coaching"
        />

        {loading ? (
          <SkeletonLoader type="course" count={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} layout="grid" />
            ))}
          </div>
        )}
      </div>

      {/* 5. Why KITSS Education Section (Desktop & Tablet Value Add) */}
      <div className="mt-8 p-6 bg-white rounded-3xl border border-[#E6E8EC] shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] bg-orange-50 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why KITSS Education</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#0A1D3F]">
            One Integrated Platform for Books, Coaching & Board Results
          </h3>
          <p className="text-xs text-[#667085] mt-1 leading-relaxed">
            Everything you need for your board & competitive exams: high quality verified curriculum books, interactive chapter recordings by top educators, and fast result verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
          <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E6E8EC]">
            <span className="text-2xl mb-1 block">📱</span>
            <h4 className="text-xs font-bold text-[#0A1D3F]">Single Device Secure</h4>
            <p className="text-[11px] text-[#667085] mt-0.5">Learn seamlessly on your phone, tablet, or desktop.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E6E8EC]">
            <span className="text-2xl mb-1 block">⚡</span>
            <h4 className="text-xs font-bold text-[#0A1D3F]">Instant Marksheets</h4>
            <p className="text-[11px] text-[#667085] mt-0.5">Official board results with QR verified print layout.</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F7F8FA] border border-[#E6E8EC]">
            <span className="text-2xl mb-1 block">🎯</span>
            <h4 className="text-xs font-bold text-[#0A1D3F]">Expert Coaching</h4>
            <p className="text-[11px] text-[#667085] mt-0.5">Live doubt clearing and structured chapter tests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
