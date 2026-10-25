import mongoose from 'mongoose';
import express from 'express';
import { AppError } from '../../utils/AppError.js';
import { requireSession, requirePermission } from '../auth/auth.routes.js';
import { object, id, text, revision, invalid } from '../publishing/validation.js';
export async function createNotificationService({
  connection,
  authService,
  publishingModule,
  coachingService
}) {
  const {
      Schema
    } = mongoose,
    ref = Schema.Types.ObjectId;
  const options = {
    timestamps: true,
    strict: 'throw',
    bufferCommands: false,
    writeConcern: {
      w: 1,
      j: true
    }
  };
  const event = new Schema({
    id: String,
    action: String,
    actorId: String,
    requestId: String,
    at: Date
  }, {
    _id: false
  });
  const schema = new Schema({
    title: String,
    message: String,
    category: {
      type: String,
      enum: ['exam', 'course', 'promotion', 'general']
    },
    link: String,
    audience: {
      kind: {
        type: String,
        enum: ['all_students', 'users', 'course']
      },
      userIds: [ref],
      courseId: ref
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: Date,
    revision: {
      type: Number,
      default: 1
    },
    auditOutbox: [event],
    updatedBy: String
  }, options);
  schema.index({
    status: 1,
    publishedAt: -1
  });
  schema.index({
    'audience.userIds': 1,
    status: 1
  });
  const receipt = new Schema({
    notificationId: {
      type: ref,
      required: true
    },
    userId: {
      type: ref,
      required: true
    },
    readAt: Date
  }, options);
  receipt.index({
    notificationId: 1,
    userId: 1
  }, {
    unique: true
  });
  receipt.index({
    userId: 1,
    readAt: 1
  });
  const Notification = connection.models.Notification ?? connection.model('Notification', schema, 'notifications');
  const Receipt = connection.models.NotificationReceipt ?? connection.model('NotificationReceipt', receipt, 'notificationReceipts');
  const coordination = publishingModule.coordination;
  const dto = row => {
    const {
      _id,
      auditOutbox,
      __v,
      updatedBy,
      ...rest
    } = row.toObject?.() ?? row;
    return {
      ...rest,
      id: String(_id)
    };
  };
  const paging = query => {
    const page = Number(query.page ?? 1),
      pageSize = Number(query.pageSize ?? 20);
    if (!Number.isInteger(page) || page < 1 || page > 100000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw invalid('Invalid pagination');
    return {
      page,
      pageSize
    };
  };
  async function audience(auth) {
    const filter = [{
      'audience.kind': 'users',
      'audience.userIds': auth.user._id
    }];
    if (auth.user.roles.includes('student')) filter.push({
      'audience.kind': 'all_students'
    });
    const courses = [];
    for (const e of await coachingService.models.Enrollment.find({
      userId: auth.user._id,
      revokedAt: null,
      expiresAt: {
        $gt: new Date()
      }
    })) {
      try {
        if ((await coachingService.enrollment(String(e.courseId), auth)).canAccess) courses.push(e.courseId);
      } catch {/* No valid paid access, no course-targeted notice. */}
    }
    filter.push({
      'audience.kind': 'course',
      'audience.courseId': {
        $in: courses
      }
    });
    const preferences = auth.user.preferences?.notification;
    const categories = ['general'];
    if (preferences?.examAlerts !== false) categories.push('exam');
    if (preferences?.courseUpdates !== false) categories.push('course');
    if (preferences?.promoAlerts === true) categories.push('promotion');
    return {
      status: 'published',
      category: {
        $in: categories
      },
      publishedAt: {
        $lte: new Date()
      },
      $or: filter
    };
  }
  async function visible(value, auth) {
    const row = await Notification.findOne({
      _id: id(value),
      ...(await audience(auth))
    });
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Notification was not found');
    return row;
  }
  const service = {
    models: {
      Notification,
      NotificationReceipt: Receipt
    },
    async maintenance() {
      for await (const row of Notification.find({
        'auditOutbox.0': {
          $exists: true
        }
      }).cursor()) await coordination.flush(Notification, row);
    },
    async list(query, auth, admin = false) {
      object(query, ['page', 'pageSize', ...(admin ? ['status', 'category'] : ['read'])]);
      const {
        page,
        pageSize
      } = paging(query);
      const through = new Date().toISOString();
      const filter = admin ? {} : await audience(auth);
      if (admin && query.status) filter.status = text(query.status, 30);
      if (admin && query.category) filter.category = text(query.category, 30);
      const readIds = admin ? [] : (await Receipt.find({
        userId: auth.user._id,
        readAt: {
          $ne: null
        }
      }).select('notificationId')).map(r => r.notificationId);
      const unreadCount = admin ? undefined : await Notification.countDocuments({
        ...filter,
        _id: {
          $nin: readIds
        }
      });
      if (!admin && query.read !== undefined) {
        if (!['true', 'false'].includes(query.read)) throw invalid('Invalid read filter');
        filter._id = {
          [query.read === 'true' ? '$in' : '$nin']: readIds
        };
      }
      const total = await Notification.countDocuments(filter);
      const data = (await Notification.find(filter).sort({
        publishedAt: -1,
        _id: -1
      }).skip((page - 1) * pageSize).limit(pageSize)).map(row => admin ? dto(row) : {
        id: String(row._id),
        title: row.title,
        message: row.message,
        category: row.category,
        link: row.link,
        publishedAt: row.publishedAt,
        createdAt: row.publishedAt,
        isRead: readIds.some(v => String(v) === String(row._id)),
        icon: 'Megaphone',
        color: '#0A1D3F'
      });
      return {
        data,
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          ...(admin ? {} : {
            unreadCount,
            through
          })
        }
      };
    },
    async mark(value, auth) {
      const row = await visible(value, auth);
      try {
        await Receipt.updateOne({
          userId: auth.user._id,
          notificationId: row._id
        }, {
          $setOnInsert: {
            readAt: new Date()
          }
        }, {
          upsert: true
        });
      } catch (e) {
        if (e.code !== 11000) throw e;
      }
      return {
        id: String(row._id),
        isRead: true
      };
    },
    async markAll(input, auth) {
      object(input, ['through'], ['through']);
      const through = new Date(input.through);
      if (!Number.isFinite(through.getTime()) || through > new Date()) throw invalid('Use a valid past cutoff');
      const filter = {
        ...(await audience(auth)),
        publishedAt: {
          $lte: through
        }
      };
      let updatedCount = 0;
      for await (const row of Notification.find(filter).select('_id').cursor()) {
        try {
          const r = await Receipt.updateOne({
          userId: auth.user._id,
          notificationId: row._id
        }, {
          $setOnInsert: {
            readAt: new Date()
          }
        }, {
          upsert: true
        });
          updatedCount += r.upsertedCount;
        } catch (error) {
          // Another read-one/read-all request may have inserted the same unique
          // receipt. Its committed read state already satisfies this operation.
          if (error.code !== 11000) throw error;
        }
      }
      return {
        updatedCount,
        unreadCount: (await service.list({}, auth)).meta.unreadCount
      };
    },
    async detail(value) {
      const row = await Notification.findById(id(value));
      if (!row) throw new AppError(404, 'NOT_FOUND', 'Notification was not found');
      return dto(row);
    },
    async mutate(value, input, ctx, archive = false) {
      object(input, ['title', 'message', 'category', 'link', 'audience', 'expectedRevision'], value ? ['expectedRevision'] : ['title', 'message', 'category', 'audience']);
      const fields = {};
      for (const k of ['title', 'message']) if (k in input) {
        fields[k] = text(input[k], k === 'title' ? 160 : 4000);
        if (!fields[k]) throw invalid('Title/message cannot be empty');
      }
      if ('category' in input) {
        if (!['exam', 'course', 'promotion', 'general'].includes(input.category)) throw invalid('Invalid category');
        fields.category = input.category;
      }
      if ('link' in input) {
        const link = text(input.link, 200);
        if (link && !['/home', '/about', '/results', '/notifications', '/profile', '/settings', '/books', '/coaching', '/orders', '/colleges', '/institutes', '/categories'].includes(link) && !/^\/(?:books\/[a-f0-9]{24}|coaching\/[a-f0-9]{24}(?:\/dashboard|\/lecture\/[a-f0-9]{24})?)$/.test(link)) throw invalid('Use an approved internal notification route');
        fields.link = link;
      }
      if (input.audience) {
        object(input.audience, ['kind', 'userIds', 'courseId'], ['kind']);
        if (!['all_students', 'users', 'course'].includes(input.audience.kind)) throw invalid('Invalid audience');
        fields.audience = {
          kind: input.audience.kind
        };
        if (input.audience.kind === 'users') {
          if (!Array.isArray(input.audience.userIds) || !input.audience.userIds.length || input.audience.userIds.length > 100) throw invalid('Choose 1 to 100 recipients');
          const ids = [...new Set(input.audience.userIds.map(v => String(id(v))))];
          if ((await authService.models.User.countDocuments({
            _id: {
              $in: ids
            },
            status: 'active'
          })) !== ids.length) throw invalid('Recipients must exist and be active');
          fields.audience.userIds = ids;
        }
        if (input.audience.kind === 'course') {
          await coachingService.course(input.audience.courseId, true);
          fields.audience.courseId = id(input.audience.courseId);
        }
      }
      return coordination.run(async () => {
        if (!value) {
          const row = await Notification.create({
            ...fields,
            auditOutbox: [coordination.event('notification_created', ctx)]
          });
          await coordination.flush(Notification, row);
          return dto(row);
        }
        const row = await Notification.findById(id(value));
        if (!row) throw new AppError(404, 'NOT_FOUND', 'Notification was not found');
        if (row.status === 'published' && !archive) throw new AppError(409, 'PUBLISHED_IMMUTABLE', 'Archive this announcement and compose a new draft');
        return dto(await coordination.update(Notification, row, archive ? {
          status: 'archived'
        } : fields, revision(input.expectedRevision), archive ? 'notification_archived' : 'notification_updated', ctx));
      });
    },
    async publish(value, input, ctx) {
      object(input, ['expectedRevision'], ['expectedRevision']);
      return coordination.run(async () => {
        const row = await Notification.findById(id(value));
        if (!row) throw new AppError(404, 'NOT_FOUND', 'Notification was not found');
        if (row.status !== 'draft' || !row.title || !row.message || !row.audience?.kind) throw invalid('Complete draft required');
        return dto(await coordination.update(Notification, row, {
          status: 'published',
          publishedAt: new Date()
        }, revision(input.expectedRevision), 'notification_published', ctx));
      });
    }
  };
  for (const Model of [Notification, Receipt]) await Model.createIndexes();
  await service.maintenance();
  return service;
}
export function createNotificationRouter(service) {
  const router = express.Router(),
    ctx = req => ({
      actorId: req.auth?.user.publicId,
      requestId: req.requestId,
      ip: req.ip
    });
  const send = (req, res, data) => res.json({
    data,
    requestId: req.requestId
  });
  router.get('/me/notifications', requireSession, async (req, res) => res.json({
    ...(await service.list(req.query, req.auth)),
    requestId: req.requestId
  }));
  router.put('/me/notifications/:id/read', requireSession, async (req, res) => {
    object(req.body, []);
    send(req, res, await service.mark(req.params.id, req.auth));
  });
  router.post('/me/notifications/read-all', requireSession, async (req, res) => send(req, res, await service.markAll(req.body, req.auth)));
  router.get('/admin/notifications', requirePermission('notifications.read'), async (req, res) => res.json({
    ...(await service.list(req.query, req.auth, true)),
    requestId: req.requestId
  }));
  router.get('/admin/notifications/:id', requirePermission('notifications.read'), async (req, res) => send(req, res, await service.detail(req.params.id)));
  router.post('/admin/notifications', requirePermission('notifications.write'), async (req, res) => send(req, res, await service.mutate(null, req.body, ctx(req))));
  router.patch('/admin/notifications/:id', requirePermission('notifications.write'), async (req, res) => send(req, res, await service.mutate(req.params.id, req.body, ctx(req))));
  router.delete('/admin/notifications/:id', requirePermission('notifications.write'), async (req, res) => send(req, res, await service.mutate(req.params.id, req.body, ctx(req), true)));
  router.post('/admin/notifications/:id/publish', requirePermission('notifications.publish'), async (req, res) => send(req, res, await service.publish(req.params.id, req.body, ctx(req))));
  return router;
}
