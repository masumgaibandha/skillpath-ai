import { Router } from "express";
import { getCourseBySlug, listCourses } from "../controllers/course.controller";

const router = Router();

// Route order matters here: Express matches top-to-bottom, and "/:slug"
// below will greedily match ANY single path segment. Static/reserved
// segments MUST be registered before "/:slug", or they'll be swallowed as
// slug="mine" etc. instead of reaching their own handler.
//
// Phase 4 adds `GET /api/courses/mine` (the current user's own courses) —
// when that's implemented, add it here, ABOVE the "/:slug" route:
//
//   router.get("/mine", requireAuth, listMyCourses);
//   router.get("/:slug", getCourseBySlug);
//
router.get("/", listCourses);
router.get("/:slug", getCourseBySlug);

export default router;
