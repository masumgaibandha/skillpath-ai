import mongoose from "mongoose";

mongoose.connection.on("connected", () => {
  console.log("[db] MongoDB connected");
});

mongoose.connection.on("error", (err: Error) => {
  console.error("[db] MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected");
});

// Serverless functions can run many concurrent invocations of the same
// warm container, and a fresh one on every cold start. A module-level
// promise (rather than firing mongoose.connect() on every call) is reused
// across invocations within a warm container and de-dupes concurrent
// connect attempts during a cold start into a single in-flight connect.
let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Attempts to connect to MongoDB. Deliberately does not throw on failure —
 * the HTTP server should still start and /api/health should still respond
 * (reporting db as "disconnected") even if MongoDB isn't reachable yet.
 * Safe to call on every request: it's a no-op once connected, and only
 * ever has one connect() in flight at a time.
 */
export async function connectDB(uri: string): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
      // Let the next call retry instead of caching a permanently-rejected
      // promise.
      connectionPromise = null;
      throw err;
    });
  }
  try {
    await connectionPromise;
  } catch (err) {
    console.error(
      "[db] MongoDB connection failed — the server keeps running; /api/health will report db as disconnected until this is resolved.",
      err instanceof Error ? err.message : err
    );
  }
}

export type DbStatus = "connected" | "connecting" | "disconnected";

export function getDbStatus(): DbStatus {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    default:
      return "disconnected";
  }
}
