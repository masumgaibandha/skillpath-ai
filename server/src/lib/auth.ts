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
// time without waiting on Mongoose's async connect(). Exported so tests
// that import `auth` can explicitly close it in their own teardown —
// otherwise the open connection keeps a test runner process alive
// indefinitely after all tests finish.
export const authMongoClient = new MongoClient(env.MONGODB_URI);
const client = authMongoClient;
const db = client.db();

// Better Auth's own sign-up flow checks "does a user with this email
// already exist" and then inserts as two separate, non-atomic steps. Two
// near-simultaneous sign-up requests for the same email (a double-click,
// a client-side retry, or just an unlucky race) can both pass that check
// before either has committed, creating two real user+credential
// documents for one email. Login then depends on whichever duplicate a
// later query happens to resolve — the other real password looks
// "wrong" even though its account genuinely exists. A case-insensitive
// unique index makes MongoDB itself reject the second insert instead of
// silently allowing the duplicate.
//
// This must be awaited to completion before any sign-up/sign-in traffic
// is served — running it as fire-and-forget at module load left a window
// on every cold start where a request could race ahead of index creation
// and hit the exact TOCTOU bug it exists to prevent. Callers (index.ts's
// startup sequence for traditional hosting, and the auth-route guard in
// app.ts for serverless invocations) await this and must refuse to serve
// authentication requests if it rejects — silently continuing without the
// constraint is the bug this whole fix exists to close. Memoized so
// concurrent callers share one in-flight attempt instead of issuing
// createIndex repeatedly; resets on failure so a transient error (e.g. the
// database still warming up) doesn't permanently wedge the server into
// never retrying.
let authIndexesPromise: Promise<void> | null = null;

export async function ensureAuthIndexes(): Promise<void> {
  if (!authIndexesPromise) {
    authIndexesPromise = db
      .collection("user")
      .createIndex(
        { email: 1 },
        { unique: true, collation: { locale: "en", strength: 2 }, name: "email_unique_ci" }
      )
      .then(() => undefined)
      .catch((err: unknown) => {
        authIndexesPromise = null;
        // Deliberately generic — the underlying driver error can embed
        // connection details and must never be logged verbatim.
        console.error(
          "[auth] Failed to initialize the required unique index on user.email. " +
            "Refusing to serve authentication traffic without duplicate-account protection."
        );
        throw new Error("Auth index initialization failed", { cause: err });
      });
  }
  return authIndexesPromise;
}

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
    // Registration must not create a session — the user is sent to /login
    // to sign in explicitly after seeing a "account created" confirmation
    // (see client/src/app/signup/page.tsx). Google OAuth is unaffected by
    // this — it's a separate sign-in flow, not emailAndPassword.
    autoSignIn: false,
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
