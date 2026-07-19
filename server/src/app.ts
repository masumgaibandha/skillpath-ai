import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth, ensureAuthIndexes } from "./lib/auth.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { stripeWebhook } from "./controllers/payment.controller.js";
import chatRouter from "./routes/chat.route.js";
import contactRouter from "./routes/contact.route.js";
import courseRouter from "./routes/course.route.js";
import enrollmentRouter from "./routes/enrollment.route.js";
import healthRouter from "./routes/health.route.js";
import meRouter from "./routes/me.route.js";
import paymentRouter from "./routes/payment.route.js";
import studyPlanRouter from "./routes/studyPlan.route.js";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

// Serverless deployments have no long-running startup phase to connect to
// MongoDB once and stay connected (that's src/index.ts's app.listen()
// path, which only runs under traditional/local hosting) — each
// invocation must ensure the connection itself. connectDB() is a cheap
// no-op once already connected, so this doesn't add meaningful latency to
// warm invocations or to local dev (already connected via index.ts at
// boot). Runs before body parsing, so it never touches the raw request
// stream the auth handler and Stripe webhook below depend on.
app.use(async (_req, _res, next) => {
  await connectDB(env.MONGODB_URI);
  next();
});

// Better Auth's handler must be mounted BEFORE express.json() — it needs
// the raw request stream (it parses the body itself), not one already
// consumed by express.json(). Express 5's path-to-regexp wildcard needs a
// name: "/*splat", not the old Express 4 bare "*".
//
// Serverless invocations have no blocking startup phase (that's
// index.ts's main(), which only runs under traditional/local hosting) —
// each cold start must independently guarantee the unique-email index
// exists before serving any auth traffic. ensureAuthIndexes() is
// memoized, so on a warm container this resolves immediately; scoped to
// just this route so an index-init failure doesn't take down unrelated
// routes like /api/health that don't depend on it.
app.all(
  "/api/auth/*splat",
  async (_req, res, next) => {
    try {
      await ensureAuthIndexes();
      next();
    } catch {
      res.status(503).json({ error: "Service temporarily unavailable" });
    }
  },
  toNodeHandler(auth)
);

// Same reasoning as Better Auth above: Stripe's webhook signature check
// needs the exact raw request bytes, not a body express.json() already
// parsed. Scoped to this one path only and registered before the global
// express.json() below — every other route keeps normal JSON parsing.
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", meRouter);
app.use("/api/courses", courseRouter);
app.use("/api/contact", contactRouter);
app.use("/api/enrollments", enrollmentRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/study-plan", studyPlanRouter);
app.use("/api/chat", chatRouter);

// Express 5 forwards rejected promises from async route handlers here
// automatically — no try/catch needed in the controllers above.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[app] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
