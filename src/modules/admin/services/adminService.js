import { getLocalStore, saveLocalStore } from "../../user/data/mockColleges";

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

function hydrateApplications(applications, colleges, courses) {
  return (applications || []).map((app) => {
    const colId = typeof app.collegeId === "object" ? app.collegeId?._id : app.collegeId;
    const crsId = typeof app.courseId === "object" ? app.courseId?._id : app.courseId;

    const matchedCol = colleges.find(
      (c) => String(c._id) === String(colId) || String(c.id) === String(colId)
    );
    const matchedCrs = courses.find(
      (crs) => String(crs._id) === String(crsId) || String(crs.id) === String(crsId)
    );

    return {
      ...app,
      collegeId: matchedCol || { name: "Partner College", city: "" },
      courseId: matchedCrs || { courseName: "Degree Program", degreeType: "" },
    };
  });
}

export const adminService = {
  // Stats
  async getDashboardStats() {
    await delay(120);
    const store = getLocalStore();
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    const applications = store.applications || [];

    const activeColleges = colleges.filter((c) => c.status === "active").length;
    const activeCourses = courses.filter((c) => c.status === "active").length;

    const statusCounts = {
      New: 0,
      Contacted: 0,
      "In Process": 0,
      Approved: 0,
      Rejected: 0,
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      }
    });

    const hydrated = hydrateApplications(applications, colleges, courses);

    return {
      totalColleges: colleges.length,
      activeColleges,
      totalCourses: courses.length,
      activeCourses,
      totalApplications: applications.length,
      statusCounts,
      recentApplications: hydrated.slice(0, 5),
    };
  },

  // Colleges
  async getColleges() {
    await delay(100);
    const store = getLocalStore();
    const colleges = store.colleges || [];
    const courses = store.courses || [];

    return colleges.map((col) => {
      const cId = String(col._id || col.id);
      const related = courses.filter((crs) => String(crs.collegeId) === cId);
      return {
        ...col,
        totalCourses: related.length,
        activeCourses: related.filter((crs) => crs.status === "active").length,
      };
    });
  },

  async createCollege(collegeData) {
    await delay(150);
    const store = getLocalStore();
    const newCollege = {
      _id: "col_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      status: "active",
      facilities: [],
      contactInformation: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...collegeData,
    };

    store.colleges = [newCollege, ...(store.colleges || [])];
    saveLocalStore(store);
    return newCollege;
  },

  async updateCollege(id, updates) {
    await delay(150);
    const store = getLocalStore();
    const idx = (store.colleges || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );

    if (idx === -1) throw new Error("College not found");

    store.colleges[idx] = {
      ...store.colleges[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveLocalStore(store);
    return store.colleges[idx];
  },

  async toggleCollegeStatus(id) {
    await delay(100);
    const store = getLocalStore();
    const idx = (store.colleges || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );

    if (idx === -1) throw new Error("College not found");

    const currentStatus = store.colleges[idx].status;
    store.colleges[idx].status = currentStatus === "active" ? "inactive" : "active";
    store.colleges[idx].updatedAt = new Date().toISOString();

    saveLocalStore(store);
    return store.colleges[idx];
  },

  async deleteCollege(id) {
    await delay(150);
    const store = getLocalStore();
    store.colleges = (store.colleges || []).filter(
      (c) => String(c._id) !== String(id) && String(c.id) !== String(id)
    );
    // Also remove courses associated with this college
    store.courses = (store.courses || []).filter((crs) => String(crs.collegeId) !== String(id));

    saveLocalStore(store);
    return true;
  },

  // Courses
  async getCourses(collegeId) {
    await delay(100);
    const store = getLocalStore();
    const college = (store.colleges || []).find(
      (c) => String(c._id) === String(collegeId) || String(c.id) === String(collegeId)
    );
    const courses = (store.courses || []).filter(
      (crs) => String(crs.collegeId) === String(collegeId)
    );

    return {
      college: college ? { id: college._id || college.id, name: college.name } : null,
      count: courses.length,
      courses,
    };
  },

  async createCourse(collegeId, courseData) {
    await delay(150);
    const store = getLocalStore();
    const newCourse = {
      _id: "crs_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      collegeId,
      status: "active",
      admissionStatus: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...courseData,
    };

    store.courses = [newCourse, ...(store.courses || [])];
    saveLocalStore(store);
    return newCourse;
  },

  async updateCourse(id, updates) {
    await delay(150);
    const store = getLocalStore();
    const idx = (store.courses || []).findIndex(
      (crs) => String(crs._id) === String(id) || String(crs.id) === String(id)
    );

    if (idx === -1) throw new Error("Course not found");

    store.courses[idx] = {
      ...store.courses[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    saveLocalStore(store);
    return store.courses[idx];
  },

  async toggleCourseStatus(id) {
    await delay(100);
    const store = getLocalStore();
    const idx = (store.courses || []).findIndex(
      (crs) => String(crs._id) === String(id) || String(crs.id) === String(id)
    );

    if (idx === -1) throw new Error("Course not found");

    const currentStatus = store.courses[idx].status;
    store.courses[idx].status = currentStatus === "active" ? "inactive" : "active";
    store.courses[idx].updatedAt = new Date().toISOString();

    saveLocalStore(store);
    return store.courses[idx];
  },

  async deleteCourse(id) {
    await delay(150);
    const store = getLocalStore();
    store.courses = (store.courses || []).filter(
      (crs) => String(crs._id) !== String(id) && String(crs.id) !== String(id)
    );
    saveLocalStore(store);
    return true;
  },

  // Applications
  async getApplications({ status = "All", collegeId = "", search = "" } = {}) {
    await delay(120);
    const store = getLocalStore();
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    let apps = hydrateApplications(store.applications || [], colleges, courses);

    if (status && status !== "All") {
      apps = apps.filter((a) => a.status?.toLowerCase() === status.toLowerCase());
    }

    if (collegeId) {
      apps = apps.filter(
        (a) =>
          String(a.collegeId?._id) === String(collegeId) ||
          String(a.collegeId?.id) === String(collegeId) ||
          String(a.collegeId) === String(collegeId)
      );
    }

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      apps = apps.filter(
        (app) =>
          app.applicationId?.toLowerCase().includes(q) ||
          app.studentDetails?.fullName?.toLowerCase().includes(q) ||
          app.studentDetails?.email?.toLowerCase().includes(q) ||
          app.studentDetails?.mobileNumber?.includes(q) ||
          app.collegeId?.name?.toLowerCase().includes(q) ||
          app.courseId?.courseName?.toLowerCase().includes(q)
      );
    }

    return apps;
  },

  async getApplicationById(id) {
    await delay(100);
    const store = getLocalStore();
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    const apps = hydrateApplications(store.applications || [], colleges, courses);

    const found = apps.find(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );

    if (!found) throw new Error("Application not found");
    return found;
  },

  async updateApplicationStatus(id, status, note = "", author = "Admin") {
    await delay(150);
    const store = getLocalStore();
    const idx = (store.applications || []).findIndex(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );

    if (idx === -1) throw new Error("Application not found");

    store.applications[idx].status = status;
    store.applications[idx].updatedAt = new Date().toISOString();

    if (note && note.trim()) {
      store.applications[idx].adminNotes = store.applications[idx].adminNotes || [];
      store.applications[idx].adminNotes.push({
        _id: "note_" + Date.now().toString(36),
        note: note.trim(),
        author: author || "Admin",
        createdAt: new Date().toISOString(),
      });
    }

    saveLocalStore(store);
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    return hydrateApplications([store.applications[idx]], colleges, courses)[0];
  },

  async addAdminNote(id, note, author = "Admin") {
    await delay(150);
    const store = getLocalStore();
    const idx = (store.applications || []).findIndex(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );

    if (idx === -1) throw new Error("Application not found");

    store.applications[idx].adminNotes = store.applications[idx].adminNotes || [];
    store.applications[idx].adminNotes.push({
      _id: "note_" + Date.now().toString(36),
      note: note.trim(),
      author: author || "Admin",
      createdAt: new Date().toISOString(),
    });
    store.applications[idx].updatedAt = new Date().toISOString();

    saveLocalStore(store);
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    return hydrateApplications([store.applications[idx]], colleges, courses)[0];
  },
};
