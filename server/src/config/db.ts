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

/**
 * Attempts to connect to MongoDB. Deliberately does not throw on failure —
 * the HTTP server should still start and /api/health should still respond
 * (reporting db as "disconnected") even if MongoDB isn't reachable yet.
 */
export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (err) {
    console.error(
      "[db] Initial MongoDB connection failed — server will keep running; /api/health will report db as disconnected until this is resolved.",
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
