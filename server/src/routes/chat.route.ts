import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getChatConfig,
  getConversation,
  listMyConversations,
  sendMessage,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/conversations", requireAuth, createConversation);
router.get("/conversations", requireAuth, listMyConversations);
router.get("/config", requireAuth, getChatConfig);
router.get("/conversations/:id", requireAuth, getConversation);
router.post("/conversations/:id/messages", requireAuth, sendMessage);
router.delete("/conversations/:id", requireAuth, deleteConversation);

export default router;
