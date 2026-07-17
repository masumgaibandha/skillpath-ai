import cors from "cors";
import express from "express";
import { env } from "./config/env";
import healthRouter from "./routes/health.route";

const app = express();

// NOTE: keep app-wide express.json() here, but when Better Auth is added in
// Phase 2, its handler must be mounted BEFORE this line — Better Auth needs
// the raw request stream, not a body already parsed by express.json().
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/api", healthRouter);

export default app;
