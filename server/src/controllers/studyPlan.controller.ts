import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { zodResponseFormat } from "openai/helpers/zod";
import Course from "../models/Course.js";
import StudyPlan, { type StudyPlanAttrs } from "../models/StudyPlan.js";
import { AI_DEMO_MODE, openai, openaiConfigured, OPENAI_MODEL } from "../lib/openai.js";
import { generateDemoStudyPlan } from "../lib/studyPlanDemo.js";
import {
  aiStudyPlanOutputSchema,
  createStudyPlanSchema,
  refineStudyPlanSchema,
  type AiStudyPlanOutput,
  type CourseContext,
  type CourseSummary,
  type CreateStudyPlanInput,
} from "../utils/studyPlan.js";

/** Every published course, trimmed to what the model/demo-generator needs
 * to choose sensibly — this is also the authoritative set course IDs get
 * checked against after generation, so nothing outside it can ever be
 * saved. */
async function loadCourseContext(): Promise<CourseContext[]> {
  return Course.find({ status: "published" })
    .select("title category level price isFree durationHours shortDescription tags")
    .lean();
}

/** Response-ready course summaries (with slug/images, needed for cards and
 * links) for whatever course IDs a plan actually references — a fresh, sm
 * all query scoped to just those IDs rather than reusing the generation-
 * time context, so GET/list responses stay correct even if a course's
 * details changed since the plan was generated. */
async function resolveCourseSummaries(ids: Types.ObjectId[]): Promise<Map<string, CourseSummary>> {
  if (ids.length === 0) return new Map();
  const courses = await Course.find({ _id: { $in: ids } })
    .select("title slug images category level price isFree durationHours")
    .lean();
  const map = new Map<string, CourseSummary>();
  for (const c of courses) {
    map.set(c._id.toString(), {
      _id: c._id.toString(),
      title: c.title,
      slug: c.slug,
      images: c.images,
      category: c.category,
      level: c.level,
      price: c.price,
      isFree: c.isFree,
      durationHours: c.durationHours,
    });
  }
  return map;
}

// Mongoose infers array-of-ObjectId/subdocument-with-ref paths as a
// DocumentArray of wrapper objects rather than plain literals, but every
// element still has a working toString() (the hex id) whether it's a real
// ObjectId, a FlattenMaps-lean version, or a subdocument wrapper. These
// helpers accept the loosest shape that guarantees that instead of
// fighting Mongoose's inferred type.
interface IdLike {
  toString(): string;
}
interface RecommendedCourseLike {
  courseRef: IdLike;
  reason: string;
  matchScore: number;
}
interface MilestoneLike {
  title: string;
  description: string;
  courseRefs: IdLike[];
  order: number;
  estimatedWeeks: number;
  estimatedHours: number;
}
interface PlanRefsLike {
  recommendedCourses: RecommendedCourseLike[];
  milestones: { courseRefs: IdLike[] }[];
}
interface PlanLike extends PlanRefsLike {
  _id: IdLike;
  userId: string;
  title: string;
  inputs?: StudyPlanAttrs["inputs"];
  summary: string;
  recommendedCourses: RecommendedCourseLike[];
  milestones: MilestoneLike[];
  risks: string[];
  nextActions: string[];
  version: number;
  feedbackHistory: { feedback: string; requestedAt?: Date }[];
  generatedAt?: Date;
  status: string;
}

function serializePlan(plan: PlanLike, courseMap: Map<string, CourseSummary>) {
  return {
    _id: plan._id.toString(),
    userId: plan.userId,
    title: plan.title,
    inputs: plan.inputs,
    summary: plan.summary,
    recommendedCourses: plan.recommendedCourses
      .map((rc) => {
        const course = courseMap.get(rc.courseRef.toString());
        return course ? { ...course, reason: rc.reason, matchScore: rc.matchScore } : null;
      })
      .filter((c): c is CourseSummary & { reason: string; matchScore: number } => Boolean(c)),
    milestones: plan.milestones.map((m) => ({
      title: m.title,
      description: m.description,
      order: m.order,
      estimatedWeeks: m.estimatedWeeks,
      estimatedHours: m.estimatedHours,
      courses: m.courseRefs
        .map((id) => courseMap.get(id.toString()))
        .filter((c): c is CourseSummary => Boolean(c)),
    })),
    risks: plan.risks,
    nextActions: plan.nextActions,
    version: plan.version,
    feedbackHistory: plan.feedbackHistory,
    generatedAt: plan.generatedAt,
    status: plan.status,
  };
}

function allReferencedIds(plan: PlanRefsLike): Types.ObjectId[] {
  const ids: Types.ObjectId[] = [];
  for (const rc of plan.recommendedCourses) ids.push(new Types.ObjectId(rc.courseRef.toString()));
  for (const m of plan.milestones) {
    for (const id of m.courseRefs) ids.push(new Types.ObjectId(id.toString()));
  }
  return ids;
}

const SYSTEM_PROMPT = `You are the AI Study Planner for SkillPath AI, an online course platform. You build realistic, encouraging study roadmaps using ONLY the courses provided to you in the user message's course catalog — you must never invent a course, a course id, or reference any course not in that list. Every course id you use in "recommendedCourses" or a milestone's "courseIds" MUST be copied exactly from the "_id" field of a course in the provided catalog. Strongly prioritize courses whose title, category, tags, or description actually relate to the learner's stated goal and preferred topics — do not recommend an unrelated course just to fill out the list; it is fine to recommend fewer courses when the catalog has limited relevant coverage, and you should say so in "risks" when that happens. For each recommended course, write a short "reason" explaining why it fits this learner and a "matchScore" from 0-100 that meaningfully reflects topic/goal relevance plus skill level, budget, and timeframe fit — scores across the recommended list should differ based on how well each course actually matches, not be uniform. For each milestone, include a realistic "estimatedHours" consistent with "estimatedWeeks" and the learner's weekly hours. Keep "title" concise — no more than about 80 characters — and put the learner's full goal in "summary" instead. Order milestones logically from foundational to advanced.`;

function buildCourseCatalogText(courses: CourseContext[]): string {
  return JSON.stringify(
    courses.map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      category: c.category,
      tags: c.tags,
      level: c.level,
      price: c.isFree ? 0 : c.price,
      isFree: c.isFree,
      durationHours: c.durationHours,
      description: c.shortDescription,
    }))
  );
}

interface GeneratePlanParams {
  input: CreateStudyPlanInput;
  courses: CourseContext[];
  /** Prompt for the real OpenAI path — unused in demo mode. */
  userPrompt: string;
  /** Demo-mode-only: folds refine feedback text into course scoring. */
  extraKeywords?: string[];
  /** Demo-mode-only: appended to the generated summary on refine. */
  refinementNote?: string;
}

/** The single fork point between the two generation sources. AI_DEMO_MODE
 * is read once and decides the whole branch — there is deliberately no
 * catch/fallback between them, so a failed real OpenAI call never
 * silently degrades into a demo-generated plan. */
async function generatePlan(params: GeneratePlanParams): Promise<AiStudyPlanOutput | null> {
  if (AI_DEMO_MODE) {
    const demoOutput = generateDemoStudyPlan({
      input: params.input,
      courses: params.courses,
      extraKeywords: params.extraKeywords,
      refinementNote: params.refinementNote,
    });
    // Same validation gate the real path's zodResponseFormat enforces —
    // applied uniformly so a future change to the generator can't slip
    // out-of-schema data past this function.
    const parsed = aiStudyPlanOutputSchema.safeParse(demoOutput);
    return parsed.success ? parsed.data : null;
  }

  if (!openai) return null;
  const completion = await openai.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: params.userPrompt },
    ],
    // zodResponseFormat both configures OpenAI's structured-output mode
    // AND parses+validates the response against the same zod schema —
    // `.parsed` below is the zod-validated result, not raw model output.
    response_format: zodResponseFormat(aiStudyPlanOutputSchema, "study_plan"),
  });
  return completion.choices[0]?.message.parsed ?? null;
}

/** Keeps only course ids actually present in the real catalog — the real
 * enforcement of "never invent course ids", independent of whatever the
 * generator claims. Returns null if nothing survives (caller treats that
 * as a generation failure, not a plan with zero real recommendations). */
function sanitizePlanCourseIds(plan: AiStudyPlanOutput, validIds: Set<string>): AiStudyPlanOutput | null {
  const recommendedCourses = plan.recommendedCourses.filter((rc) => validIds.has(rc.courseId));
  if (recommendedCourses.length === 0) return null;

  const milestones = plan.milestones.map((m) => ({
    ...m,
    courseIds: m.courseIds.filter((id) => validIds.has(id)),
  }));

  return { ...plan, recommendedCourses, milestones };
}

function buildLearnerProfileText(input: CreateStudyPlanInput): string {
  return `- Goal: ${input.goal}
- Current skill level: ${input.skillLevel}
- Available time: ${input.weeklyHours} hours/week
- Budget: $${input.budget}
- Timeframe: ${input.timeframeWeeks} weeks
- Preferred topics: ${input.preferredTopics.length > 0 ? input.preferredTopics.join(", ") : "none specified"}`;
}

export async function createStudyPlan(req: Request, res: Response) {
  const parsed = createStudyPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid study plan request",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  if (!AI_DEMO_MODE && !openaiConfigured) {
    res.status(503).json({ error: "AI Study Planner is not configured: set OPENAI_API_KEY" });
    return;
  }

  const input = parsed.data;
  const courses = await loadCourseContext();
  if (courses.length === 0) {
    res.status(503).json({ error: "No published courses are available to build a plan from" });
    return;
  }
  const validIds = new Set(courses.map((c) => c._id.toString()));

  const userPrompt = `Learner profile:
${buildLearnerProfileText(input)}

Course catalog (choose only from these, by exact _id):
${buildCourseCatalogText(courses)}`;

  const aiOutput = await generatePlan({ input, courses, userPrompt });
  if (!aiOutput) {
    res.status(502).json({ error: "The AI didn't return a usable plan. Please try again." });
    return;
  }

  const sanitized = sanitizePlanCourseIds(aiOutput, validIds);
  if (!sanitized) {
    res.status(502).json({ error: "The AI's plan didn't reference any real courses. Please try again." });
    return;
  }

  const userId = req.session!.user.id;
  const plan = await StudyPlan.create({
    userId,
    title: sanitized.title,
    inputs: input,
    summary: sanitized.summary,
    recommendedCourses: sanitized.recommendedCourses.map((rc) => ({
      courseRef: new Types.ObjectId(rc.courseId),
      reason: rc.reason,
      matchScore: rc.matchScore,
    })),
    milestones: sanitized.milestones.map((m) => ({
      title: m.title,
      description: m.description,
      courseRefs: m.courseIds.map((id) => new Types.ObjectId(id)),
      order: m.order,
      estimatedWeeks: m.estimatedWeeks,
      estimatedHours: m.estimatedHours,
    })),
    risks: sanitized.risks,
    nextActions: sanitized.nextActions,
    version: 1,
    feedbackHistory: [],
  });

  // The generation-context query didn't select slug/images (not needed for
  // the prompt) — resolve a proper response-ready course map here instead.
  const responseCourseMap = await resolveCourseSummaries(allReferencedIds(plan));
  res.status(201).json({ studyPlan: serializePlan(plan.toObject(), responseCourseMap) });
}

export async function listMyStudyPlans(req: Request, res: Response) {
  const userId = req.session!.user.id;
  const plans = await StudyPlan.find({ userId }).sort({ generatedAt: -1 }).lean();

  const courseMap = await resolveCourseSummaries(plans.flatMap((p) => allReferencedIds(p)));
  res.json({ items: plans.map((p) => serializePlan(p, courseMap)) });
}

export async function getStudyPlan(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid study plan id" });
    return;
  }

  const plan = await StudyPlan.findById(id).lean();
  if (!plan) {
    res.status(404).json({ error: "Study plan not found" });
    return;
  }
  if (plan.userId !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to view this study plan" });
    return;
  }

  const courseMap = await resolveCourseSummaries(allReferencedIds(plan));
  res.json({ studyPlan: serializePlan(plan, courseMap) });
}

/** Non-secret, derived config the client needs to render correctly (e.g.
 * whether to show the demo-mode banner and suppress the "missing API key"
 * message) — never the raw env values themselves. */
export async function getStudyPlanConfig(_req: Request, res: Response) {
  res.json({ demoMode: AI_DEMO_MODE });
}

export async function refineStudyPlan(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid study plan id" });
    return;
  }

  const parsedBody = refineStudyPlanSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid refinement request",
      details: parsedBody.error.flatten().fieldErrors,
    });
    return;
  }

  const plan = await StudyPlan.findById(id);
  if (!plan) {
    res.status(404).json({ error: "Study plan not found" });
    return;
  }
  if (plan.userId !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to modify this study plan" });
    return;
  }

  if (!AI_DEMO_MODE && !openaiConfigured) {
    res.status(503).json({ error: "AI Study Planner is not configured: set OPENAI_API_KEY" });
    return;
  }

  const { feedback } = parsedBody.data;
  const courses = await loadCourseContext();
  if (courses.length === 0) {
    res.status(503).json({ error: "No published courses are available to build a plan from" });
    return;
  }
  const validIds = new Set(courses.map((c) => c._id.toString()));

  // Schema-level `required: true` on every child field guarantees `inputs`
  // and its contents exist on any successfully-saved StudyPlan document —
  // Mongoose's InferSchemaType just doesn't propagate that up to the
  // nested-object path itself. Rebuilt into an exact CreateStudyPlanInput
  // rather than used as-is so both generation paths get a precise type.
  const rawInputs = plan.inputs!;
  const input: CreateStudyPlanInput = {
    goal: rawInputs.goal,
    skillLevel: rawInputs.skillLevel as CreateStudyPlanInput["skillLevel"],
    weeklyHours: rawInputs.weeklyHours,
    budget: rawInputs.budget,
    timeframeWeeks: rawInputs.timeframeWeeks,
    preferredTopics: rawInputs.preferredTopics ?? [],
  };

  const priorFeedback = plan.feedbackHistory.map((f) => `- ${f.feedback}`).join("\n") || "none yet";
  const userPrompt = `Learner profile:
${buildLearnerProfileText(input)}

This is a REFINEMENT of an existing plan (version ${plan.version}), not a fresh plan. Keep what's still working and change what the feedback asks for.

Prior plan title: ${plan.title}
Prior plan summary: ${plan.summary}
Prior milestones: ${plan.milestones.map((m) => `${m.order}. ${m.title} — ${m.description}`).join("\n")}

Previous feedback already incorporated:
${priorFeedback}

New feedback to incorporate now: ${feedback}

Course catalog (choose only from these, by exact _id):
${buildCourseCatalogText(courses)}`;

  const aiOutput = await generatePlan({
    input,
    courses,
    userPrompt,
    extraKeywords: [feedback],
    refinementNote: `Refined based on feedback: "${feedback.length > 150 ? `${feedback.slice(0, 149)}…` : feedback}".`,
  });
  if (!aiOutput) {
    res.status(502).json({ error: "The AI didn't return a usable plan. Please try again." });
    return;
  }

  const sanitized = sanitizePlanCourseIds(aiOutput, validIds);
  if (!sanitized) {
    res.status(502).json({ error: "The AI's plan didn't reference any real courses. Please try again." });
    return;
  }

  // .set() rather than direct property assignment — Mongoose's inferred
  // DocumentArray type for ref-typed subdocument arrays doesn't
  // structurally accept a plain array literal, but .set() is the standard
  // idiomatic way to replace a path's value without fighting that typing.
  plan.set({
    title: sanitized.title,
    summary: sanitized.summary,
    recommendedCourses: sanitized.recommendedCourses.map((rc) => ({
      courseRef: new Types.ObjectId(rc.courseId),
      reason: rc.reason,
      matchScore: rc.matchScore,
    })),
    milestones: sanitized.milestones.map((m) => ({
      title: m.title,
      description: m.description,
      courseRefs: m.courseIds.map((cid) => new Types.ObjectId(cid)),
      order: m.order,
      estimatedWeeks: m.estimatedWeeks,
      estimatedHours: m.estimatedHours,
    })),
    risks: sanitized.risks,
    nextActions: sanitized.nextActions,
    version: plan.version + 1,
    generatedAt: new Date(),
  });
  plan.feedbackHistory.push({ feedback, requestedAt: new Date() });
  await plan.save();

  const responseCourseMap = await resolveCourseSummaries(allReferencedIds(plan));
  res.json({ studyPlan: serializePlan(plan.toObject(), responseCourseMap) });
}
