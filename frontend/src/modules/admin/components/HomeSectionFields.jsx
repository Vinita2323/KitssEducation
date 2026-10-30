import React from 'react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';
const input = 'w-full border rounded-lg p-2';
export function HomeSectionFields({ section, update }) {
  const items = section.items || [];
  const change = (index, fields) => update('items', items.map((item, i) => i === index ? { ...item, ...fields } : item));
  return <div className="space-y-3">
    <AdminField>Home layout<AdminSelect aria-label="Home layout" className={input} value={section.layout || ''} onChange={e => update('layout', e.target.value || undefined)}><option value="">Automatic</option><option value="services">Coloured service cards</option><option value="features">Why choose us</option><option value="standard">Standard section</option></AdminSelect></AdminField>
    {items.map((item, index) => <fieldset key={index} className="rounded-xl border p-3 space-y-2"><legend>Card {index + 1}</legend>
      <AdminField>Card title<AdminInput className={input} value={item.heading || ''} onChange={e => change(index, { heading: e.target.value })} /></AdminField>
      <AdminField>Card description<AdminTextarea className={input} value={item.body || ''} onChange={e => change(index, { body: e.target.value })} /></AdminField>
      <AdminField>Card destination<AdminSelect aria-label="Card destination" className={input} value={item.linkKey || ''} onChange={e => change(index, { linkKey: e.target.value || undefined })}><option value="">No link</option>{['home', 'about', 'books', 'colleges', 'coaching', 'categories', 'results'].map(key => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)}</option>)}</AdminSelect></AdminField>
      <AdminField>Card icon<AdminSelect aria-label="Card icon" className={input} value={item.iconKey || ''} onChange={e => change(index, { iconKey: e.target.value || undefined })}><option value="">Automatic</option>{['GraduationCap', 'Video', 'BookOpen', 'Compass', 'ShieldCheck', 'User', 'Headphones', 'Clock', 'Award', 'TrendingUp', 'Building2', 'Users', 'Star', 'Sparkles'].map(key => <option key={key} value={key}>{key.replace(/([a-z])([A-Z])/g, '$1 $2')}</option>)}</AdminSelect></AdminField>
      <AdminField>Card colour<AdminSelect aria-label="Card colour" className={input} value={item.color || ''} onChange={e => change(index, { color: e.target.value || undefined })}><option value="">Automatic</option>{['green', 'orange', 'blue', 'purple', 'teal', 'amber', 'pink'].map(key => <option key={key} value={key}>{key[0].toUpperCase() + key.slice(1)}</option>)}</AdminSelect></AdminField>
      <div className="flex flex-wrap gap-3"><button type="button" disabled={index === 0} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update('items', next); }}>Move up</button><button type="button" disabled={index === items.length - 1} onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; update('items', next); }}>Move down</button><button type="button" onClick={() => update('items', items.filter((_, i) => i !== index))}>Remove card</button></div>
    </fieldset>)}
    <button type="button" disabled={items.length >= 30} onClick={() => update('items', [...items, { heading: '', body: '' }])}>Add card</button>
  </div>;
}
