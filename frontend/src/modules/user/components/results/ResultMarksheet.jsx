import React from 'react';
import { ResultActions } from './ResultActions';
import { ResultMarksTable } from './ResultMarksTable';
import { ResultSummary } from './ResultSummary';

export function ResultMarksheet({result,onBack,onNewSearch}) {
  if(!result)return null;
  const presentation={...result,board:result.issuer.name,rollNumber:result.rollNormalized,maxTotalMarks:result.totals.max,obtainedMarks:result.totals.obtained,percentage:result.totals.percentage,grade:result.totals.grade,status:result.totals.status,year:result.exam.year,cgpa:result.totals.cgpa};
  return <section className="space-y-3 min-w-0">
    <article id="printable-marksheet" className="printable-marksheet bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <header className="bg-[#0A1D3F] text-white p-4 text-center space-y-1"><h2 className="text-lg font-bold">{result.issuer.fullName}</h2><p className="text-orange-300 text-sm font-semibold">{result.exam.title}</p><p className="text-xs">{[result.exam.level,result.exam.year,result.exam.session].filter(Boolean).join(' / ')}</p></header>
      <div className="p-3 sm:p-4 space-y-4"><h3 className="font-bold text-sm text-center uppercase tracking-wide">Statement of Marks</h3><dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">{[['Student name',result.student.name],['Roll number',result.rollNormalized],['Institution',result.student.schoolName],['Enrollment number',result.student.enrollmentNumber],['Date issued',String(result.issueDate).slice(0,10)]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt className="text-slate-500">{label}</dt><dd className="font-semibold break-words">{value}</dd></div>)}</dl>
        <ResultMarksTable subjects={result.subjects}/><ResultSummary result={presentation}/>{result.totals.sgpa!==undefined&&<p className="text-sm">SGPA: {result.totals.sgpa}</p>}
        <p className="text-[10px] text-slate-500 border-t pt-2">Published by KITSS from institution-provided records. Contact your institution for the original certificate or any correction.</p>
      </div>
    </article><ResultActions result={presentation} onBack={onBack} onNewSearch={onNewSearch}/>
  </section>;
}
