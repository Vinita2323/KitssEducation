import React from 'react';
import { ResultActions } from './ResultActions';
export function ResultMarksheet({
  result,
  onBack,
  onNewSearch
}) {
  if (!result) return null;
  return <section className="space-y-3">
    <article id="printable-marksheet" className="printable-marksheet bg-white border rounded-xl p-4 sm:p-8 space-y-5 text-[#0A1D3F]">
      <header className="text-center border-b pb-4"><h2 className="font-bold text-lg">{result.issuer.fullName}</h2><p>{result.exam.title}</p><p>{result.exam.year} / {result.exam.session}</p><p className="text-xs">{result.verificationLabel}</p></header>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div><dt>Candidate</dt><dd className="font-bold">{result.student.name}</dd></div><div><dt>Roll number</dt><dd>{result.rollNormalized}</dd></div>{result.student.schoolName && <div><dt>Institution</dt><dd>{result.student.schoolName}</dd></div>}<div><dt>Issued</dt><dd>{String(result.issueDate).slice(0, 10)}</dd></div></dl>
      <div className="overflow-x-auto"><table className="w-full text-xs sm:text-sm text-left"><thead><tr><th className="p-2">Subject</th><th>Maximum</th><th>Obtained</th><th>Source grade</th></tr></thead><tbody>{result.subjects.map(s => <tr key={s.code} className="border-t"><td className="p-2">{s.code} - {s.name}</td><td>{s.maxMarks}</td><td>{s.obtained}</td><td>{s.grade ?? '-'}</td></tr>)}</tbody></table></div>
      <div className="border-t pt-4 text-sm"><p>Total: {result.totals.obtained} / {result.totals.max}</p><p>Percentage: {result.totals.percentage}%</p><p>Status: {result.totals.status}</p>{result.totals.grade && <p>Grade: {result.totals.grade}</p>}{['sgpa', 'cgpa'].map(k => result.totals[k] !== undefined && <p key={k}>{k.toUpperCase()}: {result.totals[k]}</p>)}</div>
      <p className="text-xs text-slate-500">Stored record {result.id}, revision {result.revision}. This presentation does not assert an issuer digital signature or replace an original issuer document.</p>
    </article>
    <ResultActions result={{
      ...result,
      board: result.issuer.name,
      rollNumber: result.rollNormalized
    }} onBack={onBack} onNewSearch={onNewSearch} />
  </section>;
}
