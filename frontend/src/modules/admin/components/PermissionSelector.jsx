import React from 'react';
export function PermissionSelector({ available, value, onChange, disabled = false }) {
  const groups = Object.groupBy(available.filter(p => !['accounts.roles.manage', 'results.publish'].includes(p)), p => p.split('.')[0]);
  const change = (items, checked) => onChange(checked ? [...new Set([...value, ...items])] : value.filter(p => !items.includes(p)));
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Object.entries(groups).map(([module, items]) => <fieldset disabled={disabled} key={module} className="border rounded-xl p-3 min-w-0 space-y-2"><legend className="font-bold px-1">{module}</legend><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={items.every(p => value.includes(p))} onChange={e => change(items, e.target.checked)} />Select all {module}</label>{items.map(p => <label className="flex items-center gap-2 text-xs break-all" key={p}><input type="checkbox" checked={value.includes(p)} onChange={e => change([p], e.target.checked)} />{p}</label>)}</fieldset>)}</div>;
}
