import React from 'react';
export function Pagination({ meta, onChange, loading }) {
  if (!meta) return null;
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-[#667085]">
    <span>{meta.total} records · Page {meta.page} of {Math.max(1, meta.totalPages)}</span>
    <div className="flex gap-2"><button type="button" disabled={loading || meta.page <= 1} onClick={() => onChange(meta.page - 1)} className="border rounded-lg px-3 py-2 bg-white disabled:opacity-40">Previous</button><button type="button" disabled={loading || meta.page >= meta.totalPages} onClick={() => onChange(meta.page + 1)} className="border rounded-lg px-3 py-2 bg-white disabled:opacity-40">Next</button></div>
  </nav>;
}
