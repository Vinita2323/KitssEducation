const API_BASE = "/api";

export const collegeService = {
  // Fetch active partner colleges with filters
  async getColleges({ search = "", city = "All", degree = "All", location = "All" } = {}) {
    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.append("search", search.trim());
    if (city && city !== "All") params.append("city", city);
    if (degree && degree !== "All") params.append("degree", degree);
    if (location && location !== "All") params.append("location", location);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${API_BASE}/colleges${queryString}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load colleges");
    }

    const data = await response.json();
    return data.colleges || [];
  },

  // Fetch single active college by ID (with active courses)
  async getCollegeById(id) {
    const response = await fetch(`${API_BASE}/colleges/${id}`);
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to load college details");
    }

    const data = await response.json();
    return data.college;
  },

  // Submit student admission application / enquiry
  async submitApplication(applicationData) {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(applicationData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to submit admission application");
    }

    return data;
  },
};
