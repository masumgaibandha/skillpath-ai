import { Router } from "express";
import { createCheckoutSession } from "../controllers/payment.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

router.post("/checkout-session", requireAuth, createCheckoutSession);

export default router;
