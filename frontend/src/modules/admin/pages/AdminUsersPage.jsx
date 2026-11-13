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
    {tab === 'staff' && <p className="text-sm text-[#53647c]">Staff roles are changed on the Staff management page.</p>}
    <AccountDirectory key={tab} role={tab === 'staff' ? 'staff' : 'student'} emptyText={tab === 'staff' ? 'No staff accounts yet.' : 'No students have signed up yet.'} />
  </div>;
}
