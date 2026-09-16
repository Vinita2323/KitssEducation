import express from "express";
import { collegeController } from "../controllers/collegeController.js";

const router = express.Router();

router.get("/colleges", collegeController.getPublicColleges);
router.get("/colleges/:id", collegeController.getPublicCollegeById);
router.post("/applications", collegeController.submitApplication);

export default router;
