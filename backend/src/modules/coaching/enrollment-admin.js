import { escapeRegex } from '../../utils/escapeRegex.js';
import { AppError } from '../../utils/AppError.js';
import { object, id, revision, text, invalid } from '../publishing/validation.js';
import { integer } from './validation.js';

const DAY = 86400000, EXPIRING_DAYS = 7;
const states = ['active', 'expiring', 'expired', 'revoked', 'blocked'];

// Staff review of course enrollments and book access. Each list is one aggregation that
// joins the student, product, plan/order and grant, and derives the same access state the
// learner-facing checks use (coaching enrollment() and commerce canReadAsset()).
export function createEnrollmentAdmin({ models, commerce, publishing, authService, coordination }) {
  const { Enrollment, Course, CoursePlan, Lesson, LearningProgress } = models;
  const { Order, BookEntitlement, AccessRequest } = commerce.models;
  const { User, AuditLog } = authService.models;
  const kinds = {
    course: { Model: Enrollment, product: Course, productField: 'courseId', titlePath: { $ifNull: ['$product.publishedSnapshot.title', '$product.title'] }, paid: 'paid', revokedAction: 'enrollment_revoked' },
    book: { Model: BookEntitlement, product: publishing.models.Book, productField: 'bookId', titlePath: { $ifNull: ['$product.publishedSnapshot.title', '$product.title'] }, paid: 'purchase', revokedAction: 'book_access_revoked' }
  };
  const kindOf = value => { if (!['course', 'book'].includes(value ?? 'course')) throw invalid('Invalid access kind'); return kinds[value ?? 'course']; };
  const one = (from, local, as, project) => [{ $lookup: { from, localField: local, foreignField: '_id', as, pipeline: [{ $project: project }] } }, { $set: { [as]: { $first: '$' + as } } }];

  // Shared stages: join everything a row shows, then compute its state.
  async function stages(k, now) {
    const manualApproved = Boolean((await commerce.business.settings()).value?.manualAccess?.approved);
    const sourceOk = { $switch: { branches: [
      { case: { $eq: ['$source', 'free'] }, then: true },
      { case: { $eq: ['$source', 'manual'] }, then: { $and: [manualApproved, { $eq: ['$grant.status', 'issued'] }, { $gt: ['$grant.expiresAt', now] }, { $gt: ['$expiresAt', now] }] } }
    ], default: k === kinds.book
      ? { $and: [{ $eq: ['$order.status', 'captured'] }, { $eq: ['$order.fulfillment.state', 'applied'] }] }
      : { $eq: ['$order.status', 'captured'] } } };
    const ends = k === kinds.book ? { $ifNull: ['$expiresAt', null] } : '$expiresAt';
    return [
      ...one(User.collection.name, 'userId', 'student', { name: 1, emailNormalized: 1, status: 1, emailVerifiedAt: 1 }),
      ...one(k.product.collection.name, k.productField, 'product', { title: 1, 'publishedSnapshot.title': 1, status: 1, thumbnailId: 1, 'publishedSnapshot.thumbnailId': 1, coverAssetId: 1, 'publishedSnapshot.coverAssetId': 1 }),
      ...one(Order.collection.name, 'orderId', 'order', { reference: 1, status: 1, amountMinor: 1, 'fulfillment.state': 1, simulated: 1 }),
      ...one(AccessRequest.collection.name, 'grantId', 'grant', { status: 1, expiresAt: 1 }),
      ...(k === kinds.course ? one(CoursePlan.collection.name, 'planId', 'plan', { name: 1, priceMinor: 1, durationDays: 1, durationMonths: 1 }) : []),
      { $set: { ends, title: k.titlePath, userOk: { $and: [{ $eq: ['$student.status', 'active'] }, { $ne: [{ $ifNull: ['$student.emailVerifiedAt', null] }, null] }] }, sourceOk } },
      { $set: { state: { $switch: { branches: [
        { case: { $ne: [{ $ifNull: ['$revokedAt', null] }, null] }, then: 'revoked' },
        { case: { $and: [{ $ne: ['$ends', null] }, { $lte: ['$ends', now] }] }, then: 'expired' },
        { case: { $and: ['$userOk', '$sourceOk', ...(k === kinds.course ? [{ $lte: ['$startsAt', now] }] : [])] }, then: 'active' }
      ], default: 'blocked' } } } },
      { $set: { expiringSoon: { $and: [{ $eq: ['$state', 'active'] }, { $ne: ['$ends', null] }, { $lte: ['$ends', new Date(now.getTime() + EXPIRING_DAYS * DAY)] }] } } }
    ];
  }

  function filters(query, k) {
    const match = {};
    if (query.state && query.state !== 'all') {
      if (!states.includes(query.state)) throw invalid('Invalid access state');
      if (query.state === 'expiring') match.expiringSoon = true; else match.state = query.state;
    }
    if (query.source) {
      const allowed = k === kinds.course ? ['paid', 'free', 'manual'] : ['purchase', 'free', 'manual'];
      if (!allowed.includes(query.source)) throw invalid('Invalid access source');
      match.source = query.source;
    }
    if (query.productId) match[k.productField] = id(query.productId);
    if (query.userId) match.userId = id(query.userId);
    if (query.q) {
      const q = new RegExp(escapeRegex(text(query.q, 160)), 'i');
      match.$or = [{ 'student.name': q }, { 'student.emailNormalized': q }, { title: q }, { 'order.reference': q }];
    }
    return match;
  }

  async function progressFor(rows) {
    const courseIds = [...new Set(rows.map(r => String(r.courseId)))].map(value => id(value)), userIds = [...new Set(rows.map(r => String(r.userId)))].map(value => id(value));
    const [lessons, progress] = await Promise.all([
      Lesson.find({ courseId: { $in: courseIds }, status: 'published' }).select('courseId videoAssetId').lean(),
      LearningProgress.find({ userId: { $in: userIds }, courseId: { $in: courseIds }, resourceType: 'lesson' }).select('userId courseId lessonId status videoAssetId lastActivityAt').lean()
    ]);
    return row => {
      const live = lessons.filter(l => String(l.courseId) === String(row.courseId)), mine = progress.filter(p => String(p.userId) === String(row.userId) && String(p.courseId) === String(row.courseId));
      // Matches coaching currentProgress(): a replaced video resets that lesson's completion.
      const completed = mine.filter(p => { const lesson = live.find(l => String(l._id) === String(p.lessonId)); return lesson && p.status === 'completed' && (!lesson.videoAssetId || String(p.videoAssetId) === String(lesson.videoAssetId)); }).length;
      const last = mine.reduce((latest, p) => !latest || p.lastActivityAt > latest ? p.lastActivityAt : latest, null);
      return { completedLessons: completed, totalLessons: live.length, progressPercentage: live.length ? Math.round(completed / live.length * 100) : 0, lastActivityAt: last };
    };
  }

  const dto = (k, row, progress) => ({
    id: String(row._id), revision: row.revision ?? 1, kind: k === kinds.course ? 'course' : 'book', state: row.state, expiringSoon: row.expiringSoon,
    source: row.source, simulated: Boolean(row.simulated), userId: String(row.userId), orderId: row.orderId ? String(row.orderId) : null,
    student: row.student ? { name: row.student.name, email: row.student.emailNormalized, status: row.student.status } : null,
    productId: String(row[k.productField]), title: row.title || (k === kinds.course ? 'Unavailable course' : 'Archived/unavailable book'),
    productStatus: row.product?.status ?? null,
    order: row.order ? { reference: row.order.reference, status: row.order.status, amountMinor: row.order.amountMinor } : null,
    startsAt: row.startsAt ?? row.grantedAt ?? row.createdAt, expiresAt: row.expiresAt ?? null, revokedAt: row.revokedAt ?? null, revokeReason: row.revokeReason ?? null,
    ...(k === kinds.course ? { courseId: String(row.courseId), plan: row.plan ? { name: row.plan.name, priceMinor: row.plan.priceMinor, durationDays: row.plan.durationDays, durationMonths: row.plan.durationMonths } : null, renewals: (row.purchaseHistory ?? []).length, course: { id: String(row.courseId), title: row.title || 'Unavailable course' }, ...progress?.(row) }
      : { bookId: String(row.bookId), grantedAt: row.grantedAt, sourceVerified: row.sourceOk === true && row.source === 'purchase' })
  });

  return {
    async list(query = {}) {
      object(query, ['kind', 'state', 'source', 'q', 'productId', 'userId', 'courseId', 'bookId', 'page', 'pageSize']);
      for (const v of Object.values(query)) if (typeof v !== 'string') throw invalid('Invalid query');
      const k = kindOf(query.kind), page = integer(Number(query.page ?? 1), 1, 100000), pageSize = integer(Number(query.pageSize ?? 20), 1, 100);
      // Older callers filter with courseId/bookId; both mean the product.
      const productId = query.productId ?? query.courseId ?? query.bookId;
      const match = filters({ ...query, productId }, k), now = new Date();
      const [result] = await k.Model.aggregate([...await stages(k, now), { $facet: {
        counts: [{ $group: { _id: null, active: { $sum: { $cond: [{ $eq: ['$state', 'active'] }, 1, 0] } }, expiring: { $sum: { $cond: ['$expiringSoon', 1, 0] } }, expired: { $sum: { $cond: [{ $eq: ['$state', 'expired'] }, 1, 0] } }, revoked: { $sum: { $cond: [{ $eq: ['$state', 'revoked'] }, 1, 0] } }, blocked: { $sum: { $cond: [{ $eq: ['$state', 'blocked'] }, 1, 0] } } } }],
        rows: [{ $match: match }, { $sort: query.state === 'expiring' ? { ends: 1, _id: 1 } : { createdAt: -1, _id: -1 } }, { $skip: (page - 1) * pageSize }, { $limit: pageSize }],
        total: [{ $match: match }, { $count: 'n' }]
      } }]).option({ maxTimeMS: 15000 });
      const progress = k === kinds.course && result.rows.length ? await progressFor(result.rows) : null;
      const { _id, ...summary } = result.counts[0] ?? { active: 0, expiring: 0, expired: 0, revoked: 0, blocked: 0 };
      const total = result.total[0]?.n ?? 0;
      return { data: result.rows.map(row => dto(k, row, progress)), summary, meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
    },
    async detail(value, kindValue) {
      const k = kindOf(kindValue), now = new Date();
      const [row] = await k.Model.aggregate([{ $match: { _id: id(value) } }, ...await stages(k, now)]);
      if (!row) throw new AppError(404, 'NOT_FOUND', 'Access record was not found');
      const progress = k === kinds.course ? await progressFor([row]) : null;
      const orderIds = [row.orderId, ...(row.purchaseHistory ?? []).map(p => p.orderId)].filter(Boolean);
      const orders = await Order.find({ _id: { $in: orderIds } }).select('reference status amountMinor capturedAt createdAt product.title').lean();
      const history = await AuditLog.find({ subjectId: String(row._id) }).select('action actorId at reason').sort({ at: -1 }).limit(50).lean();
      return { ...dto(k, row, progress), payments: orders.map(o => ({ id: String(o._id), reference: o.reference, status: o.status, amountMinor: o.amountMinor, title: o.product?.title, paidAt: o.capturedAt ?? null, createdAt: o.createdAt })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        periods: (row.purchaseHistory ?? []).map(p => ({ orderId: p.orderId ? String(p.orderId) : null, startsAt: p.startsAt, expiresAt: p.expiresAt })),
        history: history.map(a => ({ action: a.action, actorId: a.actorId, at: a.at, reason: a.reason })) };
    },
    // Undo a revocation. The learner-facing checks still apply afterwards (payment, expiry, account).
    async restore(value, input, ctx) {
      object(input, ['kind', 'reason', 'expectedRevision'], ['kind', 'reason', 'expectedRevision']);
      const k = kindOf(input.kind), reason = text(input.reason, 2000);
      if (!reason.trim()) throw invalid('A reason is required to restore access');
      return coordination.run(async () => {
        const row = await k.Model.findById(id(value));
        if (!row) throw new AppError(404, 'NOT_FOUND', 'Access record was not found');
        if (!row.revokedAt) throw invalid('Access is not revoked');
        const event = coordination.event(k === kinds.course ? 'enrollment_restored' : 'book_access_restored', ctx);
        const changed = await k.Model.findOneAndUpdate({ _id: row._id, revision: revision(input.expectedRevision), 'auditOutbox.999': { $exists: false } },
          { $set: { revokedAt: null, revokeReason: null, updatedBy: ctx.actorId }, $inc: { revision: 1 }, $push: { auditOutbox: event } },
          { returnDocument: 'after', runValidators: true });
        if (!changed) throw new AppError(409, 'REVISION_CONFLICT', 'Access changed; refresh before retrying');
        await coordination.flush(k.Model, changed);
        // The outbox event schema has no reason field; record it on the delivered audit entry.
        await AuditLog.updateOne({ _id: event.id }, { $set: { reason: reason.slice(0, 500) } });
        return { id: String(changed._id), revision: changed.revision, revokedAt: null };
      });
    }
  };
}
