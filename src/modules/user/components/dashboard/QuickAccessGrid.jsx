import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Video, FileCheck, ShoppingBag, Megaphone, ArrowRight } from "lucide-react";

export const QuickAccessGrid = () => {
  const items = [
    {
      label: "Books",
      path: "/books",
      icon: BookOpen,
      bg: "bg-[#0A1D3F]/10 text-[#0A1D3F] hover:bg-[#0A1D3F] hover:text-white",
      iconColor: "text-[#0A1D3F] group-hover:text-white"
    },
    {
      label: "Online Coaching",
      path: "/coaching",
      icon: Video,
      bg: "bg-[#FF8A00]/10 text-[#FF8A00] hover:bg-[#FF8A00] hover:text-white",
      iconColor: "text-[#FF8A00] group-hover:text-white"
    },
    {
      label: "Results",
      path: "/results",
      icon: FileCheck,
      bg: "bg-[#17B26A]/10 text-[#17B26A] hover:bg-[#17B26A] hover:text-white",
      iconColor: "text-[#17B26A] group-hover:text-white"
    },
    {
      label: "My Orders",
      path: "/orders",
      icon: ShoppingBag,
      bg: "bg-[#6C4AB6]/10 text-[#6C4AB6] hover:bg-[#6C4AB6] hover:text-white",
      iconColor: "text-[#6C4AB6] group-hover:text-white"
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.path}
            className="group flex flex-col items-center justify-center p-3 sm:p-4 bg-white rounded-2xl border border-[#E6E8EC] shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all duration-200 active:scale-95 text-center touch-target"
          >
            <div
              className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 mb-2 ${item.bg}`}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-[#0A1D3F] leading-tight line-clamp-2">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export const AnnouncementBanner = ({ announcements = [] }) => {
  if (!announcements.length) return null;

  return (
    <div className="space-y-2.5 mb-6">
      {announcements.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3.5 bg-gradient-to-r from-orange-50/80 to-amber-50/50 rounded-2xl border border-orange-200/60 shadow-2xs gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF8A00] text-white flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FF8A00] text-white">
                  {item.tag}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {item.date}
                </span>
              </div>
              <p className="text-xs font-bold text-[#0A1D3F] truncate mt-0.5">
                {item.title}
              </p>
            </div>
          </div>

          <Link
            to="/notifications"
            className="p-1.5 rounded-lg text-[#FF8A00] hover:bg-orange-100 transition shrink-0"
            aria-label="View Announcement"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
};
