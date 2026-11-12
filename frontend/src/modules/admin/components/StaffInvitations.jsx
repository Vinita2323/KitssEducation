import { AdminField, AdminInput } from './AdminFields';
import { PermissionSelector } from './PermissionSelector';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { authService } from '../../user/services/authService';

export function StaffInvitations({ target, onChanged }) {
  const { can, user } = useAuth();
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]), [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  // Reviewing a pending account prefills the form so the invitation can be resent or revoked.
  useEffect(() => { if (target) { setName(target.name); setEmail(target.email); setPermissions(target.permissions ?? []); setPending({ id: target.id, email: target.email }); setMessage(''); setError(''); } }, [target]);
  if (!can('accounts.roles.manage')) return null;
  const reset = () => { setName(''); setEmail(''); setPermissions([]); };
  async function submit(event) {
    event.preventDefault(); setMessage(''); setError('');
    if (!permissions.length) { setError('Choose at least one role so this person can do something after signing in.'); return; }
    setBusy(true);
    try { const result = await authService.invite({ name, email, permissions }); setPending({ id: result.id, email: email.trim().toLowerCase() }); setMessage(result.message); onChanged?.(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function revoke() {
    setBusy(true); setMessage(''); setError('');
    try { const result = await authService.revokeInvitation(pending.id); setMessage(result.message); setPending(null); reset(); onChanged?.(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section aria-label="Staff invitations" className="admin-card p-5 text-sm space-y-4">
    <div><h2 className="admin-card-title">Invite staff</h2>
      <p className="text-xs text-[#667085] mt-1">They get an email link to set a password and verify their email. You can resend an invitation after one minute.</p></div>
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminField help="" className="block">Staff name<AdminInput className="block w-full border p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></AdminField>
        <AdminField help="" className="block">Staff email<AdminInput type="email" className="block w-full border p-2 rounded-lg" value={email} onChange={e => setEmail(e.target.value)} required /></AdminField>
      </div>
      <PermissionSelector available={user.permissions} value={permissions} onChange={setPermissions} disabled={busy} />
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {pending && <p className="text-xs text-[#53647c] break-all">Invitation pending for {pending.email}.</p>}
      <div className="flex flex-wrap gap-3"><button disabled={busy} className="admin-btn admin-btn-primary">{pending && pending.email === email.trim().toLowerCase() ? 'Resend invitation' : 'Send invitation'}</button>
        {pending && <button type="button" disabled={busy} onClick={revoke} className="admin-btn admin-btn-danger">Revoke invitation</button>}</div>
    </form>
    {message && <p role="status">{message}</p>}
  </section>;
}
