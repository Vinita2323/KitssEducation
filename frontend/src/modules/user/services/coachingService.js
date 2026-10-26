import { httpClient, getIdentityEpoch } from '../../../shared/api/httpClient';
import { authService, authenticatedWrite } from './authService';
import { queryString, readOptions } from './collegeService';
const get = async (url, signal) => (await httpClient.request(url, {
  signal
})).data;
export function computeSubscriptionExpiry(course) {
  const expiresAt = course.expiresAt ?? course.expiryTimestamp;
  const expiryTime = expiresAt ? new Date(expiresAt).getTime() : null;
  return {
    expiryTimestamp: expiryTime,
    expiryDate: expiryTime ? new Date(expiryTime).toLocaleDateString('en-IN') : null,
    isExpired: !expiryTime || expiryTime <= Date.now(),
    daysRemaining: expiryTime ? Math.max(0, Math.ceil((expiryTime - Date.now()) / 86400000)) : 0,
    expiryStatus: expiryTime && expiryTime > Date.now() ? 'Active' : 'Unavailable'
  };
}
const view = row => ({
  ...row,
  board: row.board ?? row.category,
  class: row.class ?? '',
  subjects: row.subjects ?? [],
  teacher: row.teacher ?? 'Instructor details in course',
  lecturesCount: row.lessonCount ?? 0,
  booksCount: row.linkedBookIds?.length ?? 0,
  duration: 'See approved plan',
  isEnrolled: false,
  subjectsData: []
});
export const coachingService = {
  async getFacets(signal) {
    return get('/coaching/facets', signal);
  },
  async getCoursesPage(input = {}, signal) {
    const f = await this.getFacets(signal);
    const query = {
      q: input.query,
      page: input.page,
      pageSize: input.pageSize,
      sort: input.sort
    };
    for (const [name, value, items] of [['category', input.category, f.categories], ['boardId', input.board, f.boards], ['stateId', input.state, f.states ?? []], ['classId', input.classGrade, f.classes], ['subjectId', input.subject, f.subjects], ['languageId', input.language, f.languages]]) if (value && value !== 'All') {
      const match = items.find(i => i.id === value || i.name === value);
      if (!match) return {
        data: [],
        meta: {
          page: 1,
          pageSize: 20,
          total: 0
        }
      };
      query[name] = match.id;
    }
    const response = await httpClient.request('/coaching/courses' + queryString(query), {
      signal
    });
    return {
      ...response,
      data: response.data.map(view)
    };
  },
  async getCourses(input, signal) {
    return (await this.getCoursesPage(input, signal)).data;
  },
  async getCategories() {
    return [{
      id: 'All',
      name: 'All'
    }, ...(await this.getFacets()).categories];
  },
  async getCourseById(id, signal) {
    const [row, syllabus, plans] = await Promise.all([get('/coaching/courses/' + id, signal), this.getSyllabus(id, signal), get('/coaching/courses/' + id + '/plans', signal)]);
    const enrollment = syllabus.enrollment;
    const books = await Promise.all((row.linkedBookIds ?? []).map(async bookId => {
      try {
        return await get('/books/' + bookId, signal);
      } catch {
        return null;
      }
    }));
    return {
      ...view(row),
      ...computeSubscriptionExpiry(enrollment ?? {}),
      isEnrolled: enrollment?.canAccess === true,
      enrollment,
      progressPercentage: syllabus.completionPercentage,
      completedLectures: syllabus.lessons.filter(l => l.progress?.status === 'completed').length,
      subscriptionPlans: plans.map(p => ({
        ...p,
        isPopular: p.popular === true,
        price: p.priceMinor / 100,
        duration: p.durationMonths ? p.durationMonths + ' calendar months' : p.durationDays + ' days'
      })),
      subjectsData: syllabus.sections.map(section => ({
        id: section.key,
        subjectName: section.title,
        lectures: syllabus.lessons.filter(l => l.subjectKey === section.key).map(l => ({
          ...l,
          isCompleted: l.progress?.status === 'completed',
          isLocked: l.locked
        })),
        books: books.filter(Boolean)
      })),
      syllabus
    };
  },
  getSyllabus: (id, signal) => get('/coaching/courses/' + id + '/syllabus', signal),
  getLesson: (courseId, id, signal) => get('/coaching/courses/' + courseId + '/lessons/' + id, signal),
  async getMyCourses(signal) {
    return (await readOptions('/me/enrollments',{state:'all'},signal)).map(e => ({
      ...view(e.course),
      ...computeSubscriptionExpiry(e),
      isEnrolled: e.state === 'active',
      progressPercentage: e.progressPercentage,
      completedLectures: e.completedLectures,
      lastLessonId: e.lastLessonId,
      enrollment: e
    }));
  },
  async getStudentProfile() {
    const user = await authService.getCurrentUser();
    return user ? {
      ...user,
      enrolledCourseIds: (await this.getMyCourses()).filter(c => c.isEnrolled).map(c => c.id),
      completedLectureIds: [],
      readingProgress: {}
    } : null;
  },
  async updateLectureProgress(courseId, lessonId, status = 'Completed', expectedRevision) {
    if (expectedRevision === undefined) {
      const syllabus = await this.getSyllabus(courseId);
      expectedRevision = syllabus.lessons.find(l => l.id === lessonId)?.progress?.revision ?? 0;
    }
    return authenticatedWrite('/me/lessons/' + lessonId + '/progress', {
      status: status === 'Completed' ? 'completed' : 'in_progress',
      expectedRevision
    }, 'PUT');
  },
  async saveVideoProgress(courseId, lessonId, video, positionSeconds, completed = false, signal) {
    const expectedIdentityEpoch = getIdentityEpoch();
    const syllabus = await this.getSyllabus(courseId, signal);
    signal?.throwIfAborted();
    const previous = syllabus.lessons.find(l => l.id === lessonId)?.progress;
    return authenticatedWrite('/me/lessons/' + lessonId + '/progress', {
      status: completed || previous?.status === 'completed' ? 'completed' : 'in_progress',
      expectedRevision: previous?.revision ?? 0, videoAssetId: video.assetId,
      positionSeconds: Math.min(video.durationSeconds, Math.max(0, positionSeconds))
    }, 'PUT', true, {}, { signal, expectedIdentityEpoch });
  },
  getLinkedBook: (courseId, bookId, signal) => get('/coaching/courses/' + courseId + '/books/' + bookId, signal),
  joinCourse: id => authenticatedWrite('/coaching/courses/' + id + '/enroll', { idempotencyKey: crypto.randomUUID() }),
  subscribeCourse: async () => {
    throw new Error('Razorpay Test Mode remains disabled.');
  },
  renewCourse: async () => {
    throw new Error('Renewals require a separately approved policy.');
  },
  registerStudent: async () => {
    throw new Error('Use the existing verified-account registration workflow.');
  }
};
