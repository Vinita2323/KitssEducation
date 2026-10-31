import { AdminField, AdminInput } from './AdminFields';
import { PermissionSelector } from './PermissionSelector';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { authService } from '../../user/services/authService';

export function StaffInvitations({ target, onChanged }) {
  const { can, user } = useAuth();
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]), [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { if (target) { setName(target.name); setEmail(target.email); setPermissions(target.permissions ?? []); setReference(target.id); setMessage(''); } }, [target]);
  if (!can('accounts.roles.manage')) return null;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { const result = await authService.invite({ name, email, permissions }); setReference(result.id); setMessage(result.message); onChanged?.(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function revoke() {
    setBusy(true);
    try { const result = await authService.revokeInvitation(reference); setMessage(result.message); setReference(''); onChanged?.(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <section aria-label="Staff invitations" className="admin-card p-5 text-sm">
    <h2 className="admin-card-title">Staff invitations</h2>
    <p className="text-xs text-[#667085] my-3">Invite or resend to an unactivated staff account. Resending replaces the previous link after a 60-second cooldown. Staff must set a password and verify email.</p>
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <AdminField className="block">Staff name<AdminInput className="block w-full border p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></AdminField>
      <AdminField className="block">Staff email<AdminInput type="email" className="block w-full border p-2 rounded-lg" value={email} onChange={e => setEmail(e.target.value)} required /></AdminField>
      <div className="sm:col-span-2"><PermissionSelector available={user.permissions} value={permissions} onChange={setPermissions} disabled={busy} /></div>
      <div className="sm:col-span-2"><button disabled={busy} className="admin-btn admin-btn-primary">Invite / resend</button></div>
    </form>
    {reference && <div className="mt-3"><AdminField className="block">Pending invitation reference<AdminInput className="border p-2 rounded-lg w-full" value={reference} onChange={e => setReference(e.target.value)} /></AdminField><button disabled={busy} onClick={revoke} className="text-red-700 p-2">Revoke invitation</button></div>}
    {message && <p role="status" className="mt-3">{message}</p>}
  </section>;
}
