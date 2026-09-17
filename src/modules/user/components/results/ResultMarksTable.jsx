import React from "react";

/**
 * ResultMarksTable
 * Responsive table displaying subject-wise marks breakdown.
 * Adapts to both School formats (Theory/Practical) and University formats (Credits/Grades).
 */
export const ResultMarksTable = ({ subjects = [] }) => {
  if (!subjects || subjects.length === 0) return null;

  // Check if any subject has theory/practical breakdown
  const hasTheoryPractical = subjects.some(
    (s) => s.theory !== undefined || s.practical !== undefined
  );
  const hasCredits = subjects.some((s) => s.credits !== undefined);

  const getGradeBadge = (grade = "", isFail = false) => {
    if (isFail || grade === "E" || grade === "F") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (grade.startsWith("A") || grade === "O" || grade === "1") {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (grade.startsWith("B") || grade === "2") {
      return "bg-blue-50 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6E8EC] shadow-2xs">
      {/* Scroll indicator banner for mobile */}
      <div className="block sm:hidden bg-[#F7F8FA] px-3 py-1 text-[10px] text-[#667085] font-semibold border-b border-[#E6E8EC] text-right">
        👉 Swipe horizontally to view full marks table
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-xs text-left border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-[#0A1D3F] text-white">
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                Code
              </th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                Subject Name
              </th>
              {hasCredits && (
                <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                  Credits
                </th>
              )}
              {hasTheoryPractical && (
                <>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                    Theory
                  </th>
                  <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                    Practical
                  </th>
                </>
              )}
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                Max Marks
              </th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                Marks Obtained
              </th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] text-center">
                Grade
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E6E8EC] bg-white">
            {subjects.map((sub, idx) => {
              const max = sub.maxMarks || sub.maxTotal || 100;
              const obtained = sub.obtained !== undefined ? sub.obtained : sub.total;
              const isFail = sub.isFail || false;

              return (
                <tr
                  key={sub.code || idx}
                  className={`transition-colors ${
                    isFail ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-[#F7F8FA]"
                  }`}
                >
                  {/* Code */}
                  <td className="p-3 font-mono font-bold text-[#667085] text-xs">
                    {sub.code || `0${idx + 1}`}
                  </td>

                  {/* Subject Name */}
                  <td className="p-3 font-bold text-[#0A1D3F] text-xs sm:text-sm">
                    {sub.name}
                    {isFail && (
                      <span className="block text-[10px] font-semibold text-red-600">
                        Compartment / Incomplete
                      </span>
                    )}
                  </td>

                  {/* Credits (University) */}
                  {hasCredits && (
                    <td className="p-3 text-center font-mono font-semibold text-[#0A1D3F] text-xs">
                      {sub.credits || "-"}
                    </td>
                  )}

                  {/* Theory / Practical */}
                  {hasTheoryPractical && (
                    <>
                      <td className="p-3 text-center font-mono text-xs text-[#475467]">
                        {sub.theory !== undefined ? `${sub.theory}/${sub.maxTheory || 80}` : "-"}
                      </td>
                      <td className="p-3 text-center font-mono text-xs text-[#475467]">
                        {sub.practical !== undefined ? `${sub.practical}/${sub.maxPractical || 20}` : "-"}
                      </td>
                    </>
                  )}

                  {/* Max Marks */}
                  <td className="p-3 text-center font-mono text-xs text-[#667085]">
                    {max}
                  </td>

                  {/* Obtained Marks */}
                  <td className="p-3 text-center font-mono font-extrabold text-[#0A1D3F] text-xs sm:text-sm">
                    <span className={isFail ? "text-red-600" : ""}>
                      {obtained}
                    </span>
                  </td>

                  {/* Grade */}
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${getGradeBadge(
                        sub.grade,
                        isFail
                      )}`}
                    >
                      {sub.grade || "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
