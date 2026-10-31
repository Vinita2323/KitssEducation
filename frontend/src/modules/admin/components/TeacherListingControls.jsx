import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaPicker } from './MediaPicker';
import { useAuth } from '../../user/context/AuthContext';
import { authenticatedWrite } from '../../user/services/authService';

export function TeacherListingControls({ application, onChange }) {
  const { can } = useAuth(), applicant = application.applicant || {};
  const [profile, setProfile] = useState(() => ({ name: applicant.fullName || '', role: applicant.title === 'Prof.' ? 'Professor' : 'Teacher', qualifications: (applicant.specializationNotes || '').slice(0, 1000), experience: (applicant.coachingExperience || '').slice(0, 1000), specialty: (applicant.coachingCourse || '').slice(0, 1000), portraitAssetId: null }));
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (application.kind !== 'teacher' || !['approved', 'activated'].includes(application.status)) return null;
  const publish = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try { onChange(await authenticatedWrite('/admin/registration-applications/' + application.id + '/teacher-profile', { expectedRevision: application.revision, profile })); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  return <section aria-label="KITSS teacher listing" className="border rounded-xl p-3 space-y-3"><h3 className="font-bold">KITSS teacher listing</h3>
    {application.teacherProfileId ? <><p>This applicant has been marked as a KITSS teacher.</p><p>In Coaching, select this teacher under Published instructors, then manage the course lessons, documents and videos.</p><Link to="/admin/content?tab=faculty" className="underline block">Manage faculty profile and publication</Link><Link to="/admin/coaching" className="underline block">Manage courses, teaching team and lesson uploads</Link><Link to="/about" className="underline block">View public faculty</Link></> : <>
      <p>Review the public details and choose a public portrait. Private application documents stay private.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {can('registrations.approve') && can('content.write') && can('content.publish') ? <form aria-label="Publish approved teacher" onSubmit={publish} className="space-y-3"><fieldset disabled={busy} className="space-y-3">
        {Object.entries({ name: 'Public teacher name', role: 'Public teaching role', qualifications: 'Public qualifications', experience: 'Public experience', specialty: 'Public subjects' }).map(([key, label]) => <label className="block" key={key}>{label}<input aria-label={label} className="block w-full border rounded-lg p-2" maxLength={key === 'name' || key === 'role' ? 160 : 1000} required={key === 'name' || key === 'role'} value={profile[key]} onChange={e => setProfile(value => ({ ...value, [key]: e.target.value }))} /></label>)}
        <MediaPicker purpose="faculty" label="Public teacher portrait" value={profile.portraitAssetId} onChange={portraitAssetId => setProfile(value => ({ ...value, portraitAssetId }))} />
        <button type="submit" disabled={!profile.portraitAssetId} className="bg-[#0A1D3F] text-white rounded-xl p-2 disabled:opacity-50">Mark as KITSS teacher and publish</button>
      </fieldset></form> : <p>An administrator with teacher approval and content publishing permissions can publish this profile.</p>}
    </>}
  </section>;
}
