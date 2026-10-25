import { id, invalid, object, key, revision } from '../institutions/validation.js';
export { id, invalid, object, key, revision };
export const text = (v, max = 160) => { if (typeof v !== 'string' || v.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(v)) throw invalid('Invalid text'); return v.trim(); };
const integer = (v, max = 1000000000) => { if (!Number.isSafeInteger(v) || v < 0 || v > max) throw invalid('Invalid integer'); return v; };
const bool = v => { if (typeof v !== 'boolean') throw invalid('Invalid boolean'); return v; };
const ref = v => String(id(v));
const arr = (v, fn, max = 50) => { if (!Array.isArray(v) || v.length > max) throw invalid('Invalid list'); return v.map(fn); };
const choice = values => v => { if (!values.includes(v)) throw invalid('Invalid selection'); return v; };
export const links = Object.freeze({ home: '/home', about: '/about', books: '/books', colleges: '/colleges', institutes: '/institutes', coaching: '/coaching', categories: '/categories', results: '/results' });
export function safeLink(value) {
  object(value, ['type', 'target'], ['type', 'target']);
  const target = text(value.target, 2048);
  if (value.type === 'internal') { if (!Object.values(links).includes(target)) throw invalid('Use an approved internal route'); }
  else if (value.type === 'external') { let u; try { u = new URL(target); } catch { throw invalid('Invalid link'); } if (u.protocol !== 'https:' || u.username || u.password) throw invalid('Use a complete HTTPS link'); }
  else throw invalid('Invalid link type');
  return { type: value.type, target };
}
const section = v => {
  object(v, ['key', 'type', 'heading', 'body', 'items', 'mediaAssetIds'], ['key', 'type']);
  return { key: text(v.key, 80), type: choice(['text', 'cards', 'stats', 'founder', 'contact'])(v.type), heading: text(v.heading ?? ''), body: text(v.body ?? '', 10000), items: arr(v.items ?? [], item => { object(item, ['heading', 'body', 'linkKey']); return { heading: text(item.heading ?? ''), body: text(item.body ?? '', 2000), ...(item.linkKey ? { linkKey: choice(Object.keys(links))(item.linkKey) } : {}) }; }, 30), mediaAssetIds: arr(v.mediaAssetIds ?? [], ref, 8) };
};
const date = v => { if (typeof v !== 'string' || !v || Number.isNaN(Date.parse(v))) throw invalid('Invalid date'); return new Date(v); };
const fields = {
  books: { title: text, subtitle: text, author: text, description: v => text(v, 20000), category: v => text(v, 80), boardId: ref, classId: ref, subjectId: ref, languageId: ref, keywords: v => arr(v, x => text(x, 80)), priceMinor: integer, originalPriceMinor: integer, currency: choice(['INR']), pricingApproved: bool, rightsConfirmed: bool, rightsNote: v => text(v, 1000), coverAssetId: ref, documentAssetId: ref, previewAssetIds: v => arr(v, ref, 8), edition: v => text(v, 80), coverVariant: choice(['navy', 'orange', 'teal']), iconKey: choice(['BookOpen', 'Calculator', 'Atom', 'BookMarked', 'Globe2', 'Languages']), toc: v => arr(v, x => { object(x, ['title', 'page'], ['title', 'page']); const page = integer(x.page, 10000); if (!page) throw invalid('Page numbers start at one'); return { title: text(x.title), page }; }, 200) },
  pages: { key: choice(['home', 'about', 'categories', 'navigation']), sections: v => { const rows = arr(v, section, 20); if (new Set(rows.map(x => x.key)).size !== rows.length) throw invalid('Duplicate section keys'); return rows; } },
  banners: { placement: choice(['home', 'my_courses', 'results_top', 'results_bottom']), title: text, subtitle: v => text(v, 1000), tag: v => text(v, 80), ctaText: v => text(v, 80), imageAssetId: ref, link: safeLink, variant: choice(['navy', 'orange', 'teal']), sortOrder: v => integer(v, 100000), startsAt: date, endsAt: date },
  faculty: { name: text, role: text, qualifications: v => text(v, 1000), experience: v => text(v, 1000), specialty: v => text(v, 1000), badge: v => text(v, 80), trackTags: v => arr(v, choice(['jee', 'neet', 'admissions', 'school', 'founder']), 5), portraitAssetId: ref, sourceNote: v => text(v, 1000), sortOrder: v => integer(v, 100000) },
};
const required = { books: ['title'], pages: ['key'], banners: ['title', 'placement'], faculty: ['name', 'role'] };
export function contentInput(kind, input, creating = false) {
  object(input, [...Object.keys(fields[kind]), 'expectedRevision'], creating ? required[kind] : ['expectedRevision']);
  const data = {};
  for (const [k, v] of Object.entries(input)) if (k !== 'expectedRevision') data[k] = v === null && /AssetId$|Id$/.test(k) ? null : fields[kind][k](v);
  for (const k of required[kind]) if (k in data && !data[k]) throw invalid('Required field: ' + k);
  return { fields: data, expectedRevision: creating ? undefined : revision(input.expectedRevision) };
}
export function settingInput(keyName, input) {
  if (keyName === 'registrationFees') {
    object(input, ['value', 'expectedRevision'], ['value', 'expectedRevision']);
    object(input.value, ['study', 'tuition', 'teacher', 'coaching-profile']);
    if (!Object.keys(input.value).length) throw invalid('Configure at least one explicit fee');
    const value = {};
    for (const [kind, fee] of Object.entries(input.value)) { object(fee, ['amountMinor', 'approved'], ['amountMinor', 'approved']); value[kind] = { amountMinor: integer(fee.amountMinor), approved: bool(fee.approved) }; }
    return { value, expectedRevision: integer(input.expectedRevision) };
  }
  const allow = { brand: ['name', 'tagline'], support: ['email', 'phone', 'address', 'hours'], footer: ['copyright', 'description', 'links'], publicFeatures: ['booksEnabled', 'institutionsEnabled'] }[keyName];
  if (!allow) throw invalid('This setting is not editable in Stage 5');
  object(input, ['value', 'expectedRevision'], ['value', 'expectedRevision']); object(input.value, allow);
  const value = {};
  for (const [k, v] of Object.entries(input.value)) value[k] = k.endsWith('Enabled') ? bool(v) : k === 'links' ? arr(v, safeLink, 10) : text(v, 1000);
  if (value.email && !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value.email)) throw invalid('Invalid support email');
  if (value.phone && !/^[+\d ()-]{5,32}$/.test(value.phone)) throw invalid('Invalid support phone');
  return { value, expectedRevision: integer(input.expectedRevision) };
}
