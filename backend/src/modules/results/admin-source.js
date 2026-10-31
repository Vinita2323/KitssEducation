import { id, invalid, object } from '../publishing/validation.js';

export function adminResultSource({ publishingModule, commerceService }) {
  const institutions = publishingModule.institutions;
  const definition = kind => ({
    university: { model: institutions?.models.University, filter: { status: 'active', deletedAt: null }, name: 'name' },
    college: { model: institutions?.models.College, filter: { status: 'active', deletedAt: null, 'verification.state': 'verified' }, name: 'name' },
    franchise: { model: institutions?.models.FranchiseApplication, filter: { workflowVersion: 1, status: 'approved', deletedAt: null, listingPublishedAt: { $ne: null }, listingHidden: { $ne: true } }, name: 'institution.name' },
    course: { model: commerceService?.learning?.models.Course, filter: { status: 'published', publishedSnapshot: { $ne: null } }, name: 'publishedSnapshot.title' },
  })[kind];
  async function organization(kind, value) {
    const config = definition(kind);
    if (!config?.model) throw invalid('Choose a supported platform institution');
    const row = await config.model.findOne({ _id: id(String(value)), ...config.filter }).lean();
    if (!row) throw invalid('The selected institution is not available on the platform');
    if (kind === 'college') await institutions.detail('college', String(value));
    const name = kind === 'franchise' ? row.institution.name : kind === 'course' ? row.publishedSnapshot.title : row.name;
    return { id: String(row._id), kind, name };
  }
  async function validate(issuer) {
    if (issuer.sourceMode !== 'admin') return;
    if (issuer.type === 'school' || issuer.type === 'university' && issuer.organizationKind !== 'university' || issuer.type === 'institute' && !['college','franchise','course'].includes(issuer.organizationKind)) throw invalid('Board results use external providers; choose a university or platform institution for uploaded results');
    if (!issuer.organizationId || !issuer.source?.description?.trim() || !issuer.source?.authorizationReference?.trim()) throw invalid('Select the institution and enter the result source and permission reference');
    await organization(issuer.organizationKind, issuer.organizationId);
  }
  return {
    validate,
    async ready(issuer) { try { await validate(issuer); return issuer.sourceMode === 'admin'; } catch { return false; } },
    async options(query = {}) {
      object(query, ['kind','page','pageSize']);
      const config = definition(query.kind), page = Number(query.page ?? 1), pageSize = Number(query.pageSize ?? 100);
      if (!config?.model || !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw invalid('Choose an institution type and valid page');
      const count = await config.model.countDocuments(config.filter);
      const rows = await config.model.find(config.filter).sort({ [config.name]: 1, _id: 1 }).skip((page-1)*pageSize).limit(pageSize).select(config.name).lean();
      const data = [];
      for (const row of rows) { try { data.push(await organization(query.kind, row._id)); } catch { /* Unavailable college relationships are excluded. */ } }
      return { data, meta: { page, pageSize, total: count, totalPages: Math.max(1, Math.ceil(count/pageSize)) } };
    },
  };
}
