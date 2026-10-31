import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../user/context/AuthContext';
import { StaffInvitations } from '../components/StaffInvitations';
import { AdminUsersPage } from './AdminOperationsPage';
import { RefreshCw } from 'lucide-react';
import { AdminCard, AdminPageHeader } from '../components/AdminUI';

export function AdminStaffPage() {
  const { can } = useAuth();
  const [version, setVersion] = useState(0), [target, setTarget] = useState(null);
  const invitations = useRef(null);
  useEffect(() => {
    if (target) { invitations.current?.scrollIntoView({ block: 'start' }); invitations.current?.querySelector('input')?.focus(); }
  }, [target]);
  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="Staff management" description="Invite your team and control their admin access." />
    <div ref={invitations}><StaffInvitations target={target} onChanged={() => setVersion(v => v + 1)} /></div>
    {can('accounts.read') ? <AdminCard actions={<button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setVersion(v => v + 1)}><RefreshCw aria-hidden="true" size={14} />Refresh staff accounts</button>}>
      <AdminUsersPage staffOnly refreshVersion={version} onReviewInvitation={row => setTarget({ ...row })} />
    </AdminCard> : <p className="text-sm">Viewing staff accounts requires account-read permission.</p>}
  </div>;
}
