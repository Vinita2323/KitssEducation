import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../services/authService';
export function RegistrationDraftControls({ kind, formData, setFormData }) {
  const { user, loading: authLoading } = useAuth(); const [params, setParams] = useSearchParams();
  const [saved, setSaved] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const idem = useRef(crypto.randomUUID()), identity = useRef(user?.id), previousIdentity = useRef(user?.id);
  const identityInitialized = useRef(false);
  identity.current = user?.id;
  useEffect(() => {
    const controller = new AbortController(), value = params.get('application');
    setSaved(null); setError('');
    if (authLoading) return () => controller.abort();
    if (identityInitialized.current && previousIdentity.current !== user?.id) { setFormData(f=>Object.fromEntries(Object.entries(f).map(([k,v])=>[k, typeof v === 'boolean' ? false : v === null ? null : '']))); idem.current=crypto.randomUUID(); }
    identityInitialized.current = true;
    previousIdentity.current=user?.id;
    if (user && value) httpClient.request('/registration-applications/' + encodeURIComponent(value) + '/status', { signal: controller.signal }).then(r => { if (controller.signal.aborted || r.data.kind !== kind) return; setSaved(r.data); setFormData(f => ({ ...f, ...r.data.applicant })); }).catch(e => { if (e.code !== 'ABORTED') setError(e.message); });
    return () => controller.abort();
  }, [user?.id, authLoading, kind]);
  const save = async () => {
    const actingIdentity = user?.id;
    setBusy(true); setError('');
    try {
      if (formData.aadharNumber) throw new Error('Identity numbers cannot be saved until the privacy policy is approved. Remove this number before saving a draft.');
      const applicant = Object.fromEntries(Object.entries(formData).filter(([name]) => !/File$|Preview$|^aadharNumber$/.test(name)));
      const data = saved ? await authenticatedWrite('/registration-applications/' + saved.id, { applicant, expectedRevision: saved.revision }, 'PATCH') : await authenticatedWrite('/registration-applications', { kind, applicant, idempotencyKey: idem.current });
      if (identity.current !== actingIdentity) return;
      setSaved(data); const next = new URLSearchParams(params); next.set('application', data.id); if (kind !== 'coaching-profile') next.set('type', kind); setParams(next, { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <aside className="m-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-[#0A1D3F]"><p>Registration submission and payment are unavailable pending document privacy, eligibility and activation policies. No paid rights or teacher permissions are granted.</p><p>Document slots are retained. Files and identity numbers are not collected or saved; required evidence remains outstanding.</p>{error && <p role="alert">{error}</p>}{saved && <p role="status">Draft saved: {saved.reference}. Payment: blocked. Keep this page URL to resume your draft.</p>}{user?.emailVerified ? <button type="button" disabled={busy} onClick={save} className="bg-[#0A1D3F] text-white px-3 py-2 rounded-lg">{busy ? 'Saving draft...' : saved ? 'Update Registration Draft' : 'Save Registration Draft'}</button> : <Link to="/login" className="underline">Sign in with a verified account to save a draft</Link>}</aside>;
}

export function useRegistrationFee(kind) {
  const [fee,setFee]=useState('Not configured');
  useEffect(()=>{const c=new AbortController();httpClient.request('/public/registration-config',{signal:c.signal}).then(r=>{const item=r.data.fees?.[kind];setFee(item?.approved ? (item.amountMinor/100).toFixed(2) : 'Not configured');}).catch(()=>{});return()=>c.abort();},[kind]);
  return fee;
}
