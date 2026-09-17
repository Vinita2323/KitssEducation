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
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "lectures", label: "Lectures", icon: Video },
    { id: "books", label: "Study Material", icon: BookOpen },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Left Sidebar (Visible on md and above) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
        {/* Back Link */}
        <Link
          to="/coaching/my-courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#667085] hover:text-[#0A1D3F] transition py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Courses</span>
        </Link>

        <div className="bg-white rounded-2xl border border-[#E6E8EC] p-4 card-shadow space-y-4">
          {/* Mini Course Header */}
          <div className="pb-3 border-b border-[#E6E8EC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A00]">
              Learning Portal
            </span>
            <h3 className="font-extrabold text-sm text-[#0A1D3F] line-clamp-2 mt-0.5">
              {courseTitle}
            </h3>

            {/* Quick mini progress bar */}
            <div className="mt-2.5 space-y-1">
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

          {/* Navigation Links */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "bg-[#0A1D3F] text-white shadow-xs"
                      : "text-[#667085] hover:bg-[#F7F8FA] hover:text-[#0A1D3F]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#FF8A00]" : ""}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile Horizontal Tabs (< 768px) */}
      <div className="md:hidden w-full overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E6E8EC] card-shadow min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange && onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#0A1D3F] text-white shadow-xs"
                    : "text-[#667085] hover:bg-[#F7F8FA] hover:text-[#0A1D3F]"
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
