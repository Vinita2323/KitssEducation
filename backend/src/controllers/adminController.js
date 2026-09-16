import { dataService } from "../services/dataService.js";

export const adminController = {
  // --- DASHBOARD STATS ---
  async getDashboardStats(req, res) {
    try {
      const colleges = await dataService.getColleges();
      const courses = await dataService.getCourses();
      const applications = await dataService.getApplications();

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

      return res.json({
        success: true,
        stats: {
          totalColleges: colleges.length,
          activeColleges,
          totalCourses: courses.length,
          activeCourses,
          totalApplications: applications.length,
          statusCounts,
          recentApplications: applications.slice(0, 5),
        },
      });
    } catch (err) {
      console.error("Error in getDashboardStats:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch dashboard stats." });
    }
  },

  // --- COLLEGES ---
  async getAdminColleges(req, res) {
    try {
      const colleges = await dataService.getColleges();
      const allCourses = await dataService.getCourses();

      const enriched = colleges.map((col) => {
        const cId = String(col._id || col.id);
        const related = allCourses.filter((crs) => String(crs.collegeId) === cId);
        return {
          ...col,
          totalCourses: related.length,
          activeCourses: related.filter((crs) => crs.status === "active").length,
        };
      });

      return res.json({
        success: true,
        count: enriched.length,
        colleges: enriched,
      });
    } catch (err) {
      console.error("Error in getAdminColleges:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch colleges." });
    }
  },

  async createCollege(req, res) {
    try {
      const {
        name,
        logo,
        banner,
        description,
        address,
        city,
        state,
        country,
        location,
        collegeType,
        status,
        about,
        facilities,
        admissionInformation,
        contactInformation,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: "College name is required." });
      }

      if (!city || !city.trim()) {
        return res.status(400).json({ success: false, message: "City is required." });
      }

      const parsedFacilities = Array.isArray(facilities)
        ? facilities
        : typeof facilities === "string" && facilities.trim() !== ""
        ? facilities.split(",").map((f) => f.trim()).filter(Boolean)
        : [];

      const newCollege = await dataService.createCollege({
        name: name.trim(),
        logo: logo || "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
        banner: banner || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
        description: description || "",
        address: address || "",
        city: city.trim(),
        state: state || "",
        country: country || "India",
        location: location || `${city}${state ? ", " + state : ""}`,
        collegeType: collegeType || "Private University",
        status: status === "inactive" ? "inactive" : "active",
        about: about || description || "",
        facilities: parsedFacilities,
        admissionInformation: admissionInformation || "",
        contactInformation: contactInformation || { phone: "", email: "", website: "" },
      });

      return res.status(201).json({
        success: true,
        message: "Partner college created successfully.",
        college: newCollege,
      });
    } catch (err) {
      console.error("Error in createCollege:", err);
      return res.status(500).json({ success: false, message: "Failed to create partner college." });
    }
  },

  async updateCollege(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (updates.facilities && typeof updates.facilities === "string") {
        updates.facilities = updates.facilities.split(",").map((f) => f.trim()).filter(Boolean);
      }

      const updated = await dataService.updateCollege(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: "College not found." });
      }

      return res.json({
        success: true,
        message: "College updated successfully.",
        college: updated,
      });
    } catch (err) {
      console.error("Error in updateCollege:", err);
      return res.status(500).json({ success: false, message: "Failed to update college." });
    }
  },

  async toggleCollegeStatus(req, res) {
    try {
      const { id } = req.params;
      const college = await dataService.getCollegeById(id);
      if (!college) {
        return res.status(404).json({ success: false, message: "College not found." });
      }

      const newStatus = college.status === "active" ? "inactive" : "active";
      const updated = await dataService.updateCollege(id, { status: newStatus });

      return res.json({
        success: true,
        message: `College marked as ${newStatus}.`,
        college: updated,
      });
    } catch (err) {
      console.error("Error in toggleCollegeStatus:", err);
      return res.status(500).json({ success: false, message: "Failed to toggle college status." });
    }
  },

  async deleteCollege(req, res) {
    try {
      const { id } = req.params;
      await dataService.deleteCollege(id);
      return res.json({
        success: true,
        message: "College and associated courses removed successfully.",
      });
    } catch (err) {
      console.error("Error in deleteCollege:", err);
      return res.status(500).json({ success: false, message: "Failed to delete college." });
    }
  },

  // --- COURSES ---
  async getCollegeCourses(req, res) {
    try {
      const { collegeId } = req.params;
      const courses = await dataService.getCourses({ collegeId });
      const college = await dataService.getCollegeById(collegeId);

      return res.json({
        success: true,
        college: college ? { id: college._id || college.id, name: college.name } : null,
        count: courses.length,
        courses,
      });
    } catch (err) {
      console.error("Error in getCollegeCourses:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch courses." });
    }
  },

  async createCourse(req, res) {
    try {
      const { collegeId } = req.params;
      const {
        courseName,
        degreeType,
        duration,
        eligibility,
        fee,
        description,
        availableSeats,
        admissionStatus,
        status,
      } = req.body;

      if (!courseName || !courseName.trim()) {
        return res.status(400).json({ success: false, message: "Course name is required." });
      }

      const newCourse = await dataService.createCourse({
        collegeId,
        courseName: courseName.trim(),
        degreeType: degreeType || "Undergraduate",
        duration: duration || "3 Years",
        eligibility: eligibility || "10+2 with minimum 50% aggregate",
        fee: Number(fee) || 0,
        description: description || "",
        availableSeats: Number(availableSeats) || 60,
        admissionStatus: admissionStatus || "Open",
        status: status === "inactive" ? "inactive" : "active",
      });

      return res.status(201).json({
        success: true,
        message: "Course added successfully.",
        course: newCourse,
      });
    } catch (err) {
      console.error("Error in createCourse:", err);
      return res.status(500).json({ success: false, message: "Failed to add course." });
    }
  },

  async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      if (updates.fee !== undefined) updates.fee = Number(updates.fee);
      if (updates.availableSeats !== undefined) updates.availableSeats = Number(updates.availableSeats);

      const updated = await dataService.updateCourse(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Course not found." });
      }

      return res.json({
        success: true,
        message: "Course updated successfully.",
        course: updated,
      });
    } catch (err) {
      console.error("Error in updateCourse:", err);
      return res.status(500).json({ success: false, message: "Failed to update course." });
    }
  },

  async toggleCourseStatus(req, res) {
    try {
      const { id } = req.params;
      const course = await dataService.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: "Course not found." });
      }

      const newStatus = course.status === "active" ? "inactive" : "active";
      const updated = await dataService.updateCourse(id, { status: newStatus });

      return res.json({
        success: true,
        message: `Course marked as ${newStatus}.`,
        course: updated,
      });
    } catch (err) {
      console.error("Error in toggleCourseStatus:", err);
      return res.status(500).json({ success: false, message: "Failed to toggle course status." });
    }
  },

  async deleteCourse(req, res) {
    try {
      const { id } = req.params;
      await dataService.deleteCourse(id);
      return res.json({
        success: true,
        message: "Course deleted successfully.",
      });
    } catch (err) {
      console.error("Error in deleteCourse:", err);
      return res.status(500).json({ success: false, message: "Failed to delete course." });
    }
  },

  // --- ADMISSION APPLICATIONS ---
  async getApplications(req, res) {
    try {
      const { status, collegeId, search } = req.query;
      let applications = await dataService.getApplications({ status, collegeId });

      if (search && search.trim() !== "") {
        const q = search.trim().toLowerCase();
        applications = applications.filter(
          (app) =>
            app.applicationId?.toLowerCase().includes(q) ||
            app.studentDetails?.fullName?.toLowerCase().includes(q) ||
            app.studentDetails?.email?.toLowerCase().includes(q) ||
            app.studentDetails?.mobileNumber?.includes(q) ||
            app.collegeId?.name?.toLowerCase().includes(q) ||
            app.courseId?.courseName?.toLowerCase().includes(q)
        );
      }

      return res.json({
        success: true,
        count: applications.length,
        applications,
      });
    } catch (err) {
      console.error("Error in getApplications:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch applications." });
    }
  },

  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = await dataService.getApplicationById(id);
      if (!application) {
        return res.status(404).json({ success: false, message: "Application not found." });
      }

      return res.json({
        success: true,
        application,
      });
    } catch (err) {
      console.error("Error in getApplicationById:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch application details." });
    }
  },

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, note, author } = req.body;

      const validStatuses = ["New", "Contacted", "In Process", "Approved", "Rejected"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const updated = await dataService.updateApplicationStatus(
        id,
        status,
        note,
        author || "Admin"
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Application not found." });
      }

      return res.json({
        success: true,
        message: `Application status updated to ${status}.`,
        application: updated,
      });
    } catch (err) {
      console.error("Error in updateApplicationStatus:", err);
      return res.status(500).json({ success: false, message: "Failed to update application status." });
    }
  },

  async addAdminNote(req, res) {
    try {
      const { id } = req.params;
      const { note, author } = req.body;

      if (!note || !note.trim()) {
        return res.status(400).json({ success: false, message: "Note content cannot be empty." });
      }

      const updated = await dataService.addApplicationNote(
        id,
        note.trim(),
        author || "Admin"
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Application not found." });
      }

      return res.json({
        success: true,
        message: "Note added successfully.",
        application: updated,
      });
    } catch (err) {
      console.error("Error in addAdminNote:", err);
      return res.status(500).json({ success: false, message: "Failed to add admin note." });
    }
  },
};
