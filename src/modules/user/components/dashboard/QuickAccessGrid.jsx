import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, FileCheck, BookOpen, GraduationCap } from "lucide-react";

export const QuickAccessGrid = () => {
  const items = [
    {
      label: "Coaching",
      fullName: "Online Coaching",
      path: "/coaching",
      icon: Video,
      badge: "Live",
      bgStyle: "bg-orange-50 text-[#FF8A00] border-orange-200/70",
      accentDot: "bg-[#FF8A00]"
    },
    {
      label: "Results",
      fullName: "Exam Results",
      path: "/results",
      icon: FileCheck,
      badge: "2026",
      bgStyle: "bg-teal-50 text-teal-600 border-teal-200/70",
      accentDot: "bg-teal-500"
    },
    {
      label: "Books",
      fullName: "Digital Books",
      path: "/books",
      icon: BookOpen,
      badge: "PDF",
      bgStyle: "bg-blue-50 text-blue-600 border-blue-200/70",
      accentDot: "bg-blue-500"
    },
    {
      label: "Colleges",
      fullName: "Institutions",
      path: "/colleges",
      icon: GraduationCap,
      badge: "Admissions",
      bgStyle: "bg-slate-100 text-[#0A1D3F] border-slate-200",
      accentDot: "bg-[#0A1D3F]"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3.5 mb-5">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -2 }}
          >
            <Link
              to={item.path}
              className="flex flex-col items-center justify-center p-2.5 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all text-center touch-target group"
            >
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105 mb-1.5 ${item.bgStyle}`}
              >
                <Icon className="w-5.5 h-5.5 stroke-[1.9]" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#0A1D3F] tracking-tight leading-tight text-center">
                {item.label}
              </span>
              <span className="text-[9px] font-medium text-slate-400 mt-0.5 hidden xs:block">
                {item.badge}
              </span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
};
