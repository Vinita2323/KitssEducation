import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminUI';
import { httpClient } from '../../../shared/api/httpClient';
import { authenticatedWrite } from '../../user/services/authService';
import { useAuth } from '../../user/context/AuthContext';
import { GeneralSettings } from '../components/settings/GeneralSettings';
import { RegistrationSettings } from '../components/settings/RegistrationSettings';
import { FranchiseSettings } from '../components/settings/FranchiseSettings';
import { PaymentSettings } from '../components/settings/PaymentSettings';

const tabs = [['general', 'General'], ['registrations', 'Registrations'], ['franchise', 'Franchise'], ['payments', 'Payments & billing']];
// Parts of the shared policy record that the Registrations and Payments tabs save.
const policyParts = ['registrations', 'manualAccess', 'invoice', 'refunds', 'franchise'];

export function AdminSiteSettingsPage() {
  const { user, can } = useAuth(), [params, setParams] = useSearchParams();
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'general';
  const [business, setBusiness] = useState(null), [franchise, setFranchise] = useState(null), [error, setError] = useState('');
  const locked = !user?.roles?.includes('super_admin') || !can('settings.write');

  // Franchise rules and business rules live in one record with one revision, so each save refreshes both.
  const load = useCallback(async signal => {
    const [b, f] = await Promise.all([httpClient.request('/admin/business-policies', { signal }), httpClient.request('/admin/franchise-policy', { signal })]);
    if (!signal?.aborted) { setBusiness(b.data); setFranchise(f.data); setError(''); }
  }, []);
  useEffect(() => { const c = new AbortController(); load(c.signal).catch(e => { if (!c.signal.aborted) setError(e.message); }); return () => c.abort(); }, [load]);

  const saveBusiness = async (part, reason) => {
    const value = Object.fromEntries(policyParts.filter(k => business.value?.[k] !== undefined).map(k => [k, business.value[k]]));
    const saved = await authenticatedWrite('/admin/business-policies', { value: { ...value, ...part }, expectedRevision: business.revision, reason }, 'PATCH');
    setBusiness(saved);
    // The save already succeeded; a failed refresh only means the next save asks for a reload.
    await httpClient.request('/admin/franchise-policy').then(r => setFranchise(r.data), () => {});
  };
  const franchiseChanged = async record => { setFranchise(record); await httpClient.request('/admin/business-policies').then(r => setBusiness(r.data), () => {}); };

  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="Site Settings" description="Your public details, registration and franchise rules, and payment settings." />
    <div className="admin-segmented" role="group" aria-label="Settings sections">{tabs.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setParams(key === 'general' ? {} : { tab: key }, { replace: true })}>{label}</button>)}</div>
    <div className="text-xs text-[#53647c]">
      {tab === 'general' && 'Public contact details and the footer shown on every page.'}
      {tab === 'registrations' && <>Registration fee amounts and open/close controls. Submitted applicant dossiers are reviewed in <Link to="/admin/registrations" className="underline font-semibold text-[#0A1D3F]">Registrations</Link>.</>}
      {tab === 'franchise' && <>Franchise eligibility criteria, deposits, and terms. Submitted partner applications are processed in <Link to="/admin/franchise-requests" className="underline font-semibold text-[#0A1D3F]">Franchise Requests</Link>.</>}
      {tab === 'payments' && <>Refund rules, receipt details and access exceptions. Student payments are tracked in <Link to="/admin/orders" className="underline font-semibold text-[#0A1D3F]">Orders / Payments</Link>.</>}
    </div>
    {error && <p role="alert" className="text-red-700">{error} <button type="button" className="underline" onClick={() => load().catch(e => setError(e.message))}>Try again</button></p>}
    {/* Tabs stay mounted so unsaved edits survive switching between them. */}
    <section hidden={tab !== 'general'} aria-label="General settings"><GeneralSettings canWrite={can('settings.write')} /></section>
    {business && franchise ? <>
      <section hidden={tab !== 'registrations'} aria-label="Registration settings"><RegistrationSettings record={business} locked={locked} save={saveBusiness} /></section>
      <section hidden={tab !== 'franchise'} aria-label="Franchise settings"><FranchiseSettings record={franchise} locked={locked} onChanged={franchiseChanged} /></section>
      <section hidden={tab !== 'payments'} aria-label="Payment settings"><PaymentSettings record={business} locked={locked} save={saveBusiness} /></section>
    </> : tab !== 'general' && !error && <p role="status">Loading settings…</p>}
  </div>;
}
