import OpenAI from "openai";
import { env } from "../config/env.js";

export const AI_DEMO_MODE = env.AI_DEMO_MODE;

export const openaiConfigured = Boolean(env.OPENAI_API_KEY);

if (AI_DEMO_MODE) {
  console.warn(
    "[openai] AI_DEMO_MODE is on — the AI Study Planner generates plans " +
      "deterministically from real course data and never calls OpenAI. " +
      "Set AI_DEMO_MODE=false to use the real OPENAI_API_KEY integration."
  );
} else if (!openaiConfigured) {
  console.warn(
    "[openai] OPENAI_API_KEY not set — the AI Study Planner is disabled. " +
      "Every other feature still works. Set OPENAI_API_KEY (and optionally " +
      "OPENAI_MODEL) to enable it, or set AI_DEMO_MODE=true for a free " +
      "local demo mode."
  );
}

export const openai = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;

// gpt-4o-mini is a solid default for structured-output, cost-conscious
// generation — overridable per-deployment via OPENAI_MODEL without a code
// change.
export const OPENAI_MODEL = env.OPENAI_MODEL ?? "gpt-4o-mini";
