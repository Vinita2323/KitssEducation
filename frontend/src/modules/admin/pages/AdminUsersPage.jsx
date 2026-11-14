import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminUI';
import { AccountDirectory } from '../components/AccountDirectory';
import { useAuth } from '../../user/context/AuthContext';

const tabs = [['students', 'Students'], ['staff', 'Staff']];

export function AdminUsersPage() {
  const { can } = useAuth(), [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'staff' ? 'staff' : 'students';
  return <div className="space-y-5 text-[#0A1D3F]">
    <AdminPageHeader title="User accounts" description="Find any student or staff account, see their activity, and suspend or restore access."
      actions={can('accounts.roles.manage') && <Link to="/admin/staff" className="admin-btn admin-btn-secondary">Invite staff</Link>} />
    <div className="admin-segmented" role="group" aria-label="Account type">{tabs.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setParams(key === 'students' ? {} : { tab: key }, { replace: true })}>{label}</button>)}</div>
    {tab === 'students' && <p className="text-sm text-[#53647c]">Search student accounts, open one to see its details and activity, and suspend or restore access with a reason.</p>}
    {tab === 'staff' && <p className="text-sm text-[#53647c]">Open a staff account to see its details or suspend and restore access. To invite team members or change job roles and permissions, go to <Link to="/admin/staff" className="underline font-semibold text-[#0A1D3F]">Staff management</Link>.</p>}
    <AccountDirectory key={tab} role={tab === 'staff' ? 'staff' : 'student'} emptyText={tab === 'staff' ? 'No staff accounts yet.' : 'No students have signed up yet.'} />
  </div>;
}
