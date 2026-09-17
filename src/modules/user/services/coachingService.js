import { getCoachingStore, saveCoachingStore } from "../data/mockCoachingData";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const coachingService = {
  // 1. Fetch available coaching courses with optional filters
  async getCourses({
    category = "All",
    board = "All",
    state = "All",
    classGrade = "All",
    subject = "All",
    courseType = "All",
    query = "",
  } = {}) {
    await delay(120);
    const store = getCoachingStore();
    let list = [...(store.courses || [])];
    const student = store.student || {};

    // Enrich courses with current student enrollment status & real-time progress
    list = list.map((course) => {
      const isEnrolled = (student.enrolledCourseIds || []).includes(course.id);
      
      // Calculate real total lectures and completed
      let totalLecs = 0;
      let completedCount = 0;
      (course.subjectsData || []).forEach((subj) => {
        (subj.lectures || []).forEach((lec) => {
          totalLecs++;
          if ((student.completedLectureIds || []).includes(lec.id)) {
            completedCount++;
          }
        });
      });

      const actualTotal = totalLecs || course.lecturesCount || 1;
      const progress = isEnrolled
        ? Math.round((completedCount / actualTotal) * 100)
        : 0;

      return {
        ...course,
        isEnrolled,
        completedLectures: isEnrolled ? completedCount : 0,
        progressPercentage: progress,
      };
    });

    // Filter by Board
    if (board && board !== "All") {
      list = list.filter((c) => c.board?.toLowerCase() === board.toLowerCase());
    }

    // Filter by Category / Board fallback
    if (category && category !== "All") {
      list = list.filter(
        (c) =>
          c.board?.toLowerCase() === category.toLowerCase() ||
          c.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by State
    if (state && state !== "All") {
      list = list.filter((c) => c.state?.toLowerCase() === state.toLowerCase());
    }

    // Filter by Class
    if (classGrade && classGrade !== "All") {
      list = list.filter(
        (c) =>
          c.class?.toLowerCase() === classGrade.toLowerCase() ||
          c.class?.replace(/\s+/g, "").toLowerCase() === classGrade.replace(/\s+/g, "").toLowerCase()
      );
    }

    // Filter by Subject
    if (subject && subject !== "All") {
      list = list.filter((c) =>
        c.subjects?.some((s) => s.toLowerCase() === subject.toLowerCase())
      );
    }

    // Filter by Course Type
    if (courseType && courseType !== "All") {
      list = list.filter((c) => c.courseType?.toLowerCase() === courseType.toLowerCase());
    }

    // Query Search
    if (query && query.trim() !== "") {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.subtitle?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.teacher?.toLowerCase().includes(q) ||
          c.board?.toLowerCase().includes(q) ||
          c.subjects?.some((s) => s.toLowerCase().includes(q))
      );
    }

    return list;
  },

  // 2. Fetch single course details by ID
  async getCourseById(id) {
    await delay(120);
    const store = getCoachingStore();
    const student = store.student || {};
    const course = (store.courses || []).find((c) => c.id === id);

    if (!course) {
      throw new Error("Course not found");
    }

    const isEnrolled = (student.enrolledCourseIds || []).includes(course.id);
    let totalLecs = 0;
    let completedCount = 0;

    const subjectsData = (course.subjectsData || []).map((subj) => {
      const lectures = (subj.lectures || []).map((lec) => {
        totalLecs++;
        const isCompleted = (student.completedLectureIds || []).includes(lec.id);
        const isInProgress = (student.inProgressLectureIds || []).includes(lec.id);
        if (isCompleted) completedCount++;

        return {
          ...lec,
          isCompleted,
          isInProgress,
        };
      });

      const books = (subj.books || []).map((b) => {
        const currentPage = student.readingProgress?.[b.id] || b.currentPage || 1;
        return {
          ...b,
          currentPage,
        };
      });

      return {
        ...subj,
        lectures,
        books,
      };
    });

    const progress = totalLecs > 0 ? Math.round((completedCount / totalLecs) * 100) : 0;

    return {
      ...course,
      isEnrolled,
      completedLectures: completedCount,
      totalLecturesCount: totalLecs,
      progressPercentage: isEnrolled ? progress : 0,
      subjectsData,
    };
  },

  // 3. Register student with mock validation
  async registerStudent(formData) {
    await delay(250);
    const store = getCoachingStore();

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const studentId = `KITSS${new Date().getFullYear()}${randomNum}`;

    const newStudent = {
      id: studentId,
      name: formData.name?.trim() || "New Student",
      email: formData.email?.trim() || "",
      phone: formData.phone?.trim() || "",
      dob: formData.dob || "",
      gender: formData.gender || "Not Specified",
      state: formData.state || "Delhi",
      city: formData.city || "New Delhi",
      board: formData.board || "CBSE",
      class: formData.class || "Class 10",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      enrolledCourseIds: store.student?.enrolledCourseIds || ["course-cbse-10-sci"],
      completedLectureIds: store.student?.completedLectureIds || [],
      inProgressLectureIds: store.student?.inProgressLectureIds || [],
      readingProgress: store.student?.readingProgress || {},
    };

    store.student = newStudent;
    saveCoachingStore(store);

    return {
      success: true,
      message: "Your student account has been created. You can now continue with your course selection.",
      student: newStudent,
    };
  },

  // 4. Enroll / Join Course
  async joinCourse(courseId) {
    await delay(200);
    const store = getCoachingStore();
    const course = (store.courses || []).find((c) => c.id === courseId);

    if (!course) {
      throw new Error("Course not found");
    }

    store.student = store.student || {};
    const enrolled = store.student.enrolledCourseIds || [];

    if (!enrolled.includes(courseId)) {
      store.student.enrolledCourseIds = [...enrolled, courseId];
    }

    saveCoachingStore(store);

    return {
      success: true,
      message: "Course Joined Successfully",
      courseId,
      courseTitle: course.title,
    };
  },

  // 5. Get Enrolled Courses for Current Student ("My Courses")
  async getMyCourses() {
    await delay(150);
    const store = getCoachingStore();
    const student = store.student || {};
    const enrolledIds = student.enrolledCourseIds || [];

    const enrolledCourses = (store.courses || [])
      .filter((c) => enrolledIds.includes(c.id))
      .map((course) => {
        let totalLecs = 0;
        let completedCount = 0;
        let totalBooks = 0;

        (course.subjectsData || []).forEach((subj) => {
          (subj.lectures || []).forEach((lec) => {
            totalLecs++;
            if ((student.completedLectureIds || []).includes(lec.id)) {
              completedCount++;
            }
          });
          totalBooks += (subj.books || []).length;
        });

        const progress = totalLecs > 0 ? Math.round((completedCount / totalLecs) * 100) : 0;

        return {
          ...course,
          isEnrolled: true,
          totalLecturesCount: totalLecs || course.lecturesCount,
          completedLectures: completedCount,
          totalBooksCount: totalBooks || course.booksCount,
          progressPercentage: progress,
          expiryStatus: course.expiryDate ? "Active" : "Active",
        };
      });

    return enrolledCourses;
  },

  // 6. Update lecture progress (Completed, In Progress, Not Started)
  async updateLectureProgress(courseId, lectureId, status = "Completed") {
    await delay(100);
    const store = getCoachingStore();
    store.student = store.student || {};

    let completed = store.student.completedLectureIds || [];
    let inProgress = store.student.inProgressLectureIds || [];

    if (status === "Completed") {
      if (!completed.includes(lectureId)) completed.push(lectureId);
      inProgress = inProgress.filter((id) => id !== lectureId);
    } else if (status === "In Progress") {
      completed = completed.filter((id) => id !== lectureId);
      if (!inProgress.includes(lectureId)) inProgress.push(lectureId);
    } else {
      completed = completed.filter((id) => id !== lectureId);
      inProgress = inProgress.filter((id) => id !== lectureId);
    }

    store.student.completedLectureIds = completed;
    store.student.inProgressLectureIds = inProgress;
    saveCoachingStore(store);

    return {
      success: true,
      lectureId,
      status,
    };
  },

  // 7. Update book reading page progress
  async updateBookProgress(bookId, pageNumber) {
    const store = getCoachingStore();
    store.student = store.student || {};
    store.student.readingProgress = store.student.readingProgress || {};
    store.student.readingProgress[bookId] = pageNumber;
    saveCoachingStore(store);
    return { success: true, bookId, pageNumber };
  },

  // 8. Get current student profile
  async getStudentProfile() {
    await delay(100);
    const store = getCoachingStore();
    return store.student;
  },

  // 9. Categories for filter tabs
  async getCategories() {
    return [
      { id: "All", name: "All Courses" },
      { id: "CBSE", name: "CBSE Board" },
      { id: "Madhya Pradesh Board", name: "MP Board" },
      { id: "ICSE", name: "ICSE Board" },
      { id: "Foundation", name: "Class 9 & 10" },
      { id: "Senior", name: "Class 11 & 12" },
    ];
  },
};
