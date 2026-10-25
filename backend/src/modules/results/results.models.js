import mongoose from 'mongoose';
export function createResultModels(connection) {
  const {
    Schema
  } = mongoose;
  const ref = Schema.Types.ObjectId;
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
    timestamps: true,
    strict: 'throw',
    bufferCommands: false,
    writeConcern: {
      w: 1,
      j: true
    }
  };
  const issuer = new Schema({
    ...base,
    key: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['school', 'university', 'institute'],
      required: true
    },
    name: String,
    fullName: String,
    fieldSchema: [new Schema({
      id: String,
      label: String,
      type: {
        type: String,
        enum: ['text', 'date']
      },
      required: Boolean
    }, {
      _id: false
    })],
    source: {
      description: String,
      authorizationReference: String
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive'],
      default: 'draft'
    }
  }, options);
  const exam = new Schema({
    ...base,
    issuerId: {
      type: ref,
      required: true
    },
    key: String,
    title: String,
    year: Number,
    session: String,
    level: String,
    status: {
      type: String,
      enum: ['draft', 'published', 'withdrawn'],
      default: 'draft'
    }
  }, options);
  exam.index({
    issuerId: 1,
    key: 1
  }, {
    unique: true
  });
  const record = new Schema({
    ...base,
    examId: {
      type: ref,
      required: true
    },
    rollNormalized: {
      type: String,
      required: true
    },
    userId: {
      type: ref,
      required: true
    },
    student: Schema.Types.Mixed,
    subjects: [Schema.Types.Mixed],
    totals: Schema.Types.Mixed,
    verificationHash: {
      type: String,
      select: false
    },
    source: Schema.Types.Mixed,
    issueDate: Date,
    supersedesId: ref,
    correctionReason: String,
    withdrawalReason: String,
    status: {
      type: String,
      enum: ['draft', 'published', 'withdrawn'],
      default: 'draft'
    },
    publishedAt: Date
  }, options);
  // Revision is the immutable academic version. Edit/publication CAS uses __v.
  record.index({
    examId: 1,
    rollNormalized: 1,
    revision: 1
  }, {
    unique: true
  });
  record.index({
    examId: 1,
    rollNormalized: 1
  }, {
    unique: true,
    partialFilterExpression: {
      status: 'published'
    }
  });
  record.index({
    userId: 1,
    status: 1
  });
  const history = new Schema({
    userId: {
      type: ref,
      required: true
    },
    resultRecordId: {
      type: ref,
      required: true
    },
    lastViewedAt: Date
  }, options);
  history.index({
    userId: 1,
    resultRecordId: 1
  }, {
    unique: true
  });
  const model = (name, schema, collection) => connection.models[name] ?? connection.model(name, schema, collection);
  return {
    ResultIssuer: model('ResultIssuer', issuer, 'resultIssuers'),
    Exam: model('Exam', exam, 'exams'),
    ResultRecord: model('ResultRecord', record, 'resultRecords'),
    ResultHistory: model('ResultHistory', history, 'resultHistory')
  };
}
