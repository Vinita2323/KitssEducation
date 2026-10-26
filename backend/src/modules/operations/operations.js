import { escapeRegex } from '../../utils/escapeRegex.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { requirePermission, requireRecentStaffAuthentication } from '../auth/auth.routes.js';
import { permissions, userDTO } from '../auth/security.js';
import { object, text, invalid } from '../publishing/validation.js';

const conflict = () => new AppError(409, 'ACCOUNT_CHANGED', 'Refresh the account before changing it');
const accountDTO = user => ({ ...userDTO(user), revision: user.adminRevision ?? 0, updatedAt: user.updatedAt, lastLoginAt: user.lastLoginAt });
function reference(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{5,100}$/.test(value)) throw invalid('Invalid account reference');
  return value;
}
function paging(query, keys) {
  object(query, ['page', ...keys]);
  const page = Number(query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) throw invalid('Invalid page');
  return page;
}
function choice(value, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) throw invalid('Invalid filter');
  return value;
}
function literal(value) { return escapeRegex(text(value, 100)); }

export function createOperationsService(authService, { diagnostics } = {}) {
  const { User, AuditLog } = authService.models;
  const connection = User.db;
  async function page(Model, filter, number, project, dto) {
    const total = await Model.countDocuments(filter);
    const rows = await Model.find(filter).select(project).sort({ createdAt: -1, _id: -1 }).skip((number - 1) * 20).limit(20);
    return { data: rows.map(dto), meta: { page: number, total, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) } };
  }
  async function account(value) {
    const user = await User.findOne({ publicId: reference(value) });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'Account was not found');
    return user;
  }
  return {
    async health() {
      const queues = await connection.collection('jobs').aggregate([{ $match: { kind: { $in: ['payment_event','result_import','notification_event','notification_push'] }, state: { $in: ['pending','leased','done','dead'] } } }, { $group: { _id: { kind:'$kind',state:'$state' },count:{ $sum:1 } } }, { $project:{_id:0,kind:'$_id.kind',state:'$_id.state',count:1} }]).toArray();
      let pendingAuditRecords=0;
      const outboxCollections=new Set(Object.values(connection.models).filter(model=>model.schema.path('auditOutbox')).map(model=>model.collection.name));
      for(const name of outboxCollections) pendingAuditRecords+=await connection.collection(name).countDocuments({'auditOutbox.0':{$exists:true}});
      const expiredLeases=await connection.collection('jobs').countDocuments({state:'leased',leaseUntil:{$type:'date',$lte:new Date()}});
      const reconciliation=await connection.collection('orders').aggregate([{$match:{'reconcile.state':{$in:['pending','leased','done','dead']}}},{$group:{_id:'$reconcile.state',count:{$sum:1}}},{$project:{_id:0,state:'$_id',count:1}}]).toArray();
      return { ...(diagnostics ? await diagnostics() : { status:'diagnostics_unavailable' }), queues, pendingAuditRecords, expiredLeases, reconciliation };
    },
    async users(query) {
      const number = paging(query, ['q', 'status', 'role']);
      const filter = {};
      if (query.status) filter.status = choice(query.status, ['pending', 'active', 'suspended', 'archived']);
      if (query.role) filter.roles = choice(query.role, ['student', 'admin', 'super_admin']);
      if (query.q) {
        const match = new RegExp(literal(query.q), 'i');
        filter.$or = [{ name: match }, { emailNormalized: match }, { publicId: match }];
      }
      return page(User, filter, number, 'publicId name emailNormalized roles permissions status emailVerifiedAt phone profile createdAt updatedAt adminRevision lastLoginAt', accountDTO);
    },
    async detail(value) {
      const user = await account(value);
      const [orders, enrollments, registrations] = await Promise.all(['orders', 'enrollments', 'registrationApplications'].map(name => connection.collection(name).countDocuments({ userId: user._id })));
      return { ...accountDTO(user), summary: { orders, enrollments, registrations } };
    },
    async change(value, input, auth, ctx, kind) {
      if (kind === 'roles' && !auth.user.roles.includes('super_admin')) throw new AppError(403, 'FORBIDDEN', 'Only the main admin assigns staff permissions');
      object(input, ['expectedRevision', 'reason', ...(kind === 'status' ? ['status'] : ['roles', 'permissions'])], ['expectedRevision', 'reason']);
      if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw invalid('Invalid revision');
      const reason = text(input.reason, 500);
      if (!reason.trim()) throw invalid('A reason is required');
      const user = await account(value);
      // Super-admin lifecycle stays in the explicit operator bootstrap/recovery
      // boundary. Refusing every API change also prevents concurrent last-admin loss.
      if (String(user._id) === String(auth.user._id) || user.roles.includes('super_admin')) throw new AppError(403, 'PROTECTED_ACCOUNT', 'Self and super-admin changes are not allowed here');
      if (!user.emailVerifiedAt || !['active', 'suspended'].includes(user.status)) throw new AppError(409, 'ACTIVATION_REQUIRED', 'Pending or archived identities cannot be activated by account management');
      if (user.roles.includes('admin') && !auth.user.roles.includes('super_admin')) throw new AppError(403, 'PROTECTED_STAFF', 'Only the main admin can manage staff accounts');
      const fields = { activeSessionId: null, activeSessionExpiresAt: null };
      if (kind === 'status') fields.status = choice(input.status, ['active', 'suspended']);
      else {
        if (!Array.isArray(input.roles) || input.roles.length !== 1 || input.roles[0] !== 'admin' || !user.roles.includes('admin')) throw invalid('Staff creation requires the invitation workflow; super-admin promotion is unavailable');
        if (!Array.isArray(input.permissions) || input.permissions.length > permissions.length || input.permissions.some(p => !permissions.includes(p) || p === 'accounts.roles.manage' || p === 'results.publish' && !user.permissions.includes(p))) throw invalid('Invalid permission assignment');
        fields.roles = ['admin'];
        fields.permissions = [...new Set(input.permissions)];
      }
      const changed = await User.findOneAndUpdate({ _id: user._id, securityVersion: user.securityVersion, roles: { $nin: ['super_admin'] }, status: user.status,
        ...(input.expectedRevision === 0 ? { $or: [{ adminRevision: 0 }, { adminRevision: { $exists: false } }] } : { adminRevision: input.expectedRevision }),
        'auditOutbox.999': { $exists: false } }, {
        $set: fields, $inc: { securityVersion: 1, adminRevision: 1 }, $unset: { challenges: 1 },
        $push: { auditOutbox: { id: randomUUID(), action: 'account_' + kind + '_changed', actorId: ctx.actorId, requestId: ctx.requestId, reason, ...(kind === 'roles' ? { permissionChange: { before: user.permissions, after: fields.permissions } } : {}), at: new Date() } }
      }, { returnDocument: 'after', runValidators: true });
      if (!changed) throw conflict();
      await authService.flushAudit(changed);
      // securityVersion already denies ALL old sessions even if cleanup fails.
      return accountDTO(changed);
    },
    async audit(query) {
      const number = paging(query, ['actor', 'action', 'resource', 'from', 'to']);
      const filter = {};
      for (const [key, field] of [['actor', 'actorId'], ['action', 'action'], ['resource', 'subjectId']]) if (query[key]) filter[field] = text(query[key], 100);
      if (query.from || query.to) {
        filter.at = {};
        for (const [key, op] of [['from', '$gte'], ['to', '$lte']]) if (query[key]) {
          if (!/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?$/.test(query[key]) || !Number.isFinite(Date.parse(query[key]))) throw invalid('Invalid audit date');
          filter.at[op] = new Date(query[key]);
        }
        if (filter.at.$gte > filter.at.$lte) throw invalid('Invalid audit range');
      }
      const total = await AuditLog.countDocuments(filter);
      const rows = await AuditLog.find(filter).sort({ at: -1, _id: -1 }).skip((number - 1) * 20).limit(20).lean();
      return { data: rows.map(r => ({ id: r._id, action: r.action, actorId: r.actorId, resource: r.subjectId, at: r.at, requestId: r.requestId, reason: r.reason, permissionChange: r.permissionChange })), meta: { page: number, total, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) } };
    },
    async jobs(query) {
      const number = paging(query, ['kind', 'state']);
      const filter = {};
      if (query.kind) filter.kind = choice(query.kind, ['payment_event', 'result_import', 'notification_event', 'notification_push']);
      if (query.state) filter.state = choice(query.state, ['pending', 'leased', 'done', 'dead']);
      const collection = connection.collection('jobs');
      const total = await collection.countDocuments(filter);
      const rows = await collection.find(filter, { projection: { kind: 1, state: 1, attempts: 1, availableAt: 1, leaseUntil: 1, createdAt: 1, updatedAt: 1 } }).sort({ createdAt: -1, _id: -1 }).skip((number - 1) * 20).limit(20).toArray();
      return { data: rows.map(r => ({ ...r, id: String(r._id), _id: undefined })), meta: { page: number, total, pageSize: 20, totalPages: Math.max(1, Math.ceil(total / 20)) } };
    },
    async counts() {
      const definitions = { accounts: ['users', {}], universities: ['universities', {}], colleges: ['colleges', {}], admissions: ['admissionApplications', {}], franchises: ['franchiseApplications', {}], registrationDrafts: ['registrationApplications', {}], books: ['books', {}], courses: ['coachingCourses', {}], enrollments: ['enrollments', {}], notifications: ['notifications', {}] };
      return { asOf: new Date(), totals: Object.fromEntries(await Promise.all(Object.entries(definitions).map(async ([key, [name, filter]]) => [key, await connection.collection(name).countDocuments(filter)]))) };
    }
  };
}

export function createOperationsRouter(service, authService) {
  const router = express.Router();
  const send = (req, res, result) => res.json({ ...result, requestId: req.requestId });
  router.get('/admin/users', requirePermission('accounts.read'), async (req, res) => send(req, res, await service.users(req.query)));
  router.get('/admin/users/:id', requirePermission('accounts.read'), async (req, res) => send(req, res, { data: await service.detail(req.params.id) }));
  for (const kind of ['status', 'roles']) router.patch('/admin/users/:id/' + kind, requirePermission(kind === 'status' ? 'accounts.manage' : 'accounts.roles.manage'), requireRecentStaffAuthentication, async (req, res) => {
    const ctx = { actorId: req.auth.user.publicId, requestId: req.requestId, ip: req.ip };
    await authService.limit(ctx, ctx.actorId, 'account-management', 30);
    send(req, res, { data: await service.change(req.params.id, req.body, req.auth, ctx, kind) });
  });
  router.get('/admin/audit-logs', requirePermission('audit.read'), async (req, res) => send(req, res, await service.audit(req.query)));
  router.get('/admin/jobs', requirePermission('operations.read'), async (req, res) => send(req, res, await service.jobs(req.query)));
  router.get('/admin/operations/health', requirePermission('operations.read'), async (req,res) => send(req,res,{data:await service.health()}));
  return router;
}
