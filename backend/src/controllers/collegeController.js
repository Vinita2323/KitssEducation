import { dataService } from "../services/dataService.js";

export const collegeController = {
  // GET /api/colleges (Student view - only active colleges)
  async getPublicColleges(req, res) {
    try {
      const { search, city, degree, location } = req.query;

      // 1. Fetch only active colleges
      let colleges = await dataService.getColleges({ status: "active" });

      // 2. Attach active courses count to each college
      const allActiveCourses = await dataService.getCourses({ status: "active" });

      colleges = colleges.map((college) => {
        const cId = String(college._id || college.id);
        const relatedCourses = allActiveCourses.filter((crs) => String(crs.collegeId) === cId);
        return {
          ...college,
          coursesCount: relatedCourses.length,
          degreeTypes: Array.from(new Set(relatedCourses.map((c) => c.degreeType).filter(Boolean))),
        };
      });

      // 3. Search filter by name or city or description
      if (search && search.trim() !== "") {
        const q = search.trim().toLowerCase();
        colleges = colleges.filter(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.city?.toLowerCase().includes(q) ||
            c.state?.toLowerCase().includes(q) ||
            c.location?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q)
        );
      }

      // 4. City filter
      if (city && city !== "All") {
        colleges = colleges.filter((c) => c.city?.toLowerCase() === city.toLowerCase());
      }

      // 5. Location filter
      if (location && location !== "All") {
        colleges = colleges.filter(
          (c) =>
            c.location?.toLowerCase().includes(location.toLowerCase()) ||
            c.state?.toLowerCase().includes(location.toLowerCase())
        );
      }

      // 6. Degree filter
      if (degree && degree !== "All") {
        colleges = colleges.filter((c) =>
          c.degreeTypes?.some((d) => d.toLowerCase() === degree.toLowerCase())
        );
      }

      return res.json({
        success: true,
        count: colleges.length,
        colleges,
      });
    } catch (err) {
      console.error("Error in getPublicColleges:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch partner colleges." });
    }
  },

  // GET /api/colleges/:id (Student detail view)
  async getPublicCollegeById(req, res) {
    try {
      const { id } = req.params;
      const college = await dataService.getCollegeById(id);

      if (!college || college.status !== "active") {
        return res.status(404).json({ success: false, message: "College not found or inactive." });
      }

      const courses = await dataService.getCourses({
        collegeId: id,
        status: "active",
      });

      return res.json({
        success: true,
        college: {
          ...college,
          courses,
        },
      });
    } catch (err) {
      console.error("Error in getPublicCollegeById:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch college details." });
    }
  },

  // POST /api/applications (Student submit admission enquiry/application)
  async submitApplication(req, res) {
    try {
      const { collegeId, courseId, studentId, studentDetails } = req.body;

      if (!collegeId || !courseId) {
        return res.status(400).json({
          success: false,
          message: "Please select both a college and a course.",
        });
      }

      if (
        !studentDetails ||
        !studentDetails.fullName?.trim() ||
        !studentDetails.mobileNumber?.trim() ||
        !studentDetails.email?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide your Full Name, Mobile Number, and Email.",
        });
      }

      // Validate college exists
      const college = await dataService.getCollegeById(collegeId);
      if (!college) {
        return res.status(404).json({ success: false, message: "Selected college not found." });
      }

      // Validate course exists
      const course = await dataService.getCourseById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: "Selected course not found." });
      }

      // Generate unique application reference ID e.g. APP-2026-87421
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const applicationId = `APP-2026-${randomSuffix}`;

      const newApplication = await dataService.createApplication({
        applicationId,
        studentId: studentId || "",
        collegeId,
        courseId,
        studentDetails: {
          fullName: studentDetails.fullName.trim(),
          mobileNumber: studentDetails.mobileNumber.trim(),
          email: studentDetails.email.trim(),
          dob: studentDetails.dob || "",
          city: studentDetails.city || "",
          educationalQualification: studentDetails.educationalQualification || "",
          passingYear: studentDetails.passingYear || "",
          additionalInfo: studentDetails.additionalInfo || "",
        },
        status: "New",
      });

      return res.status(201).json({
        success: true,
        message: "Your admission enquiry has been submitted successfully. Our admission team will contact you shortly.",
        applicationId: newApplication.applicationId,
        application: newApplication,
      });
    } catch (err) {
      console.error("Error in submitApplication:", err);
      return res.status(500).json({ success: false, message: "Failed to submit admission application." });
    }
  },
};
