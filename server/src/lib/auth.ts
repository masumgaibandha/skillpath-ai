import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { env } from "../config/env.js";

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
