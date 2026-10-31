import { randomUUID, createHash } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { id, object, revision, invalid } from '../publishing/validation.js';
import { franchiseInput, noteText } from '../institutions/validation.js';
import { dto } from '../institutions/institutions.service.js';
import { workflowPolicy, initialWorkflowPolicy } from './policy.js';
import { accessExpiry } from '../../utils/accessDuration.js';
import { grantsFor } from '../auth/security.js';
const blocked = message => new AppError(409, 'FRANCHISE_REQUIREMENTS', message);
const missing = () => new AppError(404, 'NOT_FOUND', 'Franchise application not found');
const plain = row => row?.toObject?.() ?? row;
const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function createFranchiseWorkflow(commerce, institutions) {
  const { publishingModule: publishing } = commerce, { FranchiseApplication: Application, College, University } = institutions.models;
  const Settings = publishing.models.SiteSettings, coordination = publishing.coordination, media = publishing.media;
  const verified = auth => commerce.eligible(auth);
  const get = async value => { const row = await Application.findById(id(value)); if (!row) throw missing(); return row; };
  const owned = async (value, auth) => { verified(auth); const row = await get(value); if (String(row.applicantUserId) !== String(auth.user._id)) throw missing(); return row; };
  const update = (row, fields, expected, action, ctx) => coordination.update(Application, row, fields, revision(expected), action, ctx);
  async function policyRecord() { return await Settings.findOne({ key: 'businessPolicies' }); }
  async function policy() { const p = (await policyRecord())?.value?.franchise?.workflowPublished; if (!p || Date.parse(p.effectiveFrom) > Date.now()) throw blocked('Franchise applications will open after KITSS publishes its application policy.'); return workflowPolicy(p); }
  function state(row, at = new Date()) {
    if (!row.activatedAt) return row.status === 'approved' ? 'awaiting_payment' : 'awaiting_review';
    if (!row.renewalDueAt || !row.renewalTerms?.enabled || row.renewalDueAt > at) return 'active';
    if (new Date(row.renewalDueAt).getTime() + row.renewalTerms.graceDays * 86400000 > at.getTime()) return 'grace';
    return row.renewalTerms.expiryAction === 'manual_review' ? 'renewal_review' : 'suspended';
  }
  const result = row => { const { notes, createdBy, updatedBy, ...safe } = dto(row); return ({ ...safe, affiliationState: row.workflowVersion ? state(row) : row.affiliationState }); };
  async function eligibility(data, p, complete = false, ownerId = data.applicantUserId) {
    if (data.institution?.logoAssetId) {
      const logo = await publishing.models.MediaAsset.findOne({ _id: data.institution.logoAssetId, ownerUserId: ownerId, purpose: 'franchise_document', status: 'ready', 'scan.status': 'clean' });
      if (!logo || !['image/png', 'image/jpeg'].includes(logo.mime) || logo.bytes > 3 * 1048576) throw invalid('Choose your own scanned PNG or JPG institution logo up to 3 MB');
    }
    const linked = Boolean(data.collegeId || data.universityId);
    if (p.applicationMode === 'linked' && !linked || p.applicationMode === 'independent' && linked) throw invalid('Select the institution application mode allowed by the policy');
    if (linked) {
      if (!data.collegeId || !data.universityId) throw invalid('Choose both university and college');
      const college = await College.findOne({ _id: data.collegeId, universityId: data.universityId, status: 'active', deletedAt: null, 'verification.state': 'verified' });
      if (!college || !await University.exists({ _id: data.universityId, status: 'active', deletedAt: null })) throw invalid('Choose a published verified college and its university');
    }
    if (data.institution?.type && !p.institutionTypes.includes(data.institution.type)) throw invalid('Institution type is not eligible under the current policy');
    if (data.institution?.yearEstablished && new Date().getUTCFullYear() - data.institution.yearEstablished < p.minimumYears) throw invalid('Institution does not meet the minimum years established');
    if (complete) {
      if (!data.institution?.name || !data.institution?.type || !data.contact?.person || !data.contact?.email || !/^[+\d ()-]{10,32}$/.test(data.contact?.mobile || '') || !data.location?.address || !data.location?.city || !/^\d{6}$/.test(data.location?.pincode || '')) throw invalid('Complete institution, contact and address details');
      if (p.minimumYears > 0 && !data.institution.yearEstablished) throw invalid('Year established is required for eligibility');
      if (data.pendingDocuments?.length) throw invalid('Attach uploaded documents instead of local file selections');
    }
  }
  async function documents(row, p, reviewed = false) {
    for (const required of p.documents) {
      const doc = row.documents.find(d => d.key === required.key);
      if (!doc) { if (required.required) throw blocked('Attach ' + required.label); continue; }
      const asset = await publishing.models.MediaAsset.findOne({ _id: doc.assetId, purpose: 'franchise_document', ownerUserId: row.applicantUserId, status: 'ready', 'scan.status': 'clean' });
      if (!asset || !required.mime.includes(asset.mime) || asset.bytes > required.maxBytes) throw blocked('Document is unavailable or does not satisfy the policy: ' + required.label);
      if (reviewed && doc.state !== 'verified') throw blocked('Staff must verify ' + required.label);
    }
  }
  async function ready(row) {
    if (row.workflowVersion !== 1 || row.status !== 'approved' || !row.policySnapshot || row.agreementAcceptance?.version !== row.policySnapshot.agreement.version) throw blocked('Eligibility review and accepted agreement are required');
    await eligibility(row, row.policySnapshot, true);
    await documents(row, row.policySnapshot, true);
    const user = await commerce.authService.models.User.findById(row.applicantUserId);
    if (!user || user.status !== 'active' || !user.emailVerifiedAt) throw blocked('Applicant account is unavailable');
  }
  const api = {
    policy, state, owned, result,
    async directory(query = {}, value) {
      object(query, ['page', 'pageSize']);
      const page = Number(query.page ?? 1), pageSize = Number(query.pageSize ?? 20);
      if (!Number.isSafeInteger(page) || page < 1 || page > 10000 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) throw invalid('Invalid page');
      const filter = { workflowVersion: 1, status: 'approved', deletedAt: null, listingPublishedAt: { $ne: null }, listingHidden: { $ne: true }, ...(value ? { _id: id(value) } : {}) };
      const total = await Application.countDocuments(filter);
      const rows = await Application.find(filter).sort({ listingPublishedAt: -1, _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean();
      // Public institutional information only. Never spread the private application.
      const data = rows.map(row => ({ id: String(row._id), name: row.institution.name, type: row.institution.type, city: row.location?.city || '', website: row.institution.website || '', programs: row.programsOffered || [] }));
      if (value && !data.length) throw missing();
      return value ? data[0] : { data, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
    },
    async listing(value, input, ctx) {
      object(input, ['expectedRevision', 'publish', 'reason', 'collegeListingId'], ['expectedRevision', 'publish', 'reason']);
      if (typeof input.publish !== 'boolean') throw invalid('Choose whether to show the listing');
      const reason = noteText(input.reason);
      return coordination.run(async () => {
        const row = await get(value);
        let association = {};
        if ('collegeListingId' in input) {
          const listingId = input.collegeListingId === null ? null : String(id(input.collegeListingId));
          if (listingId && String(row.collegeListingId || '') !== listingId) await institutions.detail('college', listingId);
          association = { collegeListingId: listingId };
        }
        if (row.workflowVersion !== 1 || row.status !== 'approved') throw blocked('Only approved franchise applications can be listed');
        return result(await update(row, { ...association, listingHidden: !input.publish, listingPublishedAt: row.listingPublishedAt || new Date(), statusHistory: [...row.statusHistory.map(plain), { from: row.status, to: row.status, reason, actorId: ctx.actorId, at: new Date() }] }, input.expectedRevision, 'franchise_listing_updated', ctx));
      });
    },
    async adminPolicy() { const row = await policyRecord(); return { revision: row?.revision ?? 0, hasSavedDraft: Boolean(row?.value?.franchise?.workflowDraft), draft: row?.value?.franchise?.workflowDraft ?? initialWorkflowPolicy(), published: row?.value?.franchise?.workflowPublished ?? null, history: (row?.policyHistory ?? []).map(h => ({ revision: h.revision, reason: h.reason, at: h.at })) }; },
    async savePolicy(input, auth, ctx, publish = false) {
      if (!auth?.user?.roles.includes('super_admin')) throw new AppError(403, 'FORBIDDEN', 'Only the main administrator can publish franchise policy');
      object(input, publish ? ['expectedRevision','reason'] : ['expectedRevision','reason','policy'], publish ? ['expectedRevision','reason'] : ['expectedRevision','reason','policy']);
      const reason = noteText(input.reason);
      return coordination.run(async () => {
        let row = await policyRecord(); if ((row?.revision ?? 0) !== input.expectedRevision) throw new AppError(409, 'REVISION_CONFLICT', 'Policy changed; reload before saving');
        const previous = row?.value ?? { registrations: {} }, franchise = previous.franchise ?? { approved: false, joining: { enabled: false, currency: 'INR' }, renewal: { enabled: false, currency: 'INR' }, dueRule: 'activation_anniversary', requirements: [] };
        const p = workflowPolicy(publish ? franchise.workflowDraft : input.policy);
        if (publish) {
          if (!franchise.workflowDraft) throw invalid('Save the franchise policy draft before publishing');
          if (franchise.workflowPublished?.version === p.version && hash(franchise.workflowPublished) !== hash(p)) throw invalid('Use a new policy version before publishing changed terms');
          for (const history of row?.policyHistory ?? []) { const old = history.value?.franchise?.workflowPublished; if (old?.version === p.version && hash(old) !== hash(p)) throw invalid('Policy versions cannot be reused with different terms'); }
          if (franchise.workflowPublished?.agreement.version === p.agreement.version && franchise.workflowPublished.agreement.text !== p.agreement.text) throw invalid('Use a new agreement version when wording changes');
        }
        const value = { ...previous, franchise: { ...franchise, [publish ? 'workflowPublished' : 'workflowDraft']: p } };
        const history = [...(row?.policyHistory ?? []).map(plain), { revision: (row?.revision ?? 0) + 1, reason, actorId: ctx.actorId, at: new Date(), value }].slice(-100);
        if (row) await coordination.update(Settings, row, { value, policyHistory: history }, row.revision, publish ? 'franchise_policy_published' : 'franchise_policy_saved', ctx);
        else { row = await Settings.create({ key: 'businessPolicies', value, policyHistory: history, auditOutbox: [coordination.event('franchise_policy_saved', ctx)] }); await coordination.flush(Settings, row); }
        return api.adminPolicy();
      });
    },
    async create(input, auth, ctx) {
      verified(auth); const p = await policy(); if (!p.acceptingApplications) throw blocked('New franchise applications are currently paused.'); const fields = franchiseInput(input, true, true), requestHash = hash(fields);
      await commerce.authService.limit(ctx, String(auth.user._id), 'franchise', 10);
      return coordination.run(async () => {
        const prior = await Application.findOne({ ownerKey: String(auth.user._id), idempotencyKey: fields.idempotencyKey }).select('+requestHash');
        if (prior) { if (prior.requestHash !== requestHash) throw blocked('Draft key was already used with different details'); return result(prior); }
        await eligibility(fields, p, false, auth.user._id);
        const row = await Application.create({ ...fields, ownerKey: String(auth.user._id), requestHash, applicantUserId: auth.user._id, workflowVersion: 1, reference: 'FRN-' + randomUUID(), affiliationState: 'awaiting_review', auditOutbox: [coordination.event('franchise_draft_created', ctx)] });
        await coordination.flush(Application, row); return result(row);
      });
    },
    async edit(value, input, auth, ctx) {
      const fields = franchiseInput(input, false, true);
      return coordination.run(async () => { const row = await owned(value, auth); if (row.workflowVersion !== 1 || !['draft','needs_changes'].includes(row.status)) throw blocked('Only draft applications or requested corrections can be edited');
        const { expectedRevision, ...changes } = fields; await eligibility({ ...row.toObject(), ...changes }, row.policySnapshot ?? await policy());
        return result(await update(row, changes, expectedRevision, 'franchise_draft_updated', ctx)); });
    },
    async attach(value, input, auth, ctx) {
      object(input, ['expectedRevision','key','assetId'], ['expectedRevision','key','assetId']);
      return coordination.run(async () => { const row = await owned(value, auth); if (row.workflowVersion !== 1 || !['draft','needs_changes'].includes(row.status)) throw blocked('Only editable applications accept documents');
        const p = row.policySnapshot ?? await policy(), requirement = p.documents.find(d => d.key === input.key); if (!requirement) throw invalid('Choose a configured document requirement');
        const asset = await media.linkable(input.assetId, 'franchise_document', auth);
        if (String(asset.ownerUserId) !== String(auth.user._id) || !requirement.mime.includes(asset.mime) || asset.bytes > requirement.maxBytes) throw invalid('Document ownership, format or size does not match policy');
        const documents = [...row.documents.filter(d => d.key !== input.key).map(plain), { key: input.key, assetId: asset._id, state: 'pending' }];
        return result(await update(row, { documents }, input.expectedRevision, 'franchise_document_attached', ctx)); });
    },
    async submit(value, input, auth, ctx) {
      object(input, ['expectedRevision','declaration'], ['expectedRevision','declaration']); object(input.declaration, ['version','accepted'], ['version','accepted']);
      return coordination.run(async () => { const row = await owned(value, auth); if (!['draft','needs_changes'].includes(row.status)) return result(row);
        const p = row.policySnapshot ?? await policy(); if (input.declaration.accepted !== true || input.declaration.version !== p.agreement.version) throw invalid('Read and accept the current agreement');
        await eligibility(row, p, true); await documents(row, p);
        return result(await update(row, { status: 'pending', submittedAt: new Date(), policySnapshot: p, agreementAcceptance: { version: p.agreement.version, policyVersion: p.version, acceptedAt: new Date(), userId: String(auth.user._id) } }, input.expectedRevision, 'franchise_submitted', ctx)); });
    },
    async status(value, auth) { return result(await owned(value, auth)); },
    async mine(auth) { verified(auth); return (await Application.find({ applicantUserId: auth.user._id }).sort({ createdAt: -1 }).limit(100)).map(result); },
    async reviewDocument(value, input, auth, ctx) {
      object(input, ['expectedRevision','key','state','reason'], ['expectedRevision','key','state','reason']);
      if (!['verified','rejected'].includes(input.state)) throw invalid('Choose verified or rejected');
      return coordination.run(async () => { const row = await get(value); if (row.workflowVersion !== 1 || !['pending','needs_changes'].includes(row.status)) throw blocked('Review documents on submitted applications');
        const reason = noteText(input.reason); if (!row.documents.some(d => d.key === input.key)) throw invalid('Document not attached');
        const documents = row.documents.map(d => d.key === input.key ? { ...plain(d), state: input.state, reason, reviewedBy: ctx.actorId, reviewedAt: new Date() } : plain(d));
        return result(await update(row, { documents }, input.expectedRevision, 'franchise_document_reviewed', ctx)); });
    },
    async review(value, input, ctx) {
      object(input, ['expectedRevision','status','reason','note','rejectionReason'], ['expectedRevision','status']);
      return coordination.run(async () => { const row = await get(value); const reason = noteText(input.reason ?? input.rejectionReason ?? input.note ?? '');
        if (row.workflowVersion !== 1 || row.status !== 'pending' || !['approved','rejected','needs_changes'].includes(input.status)) throw blocked('Choose an allowed review action for a submitted application');
        if (input.status === 'approved') { const account = await commerce.authService.models.User.findById(row.applicantUserId); if (!account || account.status !== 'active' || !account.emailVerifiedAt) throw blocked('A verified active applicant account is required'); await eligibility(row, row.policySnapshot, true); await documents(row, row.policySnapshot, true); }
        const freeActivation = input.status === 'approved' && row.policySnapshot.joining.amountMinor === 0 ? { activatedAt: new Date(), affiliationState: 'active', renewalTerms: row.policySnapshot.renewal, nextFranchiseCheckAt: new Date(), renewalDueAt: row.policySnapshot.renewal.enabled ? accessExpiry(new Date(), { durationMonths: row.policySnapshot.renewal.months }) : null } : {};
        return result(await update(row, { ...freeActivation, ...(input.status === 'approved' ? { listingPublishedAt: new Date(), listingHidden: false } : {}), status: input.status, rejectionReason: input.status === 'rejected' ? reason : '', reviewedAt: new Date(), reviewedBy: ctx.actorId,
          statusHistory: [...row.statusHistory.map(plain), { from: row.status, to: input.status, actorId: ctx.actorId, at: new Date(), reason }] }, input.expectedRevision, 'franchise_reviewed', ctx)); });
    },
    async activate(value, input, auth, ctx) {
      object(input, ['expectedRevision'], ['expectedRevision']);
      return coordination.run(async () => { const row = await owned(value, auth); await ready(row); if (row.activatedAt) return result(row);
        if (row.policySnapshot.joining.amountMinor !== 0) throw blocked('Complete verified joining payment before activation');
        const terms = row.policySnapshot.renewal;
        return result(await update(row, { activatedAt: new Date(), affiliationState: 'active', renewalTerms: terms, nextFranchiseCheckAt: new Date(), renewalDueAt: terms.enabled ? accessExpiry(new Date(), { durationMonths: terms.months }) : null }, input.expectedRevision, 'franchise_activated', ctx)); });
    },
    async reviewRenewal(value, input, ctx) {
      object(input, ['expectedRevision','reason'], ['expectedRevision','reason']);
      return coordination.run(async () => { const row = await get(value); if (state(row) !== 'renewal_review' || !row.renewalDueAt) throw blocked('Only expired renewals requiring manual review can be approved');
        return result(await update(row, { renewalReview: { period: row.renewalDueAt.toISOString(), approvedBy: ctx.actorId, reason: noteText(input.reason), at: new Date() } }, input.expectedRevision, 'franchise_renewal_reviewed', ctx)); });
    },
    async acceptRenewal(value, input, auth, ctx) {
      object(input, ['expectedRevision','agreementVersion','accepted'], ['expectedRevision','agreementVersion','accepted']);
      return coordination.run(async () => { const row = await owned(value, auth), p = await policy(); await ready(row);
        if (!row.activatedAt || !row.renewalDueAt || input.accepted !== true || input.agreementVersion !== p.agreement.version) throw blocked('Read and accept the current renewal agreement');
        return result(await update(row, { renewalAcceptance: { period: row.renewalDueAt.toISOString(), policy: p, at: new Date(), userId: String(auth.user._id) } }, input.expectedRevision, 'franchise_renewal_agreement', ctx)); });
    },
    async hasEffect(order) { const row = await Application.findById(order.product.id); return Boolean(row && (order.product.kind === 'franchise_joining' ? String(row.activationOrderId) === String(order._id) : row.renewalEffects.some(e => e.orderId === String(order._id)))); },
    async quote(value, kind, auth) {
      const row = await owned(value, auth); await ready(row);
      const renewal = kind === 'franchise_renewal', p = renewal ? row.renewalAcceptance?.policy : row.policySnapshot;
      if (renewal && (!p || row.renewalAcceptance.period !== row.renewalDueAt?.toISOString())) throw blocked('Accept the current renewal terms before creating an order');
      if (renewal ? !row.activatedAt || !row.renewalDueAt || !row.renewalTerms?.enabled || new Date(row.renewalDueAt).getTime() - row.policySnapshot.reminderDays * 86400000 > Date.now() : Boolean(row.activatedAt)) throw blocked('This franchise payment period is not available');
      if (renewal && state(row) === 'renewal_review' && row.renewalReview?.period !== row.renewalDueAt.toISOString()) throw blocked('Staff approval is required before renewing this expired affiliation');
      const fee = renewal ? p.renewal : p.joining;
      if (!fee.enabled || fee.amountMinor <= 0) throw blocked('No paid fee is due; use the free activation or renewal action');
      return { product: { kind, id: row._id, title: renewal ? 'Franchise renewal' : 'Franchise joining', revision: row.revision, purchaseSlot: renewal ? new Date(row.renewalDueAt).toISOString() : 'joining', franchiseTerms: { policyVersion: p.version, agreement: p.agreement, renewal: p.renewal } }, amountMinor: fee.amountMinor, currency: 'INR' };
    },
    async fulfill(order) {
      return coordination.run(async () => { const row = await get(String(order.product.id)); await ready(row);
        if (String(row.applicantUserId) !== String(order.userId) || order.status !== 'captured' || !order.capturedPaymentId) throw blocked('Verified owned payment required');
        const renewal = order.product.kind === 'franchise_renewal', terms = order.product.franchiseTerms;
        if (!terms) throw blocked('Immutable franchise payment terms required');
        if (renewal && state(row) === 'renewal_review' && row.renewalReview?.period !== order.product.purchaseSlot) throw blocked('Staff must approve this expired renewal before paid fulfillment');
        if (!renewal && row.activationOrderId && String(row.activationOrderId) === String(order._id) || renewal && row.renewalEffects.some(e => e.orderId === String(order._id))) return row;
        if (renewal ? !row.activatedAt || new Date(row.renewalDueAt).toISOString() !== order.product.purchaseSlot : Boolean(row.activatedAt)) throw blocked('Franchise payment period already fulfilled');
        const fields = renewal ? { renewalDueAt: terms.renewal.enabled ? accessExpiry(new Date(Math.max(Date.now(), row.renewalDueAt.getTime())), { durationMonths: terms.renewal.months }) : null, renewalEffects: [...row.renewalEffects, { orderId: String(order._id), period: order.product.purchaseSlot, at: new Date() }] } : { activatedAt: new Date(), activationOrderId: order._id, renewalDueAt: terms.renewal.enabled ? accessExpiry(new Date(), { durationMonths: terms.renewal.months }) : null };
        return update(row, { ...fields, affiliationState: 'active', nextFranchiseCheckAt: new Date(), renewalTerms: terms.renewal }, row.revision, renewal ? 'franchise_renewed' : 'franchise_activated', { actorId: 'verified-payment' }); });
    },
    async freeRenew(value, input, auth, ctx) {
      object(input, ['expectedRevision','agreementVersion','accepted'], ['expectedRevision','agreementVersion','accepted']);
      return coordination.run(async () => { const row = await owned(value, auth); await ready(row); const p = await policy();
        if (!row.activatedAt || !row.renewalDueAt || !row.renewalTerms?.enabled || p.renewal.amountMinor !== 0 || input.accepted !== true || input.agreementVersion !== p.agreement.version || row.renewalDueAt.getTime() - row.policySnapshot.reminderDays * 86400000 > Date.now()) throw blocked('Free renewal requires a due renewal period and accepted current agreement');
        const period = row.renewalDueAt.toISOString();
        if (state(row) === 'renewal_review' && row.renewalReview?.period !== period) throw blocked('Staff approval is required before renewing this expired affiliation');
        if (await commerce.models.Order.exists({ userId: row.applicantUserId, 'product.id': row._id, 'product.kind': 'franchise_renewal', 'product.purchaseSlot': period, status: { $ne: 'captured' } })) throw blocked('An existing payment order must be resolved before a free renewal can be applied');
        return result(await update(row, { affiliationState: 'active', nextFranchiseCheckAt: new Date(), renewalDueAt: p.renewal.enabled ? accessExpiry(new Date(Math.max(Date.now(), row.renewalDueAt.getTime())), { durationMonths: p.renewal.months }) : null, renewalTerms: p.renewal, renewalEffects: [...row.renewalEffects, { period, policyVersion: p.version, agreementVersion: p.agreement.version, policySnapshot: p, at: new Date() }] }, input.expectedRevision, 'franchise_renewed', ctx)); });
    },
    async refs(value) { return (await Application.find({ $or: [{ 'documents.assetId': id(String(value)) }, { 'institution.logoAssetId': id(String(value)) }] }).select('_id')).map(row => ({ kind: 'FranchiseApplication', id: String(row._id), status: 'private' })); },
    async uploadAllowed(auth) { verified(auth); await policy(); },
    async documentAllowed(asset, auth) { if (!auth || asset.purpose !== 'franchise_document' || ['failed','deleted','deleting'].includes(asset.status)) return false; return String(asset.ownerUserId) === String(auth.user._id) || grantsFor(auth.user).some(p => ['franchises.review','franchises.approve'].includes(p)); },
    async maintenance() {
      const at = new Date(); const rows = await Application.find({ workflowVersion: 1, activatedAt: { $ne: null }, renewalDueAt: { $ne: null }, $or: [{ nextFranchiseCheckAt: { $exists: false } }, { nextFranchiseCheckAt: { $lte: at } }] }).sort({ nextFranchiseCheckAt: 1, renewalDueAt: 1 }).limit(100);
      for (const item of rows) await coordination.run(async () => { const row = await get(String(item._id)); if (!row.renewalDueAt) return; const affiliationState = state(row, at), period = row.renewalDueAt.toISOString(), fields = { nextFranchiseCheckAt: new Date(at.getTime() + 3600000) };
        if (row.affiliationState !== affiliationState) fields.affiliationState = affiliationState;
        const due = row.renewalDueAt.getTime() - row.policySnapshot.reminderDays * 86400000 <= at.getTime();
        const action = ['suspended','renewal_review'].includes(affiliationState) ? 'franchise_expired' : 'franchise_renewal_reminder';
        const marker = action === 'franchise_expired' ? 'expiryNoticeFor' : 'reminderFor';
        if (due && row[marker] !== period) fields[marker] = period;
        if (Object.keys(fields).length > 1) await update(row, fields, row.revision, action, { actorId: 'franchise-maintenance' });
        else await Application.updateOne({ _id: row._id, revision: row.revision }, { $set: fields });
      });
    },
  }; return api;
}
