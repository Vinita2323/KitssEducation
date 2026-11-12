// Converts between the friendly values admins type and the exact values the server stores.
export const MB = 1048576;

export const toRupees = minor => (Number.isFinite(minor) ? minor / 100 : '');
export const toPaise = rupees => rupees === '' || rupees == null ? 0 : Math.round(Number(rupees) * 100);
export const rupeeText = minor => '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 });

export const showDay = iso => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '';
export const showStamp = iso => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '';

// Version names are generated so admins never have to invent them.
export const versionName = prefix => prefix + '-' + new Date().toISOString().replace(/\D/g, '').slice(0, 14);

// Stable comparison that ignores key order.
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
export const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

// Document keys are internal references; new ones are derived from the label.
export function withKeys(documents, pattern = /^[a-z][a-z0-9_-]{0,49}$/) {
  const used = new Set(documents.filter(d => d.key).map(d => d.key));
  return documents.map(d => {
    if (d.key) return d;
    let base = d.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
    if (!/^[a-z]/.test(base)) base = 'document' + (base ? '_' + base : '');
    let key = base, n = 2;
    while (used.has(key) || !pattern.test(key)) key = (base + '_' + n++).slice(0, 50);
    used.add(key);
    return { ...d, key };
  });
}

export const reasonPrompt = 'Briefly say what changed and why. This is saved in the change history.';
