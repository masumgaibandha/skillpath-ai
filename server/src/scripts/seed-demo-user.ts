import { auth } from "../lib/auth.js";
import { env } from "../config/env.js";

/**
 * Creates the seeded demo account through Better Auth's own sign-up API
 * (not a raw Mongo insert) so the password is hashed exactly the way
 * Better Auth expects when verifying it later. Safe to re-run — if the
 * account already exists, it's left untouched.
 */
async function seedDemoUser(): Promise<void> {
  try {
    await auth.api.signUpEmail({
      body: {
        name: "Demo User",
        email: env.DEMO_USER_EMAIL,
        password: env.DEMO_USER_PASSWORD,
      },
    });
    console.log(`[seed-demo-user] Created demo account: ${env.DEMO_USER_EMAIL}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/already exists|user_already_exists/i.test(message)) {
      console.log(
        `[seed-demo-user] Demo account already exists: ${env.DEMO_USER_EMAIL} — skipping`
      );
    } else {
      throw err;
    }
  }
  process.exit(0);
}

seedDemoUser().catch((err) => {
  console.error("[seed-demo-user] Failed:", err);
  process.exit(1);
});
