import React from 'react';
import { useDialogFocus } from '../../../../shared/ui/useDialogFocus';

export function FranchiseProfileModal({ institution, onClose }) {
  const ref = useDialogFocus(Boolean(institution), onClose);
  if (!institution) return null;
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
    <section ref={ref} role="dialog" aria-modal="true" aria-labelledby="franchise-profile-title" tabIndex={-1} className="bg-white rounded-xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-3 break-words" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start gap-4"><h2 id="franchise-profile-title" className="font-bold text-xl min-w-0">{institution.name}</h2><button type="button" onClick={onClose} className="border rounded-lg px-3 py-1 shrink-0">Close</button></div>
      <p className="text-sm text-emerald-700 font-semibold">KITSS Franchise</p><p>{institution.category}</p><p>{[institution.city, institution.state].filter(Boolean).join(', ')}</p>
      {institution.popularCourses?.length > 0 && <div><h3 className="font-semibold">Programs offered</h3><p>{institution.popularCourses.join(', ')}</p></div>}
      {/^https?:\/\//i.test(institution.website) && <a href={institution.website} target="_blank" rel="noopener noreferrer" className="block underline">Institution website</a>}
      <p className="text-sm text-slate-500">Online admission applications are not open for this institution.</p>
    </section>
  </div>;
}
