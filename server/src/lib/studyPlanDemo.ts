import type { AiStudyPlanOutput, CourseContext, CreateStudyPlanInput } from "../utils/studyPlan.js";

// Deterministic, cost-free stand-in for the real OpenAI call (see
// AI_DEMO_MODE in config/env.ts). Every score/selection below is a pure
// function of (input, courses) — no randomness, no timestamps — so the
// same inputs always produce the same plan. It never contacts OpenAI and
// is only ever invoked when AI_DEMO_MODE is on; studyPlan.controller.ts
// picks this OR the real integration up front and never falls back
// between them.
//
// Design: budget is hard-filtered (never recommend something the learner
// said they can't afford) UNLESS literally nothing in the catalog fits,
// in which case we fall back to the full catalog and say so in `risks` —
// a roadmap needs at least one course, and we only ever pick real ones.
// Skill level and text relevance (goal/topics vs. title/category/tags/
// description) are scored, with text relevance dominating the score and a
// real penalty applied to courses with zero relevance — see scoreCourse.
// Only courses that clear a relevance bar are recommended; we never pad
// the list with unrelated courses just to hit a target count. Timeframe
// isn't a selection filter — it's checked after the fact against the
// roadmap's total estimated weeks and surfaced as a risk if it doesn't fit.

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "will",
  "your", "you", "are", "was", "were", "into", "about", "learn", "learning",
  "course", "using", "use", "want", "become", "skills", "skill", "ready",
  "engineer", "specializing", "specialize", "architecture", "architectures",
]);

// Common spelling/casing variants mapped to the tokens that actually show
// up in the seeded course catalog's title/category/tags/description text.
// Values are unioned with the original token (not a replacement), so both
// forms stay searchable — e.g. "frontend" keeps matching a literal
// "frontend" tag AND now also matches courses described as "web
// development".
const TERM_NORMALIZATION: Record<string, string[]> = {
  reactjs: ["react"],
  "react.js": ["react"],
  nextjs: ["next", "js"],
  "next.js": ["next", "js"],
  vuejs: ["vue"],
  angularjs: ["angular"],
  nodejs: ["node"],
  expressjs: ["express"],
  frontend: ["web", "development"],
  "front-end": ["web", "development"],
  backend: ["web", "development", "server"],
  "back-end": ["web", "development", "server"],
  fullstack: ["web", "development"],
  "full-stack": ["web", "development"],
  js: ["javascript"],
  ts: ["typescript"],
  ml: ["machine", "learning"],
  ai: ["artificial", "intelligence"],
};

function extractKeywords(...texts: string[]): string[] {
  const rawTokens = texts
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9+.]+/)
    .map((w) => w.replace(/^\.+|\.+$/g, ""))
    .filter((w) => w.length >= 2);

  const expanded = new Set<string>();
  for (const raw of rawTokens) {
    const key = raw.replace(/\./g, "");
    const normalized = TERM_NORMALIZATION[raw] ?? TERM_NORMALIZATION[key];
    if (normalized) {
      for (const term of normalized) expanded.add(term);
    }
    if (key.length >= 4 && !STOPWORDS.has(key)) {
      expanded.add(key);
    }
  }
  return Array.from(expanded);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0]!.toUpperCase() + text.slice(1);
}

/** Below this, a course is treated as "not actually relevant" — see
 * pickRelevantCourses. Chosen so a strong text match (even a single-field
 * hit) plus level fit clears it, but level/budget/time fit alone (with a
 * genuine topic/goal mismatch penalty applied) cannot. */
const RELEVANCE_THRESHOLD = 25;
const UNRELATED_PENALTY = 25;

interface ScoredCourse {
  course: CourseContext;
  score: number;
  reason: string;
}

function scoreCourse(course: CourseContext, input: CreateStudyPlanInput, keywords: string[], totalAvailableHours: number): ScoredCourse {
  const titleText = course.title.toLowerCase();
  const categoryText = course.category.toLowerCase();
  const tagsText = course.tags.join(" ").toLowerCase();
  const descText = course.shortDescription.toLowerCase();

  // Text relevance — up to 70, the dominant factor. Title/tag hits count
  // for more than a category or description hit.
  let textScore = 0;
  const matchedTerms = new Set<string>();
  for (const kw of keywords) {
    let hit = false;
    if (titleText.includes(kw)) { textScore += 18; hit = true; }
    if (tagsText.includes(kw)) { textScore += 14; hit = true; }
    if (categoryText.includes(kw)) { textScore += 10; hit = true; }
    if (descText.includes(kw)) { textScore += 6; hit = true; }
    if (hit) matchedTerms.add(kw);
  }
  textScore = Math.min(70, textScore);

  // Skill-level fit — up to 15. A roadmap can span adjacent levels, so
  // this biases toward (rather than requires) the learner's level.
  const levelGap = Math.abs((LEVEL_ORDER[course.level] ?? 1) - (LEVEL_ORDER[input.skillLevel] ?? 1));
  const levelScore = levelGap === 0 ? 15 : levelGap === 1 ? 8 : 3;

  // Free-course tiebreak — up to 10.
  const freeScore = course.isFree ? 10 : 0;

  // Time fit — up to 5. Penalizes a single course eating the learner's
  // entire available time budget.
  const timeScore = course.durationHours <= totalAvailableHours
    ? 5
    : Math.max(0, 5 - Math.round(((course.durationHours - totalAvailableHours) / Math.max(1, totalAvailableHours)) * 5));

  // A real penalty, not just "0 points" — a course with zero textual
  // overlap with an actual stated goal/topic is actively deprioritized
  // rather than left to tie with genuinely relevant courses on
  // level/budget/time alone.
  const hasQuery = keywords.length > 0;
  const penalty = hasQuery && matchedTerms.size === 0 ? UNRELATED_PENALTY : 0;

  const score = Math.round(Math.max(0, Math.min(100, textScore + levelScore + freeScore + timeScore - penalty)));

  const reasonParts: string[] = [];
  if (matchedTerms.size > 0) {
    reasonParts.push(`directly matches ${Array.from(matchedTerms).slice(0, 3).join(", ")}`);
  } else if (hasQuery) {
    reasonParts.push("limited overlap with your stated goal/topics");
  }
  reasonParts.push(
    levelGap === 0 ? `fits your ${input.skillLevel} level` : `a ${course.level} step from ${input.skillLevel}`
  );
  if (course.isFree) reasonParts.push("free");

  return { course, score, reason: capitalize(reasonParts.join("; ")) };
}

function buildConciseTitle(goal: string, timeframeWeeks: number): string {
  const suffix = ` — ${timeframeWeeks}-Week Plan`;
  const maxGoalLen = Math.max(10, 80 - suffix.length);
  const shortGoal = goal.length > maxGoalLen ? `${goal.slice(0, maxGoalLen - 1).trimEnd()}…` : goal;
  return truncate(`${capitalize(shortGoal)}${suffix}`, 80);
}

export interface DemoGenerationParams {
  input: CreateStudyPlanInput;
  courses: CourseContext[];
  /** Extra keywords to weight into topic matching — used on refine to fold
   * the learner's feedback text into course selection. */
  extraKeywords?: string[];
  /** Appended to the summary when this is a refinement, e.g. what changed. */
  refinementNote?: string;
}

export function generateDemoStudyPlan({
  input,
  courses,
  extraKeywords = [],
  refinementNote,
}: DemoGenerationParams): AiStudyPlanOutput {
  const totalAvailableHours = input.weeklyHours * input.timeframeWeeks;
  const keywords = extractKeywords(input.goal, input.preferredTopics.join(" "), extraKeywords.join(" "));

  const withinBudget = courses.filter((c) => c.isFree || c.price <= input.budget);
  const budgetRelaxed = withinBudget.length === 0;
  const pool = budgetRelaxed ? courses : withinBudget;

  const scored = pool
    .map((c) => scoreCourse(c, input, keywords, totalAvailableHours))
    .sort((a, b) => b.score - a.score || a.course._id.toString().localeCompare(b.course._id.toString()));

  // Only genuinely relevant courses are recommended — never padded with
  // unrelated ones to reach a target count. If nothing clears the bar we
  // still return the single best (real) course, since the schema requires
  // at least one, but flag the weak coverage in risks below.
  const relevant = scored.filter((s) => s.score >= RELEVANCE_THRESHOLD);
  const picked = (relevant.length > 0 ? relevant : scored.slice(0, 1)).slice(0, 8);

  const recommendedCourses = picked.map((p) => {
    const reasonParts = [p.reason];
    if (budgetRelaxed && !p.course.isFree && p.course.price > input.budget) {
      reasonParts.push(`exceeds your $${input.budget} budget — closest match available`);
    } else if (!p.course.isFree) {
      reasonParts.push(`$${p.course.price} within budget`);
    }
    return {
      courseId: p.course._id.toString(),
      reason: truncate(capitalize(reasonParts.join("; ")), 300),
      matchScore: p.score,
    };
  });

  // Roadmap order: foundational to advanced, best matches first within a level.
  const roadmapOrder = [...picked].sort(
    (a, b) => (LEVEL_ORDER[a.course.level] ?? 1) - (LEVEL_ORDER[b.course.level] ?? 1) || b.score - a.score
  );

  const milestones = roadmapOrder.map((p, i) => {
    const estimatedHours = Math.min(500, Math.max(1, Math.round(p.course.durationHours)));
    const estimatedWeeks = Math.min(52, Math.max(1, Math.round(estimatedHours / Math.max(1, input.weeklyHours))));
    return {
      title: truncate(`Milestone ${i + 1}: ${p.course.title}`, 200),
      description: truncate(
        `Work through "${p.course.title}" (${p.course.category}) toward your goal: ${input.goal}. ` +
          `About ${estimatedHours}h at ${input.weeklyHours} hrs/week.`,
        1000
      ),
      courseIds: [p.course._id.toString()],
      order: i + 1,
      estimatedWeeks,
      estimatedHours,
    };
  });

  const scheduledWeeks = milestones.reduce((sum, m) => sum + m.estimatedWeeks, 0);
  const risks: string[] = [];
  if (scheduledWeeks > input.timeframeWeeks) {
    risks.push(
      truncate(
        `This roadmap needs about ${scheduledWeeks} weeks at ${input.weeklyHours} hrs/week — longer than your ` +
          `${input.timeframeWeeks}-week target. Consider extending the timeframe or increasing weekly hours.`,
        300
      )
    );
  }
  if (budgetRelaxed) {
    risks.push(
      truncate(
        `No published course fit your $${input.budget} budget, so the closest available options are shown instead.`,
        300
      )
    );
  }
  if (picked.length <= 2) {
    const topicText = input.preferredTopics.length > 0 ? input.preferredTopics.join(", ") : input.goal;
    risks.push(
      truncate(
        `The catalog currently has limited coverage for "${topicText}" — only ${picked.length} closely-matching ` +
          `course${picked.length === 1 ? " was" : "s were"} found, so this plan is thinner than usual.`,
        300
      )
    );
  }
  if (risks.length === 0) {
    risks.push("No major risks identified — pace yourself and revisit this plan if your availability changes.");
  }

  const nextActions = [
    truncate(`Enroll in "${roadmapOrder[0]!.course.title}" and complete milestone 1 first.`, 300),
    truncate(`Block ${input.weeklyHours} hours/week on your calendar for the next ${input.timeframeWeeks} weeks.`, 300),
    "Come back and refine this plan with feedback once you've finished the first milestone.",
  ];

  const summaryBase = truncate(
    `A ${input.timeframeWeeks}-week, ${input.weeklyHours} hrs/week plan toward "${input.goal}", built from ` +
      `${picked.length} real course${picked.length === 1 ? "" : "s"} in the catalog` +
      `${input.preferredTopics.length > 0 ? ` focused on ${input.preferredTopics.join(", ")}` : ""}.`,
    850
  );
  const summary = truncate(refinementNote ? `${summaryBase} ${refinementNote}` : summaryBase, 1000);

  return {
    title: buildConciseTitle(input.goal, input.timeframeWeeks),
    summary,
    recommendedCourses,
    milestones,
    risks: risks.slice(0, 8),
    nextActions: nextActions.slice(0, 8),
  };
}
