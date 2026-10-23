import express from "express";
import { adminController } from "../controllers/adminController.js";

const router = express.Router();

// Dashboard stats
router.get("/stats", adminController.getDashboardStats);

// Partner Colleges
router.get("/colleges", adminController.getAdminColleges);
router.post("/colleges", adminController.createCollege);
router.put("/colleges/:id", adminController.updateCollege);
router.patch("/colleges/:id/status", adminController.toggleCollegeStatus);
router.delete("/colleges/:id", adminController.deleteCollege);

// Courses for a College
router.get("/colleges/:collegeId/courses", adminController.getCollegeCourses);
router.post("/colleges/:collegeId/courses", adminController.createCourse);
router.put("/courses/:id", adminController.updateCourse);
router.patch("/courses/:id/status", adminController.toggleCourseStatus);
router.delete("/courses/:id", adminController.deleteCourse);

// Admission Applications
router.get("/applications", adminController.getApplications);
router.get("/applications/:id", adminController.getApplicationById);
router.patch("/applications/:id/status", adminController.updateApplicationStatus);
router.post("/applications/:id/notes", adminController.addAdminNote);

export default router;
