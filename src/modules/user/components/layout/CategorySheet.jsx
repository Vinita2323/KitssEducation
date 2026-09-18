import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Video,
  FileCheck,
  BookOpen,
  GraduationCap,
  ShoppingBag,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers
} from "lucide-react";

export const CategorySheet = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const categories = [
    {
      title: "Online Coaching",
      subtitle: "CBSE 9-12, JEE & NEET Live Batches",
      path: "/coaching",
      icon: Video,
      badge: "LIVE",
      badgeColor: "bg-rose-500 text-white",
      color: "from-amber-500/10 to-orange-500/10 text-[#FF8A00] border-orange-500/20"
    },
    {
      title: "Examination Results",
      subtitle: "Board & University Marksheet Verification",
      path: "/results",
      icon: FileCheck,
      badge: "2026 LIVE",
      badgeColor: "bg-teal-600 text-white",
      color: "from-teal-500/10 to-emerald-500/10 text-teal-600 border-teal-500/20"
    },
    {
      title: "Digital Books",
      subtitle: "Curriculum Textbooks, NCERT & Notes",
      path: "/books",
      icon: BookOpen,
      badge: "UPDATED",
      badgeColor: "bg-blue-600 text-white",
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-500/20"
    },
    {
      title: "Partner Colleges",
      subtitle: "Verified Universities & Direct Admissions",
      path: "/colleges",
      icon: GraduationCap,
      badge: "ADMISSIONS",
      badgeColor: "bg-[#0A1D3F] text-white",
      color: "from-slate-800/10 to-slate-900/10 text-[#0A1D3F] border-slate-300"
    },
    {
      title: "My Subscriptions",
      subtitle: "Active Coaching Lectures & Validities",
      path: "/subscriptions",
      icon: ShieldCheck,
      badge: "ACTIVE",
      badgeColor: "bg-emerald-600 text-white",
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20"
    },
    {
      title: "My Orders & Receipts",
      subtitle: "Track book purchases and study pack invoices",
      path: "/orders",
      icon: ShoppingBag,
      badge: null,
      color: "from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-500/20"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#0A1D3F]/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          {/* Bottom Sheet Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10 p-4 pb-8 max-h-[85vh] flex flex-col"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF8A00] flex items-center justify-center border border-orange-200/50">
                  <Layers className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0A1D3F] leading-tight">
                    Explore Categories
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Quick access to all learning programs & services
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close categories"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Category Grid */}
            <div className="overflow-y-auto pt-3 space-y-2 max-h-[60vh] pr-0.5">
              {categories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigate(cat.path)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 border ${cat.color} group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-5.5 h-5.5 stroke-[1.9]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-[#0A1D3F] tracking-tight group-hover:text-[#FF8A00] transition-colors truncate">
                            {cat.title}
                          </h4>
                          {cat.badge && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md tracking-wider ${cat.badgeColor}`}
                            >
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {cat.subtitle}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
