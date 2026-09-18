import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Building2
} from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { CollegeCard } from "./CollegeCard";
import { CollegeDetailsModal } from "./CollegeDetailsModal";

export const HomeCollegeSection = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  // College details modal state
  const [selectedCollegeForModal, setSelectedCollegeForModal] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const data = await collegeService.getColleges();
        if (isMounted) setColleges(data);
      } catch (err) {
        console.error("Error fetching partner colleges for home:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchColleges();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenCollege = (college) => {
    setSelectedCollegeForModal(college);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCollegeForModal(null);
  };

  return (
    <section className="space-y-3 pt-1 pb-2">
      {/* 1. Sleek Modern Section Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FF8A00] mb-0.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Verified Institutions</span>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-black text-[#0A1D3F] tracking-tight">
            Top Partner Colleges
          </h2>
          <p className="text-xs text-slate-500 leading-normal hidden xs:block">
            Direct admissions, accredited degrees & campus programs.
          </p>
        </div>

        <Link
          to="/colleges"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#FF8A00] hover:text-[#E67A00] transition-colors shrink-0 group whitespace-nowrap bg-orange-50/80 px-3 py-1.5 rounded-xl border border-orange-200/50"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2. Horizontal Swipeable Featured College Cards Carousel */}
      {loading ? (
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[82vw] sm:w-[310px] shrink-0 bg-white rounded-3xl border border-slate-200/80 p-3.5 animate-pulse flex flex-col gap-3"
            >
              <div className="w-full h-38 bg-slate-100 rounded-2xl" />
              <div className="h-4 bg-slate-100 rounded-md w-3/4" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              <div className="h-7 bg-slate-100 rounded-xl mt-1" />
            </div>
          ))}
        </div>
      ) : colleges.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-2 shadow-xs">
          <p className="font-semibold text-sm text-slate-900">No partner colleges available right now</p>
          <p className="text-xs text-slate-500">
            Check back soon as new institutions are verified.
          </p>
        </div>
      ) : (
        /* Cards Carousel: ~1.15 cards visible on mobile with peeking edge */
        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-0.5 snap-x snap-mandatory">
          {colleges.map((college) => (
            <CollegeCard
              key={college._id || college.id}
              college={college}
              onViewCollege={handleOpenCollege}
            />
          ))}

          {/* End Card linking to full directory */}
          <div className="w-52 sm:w-60 shrink-0 snap-start bg-gradient-to-br from-[#0A1D3F] via-[#0D244D] to-[#FF8A00]/25 rounded-3xl border border-slate-800 p-5 text-white flex flex-col justify-between shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#FF8A00] mb-3 border border-white/15">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-white leading-snug">
                More Partner Campuses
              </h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                Explore our full verified directory, NIRF rankings, and course admissions.
              </p>
            </div>

            <Link
              to="/colleges"
              className="mt-5 inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-[#0A1D3F] text-xs font-black py-2.5 px-3 rounded-xl transition active:scale-98 shadow-sm group"
            >
              <span>Explore All Colleges</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FF8A00] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. In-App College Details Preview Modal */}
      <CollegeDetailsModal
        college={selectedCollegeForModal}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};
