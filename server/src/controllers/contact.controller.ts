import type { Request, Response } from "express";
import { z } from "zod";
import ContactMessage from "../models/ContactMessage.js";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Enter a valid email address"),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export async function createContactMessage(req: Request, res: Response) {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid contact form submission",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  await ContactMessage.create(parsed.data);
  res.status(201).json({ ok: true });
}
