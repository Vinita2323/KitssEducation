import { RegistrationSubmission } from './RegistrationSubmission';
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { httpClient } from '../../../../shared/api/httpClient';
import { authenticatedWrite } from '../../services/authService';
import { contentService } from '../../services/contentService';
export function RegistrationDraftControls({ kind, formData, setFormData, showSubmission = true, onStatusChange, onApplicationChange, uploadSelected = false, beforeSubmit }) {
  const { user, loading: authLoading } = useAuth(); const [params, setParams] = useSearchParams();
  const [saved, setSaved] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const idem = useRef(crypto.randomUUID()), identity = useRef(user?.id), previousIdentity = useRef(user?.id);
  const identityInitialized = useRef(false);
  const generation = useRef(0), pending = useRef({});
  useEffect(() => () => { generation.current++; }, []);
  identity.current = user?.id;
  useEffect(() => { onStatusChange?.(saved?.status); }, [saved?.status, onStatusChange]);
  useEffect(() => { onApplicationChange?.(saved); }, [saved, onApplicationChange]);
  useEffect(() => {
    const controller = new AbortController(), value = params.get('application');
    setSaved(null); setError(''); pending.current = {};
    if (authLoading) return () => controller.abort();
    if (identityInitialized.current && previousIdentity.current && previousIdentity.current !== user?.id) { setFormData(f=>Object.fromEntries(Object.entries(f).map(([k,v])=>[k, typeof v === 'boolean' ? false : v === null ? null : '']))); idem.current=crypto.randomUUID(); }
    identityInitialized.current = true;
    previousIdentity.current=user?.id;
    if (user && value) httpClient.request('/registration-applications/' + encodeURIComponent(value) + '/status', { signal: controller.signal }).then(r => { if (controller.signal.aborted || r.data.kind !== kind) return; setSaved(r.data); setFormData(f => ({ ...f, ...r.data.applicant })); }).catch(e => { if (e.code !== 'ABORTED') setError(e.message); });
    return () => controller.abort();
  }, [user?.id, authLoading, kind]);
  const save = async () => {
    const actingIdentity = user?.id;
    const ticket = generation.current;
    const current = () => ticket === generation.current && identity.current === actingIdentity;
    setBusy(true); setError('');
    try {
      if (formData.aadharNumber) throw new Error('Identity numbers cannot be saved until the privacy policy is approved. Remove this number before saving a draft.');
      const applicant = Object.fromEntries(Object.entries(formData).filter(([name]) => !/File$|Preview$|^aadharNumber$/.test(name)));
      let data = saved ? await authenticatedWrite('/registration-applications/' + saved.id, { applicant, expectedRevision: saved.revision }, 'PATCH') : await authenticatedWrite('/registration-applications', { kind, applicant, idempotencyKey: idem.current });
      if (!current()) return;
      setSaved(data); setFormData(current=>Object.fromEntries(Object.entries(current).map(([key,value])=>[key,value===formData[key] && key in data.applicant ? data.applicant[key] : value]))); const next = new URLSearchParams(params); next.set('application', data.id); if (kind !== 'coaching-profile') next.set('type', kind); setParams(next, { replace: true });
      if (uploadSelected) {
        const config = (await httpClient.request('/public/registration-config')).data;
        if (!current()) return;
        for (const d of config.enabled?.[kind] ? config.policies[kind].documents : []) {
          const file = formData[d.key + 'File'];
          if (!file) continue;
          const cached = pending.current[d.key];
          let asset = cached?.file === file ? (await httpClient.request('/media/' + cached.asset.id + '/metadata')).data : await contentService.upload(file, 'registration_document');
          if (!current()) return;
          pending.current[d.key] = { file, asset };
          if (asset.status !== 'ready') throw new Error(d.label + ' is awaiting a security check. Save again to check and attach it.');
          data = await authenticatedWrite('/registration-applications/' + data.id + '/documents', { expectedRevision: data.revision, key: d.key, assetId: asset.id });
          if (!current()) return;
          setSaved(data); delete pending.current[d.key];
          setFormData(v => v[d.key + 'File'] === file ? { ...v, [d.key + 'File']: null, [d.key + 'Preview']: null } : v);
        }
      }
    } catch (e) { if (current()) setError(e.message); } finally { if (current()) setBusy(false); }
  };
  const selectedDocuments = uploadSelected && Object.entries(formData).some(([key,value])=>key.endsWith('File') && value instanceof File);
  const dirty = saved && (selectedDocuments || Object.entries(formData).filter(([key]) => !/File$|Preview$|^aadharNumber$/.test(key)).some(([key, value]) => value !== (saved.applicant?.[key] ?? (typeof value === 'boolean' ? false : ''))));
  return <aside className={showSubmission ? "p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm space-y-3" : "text-sm space-y-3"}>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {saved && <p role="status">Application reference: {saved.reference}. <Link className="underline" to="/my-applications">My applications</Link></p>}
    {user?.emailVerified ? <button type="button" disabled={busy || saved && !['draft','needs_changes'].includes(saved.status)} onClick={save} className="bg-[#0A1D3F] text-white px-3 py-2 rounded-lg disabled:opacity-50">{busy ? 'Saving...' : saved ? 'Save changes' : 'Save application draft'}</button> : <p>Verify your email and sign in here before saving your application.</p>}
    {showSubmission && (saved ? busy ? <p role="status">Saving your application and documents...</p> : dirty && ['draft','needs_changes'].includes(saved.status) ? <p>Save your changes before uploading documents or submitting.</p> : <RegistrationSubmission key={saved.id} application={saved} onChange={setSaved} beforeSubmit={beforeSubmit} /> : <p>Save your details to see document requirements and submit.</p>)}
  </aside>;
}

export function useRegistrationFee(kind) {
  const [fee,setFee]=useState('Not configured');
  useEffect(()=>{const c=new AbortController();httpClient.request('/public/registration-config',{signal:c.signal}).then(r=>{const item=r.data.fees?.[kind];setFee(item?.approved ? (item.amountMinor/100).toFixed(2) : 'Not configured');}).catch(()=>{});return()=>c.abort();},[kind]);
  return fee;
}
