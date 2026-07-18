import { Router } from "express";
import { createContactMessage } from "../controllers/contact.controller";

const router = Router();

// Public — anyone can reach the site's Contact form, no auth required.
router.post("/", createContactMessage);

export default router;
