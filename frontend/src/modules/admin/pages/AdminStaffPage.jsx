import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { StaffInvitations } from '../components/StaffInvitations';
import { AdminUsersPage } from './AdminOperationsPage';

export function AdminStaffPage() {
  const { can } = useAuth();
  const [version, setVersion] = useState(0), [target, setTarget] = useState(null);
  const invitations = useRef(null);
  useEffect(() => {
    if (target) { invitations.current?.scrollIntoView({ block: 'start' }); invitations.current?.querySelector('input')?.focus(); }
  }, [target]);
  return <div className="space-y-5">
    <header className="rounded-2xl border bg-white p-5"><h1 className="text-xl font-bold">Staff management</h1><p className="text-sm text-slate-600">Invite your team and control their admin access.</p></header>
    <div ref={invitations}><StaffInvitations target={target} onChanged={() => setVersion(v => v + 1)} /></div>
    {can('accounts.read') ? <>
      <button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={() => setVersion(v => v + 1)}>Refresh staff accounts</button>
      <AdminUsersPage staffOnly refreshVersion={version} onReviewInvitation={row => setTarget({ ...row })} />
    </> : <p className="text-sm">Viewing staff accounts requires account-read permission.</p>}
  </div>;
}
