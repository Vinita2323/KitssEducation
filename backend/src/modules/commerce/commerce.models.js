import mongoose from 'mongoose';

export function createCommerceModels(connection) {
  const { Schema } = mongoose;
  const options = { timestamps: true, strict: 'throw', bufferCommands: false, writeConcern: { w: 1, j: true } };
  const event = new Schema({ id: String, action: String, actorId: String, at: Date, requestId: String }, { _id: false });
  const attempt = new Schema({ paymentId: String, status: String, observedAt: Date, source: String }, { _id: false });
  const order = new Schema({
    reference: { type: String, unique: true, required: true }, userId: { type: Schema.Types.ObjectId, required: true },
    product: { kind: String, id: Schema.Types.ObjectId, title: String, revision: Number, documentAssetId: Schema.Types.ObjectId, courseId: Schema.Types.ObjectId, durationDays: Number, durationMonths: Number, eligibility: String, purchaseSlot: String },
    amountMinor: { type: Number, required: true, min: 1, validate: Number.isSafeInteger }, currency: { type: String, enum: ['INR'], required: true },
    paymentMode: { type: String, enum: ['test'], required: true }, provider: { type: String, enum: ['razorpay', 'fake'], required: true }, providerScope: String, simulated: { type: Boolean, required: true },
    idempotencyKey: { type: String, required: true }, requestHash: String, revision: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'authorized', 'captured'], default: 'pending' }, expiresAt: Date,
    creation: { state: { type: String, enum: ['pending', 'creating', 'ready', 'unknown'], default: 'pending' }, key: String, startedAt: Date },
    providerOrderId: String, paymentReferences: [String], capturedPaymentId: String, capturedAt: Date,
    attempts: { type: [attempt], default: [] }, evidence: { source: String, verifiedAt: Date, providerCreatedAt: Number },
    fulfillment: { state: { type: String, enum: ['pending', 'applied', 'blocked'], default: 'pending' }, effectId: Schema.Types.ObjectId, appliedAt: Date },
    reconcile: { state: { type: String, enum: ['pending', 'leased', 'done', 'dead'], default: 'pending' }, nextAt: { type: Date, default: Date.now }, leaseUntil: Date, token: String, attempts: { type: Number, default: 0 }, lastError: String },
    refundRequest: Schema.Types.Mixed, investigation: String, auditOutbox: { type: [event], default: [] },
  }, options);
  order.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
  // Dates also remain indexable when the optional environment filter is absent.
  order.index({ status: 1, capturedAt: 1, paymentMode: 1 });
  order.index({ createdAt: 1, paymentMode: 1 });
  order.index({ 'attempts.observedAt': 1, paymentMode: 1 });
  order.index({ provider: 1, paymentMode: 1, providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: 'string' } } });
  order.index({ provider: 1, paymentMode: 1, paymentReferences: 1 }, { unique: true, partialFilterExpression: { 'paymentReferences.0': { $exists: true } } });
  order.index({ userId: 1, 'product.kind': 1, 'product.id': 1 }, { unique: true, name: 'unique_book_purchase', partialFilterExpression: { 'product.kind': 'book' } }); // one permanent book purchase aggregate per owner/product
  // One chargeable order per initial/expired purchase period, even across plans.
  order.index({ userId: 1, 'product.courseId': 1, 'product.purchaseSlot': 1 }, { unique: true, name: 'unique_course_purchase_period', partialFilterExpression: { 'product.kind': 'course_plan' } });
  order.index({ userId: 1, 'product.id': 1 }, { unique: true, name: 'unique_registration_fee', partialFilterExpression: { 'product.kind': 'registration_fee' } });
  order.index({ 'reconcile.state': 1, 'reconcile.nextAt': 1, 'reconcile.leaseUntil': 1 });
  const entitlement = new Schema({ revision: { type: Number, default: 1 }, updatedBy: String, auditOutbox: { type: [event], default: [] }, userId: { type: Schema.Types.ObjectId, required: true }, bookId: { type: Schema.Types.ObjectId, required: true }, orderId: { type: Schema.Types.ObjectId }, grantId: Schema.Types.ObjectId, source: { type: String, enum: ['purchase', 'free', 'manual'], default: 'purchase' }, grantedAt: Date, expiresAt: Date, revokedAt: Date, revokeReason: String, simulated: Boolean }, options);
  entitlement.index({ userId: 1, bookId: 1 }, { unique: true });
  entitlement.index({ orderId: 1 }, { unique: true, partialFilterExpression: { orderId: { $type: 'objectId' } }, name: 'unique_paid_book_source' });
  const job = new Schema({ key: { type: String, unique: true, required: true }, kind: { type: String, enum: ['payment_event', 'result_import'], required: true }, requestHash: String, resultSummary: Schema.Types.Mixed, provider: String, scope: String, paymentId: String, providerOrderId: String, state: { type: String, enum: ['pending', 'leased', 'done', 'dead'], default: 'pending' }, attempts: { type: Number, default: 0 }, availableAt: { type: Date, default: Date.now }, leaseUntil: Date, token: String, lastError: String }, options);
  job.index({ state: 1, availableAt: 1, leaseUntil: 1 });
  const application = new Schema({ reference: { type: String, required: true, unique: true }, userId: { type: Schema.Types.ObjectId, required: true }, kind: { type: String, enum: ['study', 'tuition', 'teacher', 'coaching-profile'], required: true }, applicant: Schema.Types.Mixed, idempotencyKey: String, requestHash: String, revision: { type: Number, default: 1 }, status: { type: String, enum: ['draft', 'submitted', 'pending_verification', 'under_review', 'needs_changes', 'approved', 'rejected', 'activated'], default: 'draft' }, paymentState: { type: String, enum: ['blocked', 'pending', 'not_required', 'verified'], default: 'blocked' }, orderId: Schema.Types.ObjectId, feeSnapshot: Schema.Types.Mixed, policySnapshot: Schema.Types.Mixed, guardianConsent: Schema.Types.Mixed, submittedAt: Date, activatedAt: Date, legalHold: { type: Boolean, default: false }, personalDataDeletedAt: Date, deletionAssets: [Schema.Types.ObjectId], history: { type: [Schema.Types.Mixed], default: [] }, documents: { type: [new Schema({ key: String, assetId: Schema.Types.ObjectId, status: { type: String, enum: ['pending', 'verified', 'rejected'] }, reason: String, reviewedBy: String, reviewedAt: Date }, { _id: false })], default: [] }, requiredDocuments: [String], notes: [{ _id: false, id: String, text: String, actorId: String, at: Date }], auditOutbox: { type: [event], default: [] } }, options);
  application.index({ userId: 1, idempotencyKey: 1 }, { unique: true });
  const accessRequest = new Schema({ userId: { type: Schema.Types.ObjectId, required: true }, kind: { type: String, enum: ['book', 'course'], required: true }, resourceId: { type: Schema.Types.ObjectId, required: true }, expiresAt: { type: Date, required: true }, reason: { type: String, required: true, maxlength: 2000 }, requestedBy: String, idempotencyKey: String, status: { type: String, enum: ['pending', 'issued', 'rejected'], default: 'pending' }, reviewReason: String, reviewedBy: String, revision: { type: Number, default: 1 }, auditOutbox: { type: [event], default: [] } }, options);
  accessRequest.index({ requestedBy: 1, idempotencyKey: 1 }, { unique: true });
  const model = (name, schema, collection) => connection.models[name] ?? connection.model(name, schema, collection);
  return { AccessRequest: model('AccessRequest', accessRequest, 'accessRequests'), Order: model('Order', order, 'orders'), BookEntitlement: model('BookEntitlement', entitlement, 'bookEntitlements'), Job: model('Job', job, 'jobs'), RegistrationApplication: model('RegistrationApplication', application, 'registrationApplications') };
}
