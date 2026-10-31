import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readOptions } from '../../user/services/collegeService';
import { authenticatedWrite } from '../../user/services/authService';

export function FranchiseListingControls({ application, reason, allowed, busy, onBusy, onChange, onError }) {
  const [colleges, setColleges] = useState([]), [selected, setSelected] = useState(application.collegeListingId || ''), [loadError, setLoadError] = useState('');
  useEffect(() => { setSelected(application.collegeListingId || ''); }, [application.id, application.collegeListingId]);
  useEffect(() => { const c = new AbortController(); readOptions('/colleges', {}, c.signal).then(rows => { if (!c.signal.aborted) setColleges(rows); }).catch(e => { if (!c.signal.aborted) setLoadError(e.message); }); return () => c.abort(); }, []);
  const published = Boolean(application.listingPublishedAt && !application.listingHidden);
  const save = async publish => {
    onBusy(true);
    try { onChange(await authenticatedWrite('/admin/franchise-applications/' + application.id + '/listing', { expectedRevision: application.revision, publish, reason: reason.trim(), collegeListingId: selected || null })); }
    catch (e) { onError(e.message); } finally { onBusy(false); }
  };
  return <section aria-label="Public franchise listing" className="border rounded-xl p-3 space-y-2">
    <h3 className="font-bold">Public institution listing</h3><p>{published ? 'Shown in Colleges & Institutes with a KITSS Franchise badge.' : 'Franchise profile and badge are hidden from Colleges & Institutes.'}</p>
    <Link to="/colleges?network=franchise" className="underline block">View Colleges & Institutes</Link>
    <p className="text-xs">Private contacts and documents stay private. Admission availability is managed through the college’s published programs.</p>
    <label className="block text-sm">Existing institution listing<select aria-label="Existing institution listing" className="block border rounded-lg p-2 w-full" disabled={!allowed || busy || Boolean(loadError)} value={selected} onChange={e => setSelected(e.target.value)}>
      <option value="">Use this franchise’s own profile</option>{selected && !colleges.some(c => c.id === selected) && <option value={selected}>Previously linked institution (not published)</option>}
      {colleges.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}
    </select></label><p className="text-xs">Select an existing listing only when it represents this same institution. Its university affiliation may refer to a different institution.</p>
    {loadError && <p role="alert">{loadError}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className="border rounded-lg p-2" disabled={busy || !allowed || !reason.trim() || selected === (application.collegeListingId || '')} onClick={() => save(published)}>Save listing association</button>
      <button type="button" className="border rounded-lg p-2" disabled={busy || !allowed || !reason.trim()} onClick={() => save(!published)}>{published ? 'Hide public listing' : 'Publish franchise listing'}</button></div>
    <p className="text-xs">Enter a review note below before saving changes.</p>
  </section>;
}
