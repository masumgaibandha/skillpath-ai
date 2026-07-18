import { Router } from "express";
import { createCheckoutSession } from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/checkout-session", requireAuth, createCheckoutSession);

export default router;
