import React from "react";
import { GraduationCap, Building2, ArrowRight, Check } from "lucide-react";

/**
 * ResultTypeSelector
 * Supports two presentation modes:
 * 1. 'cards' - Compact, themed action cards for Landing screen
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
      title: "Board Result",
      description: "Class 10th & 12th state and national board marksheets.",
      badge: "Class 10th & 12th",
      icon: GraduationCap,
      iconBg: "bg-teal-50 text-teal-600 border border-teal-200/70",
      badgeStyle: "bg-teal-50 text-teal-700 border border-teal-200/60",
      hoverBorder: "hover:border-teal-300",
      ctaBg: "bg-teal-600 group-hover:bg-teal-700"
    },
    {
      id: "university",
      title: "University Result",
      description: "Colleges, autonomous institutes & semester transcripts.",
      badge: "Colleges & Institutes",
      icon: Building2,
      iconBg: "bg-orange-50 text-[#FF8A00] border border-orange-200/70",
      badgeStyle: "bg-orange-50 text-orange-700 border border-orange-200/60",
      hoverBorder: "hover:border-orange-300",
      ctaBg: "bg-[#FF8A00] group-hover:bg-[#E67A00]"
    }
  ];

  if (mode === "tabs") {
    return (
      <div className="w-full">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Select Result Type
        </label>
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
          {options.map((opt) => {
            const isSelected = selectedType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectType(opt.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all touch-target cursor-pointer ${
                  isSelected
                    ? "bg-[#0A1D3F] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? "text-[#FF8A00]" : "text-slate-500"
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

  // Hero Cards View (Landing Screen) - Compacted & On-Brand
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
      {options.map((opt) => {
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
            className={`group relative text-left bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] flex flex-col justify-between gap-2.5 ${opt.hoverBorder}`}
          >
            <div className="space-y-2">
              {/* Top Row: Themed Icon & Badge */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${opt.iconBg} group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeStyle}`}
                >
                  {opt.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors tracking-tight">
                  {opt.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                  {opt.description}
                </p>
              </div>
            </div>

            {/* Bottom CTA Row (Compact & Themed) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors inline-flex items-center gap-1">
                Check Result
              </span>

              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:translate-x-0.5 shadow-2xs ${opt.ctaBg}`}
              >
                <ArrowRight className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

