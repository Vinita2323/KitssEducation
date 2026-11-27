import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { httpClient } from '../../../../shared/api/httpClient';
import { statusLabel } from '../../../../shared/ui/displayText';
import { useAuth } from '../../context/AuthContext';
const names = { franchise: 'Franchise', tuition: 'Tuition / Coaching', study: 'Study enquiry', teacher: 'Teacher / Professor', 'coaching-profile': 'Coaching profile' };
export function MyApplicationsPage() {
  const { user } = useAuth(), [page, setPage] = useState(1), [applications, setApplications] = useState([]), [franchises, setFranchises] = useState([]), [admissions, setAdmissions] = useState([]), [total, setTotal] = useState(0), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setApplications([]); setFranchises([]); setAdmissions([]);
    if (!user?.emailVerified) { setLoading(false); return () => controller.abort(); }
    Promise.all([
      httpClient.request('/me/registration-applications?page=' + page, { signal: controller.signal }),
      httpClient.request('/me/franchise-applications', { signal: controller.signal }),
      httpClient.request('/me/admission-applications?page=' + page, { signal: controller.signal }),
    ]).then(([a, f, adm]) => {
      if (!controller.signal.aborted) {
        setApplications(a.data.items);
        setTotal(Math.max(a.data.total ?? 0, adm.meta?.total ?? 0));
        setFranchises(f.data);
        setAdmissions(adm.data ?? []);
      }
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, user?.id, user?.emailVerified]);
  const admissionCard = (admission) => {
    const latestReason = [...(admission.statusHistory || [])].reverse().find(h => h.reason)?.reason;
    return <article key={admission.id} className="bg-white border rounded-2xl p-4 space-y-2 break-words">
      <h2 className="font-semibold">College admission enquiry</h2>
      <p className="text-sm font-medium text-[#0A1D3F]">{admission.programSnapshot?.collegeName || 'Partner college'}{admission.programSnapshot?.name ? ' · ' + admission.programSnapshot.name : ''}</p>
      <p className="text-sm">Reference: {admission.reference}</p>
      <p>Status: {statusLabel(admission.status)}</p>
      {latestReason && <p className="text-xs text-slate-600">{latestReason}</p>}
      <Link to="/colleges" className="inline-block text-orange-600 font-semibold">Browse colleges</Link>
    </article>;
  };
  const card = (application, franchise = false) => <article key={application.id} className="bg-white border rounded-2xl p-4 space-y-2 break-words"><h2 className="font-semibold">{names[franchise ? 'franchise' : application.kind]}</h2><p className="text-sm">Reference: {application.reference}</p><p>Status: {statusLabel(application.status)}</p>{franchise && <p>Affiliation: {statusLabel(application.affiliationState)}</p>}{!franchise && application.kind === 'study' && <p className="text-sm text-slate-600">KITSS handles further guidance and arrangements directly.</p>}{!franchise && application.teacherProfileId && <Link to="/about" className="block underline">View KITSS faculty</Link>}<Link className="inline-block text-orange-600 font-semibold" to={franchise ? '/register?type=franchise&draft=' + application.id : application.kind === 'coaching-profile' ? '/coaching/register?application=' + application.id : '/register?type=' + application.kind + '&application=' + application.id}>View application</Link>{!franchise && application.kind === 'tuition' && <Link to="/coaching" className="block underline">Browse coaching and enroll</Link>}</article>;
  return <section className="max-w-4xl mx-auto space-y-4"><h1 className="text-2xl font-bold">My applications</h1><Link to="/register" className="underline">Start a new application</Link>{!user?.emailVerified && <p>Please verify your account to view your applications. <Link to="/account/verify" className="underline">Verify email</Link></p>}{loading && <p role="status">Loading applications…</p>}{error && <p role="alert">{error}</p>}{!loading && user?.emailVerified && !error && !applications.length && !franchises.length && !admissions.length && <p>You have no applications yet.</p>}<div className="grid sm:grid-cols-2 gap-4">{admissions.map(admissionCard)}{franchises.map(row => card(row, true))}{applications.map(row => card(row))}</div>{total > 20 && <div className="flex gap-4"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page}</span><button disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</button></div>}</section>;
}
