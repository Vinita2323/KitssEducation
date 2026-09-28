import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  FileCheck,
  BookOpen,
  GraduationCap,
  Building2,
  Search,
  ChevronRight,
  X
} from "lucide-react";

export const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const filterTabs = [
    { id: "all", label: "All Tabs" },
    { id: "coaching", label: "Coaching" },
    { id: "franchise", label: "Institutes & Franchise" },
    { id: "results", label: "Exam Results" },
    { id: "books", label: "Digital Books" },
    { id: "colleges", label: "Partner Colleges" }
  ];

  // Primary Category Tabs
  const categoryTabs = [
    {
      id: "coaching",
      title: "Coaching",
      subtitle: "Live batches, JEE, NEET & CBSE 9th-12th interactive classes",
      path: "/coaching",
      icon: Video,
      badge: null,
      themeColor: "text-[#FF8A00]",
      iconBg: "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-200/80 shadow-md",
      cardBg: "hover:border-[#FF8A00]/40 hover:bg-orange-50/20",
      tags: ["CBSE 9-12", "JEE Entrance", "NEET Medical", "Test Series"]
    },
    {
      id: "franchise",
      title: "Institutes & Franchise Network",
      subtitle: "Approved institutes with active University franchise tie-ups & verified seats",
      path: "/institutes",
      icon: Building2,
      badge: "VERIFIED TIE-UPS",
      badgeColor: "bg-blue-700 text-white",
      themeColor: "text-blue-700",
      iconBg: "bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-blue-200/80 shadow-md",
      cardBg: "hover:border-blue-700/40 hover:bg-blue-50/20",
      tags: ["Amity Univ", "Delhi Univ", "MAHE Manipal", "LPU Punjab", "CU"]
    },
    {
      id: "results",
      title: "Examination Results",
      subtitle: "Official board marksheets, roll number verification & scorecards",
      path: "/results",
      icon: FileCheck,
      badge: "2026 LIVE",
      badgeColor: "bg-teal-600 text-white",
      themeColor: "text-teal-600",
      iconBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-teal-200/80 shadow-md",
      cardBg: "hover:border-teal-500/40 hover:bg-teal-50/20",
      tags: ["CBSE Board", "ICSE & ISC", "State Boards", "University"]
    },
    {
      id: "books",
      title: "Digital Books & Library",
      subtitle: "NCERT curriculum books, chapter solutions & smart PDF reader",
      path: "/books",
      icon: BookOpen,
      badge: "E-LIBRARY",
      badgeColor: "bg-blue-600 text-white",
      themeColor: "text-blue-600",
      iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-200/80 shadow-md",
      cardBg: "hover:border-blue-500/40 hover:bg-blue-50/20",
      tags: ["NCERT Books", "Classes 6-12", "Solved Papers", "Revision Notes"]
    },
    {
      id: "colleges",
      title: "Partner Colleges & Admissions",
      subtitle: "Accredited universities, direct counselling & verified campus seats",
      path: "/colleges",
      icon: GraduationCap,
      badge: "ADMISSIONS",
      badgeColor: "bg-[#0A1D3F] text-white",
      themeColor: "text-[#0A1D3F]",
      iconBg: "bg-gradient-to-br from-slate-800 to-[#0A1D3F] text-white shadow-slate-300/80 shadow-md",
      cardBg: "hover:border-[#0A1D3F]/40 hover:bg-slate-50/60",
      tags: ["Engineering", "Medical & Health", "Management MBA", "Direct Seat"]
    }
  ];

  // Filter categories by tab & search query
  const filteredTabs = useMemo(() => {
    let list = categoryTabs;

    if (selectedTab !== "all") {
      list = list.filter((cat) => cat.id === selectedTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (cat) =>
          cat.title.toLowerCase().includes(q) ||
          cat.subtitle.toLowerCase().includes(q) ||
          cat.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [categoryTabs, selectedTab, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-4xl mx-auto pb-8"
    >
      {/* Header & Search Bar */}
      <div className="space-y-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-[#0A1D3F] tracking-tight">
            Explore Categories
          </h1>
          <p className="text-xs text-slate-500">
            Select a category tab to access courses, franchise institutes, books & exam results.
          </p>
        </div>

        {/* Clean Unified Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories (e.g. Coaching, Institutes, Results, Books, Colleges)..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8A00] focus:ring-1 focus:ring-orange-100 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {filterTabs.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-[#0A1D3F] text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs Grid - Only Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        <AnimatePresence mode="popLayout">
          {filteredTabs.map((cat, idx) => {
            const Icon = cat.icon;

            return (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15, delay: idx * 0.02 }}
              >
                <Link
                  to={cat.path}
                  className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs transition-all duration-200 ${cat.cardBg} cursor-pointer block`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    {/* Category Tab Icon */}
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${cat.iconBg} group-hover:scale-105 transition-transform duration-200`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>

                    {/* Category Info */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors leading-tight truncate">
                          {cat.title}
                        </h2>
                        {cat.badge && (
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-wider ${cat.badgeColor}`}
                          >
                            {cat.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {cat.subtitle}
                      </p>

                      {/* Quick Tag Badges */}
                      <div className="flex items-center gap-1 flex-wrap pt-0.5">
                        {cat.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Chevron */}
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#FF8A00] group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200 group-hover:translate-x-0.5 shadow-2xs">
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTabs.length === 0 && (
          <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-slate-200/80">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              No category tabs found matching "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTab("all");
              }}
              className="mt-2 text-xs font-bold text-[#FF8A00] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};




