import { getLocalStore, saveLocalStore } from "../../user/data/mockColleges";

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

function hydrateApplications(applications, colleges, courses) {
  return (applications || []).map((app) => {
    const colId = typeof app.collegeId === "object" ? app.collegeId?._id || app.collegeId?.id : app.collegeId;
    const crsId = typeof app.courseId === "object" ? app.courseId?._id || app.courseId?.id : app.courseId;

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

function hydrateFranchises(franchises, universities, colleges) {
  return (franchises || []).map((f) => {
    const uId = typeof f.universityId === "object" ? f.universityId?._id || f.universityId?.id : f.universityId;
    const cId = typeof f.collegeId === "object" ? f.collegeId?._id || f.collegeId?.id : f.collegeId;

    const matchedUni = (universities || []).find(
      (u) => String(u._id) === String(uId) || String(u.id) === String(uId)
    );
    const matchedCol = (colleges || []).find(
      (c) => String(c._id) === String(cId) || String(c.id) === String(cId)
    );

    return {
      ...f,
      universityId: matchedUni || { name: "University", shortName: "" },
      collegeId: matchedCol || { name: "College / Institute", city: "", state: "" },
    };
  });
}

export const adminService = {
  // ========================================================
  // DASHBOARD STATS
  // ========================================================
  async getDashboardStats() {
    await delay(120);
    const store = getLocalStore();
    const universities = store.universities || [];
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    const applications = store.applications || [];
    const franchiseRegistrations = store.franchiseRegistrations || [];

    const activeUniversities = universities.filter((u) => u.status === "active").length;
    const activeColleges = colleges.filter((c) => c.status === "active").length;
    const activeCourses = courses.filter((c) => c.status === "active").length;

    const applicationStatusCounts = {
      New: 0,
      Contacted: 0,
      "In Process": 0,
      Approved: 0,
      Rejected: 0,
    };
    applications.forEach((app) => {
      if (applicationStatusCounts[app.status] !== undefined) {
        applicationStatusCounts[app.status]++;
      }
    });

    const franchiseStatusCounts = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
    };
    franchiseRegistrations.forEach((fran) => {
      if (franchiseStatusCounts[fran.status] !== undefined) {
        franchiseStatusCounts[fran.status]++;
      }
    });

    const hydratedApps = hydrateApplications(applications, colleges, courses);
    const hydratedFrans = hydrateFranchises(franchiseRegistrations, universities, colleges);

    return {
      totalUniversities: universities.length,
      activeUniversities,
      totalColleges: colleges.length,
      activeColleges,
      totalCourses: courses.length,
      activeCourses,
      totalApplications: applications.length,
      applicationStatusCounts,
      totalFranchiseRegistrations: franchiseRegistrations.length,
      franchiseStatusCounts,
      recentApplications: hydratedApps.slice(0, 5),
      recentFranchiseRegistrations: hydratedFrans.slice(0, 5),
    };
  },

  // ========================================================
  // UNIVERSITIES (Admin Management)
  // ========================================================
  async getUniversities({ status, search } = {}) {
    await delay(100);
    const store = getLocalStore();
    let universities = store.universities || [];
    const colleges = store.colleges || [];

    if (status && status !== "All") {
      universities = universities.filter((u) => u.status === status);
    }

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      universities = universities.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.shortName?.toLowerCase().includes(q)
      );
    }

    return universities.map((uni) => {
      const uId = String(uni._id || uni.id);
      const related = colleges.filter(
        (c) => String(c.universityId?._id || c.universityId) === uId
      );
      return {
        ...uni,
        totalColleges: related.length,
        activeColleges: related.filter((c) => c.status === "active").length,
      };
    });
  },

  async createUniversity(uniData) {
    await delay(150);
    const store = getLocalStore();
    const newUni = {
      _id: "univ_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      id: "univ_" + Date.now().toString(36),
      status: "active",
      logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...uniData,
    };

    store.universities = [newUni, ...(store.universities || [])];
    saveLocalStore(store);
    return newUni;
  },

  async updateUniversity(id, updates) {
    await delay(150);
    const store = getLocalStore();
    const index = (store.universities || []).findIndex(
      (u) => String(u._id) === String(id) || String(u.id) === String(id)
    );
    if (index === -1) throw new Error("University not found");

    const updated = {
      ...store.universities[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.universities[index] = updated;
    saveLocalStore(store);
    return updated;
  },

  async toggleUniversityStatus(id) {
    await delay(100);
    const store = getLocalStore();
    const index = (store.universities || []).findIndex(
      (u) => String(u._id) === String(id) || String(u.id) === String(id)
    );
    if (index === -1) throw new Error("University not found");

    const current = store.universities[index];
    current.status = current.status === "active" ? "inactive" : "active";
    current.updatedAt = new Date().toISOString();
    store.universities[index] = current;
    saveLocalStore(store);
    return current;
  },

  async deleteUniversity(id) {
    await delay(150);
    const store = getLocalStore();
    
    // Check dependent colleges
    const dependentColleges = (store.colleges || []).filter(
      (c) => String(c.universityId?._id || c.universityId) === String(id)
    );
    if (dependentColleges.length > 0) {
      throw new Error(`Cannot delete university because it has ${dependentColleges.length} associated college(s).`);
    }

    // Check dependent franchise registrations
    const dependentFranchises = (store.franchiseRegistrations || []).filter(
      (f) => String(f.universityId?._id || f.universityId) === String(id)
    );
    if (dependentFranchises.length > 0) {
      throw new Error(`Cannot delete university because it has ${dependentFranchises.length} franchise request(s).`);
    }

    store.universities = (store.universities || []).filter(
      (u) => String(u._id) !== String(id) && String(u.id) !== String(id)
    );
    saveLocalStore(store);
    return true;
  },

  // ========================================================
  // COLLEGES (Admin Management)
  // ========================================================
  async getColleges(filter = {}) {
    await delay(100);
    const store = getLocalStore();
    let colleges = store.colleges || [];
    const courses = store.courses || [];
    const universities = store.universities || [];

    if (filter.universityId && filter.universityId !== "All") {
      colleges = colleges.filter(
        (c) => String(c.universityId?._id || c.universityId) === String(filter.universityId)
      );
    }

    if (filter.status && filter.status !== "All") {
      colleges = colleges.filter((c) => c.status === filter.status);
    }

    if (filter.search && filter.search.trim() !== "") {
      const q = filter.search.trim().toLowerCase();
      colleges = colleges.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q)
      );
    }

    return colleges.map((col) => {
      const cId = String(col._id || col.id);
      const related = courses.filter((crs) => String(crs.collegeId) === cId);
      const uId = col.universityId?._id || col.universityId;
      const university = universities.find(
        (u) => String(u._id) === String(uId) || String(u.id) === String(uId)
      );

      return {
        ...col,
        universityId: university || col.universityId,
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
      id: "col_" + Date.now().toString(36),
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
    const index = (store.colleges || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );
    if (index === -1) throw new Error("College not found");

    const updated = {
      ...store.colleges[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.colleges[index] = updated;
    saveLocalStore(store);
    return updated;
  },

  async toggleCollegeStatus(id) {
    await delay(100);
    const store = getLocalStore();
    const index = (store.colleges || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );
    if (index === -1) throw new Error("College not found");

    const current = store.colleges[index];
    current.status = current.status === "active" ? "inactive" : "active";
    current.updatedAt = new Date().toISOString();
    store.colleges[index] = current;
    saveLocalStore(store);
    return current;
  },

  async deleteCollege(id) {
    await delay(150);
    const store = getLocalStore();

    // Check dependent franchise registrations
    const dependentFranchises = (store.franchiseRegistrations || []).filter(
      (f) => String(f.collegeId?._id || f.collegeId) === String(id)
    );
    if (dependentFranchises.length > 0) {
      throw new Error(`Cannot delete college because it has ${dependentFranchises.length} franchise application record(s).`);
    }

    store.colleges = (store.colleges || []).filter(
      (c) => String(c._id) !== String(id) && String(c.id) !== String(id)
    );
    store.courses = (store.courses || []).filter(
      (crs) => String(crs.collegeId) !== String(id)
    );
    saveLocalStore(store);
    return true;
  },

  // ========================================================
  // COURSES
  // ========================================================
  async getCollegeCourses(collegeId) {
    await delay(100);
    const store = getLocalStore();
    const courses = (store.courses || []).filter(
      (crs) => String(crs.collegeId) === String(collegeId)
    );
    const college = (store.colleges || []).find(
      (c) => String(c._id) === String(collegeId) || String(c.id) === String(collegeId)
    );
    return { college, courses };
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
    const index = (store.courses || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );
    if (index === -1) throw new Error("Course not found");

    const updated = {
      ...store.courses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.courses[index] = updated;
    saveLocalStore(store);
    return updated;
  },

  async toggleCourseStatus(id) {
    await delay(100);
    const store = getLocalStore();
    const index = (store.courses || []).findIndex(
      (c) => String(c._id) === String(id) || String(c.id) === String(id)
    );
    if (index === -1) throw new Error("Course not found");

    const current = store.courses[index];
    current.status = current.status === "active" ? "inactive" : "active";
    current.updatedAt = new Date().toISOString();
    store.courses[index] = current;
    saveLocalStore(store);
    return current;
  },

  async deleteCourse(id) {
    await delay(100);
    const store = getLocalStore();
    store.courses = (store.courses || []).filter(
      (c) => String(c._id) !== String(id) && String(c.id) !== String(id)
    );
    saveLocalStore(store);
    return true;
  },

  // ========================================================
  // ADMISSION APPLICATIONS
  // ========================================================
  async getApplications({ status = "All", collegeId = "All", search = "" } = {}) {
    await delay(120);
    const store = getLocalStore();
    const colleges = store.colleges || [];
    const courses = store.courses || [];
    let applications = store.applications || [];

    if (status && status !== "All") {
      applications = applications.filter(
        (a) => a.status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (collegeId && collegeId !== "All") {
      applications = applications.filter(
        (a) =>
          String(a.collegeId?._id || a.collegeId) === String(collegeId)
      );
    }

    const hydrated = hydrateApplications(applications, colleges, courses);

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      return hydrated.filter(
        (a) =>
          a.applicationId?.toLowerCase().includes(q) ||
          a.studentDetails?.fullName?.toLowerCase().includes(q) ||
          a.studentDetails?.email?.toLowerCase().includes(q) ||
          a.studentDetails?.mobileNumber?.includes(q) ||
          a.collegeId?.name?.toLowerCase().includes(q)
      );
    }

    return hydrated;
  },

  async updateApplicationStatus(id, status, note = null, author = "Admin") {
    await delay(150);
    const store = getLocalStore();
    const index = (store.applications || []).findIndex(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );
    if (index === -1) throw new Error("Application not found");

    const app = store.applications[index];
    app.status = status;
    app.updatedAt = new Date().toISOString();

    if (note) {
      app.adminNotes = app.adminNotes || [];
      app.adminNotes.push({
        _id: "note_" + Date.now().toString(36),
        note,
        author,
        createdAt: new Date().toISOString(),
      });
    }

    store.applications[index] = app;
    saveLocalStore(store);
    return app;
  },

  // ========================================================
  // FRANCHISE REGISTRATIONS (Admin Approvals & Management)
  // ========================================================
  async getFranchiseRegistrations({ status = "All", search = "", universityId, collegeId } = {}) {
    await delay(120);
    const store = getLocalStore();
    const universities = store.universities || [];
    const colleges = store.colleges || [];
    let franchises = store.franchiseRegistrations || [];

    if (status && status !== "All") {
      franchises = franchises.filter(
        (f) => f.status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (universityId && universityId !== "All") {
      franchises = franchises.filter(
        (f) =>
          String(f.universityId?._id || f.universityId) === String(universityId)
      );
    }

    if (collegeId && collegeId !== "All") {
      franchises = franchises.filter(
        (f) =>
          String(f.collegeId?._id || f.collegeId) === String(collegeId)
      );
    }

    const hydrated = hydrateFranchises(franchises, universities, colleges);

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      return hydrated.filter(
        (f) =>
          f.contactPerson?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q) ||
          f.mobile?.includes(q) ||
          f.city?.toLowerCase().includes(q) ||
          f.applicationId?.toLowerCase().includes(q) ||
          f.universityId?.name?.toLowerCase().includes(q) ||
          f.collegeId?.name?.toLowerCase().includes(q)
      );
    }

    return hydrated;
  },

  async updateFranchiseStatus(id, status, rejectionReason = "", note = null, author = "Super Admin") {
    await delay(180);
    const store = getLocalStore();
    const index = (store.franchiseRegistrations || []).findIndex(
      (f) => String(f._id) === String(id) || String(f.id) === String(id) || f.applicationId === id
    );
    if (index === -1) throw new Error("Franchise registration not found");

    const franchise = store.franchiseRegistrations[index];
    franchise.status = status;
    if (rejectionReason !== undefined) {
      franchise.rejectionReason = rejectionReason;
    }
    franchise.updatedAt = new Date().toISOString();

    if (note) {
      franchise.adminNotes = franchise.adminNotes || [];
      franchise.adminNotes.push({
        _id: "note_" + Date.now().toString(36),
        note,
        author,
        createdAt: new Date().toISOString(),
      });
    }

    store.franchiseRegistrations[index] = franchise;
    saveLocalStore(store);

    const universities = store.universities || [];
    const colleges = store.colleges || [];
    return hydrateFranchises([franchise], universities, colleges)[0];
  },
};
