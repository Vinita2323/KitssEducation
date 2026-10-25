import mongoose from 'mongoose';
export function createCoachingModels(connection) {
  const {
      Schema
    } = mongoose,
    ref = Schema.Types.ObjectId;
  const str = (max = 160) => ({
    type: String,
    maxlength: max,
    trim: true
  });
  const event = new Schema({
    id: String,
    action: String,
    actorId: String,
    requestId: String,
    at: Date
  }, {
    _id: false
  });
  const base = {
    revision: {
      type: Number,
      default: 1
    },
    auditOutbox: {
      type: [event],
      default: []
    },
    updatedBy: String
  };
  const options = {
    strict: 'throw',
    timestamps: true,
    bufferCommands: false,
    writeConcern: {
      w: 1,
      j: true
    }
  };
  const course = new Schema({
    ...base,
    title: {
      ...str(),
      required: true
    },
    description: str(20000),
    whatYouWillLearn: {type:[str(500)],default:[]},
    benefits: {type:[str(500)],default:[]},
    category: str(),
    boardId: ref,
    classId: ref,
    stateId: ref,
    programId: ref,
    languageId: ref,
    subjectIds: [ref],
    facultyIds: [ref],
    thumbnailId: ref,
    linkedBookIds: [ref],
    syllabus: [{
      _id: false,
      key: String,
      title: String,
      sortOrder: Number
    }],
    rightsConfirmed: {
      type: Boolean,
      default: false
    },
    rightsNote: str(2000),
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedSnapshot: Schema.Types.Mixed
  }, options);
  course.index({
    status: 1,
    'publishedSnapshot.category': 1,
    'publishedSnapshot.languageId': 1
  });
  const plan = new Schema({
    ...base,
    features: { type: [str(500)], default: [] },
    popular: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0, min: 0, max: 100000, validate: Number.isSafeInteger },
    courseId: {
      type: ref,
      required: true
    },
    name: {
      ...str(),
      required: true
    },
    priceMinor: {
      type: Number,
      min: 1,
      max: 1000000000,
      validate: Number.isSafeInteger
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR'
    },
    durationDays: {
      type: Number,
      min: 1,
      max: 36500,
      validate: Number.isSafeInteger
    },
    eligibility: {
      type: String,
      enum: ['verified_account']
    },
    rulesApproved: {
      type: Boolean,
      default: false
    },
    renewalApproved: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft'
    }
  }, options);
  plan.index({
    courseId: 1,
    name: 1
  }, {
    unique: true
  });
  const lesson = new Schema({
    ...base,
    courseId: {
      type: ref,
      required: true
    },
    subjectKey: {
      ...str(80),
      required: true
    },
    title: {
      ...str(),
      required: true
    },
    description: str(2000),
    content: str(20000),
    documentAssetId: ref,
    videoAssetId: ref,
    linkedBookIds: [ref],
    sortOrder: {
      type: Number,
      required: true,
      min: 0,
      max: 100000,
      validate: Number.isSafeInteger
    },
    previewAllowed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'locked', 'archived'],
      default: 'draft'
    }
  }, options);
  lesson.index({
    courseId: 1,
    status: 1,
    sortOrder: 1
  });
  const enrollment = new Schema({
    ...base,
    userId: {
      type: ref,
      required: true
    },
    courseId: {
      type: ref,
      required: true
    },
    planId: {
      type: ref,
      required: true
    },
    orderId: {
      type: ref,
      required: true,
      unique: true
    },
    startsAt: {
      type: Date,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    source: {
      type: String,
      enum: ['paid'],
      required: true
    },
    simulated: Boolean,
    revokedAt: Date,
    revokeReason: str(2000)
  }, options);
  enrollment.index({
    userId: 1,
    courseId: 1
  }, {
    unique: true
  });
  enrollment.index({
    userId: 1,
    expiresAt: 1
  });
  const progress = new Schema({
    ...base,
    userId: {
      type: ref,
      required: true
    },
    resourceType: {
      type: String,
      enum: ['book', 'lesson'],
      required: true
    },
    bookId: ref,
    lessonId: ref,
    courseId: ref,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    currentPage: Number,
    positionSeconds: Number,
    durationSeconds: Number,
    videoAssetId: ref,
    completedAt: Date,
    lastActivityAt: Date,
    bookmarkPages: {
      type: [Number],
      default: []
    },
    wishlisted: {
      type: Boolean,
      default: false
    }
  }, options);
  progress.index({
    userId: 1,
    bookId: 1
  }, {
    unique: true,
    partialFilterExpression: {
      resourceType: 'book'
    }
  });
  progress.index({
    userId: 1,
    lessonId: 1
  }, {
    unique: true,
    partialFilterExpression: {
      resourceType: 'lesson'
    }
  });
  const model = (name, schema, collection) => connection.models[name] ?? connection.model(name, schema, collection);
  return {
    Course: model('Course', course, 'coachingCourses'),
    CoursePlan: model('CoursePlan', plan, 'coursePlans'),
    Lesson: model('Lesson', lesson, 'lessons'),
    Enrollment: model('Enrollment', enrollment, 'enrollments'),
    LearningProgress: model('LearningProgress', progress, 'learningProgress')
  };
}
