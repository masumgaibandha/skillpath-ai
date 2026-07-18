import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourseBySlug,
  listCourses,
  listMyCourses,
} from "../controllers/course.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Route order matters here: Express matches top-to-bottom, and "/:slug"
// below will greedily match ANY single path segment. Static/reserved
// segments MUST be registered before "/:slug", or they'll be swallowed as
// slug="mine" etc. instead of reaching their own handler.
router.get("/", listCourses);
router.get("/mine", requireAuth, listMyCourses);
router.post("/", requireAuth, createCourse);
router.get("/:slug", getCourseBySlug);
router.delete("/:id", requireAuth, deleteCourse);

export default router;
