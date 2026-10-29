import { accessExpiry, validDuration } from '../../utils/accessDuration.js';
import { retireLegacyIndexes } from '../../utils/legacy-indexes.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { AppError } from '../../utils/AppError.js';
import { object, id, revision, text, invalid } from '../publishing/validation.js';
import { inputFor, integer, pagination } from './validation.js';
const missing = () => new AppError(404, 'NOT_FOUND', 'Learning resource was not found');
const denied = () => new AppError(403, 'ACCESS_DENIED', 'A current verified enrollment or book entitlement is required');
const same = (a, b) => String(a) === String(b);
const dto = row => {
  const value = row.toObject?.() ?? row;
  const {
    _id,
    __v,
    auditOutbox,
    publishedSnapshot,
    updatedBy,
    ...rest
  } = value;
  return {
    ...rest,
    id: String(_id)
  };
};
const currentProgress = (p,l) => !p ? null : l.videoAssetId && !same(p.videoAssetId,l.videoAssetId) ? {...dto(p),status:'not_started',positionSeconds:0,completedAt:null} : dto(p);
export function createCoachingService({
  models,
  publishingModule: publishing,
  commerce,
  institutions,
  authService
}) {
  const {
    Course,
    CoursePlan,
    Lesson,
    Enrollment,
    LearningProgress
  } = models;
  // Reuse the existing durable hierarchy lock and audit delivery.
  const coordination = publishing.coordination;
  const modelFor = kind => ({
    courses: Course,
    plans: CoursePlan,
    lessons: Lesson
  })[kind];
  const service = {
    models,
    coordination,
    async limit(ctx, auth) {
      await authService.limit(ctx, String(auth.user._id), 'learning-mutation', 120);
    },
    async initialize() {
      for (const Model of Object.values(models)) await Model.createIndexes();
      await retireLegacyIndexes(Enrollment, [['orderId_1', { orderId: 1 }]]);
    },
    async maintenance() {
      for (const Model of Object.values(models)) for await (const row of Model.find({
        'auditOutbox.0': {
          $exists: true
        }
      }).cursor()) await coordination.flush(Model, row);
    },
    async course(value, published = false) {
      const row = await Course.findById(id(value));
      if (!row || published && row.status !== 'published') throw missing();
      return row;
    },
    // Enrolled students keep learning after a course goes off sale or is removed: the last
    // published snapshot stays, while the catalogue, plans and new enrollment require 'published'.
    async courseFor(value, auth) {
      const row = await Course.findById(id(value));
      if (!row?.publishedSnapshot) throw missing();
      if (row.status === 'published') return row;
      if (auth && (await service.enrollment(value, auth, false))?.canAccess) return row;
      throw missing();
    },
    async refs(data, auth) {
      for (const [field, kind] of [['boardId', 'board'], ['stateId', 'state'], ['classId', 'class'], ['programId', 'program'], ['languageId', 'language']]) if (data[field] && !(await institutions.models.Taxonomy.exists({
        _id: data[field],
        kind,
        status: 'active'
      }))) throw invalid('Invalid active taxonomy: ' + field);
      for (const subject of data.subjectIds ?? []) if (!(await institutions.models.Taxonomy.exists({
        _id: subject,
        kind: 'subject',
        status: 'active'
      }))) throw invalid('Invalid subject');
      for (const faculty of data.facultyIds ?? []) if (!(await publishing.models.FacultyProfile.exists({
        _id: faculty,
        status: 'published'
      }))) throw invalid('Select published instructor profiles');
      for (const book of data.linkedBookIds ?? []) if (!(await publishing.models.Book.exists({
        _id: book,
        status: 'published',
        'publishedSnapshot.rightsConfirmed': true
      }))) throw invalid('Select published licensed linked books');
      if (data.thumbnailId) await publishing.media.linkable(data.thumbnailId, 'course_thumbnail', auth);
    },
    async validateLesson(data, course, auth, publishingNow = false) {
      if (!course.syllabus.some(s => s.key === data.subjectKey)) throw invalid('Lesson section must belong to its parent course');
      for (const book of data.linkedBookIds ?? []) if (!course.linkedBookIds.some(b => same(b, book))) throw invalid('Lesson book must be linked to this course');
      if (data.documentAssetId) await publishing.media.linkable(data.documentAssetId, 'lesson_document', auth);
      if (data.videoAssetId) await publishing.media.linkable(data.videoAssetId, 'lesson_video', auth);
      if (publishingNow && !data.content?.trim() && !data.documentAssetId && !data.videoAssetId) throw invalid('Publish authored text, an inspected document or validated video');
    },
    async validatePlan(data) {
      if (data.status === 'active' && (!data.rulesApproved || !Number.isSafeInteger(data.priceMinor) || data.priceMinor < 0 || !validDuration(data) || data.eligibility !== 'verified_account')) throw invalid('Active prepaid plans require explicit approved nonnegative price, duration and verified-account eligibility');
    },
    async adminList(kind, parent, query) {
      const {
          page,
          pageSize
        } = pagination(query),
        filter = parent ? {
          courseId: id(parent)
        } : {};
      if (parent) await service.course(parent);
      if (query.q) filter[kind === 'plans' ? 'name' : 'title'] = {
        $regex: escapeRegex(text(query.q, 160)),
        $options: 'i'
      };
      const rows = await modelFor(kind).find(filter).sort(kind === 'lessons' ? {
          sortOrder: 1,
          _id: 1
        } : kind === 'plans' ? { sortOrder: 1, createdAt: 1 } : {
          createdAt: -1
        }).skip((page - 1) * pageSize).limit(pageSize);
      const stats = kind === 'courses' && rows.length ? await service.courseStats(rows.map(r => r._id)) : {};
      return {
        data: rows.map(r => ({ ...service.adminDTO(kind, r), ...(kind === 'courses' ? { stats: stats[String(r._id)] } : {}) })),
        meta: {
          page,
          pageSize,
          total: await modelFor(kind).countDocuments(filter)
        }
      };
    },
    async adminGet(kind, value, parent) {
      const row = await modelFor(kind).findOne({
        _id: id(value),
        ...(parent ? {
          courseId: id(parent)
        } : {})
      });
      if (!row) throw missing();
      return { ...service.adminDTO(kind, row), ...(kind === 'courses' ? { stats: (await service.courseStats([row._id]))[String(row._id)] } : {}) };
    },
    async mutate(kind, value, parent, input, auth, ctx, archive = false) {
      const parsed = archive ? (object(input, ['expectedRevision'], ['expectedRevision']), {
        fields: {
          status: 'archived'
        },
        expectedRevision: revision(input.expectedRevision)
      }) : inputFor(kind, input, !value);
      return coordination.run(async () => {
        const Model = modelFor(kind),
          row = value ? await Model.findOne({
            _id: id(value),
            ...(parent ? {
              courseId: id(parent)
            } : {})
          }) : null;
        if (value && !row) throw missing();
        const merged = {
          ...(row?.toObject() ?? {}),
          ...parsed.fields
        };
        if (row?.status === 'archived') throw new AppError(409, 'ARCHIVED', 'Archived definitions cannot be edited');
        let course;
        if (parent) course = await service.course(parent);
        // Removal only needs the live guards; content validation applies to edits.
        if (kind === 'courses' && !archive) {
          await service.refs(merged, auth);
          if (row && parsed.fields.syllabus) {
            const keys = merged.syllabus.map(s => s.key);
            if (await Lesson.exists({
              courseId: row._id,
              status: {
                $ne: 'archived'
              },
              subjectKey: {
                $nin: keys
              }
            })) throw invalid('Archive or move lessons before removing their section');
          }
        }
        if (kind === 'plans' && !archive) await service.validatePlan(merged);
        if (kind === 'lessons' && !archive) await service.validateLesson(merged, course, auth, merged.status === 'published');
        if (parent) await service.liveGuards(kind, row, merged, course);
        if (row) {
          const updated = await coordination.update(Model, row, parsed.fields, parsed.expectedRevision, 'learning_' + kind + '_updated', ctx);
          return dto(updated);
        }
        const created = await Model.create({
          ...parsed.fields,
          ...(parent ? {
            courseId: course._id
          } : {}),
          auditOutbox: [coordination.event('learning_' + kind + '_created', ctx)]
        });
        await coordination.flush(Model, created);
        return dto(created);
      });
    },
    // Lessons and plans of a live course are edited in place, so each change must keep it
    // deliverable: published lessons use live sections/books, and one lesson and plan stay on.
    async liveGuards(kind, row, merged, course) {
      if (course.status !== 'published') return;
      const live = course.publishedSnapshot;
      if (kind === 'lessons' && merged.status === 'published') {
        if (!(live.syllabus ?? []).some(s => s.key === merged.subjectKey)) throw invalid('This section is not live yet. Publish the course changes first, then publish the lesson.');
        for (const book of merged.linkedBookIds ?? []) if (!(live.linkedBookIds ?? []).some(b => same(b, book))) throw invalid('This linked book is not live yet. Publish the course changes first.');
      }
      const onState = kind === 'lessons' ? 'published' : 'active', Model = kind === 'lessons' ? Lesson : CoursePlan;
      if (row?.status === onState && merged.status !== onState && !(await Model.exists({ courseId: course._id, status: onState, _id: { $ne: row._id } })))
        throw invalid(kind === 'lessons' ? 'A live course needs at least one published lesson. Unpublish the course first.' : 'A live course needs at least one active plan. Unpublish the course first.');
    },
    async restore(kind, value, parent, input, ctx) {
      object(input, ['expectedRevision'], ['expectedRevision']);
      return coordination.run(async () => {
        const Model = modelFor(kind), row = await Model.findOne({ _id: id(value), ...(parent ? { courseId: id(parent) } : {}) });
        if (!row) throw missing();
        if (row.status !== 'archived') throw invalid('Only removed items can be restored');
        return service.adminDTO(kind, await coordination.update(Model, row, { status: 'draft' }, revision(input.expectedRevision), 'learning_' + kind + '_restored', ctx));
      });
    },
    // Admin rows carry publication state; course rows also carry lesson, plan and student counts.
    adminDTO(kind, row) {
      const data = dto(row), snapshot = (row.toObject?.() ?? row).publishedSnapshot;
      if (kind === 'courses') data.publication = { everPublished: Boolean(snapshot), changesPending: Boolean(snapshot) && data.status === 'published' && data.revision > snapshot.revision, liveSectionKeys: (snapshot?.syllabus ?? []).map(s => s.key), liveBookIds: (snapshot?.linkedBookIds ?? []).map(String) };
      return data;
    },
    async courseStats(ids) {
      const now = new Date(), [lessons, plans, students] = await Promise.all([
        Lesson.aggregate([{ $match: { courseId: { $in: ids }, status: { $ne: 'archived' } } }, { $group: { _id: '$courseId', total: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } } } }]),
        CoursePlan.find({ courseId: { $in: ids }, status: 'active' }).sort({ sortOrder: 1, createdAt: 1 }).select('courseId name priceMinor durationDays durationMonths').lean(),
        Enrollment.aggregate([{ $match: { courseId: { $in: ids }, revokedAt: null, expiresAt: { $gt: now } } }, { $group: { _id: '$courseId', n: { $sum: 1 } } }])
      ]);
      return Object.fromEntries(ids.map(courseId => {
        const l = lessons.find(r => same(r._id, courseId));
        return [String(courseId), { lessons: { total: l?.total ?? 0, published: l?.published ?? 0 }, activePlans: plans.filter(p => same(p.courseId, courseId)).map(p => ({ name: p.name, priceMinor: p.priceMinor, durationDays: p.durationDays, durationMonths: p.durationMonths })), activeStudents: students.find(r => same(r._id, courseId))?.n ?? 0 }];
      }));
    },
    async publish(value, input, auth, ctx) {
      object(input, ['expectedRevision', 'publish'], ['expectedRevision', 'publish']);
      if (typeof input.publish !== 'boolean') throw invalid('Explicit publish boolean required');
      return coordination.run(async () => {
        const row = await service.course(value);
        if (row.status === 'archived') throw invalid('Archived course');
        let snapshot;
        if (input.publish) {
          await service.refs(row, auth);
          if (!row.description || !row.category || !row.languageId || !row.facultyIds.length || !row.thumbnailId || !row.syllabus.length || !row.rightsConfirmed || !row.rightsNote) throw invalid('Course metadata, instructor, thumbnail, syllabus and licensing evidence are required');
          const lessons = await Lesson.find({
              courseId: row._id,
              status: 'published'
            }),
            plans = await CoursePlan.find({
              courseId: row._id,
              status: 'active'
            });
          if (!lessons.length || !plans.length) throw invalid('At least one published lesson and approved active plan required');
          for (const lesson of lessons) await service.validateLesson(lesson, row, auth, true);
          for (const plan of plans) await service.validatePlan(plan);
          snapshot = JSON.parse(JSON.stringify(dto(row)));
          snapshot.revision = row.revision + 1;
        }
        return dto(await coordination.update(Course, row, {
          status: input.publish ? 'published' : 'draft',
          ...(snapshot ? {
            publishedSnapshot: snapshot
          } : {})
        }, revision(input.expectedRevision), 'course_publication', ctx));
      });
    },
    async publicDTO(row) {
      const s = row.publishedSnapshot;
      if (!s) throw missing();
      const {
        rightsNote,
        rightsConfirmed,
        ...safe
      } = s;
      const faculty = await publishing.models.FacultyProfile.find({
        _id: {
          $in: s.facultyIds ?? []
        },
        status: 'published'
      }).lean();
      const tax = await institutions.models.Taxonomy.find({
        _id: {
          $in: [s.boardId, s.classId, s.languageId, ...(s.subjectIds ?? [])].filter(Boolean)
        }
      }).lean();
      const label = id => tax.find(t => same(t._id, id))?.label;
      return {
        ...safe,
        id: String(row._id),
        status: 'published',
        onSale: row.status === 'published',
        teacher: faculty.map(f => f.publishedSnapshot?.name).filter(Boolean).join(', '),
        teacherRole: faculty.map(f => f.publishedSnapshot?.role).filter(Boolean).join(', '),
        teacherAvatar: faculty[0]?.publishedSnapshot?.portraitAssetId ? '/api/v1/media/' + faculty[0].publishedSnapshot.portraitAssetId + '/content' : null,
        board: label(s.boardId) ?? s.category,
        class: label(s.classId) ?? '',
        language: label(s.languageId),
        subjects: (s.subjectIds ?? []).map(label).filter(Boolean),
        thumbnail: s.thumbnailId ? '/api/v1/media/' + s.thumbnailId + '/content' : null,
        lessonCount: await Lesson.countDocuments({
          courseId: row._id,
          status: 'published'
        })
      };
    },
    async catalogue(query) {
      const {
          page,
          pageSize
        } = pagination(query),
        filter = {
          status: 'published'
        };
      for (const name of ['category', 'subjectId', 'languageId', 'classId', 'boardId', 'stateId']) if (query[name]) filter['publishedSnapshot.' + (name === 'subjectId' ? 'subjectIds' : name)] = name === 'category' ? text(query[name]) : String(id(query[name]));
      if (query.q) {
        const q = escapeRegex(text(query.q, 160));
        filter.$or = ['title', 'description','category'].map(k => ({
          ['publishedSnapshot.' + k]: {
            $regex: q,
            $options: 'i'
          }
        }));
        const taxIds = (await institutions.models.Taxonomy.find({label:{$regex:q,$options:'i'},status:'active',deletedAt:null}).select('_id')).map(row=>String(row._id));
        const facultyIds = (await publishing.models.FacultyProfile.find({status:'published','publishedSnapshot.name':{$regex:q,$options:'i'}}).select('_id')).map(row=>String(row._id));
        filter.$or.push(...['boardId','classId','subjectIds','languageId','stateId','programId'].map(field=>({['publishedSnapshot.'+field]:{$in:taxIds}})),{'publishedSnapshot.facultyIds':{$in:facultyIds}});
      }
      if (query.sort && !['title', 'newest'].includes(query.sort)) throw invalid('Unsupported sort');
      return {
        data: await Promise.all((await Course.find(filter).sort(query.sort === 'title' ? {
          'publishedSnapshot.title': 1,
          _id: 1
        } : {
          createdAt: -1,
          _id: 1
        }).skip((page - 1) * pageSize).limit(pageSize)).map(service.publicDTO)),
        meta: {
          page,
          pageSize,
          total: await Course.countDocuments(filter)
        }
      };
    },
    async facets() {
      const rows = await Course.find({
        status: 'published'
      }).select('publishedSnapshot').lean();
      const unique = name => [...new Set(rows.flatMap(r => r.publishedSnapshot?.[name] ?? []).filter(Boolean))];
      const tax = async ids => (await institutions.models.Taxonomy.find({
        _id: {
          $in: ids
        },
        status: 'active'
      }).select('_id label kind').lean()).map(t => ({
        id: String(t._id),
        name: t.label
      }));
      return {
        categories: unique('category').map(n => ({
          id: n,
          name: n
        })),
        subjects: await tax(unique('subjectIds')),
        languages: await tax(unique('languageId')),
        classes: await tax(unique('classId')),
        boards: await tax(unique('boardId')),
        states: await tax(unique('stateId'))
      };
    },
    async plans(value) {
      await service.course(value, true);
      return (await CoursePlan.find({
        courseId: id(value),
        status: 'active',
        rulesApproved: true
      }).sort({
        sortOrder: 1,
        createdAt: 1
      })).map(p => ({
        ...dto(p),
        purchasable: p.priceMinor === 0 || commerce.provider.ready && !commerce.provider.simulated,
        free: p.priceMinor === 0, renewalEnabled: p.priceMinor > 0
      }));
    },
    async enrollment(value, auth, required = true) {
      if (!auth) throw denied();
      const row = await Enrollment.findOne({
        userId: auth.user._id,
        courseId: id(value)
      });
      const source = row && (await commerce.models.Order.findOne({
        _id: row.orderId,
        userId: row.userId,
        status: 'captured',
        'product.kind': 'course_plan',
        'product.courseId': row.courseId,
        'product.id': row.planId,
        simulated: row.simulated
      }));
      let verifiedSource = source;
      // Free enrollment is only granted from an approved zero-priced plan; later plan changes keep it.
      if (row?.source === 'free') verifiedSource = true;
      if (row?.source === 'manual') verifiedSource = await commerce.business.manualValid(row);
      const owner = row && (await authService.models.User.findById(row.userId).select('status emailVerifiedAt'));
      const active = owner?.status === 'active' && !!owner.emailVerifiedAt && !!row && !row.revokedAt && row.startsAt <= new Date() && row.expiresAt > new Date() && !!verifiedSource;
      if (required && !active) throw denied();
      return row ? {
        ...dto(row),
        state: row.revokedAt ? 'revoked' : row.expiresAt <= new Date() ? 'expired' : active ? 'active' : 'blocked',
        canAccess: active
      } : null;
    },
    async bookEntitlements(query) {
      const { page, pageSize } = pagination(query, ['userId', 'bookId']);
      const filter = {};
      if (query.userId) filter.userId = id(query.userId);
      if (query.bookId) filter.bookId = id(query.bookId);
      if (query.state && query.state !== 'all') {
        if (!['active', 'revoked'].includes(query.state)) throw invalid('Invalid book entitlement state');
        filter.revokedAt = query.state === 'revoked' ? { $ne: null } : null;
      }
      const rows = await commerce.models.BookEntitlement.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize);
      const total = await commerce.models.BookEntitlement.countDocuments(filter);
      return { data: await Promise.all(rows.map(async row => {
        const book = await publishing.models.Book.findById(row.bookId).select('title');
        const verified = await commerce.models.Order.exists({ _id: row.orderId, userId: row.userId, status: 'captured', 'product.kind': 'book', 'product.id': row.bookId, 'fulfillment.state': 'applied' });
        return { id: String(row._id), revision: row.revision, source: row.source, revokeReason: row.revokeReason, expiresAt: row.expiresAt, userId: String(row.userId), bookId: String(row.bookId), title: book?.title || 'Archived/unavailable book', orderId: String(row.orderId), grantedAt: row.grantedAt, state: row.revokedAt ? 'revoked' : 'active', sourceVerified: Boolean(verified), simulated: row.simulated };
      })), meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
    },
    async enrollments(query, auth, admin = false) {
      const {
        page,
        pageSize
      } = pagination(query, ['userId', 'courseId']);
      const filter = admin ? {} : {
        userId: auth.user._id
      };
      if (admin && query.userId) filter.userId = id(query.userId);
      if (query.courseId) filter.courseId = id(query.courseId);
      if (query.state && query.state !== 'all') {
        if (!['active', 'expired', 'revoked'].includes(query.state)) throw invalid('Invalid enrollment state');
        if (query.state === 'revoked') filter.revokedAt = {
          $ne: null
        };else {
          filter.revokedAt = null;
          filter.expiresAt = query.state === 'active' ? {
            $gt: new Date()
          } : {
            $lte: new Date()
          };
        }
      }
      const rows = await Enrollment.find(filter).sort({
        createdAt: -1
      }).skip((page - 1) * pageSize).limit(pageSize);
      return {
        data: await Promise.all(rows.map(async r => {
          const lessons = await Lesson.find({
            courseId: r.courseId,
            status: 'published'
          }).select('_id videoAssetId');
          const progress = await LearningProgress.find({
            userId: r.userId,
            courseId: r.courseId,
            resourceType: 'lesson',
            lessonId: {
              $in: lessons.map(l => l._id)
            }
          }).sort({
            lastActivityAt: -1
          });
          const completed = progress.filter(p => currentProgress(p,lessons.find(l => same(l._id,p.lessonId)))?.status === 'completed').length;
          return {
            ...dto(r),
            state: (await service.enrollment(String(r.courseId), {
              user: {
                _id: r.userId
              }
            }, false))?.state ?? 'blocked',
            progressPercentage: lessons.length ? Math.round(completed / lessons.length * 100) : 0,
            completedLectures: completed,
            lastLessonId: progress[0] ? String(progress[0].lessonId) : null,
            lastActivityAt: progress[0]?.lastActivityAt,
            auditHistory: admin ? (await authService.models.AuditLog.find({
              subjectId: String(r._id)
            }).select('action actorId at requestId').sort({
              at: -1
            }).limit(30).lean()).map(a => ({
              action: a.action,
              actorId: a.actorId,
              at: a.at,
              requestId: a.requestId
            })) : undefined,
            course: await Course.findById(r.courseId).then(c => c?.publishedSnapshot ? service.publicDTO(c) : {
              id: String(r.courseId),
              title: 'Unavailable course'
            })
          };
        })),
        meta: {
          page,
          pageSize,
          total: await Enrollment.countDocuments(filter)
        }
      };
    },
    async syllabus(value, auth) {
      const course = await service.courseFor(value, auth),
        enrollment = auth ? await service.enrollment(value, auth, false) : null,
        rows = await Lesson.find({
          courseId: course._id,
          status: {
            $in: ['published', 'locked']
          }
        }).sort({
          sortOrder: 1,
          _id: 1
        });
      const progress = auth ? await LearningProgress.find({
        userId: auth.user._id,
        resourceType: 'lesson',
        courseId: course._id
      }).sort({
        lastActivityAt: -1
      }) : [];
      return {
        lastLessonId: progress[0] ? String(progress[0].lessonId) : null,
        sections: [...course.publishedSnapshot.syllabus].sort((a, b) => a.sortOrder - b.sortOrder),
        lessons: rows.map(l => ({
          id: String(l._id),
          title: l.title,
          description: l.description,
          subjectKey: l.subjectKey,
          sortOrder: l.sortOrder,
          previewAllowed: l.previewAllowed,
          locked: l.status !== 'published' || !l.previewAllowed && !enrollment?.canAccess,
          progress: currentProgress(progress.find(p => same(p.lessonId, l._id)),l)
        })),
        enrollment,
        completionPercentage: rows.length ? Math.round(progress.filter(p => rows.some(l => same(l._id, p.lessonId) && l.status === 'published' && currentProgress(p,l)?.status === 'completed')).length / rows.filter(l => l.status === 'published').length * 100) || 0 : 0
      };
    },
    async lesson(courseId, value, auth) {
      const course = await service.courseFor(courseId, auth),
        lesson = await Lesson.findOne({
          _id: id(value),
          courseId: course._id,
          status: 'published'
        });
      if (!lesson) throw missing();
      if (!lesson.previewAllowed) await service.enrollment(courseId, auth);
      if (!course.publishedSnapshot.rightsConfirmed || !course.publishedSnapshot.rightsNote) throw denied();
      let media = null;
      if (lesson.documentAssetId) {
        const asset = await publishing.models.MediaAsset.findOne({
          _id: lesson.documentAssetId,
          purpose: 'lesson_document',
          status: 'ready',
          'scan.status': 'clean'
        });
        if (!asset) throw new AppError(409, 'MEDIA_UNAVAILABLE', 'Clean lesson media is unavailable');
        media = {
          url: '/api/v1/media/' + asset._id + '/content',
          mime: asset.mime,
          pageCount: asset.pageCount
        };
      }
      let video = null;
      if (lesson.videoAssetId) {
        const asset = await publishing.models.MediaAsset.findOne({_id:lesson.videoAssetId,purpose:'lesson_video',status:'ready','scan.status':'clean',inspectionVersion:'mp4-h264-aac-v1'});
        if (!asset?.durationSeconds) throw new AppError(409,'MEDIA_UNAVAILABLE','Validated lesson video is unavailable');
        video = {assetId:String(asset._id),url:'/api/v1/media/'+asset._id+'/content',mime:asset.mime,durationSeconds:asset.durationSeconds};
      }
      const progress = auth ? await LearningProgress.findOne({userId:auth.user._id,lessonId:lesson._id,resourceType:'lesson'}) : null;
      return {...dto(lesson), media, video, videoAvailable:!!video, progress:currentProgress(progress,lesson)};
    },
    async progressLesson(value, input, auth) {
      object(input, ['status', 'positionSeconds', 'videoAssetId', 'expectedRevision'], ['status', 'expectedRevision']);
      if (!['in_progress', 'completed'].includes(input.status)) throw invalid('Explicit completion or in-progress status required');
      const lesson = await Lesson.findById(id(value));
      if (!lesson) throw missing();
      await service.enrollment(String(lesson.courseId), auth);
      const resource = await service.lesson(String(lesson.courseId), value, auth);
      const videoFields = {};
      if (resource.video) {
        const prior = await LearningProgress.findOne({userId:auth.user._id,lessonId:lesson._id,resourceType:'lesson'});
        const position = input.positionSeconds ?? (same(prior?.videoAssetId, lesson.videoAssetId) ? prior.positionSeconds ?? 0 : 0);
        if (input.positionSeconds !== undefined && input.videoAssetId !== String(lesson.videoAssetId)) throw invalid('Refresh the lesson video before saving progress');
        if (typeof position !== 'number' || !Number.isFinite(position) || position < 0 || position > resource.video.durationSeconds) throw invalid('Position exceeds inspected video duration');
        Object.assign(videoFields,{positionSeconds:Math.min(resource.video.durationSeconds,Math.round(position*1000)/1000),durationSeconds:resource.video.durationSeconds,videoAssetId:lesson.videoAssetId});
      } else if (input.positionSeconds !== undefined && input.positionSeconds !== 0 || input.videoAssetId) throw invalid('This lesson has no video');
      return service.progressWrite({
        userId: auth.user._id,
        resourceType: 'lesson',
        lessonId: lesson._id
      }, {
        ...videoFields,
        status: input.status,
        courseId: lesson.courseId,
        lastActivityAt: new Date(),
        ...(input.status === 'completed' ? {
          completedAt: new Date()
        } : {
          completedAt: null
        })
      }, input.expectedRevision);
    },
    async progressWrite(filter, fields, expected) {
      integer(expected, 0, 1000000000);
      let row = await LearningProgress.findOne(filter);
      if (!row) {
        if (expected !== 0) throw new AppError(409, 'REVISION_CONFLICT', 'Refresh learning state');
        try {
          return dto(await LearningProgress.create({
            ...filter,
            ...fields
          }));
        } catch (e) {
          if (e.code !== 11000) throw e;
          row = await LearningProgress.findOne(filter);
        }
      }
      // Semantic replay is idempotent even with the original revision.
      const meaningful = Object.keys(fields).filter(k => !['lastActivityAt', 'completedAt'].includes(k));
      if (meaningful.every(k => JSON.stringify(row[k]) === JSON.stringify(fields[k]))) return dto(row);
      const updated = await LearningProgress.findOneAndUpdate({
        _id: row._id,
        revision: expected
      }, {
        $set: fields,
        $inc: {
          revision: 1
        }
      }, {
        returnDocument: 'after',
        runValidators: true
      });
      if (!updated) throw new AppError(409, 'REVISION_CONFLICT', 'Learning state changed; refresh before retrying');
      return dto(updated);
    },
    async linkedBook(courseId, bookId, auth) {
      const course = await service.courseFor(courseId, auth);
      if (!(course.publishedSnapshot.linkedBookIds ?? []).some(b => same(b, bookId))) throw missing();
      await service.enrollment(courseId, auth);
      return service.bookState(bookId, auth, courseId);
    },
    async bookAccess(value, auth, courseId) {
      // Enrolled students keep a linked book's last published snapshot even if it later goes off sale.
      const book = await publishing.models.Book.findOne({
          _id: id(value),
          publishedSnapshot: { $ne: null }
        }),
        s = book?.publishedSnapshot;
      if (!s?.rightsConfirmed || !s.rightsNote) throw missing();
      const asset = await publishing.models.MediaAsset.findOne({
        _id: s.documentAssetId,
        purpose: 'book_full',
        status: 'ready',
        'scan.status': 'clean'
      });
      if (!asset || !Number.isSafeInteger(asset.pageCount) || asset.pageCount < 1) throw new AppError(409, 'MEDIA_UNAVAILABLE', 'Verified PDF page count and clean licensed bytes are required');
      if (courseId) {
        const course = await service.courseFor(courseId, auth);
        if (!(course.publishedSnapshot.linkedBookIds ?? []).some(b => same(b, book._id))) throw missing();
        await service.enrollment(courseId, auth);
      } else if (!(await commerce.canReadAsset(asset, auth))) throw denied();
      return {
        book,
        asset
      };
    },
    async bookState(value, auth, courseId) {
      const {
          book,
          asset
        } = await service.bookAccess(value, auth, courseId),
        row = await LearningProgress.findOne({
          userId: auth.user._id,
          resourceType: 'book',
          bookId: book._id
        });
      return {
        id: String(book._id),
        title: book.publishedSnapshot.title,
        pageCount: asset.pageCount,
        currentPage: Math.min(row?.currentPage ?? 1, asset.pageCount),
        percentage: row?.currentPage ? Math.round(Math.min(row.currentPage, asset.pageCount) / asset.pageCount * 100) : 0,
        bookmarkPages: (row?.bookmarkPages ?? []).filter(p => p <= asset.pageCount),
        wishlisted: row?.wishlisted ?? false,
        revision: row?.revision ?? 0,
        contentUrl: '/api/v1/media/' + asset._id + '/content',
        toc: book.publishedSnapshot.toc ?? [],
        lastReadAt: row?.lastActivityAt
      };
    },
    async wishlist(value, on, auth) {
      if (!(await publishing.models.Book.exists({
        _id: id(value),
        status: 'published'
      }))) throw missing();
      const filter = {
        userId: auth.user._id,
        resourceType: 'book',
        bookId: id(value)
      };
      try {
        const row = await LearningProgress.findOneAndUpdate(filter, {
          $set: {
            wishlisted: on
          },
          $setOnInsert: {
            revision: 1
          }
        }, {
          upsert: true,
          returnDocument: 'after',
          runValidators: true
        });
        return {
          bookId: String(value),
          wishlisted: row.wishlisted
        };
      } catch (e) {
        if (e.code !== 11000) throw e;
        return service.wishlist(value, on, auth);
      }
    },
    async bookProgress(value, input, auth, action, page) {
      object(input, ['currentPage', 'expectedRevision', 'courseId'], ['expectedRevision']);
      const {
        book,
        asset
      } = await service.bookAccess(value, auth, input.courseId);
      const filter = {
        userId: auth.user._id,
        resourceType: 'book',
        bookId: book._id
      };
      const row = await LearningProgress.findOne(filter);
      const fields = {
        lastActivityAt: new Date()
      };
      if (action === 'progress') fields.currentPage = integer(input.currentPage, 1, asset.pageCount);else {
        page = integer(Number(page), 1, asset.pageCount);
        const pages = new Set(row?.bookmarkPages ?? []);
        if (action === 'add') pages.add(page);else pages.delete(page);
        if (pages.size > 1000) throw invalid('Bookmark limit reached');
        fields.bookmarkPages = [...pages].sort((a, b) => a - b);
      }
      await service.progressWrite(filter, fields, input.expectedRevision);
      return service.bookState(value, auth, input.courseId);
    },
    async deliveryReady(course) {
      const snapshot = course.publishedSnapshot;
      if (!snapshot?.rightsConfirmed || !snapshot.rightsNote) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Current licensed published course delivery is required');
      if (!(await publishing.models.MediaAsset.exists({
        _id: snapshot.thumbnailId,
        purpose: 'course_thumbnail',
        status: 'ready',
        'scan.status': 'clean'
      }))) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Course thumbnail is unavailable');
      for (const facultyId of snapshot.facultyIds ?? []) if (!(await publishing.models.FacultyProfile.exists({
        _id: facultyId,
        status: 'published'
      }))) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Instructor publication requires review');
      for (const bookId of snapshot.linkedBookIds ?? []) {
        const book = await publishing.models.Book.findOne({
          _id: bookId,
          status: 'published',
          'publishedSnapshot.rightsConfirmed': true
        });
        if (!book?.publishedSnapshot.rightsNote || !(await publishing.models.MediaAsset.exists({
          _id: book.publishedSnapshot.documentAssetId,
          purpose: 'book_full',
          status: 'ready',
          'scan.status': 'clean'
        }))) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Linked licensed book delivery is unavailable');
      }
      const lessons = await Lesson.find({
        courseId: course._id,
        status: 'published'
      });
      if (!lessons.length) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Published lessons are required');
      for (const lesson of lessons) if ( !snapshot.syllabus.some(s => s.key === lesson.subjectKey) || !lesson.content && !lesson.documentAssetId && !lesson.videoAssetId || lesson.videoAssetId && !(await publishing.models.MediaAsset.exists({_id:lesson.videoAssetId,purpose:'lesson_video',status:'ready','scan.status':'clean',inspectionVersion:'mp4-h264-aac-v1',durationSeconds:{$gt:0}})) || lesson.documentAssetId && !(await publishing.models.MediaAsset.exists({
        _id: lesson.documentAssetId,
        purpose: 'lesson_document',
        status: 'ready',
        'scan.status': 'clean'
      }))) throw new AppError(409, 'COURSE_DELIVERY_BLOCKED', 'Safe published lesson delivery is unavailable');
    },
    async enrollFree(value, auth, ctx) {
      commerce.eligible(auth);
      return coordination.run(async () => {
        const course = await service.course(value, true); await service.deliveryReady(course);
        const plans = await CoursePlan.find({ courseId: course._id, status: 'active', rulesApproved: true, priceMinor: 0, eligibility: 'verified_account' }).sort({ sortOrder: 1, _id: 1 });
        const plan = plans[0]; if (!plan) throw new AppError(409, 'PAID_ENROLLMENT_REQUIRED', 'No approved zero-priced plan is available'); await service.validatePlan(plan);
        const prior = await Enrollment.findOne({ userId: auth.user._id, courseId: course._id });
        if (prior?.revokedAt) throw new AppError(409, 'ENTITLEMENT_REVOKED', 'Revoked access requires review');
        if (prior && (prior.source !== 'free' || prior.expiresAt <= new Date())) throw new AppError(409, 'EXISTING_ENROLLMENT', 'Existing access requires review; paid history is preserved');
        const row = prior ?? await Enrollment.create({ userId: auth.user._id, courseId: course._id, planId: plan._id, source: 'free', startsAt: new Date(), expiresAt: accessExpiry(new Date(), plan), simulated: false, auditOutbox: [coordination.event('free_course_enrolled', ctx)] });
        await coordination.flush(Enrollment, row); return service.enrollment(value, auth);
      });
    },
    async issueManual(request, auth) {
      const course = await service.course(String(request.resourceId), true); await service.deliveryReady(course);
      const prior = await Enrollment.findOne({ userId: request.userId, courseId: course._id });
      if (prior && !same(prior.grantId, request._id)) throw new AppError(409, 'EXISTING_ENROLLMENT', 'Exceptional grants cannot overwrite existing purchase rights');
      return prior ?? Enrollment.create({ userId: request.userId, courseId: course._id, grantId: request._id, source: 'manual', startsAt: new Date(), expiresAt: request.expiresAt, simulated: false });
    },
    async resolvePlan(value, auth) {
      const plan = await CoursePlan.findById(id(value));
      if (!plan || plan.status !== 'active') throw new AppError(409, 'PRODUCT_NOT_PURCHASABLE', 'Approved active plan required');
      await service.validatePlan(plan);
      const course = await service.course(String(plan.courseId), true);
      await service.deliveryReady(course);
      if (!(plan.priceMinor > 0)) throw new AppError(409, 'FREE_PLAN', 'Use the free enrollment action for a zero-priced plan');
      const existing = await Enrollment.findOne({ userId: auth.user._id, courseId: course._id });
      // Active access may be renewed early (the new period is added after the current expiry); revoked access may not.
      if (existing?.revokedAt) throw new AppError(409, 'ACTIVE_OR_REVOKED_ACCESS', 'Revoked access cannot be repurchased');
      const purchaseSlot = existing ? String(existing._id) + ':' + existing.expiresAt.toISOString() : 'initial';
      // Legacy first-purchase rows without a slot remain authoritative.
      if (await commerce.models.Order.exists({ userId: auth.user._id, 'product.kind': 'course_plan', 'product.courseId': course._id, ...(existing ? { 'product.purchaseSlot': purchaseSlot } : {}) })) throw new AppError(409, 'EXISTING_COURSE_ORDER', 'Resume the existing order for this access period');
      return {
        product: {
          kind: 'course_plan',
          id: plan._id,
          title: course.publishedSnapshot.title + ' - ' + plan.name,
          revision: plan.revision,
          courseId: course._id,
          durationDays: plan.durationDays, durationMonths: plan.durationMonths,
          eligibility: plan.eligibility, purchaseSlot
        },
        amountMinor: plan.priceMinor,
        currency: 'INR'
      };
    },
    async fulfill(order) {
      const user = await authService.models.User.findById(order.userId);
      if (!user?.emailVerifiedAt || user.status !== 'active') throw denied();
      // A paid order is delivered even if the course went off sale after checkout started.
      const course = await Course.findById(id(String(order.product.courseId)));
      if (!course?.publishedSnapshot) throw missing();
      if (course.status === 'published') await service.deliveryReady(course);
      if (!validDuration(order.product)) throw invalid("Invalid captured access duration");
      const startsAt = order.capturedAt;
      if (!startsAt) throw denied();
      let enrollment = await Enrollment.findOne({ userId: order.userId, courseId: course._id });
      if (enrollment?.purchaseHistory.some(p => same(p.orderId, order._id))) return enrollment;
      if (enrollment && !same(enrollment.orderId, order._id)) {
        if (enrollment.revokedAt || order.product.purchaseSlot !== String(enrollment._id) + ':' + enrollment.expiresAt.toISOString() || enrollment.purchaseHistory.length >= 100) throw new AppError(409, 'ENROLLMENT_CONFLICT', 'Access period changed; investigate before repurchase fulfillment');
        const history = enrollment.orderId ? [...enrollment.purchaseHistory.map(p => p.toObject()), { orderId: enrollment.orderId, planId: enrollment.planId, startsAt: enrollment.startsAt, expiresAt: enrollment.expiresAt }] : enrollment.purchaseHistory;
        // Early renewal keeps access continuous: the paid period starts when the current one ends.
        const renewing = enrollment.expiresAt > startsAt;
        enrollment = await Enrollment.findOneAndUpdate({ _id: enrollment._id, revision: enrollment.revision, revokedAt: null, expiresAt: enrollment.expiresAt }, { $set: { orderId: order._id, planId: order.product.id, startsAt: renewing ? enrollment.startsAt : startsAt, expiresAt: accessExpiry(renewing ? enrollment.expiresAt : startsAt, order.product), source: 'paid', simulated: order.simulated, purchaseHistory: history }, $inc: { revision: 1 }, $push: { auditOutbox: coordination.event('paid_course_repurchased', { actorId: 'system' }) } }, { returnDocument: 'after', runValidators: true });
        if (!enrollment) throw new AppError(409, 'ENROLLMENT_CONFLICT', 'Concurrent access-period change');
      } else if (!enrollment) {
        try {
          enrollment = await Enrollment.findOneAndUpdate({ userId: order.userId, courseId: course._id, orderId: order._id }, { $setOnInsert: { planId: order.product.id, startsAt, expiresAt: accessExpiry(startsAt, order.product), source: 'paid', simulated: order.simulated, auditOutbox: [coordination.event('paid_enrollment_created', { actorId: 'system' })] } }, { upsert: true, returnDocument: 'after', runValidators: true });
        } catch (e) { if (e.code !== 11000) throw e; enrollment = await Enrollment.findOne({ userId: order.userId, courseId: course._id, orderId: order._id }); if (!enrollment) throw new AppError(409, 'ENROLLMENT_CONFLICT', 'Concurrent enrollment source conflict'); }
      }
      if (enrollment.revokedAt) throw denied();
      await coordination.flush(Enrollment, enrollment);
      return enrollment;
    },
    async hasEffect(order) {
      return !!(await Enrollment.exists({
        $or: [{ orderId: order._id }, { 'purchaseHistory.orderId': order._id }],
        userId: order.userId,
        courseId: order.product.courseId,
        revokedAt: null
      }));
    },
    async canReadAsset(asset, auth) {
      if (asset.status !== 'ready' || asset.scan.status !== 'clean') return false;
      if (['lesson_document','lesson_video'].includes(asset.purpose)) {
        for (const lesson of await Lesson.find({
          [asset.purpose === 'lesson_video' ? 'videoAssetId' : 'documentAssetId']: asset._id,
          status: 'published'
        })) try {
          await service.lesson(String(lesson.courseId), String(lesson._id), auth);
          return true;
        } catch {}
        return false;
      }
      if (asset.purpose === 'book_full' && auth) {
        const book = await publishing.models.Book.findOne({
          'publishedSnapshot.documentAssetId': String(asset._id),
          'publishedSnapshot.rightsConfirmed': true
        });
        if (!book?.publishedSnapshot.rightsNote) return false;
        for (const course of await Course.find({
          publishedSnapshot: { $ne: null },
          'publishedSnapshot.linkedBookIds': String(book._id)
        })) try {
          await service.enrollment(String(course._id), auth);
          return !!course.publishedSnapshot.rightsConfirmed;
        } catch {}
      }
      return false;
    },
    async references(assetId, publicOnly) {
      const result = [];
      for (const course of await Course.find({
        $or: [{
          thumbnailId: assetId
        }, {
          'publishedSnapshot.thumbnailId': String(assetId)
        }]
      })) {
        if (!publicOnly || course.status === 'published' && same(course.publishedSnapshot?.thumbnailId, assetId)) result.push({
          kind: 'Course',
          id: String(course._id),
          status: course.status
        });
      }
      if (!publicOnly) for (const lesson of await Lesson.find({
        $or: [{
          documentAssetId: assetId
        }, {
          videoAssetId: assetId
        }]
      })) result.push({
        kind: 'Lesson',
        id: String(lesson._id),
        status: lesson.status
      });
      return result;
    },
    async revoke(value, input, ctx) {
      object(input, ['kind', 'reason', 'expectedRevision'], ['kind', 'reason', 'expectedRevision']);
      if (!['course', 'book'].includes(input.kind)) throw invalid('Invalid entitlement kind');
      const reason = text(input.reason, 2000);
      if (!reason) throw invalid('Revocation reason required');
      const Model = input.kind === 'course' ? Enrollment : commerce.models.BookEntitlement;
      return coordination.run(async () => {
        const row = await Model.findById(id(value));
        if (!row) throw missing();
        if ((input.kind === 'book' || row.source === 'paid') && !(await commerce.business.settings()).value?.manualAccess?.paidRevocationApproved) throw new AppError(409, 'ACCESS_REVOCATION_POLICY_PENDING', 'Approved paid access revocation policy required');
        if (input.kind === 'book') return dto(await coordination.update(Model, row, { revokedAt: new Date(), revokeReason: reason }, revision(input.expectedRevision), 'book_access_revoked', ctx));
        return dto(await coordination.update(Model, row, {
          revokedAt: new Date(),
          revokeReason: reason
        }, revision(input.expectedRevision), 'enrollment_revoked', ctx));
      });
    }
  };
  return service;
}
