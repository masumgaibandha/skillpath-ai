import { Router } from "express";
import {
  createStudyPlan,
  getStudyPlan,
  getStudyPlanConfig,
  listMyStudyPlans,
  refineStudyPlan,
} from "../controllers/studyPlan.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/", requireAuth, createStudyPlan);
// Must come before /:id so "me"/"config" aren't parsed as an id.
router.get("/me", requireAuth, listMyStudyPlans);
router.get("/config", requireAuth, getStudyPlanConfig);
router.get("/:id", requireAuth, getStudyPlan);
router.post("/:id/refine", requireAuth, refineStudyPlan);

export default router;
