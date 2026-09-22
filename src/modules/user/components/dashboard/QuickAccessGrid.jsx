import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, FileCheck, BookOpen, GraduationCap, ChevronRight, Sparkles } from "lucide-react";

export const QuickAccessGrid = () => {
  const items = [
    {
      label: "Coaching",
      fullName: "Online Coaching",
      desc: "Live batches & test series",
      path: "/coaching",
      icon: Video,
      badge: "LIVE",
      badgeColor: "bg-rose-500 text-white",
      bgStyle: "bg-orange-50 text-[#FF8A00] border-orange-200/80 group-hover:bg-orange-100/70",
      cardHover: "hover:border-orange-300 hover:shadow-xs",
    },
    {
      label: "Results",
      fullName: "Exam Results",
      desc: "Official board marksheets",
      path: "/results",
      icon: FileCheck,
      badge: "2026",
      badgeColor: "bg-teal-600 text-white",
      bgStyle: "bg-teal-50 text-teal-600 border-teal-200/80 group-hover:bg-teal-100/70",
      cardHover: "hover:border-teal-300 hover:shadow-xs",
    },
    {
      label: "Books",
      fullName: "Digital Books",
      desc: "NCERT & smart e-library",
      path: "/books",
      icon: BookOpen,
      badge: "PDF",
      badgeColor: "bg-blue-600 text-white",
      bgStyle: "bg-blue-50 text-blue-600 border-blue-200/80 group-hover:bg-blue-100/70",
      cardHover: "hover:border-blue-300 hover:shadow-xs",
    },
    {
      label: "Colleges",
      fullName: "Institutions",
      desc: "Direct verified admissions",
      path: "/colleges",
      icon: GraduationCap,
      badge: "ADMISSION",
      badgeColor: "bg-[#0A1D3F] text-white",
      bgStyle: "bg-slate-100 text-[#0A1D3F] border-slate-200 group-hover:bg-slate-200/70",
      cardHover: "hover:border-slate-300 hover:shadow-xs",
    }
  ];

  const quickPills = [
    { label: "CBSE Batches", path: "/coaching?category=CBSE" },
    { label: "JEE & NEET Prep", path: "/coaching?category=JEE" },
    { label: "NCERT Solutions", path: "/books?board=NCERT" },
    { label: "Check Marksheets", path: "/results" },
    { label: "Engineering & Medical", path: "/colleges" },
  ];

  return (
    <div className="space-y-2.5">
      {/* 4 Core Category Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileTap={{ scale: 0.94 }}
              whileHover={{ y: -2 }}
            >
              <Link
                to={item.path}
                className={`relative flex flex-col justify-between p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 transition-all text-left group shadow-2xs ${item.cardHover}`}
              >
                {/* Top Row: Icon & Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shrink-0 ${item.bgStyle}`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.9]" />
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider uppercase ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors leading-tight">
                    {item.fullName}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                    {item.desc}
                  </p>
                </div>

                {/* Explore arrow indicator */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-[#FF8A00] transition-colors">
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Filter Sub-Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:inline-flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[#FF8A00]" />
          <span>Popular:</span>
        </span>
        {quickPills.map((pill) => (
          <Link
            key={pill.label}
            to={pill.path}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white hover:bg-orange-50 hover:text-[#FF8A00] text-slate-600 border border-slate-200/80 hover:border-orange-200/70 transition-all shadow-2xs whitespace-nowrap active:scale-95"
          >
            {pill.label}
          </Link>
        ))}
      </div>
    </div>
  );
};
