import { Router } from "express";
import { getDbStatus } from "../config/db";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    db: getDbStatus(),
  });
});

export default router;
