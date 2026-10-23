import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Building2, Video, ArrowRight, TrendingUp } from 'lucide-react';
import { collegeService } from '../../services/collegeService';
import { coachingService } from '../../services/coachingService';
import { CollegeCard } from '../college/CollegeCard';
import { CourseCard } from '../coaching/CourseCard';
import { CollegeDetailsModal } from '../college/CollegeDetailsModal';

export const FeaturedSection = () => {
  const [featuredColleges, setFeaturedColleges] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [collegesData, coursesData] = await Promise.all([
          collegeService.getColleges(),
          coachingService.getCourses()
        ]);
        // Just take top 3 for featured
        setFeaturedColleges(collegesData.slice(0, 3));
        setFeaturedCourses(coursesData.slice(0, 3));
      } catch (err) {
        console.error("Error fetching featured data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <section className="py-8 space-y-10">
      {/* Featured Header */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FF8A00] mb-1">
          <Star className="w-3.5 h-3.5 fill-[#FF8A00]" />
          <span>Handpicked for you</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#0A1D3F] tracking-tight">
          Featured Collections
        </h2>
        <p className="text-sm text-slate-500 max-w-xl mx-auto">
          Discover top-rated colleges and trending courses chosen by our experts to accelerate your career.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured Colleges Column */}
        <div className="space-y-4 bg-white/50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
          {/* subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A1D3F]">Top Colleges</h3>
                <p className="text-xs text-slate-500">Highest placement rates</p>
              </div>
            </div>
            <Link to="/colleges" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
            ) : featuredColleges.length > 0 ? (
              featuredColleges.map((college) => (
                <div key={college._id || college.id} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedCollege(college); setIsModalOpen(true); }}>
                  <div className="flex gap-4 items-center">
                    <img src={college.logoUrl || "https://placehold.co/100x100?text=College"} alt={college.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                    <div>
                      <h4 className="font-bold text-[#0A1D3F] line-clamp-1">{college.name}</h4>
                      <p className="text-xs text-slate-500">{college.location}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Top Ranked</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No colleges found.</p>
            )}
          </div>
        </div>

        {/* Featured Courses Column */}
        <div className="space-y-4 bg-white/50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
          {/* subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2" />
          
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#FF8A00]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A1D3F]">Trending Courses</h3>
                <p className="text-xs text-slate-500">Most enrolled batches</p>
              </div>
            </div>
            <Link to="/coaching" className="text-sm font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-1 group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
            ) : featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex gap-4 items-center">
                    <img src={course.thumbnailUrl || "https://placehold.co/100x100?text=Course"} alt={course.title} className="w-20 h-16 rounded-xl object-cover border border-slate-100" />
                    <div className="flex-1">
                      <h4 className="font-bold text-[#0A1D3F] line-clamp-1">{course.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{course.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-orange-50 text-[#FF8A00] px-2 py-0.5 rounded-full">{course.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No courses found.</p>
            )}
          </div>
        </div>
      </div>

      <CollegeDetailsModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCollege(null);
        }}
      />
    </section>
  );
};
