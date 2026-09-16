import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, GraduationCap, ArrowRight, Building2 } from "lucide-react";
import { collegeService } from "../../services/collegeService";
import { SectionHeader } from "../common/SectionHeader";

export const HomeCollegeSection = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-3.5 pt-2">
      <SectionHeader
        title="Find Your College"
        subtitle="Explore our partner colleges and find the right course for your future."
        viewAllLink="/colleges"
        viewAllText="View All Colleges"
      />

      {loading ? (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-72 sm:w-80 shrink-0 bg-white rounded-2xl border border-[#E6E8EC] p-3.5 animate-pulse flex flex-col gap-3"
            >
              <div className="w-full h-36 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-9 bg-gray-200 rounded-xl mt-2" />
            </div>
          ))}
        </div>
      ) : colleges.length === 0 ? null : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 snap-x snap-mandatory">
          {colleges.map((college) => {
            const collegeId = college._id || college.id;
            return (
              <div
                key={collegeId}
                className="w-72 sm:w-80 shrink-0 snap-start bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-gray-300"
              >
                <div>
                  {/* College Image Banner */}
                  <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                    <img
                      src={college.banner || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80"}
                      alt={college.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* College Type Badge */}
                    <span className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/90 backdrop-blur-xs text-[#0A1D3F] text-[10px] font-bold rounded-full shadow-xs">
                      {college.collegeType || "Partner College"}
                    </span>

                    {/* Logo Overlay */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-white p-1 shadow-md border border-white/50 shrink-0 overflow-hidden flex items-center justify-center">
                        {college.logo ? (
                          <img
                            src={college.logo}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-[#0A1D3F]" />
                        )}
                      </div>
                      <span className="text-white text-xs font-semibold drop-shadow-sm truncate max-w-[170px]">
                        Verified Partner
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5">
                    <h3 className="text-sm sm:text-base font-bold text-[#0A1D3F] line-clamp-1 group-hover:text-[#FF8A00] transition">
                      {college.name}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-[#667085] text-xs mt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF8A00] shrink-0" />
                      <span className="truncate">{college.location || college.city}</span>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-[#667085] mt-2 line-clamp-2 leading-relaxed">
                      {college.description || college.about || "Explore undergraduate and postgraduate degrees with 100% admission guidance."}
                    </p>
                  </div>
                </div>

                {/* Footer Meta & CTA */}
                <div className="px-3.5 pb-3.5 pt-1 border-t border-[#F0F2F5] flex items-center justify-between gap-2 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0A1D3F] bg-[#F7F8FA] px-2.5 py-1 rounded-lg border border-[#E6E8EC]">
                    <GraduationCap className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>{college.coursesCount || 0} Courses</span>
                  </div>

                  <Link
                    to={`/colleges/${collegeId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0A1D3F] hover:text-[#FF8A00] bg-gray-100 hover:bg-orange-50 px-3 py-1.5 rounded-xl transition active:scale-95"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* End Card: View All Colleges */}
          <div className="w-56 shrink-0 snap-start bg-gradient-to-br from-[#0A1D3F] to-[#133C8B] rounded-2xl p-5 text-white flex flex-col justify-between shadow-md">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FF8A00] mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold leading-snug">
                Explore More Partner Colleges
              </h3>
              <p className="text-xs text-blue-100/70 mt-2">
                Discover degree programs, campus facilities, and admission requirements.
              </p>
            </div>

            <Link
              to="/colleges"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-[#FF8A00] hover:bg-[#E67C00] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition active:scale-95"
            >
              <span>View All Colleges</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
