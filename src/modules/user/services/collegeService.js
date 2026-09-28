import { getLocalStore, saveLocalStore } from "../data/mockColleges";

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const collegeService = {
  // Fetch active partner colleges with filters
  async getColleges({
    search = "",
    city = "All",
    state = "All",
    district = "All",
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
        (crs) =>
          (String(crs.collegeId) === cId ||
           String(crs.collegeId) === String(college._id) ||
           String(crs.collegeId) === String(college.id)) &&
          crs.status === "active"
      );
      return {
        ...college,
        coursesCount: relatedCourses.length || college.coursesCount || 3,
        popularCourses:
          relatedCourses.length > 0
            ? relatedCourses.map((c) => c.courseName).slice(0, 3)
            : college.popularCourses,
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
          c.district?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.popularCourses?.some((crs) => crs.toLowerCase().includes(q))
      );
    }

    // State filter
    if (state && state !== "All") {
      colleges = colleges.filter(
        (c) => (c.state || "").toLowerCase() === state.toLowerCase()
      );
    }

    // District filter
    if (district && district !== "All") {
      colleges = colleges.filter(
        (c) =>
          (c.district || c.city || "").toLowerCase() === district.toLowerCase()
      );
    }

    // City filter (retained for backward compatibility)
    if (city && city !== "All") {
      colleges = colleges.filter((c) => c.city?.toLowerCase() === city.toLowerCase());
    }

    // Location filter
    if (location && location !== "All") {
      colleges = colleges.filter(
        (c) =>
          c.location?.toLowerCase().includes(location.toLowerCase()) ||
          c.district?.toLowerCase().includes(location.toLowerCase()) ||
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

  // Fetch active partner institutes & franchise colleges (excluding root universities)
  async getInstitutes({
    search = "",
    city = "All",
    state = "All",
    district = "All",
    degree = "All",
    universityId = "All",
  } = {}) {
    await delay(100);
    const store = getLocalStore();
    const allCourses = store.courses || [];
    const allUniversities = store.universities || [];

    // Filter out root universities (keep institutes, colleges, academies, schools)
    let institutes = (store.colleges || []).filter(
      (c) => c.status === "active" && c.collegeType !== "University" && c.category !== "University"
    );

    // Map university details to each institute
    institutes = institutes.map((inst) => {
      const cId = String(inst._id || inst.id);
      const relatedCourses = allCourses.filter(
        (crs) =>
          (String(crs.collegeId) === cId ||
           String(crs.collegeId) === String(inst._id) ||
           String(crs.collegeId) === String(inst.id)) &&
          crs.status === "active"
      );

      // Determine parent university
      let parentUni = allUniversities.find(
        (u) => String(u._id || u.id) === String(inst.universityId)
      );

      if (!parentUni) {
        if (inst.name?.toLowerCase().includes("amity") || inst.name?.toLowerCase().includes("apex") || inst.state === "Uttar Pradesh") {
          parentUni = allUniversities.find((u) => u.shortName === "AU") || { name: "Amity University (AU)", shortName: "AU", id: "univ-amity" };
        } else if (inst.name?.toLowerCase().includes("manipal") || inst.name?.toLowerCase().includes("xavier") || inst.state === "Karnataka") {
          parentUni = allUniversities.find((u) => u.shortName === "MAHE") || { name: "Manipal Academy of Higher Education", shortName: "MAHE", id: "univ-mahe" };
        } else if (inst.name?.toLowerCase().includes("punjab") || inst.state === "Punjab") {
          parentUni = allUniversities.find((u) => u.shortName === "LPU") || { name: "Lovely Professional University", shortName: "LPU", id: "univ-lpu" };
        } else if (inst.name?.toLowerCase().includes("mumbai") || inst.name?.toLowerCase().includes("kota")) {
          parentUni = allUniversities.find((u) => u.shortName === "CU") || { name: "Chandigarh University", shortName: "CU", id: "univ-cu" };
        } else {
          parentUni = allUniversities.find((u) => u.shortName === "DU") || { name: "Delhi University", shortName: "DU", id: "univ-du" };
        }
      }

      return {
        ...inst,
        universityId: inst.universityId || parentUni?.id || parentUni?._id || "univ-du",
        parentUniversityName: parentUni?.name || "Delhi University",
        parentUniversityShort: parentUni?.shortName || "DU",
        coursesCount: relatedCourses.length || inst.coursesCount || 3,
        popularCourses:
          relatedCourses.length > 0
            ? relatedCourses.map((c) => c.courseName).slice(0, 3)
            : inst.popularCourses,
        degreeTypes: Array.from(new Set(relatedCourses.map((c) => c.degreeType).filter(Boolean))),
      };
    });

    // University tie-up filter
    if (universityId && universityId !== "All") {
      institutes = institutes.filter(
        (inst) =>
          String(inst.universityId) === String(universityId) ||
          inst.parentUniversityShort?.toLowerCase() === universityId.toLowerCase()
      );
    }

    // Search filter
    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      institutes = institutes.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.parentUniversityName?.toLowerCase().includes(q) ||
          c.district?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.state?.toLowerCase().includes(q) ||
          c.location?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.popularCourses?.some((crs) => crs.toLowerCase().includes(q))
      );
    }

    // State filter
    if (state && state !== "All") {
      institutes = institutes.filter(
        (c) => (c.state || "").toLowerCase() === state.toLowerCase()
      );
    }

    // District filter
    if (district && district !== "All") {
      institutes = institutes.filter(
        (c) =>
          (c.district || c.city || "").toLowerCase() === district.toLowerCase()
      );
    }

    // Degree filter
    if (degree && degree !== "All") {
      institutes = institutes.filter((c) =>
        c.degreeTypes?.some((d) => d.toLowerCase() === degree.toLowerCase())
      );
    }

    return institutes;
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

    const cId = String(college._id || college.id);
    const courses = (store.courses || []).filter(
      (crs) =>
        (String(crs.collegeId) === String(id) ||
         String(crs.collegeId) === cId ||
         String(crs.collegeId) === String(college._id) ||
         String(crs.collegeId) === String(college.id)) &&
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

  // Fetch approved active universities for Franchise Registration dropdown
  async getUniversities({ status = "active", search = "" } = {}) {
    await delay(120);
    const store = getLocalStore();
    let universities = store.universities || [];

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

    return universities;
  },

  // Fetch colleges/institutes dynamically for selected university
  async getCollegesByUniversity(universityId, { status = "active", search = "" } = {}) {
    await delay(150);
    const store = getLocalStore();
    let colleges = (store.colleges || []).filter(
      (c) =>
        String(c.universityId?._id || c.universityId) === String(universityId)
    );

    if (status && status !== "All") {
      colleges = colleges.filter((c) => c.status === status);
    }

    if (search && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      colleges = colleges.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q)
      );
    }

    return colleges;
  },

  // Submit Franchise Registration (University -> College hierarchy, status = Pending)
  async submitFranchiseRegistration(franchiseData) {
    await delay(300);
    const store = getLocalStore();

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const applicationId = `FRAN-2026-${randomSuffix}`;

    const newFranchise = {
      _id: "fran_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      id: "fran_" + Date.now().toString(36),
      applicationId,
      universityId: franchiseData.universityId,
      collegeId: franchiseData.collegeId,
      institutionName: (franchiseData.institutionName || "").trim(),
      institutionType: (franchiseData.institutionType || "College").trim(),
      yearEstablished: (franchiseData.yearEstablished || "").trim(),
      website: (franchiseData.website || "").trim(),
      institutionLogo: franchiseData.institutionLogo || "",
      recognitionAffiliation: (franchiseData.recognitionAffiliation || "").trim(),
      affiliationNumber: (franchiseData.affiliationNumber || "").trim(),
      programsOffered: Array.isArray(franchiseData.programsOffered) ? franchiseData.programsOffered : [],
      contactPerson: (franchiseData.contactPerson || franchiseData.fullName || "").trim(),
      designation: (franchiseData.designation || "Director").trim(),
      email: (franchiseData.email || "").trim(),
      mobile: (franchiseData.mobile || franchiseData.phone || "").trim(),
      alternateMobile: (franchiseData.alternateMobile || "").trim(),
      address: (franchiseData.address || "").trim(),
      city: (franchiseData.city || "").trim(),
      state: (franchiseData.state || "").trim(),
      pincode: (franchiseData.pincode || "").trim(),
      googleMapsLocation: (franchiseData.googleMapsLocation || "").trim(),
      documents: franchiseData.documents || {},
      status: "Pending",
      rejectionReason: "",
      adminNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.franchiseRegistrations = [newFranchise, ...(store.franchiseRegistrations || [])];
    saveLocalStore(store);

    return {
      success: true,
      message: "Franchise application submitted successfully and is Pending Admin review.",
      applicationId: newFranchise.applicationId,
      registration: newFranchise,
    };
  },

  // Backward compatible alias
  async submitFranchiseApplication(franchiseData) {
    return this.submitFranchiseRegistration(franchiseData);
  },
};
