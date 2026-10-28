import { randomUUID } from 'node:crypto';

// Called inside the institution write lock. Include archived keys so old references
// never acquire a different meaning. The database unique index remains authoritative.
export async function generateTaxonomyKey(data, Taxonomy) {
  const parents = [];
  for (const parentId of [...(data.parentIds ?? [])].map(String).sort()) {
    const parent = await Taxonomy.findById(parentId);
    parents.push(parent.key);
  }
  const slug = data.label.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const base = [...parents, slug || `${data.kind.replaceAll('_', '-')}-${randomUUID()}`]
    .join('-').slice(0, 70).replace(/-+$/g, '');
  let candidate = base;
  let suffix = 1;
  while (await Taxonomy.exists({ kind: data.kind, key: candidate })) {
    candidate = `${base}-${++suffix}`;
  }
  return candidate;
}
