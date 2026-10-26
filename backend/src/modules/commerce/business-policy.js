import { refundPolicy, franchisePolicy, invoicePolicy, franchiseFeeStatus } from './policy-settings.js';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { object, text, id, revision, key, invalid } from '../publishing/validation.js';
import { registrationFields } from './registration.js';
import { grantsFor } from '../auth/security.js';

const blocked = message => new AppError(409, 'BUSINESS_POLICY_PENDING', message);
const missing = () => new AppError(404, 'NOT_FOUND', 'Record was not found');
const now = () => new Date();
const same = (a, b) => String(a) === String(b);
const plain = row => row?.toObject?.() ?? row;
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const policyContent = value => { const { configRevision, ...fields } = value ?? {}; return JSON.stringify(canonical(fields)); };
const boolean = value => { if (typeof value !== 'boolean') throw invalid('Explicit true or false required'); return value; };
const amount = value => { if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000) throw invalid('Invalid amount'); return value; };
const date = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw invalid('UTC date required'); return new Date(value); };
export function registrationPolicy(input) {
  object(input, ['status', 'feeRequired', 'amountMinor', 'currency', 'documents', 'privacyApproved', 'documentsApproved', 'effectiveFrom', 'effectiveTo', 'retentionDays', 'guardian', 'enabled', 'version', 'upload'], ['status', 'feeRequired', 'currency', 'documents', 'privacyApproved', 'documentsApproved']);
  if (!['draft', 'active', 'retired'].includes(input.status) || input.currency !== 'INR') throw invalid('Invalid policy status or currency');
  if ("enabled" in input) boolean(input.enabled);
  if (input.version != null && !text(input.version, 80).trim()) throw invalid("Policy version cannot be empty");
  const result = { ...input, feeRequired: boolean(input.feeRequired), privacyApproved: boolean(input.privacyApproved), documentsApproved: boolean(input.documentsApproved) };
  if ('amountMinor' in input) result.amountMinor = amount(input.amountMinor);
  if (input.status === 'active' && (!Number.isSafeInteger(result.amountMinor) || (input.feeRequired ? result.amountMinor <= 0 : result.amountMinor !== 0))) throw invalid('Active policies require an explicit positive paid fee or explicit zero free fee');
  if (!Array.isArray(input.documents) || input.documents.length > 10) throw invalid('At most ten approved document requirements');
  result.documents = input.documents.map(d => { object(d, ['key', 'label', 'required'], ['key', 'label']); if ('required' in d) boolean(d.required); if (!/^[a-z][a-zA-Z0-9_-]{0,49}$/.test(d.key)) throw invalid('Invalid document key'); return { key: d.key, label: text(d.label, 100), ...(d.required == null ? {} : { required: d.required }) }; });
  if (new Set(result.documents.map(d => d.key)).size !== result.documents.length) throw invalid('Duplicate document requirement');
  for (const field of ['effectiveFrom', 'effectiveTo']) if (input[field]) result[field] = date(input[field]).toISOString();
  if (result.effectiveFrom && result.effectiveTo && result.effectiveFrom >= result.effectiveTo) throw invalid('Invalid effective range');
  if (input.retentionDays != null && (!Number.isSafeInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 36500)) throw invalid('Retention must be an explicitly approved positive day count or unset');
  if (input.upload) {
    object(input.upload, ['mime', 'maxBytes'], ['mime', 'maxBytes']);
    if (!Array.isArray(input.upload.mime) || !input.upload.mime.length || input.upload.mime.length > 3 || input.upload.mime.some(m => !['application/pdf','image/png','image/jpeg'].includes(m)) || !Number.isSafeInteger(input.upload.maxBytes) || input.upload.maxBytes < 1 || input.upload.maxBytes > 10485760) throw invalid('Registration upload settings must narrow the supported PDF/PNG/JPEG and 10 MiB limits');
    result.upload = { mime: [...new Set(input.upload.mime)], maxBytes: input.upload.maxBytes };
  }
  if (input.guardian) {
    object(input.guardian, ['approved', 'version', 'text', 'appliesTo'], ['approved', 'version', 'text']);
    if (input.guardian.appliesTo != null && !['minors', 'all'].includes(input.guardian.appliesTo)) throw invalid('Guardian applicability must preserve the minor consent gate');
    result.guardian = { ...(input.guardian.appliesTo ? { appliesTo: input.guardian.appliesTo } : {}), approved: boolean(input.guardian.approved), version: text(input.guardian.version, 80), text: text(input.guardian.text, 10000) };
    if (result.guardian.approved && (!result.guardian.version || !result.guardian.text)) throw invalid('Approved guardian workflow requires versioned consent wording');
  }
  return result;
}

export function createBusinessPolicyService(commerce) {
  const { models, publishingModule: publishing, authService } = commerce;
  const { RegistrationApplication: Application, AccessRequest, Order, BookEntitlement } = models;
  const Settings = publishing.models.SiteSettings, Media = publishing.models.MediaAsset, coordination = publishing.coordination;
  const event = (action, ctx) => ({ id: randomUUID(), action, actorId: ctx.actorId, requestId: ctx.requestId, at: now() });
  async function update(Model, row, expected, fields, action, ctx) {
    if (row.revision !== revision(expected)) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh before changing this record');
    const result = await Model.findOneAndUpdate({ _id: row._id, revision: expected, 'auditOutbox.999': { $exists: false } }, { $set: fields, $inc: { revision: 1 }, $push: { auditOutbox: event(action, ctx) } }, { returnDocument: 'after', runValidators: true });
    if (!result) throw new AppError(409, 'REVISION_CONFLICT', 'Record changed; refresh before retrying');
    await commerce.flush(Model, result); return result;
  }
  const api = {
    async settings() { return await Settings.findOne({ key: 'businessPolicies' }).lean() ?? { revision: 0, value: { registrations: {} } }; },
    async save(input, auth, ctx) {
      if (!auth.user.roles.includes('super_admin')) throw new AppError(403, 'FORBIDDEN', 'Only the main admin can approve business policy configuration');
      object(input, ['value', 'expectedRevision', 'reason'], ['value', 'expectedRevision', 'reason']);
      if (!text(input.reason, 500).trim()) throw invalid('Policy change reason required');
      object(input.value, ['registrations', 'manualAccess', 'invoice', 'refunds', 'franchise']);
      const value = {};
      if (input.value.registrations) {
        object(input.value.registrations, Object.keys(registrationFields));
        value.registrations = Object.fromEntries(Object.entries(input.value.registrations).map(([kind, policy]) => [kind, registrationPolicy(policy)]));
      }
      if (input.value.manualAccess) {
        object(input.value.manualAccess, ['approved', 'paidRevocationApproved', 'description'], ['approved', 'paidRevocationApproved', 'description']);
        value.manualAccess = { approved: boolean(input.value.manualAccess.approved), paidRevocationApproved: boolean(input.value.manualAccess.paidRevocationApproved), description: text(input.value.manualAccess.description, 2000) };
        if (value.manualAccess.approved && !value.manualAccess.description.trim()) throw invalid('Describe the approved exceptional grant policy');
      }
      if (input.value.invoice) value.invoice = invoicePolicy(input.value.invoice);
      if (input.value.refunds) value.refunds = refundPolicy(input.value.refunds);
      if (input.value.franchise) value.franchise = franchisePolicy(input.value.franchise);
      return coordination.run(async () => {
        let row = await Settings.findOne({ key: 'businessPolicies' });
        if (!row) {
          if (input.expectedRevision !== 0) throw invalid('Initial revision must be zero');
          row = await Settings.create({ key: 'businessPolicies', value, revision: 1, policyHistory: [{ reason: input.reason, actorId: ctx.actorId, at: now(), revision: 1, value }], auditOutbox: [event('business_policy_created', ctx)] });
          await commerce.flush(Settings, row);
        } else row = await update(Settings, row, input.expectedRevision, { value, policyHistory: [...(row.policyHistory ?? []).map(plain), { reason: input.reason, actorId: ctx.actorId, at: now(), revision: row.revision + 1, value }].slice(-100) }, 'business_policy_updated', ctx);
        return { value: row.value, revision: row.revision, history: row.policyHistory ?? [] };
      });
    },
    async policy(kind) {
      const settings = await api.settings(), policy = settings.value?.registrations?.[kind];
      if (!policy || policy.enabled === false || policy.status !== 'active' || !policy.privacyApproved || !policy.documentsApproved || policy.effectiveFrom && Date.parse(policy.effectiveFrom) > Date.now() || policy.effectiveTo && Date.parse(policy.effectiveTo) <= Date.now()) throw blocked('An active effective fee/document/privacy policy is required for this registration category');
      registrationPolicy(policy);
      return { ...policy, configRevision: settings.revision };
    },
    async uploadAllowed() {
      const settings = await api.settings();
      for (const kind of Object.keys(registrationFields)) try { const p = await api.policy(kind); if (p.documents.length || p.guardian?.approved) return; } catch (e) { if (e.status !== 409) throw e; }
      throw blocked('Private registration document collection needs an approved document/privacy policy');
    },
    async documentAllowed(asset, auth) {
      if (!auth || asset.purpose !== 'registration_document' || asset.status !== 'ready' || asset.scan.status !== 'clean') return false;
      const reviewer = grantsFor(auth.user).includes('registrations.documents.review');
      return reviewer || same(asset.ownerUserId, auth.user._id);
    },
    async documentRefs(value) {
      return (await Application.find({ 'documents.assetId': id(String(value)) }).select('_id')).map(a => ({ kind: 'RegistrationApplication', id: String(a._id), status: 'private' }));
    },
    async attach(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'key', 'assetId'], ['expectedRevision', 'key', 'assetId']);
      return coordination.run(async () => {
        const row = await commerce.application(value, auth), p = await api.policy(row.kind);
        if (!['draft', 'needs_changes'].includes(row.status)) throw blocked('Only editable applications accept replacement documents');
        if (!p.documents.some(d => d.key === input.key)) throw invalid('Select a configured document requirement');
        const asset = await publishing.media.linkable(input.assetId, 'registration_document', auth);
        if (!same(asset.ownerUserId, auth.user._id)) throw new AppError(403, 'FORBIDDEN', 'Only your own document can be attached');
        if (p.upload && (!p.upload.mime.includes(asset.mime) || asset.bytes > p.upload.maxBytes)) throw invalid('Document does not meet the configured upload requirements');
        const documents = [...row.documents.filter(d => d.key !== input.key).map(plain), { key: input.key, assetId: asset._id, status: 'pending' }];
        return commerce.applicationDTO(await update(Application, row, input.expectedRevision, { documents }, 'registration_document_attached', ctx));
      });
    },
    async conditions(row, requireVerified = false) {
      const p = await api.policy(row.kind);
      commerce.eligible({ user: await authService.models.User.findById(row.userId) });
      if (policyContent(row.policySnapshot) !== policyContent(p)) throw blocked('Policy changed; request changes and resubmit for the current policy');
      for (const doc of p.documents) {
        const record = row.documents.find(d => d.key === doc.key);
        if (!record && doc.required === false) continue;
        if (!record || requireVerified && record.status !== 'verified' || !(await Media.exists({ _id: record?.assetId, purpose: 'registration_document', status: 'ready', 'scan.status': 'clean', ownerUserId: row.userId, ...(p.upload ? { mime: { $in: p.upload.mime }, bytes: { $lte: p.upload.maxBytes } } : {}) }))) throw blocked('Required documents must be attached, clean and verified where applicable');
      }
      const dob = row.applicant?.dob;
      if (typeof dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob || Date.parse(dob) > Date.now()) throw invalid('A valid date of birth is required to determine guardian-consent requirements');
      const adultAt = new Date(dob + 'T00:00:00Z'); adultAt.setUTCFullYear(adultAt.getUTCFullYear() + 18);
      if ((adultAt > now() || p.guardian?.appliesTo === 'all') && (!p.guardian?.approved || row.guardianConsent?.version !== p.guardian.version || !row.guardianConsent?.acceptedAt || !row.guardianConsent?.guardianName || requireVerified && !row.guardianConsent?.verifiedAt)) throw blocked('Minor registration requires the configured guardian consent and authorized verification workflow');
      return p;
    },
    async submit(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'declaration', 'guardianConsent'], ['expectedRevision', 'declaration']);
      if (input.declaration !== true) throw invalid('Accept the registration declaration');
      return coordination.run(async () => {
        const row = await commerce.application(value, auth), p = await api.policy(row.kind);
        if (!['draft', 'needs_changes'].includes(row.status)) throw blocked('This application is already submitted');
        let guardianConsent;
        if (input.guardianConsent) {
          object(input.guardianConsent, ['version', 'guardianName', 'relationship', 'accepted'], ['version', 'guardianName', 'relationship', 'accepted']);
          if (input.guardianConsent.accepted !== true || !p.guardian?.approved || input.guardianConsent.version !== p.guardian.version) throw invalid('Accept the current approved guardian declaration');
          guardianConsent = { version: p.guardian.version, guardianName: text(input.guardianConsent.guardianName, 100), relationship: text(input.guardianConsent.relationship, 100), acceptedAt: now() };
          if (!guardianConsent.guardianName.trim() || !guardianConsent.relationship.trim()) throw invalid('Guardian name and relationship required');
        }
        row.policySnapshot = p; row.guardianConsent = guardianConsent;
        await api.conditions(row);
        const changed = await update(Application, row, input.expectedRevision, { policySnapshot: p, feeSnapshot: { amountMinor: p.amountMinor, currency: p.currency, configRevision: p.configRevision, feeRequired: p.feeRequired }, requiredDocuments: p.documents.filter(d => d.required !== false).map(d => d.key), guardianConsent: guardianConsent ?? null, submittedAt: now(), status: 'submitted', paymentState: p.feeRequired ? 'pending' : 'not_required' }, 'registration_submitted', ctx);
        return commerce.applicationDTO(changed);
      });
    },
    async review(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'status', 'reason', 'documentKey', 'documentStatus', 'guardianVerified', 'legalHold'], ['expectedRevision', 'reason']);
      const reason = text(input.reason, 1000); if (!reason.trim()) throw invalid('Review reason required');
      return coordination.run(async () => {
        const row = await Application.findById(id(value)); if (!row) throw missing();
        const fields = {}, grants = grantsFor(auth.user);
        if (row.history.length >= 100) throw blocked('Review history requires archival');
        if (input.documentKey || 'guardianVerified' in input || 'legalHold' in input) {
          if (!grants.includes('registrations.documents.review')) throw new AppError(403, 'FORBIDDEN', 'Document reviewer permission required');
          if (input.documentKey) {
            if (!['verified', 'rejected'].includes(input.documentStatus)) throw invalid('Invalid document review');
            if (!row.documents.some(d => d.key === input.documentKey)) throw invalid('Document not attached');
            fields.documents = row.documents.map(d => d.key === input.documentKey ? { ...plain(d), status: input.documentStatus, reason, reviewedBy: ctx.actorId, reviewedAt: now() } : plain(d));
            if (input.documentStatus === 'rejected') fields.status = 'needs_changes';
          }
          if ('guardianVerified' in input) {
            if (!row.guardianConsent?.acceptedAt) throw blocked('No guardian declaration submitted');
            fields.guardianConsent = { ...plain(row.guardianConsent), verifiedAt: boolean(input.guardianVerified) ? now() : null, reviewedBy: ctx.actorId };
          }
          if ('legalHold' in input) { if (row.personalDataDeletedAt) throw blocked('Personal data deletion already started'); fields.legalHold = boolean(input.legalHold); }
        }
        if (input.status) {
          const transitions = { submitted: ['pending_verification', 'needs_changes', 'rejected'], pending_verification: ['under_review', 'needs_changes', 'rejected'], under_review: ['approved', 'needs_changes', 'rejected'], approved: ['activated', 'needs_changes', 'rejected'], needs_changes: [], rejected: [], activated: [] };
          if (!transitions[row.status]?.includes(input.status)) throw blocked('Invalid registration transition');
          if (['approved', 'activated'].includes(input.status)) {
            if (!grants.includes('registrations.approve') && !grants.includes('registrations.write')) throw new AppError(403, 'FORBIDDEN', 'Registration approval permission required');
            await api.conditions(row, true);
            if (input.status === 'activated' && row.feeSnapshot?.feeRequired && !(await Order.exists({ _id: row.orderId, userId: row.userId, status: 'captured', capturedPaymentId: { $type: 'string' }, 'product.kind': 'registration_fee', 'product.id': row._id, amountMinor: row.feeSnapshot.amountMinor, currency: row.feeSnapshot.currency }))) throw blocked('Verified captured registration fee required before activation');
          }
          fields.status = input.status;
          if (input.status === 'activated') fields.activatedAt = now();
        }
        if (!Object.keys(fields).length) throw invalid('A review change is required');
        fields.history = [...row.history.map(plain), { status: fields.status ?? row.status, reason, actorId: ctx.actorId, at: now() }];
        return commerce.applicationDTO(await update(Application, row, input.expectedRevision, fields, 'registration_reviewed', ctx), true);
      });
    },
    async registrationQuote(value, auth) {
      const row = await commerce.application(value, auth);
      if (!['submitted', 'pending_verification', 'under_review', 'approved'].includes(row.status)) throw blocked('Submit an eligible application before payment');
      await api.conditions(row);
      if (!row.feeSnapshot?.feeRequired || !(row.feeSnapshot.amountMinor > 0)) throw blocked('This registration does not require a paid order');
      return { product: { kind: 'registration_fee', id: row._id, title: row.kind + ' registration', revision: row.policySnapshot.configRevision }, amountMinor: row.feeSnapshot.amountMinor, currency: row.feeSnapshot.currency };
    },
    async fulfillRegistration(order) {
      const row = await Application.findOne({ _id: order.product.id, userId: order.userId });
      if (!row || row.feeSnapshot?.amountMinor !== order.amountMinor || !row.feeSnapshot?.feeRequired) throw blocked('Registration payment does not match the submitted fee');
      if (row.orderId && !same(row.orderId, order._id)) throw blocked('Registration already bound to another order');
      if (row.paymentState === 'verified' && same(row.orderId, order._id)) return row;
      return update(Application, row, row.revision, { orderId: order._id, paymentState: 'verified' }, 'registration_fee_verified', { actorId: 'system' });
    },
    async refund(value, input, auth, ctx) {
      object(input, ['reason', 'evidence', 'idempotencyKey', 'reasonCategory'], ['reason', 'idempotencyKey']); key(input.idempotencyKey);
      const reason = text(input.reason, 2000), evidence = text(input.evidence ?? '', 2000); if (!reason.trim()) throw invalid('Refund reason required');
      const order = await commerce.owned(value, auth);
      if (order.status !== 'captured') throw blocked('Only captured orders accept refund requests');
      const settings = await api.settings(), configured = settings.value?.refunds;
      // Existing requests remain retryable after policy changes; new requests use current approved policy.
      let eligibility;
      if (!order.refundRequest) {
        if (!configured?.approved || !configured.enabled || Date.parse(configured.effectiveFrom) > Date.now()) throw blocked('Refund requests require an enabled, approved effective refund policy');
        const p = refundPolicy(configured), category = p.categories[order.product.kind];
        if (!category?.enabled || !category.reasons.includes(input.reasonCategory)) throw blocked('Select an eligible configured refund reason category');
        if ((category.evidenceRequired ?? p.evidenceRequired) && !evidence.trim()) throw invalid('Refund evidence is required by this policy');
        if (!order.capturedAt || !order.capturedPaymentId) throw blocked('Verified payment capture evidence is required');
        const age = Date.now() - new Date(order.capturedAt).getTime();
        if (age < 0) throw blocked('Invalid capture timestamp');
        const outsideWindow = order.product.kind === 'course_plan' && age > p.courseWindowDays * 86400000;
        if (outsideWindow && p.outsideWindow === 'deny') throw blocked('Course refund request is outside the configured capture-based window');
        eligibility = { policyVersion: p.version, configRevision: settings.revision, courseWindowDays: p.courseWindowDays, outsideWindow, reasonCategory: input.reasonCategory, accessAfterConfirmedRefund: p.accessAfterConfirmedRefund };
      }
      const result = await commerce.change(order._id, 'refund_requested', current => {
        if (current.refundRequest) {
          if (current.refundRequest.idempotencyKey !== input.idempotencyKey || current.refundRequest.reason !== reason || current.refundRequest.evidence !== evidence || current.refundRequest.eligibility?.reasonCategory !== input.reasonCategory) throw blocked('An existing refund request must be reviewed first');
          return null;
        }
        return { refundRequest: { reason, evidence, eligibility, idempotencyKey: input.idempotencyKey, status: 'pending', providerStatus: 'not_executed', requestedAt: now() } };
      }, ctx);
      return plain(result.refundRequest);
    },
    async refundReview(value, input, ctx) {
      object(input, ['status', 'reason', 'expectedRevision'], ['status', 'reason', 'expectedRevision']);
      if (!['approved', 'rejected'].includes(input.status) || !text(input.reason, 2000).trim()) throw invalid('Review decision and reason required');
      const row = await Order.findById(id(value)); if (!row) throw missing();
      const changed = await commerce.change(row._id, 'refund_reviewed', current => {
        if (current.revision !== revision(input.expectedRevision) || current.refundRequest?.status !== 'pending' || current.status !== 'captured') throw blocked('Refund request changed or is not reviewable');
        return { refundRequest: { ...plain(current.refundRequest), status: input.status, reviewReason: input.reason, reviewedBy: ctx.actorId, reviewedAt: now(), providerStatus: 'not_executed' } };
      }, ctx);
      return plain(changed.refundRequest);
    },
    async franchiseFees() { return franchiseFeeStatus((await api.settings()).value?.franchise); },
    async refundOptions() {
      const p = (await api.settings()).value?.refunds;
      return { available: Boolean(p?.approved && p.enabled && Date.parse(p.effectiveFrom) <= Date.now()), policy: p ? { version: p.version, courseWindowDays: p.courseWindowDays, outsideWindow: p.outsideWindow, evidenceRequired: p.evidenceRequired, categories: p.categories } : null };
    },
    async invoiceDraft(order, auth) {
      const settings = await api.settings();
      return { reference: 'DRAFT-' + order.reference, status: 'draft', officialTaxInvoice: false, complianceApproved: false, seller: settings.value?.invoice ?? {}, customer: { name: auth.user.name, email: auth.user.emailNormalized }, lines: [{ title: order.product.title, quantity: 1, amountMinor: order.amountMinor }], currency: order.currency, totalMinor: order.amountMinor, taxFields: null, verifiedPaymentReference: order.status === 'captured' ? order.capturedPaymentId : null, paymentMode: order.paymentMode, simulated: order.simulated };
    },
    async accessRequest(input, auth, ctx) {
      object(input, ['userId', 'kind', 'resourceId', 'expiresAt', 'reason', 'idempotencyKey'], ['userId', 'kind', 'resourceId', 'expiresAt', 'reason', 'idempotencyKey']); key(input.idempotencyKey);
      if (!['book', 'course'].includes(input.kind)) throw invalid('Invalid access kind');
      const expiresAt = date(input.expiresAt), reason = text(input.reason, 2000); if (expiresAt <= now() || !reason.trim()) throw invalid('Future expiry and mandatory reason required');
      const target = await authService.models.User.findOne(/^[a-f0-9]{24}$/i.test(input.userId) ? { _id: id(input.userId) } : { publicId: text(input.userId, 100) });
      if (!target) throw missing(); commerce.eligible({ user: target });
      const resource = input.kind === 'book' ? await publishing.models.Book.exists({ _id: id(input.resourceId), status: 'published' }) : await commerce.learning.models.Course.exists({ _id: id(input.resourceId), status: 'published' });
      if (!resource) throw missing();
      const fields = { userId: target._id, kind: input.kind, resourceId: id(input.resourceId), expiresAt, reason, requestedBy: ctx.actorId, idempotencyKey: input.idempotencyKey };
      const prior = await AccessRequest.findOne({ requestedBy: ctx.actorId, idempotencyKey: input.idempotencyKey });
      if (prior) { if (prior.reason !== reason || !same(prior.resourceId, fields.resourceId) || !same(prior.userId, fields.userId) || +prior.expiresAt !== +expiresAt || prior.kind !== input.kind) throw blocked('Request key already used'); return plain(prior); }
      const row = await AccessRequest.create({ ...fields, auditOutbox: [event('exceptional_access_requested', ctx)] }); await commerce.flush(AccessRequest, row); return plain(row);
    },
    async accessReview(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'decision', 'reason'], ['expectedRevision', 'decision', 'reason']);
      if (!['issued', 'rejected'].includes(input.decision) || !text(input.reason, 2000).trim()) throw invalid('Decision and reason required');
      return coordination.run(async () => {
        const row = await AccessRequest.findById(id(value)); if (!row) throw missing();
        if (!['pending', 'issued'].includes(row.status) || row.expiresAt <= now()) throw blocked('Request is not issuable');
        if (input.decision === 'issued') {
          const policy = (await api.settings()).value?.manualAccess;
          if (!policy?.approved) throw new AppError(409, 'MANUAL_GRANT_POLICY_PENDING', 'An approved exceptional access policy is required; no payment is recorded');
          const owner = await authService.models.User.findById(row.userId); commerce.eligible({ user: owner });
          if (row.kind === 'book') {
            const book = await publishing.models.Book.findById(row.resourceId);
            if (book?.status !== 'published' || !book.publishedSnapshot?.rightsConfirmed || !book.publishedSnapshot?.rightsNote) throw blocked('Published licensed book required');
            if (!await Media.exists({ _id: book.publishedSnapshot.documentAssetId, purpose: 'book_full', status: 'ready', 'scan.status': 'clean' })) throw blocked('Clean ready book delivery required');
            const existing = await BookEntitlement.findOne({ userId: row.userId, bookId: row.resourceId });
            if (existing && !same(existing.grantId, row._id)) throw blocked('Existing rights must not be overwritten by exceptional grants');
            await BookEntitlement.updateOne({ userId: row.userId, bookId: row.resourceId, grantId: row._id }, { $setOnInsert: { source: 'manual', expiresAt: row.expiresAt, grantedAt: now(), simulated: false } }, { upsert: true, runValidators: true });
          } else await commerce.learning.issueManual(row, auth);
        }
        const changed = await update(AccessRequest, row, input.expectedRevision, { status: input.decision, reviewReason: input.reason, reviewedBy: ctx.actorId }, 'exceptional_access_reviewed', ctx);
        return plain(changed);
      });
    },
    async manualValid(row) {
      return Boolean(row?.grantId && row.expiresAt > now() && (await api.settings()).value?.manualAccess?.approved && await AccessRequest.exists({ _id: row.grantId, userId: row.userId, resourceId: row.bookId ?? row.courseId, status: 'issued', expiresAt: { $gt: now() } }));
    },
    async purge(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'reason'], ['expectedRevision', 'reason']);
      if (!text(input.reason, 1000).trim()) throw invalid('Deletion reason required');
      const changed = await coordination.run(async () => {
        const row = await Application.findById(id(value)); if (!row) throw missing();
        const p = await api.policy(row.kind);
        if (row.legalHold || !p.retentionDays || !['rejected', 'activated'].includes(row.status) || !row.personalDataDeletedAt && row.updatedAt.getTime() + p.retentionDays * 86400000 > Date.now()) throw blocked('Approved retention period, terminal state and absence of legal hold are required');
        // Hold changes share this mutex. Mark redaction and durable file cleanup
        // atomically before disk operations; retries keep exact asset identities.
        return update(Application, row, input.expectedRevision, { applicant: {}, guardianConsent: null, documents: [], deletionAssets: [...new Set([...(row.deletionAssets ?? []).map(String), ...row.documents.map(d => String(d.assetId))])], personalDataDeletedAt: row.personalDataDeletedAt ?? now() }, 'registration_personal_data_redacted', ctx);
      });
      for (const assetId of changed.deletionAssets) {
        const asset = await Media.findById(assetId);
        if (asset && !['deleted', 'failed'].includes(asset.status)) await publishing.media.remove(String(assetId), { expectedRevision: asset.revision }, ctx);
        await Application.updateOne({ _id: changed._id }, { $pull: { deletionAssets: assetId } });
      }
      return commerce.applicationDTO(await Application.findById(changed._id), true);
    }
  };
  return api;
}
