import React from "react";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  TrendingUp,
  User,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

export const CoachingSidebar = ({
  activeTab = "lectures",
  onTabChange,
  courseTitle = "Class 10 CBSE Science",
  courseId,
  progressPercentage = 42,
}) => {
  const tabs = [
    { id: "lectures", label: "Lectures", icon: Video },
    { id: "books", label: "Study Material", icon: BookOpen },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Left Sidebar (Visible on md and above) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 space-y-3">
        {/* Back Link */}
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition py-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Courses</span>
        </Link>

        <div className="bg-white rounded-md border border-[#E6E8EC] p-3.5 shadow-2xs space-y-3">
          {/* Mini Course Header */}
          <div className="pb-2.5 border-b border-[#E6E8EC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
              Learning Portal
            </span>
            <h3 className="font-extrabold text-xs sm:text-sm text-[#0A1D3F] line-clamp-2 mt-0.5">
              {courseTitle}
            </h3>

            {/* Quick mini progress bar */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#667085]">
                <span>Progress</span>
                <span className="font-bold text-[#17B26A]">{progressPercentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#F7F8FA] rounded-full overflow-hidden border border-[#E6E8EC]">
                <div
                  className="h-full bg-[#17B26A] rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation Links (Minimized Border Radius: rounded-md) */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#0A1D3F] text-white shadow-2xs"
                      : "text-[#667085] hover:bg-[#F7F8FA] hover:text-[#0A1D3F]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FF8A00]" : ""}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Single Horizontal Tabs Strip (< 768px, Minimized Border Radius: rounded-md) */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar py-0.5 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? "bg-[#0A1D3F] text-white border-[#0A1D3F] shadow-2xs"
                    : "bg-white text-[#667085] border-[#E6E8EC] hover:bg-[#F7F8FA] hover:text-[#0A1D3F]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FF8A00]" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
