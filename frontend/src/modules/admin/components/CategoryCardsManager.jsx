import React, { useEffect, useState } from 'react';
import { AdminField, AdminInput, AdminSelect, AdminTextarea } from './AdminFields';
import { MediaPicker } from './MediaPicker';
import { useAuth } from '../../user/context/AuthContext';
import { contentService } from '../../user/services/contentService';
import { resolveCategoryCards, categoryIcons, categoryColors, categoryRoutes } from '../../user/pages/categories/categoryCards';

const path = '/admin/content/pages';
export function CategoryCardsManager() {
  const { can } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [record, setRecord] = useState(null), [cards, setCards] = useState([]), [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [dirty, setDirty] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    contentService.adminList(path, { pageSize: 100 }, controller.signal).then(result => {
      const page = result.data.find(row => row.key === 'categories');
      setRecord(page || null); setCards(resolveCategoryCards(page || {})); setLoaded(true);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, []);
  const locked = !loaded || busy || !can('content.write') || record?.status === 'archived';
  const changeCards = next => { setCards(next); setDirty(true); setMessage(''); };
  const update = (key, value) => changeCards(cards.map((card, i) => i === selected ? { ...card, [key]: value } : card));
  const run = async action => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const save = e => { e.preventDefault(); run(async () => {
    const input = { key: 'categories', sections: record?.sections || [], categoryCards: cards };
    const saved = record ? await contentService.edit(path, record, input) : await contentService.create(path, input);
    setRecord(saved); setDirty(false); setMessage('Draft saved. Publish when ready to update the Categories page.');
  }); };
  const publish = value => run(async () => { setRecord(await contentService.publish(path, record, value)); setMessage(value ? 'Categories published.' : 'Categories unpublished. The default cards are shown.'); });
  const card = cards[selected];
  const textField = (key, label, maxLength, multiline = false) => <AdminField className="block text-sm">{label}{multiline ? <AdminTextarea aria-label={label} value={card[key] || ''} maxLength={maxLength} onChange={e => update(key, e.target.value)} /> : <AdminInput aria-label={label} required={['title', 'tabLabel'].includes(key)} value={card[key] || ''} maxLength={maxLength} onChange={e => update(key, e.target.value)} />}</AdminField>;
  const selectField = (key, label, values) => <AdminField className="block text-sm">{label}<AdminSelect aria-label={label} value={card[key]} onChange={e => update(key, e.target.value)}>{values.map(value => <option key={value}>{value}</option>)}</AdminSelect></AdminField>;
  return <section className="space-y-4" aria-label="Category cards manager">
    <div className="bg-white border rounded-2xl p-5 space-y-3">
      <h2 className="text-xl font-bold">Category cards</h2>
      <p className="text-sm text-slate-600">Manage the cards and filter tabs on the student Categories page. Links open existing pages.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status">{message}</p>}
      {busy && <p role="status">Loading...</p>}
      {record?.status === 'archived' && <p role="alert">This page was archived. Category editing is unavailable.</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <span>{record ? 'State: ' + record.status : 'Using default cards'}{dirty ? ' (unsaved changes)' : ''}</span>
        <button type="button" disabled={locked || cards.length >= 30 || Boolean(error && !record && !cards.length)} onClick={() => {
          changeCards([...cards, { id: 'category-' + crypto.randomUUID(), title: 'New category', subtitle: '', tabLabel: 'New category', path: '/books', iconKey: 'BookOpen', color: 'blue', badge: '', tags: [], imageAssetId: null, hidden: false }]); setSelected(cards.length);
        }}>Add category</button>
        <button type="button" disabled={busy || dirty || !record || record.status === 'archived' || !can('content.publish')} onClick={() => publish(true)}>Publish categories</button>
        {record?.status === 'published' && <button type="button" disabled={busy || dirty || !can('content.publish')} onClick={() => publish(false)}>Unpublish categories</button>}
      </div>
    </div>
    <div className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_2fr]">
      <div className="bg-white border rounded-2xl p-4 space-y-3">
        {cards.map((item, index) => <div key={item.id} className="border rounded-xl p-3 space-y-2">
          <button type="button" className="text-left font-bold" aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.title}{item.hidden ? ' (hidden)' : ''}</button>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" aria-label={'Move ' + item.title + ' up'} disabled={locked || index === 0} onClick={() => { const next = [...cards]; [next[index-1], next[index]] = [next[index], next[index-1]]; changeCards(next); setSelected(index-1); }}>Move up</button>
            <button type="button" aria-label={'Move ' + item.title + ' down'} disabled={locked || index === cards.length-1} onClick={() => { const next = [...cards]; [next[index+1], next[index]] = [next[index], next[index+1]]; changeCards(next); setSelected(index+1); }}>Move down</button>
            <button type="button" className="text-red-700" disabled={locked} onClick={() => { if (window.confirm('Remove "' + item.title + '"? This takes effect after saving and publishing. Its image stays in Media.')) { changeCards(cards.filter((_, i) => i !== index)); setSelected(0); } }}>Remove</button>
          </div>
        </div>)}
        {!cards.length && <p>No category cards. Add a card or save and publish an empty list to hide all cards.</p>}
      </div>
      <form onSubmit={save} className="bg-white border rounded-2xl p-5 space-y-4" aria-label="Category editor">
        <fieldset disabled={locked} className="space-y-4">
          {card && <>
            {textField('title', 'Card title', 100)}{textField('subtitle', 'Description', 300, true)}{textField('tabLabel', 'Filter tab label', 60)}
            <div className="grid sm:grid-cols-2 gap-3">{selectField('path', 'Destination', categoryRoutes)}{selectField('color', 'Colour', categoryColors)}{selectField('iconKey', 'Icon', categoryIcons)}{textField('badge', 'Badge (optional)', 30)}</div>
            <AdminField className="block text-sm">Tags (up to three, separated by commas)<AdminInput value={(card.tags || []).join(', ')} onChange={e => update('tags', e.target.value.split(',').map(value => value.trim()))} /></AdminField>
            <MediaPicker key={card.id} purpose="cms" label="Category image" value={card.imageAssetId} onChange={value => update('imageAssetId', value)} />
            <p className="text-xs text-slate-600">An attached image replaces the icon. Remove the attachment to use the icon again.</p>
            <AdminField><AdminInput type="checkbox" checked={Boolean(card.hidden)} onChange={e => update('hidden', e.target.checked)} />Hide this card and its filter tab</AdminField>
          </>}
          <button className="bg-[#FF8A00] rounded-xl px-4 py-2" type="submit" disabled={locked || Boolean(error && !record && !cards.length)}>Save categories draft</button>
        </fieldset>
      </form>
    </div>
  </section>;
}
