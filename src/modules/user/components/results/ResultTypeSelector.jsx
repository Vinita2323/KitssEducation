import React from "react";
import { GraduationCap, Building2, ChevronRight } from "lucide-react";

export const ResultTypeSelector = ({
  selectedType,
  onSelectType,
  mode = "cards"
}) => {
  const options = [
    {
      id: "school",
      title: "Board Result",
      subtitle: "Class 10th & 12th (CBSE, ICSE & State Boards)",
      icon: GraduationCap,
      badge: "School",
      iconStyle: "bg-teal-50 text-teal-600 border-teal-200/70",
      badgeStyle: "bg-teal-50 text-teal-700",
    },
    {
      id: "university",
      title: "University Result",
      subtitle: "Degrees, Semesters & College Marksheets",
      icon: Building2,
      badge: "Colleges",
      iconStyle: "bg-orange-50 text-[#FF8A00] border-orange-200/70",
      badgeStyle: "bg-orange-50 text-orange-700",
    }
  ];

  if (mode === "tabs") {
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
          {options.map((opt) => {
            const isSelected = selectedType === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectType(opt.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0A1D3F] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#FF8A00]" : "text-slate-500"}`} />
                <span>{opt.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Compact Landing Cards View
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectType(opt.id)}
              className="flex items-center justify-between p-2 sm:p-2.5 rounded-lg bg-white border border-slate-200/90 hover:border-[#FF8A00] transition-all text-left group cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${opt.iconStyle}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors truncate">
                    {opt.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">
                    {opt.id === "school" ? "10th & 12th Examination" : "Colleges & Degrees"}
                  </p>
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF8A00] group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

