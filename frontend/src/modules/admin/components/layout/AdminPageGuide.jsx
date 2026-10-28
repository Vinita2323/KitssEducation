import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';

const sections = {
  books: ['Learning', 'Manage your book library', 'Save book details as a draft, attach clean files, and review licensing and pricing before publishing.'],
  coaching: ['Learning', 'Build courses step by step', 'Start with the course, then add lessons and prepaid access plans. Review each draft before publishing.'],
  enrollments: ['Learning', 'Review learning access', 'Check how access was granted and whether it is still active. Payment history and access decisions are kept separate.'],
  results: ['Learning', 'Review academic records', 'Define issuers and exams, validate imports, then review records. Existing source and publication approvals still apply.'],
  taxonomies: ['Learning', 'Manage dropdown choices', 'Choose a section, then add or edit its options. Create boards before classes, classes before subjects, and states before districts. Archive options to keep existing references.'],
  universities: ['Institutions', 'Maintain the university directory', 'Check official names and references. Only records that meet the existing visibility rules appear to students.'],
  colleges: ['Institutions', 'Manage institutions and programs', 'Choose the parent university and location, then review the institution’s programs and verification evidence.'],
  applications: ['Admissions', 'Review admission applications', 'Read the application and supporting information, record clear notes, and follow the existing approval checks.'],
  registrations: ['Admissions', 'Review registration requests', 'Check the applicant, required documents, consent and applicable payment evidence before making a decision.'],
  'franchise-requests': ['Institutions', 'Review franchise requests', 'Check submitted information and approved requirements. Adding a note does not approve a franchise or its fees.'],
  orders: ['Payments', 'Understand each payment', 'Review provider-verified payments and fulfillment. Reconciliation checks evidence; it cannot mark an unpaid order as paid.'],
  refunds: ['Payments', 'Review refund requests', 'Check the request against the approved refund rules. A review decision does not replace provider confirmation.'],
  'access-requests': ['Learning access', 'Review exceptional access', 'Check the approved access policy and reason. An exception does not change the payment record.'],
  content: ['Publishing', 'Keep the student site up to date', 'Edit page sections, category cards, banners and faculty profiles as drafts. Preview details and evidence before publishing.'],
  media: ['Publishing', 'Manage files safely', 'Choose the correct file purpose, upload, then check the scan result. Only clean, ready files can be used.'],
  notifications: ['Communication', 'Send clear, useful updates', 'Write a short message, check the audience, and save a draft before publishing to the intended recipients.'],
  staff: ['Administration', 'Manage staff access', 'Invite staff, review pending accounts and manage permissions. Pending accounts may still need to accept their invitation or verify their email.'],
  users: ['Administration', 'Manage people and permissions', 'Find an account, review its details, and record a reason for changes. Grant staff only the permissions they need.'],
  settings: ['Administration', 'Configure approved platform rules', 'Review settings carefully before saving. Approval checkboxes must reflect real owner decisions, not intended future approval.'],
  'audit-logs': ['Administration', 'Trace administrative changes', 'Filter the activity history by person, action, record or date to understand what changed.'],
  operations: ['Administration', 'Monitor background work', 'Review queued or failed jobs and use the existing authorized retry actions when appropriate.'],
};

export function AdminPageGuide() {
  const { pathname } = useLocation();
  const section = pathname.split('/')[2];
  const [category, title, description] = sections[section] ?? ['Overview', 'Your administration workspace', 'Review verified summaries, check pending work, and use the sidebar to open the section you need.'];
  return <div className="admin-page-guide">
    <div className="admin-breadcrumb" aria-label="Page location"><Link to="/admin">Admin</Link><ChevronRight aria-hidden="true" size={14} /><span>{category}</span></div>
    <details className="admin-page-help">
      <summary><Info aria-hidden="true" size={16} />How to use this page</summary>
      <div><strong>{title}</strong><p>{description}</p></div>
    </details>
  </div>;
}
