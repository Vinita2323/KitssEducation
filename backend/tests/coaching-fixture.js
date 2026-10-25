import { commerceFixture } from './commerce-fixture.js';
import { createCoachingModule } from '../src/modules/coaching/index.js';
import { createApp } from '../src/app.js';
import { Readable } from 'node:stream';
import { imageBytes, pdfBytes } from './publishing-fixture.js';
import { randomUUID } from 'node:crypto';
export async function coachingFixture(name) {
  const f = await commerceFixture(name);
  try {
    const learning = await createCoachingModule({
      connection: f.connection,
      publishingModule: f,
      commerce: f.service,
      institutions: f.institutions,
      authService: f.auth
    });
    Object.assign(f.models, learning.models);
    const seed = async () => {
      const admin = await f.fixtureUser(),
        student = await f.fixtureUser(['student']),
        other = await f.fixtureUser(['student']);
      const book = await f.book(admin, 'STAGE7_SYNTHETIC_BOOK');
      const language = await f.models.Taxonomy.findOne({
        kind: 'language'
      });
      const portrait = await f.media.upload({
        purpose: 'faculty',
        stream: Readable.from(await imageBytes()),
        mime: 'image/png',
        originalName: 'fixture.png',
        idempotencyKey: randomUUID(),
        auth: admin.auth,
        ctx: f.ctx
      });
      const faculty = await f.publishing.create('faculty', {
        name: 'STAGE7_SYNTHETIC_INSTRUCTOR',
        role: 'Isolated fixture',
        portraitAssetId: portrait.id,
        sourceNote: 'Generated isolated fixture; no actual qualification claims'
      }, admin.auth, f.ctx);
      await f.publishing.publish('faculty', faculty.id, {
        expectedRevision: faculty.revision,
        publish: true
      }, admin.auth, f.ctx);
      const thumbnail = await f.media.upload({
        purpose: 'course_thumbnail',
        stream: Readable.from(await imageBytes()),
        mime: 'image/png',
        originalName: 'fixture.png',
        idempotencyKey: randomUUID(),
        auth: admin.auth,
        ctx: f.ctx
      });
      let course = await learning.mutate('courses', null, null, {
        title: 'STAGE7_SYNTHETIC_COURSE',
        description: 'Isolated generated test content',
        whatYouWillLearn: ['Synthetic authored learning outcome'],
        benefits: ['Synthetic authored course benefit'],
        category: 'Isolated fixture',
        languageId: String(language._id),
        facultyIds: [faculty.id],
        thumbnailId: thumbnail.id,
        linkedBookIds: [book.id],
        syllabus: [{
          key: 'section-1',
          title: 'Fixture section',
          sortOrder: 1
        }],
        rightsConfirmed: true,
        rightsNote: 'Generated isolated test content only'
      }, admin.auth, f.ctx);
      const lessonDocument = await f.media.upload({
        purpose: 'lesson_document',
        stream: Readable.from(await pdfBytes(2, 'STAGE7_SYNTHETIC_LESSON_PDF')),
        mime: 'application/pdf',
        originalName: 'lesson.pdf',
        idempotencyKey: randomUUID(),
        auth: admin.auth,
        ctx: f.ctx
      });
      const lesson = await learning.mutate('lessons', null, course.id, {
        title: 'STAGE7_SYNTHETIC_LESSON',
        subjectKey: 'section-1',
        sortOrder: 1,
        content: 'Generated isolated test content only',
        documentAssetId: lessonDocument.id,
        status: 'published'
      }, admin.auth, f.ctx);
      const preview = await learning.mutate('lessons', null, course.id, {
        title: 'STAGE7_SYNTHETIC_PREVIEW',
        subjectKey: 'section-1',
        sortOrder: 2,
        content: 'Synthetic public preview',
        previewAllowed: true,
        status: 'published'
      }, admin.auth, f.ctx);
      const plan = await learning.mutate('plans', null, course.id, {
        name: 'STAGE7_SYNTHETIC_PREPAID_PLAN',
        features: ['Synthetic authored plan benefit'],
        popular: true,
        sortOrder: 3,
        priceMinor: 12345,
        durationDays: 7,
        eligibility: 'verified_account',
        rulesApproved: true,
        status: 'active'
      }, admin.auth, f.ctx);
      course = await learning.publish(course.id, {
        expectedRevision: course.revision,
        publish: true
      }, admin.auth, f.ctx);
      return {
        admin,
        student,
        other,
        book,
        course,
        lesson,
        preview,
        plan
      };
    };
    return {
      ...f,
      learning,
      seed,
      app: () => createApp({
        config: f.config,
        logger: f.logger,
        database: {
          isReady: async () => true
        },
        storage: f.storage,
        authService: f.auth,
        institutionService: f.institutions,
        publishingModule: f,
        commerceService: f.service,
        coachingService: learning
      })
    };
  } catch (e) {
    await f.close();
    throw e;
  }
}
