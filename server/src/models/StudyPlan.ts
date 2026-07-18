import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { COURSE_LEVELS } from "./Course.js";

export const STUDY_PLAN_STATUSES = ["active", "archived"] as const;

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    // References into Course, cross-checked against real published courses
    // before the plan is ever saved (see studyPlan.controller.ts) — never
    // trusted directly from the AI response.
    courseRefs: { type: [Types.ObjectId], ref: "Course", default: [] },
    order: { type: Number, required: true, min: 1 },
    estimatedWeeks: { type: Number, required: true, min: 0 },
    estimatedHours: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const recommendedCourseSchema = new Schema(
  {
    // Cross-checked against real published courses before the plan is
    // ever saved (see studyPlan.controller.ts) — never trusted directly
    // from the AI/demo-generator response.
    courseRef: { type: Types.ObjectId, ref: "Course", required: true },
    reason: { type: String, required: true, trim: true },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const feedbackEntrySchema = new Schema(
  {
    feedback: { type: String, required: true, trim: true },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studyPlanSchema = new Schema(
  {
    // Better Auth user id — not a Mongoose ref, same convention as
    // Course.createdBy / Enrollment.userId.
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    inputs: {
      goal: { type: String, required: true, trim: true },
      skillLevel: { type: String, enum: COURSE_LEVELS, required: true },
      weeklyHours: { type: Number, required: true, min: 1, max: 80 },
      budget: { type: Number, required: true, min: 0 },
      timeframeWeeks: { type: Number, required: true, min: 1, max: 104 },
      preferredTopics: { type: [String], default: [] },
    },
    summary: { type: String, required: true, trim: true },
    recommendedCourses: { type: [recommendedCourseSchema], default: [] },
    milestones: { type: [milestoneSchema], default: [] },
    risks: { type: [String], default: [] },
    nextActions: { type: [String], default: [] },
    // Starts at 1, increments by 1 on every successful refine.
    version: { type: Number, default: 1, min: 1 },
    // Full history of feedback text that drove each regeneration — the
    // prior plan + this history are passed back to the AI as context on
    // refine, so it's a real refinement rather than a fresh unrelated plan.
    feedbackHistory: { type: [feedbackEntrySchema], default: [] },
    generatedAt: { type: Date, default: Date.now },
    status: { type: String, enum: STUDY_PLAN_STATUSES, default: "active" },
  },
  { timestamps: true }
);

studyPlanSchema.index({ userId: 1, generatedAt: -1 });

export type StudyPlanAttrs = InferSchemaType<typeof studyPlanSchema>;

const StudyPlan = model<StudyPlanAttrs>("StudyPlan", studyPlanSchema);

export default StudyPlan;
