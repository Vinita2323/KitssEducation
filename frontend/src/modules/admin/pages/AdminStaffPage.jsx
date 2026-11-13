import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { StaffInvitations } from '../components/StaffInvitations';
import { AccountDirectory } from '../components/AccountDirectory';
import { AdminCard, AdminPageHeader } from '../components/AdminUI';

export function AdminStaffPage() {
  const { can } = useAuth();
  const [version, setVersion] = useState(0), [target, setTarget] = useState(null);
  const invitations = useRef(null);
  useEffect(() => {
    if (target) { invitations.current?.scrollIntoView({ block: 'start' }); invitations.current?.querySelector('input')?.focus(); }
  }, [target]);
  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="Staff management" description="Invite your team and give each person a job role." />
    <div ref={invitations}><StaffInvitations target={target} onChanged={() => setVersion(v => v + 1)} /></div>
    {can('accounts.read') ? <AdminCard title="Staff accounts" bodyClassName="space-y-3">
      <p className="text-sm text-[#53647c]">Open a person to change their role, suspend them, or resend a pending invitation. New staff appear here as Pending until they accept their invitation and verify their email.</p>
      <AccountDirectory role="admin" editRoles refreshVersion={version} onReviewInvitation={row => setTarget({ ...row })} emptyText="No staff yet. Invite someone above." />
    </AdminCard> : <p className="text-sm">Viewing staff accounts requires account-read permission.</p>}
  </div>;
}
