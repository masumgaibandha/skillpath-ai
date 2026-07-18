import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import contactRouter from "./routes/contact.route";
import courseRouter from "./routes/course.route";
import healthRouter from "./routes/health.route";
import meRouter from "./routes/me.route";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

// Better Auth's handler must be mounted BEFORE express.json() — it needs
// the raw request stream (it parses the body itself), not one already
// consumed by express.json(). Express 5's path-to-regexp wildcard needs a
// name: "/*splat", not the old Express 4 bare "*".
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", meRouter);
app.use("/api/courses", courseRouter);
app.use("/api/contact", contactRouter);

// Express 5 forwards rejected promises from async route handlers here
// automatically — no try/catch needed in the controllers above.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[app] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
