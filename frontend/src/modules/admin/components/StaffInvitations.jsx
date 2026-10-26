import { PermissionSelector } from './PermissionSelector';
import React, { useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { authService } from '../../user/services/authService';

export function StaffInvitations() {
  const { can, user } = useAuth();
  const [name, setName] = useState(''), [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState([]), [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  if (!can('accounts.roles.manage')) return null;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try { const result = await authService.invite({ name, email, permissions }); setReference(result.id); setMessage(result.message); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function revoke() {
    setBusy(true);
    try { const result = await authService.revokeInvitation(reference); setMessage(result.message); setReference(''); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  return <details className="mb-4 p-4 bg-white border border-[#E6E8EC] rounded-2xl text-sm">
    <summary className="font-bold cursor-pointer text-[#0A1D3F]">Staff invitations</summary>
    <p className="text-xs text-[#667085] my-3">Invite or resend to an unactivated staff account. Resending replaces the previous link after a 60-second cooldown. Staff must set a password and verify email.</p>
    <form onSubmit={submit} className="space-y-3">
      <label className="block">Staff name<input className="block w-full border p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
      <label className="block">Staff email<input type="email" className="block w-full border p-2 rounded-lg" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <PermissionSelector available={user.permissions} value={permissions} onChange={setPermissions} disabled={busy} />
      <button disabled={busy} className="px-4 py-2 rounded-lg bg-[#0A1D3F] text-white">Invite / resend</button>
    </form>
    {reference && <div className="mt-3"><label className="block">Pending invitation reference<input className="border p-2 rounded-lg w-full" value={reference} onChange={e => setReference(e.target.value)} /></label><button disabled={busy} onClick={revoke} className="text-red-700 p-2">Revoke invitation</button></div>}
    {message && <p role="status" className="mt-3">{message}</p>}
  </details>;
}
