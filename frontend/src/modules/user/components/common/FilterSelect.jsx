import React from "react";
import { SearchableSelect } from "./SearchableSelect";

const activeTones = {
  navy: "bg-[#0A1D3F] text-white border-[#0A1D3F]",
  orange: "bg-[#FF8A00] text-white border-[#FF8A00]",
};

// A filter dropdown that always opens below its field, with a short scrolling list and a search box for long lists.
// A plain <select> lets the browser open long lists (such as all 36 states) upward over the page.
// The field is coloured (tone) once something other than "All" is chosen.
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  tone = "navy",
  allValue = "All",
  searchPlaceholder = "Type to search...",
  triggerSize = "py-2.5 rounded-xl",
  plain = false,
}) {
  const active = !plain && value !== allValue;
  return (
    <SearchableSelect
      ariaLabel={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={options[0]?.label ?? "All"}
      searchable={options.length > 8}
      searchPlaceholder={searchPlaceholder}
      forceOpenDirection="down"
      triggerClassName={`pl-3 pr-2.5 ${triggerSize} font-bold ${
        active ? activeTones[tone] : "bg-[#F7F8FA] text-[#0A1D3F] border-[#E6E8EC] hover:border-gray-300"
      }`}
      valueClassName={active ? "text-white font-bold" : "text-[#0A1D3F] font-bold"}
      chevronClassName={active ? "text-white" : "text-[#667085]"}
    />
  );
}
