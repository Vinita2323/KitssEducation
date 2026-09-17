import React from "react";
import { CheckCircle2, Building, Award, ShieldCheck, ChevronRight } from "lucide-react";

/**
 * BoardSelector
 * Renders the prominent "Which Board are you from?" step.
 * Keeps UI decoupled from boards mock/API data.
 */
export const BoardSelector = ({
  boards = [],
  selectedBoardId,
  onSelectBoard,
  resultType = "school"
}) => {
  const isSchool = resultType === "school";
  const title = isSchool ? "Which Board are you from?" : "Which University Board are you from?";
  const subtitle = isSchool
    ? "Select your secondary or senior secondary examination board to proceed."
    : "Select your degree university or technical board to proceed.";

  return (
    <div className="space-y-3">
      {/* Section Title */}
      <div className="space-y-0.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Step 1: Board Selection
        </span>
        <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-slate-500">
          {subtitle}
        </p>
      </div>

      {/* Board Options Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {boards.map((board) => {
          const isSelected = selectedBoardId === board.id;

          return (
            <div
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectBoard(board.id);
                }
              }}
              className={`group relative text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-150 cursor-pointer touch-target flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs"
                  : "bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-1.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white"
                      }`}
                    >
                      {board.code ? board.code.slice(0, 4) : "BD"}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-slate-700">
                          {board.name}
                        </span>
                        {board.tag && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {board.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                        {board.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pt-0.5">
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
                  {board.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                <span className={isSelected ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900"}>
                  {isSelected ? "Selected ✓" : "Select Board"}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? "text-slate-900 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
