import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "../utils/password.js";

// A dedicated native MongoClient for Better Auth's own collections
// (user/session/account/verification). Deliberately independent of the
// Mongoose connection in config/db.ts — the native driver connects lazily
// on first use, so this can be constructed synchronously at module load
// time without waiting on Mongoose's async connect().
const client = new MongoClient(env.MONGODB_URI);
const db = client.db();

const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

if (!googleConfigured) {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in is disabled. " +
      "Email/password auth still works. Set both env vars to enable it."
  );
}

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  // The browser only ever talks to this origin — Next's rewrite proxies
  // /api/* to Express server-side — so this is also where session cookies
  // and the Google OAuth callback URL are scoped.
  baseURL: env.CLIENT_ORIGIN,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  // Enforced here regardless of what the client already checked — the
  // client's live checklist (client/src/lib/password.ts) is UX only, this
  // is the actual security boundary. Runs on sign-up and on password
  // reset/change, both of which set a new password via ctx.body.password.
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const password = (ctx.body as { password?: unknown } | undefined)?.password;
      if (typeof password !== "string") return;

      const isPasswordPath =
        ctx.path === "/sign-up/email" ||
        ctx.path === "/reset-password" ||
        ctx.path === "/change-password";
      if (!isPasswordPath) return;

      if (!isStrongPassword(password)) {
        throw new APIError("BAD_REQUEST", { message: PASSWORD_REQUIREMENTS_MESSAGE });
      }
    }),
  },
  ...(googleConfigured
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        },
      }
    : {}),
});
