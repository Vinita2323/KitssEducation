import { coachingService } from './coachingService';
export const subscriptionService = {
  async getSubscriptions() {
    return (await coachingService.getMyCourses()).map(course => ({
      ...course,
      courseId: course.id,
      courseName: course.title,
      status: course.enrollment.state,
      expiresAt: course.enrollment.expiresAt
    }));
  },
  async renewSubscription() {
    throw new Error('Renewals require a separately approved prepaid policy and verified captured payment.');
  }
};
