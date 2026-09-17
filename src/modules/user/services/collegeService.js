import { getLocalStore, saveLocalStore } from "../data/mockColleges";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const collegeService = {
  // Fetch active partner colleges with filters
  async getColleges({
    search = "",
    city = "All",
    degree = "All",
    location = "All",
    category = "All",
  } = {}) {
    await delay(100);
    const store = getLocalStore();
    const allCourses = store.courses || [];
    let colleges = (store.colleges || []).filter((c) => c.status === "active");

    // Attach active courses count and degree types to each college
    colleges = colleges.map((college) => {
      const cId = String(college._id || college.id);
      const relatedCourses = allCourses.filter(
        (crs) => String(crs.collegeId) === cId && crs.status === "active"
      );
      return {
        ...college,
        coursesCount: college.coursesCount || relatedCourses.length,
        degreeTypes: Array.from(new Set(relatedCourses.map((c) => c.degreeType).filter(Boolean))),
      };
    });

    // Category filter (University, College, School, Institute)
    if (category && category !== "All") {
      colleges = colleges.filter((c) => {
        const cat = (c.category || c.collegeType || "").toLowerCase();
        return cat.includes(category.toLowerCase());
      });
    }

    // Search filter
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      colleges = colleges.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.popularCourses?.some((crs) => crs.toLowerCase().includes(q))
      );
    }

    // City filter
    if (city && city !== "All") {
      colleges = colleges.filter((c) => c.city?.toLowerCase() === city.toLowerCase());
    }

    // Location filter
    if (location && location !== "All") {
      colleges = colleges.filter(
        (c) =>
          c.location?.toLowerCase().includes(location.toLowerCase()) ||
          c.state?.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Degree filter
    if (degree && degree !== "All") {
      colleges = colleges.filter((c) =>
        c.degreeTypes?.some((d) => d.toLowerCase() === degree.toLowerCase())
      );
    }

    return colleges;
  },

  // Fetch single active college by ID (with active courses)
  async getCollegeById(id) {
    await delay(120);
    const store = getLocalStore();
    const college = (store.colleges || []).find(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );

    if (!college) {
      throw new Error("College not found.");
    }

    const courses = (store.courses || []).filter(
      (crs) =>
        (String(crs.collegeId) === String(id) || String(crs.collegeId) === String(college._id)) &&
        crs.status === "active"
    );

    return {
      ...college,
      courses,
    };
  },

  // Submit student admission application / enquiry
  async submitApplication(applicationData) {
    await delay(200);
    const store = getLocalStore();

    const newApp = {
      _id: "app_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      applicationId: "APP-2026-" + Math.floor(10000 + Math.random() * 90000),
      studentId: applicationData.studentId || "STU-2026-" + Math.floor(1000 + Math.random() * 9000),
      collegeId: applicationData.collegeId,
      courseId: applicationData.courseId,
      studentDetails: applicationData.studentDetails || {},
      status: "New",
      adminNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.applications = [newApp, ...(store.applications || [])];
    saveLocalStore(store);

    return {
      success: true,
      message: "Application submitted successfully!",
      application: newApp,
    };
  },
};
