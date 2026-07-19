import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { ensureAuthIndexes } from "./lib/auth.js";

async function main(): Promise<void> {
  await connectDB(env.MONGODB_URI);
  // Must complete before the server accepts any traffic — see the comment
  // on ensureAuthIndexes in lib/auth.ts. A rejection here is fatal and
  // caught by main().catch below, which exits the process rather than
  // starting the server without the unique-email constraint in place.
  await ensureAuthIndexes();

  app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
