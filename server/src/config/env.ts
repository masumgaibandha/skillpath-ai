import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  // The browser-facing origin. Requests actually hit this origin and Next's
  // rewrite proxies them to Express — so this doubles as both the CORS
  // allow-origin AND Better Auth's baseURL/cookie origin.
  CLIENT_ORIGIN: z.string().url().default("http://localhost:3000"),
  // Required — used to sign/encrypt sessions and cookies. Generate with:
  // openssl rand -base64 32
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  // Google OAuth is a required feature for this project, but both are left
  // optional here so the server can still start (and email/password auth
  // still work) before real credentials are supplied — see auth.ts, which
  // only registers the Google provider when both are present. An empty
  // string (unset in .env, e.g. "GOOGLE_CLIENT_ID=") must be treated the
  // same as absent, not as an invalid non-empty-string value.
  GOOGLE_CLIENT_ID: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional()
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional()
  ),
  // Seeded demo account, used by the client's "Demo Login" button.
  DEMO_USER_EMAIL: z.string().email().default("demo@skillpathai.com"),
  DEMO_USER_PASSWORD: z.string().min(8).default("DemoPass123!"),
  // Stripe test-mode keys. Optional, same pattern as Google OAuth above —
  // the server still starts and free enrollment still works with these
  // unset; only paid checkout/webhook handling is disabled (see
  // src/lib/stripe.ts). An empty string must be treated the same as unset.
  STRIPE_SECRET_KEY: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional()
  ),
  STRIPE_WEBHOOK_SECRET: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().min(1).optional()
  ),
}).superRefine((data, ctx) => {
  // CLIENT_ORIGIN's localhost default exists purely for local dev
  // convenience. In production it must be explicitly set to the real
  // deployed frontend's origin — no domain is hardcoded here, this just
  // rejects the dev fallback and insecure schemes once NODE_ENV=production
  // (which Vercel sets automatically for production deployments).
  if (data.NODE_ENV !== "production") return;

  let hostname: string | null = null;
  try {
    hostname = new URL(data.CLIENT_ORIGIN).hostname;
  } catch {
    // z.string().url() already reports unparseable URLs; nothing to add.
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CLIENT_ORIGIN"],
      message:
        "CLIENT_ORIGIN must be set to the deployed frontend's real origin in production — it cannot fall back to localhost.",
    });
  }
  if (!data.CLIENT_ORIGIN.startsWith("https://")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["CLIENT_ORIGIN"],
      message: "CLIENT_ORIGIN must use https:// in production.",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see errors above.");
}

export const env = parsed.data;
