import { z } from "zod";
import { COURSE_LEVELS } from "../models/Course.js";

export const createStudyPlanSchema = z.object({
  goal: z.string().trim().min(1, "Goal is required").max(500),
  skillLevel: z.enum(COURSE_LEVELS),
  weeklyHours: z.coerce.number().min(1, "Must be at least 1 hour").max(80),
  budget: z.coerce.number().min(0, "Budget must be 0 or more"),
  timeframeWeeks: z.coerce.number().int().min(1, "Must be at least 1 week").max(104),
  preferredTopics: z.array(z.string().trim().min(1)).max(10).default([]),
});
export type CreateStudyPlanInput = z.infer<typeof createStudyPlanSchema>;

export const refineStudyPlanSchema = z.object({
  feedback: z.string().trim().min(1, "Feedback is required").max(1000),
});
export type RefineStudyPlanInput = z.infer<typeof refineStudyPlanSchema>;

// The shape we require back from OpenAI (via zodResponseFormat) — or from
// the deterministic demo generator (src/lib/studyPlanDemo.ts) when
// AI_DEMO_MODE is on — and independently re-validate with .safeParse()
// before ever saving it, uniformly for both sources. The API-level
// "strict" JSON schema guarantees syntactic shape for the real path, this
// is the actual application-level validation gate for both. No
// .default()/.optional() here: OpenAI's strict structured-output mode
// requires every property to always be present, so "no risks" must be
// expressed as an empty array, not an absent field.
export const aiStudyPlanOutputSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  // Course ids chosen from the real course list given as context, each
  // with a short human-readable reason and a 0-100 fit score. Cross-checked
  // against that same real set after parsing — see studyPlan.controller.ts.
  // Never trusted as-is.
  recommendedCourses: z
    .array(
      z.object({
        courseId: z.string(),
        reason: z.string().min(1).max(300),
        matchScore: z.number().min(0).max(100),
      })
    )
    .min(1)
    .max(8),
  milestones: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(1000),
        courseIds: z.array(z.string()).max(5),
        order: z.number().int().min(1),
        estimatedWeeks: z.number().min(0).max(52),
        estimatedHours: z.number().min(0).max(500),
      })
    )
    .min(1)
    .max(12),
  risks: z.array(z.string().max(300)).max(8),
  nextActions: z.array(z.string().max(300)).max(8),
});
export type AiStudyPlanOutput = z.infer<typeof aiStudyPlanOutputSchema>;

// Shared with src/lib/studyPlanDemo.ts (deterministic AI_DEMO_MODE
// generator) and the controller's real-OpenAI prompt-context builder, so
// both sources describe courses identically.
export interface CourseContext {
  _id: { toString(): string };
  title: string;
  category: string;
  level: string;
  price: number;
  isFree: boolean;
  durationHours: number;
  shortDescription: string;
  tags: string[];
}

// Lightweight course shape embedded in study-plan API responses (recommended
// courses / milestone courses) — enough for the client to render a card and
// link to the real course, without shipping the full Course document.
export interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  category: string;
  level: string;
  price: number;
  isFree: boolean;
  durationHours: number;
}
