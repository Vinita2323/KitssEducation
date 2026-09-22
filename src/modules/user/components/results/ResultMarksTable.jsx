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
    <div className="overflow-hidden rounded-md border border-slate-200 shadow-2xs">
      {/* Scroll indicator banner for mobile */}
      <div className="block sm:hidden bg-slate-50 px-2.5 py-1 text-[9px] text-slate-500 font-medium border-b border-slate-200 text-right">
        👉 Swipe horizontally to view full marks table
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-[11px] text-left border-collapse min-w-[480px]">
          <thead>
            <tr className="bg-[#0A1D3F] text-white">
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px]">
                Code
              </th>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px]">
                Subject Name
              </th>
              {hasCredits && (
                <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                  Credits
                </th>
              )}
              {hasTheoryPractical && (
                <>
                  <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                    Theory
                  </th>
                  <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                    Practical
                  </th>
                </>
              )}
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                Max Marks
              </th>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                Marks Obtained
              </th>
              <th className="py-2 px-2.5 font-semibold uppercase tracking-wider text-[10px] text-center">
                Grade
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {subjects.map((sub, idx) => {
              const max = sub.maxMarks || sub.maxTotal || 100;
              const obtained = sub.obtained !== undefined ? sub.obtained : sub.total;
              const isFail = sub.isFail || false;

              return (
                <tr
                  key={sub.code || idx}
                  className={`transition-colors ${
                    isFail ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Code */}
                  <td className="py-1.5 px-2.5 font-mono text-slate-500 text-[10px]">
                    {sub.code || `0${idx + 1}`}
                  </td>

                  {/* Subject Name */}
                  <td className="py-1.5 px-2.5 font-medium text-slate-800 text-[11px]">
                    {sub.name}
                    {isFail && (
                      <span className="block text-[9px] font-medium text-red-600">
                        Compartment / Incomplete
                      </span>
                    )}
                  </td>

                  {/* Credits (University) */}
                  {hasCredits && (
                    <td className="py-1.5 px-2.5 text-center font-mono text-slate-700 text-[11px]">
                      {sub.credits || "-"}
                    </td>
                  )}

                  {/* Theory / Practical */}
                  {hasTheoryPractical && (
                    <>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-600">
                        {sub.theory !== undefined ? `${sub.theory}/${sub.maxTheory || 80}` : "-"}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-600">
                        {sub.practical !== undefined ? `${sub.practical}/${sub.maxPractical || 20}` : "-"}
                      </td>
                    </>
                  )}

                  {/* Max Marks */}
                  <td className="py-1.5 px-2.5 text-center font-mono text-[11px] text-slate-500">
                    {max}
                  </td>

                  {/* Obtained Marks */}
                  <td className="py-1.5 px-2.5 text-center font-mono font-semibold text-slate-900 text-[11px]">
                    <span className={isFail ? "text-red-600" : ""}>
                      {obtained}
                    </span>
                  </td>

                  {/* Grade */}
                  <td className="py-1.5 px-2.5 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded-sm font-semibold text-[10px] border ${getGradeBadge(
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
