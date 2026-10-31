import React, { forwardRef } from 'react';
import { statusLabel } from '../../../shared/ui/displayText';

// Presentation-only building blocks for admin pages. They never change labels,
// roles or accessible names that pages pass in, so behaviour and tests stay stable.

export function AdminPageHeader({ title, description, actions, children, className = '' }) {
  return <header className={'admin-page-header ' + className}>
    <div className="admin-page-header-text">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
    {actions && <div className="admin-page-header-actions">{actions}</div>}
  </header>;
}

export const AdminCard = forwardRef(function AdminCard({ as: Tag = 'section', title, titleAs: Heading = 'h2', actions, className = '', bodyClassName = '', children, ...props }, ref) {
  return <Tag ref={ref} className={'admin-card ' + className} {...props}>
    {(title || actions) && <div className="admin-card-header">
      {title && <Heading className="admin-card-title">{title}</Heading>}
      {actions && <div className="admin-card-actions">{actions}</div>}
    </div>}
    <div className={'admin-card-body ' + bodyClassName}>{children}</div>
  </Tag>;
});

export function AdminToolbar({ children, className = '', ...props }) {
  return <div className={'admin-toolbar ' + className} {...props}>{children}</div>;
}

// Tables inside this wrapper become stacked cards on narrow screens.
export function AdminTable({ children, className = '', ...props }) {
  return <div className={'admin-table ' + className} {...props}>{children}</div>;
}

const tones = {
  success: ['ready', 'clean', 'active', 'published', 'approved', 'captured', 'paid', 'done', 'verified', 'issued', 'activated', 'enrolled', 'open', 'completed', 'accepted', 'sent'],
  warning: ['pending', 'draft', 'submitted', 'quarantined', 'leased', 'authorized', 'awaiting_review', 'awaiting_payment', 'needs_changes', 'renewal_review', 'grace', 'review', 'in_review', 'scheduled', 'invited', 'new'],
  danger: ['failed', 'rejected', 'dead', 'infected', 'error', 'suspended', 'withdrawn', 'cancelled', 'revoked', 'expired', 'deleted', 'blocked', 'refunded'],
};
export const statusTone = value => {
  const key = String(value ?? '').toLowerCase().replace(/\s+/g, '_');
  return Object.keys(tones).find(tone => tones[tone].includes(key)) ?? 'neutral';
};

// Shows the same visible text as statusLabel(value) unless children are given.
export function AdminStatus({ value, tone, children, className = '' }) {
  return <span className={'admin-status admin-status-' + (tone ?? statusTone(value)) + ' ' + className}>{children ?? statusLabel(value)}</span>;
}

export function AdminEmpty({ title, children, icon: Icon, className = '' }) {
  return <div className={'admin-empty ' + className}>
    {Icon && <Icon aria-hidden="true" className="admin-empty-icon" />}
    {title && <p className="admin-empty-title">{title}</p>}
    {children}
  </div>;
}

export function AdminMeta({ children, className = '' }) {
  return <p className={'admin-meta ' + className}>{children}</p>;
}
