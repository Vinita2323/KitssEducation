import { resolveCategoryCards, categoryThemes } from './categoryCards';
import { usePublishedContent, PublishedSections } from '../../components/common/PublishedContent';
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Library, Users,
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
  const {data:categoryContent,error:categoryError} = usePublishedContent('categories');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  const categoryTabs = useMemo(() => resolveCategoryCards(categoryContent).filter(card => !card.hidden).map(card => ({
    ...card, ...(categoryThemes[card.color] || categoryThemes.navy),
    icon: { Video, Building2, FileCheck, BookOpen, GraduationCap, Globe, Library, Users }[card.iconKey] || BookOpen,
  })), [categoryContent]);
  const filterTabs = [{ id: 'all', label: 'All Tabs' }, ...categoryTabs.map(card => ({ id: card.id, label: card.tabLabel }))];
  const effectiveTab = categoryTabs.some(card => card.id === selectedTab) ? selectedTab : 'all';
  const filteredTabs = useMemo(() => {
    let list = categoryTabs;
    if (effectiveTab !== "all") {
      list = list.filter((cat) => cat.id === effectiveTab);
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
  }, [categoryTabs, effectiveTab, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-4xl mx-auto pb-8"
    >
      {categoryError && <p role="status">Published category information is unavailable.</p>}
      {categoryContent.sections?.length > 0 && <PublishedSections sections={categoryContent.sections} />}
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
            placeholder="Search categories (e.g. Coaching, Results, Books, Colleges)..."
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
            const active = effectiveTab === tab.id;
            return (
              <button
                key={tab.id}
                aria-pressed={active}
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
                      {cat.imageAssetId ? <img src={'/api/v1/media/' + cat.imageAssetId + '/content'} alt="" className="w-full h-full object-cover rounded-2xl" /> : <Icon aria-hidden="true" className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />}
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




