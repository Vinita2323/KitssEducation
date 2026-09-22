import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  FileCheck,
  BookOpen,
  GraduationCap,
  Search,
  ChevronRight,
  Sparkles,
  Calculator,
  CheckCircle2,
  FileText,
  Atom,
  X
} from "lucide-react";

export const CategoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const filterTabs = [
    { id: "all", label: "All Categories" },
    { id: "coaching", label: "Coaching" },
    { id: "results", label: "Exam Results" },
    { id: "books", label: "Digital Books" },
    { id: "colleges", label: "Partner Colleges" }
  ];

  const categorySections = [
    {
      id: "coaching",
      title: "Coaching",
      description: "Live batches, doubt sessions & test series",
      link: "/coaching",
      iconTheme: "bg-amber-50 text-[#FF8A00] border border-amber-200/60",
      icon: Video,
      items: [
        {
          label: "CBSE Classes (9th–12th)",
          sub: "Live syllabus coverage & doubt classes",
          path: "/coaching?category=CBSE",
          icon: BookOpen
        },
        {
          label: "JEE Main & Advanced",
          sub: "Engineering entrance prep & top mentors",
          path: "/coaching?category=JEE",
          icon: Calculator
        },
        {
          label: "NEET Medical Entrance",
          sub: "Physics, Chemistry & Biology batches",
          path: "/coaching?category=NEET",
          icon: Sparkles
        },
        {
          label: "All India Test Series",
          sub: "Real-time rank analysis & mock tests",
          path: "/coaching",
          icon: FileCheck
        }
      ]
    },
    {
      id: "results",
      title: "Examination Results",
      description: "Official marksheets & board credentials",
      link: "/results",
      iconTheme: "bg-teal-50 text-teal-600 border border-teal-200/60",
      icon: FileCheck,
      items: [
        {
          label: "CBSE Board (10th & 12th)",
          sub: "Official roll number marksheet search",
          path: "/results",
          icon: CheckCircle2
        },
        {
          label: "ICSE & ISC Examinations",
          sub: "Subject-wise scorecards & certificates",
          path: "/results",
          icon: FileText
        },
        {
          label: "State Boards of India",
          sub: "UP, MP, Bihar & State board results",
          path: "/results",
          icon: FileCheck
        },
        {
          label: "University Semester Results",
          sub: "Degree marksheets & transcript verification",
          path: "/results",
          icon: GraduationCap
        }
      ]
    },
    {
      id: "books",
      title: "Digital Books & Library",
      description: "NCERT & curriculum textbooks in smart reader",
      link: "/books",
      iconTheme: "bg-blue-50 text-blue-600 border border-blue-200/60",
      icon: BookOpen,
      items: [
        {
          label: "NCERT Textbooks & Solutions",
          sub: "Complete solutions for classes 6 to 12",
          path: "/books?board=NCERT",
          icon: BookOpen
        },
        {
          label: "CBSE Reference Guides",
          sub: "Exemplars & chapter-wise revision notes",
          path: "/books?board=CBSE",
          icon: FileText
        },
        {
          label: "ICSE Prescribed Books",
          sub: "Comprehensive syllabus digital library",
          path: "/books?board=ICSE",
          icon: BookOpen
        },
        {
          label: "Solved Question Banks",
          sub: "Previous year questions & practice sets",
          path: "/books",
          icon: Sparkles
        }
      ]
    },
    {
      id: "colleges",
      title: "Partner Colleges & Admissions",
      description: "Accredited campuses, fees & verified seats",
      link: "/colleges",
      iconTheme: "bg-slate-100 text-[#0A1D3F] border border-slate-300/80",
      icon: GraduationCap,
      items: [
        {
          label: "Engineering Institutes (B.Tech)",
          sub: "NAAC accredited colleges & placement records",
          path: "/colleges?category=Engineering",
          icon: Atom
        },
        {
          label: "Medical & Health Sciences",
          sub: "MBBS, BDS, Pharmacy & Nursing colleges",
          path: "/colleges?category=Medical",
          icon: Sparkles
        },
        {
          label: "Management (MBA & BBA)",
          sub: "Corporate tie-ups & business schools",
          path: "/colleges?category=Management",
          icon: GraduationCap
        },
        {
          label: "Direct Admissions & Guidance",
          sub: "Seat counselling, cutoffs & fee booking",
          path: "/colleges",
          icon: ChevronRight
        }
      ]
    }
  ];

  // Filter sections by tab & search query
  const filteredSections = useMemo(() => {
    let list = categorySections;

    if (selectedTab !== "all") {
      list = list.filter((sec) => sec.id === selectedTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list
        .map((sec) => ({
          ...sec,
          items: sec.items.filter(
            (item) =>
              item.label.toLowerCase().includes(q) ||
              item.sub.toLowerCase().includes(q) ||
              sec.title.toLowerCase().includes(q)
          )
        }))
        .filter((sec) => sec.items.length > 0);
    }

    return list;
  }, [categorySections, selectedTab, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-3.5 max-w-4xl mx-auto pb-8"
    >
      {/* Clean Header & Search Area */}
      <div className="space-y-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0A1D3F] tracking-tight">
            Explore Categories
          </h1>
          <p className="text-xs text-slate-500">
            Find coaching batches, exam results, digital books & partner colleges.
          </p>
        </div>

        {/* Clean Unified Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search programs, boards, exams or colleges..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-white border border-slate-200/90 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FF8A00] focus:ring-1 focus:ring-orange-100 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {filterTabs.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
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

      {/* Category Sections - Clean Grouped iOS/Linear Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-0.5">
        {filteredSections.map((section, secIdx) => {
          const SectionIcon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: secIdx * 0.03 }}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col hover:border-slate-300 transition-colors"
            >
              {/* Clean Section Header */}
              <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${section.iconTheme}`}
                  >
                    <SectionIcon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-[#FF8A00] truncate">
                      {section.title}
                    </h2>
                    <p className="text-[11px] text-slate-400 truncate">
                      {section.description}
                    </p>
                  </div>
                </div>

                <Link
                  to={section.link}
                  className="text-xs font-bold text-[#FF8A00] hover:text-[#E67A00] flex items-center gap-0.5 group shrink-0 ml-2"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Clean List Items (Hairline divided, NO nested box clutter, NO truncation) */}
              <div className="divide-y divide-slate-100 flex-1">
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/80 active:bg-slate-100/60 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-100/80 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-orange-50 group-hover:text-[#FF8A00] transition-colors">
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <div className="text-xs font-semibold text-slate-800 group-hover:text-[#FF8A00] transition-colors leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            {item.sub}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0A1D3F] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-slate-200/80">
            <p className="text-xs sm:text-sm font-semibold text-slate-600">
              No categories found matching "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTab("all");
              }}
              className="mt-2 text-xs font-bold text-[#FF8A00] hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};


