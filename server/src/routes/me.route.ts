import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Minimal proof that requireAuth works end-to-end; real feature routes
// (items/add, items/manage, enrollments, etc. in later phases) will use
// the same middleware.
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.session?.user ?? null });
});

export default router;
