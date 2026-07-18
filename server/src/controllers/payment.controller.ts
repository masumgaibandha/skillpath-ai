import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import type Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";
import { stripe, stripeConfigured } from "../lib/stripe";

const checkoutSessionSchema = z.object({
  courseId: z.string().min(1, "courseId is required"),
});

export async function createCheckoutSession(req: Request, res: Response) {
  const parsed = checkoutSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid checkout request",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { courseId } = parsed.data;
  if (!isValidObjectId(courseId)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }

  // Price and currency always come from MongoDB, never the client — the
  // request body only ever carries a courseId to look them up by. All of
  // this validation runs regardless of whether Stripe itself is
  // configured, so "missing/unpublished/free/already-enrolled" are
  // rejected on their own merits rather than being masked by a 503.
  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  if (course.isFree) {
    res.status(400).json({ error: "This course is free — use the free enrollment endpoint" });
    return;
  }

  const userId = req.session!.user.id;
  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing?.status === "active") {
    res.status(409).json({ error: "You're already enrolled in this course" });
    return;
  }

  // Only the actual Stripe API call is gated on configuration — every
  // check above runs, and needs to, whether or not Stripe is set up.
  if (!stripe) {
    res.status(503).json({ error: "Payments are not configured on this server" });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: course.currency,
          unit_amount: Math.round(course.price * 100),
          product_data: {
            name: course.title,
            description: course.shortDescription,
          },
        },
        quantity: 1,
      },
    ],
    // Read back by the webhook to know which user/course a completed
    // session belongs to.
    metadata: { userId, courseId: course.id },
    success_url: `${env.CLIENT_ORIGIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}&courseId=${course.id}&slug=${course.slug}`,
    cancel_url: `${env.CLIENT_ORIGIN}/checkout/cancel?slug=${course.slug}`,
  });

  // Upsert rather than insert: a user re-attempting checkout after
  // abandoning a previous session reuses the same enrollment row (unique
  // {userId, courseId} index) instead of colliding on it.
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    {
      userId,
      courseId,
      type: "paid",
      status: "pending",
      currency: course.currency,
      stripeCheckoutSessionId: session.id,
    },
    { upsert: true, new: true }
  );

  res.json({ url: session.url });
}

export async function stripeWebhook(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ error: "Stripe is not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature as string,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe webhook] Signature verification failed:", message);
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Atomic + idempotent: only flips pending -> active once. A duplicate
    // delivery of the same event matches zero documents the second time
    // (status is already "active") and does nothing.
    await Enrollment.findOneAndUpdate(
      { stripeCheckoutSessionId: session.id, status: { $ne: "active" } },
      {
        status: "active",
        amountPaid: (session.amount_total ?? 0) / 100,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : undefined,
        enrolledAt: new Date(),
      }
    );
  }

  res.json({ received: true });
}
