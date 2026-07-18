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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see errors above.");
}

export const env = parsed.data;
