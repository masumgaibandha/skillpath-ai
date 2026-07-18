import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  await connectDB(env.MONGODB_URI);

  app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
