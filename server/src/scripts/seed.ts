import mongoose from "mongoose";
import { env } from "../config/env";
import { seedCourses } from "../data/courses.seed-data";
import Course from "../models/Course";

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log("[seed] Connected to MongoDB");

  const deleted = await Course.deleteMany({});
  console.log(`[seed] Cleared ${deleted.deletedCount} existing course(s)`);

  const inserted = await Course.insertMany(seedCourses);
  console.log(`[seed] Inserted ${inserted.length} course(s)`);

  await mongoose.disconnect();
  console.log("[seed] Done.");
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
