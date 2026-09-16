const API_ADMIN = "/api/admin";

export const adminService = {
  // Stats
  async getDashboardStats() {
    const res = await fetch(`${API_ADMIN}/stats`);
    if (!res.ok) throw new Error("Failed to load admin stats");
    const data = await res.json();
    return data.stats;
  },

  // Colleges
  async getColleges() {
    const res = await fetch(`${API_ADMIN}/colleges`);
    if (!res.ok) throw new Error("Failed to load colleges");
    const data = await res.json();
    return data.colleges || [];
  },

  async createCollege(collegeData) {
    const res = await fetch(`${API_ADMIN}/colleges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collegeData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to create college");
    return data.college;
  },

  async updateCollege(id, updates) {
    const res = await fetch(`${API_ADMIN}/colleges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update college");
    return data.college;
  },

  async toggleCollegeStatus(id) {
    const res = await fetch(`${API_ADMIN}/colleges/${id}/status`, {
      method: "PATCH",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to toggle status");
    return data.college;
  },

  async deleteCollege(id) {
    const res = await fetch(`${API_ADMIN}/colleges/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete college");
    return true;
  },

  // Courses
  async getCourses(collegeId) {
    const res = await fetch(`${API_ADMIN}/colleges/${collegeId}/courses`);
    if (!res.ok) throw new Error("Failed to load courses");
    const data = await res.json();
    return data;
  },

  async createCourse(collegeId, courseData) {
    const res = await fetch(`${API_ADMIN}/colleges/${collegeId}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(courseData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add course");
    return data.course;
  },

  async updateCourse(id, updates) {
    const res = await fetch(`${API_ADMIN}/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update course");
    return data.course;
  },

  async toggleCourseStatus(id) {
    const res = await fetch(`${API_ADMIN}/courses/${id}/status`, {
      method: "PATCH",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to toggle course status");
    return data.course;
  },

  async deleteCourse(id) {
    const res = await fetch(`${API_ADMIN}/courses/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to delete course");
    return true;
  },

  // Applications
  async getApplications({ status = "All", collegeId = "", search = "" } = {}) {
    const params = new URLSearchParams();
    if (status && status !== "All") params.append("status", status);
    if (collegeId) params.append("collegeId", collegeId);
    if (search && search.trim() !== "") params.append("search", search.trim());

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_ADMIN}/applications${qs}`);
    if (!res.ok) throw new Error("Failed to load applications");
    const data = await res.json();
    return data.applications || [];
  },

  async getApplicationById(id) {
    const res = await fetch(`${API_ADMIN}/applications/${id}`);
    if (!res.ok) throw new Error("Failed to load application");
    const data = await res.json();
    return data.application;
  },

  async updateApplicationStatus(id, status, note = "", author = "Admin") {
    const res = await fetch(`${API_ADMIN}/applications/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note, author }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update status");
    return data.application;
  },

  async addAdminNote(id, note, author = "Admin") {
    const res = await fetch(`${API_ADMIN}/applications/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, author }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to add note");
    return data.application;
  },
};
