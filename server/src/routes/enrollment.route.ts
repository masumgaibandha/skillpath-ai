import { Router } from "express";
import {
  enrollFree,
  getEnrollmentStatus,
  listMyEnrollments,
} from "../controllers/enrollment.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/free/:courseId", requireAuth, enrollFree);
router.get("/me", requireAuth, listMyEnrollments);
router.get("/:courseId/status", requireAuth, getEnrollmentStatus);

export default router;
