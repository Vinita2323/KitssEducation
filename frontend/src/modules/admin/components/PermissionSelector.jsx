import React, { useEffect, useId, useState } from 'react';
import { describeAccess, ownerOnly, permissionGroups, staffRoles } from './staffRoles';

// Staff access is chosen by job role; individual permissions stay available under "Custom permissions".
export function PermissionSelector({ available, value, onChange, disabled = false }) {
  // Unique ids so two selectors on one page (invite form and account details) never clash.
  const uid = useId(), idFor = role => uid + role.name.replace(/\W/g, '');
  const grantable = available.filter(p => !ownerOnly.includes(p));
  const roles = staffRoles.map(role => ({ ...role, usable: role.permissions.filter(p => grantable.includes(p)) })).filter(role => role.usable.length);
  const { roles: selected, extras } = describeAccess(value, grantable);
  const [custom, setCustom] = useState(extras.length > 0);
  const hasExtras = extras.length > 0;
  useEffect(() => { if (hasExtras) setCustom(true); }, [hasExtras]);
  const toggleRole = (role, on) => {
    if (on) return onChange([...new Set([...value, ...role.usable])]);
    // Keep permissions that another selected role or a custom choice still needs.
    const kept = new Set(selected.filter(r => r.name !== role.name).flatMap(r => r.permissions));
    onChange(value.filter(p => !role.usable.includes(p) || kept.has(p)));
  };
  const toggle = (permission, on) => onChange(on ? [...new Set([...value, permission])] : value.filter(p => p !== permission));
  const isSelected = role => selected.some(r => r.name === role.name);
  return <div className="space-y-3">
    <fieldset disabled={disabled} className="space-y-2"><legend className="font-semibold text-sm">Role</legend>
      <p className="text-xs text-[#53647c]">Choose one or more. Every role can view the dashboard.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{roles.map(role => <label key={role.name} className={'flex items-start gap-3 rounded-xl border p-3 cursor-pointer ' + (isSelected(role) ? 'border-[#0A1D3F] bg-[#eef4fb]' : 'border-[#e1e7f0] bg-white')}>
        <input type="checkbox" className="mt-1" checked={isSelected(role)} onChange={e => toggleRole(role, e.target.checked)} aria-labelledby={idFor(role) + '-name'} aria-describedby={idFor(role) + '-summary'} />
        <span className="min-w-0"><span id={idFor(role) + '-name'} className="block font-semibold">{role.name}</span><span id={idFor(role) + '-summary'} className="block text-xs !font-normal text-[#53647c]">{role.summary}</span></span>
      </label>)}</div>
    </fieldset>
    <details open={custom} onToggle={e => setCustom(e.currentTarget.open)} className="rounded-xl border border-[#e1e7f0] p-3">
      <summary className="cursor-pointer font-semibold text-sm">Custom permissions{hasExtras ? ` (${extras.length} beyond the chosen roles)` : ''}</summary>
      <p className="text-xs text-[#53647c] mt-2">Only for unusual cases. Ticks here add to or remove from the chosen roles.</p>
      <fieldset disabled={disabled} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">{permissionGroups.map(([group, items]) => {
        const shown = Object.entries(items).filter(([p]) => grantable.includes(p));
        return shown.length > 0 && <fieldset key={group} className="border rounded-xl p-3 min-w-0 space-y-1"><legend className="font-semibold text-sm px-1">{group}</legend>
          {shown.map(([p, label]) => <label key={p} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.includes(p)} onChange={e => toggle(p, e.target.checked)} />{label}</label>)}
        </fieldset>;
      })}</fieldset>
    </details>
  </div>;
}
