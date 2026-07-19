import Course, { COURSE_LEVELS } from "../models/Course.js";
import { searchCourses, type CourseSearchResult } from "./courseSearch.js";
import type { ChatReply } from "../utils/chat.js";

type CourseLevel = (typeof COURSE_LEVELS)[number];

// Deterministic, cost-free stand-in for the real OpenAI call (see
// AI_DEMO_MODE in config/env.ts). Every reply is built from the SAME
// searchCourses tool the real integration calls (lib/courseSearch.ts), a
// direct MongoDB lookup for a specific already-referenced course, or a
// small fixed glossary for non-course educational questions — it never
// invents a course, id, price, category, or technical fact. Only ever
// invoked when AI_DEMO_MODE is on; chat.controller.ts picks this OR the
// real integration up front and never falls back between them.

export interface DemoChatHistoryEntry {
  role: "user" | "assistant";
  content: string;
  referencedCourseIds: string[];
}

export interface DemoChatParams {
  message: string;
  /** Recent history, oldest first, already capped by the caller. */
  history: DemoChatHistoryEntry[];
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "have", "will",
  "your", "you", "are", "was", "were", "into", "about", "learn", "learning",
  "course", "courses", "using", "use", "want", "tell", "show", "find",
  "recommend", "what", "which", "should", "take", "there", "any", "some",
  "please", "thanks", "good", "best", "help",
]);

function stripStopwords(text: string): string {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
    .join(" ")
    .trim();
}

function formatCourseLine(c: CourseSearchResult): string {
  const price = c.isFree ? "Free" : `$${c.price.toFixed(2)}`;
  return `"${c.title}" (${c.category}, ${c.level}, ${price})`;
}

function detectLevel(lower: string): CourseLevel | undefined {
  return COURSE_LEVELS.find((l) => lower.includes(l));
}

function detectMaxPrice(lower: string): number | undefined {
  const match = lower.match(/\$\s?(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s?dollars/);
  if (!match) return undefined;
  const value = Number(match[1] ?? match[2]);
  return Number.isFinite(value) ? value : undefined;
}

/** Every course id referenced by the most recent assistant message that
 * referenced any — not an accumulation across the whole conversation, so
 * "the course" stays unambiguous to whatever was just discussed. */
function lastReferencedCourseIds(history: DemoChatHistoryEntry[]): string[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i]!;
    if (entry.role === "assistant" && entry.referencedCourseIds.length > 0) {
      return entry.referencedCourseIds;
    }
  }
  return [];
}

function lastUserMessage(history: DemoChatHistoryEntry[]): string | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]!.role === "user") return history[i]!.content;
  }
  return undefined;
}

async function handleCompare(subjectA: string, subjectB: string): Promise<ChatReply> {
  const [resultsA, resultsB] = await Promise.all([
    searchCourses({ query: stripStopwords(subjectA) || subjectA, limit: 1 }),
    searchCourses({ query: stripStopwords(subjectB) || subjectB, limit: 1 }),
  ]);
  const courseA = resultsA[0];
  const courseB = resultsB[0];

  if (!courseA && !courseB) {
    return {
      content: `I couldn't find published courses matching either "${subjectA.trim()}" or "${subjectB.trim()}" in the catalog. Try naming a topic or course title more directly.`,
      referencedCourseIds: [],
    };
  }
  if (!courseA || !courseB) {
    const found = courseA ?? courseB!;
    return {
      content: `I could only find a real course for one side of that comparison: ${formatCourseLine(found)}. I don't want to invent details for the other course, so try rephrasing it or ask me to search for it directly.`,
      referencedCourseIds: [found._id],
    };
  }

  const content =
    `Comparing the two closest matches I found:\n\n` +
    `• ${formatCourseLine(courseA)} — ${courseA.durationHours}h, ${courseA.shortDescription}\n` +
    `• ${formatCourseLine(courseB)} — ${courseB.durationHours}h, ${courseB.shortDescription}\n\n` +
    `${courseA.level === courseB.level
      ? "Both are at the same level, so pick based on the topic and price that fit you best."
      : `"${courseA.title}" is ${courseA.level} and "${courseB.title}" is ${courseB.level} — consider your current skill level first.`
    }`;

  return { content, referencedCourseIds: [courseA._id, courseB._id] };
}

async function handleNextCourse(history: DemoChatHistoryEntry[]): Promise<ChatReply> {
  const priorId = lastReferencedCourseIds(history)[0];
  if (!priorId) {
    return {
      content: "Tell me a topic or course you're interested in first, and I can suggest what to take next after it.",
      referencedCourseIds: [],
    };
  }

  const priorCourse = await Course.findById(priorId).select("title category level").lean();
  if (!priorCourse) {
    return {
      content: "I couldn't look up the course we were just discussing — could you name it again?",
      referencedCourseIds: [],
    };
  }

  const levelIndex = COURSE_LEVELS.indexOf(priorCourse.level);
  const nextLevel = COURSE_LEVELS[levelIndex + 1];

  let results = nextLevel
    ? await searchCourses({ category: priorCourse.category, level: nextLevel, limit: 3 })
    : [];
  results = results.filter((c) => c._id !== priorId);

  if (results.length === 0) {
    results = (await searchCourses({ category: priorCourse.category, limit: 4 })).filter((c) => c._id !== priorId);
  }

  if (results.length === 0) {
    return {
      content: `After "${priorCourse.title}", I don't have another published course in ${priorCourse.category} to point you to yet — try browsing a different topic.`,
      referencedCourseIds: [],
    };
  }

  const content =
    `After "${priorCourse.title}" (${priorCourse.level}), a good next step is:\n\n` +
    results.map((c) => `• ${formatCourseLine(c)}`).join("\n");

  return { content, referencedCourseIds: results.map((c) => c._id) };
}

// --- Course follow-up context ("the course", "it", fee, duration, etc.) ---

const FEE_PATTERN = /\b(fee|price|cost|how much)\b/;
const DURATION_PATTERN = /\b(duration|how long|length)\b/;
const SUITABILITY_PATTERN =
  /\b(suitable for beginners?|good for beginners?|beginner.?friendly|is it (easy|hard|difficult)|suitable for me)\b/;
const MORE_INFO_PATTERN = /\b(tell me more|more (info|information|details)|more about (it|this|that))\b/;

/** Handles short follow-ups that only make sense in light of whatever
 * course was just discussed — never falls back to a generic catalog
 * search or a "no matching course" message, per the rule that a follow-up
 * about an already-referenced course must actually be answered. Returns
 * null when the message doesn't match any of these follow-up shapes, so
 * the caller can try other intents. */
async function handleCourseFollowUp(lower: string, history: DemoChatHistoryEntry[]): Promise<ChatReply | null> {
  const isFee = FEE_PATTERN.test(lower);
  const isDuration = DURATION_PATTERN.test(lower);
  const isSuitability = SUITABILITY_PATTERN.test(lower);
  const isMoreInfo = MORE_INFO_PATTERN.test(lower);
  if (!isFee && !isDuration && !isSuitability && !isMoreInfo) return null;

  const referencedIds = lastReferencedCourseIds(history);
  if (referencedIds.length === 0) {
    return {
      content: "I don't have a course in this conversation yet to answer that about — ask me to find or recommend one first.",
      referencedCourseIds: [],
    };
  }

  if (referencedIds.length > 1) {
    const options = await Course.find({ _id: { $in: referencedIds } }).select("title").lean();
    const names = options.map((c) => `"${c.title}"`).join(" or ");
    return {
      content: `Which course did you mean${names ? ` — ${names}` : ""}?`,
      referencedCourseIds: options.map((c) => c._id.toString()),
    };
  }

  // Exactly one — always re-fetch from MongoDB rather than trust anything
  // cached in conversation history, so the answer reflects the real
  // current record.
  const course = await Course.findById(referencedIds[0])
    .select("title category level price isFree durationHours shortDescription status")
    .lean();
  if (!course || course.status !== "published") {
    return {
      content: "That course doesn't seem to be available anymore — want me to search for something similar?",
      referencedCourseIds: [],
    };
  }

  const priceText = course.isFree ? "Free" : `$${course.price.toFixed(2)}`;
  const id = course._id.toString();

  if (isFee) {
    return { content: `"${course.title}" costs ${priceText}.`, referencedCourseIds: [id] };
  }
  if (isDuration) {
    return {
      content: `"${course.title}" is about ${course.durationHours} hours long.`,
      referencedCourseIds: [id],
    };
  }
  if (isSuitability) {
    const content =
      course.level === "beginner"
        ? `Yes — "${course.title}" is a beginner-level course, so it's a good fit if you're just starting out.`
        : `"${course.title}" is listed as ${course.level}, so it may assume some prior experience — it's not primarily aimed at beginners.`;
    return { content, referencedCourseIds: [id] };
  }

  // "tell me more"
  return {
    content:
      `"${course.title}" (${course.category}, ${course.level}) — ${priceText}, about ${course.durationHours} hours. ` +
      `${course.shortDescription}`,
    referencedCourseIds: [id],
  };
}

// --- Small, explicit glossary for non-course educational questions ---

export const GLOSSARY: Record<string, string> = {
  html: "HTML stands for HyperText Markup Language — the standard markup language used to structure content on the web.",
  css: "CSS stands for Cascading Style Sheets — used to style and lay out HTML content: colors, spacing, layout, and more.",
  javascript: "JavaScript is a programming language that adds interactivity and logic to web pages, and can also run on servers (e.g. via Node.js).",
  react: "React is a JavaScript library for building user interfaces out of reusable components.",
  api: "API stands for Application Programming Interface — a set of rules that lets different software systems communicate with each other.",
  http: "HTTP stands for HyperText Transfer Protocol — the protocol web browsers and servers use to exchange data.",
  https: "HTTPS stands for HyperText Transfer Protocol Secure — HTTP encrypted with TLS/SSL so data exchanged between a browser and server can't be read or tampered with in transit.",
  url: "URL stands for Uniform Resource Locator — the address used to locate a specific resource (a web page, image, API endpoint, etc.) on the internet.",
  sql: "SQL stands for Structured Query Language — used to query and manage data in relational databases.",
  crud: "CRUD stands for Create, Read, Update, Delete — the four basic operations most applications perform on stored data.",
  mern: "MERN stands for MongoDB, Express.js, React, and Node.js — a popular JavaScript stack for building full-stack web applications.",
  mean: "MEAN stands for MongoDB, Express.js, Angular, and Node.js — a JavaScript stack similar to MERN but using Angular instead of React on the frontend.",
  dom: "DOM stands for Document Object Model — the browser's in-memory tree representation of a web page, which JavaScript reads and modifies to update what's on screen.",
  json: "JSON stands for JavaScript Object Notation — a lightweight, text-based format for representing structured data, widely used for APIs and config files.",
  jwt: "JWT stands for JSON Web Token — a compact, signed token format commonly used to represent an authenticated user's identity between a client and server.",
  rest: "REST stands for Representational State Transfer — an architectural style for designing web APIs around resources and standard HTTP methods (GET, POST, PUT, DELETE).",
  cli: "CLI stands for Command-Line Interface — a text-based way of interacting with a program by typing commands, instead of using a graphical interface.",
  ide: "IDE stands for Integrated Development Environment — a single application (like VS Code or WebStorm) that bundles a code editor, debugger, and other developer tools together.",
  dbms: "DBMS stands for Database Management System — software that lets you create, query, update, and manage a database (e.g. MongoDB, PostgreSQL, MySQL).",
  oop: "OOP stands for Object-Oriented Programming — a programming style that organizes code around objects combining data and behavior, using concepts like classes, inheritance, and encapsulation.",
  git: "Git is a distributed version control system used to track changes in code and collaborate with other developers.",
};

export const GLOSSARY_ALIASES: Record<string, string> = {
  js: "javascript",
  reactjs: "react",
  "react.js": "react",
};

// Words/phrases that signal the learner actually wants course info, not a
// definition — checked before treating a message as a glossary question,
// so e.g. "recommend a MERN course" still searches the catalog instead of
// only returning the glossary definition for "MERN".
const COURSE_INTENT_PHRASES = [
  "course", "courses", "recommend", "recommendation", "suggest", "suggestion",
  "learning path", "enroll", "class", "compare", "versus", " vs ",
  "price", "cost", "fee", "level", "beginner", "intermediate", "advanced",
  "free", "budget", "cheap", "catalog",
];

export function mentionsCourseIntent(lower: string): boolean {
  return COURSE_INTENT_PHRASES.some((p) => lower.includes(p));
}

// Every phrasing this demo supports for "what does X mean/stand for",
// tried in order — most specific first, so e.g. "what is the full form of
// html" is captured by the "full form" pattern rather than misfiring the
// generic trailing "what is X" pattern. Each must fully consume the rest
// of the (already-normalized) message after the term, so a longer
// sentence that merely contains one of these phrases mid-way without
// actually being a definition question won't false-positive.
const ACRONYM_QUESTION_PATTERNS: RegExp[] = [
  // "full form of X" / "full form X" / "what is the full form of X"
  /\bfull\s+form\s+(?:of\s+)?(?:the\s+)?([a-z0-9.+#]+)\s*$/,
  // "what does X stand for" / "what does X stands for"
  /\bwhat\s+does\s+(?:the\s+)?([a-z0-9.+#]+)\s+stands?\s+for\s*$/,
  // "X stands for what" — anchored to the whole message to avoid
  // misfiring inside an unrelated longer sentence.
  /^([a-z0-9.+#]+)\s+stands?\s+for\s+what\s*$/,
  // "meaning of X"
  /\bmeaning\s+of\s+(?:the\s+)?([a-z0-9.+#]+)\s*$/,
  // "define X"
  /\bdefine\s+(?:the\s+)?([a-z0-9.+#]+)\s*$/,
  // "what is X" — kept last and most generic; only matches when nothing
  // more specific above already did.
  /\bwhat\s+is\s+(?:the\s+)?([a-z0-9.+#]+)\s*$/,
];

/** Lowercases, collapses whitespace, and strips trailing punctuation so
 * "Full  Form of HTML?", "full form of html", and "FULL FORM OF HTML!!"
 * all normalize identically before pattern matching. */
function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?!.,;:]+$/, "");
}

/** Returns a glossary answer, an honest "not in the demo glossary"
 * message, or null if the message doesn't read as a definition/acronym
 * question at all (so the caller falls through to other intents). Never
 * invents a definition outside GLOSSARY, and never attaches a course. */
export function matchGlossaryQuestion(message: string): ChatReply | null {
  const normalized = normalizeQuestion(message);

  let raw: string | null = null;
  for (const pattern of ACRONYM_QUESTION_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      raw = match[1]!;
      break;
    }
  }
  if (!raw) return null;

  const term = GLOSSARY_ALIASES[raw] ?? raw;
  const definition = GLOSSARY[term];

  if (definition) {
    return { content: definition, referencedCourseIds: [] };
  }
  return {
    content: "That term is not available in the Demo AI glossary yet. Ask about a course, or try another common web-development term.",
    referencedCourseIds: [],
  };
}

export async function generateDemoChatReply({ message, history }: DemoChatParams): Promise<ChatReply> {
  const lower = message.toLowerCase().trim();

  const compareMatch =
    lower.match(/compare\s+(.+?)\s+(?:and|with|to)\s+(.+)/) ??
    lower.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+)/);
  if (compareMatch) {
    return handleCompare(compareMatch[1]!, compareMatch[2]!);
  }

  // "next" alone is ambiguous with the Next.js framework — only treat it
  // as a progression question when it's not paired with "js"/"next.js"
  // AND reads like a question about what to do, not a topic search.
  const mentionsNextJs = /next\.?js/.test(lower);
  const asksWhatsNext =
    /\b(next course|what'?s next|what next|after that|then what|take next)\b/.test(lower) ||
    (!mentionsNextJs && /\bnext\b/.test(lower) && /\b(what|should|do|take|study|learn)\b/.test(lower));
  if (asksWhatsNext) {
    return handleNextCourse(history);
  }

  const followUp = await handleCourseFollowUp(lower, history);
  if (followUp) return followUp;

  if (!mentionsCourseIntent(lower)) {
    const glossaryReply = matchGlossaryQuestion(lower);
    if (glossaryReply) return glossaryReply;
  }

  const freeOnly = /\bfree\b/.test(lower);
  const maxPrice = detectMaxPrice(lower);
  const level = detectLevel(lower);

  let keywords = stripStopwords(message);
  // Pure follow-ups ("tell me more", "why that one?") carry no topic
  // signal of their own — fall back to the previous user message so the
  // search still has something real to work with, preserving context
  // across turns instead of returning nothing.
  if (keywords.length === 0) {
    const prior = lastUserMessage(history.slice(0, -1));
    if (prior) keywords = stripStopwords(prior);
  }

  // "recommend A course" (singular, indefinite article) reads as a request
  // for one pick, not a browse-the-catalog list — keeping the result to a
  // single course also keeps any later "the course" follow-up unambiguous.
  // "courses" (plural) or an open-ended "what courses..." keeps the fuller list.
  const wantsSingleResult = /\brecommend a\b|\ba\s+(?:\w+\s+){0,3}course\b/.test(lower) && !/\bcourses\b/.test(lower);

  const results = await searchCourses({
    query: keywords || undefined,
    level,
    freeOnly: freeOnly || undefined,
    maxPrice: freeOnly ? undefined : maxPrice,
    limit: wantsSingleResult ? 1 : 5,
  });

  if (results.length === 0) {
    const constraints = [level, freeOnly ? "free" : maxPrice ? `under $${maxPrice}` : null]
      .filter(Boolean)
      .join(", ");
    return {
      content:
        `I couldn't find a published course matching that${constraints ? ` (${constraints})` : ""} in the catalog right now. ` +
        `Try a different topic, or drop the budget/level constraint.`,
      referencedCourseIds: [],
    };
  }

  const intro = freeOnly
    ? "Here are free courses that match:"
    : maxPrice !== undefined
      ? `Here are courses within $${maxPrice}:`
      : level
        ? `Here are ${level} courses that match:`
        : "Here's what I found in the catalog:";

  const content = `${intro}\n\n${results.map((c) => `• ${formatCourseLine(c)}`).join("\n")}`;

  return { content, referencedCourseIds: results.map((c) => c._id) };
}
