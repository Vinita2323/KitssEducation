import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Building2, ChevronDown, FileText, GraduationCap, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../user/context/AuthContext';

const groups = [
  { id: 'overview', label: 'Overview', items: [
    ['Dashboard', '/admin', LayoutDashboard, 'dashboard.read'],
  ] },
  { id: 'learning', label: 'Learning & results', items: [
    ['Digital Books', '/admin/books', BookOpen, 'books.read'],
    ['Coaching', '/admin/coaching', GraduationCap, 'coaching.read'],
    ['Enrollments', '/admin/enrollments', BookOpen, 'learning.read'],
    ['Results', '/admin/results', FileText, 'results.read'],
    ['Dropdown settings', '/admin/taxonomies', GraduationCap, 'content.read'],
  ] },
  { id: 'institutions', label: 'Institutions & admissions', items: [
    ['Universities', '/admin/universities', GraduationCap, 'institutions.read'],
    ['Colleges / Institutes', '/admin/colleges', Building2, 'institutions.read'],
    ['Admission Applications', '/admin/applications', FileText, 'admissions.read'],
    ['Registration drafts', '/admin/registrations', FileText, 'registrations.read'],
    ['Franchise Requests', '/admin/franchise-requests', ShieldCheck, 'franchises.read'],
  ] },
  { id: 'commerce', label: 'Payments & access', items: [
    ['Orders / Payments', '/admin/orders', BookOpen, 'commerce.read'],
    ['Refund review', '/admin/refunds', FileText, 'refunds.read'],
    ['Exceptional access', '/admin/access-requests', ShieldCheck, 'access.read'],
  ] },
  { id: 'publishing', label: 'Content & communication', items: [
    ['Content', '/admin/content', FileText, 'content.read'],
    ['Media', '/admin/media', BookOpen, 'media.read'],
    ['Notifications', '/admin/notifications', FileText, 'notifications.read'],
  ] },
  { id: 'administration', label: 'Administration', items: [
    ['Staff management', '/admin/staff', ShieldCheck, 'accounts.roles.manage'],
    ['User accounts', '/admin/users', ShieldCheck, 'accounts.read'],
    ['Site settings', '/admin/settings', ShieldCheck, 'settings.read'],
    ['Audit logs', '/admin/audit-logs', FileText, 'audit.read'],
    ['Job monitoring', '/admin/operations', FileText, 'operations.read'],
  ] },
];

const matches = (pathname, path) => pathname === path || (path !== '/admin' && pathname.startsWith(path + '/'));

export function AdminNavigation({ mobile = false, onNavigate }) {
  const { can } = useAuth();
  const { pathname } = useLocation();
  const activeGroup = groups.find(group => group.items.some(([, path]) => matches(pathname, path)))?.id;
  const [expanded, setExpanded] = useState(() => new Set([activeGroup ?? 'overview']));
  useEffect(() => {
    if (activeGroup) setExpanded(previous => new Set([...previous, activeGroup]));
  }, [activeGroup, pathname]);

  return <nav aria-label={mobile ? 'Mobile admin sections' : 'Admin sections'} className="space-y-2">
    {groups.map(group => {
      const items = group.items.filter(([, , , permission]) => can(permission));
      if (!items.length) return null;
      const open = expanded.has(group.id);
      const id = `admin-${mobile ? 'mobile' : 'desktop'}-${group.id}`;
      return <section key={group.id}>
        <button type="button" aria-expanded={open} aria-controls={id}
          onClick={() => setExpanded(previous => {
            const next = new Set(previous);
            if (next.has(group.id)) next.delete(group.id); else next.add(group.id);
            return next;
          })}
          className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left font-semibold transition ${activeGroup === group.id ? 'bg-blue-50 text-[#0A1D3F]' : 'text-[#475569] hover:bg-gray-50'}`}>
          <span>{group.label}</span>
          <ChevronDown aria-hidden="true" className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <ul id={id} hidden={!open} className="mt-1 ml-3 space-y-1 border-l border-[#E6E8EC] pl-2">
          {items.map(([label, path, Icon]) => {
            const active = matches(pathname, path);
            return <li key={path}><Link to={path} aria-current={active ? 'page' : undefined} onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 font-medium transition ${active ? 'bg-[#0A1D3F] text-white' : 'text-[#475569] hover:bg-gray-50 hover:text-[#0A1D3F]'}`}>
              <Icon aria-hidden="true" className="w-4 h-4 shrink-0" /><span>{label}</span>
            </Link></li>;
          })}
        </ul>
      </section>;
    })}
  </nav>;
}
