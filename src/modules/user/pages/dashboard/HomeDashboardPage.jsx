import React, { useState, useEffect } from "react";
import { coachingService } from "../../services/coachingService";
import { QuickAccessGrid } from "../../components/dashboard/QuickAccessGrid";
import { HomeCollegeSection } from "../../components/college/HomeCollegeSection";
import { SectionHeader } from "../../components/common/SectionHeader";
import { CourseCard } from "../../components/coaching/CourseCard";
import { SkeletonLoader } from "../../components/common/EmptyState";

export const HomeDashboardPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const coursesData = await coachingService.getCourses();
        setCourses(coursesData);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">
      {/* 1. Quick Access 3-Category Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Explore Categories
          </h3>
        </div>
        <QuickAccessGrid />
      </div>

      {/* 2. Find Your College (Education Franchise / Partner Colleges) */}
      <HomeCollegeSection />

      {/* 3. Popular Online Coaching Courses */}
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
    </div>
  );
};

