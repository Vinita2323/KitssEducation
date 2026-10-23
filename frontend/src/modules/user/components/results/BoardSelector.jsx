import React from "react";
import { ChevronRight, Building2 } from "lucide-react";
import {
  SearchableSelect,
  isCustomSelectValue,
  getCustomSelectLabel,
} from "../common/SearchableSelect";

export const BoardSelector = ({
  boards = [],
  selectedBoardId,
  onSelectBoard,
  resultType = "school"
}) => {
  const titleByType = {
    school: "Select Board",
    university: "Select University",
    institute: "Select Institute / School",
  };
  const title = titleByType[resultType] || "Select Option";
  const useDropdown = resultType === "institute";

  if (useDropdown) {
    const listedBoards = boards.filter((board) => board.id !== "OTHER_INSTITUTE");
    const instituteOptions = listedBoards.map((board) => ({
      value: board.id,
      label: board.name,
    }));

    return (
      <div className="bg-white rounded-lg border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-3 overflow-visible">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
            {title}
          </h2>
          <span className="text-[10px] font-semibold text-slate-400">
            {listedBoards.length}+ Franchise Partners
          </span>
        </div>

        <div className="space-y-1.5 relative z-20">
          <label className="block text-xs font-semibold text-slate-700">
            Institute / School <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={instituteOptions}
            value={selectedBoardId || ""}
            onChange={(value) => {
              if (!value) return;
              if (isCustomSelectValue(value)) {
                const customName = getCustomSelectLabel(value);
                onSelectBoard("OTHER_INSTITUTE", { schoolName: customName });
                return;
              }
              onSelectBoard(value);
            }}
            placeholder="Choose or type your institute / school"
            searchPlaceholder="Search or type institute name"
            searchable
            allowCustom
            forceOpenDirection="down"
            icon={Building2}
          />
          <p className="text-[10px] text-slate-400 pt-0.5">
            Select from the list, or type your institute name if it is not listed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
        <h2 className="text-xs sm:text-sm font-bold text-[#0A1D3F]">
          {title}
        </h2>
        <span className="text-[10px] font-semibold text-slate-400">
          {boards.length} Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
        {boards.map((board) => {
          const isSelected = selectedBoardId === board.id;
          return (
            <button
              key={board.id}
              type="button"
              onClick={() => onSelectBoard(board.id)}
              className={`w-full flex items-center justify-between p-2 sm:p-2.5 rounded-lg border transition-all text-left cursor-pointer group shadow-2xs ${
                isSelected
                  ? "bg-orange-50/60 border-[#FF8A00] ring-1 ring-[#FF8A00]"
                  : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#0A1D3F] text-[#FF8A00]"
                      : "bg-slate-100 text-slate-700 group-hover:bg-[#0A1D3F] group-hover:text-white"
                  }`}
                >
                  {board.code ? board.code.slice(0, 5) : "BD"}
                </span>

                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#0A1D3F] group-hover:text-[#FF8A00] transition-colors truncate block">
                    {board.name}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate">
                    {board.fullName || board.name}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform ${
                  isSelected
                    ? "text-[#FF8A00] translate-x-0.5"
                    : "text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
