import Stripe from "stripe";
import { env } from "../config/env.js";

export const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);

if (!stripeConfigured) {
  console.warn(
    "[stripe] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set — paid checkout and the " +
      "webhook are disabled. Free enrollment still works. Set both env vars to enable them."
  );
}

export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;
