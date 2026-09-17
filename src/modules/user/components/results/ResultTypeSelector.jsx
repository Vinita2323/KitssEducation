import React from "react";
import { GraduationCap, Building2, ArrowRight, Check } from "lucide-react";

/**
 * ResultTypeSelector
 * Supports two presentation modes:
 * 1. 'cards' - Prominent hero cards for Landing screen
 * 2. 'tabs'  - Sleek selectable pills/tabs when active in the search flow
 */
export const ResultTypeSelector = ({
  selectedType,
  onSelectType,
  mode = "cards" // 'cards' | 'tabs'
}) => {
  const options = [
    {
      id: "school",
      title: "School Result",
      description: "Check your school examination or board result.",
      badge: "Class 10th & 12th Boards",
      icon: GraduationCap,
      color: "#0A1D3F",
      bgLight: "bg-[#0A1D3F]/5",
      borderActive: "border-[#0A1D3F]",
      ringActive: "ring-[#0A1D3F]/20"
    },
    {
      id: "university",
      title: "University Result",
      description: "Check your university examination result.",
      badge: "Colleges & Autonomous Institutes",
      icon: Building2,
      color: "#FF8A00",
      bgLight: "bg-[#FF8A00]/5",
      borderActive: "border-[#FF8A00]",
      ringActive: "ring-[#FF8A00]/20"
    }
  ];

  if (mode === "tabs") {
    return (
      <div className="w-full">
        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Select Result Type
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {options.map((opt) => {
            const isSelected = selectedType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectType(opt.id)}
                className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all touch-target cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? "text-slate-900" : "text-slate-500"
                  }`}
                />
                <span className="truncate">{opt.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Hero Cards View (Landing Screen) - Compacted & Refined
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full">
      {options.map((opt) => {
        const isSelected = selectedType === opt.id;
        const Icon = opt.icon;

        return (
          <div
            key={opt.id}
            onClick={() => onSelectType(opt.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectType(opt.id);
              }
            }}
            className="group relative text-left bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 transition-all duration-150 cursor-pointer shadow-xs hover:border-slate-300 hover:shadow-sm active:scale-[0.99] flex flex-col justify-between"
          >
            <div>
              {/* Top Row: Icon & Badge */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-100 text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-colors"
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                  {opt.badge}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors tracking-tight">
                  {opt.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                  {opt.description}
                </p>
              </div>
            </div>

            {/* Bottom CTA Row */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 group-hover:text-slate-700 inline-flex items-center gap-1">
                Check Result
              </span>

              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-colors">
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
