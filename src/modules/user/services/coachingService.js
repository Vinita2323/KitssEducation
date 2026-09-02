import { mockCourses, mockCourseCategories } from "../data/mockCourses";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const coachingService = {
  async getCourses({ category, query } = {}) {
    await delay(350);
    let results = [...mockCourses];

    if (category && category !== "All") {
      results = results.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    if (query && query.trim() !== "") {
      const q = query.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q)
      );
    }

    return results;
  },

  async getCourseById(id) {
    await delay(250);
    const course = mockCourses.find((c) => c.id === id);
    if (!course) throw new Error("Course not found");
    return course;
  },

  async getCategories() {
    await delay(100);
    return mockCourseCategories;
  },

  async markLectureComplete(courseId, lectureId) {
    await delay(300);
    const course = mockCourses.find((c) => c.id === courseId);
    if (course) {
      for (const ch of course.chapters) {
        const lec = ch.lectures.find((l) => l.id === lectureId);
        if (lec) {
          lec.isCompleted = true;
          return { success: true, lecture: lec };
        }
      }
    }
    return { success: true };
  },

  async subscribeCourse(courseId, planDetails) {
    await delay(600);
    const course = mockCourses.find((c) => c.id === courseId);
    if (!course) throw new Error("Course not found");

    course.isSubscribed = true;
    return {
      success: true,
      subscriptionId: `SUB-${Date.now().toString().slice(-6)}`,
      course,
      plan: planDetails?.planName || "Annual Plan",
      startDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: planDetails?.price || course.price
    };
  }
};
