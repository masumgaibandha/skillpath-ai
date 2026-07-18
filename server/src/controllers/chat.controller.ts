import type { Request, Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import Course, { COURSE_LEVELS } from "../models/Course.js";
import ChatConversation from "../models/ChatConversation.js";
import { AI_DEMO_MODE, openai, openaiConfigured, OPENAI_MODEL } from "../lib/openai.js";
import { generateDemoChatReply, type DemoChatHistoryEntry } from "../lib/chatDemo.js";
import { searchCourses } from "../lib/courseSearch.js";
import {
  chatReplySchema,
  searchCoursesArgsSchema,
  sendMessageSchema,
  type ChatReply,
  type CourseSummary,
} from "../utils/chat.js";

// "Safe context window": only the most recent exchanges are sent back to
// the model (or handed to the demo generator) on every turn — matches the
// project plan's capped-history approach for the chat assistant.
const MAX_HISTORY_MESSAGES = 10;
// Bounds the real-mode tool-calling loop so a confused model can't spin
// forever calling searchCourses — matches "no streaming", keep-it-simple.
const MAX_TOOL_ITERATIONS = 3;
// Bounds how long a duplicate/concurrent request (same clientMessageId)
// waits for the winning request's generation to finish, polling
// lib/chatDemo.ts-or-OpenAI-speed intervals rather than a tight loop.
// Generous enough for a real OpenAI tool-calling round trip; a request
// still "processing" after this is genuinely stuck, not just slow.
const DUPLICATE_POLL_INTERVAL_MS = 250;
const DUPLICATE_POLL_TIMEOUT_MS = 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findConversationLean(conversationId: string) {
  return ChatConversation.findById(conversationId).lean();
}
type LeanChatConversation = NonNullable<Awaited<ReturnType<typeof findConversationLean>>>;

type DuplicateOutcome =
  | { kind: "completed"; conversation: LeanChatConversation }
  | { kind: "failed" }
  | { kind: "not-found" }
  | { kind: "timeout" };

/** Called when a request loses the atomic claim for a clientMessageId —
 * i.e. some other request (or an earlier attempt of this same one) is the
 * one actually generating the reply. Never returns a partial, user-only
 * exchange: it checks that message's status and, if it's still
 * "processing", polls (bounded) until it flips to "completed"/"failed"
 * rather than racing to read an incomplete result. */
async function resolveDuplicateOutcome(conversationId: string, clientMessageId: string): Promise<DuplicateOutcome> {
  const deadline = Date.now() + DUPLICATE_POLL_TIMEOUT_MS;

  while (true) {
    const current = await findConversationLean(conversationId);
    if (!current) return { kind: "not-found" };

    const message = current.messages.find((m) => m.clientMessageId === clientMessageId);
    if (!message || message.status === "completed") {
      return { kind: "completed", conversation: current };
    }
    if (message.status === "failed") {
      return { kind: "failed" };
    }
    if (Date.now() >= deadline) {
      return { kind: "timeout" };
    }
    await sleep(DUPLICATE_POLL_INTERVAL_MS);
  }
}

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

/** Re-verifies every referenced course id directly against MongoDB,
 * independent of whichever generation path produced them — the actual
 * enforcement of "never invent a course id", applied uniformly to both
 * demo and real replies right before anything is persisted or returned. */
async function sanitizeReferencedCourseIds(ids: string[]): Promise<Types.ObjectId[]> {
  const candidates = Array.from(new Set(ids)).filter((id) => isValidObjectId(id));
  if (candidates.length === 0) return [];
  const found = await Course.find({ _id: { $in: candidates }, status: "published" })
    .select("_id")
    .lean();
  const foundSet = new Set(found.map((c) => c._id.toString()));
  return candidates.filter((id) => foundSet.has(id)).map((id) => new Types.ObjectId(id));
}

// Mongoose infers array-of-ObjectId/subdocument-with-ref paths as a
// DocumentArray of wrapper objects rather than plain literals, but every
// element still has a working toString() (the hex id) whether it's a real
// ObjectId, a FlattenMaps-lean version, or a subdocument wrapper.
interface IdLike {
  toString(): string;
}
interface MessageLike {
  role: "user" | "assistant";
  content: string;
  referencedCourseIds: IdLike[];
  createdAt?: Date;
}
interface ConversationLike {
  _id: IdLike;
  userId: string;
  title: string;
  messages: MessageLike[];
  createdAt?: Date;
  updatedAt?: Date;
}

function allReferencedIds(conversation: { messages: { referencedCourseIds: IdLike[] }[] }): Types.ObjectId[] {
  const ids: Types.ObjectId[] = [];
  for (const m of conversation.messages) {
    for (const id of m.referencedCourseIds) ids.push(new Types.ObjectId(id.toString()));
  }
  return ids;
}

function serializeConversation(conversation: ConversationLike, courseMap: Map<string, CourseSummary>) {
  return {
    _id: conversation._id.toString(),
    userId: conversation.userId,
    title: conversation.title,
    messages: conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
      referencedCourses: m.referencedCourseIds
        .map((id) => courseMap.get(id.toString()))
        .filter((c): c is CourseSummary => Boolean(c)),
      createdAt: m.createdAt,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

function deriveTitle(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  const maxLen = 60;
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen - 1).trimEnd()}…` : trimmed;
}

const SYSTEM_PROMPT = `You are the AI Course Assistant for SkillPath AI, an online course platform. Answer learning and course-discovery questions helpfully and concisely, using the recent conversation history for context. Call the searchCourses tool whenever the learner asks about specific courses, topics, prices, free options, comparisons, or "what's next" — never invent a course, course id, price, category, or URL. Only ever reference course ids that a searchCourses call actually returned earlier in this conversation; put those ids in "referencedCourseIds" in your final answer, and leave it empty when your answer doesn't depend on a specific course. For plain educational or terminology questions (e.g. "what does HTML stand for") that don't require looking anything up in the catalog, just answer directly from your own knowledge — do not call searchCourses and do not attach a referencedCourseIds unless the learner is also asking about a course. When a follow-up refers to "the course"/"it" after you've just discussed one, resolve it using the conversation history rather than treating it as a new, ambiguous search. If searchCourses returns nothing relevant, say so honestly instead of making something up. Keep answers focused — a few sentences or a short list, not an essay.`;

const searchCoursesTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "searchCourses",
    description:
      "Search real, published courses in the SkillPath AI catalog by topic keywords, skill level, and price/free status. Returns up to `limit` real courses.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text topic or keywords to search for, e.g. 'react' or 'data science'" },
        category: { type: "string", description: "Exact category name to filter to, if the learner named or implied a specific catalog category" },
        level: { type: "string", enum: COURSE_LEVELS, description: "Filter to a specific skill level" },
        freeOnly: { type: "boolean", description: "Only return free ($0) courses" },
        maxPrice: { type: "number", description: "Maximum price in USD (ignored if freeOnly is true)" },
        limit: { type: "number", description: "Max results to return, 1-10 (default 5)" },
      },
    },
  },
};

/** Runs the tool-calling loop against the real OpenAI API, then a final
 * structured-output turn (no tools) to get {content, referencedCourseIds}
 * back in the same validated shape demo mode produces. Every id it can
 * possibly reference came from an actual searchCourses call made inside
 * this function — never from free-form model text. */
async function generateRealChatReply(seedMessages: ChatCompletionMessageParam[]): Promise<ChatReply | null> {
  if (!openai) return null;

  const messages: ChatCompletionMessageParam[] = [...seedMessages];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      tools: [searchCoursesTool],
    });
    const message = completion.choices[0]?.message;
    if (!message) return null;

    if (!message.tool_calls || message.tool_calls.length === 0) {
      break;
    }

    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls,
    });

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      let rawArgs: unknown = {};
      try {
        rawArgs = JSON.parse(call.function.arguments);
      } catch {
        rawArgs = {};
      }
      const parsedArgs = searchCoursesArgsSchema.safeParse(rawArgs);
      const results = parsedArgs.success ? await searchCourses(parsedArgs.data) : [];
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(results),
      });
    }
  }

  // Final turn without tools: forces a plain answer we can structure and
  // validate, instead of ending mid tool-call loop.
  const final = await openai.chat.completions.parse({
    model: OPENAI_MODEL,
    messages: [
      ...messages,
      {
        role: "user",
        content:
          "Give your final answer now as structured JSON. Only include ids in referencedCourseIds that a searchCourses call actually returned earlier in this conversation — use an empty array if none apply.",
      },
    ],
    response_format: zodResponseFormat(chatReplySchema, "chat_reply"),
  });
  return final.choices[0]?.message.parsed ?? null;
}

interface GenerateReplyParams {
  message: string;
  demoHistory: DemoChatHistoryEntry[];
  realHistory: ChatCompletionMessageParam[];
}

/** The single fork point between the two generation sources. AI_DEMO_MODE
 * is read once and decides the whole branch — there is deliberately no
 * catch/fallback between them, so a failed real OpenAI call never
 * silently degrades into a demo-generated reply. */
async function generateReply(params: GenerateReplyParams): Promise<ChatReply | null> {
  if (AI_DEMO_MODE) {
    const demoOutput = await generateDemoChatReply({ message: params.message, history: params.demoHistory });
    const parsed = chatReplySchema.safeParse(demoOutput);
    return parsed.success ? parsed.data : null;
  }

  return generateRealChatReply([
    { role: "system", content: SYSTEM_PROMPT },
    ...params.realHistory,
    { role: "user", content: params.message },
  ]);
}

export async function createConversation(req: Request, res: Response) {
  const userId = req.session!.user.id;
  const conversation = await ChatConversation.create({ userId, title: "New conversation", messages: [] });
  res.status(201).json({ conversation: serializeConversation(conversation.toObject(), new Map()) });
}

export async function listMyConversations(req: Request, res: Response) {
  const userId = req.session!.user.id;
  const conversations = await ChatConversation.find({ userId })
    .select("title messages createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    items: conversations.map((c) => ({
      _id: c._id.toString(),
      title: c.title,
      messageCount: c.messages.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

export async function getConversation(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const conversation = await ChatConversation.findById(id).lean();
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conversation.userId !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to view this conversation" });
    return;
  }

  const courseMap = await resolveCourseSummaries(allReferencedIds(conversation));
  res.json({ conversation: serializeConversation(conversation, courseMap) });
}

/** Non-secret, derived config the client needs to render correctly (e.g.
 * whether to show the demo-mode banner) — never the raw env values
 * themselves. Mirrors getStudyPlanConfig. */
export async function getChatConfig(_req: Request, res: Response) {
  res.json({ demoMode: AI_DEMO_MODE });
}

export async function sendMessage(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const parsedBody = sendMessageSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: "Invalid message",
      details: parsedBody.error.flatten().fieldErrors,
    });
    return;
  }

  const existing = await ChatConversation.findById(id).select("userId").lean();
  if (!existing) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (existing.userId !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to send messages in this conversation" });
    return;
  }

  const { content, clientMessageId } = parsedBody.data;

  // Checked before claiming (not after) so a config error can never leave
  // a claimed-but-unanswered user message behind — config state is static
  // per deployment, not something that changes between requests.
  if (!AI_DEMO_MODE && !openaiConfigured) {
    res.status(503).json({ error: "AI Chat Assistant is not configured: set OPENAI_API_KEY" });
    return;
  }

  // Idempotency, enforced atomically: this filter only matches a document
  // that does NOT yet have a message with this clientMessageId, and
  // MongoDB serializes concurrent writes to a single document — so of any
  // number of near-simultaneous duplicate requests (double-click, repeated
  // Enter, a network-level retry), only one can ever win this update. A
  // plain read-then-write check was tried first and failed exactly this
  // scenario under true concurrency; this is the real enforcement. The
  // claimed message starts "processing" so a losing duplicate can tell
  // "still generating" apart from "done" — see waitForCompletion below.
  const claimed = await ChatConversation.findOneAndUpdate(
    { _id: id, userId: req.session!.user.id, "messages.clientMessageId": { $ne: clientMessageId } },
    {
      $push: {
        messages: {
          role: "user",
          content,
          referencedCourseIds: [],
          createdAt: new Date(),
          clientMessageId,
          status: "processing",
        },
      },
    },
    { new: true }
  );

  if (!claimed) {
    // Lost the race, or this is a legitimate resubmission — someone else
    // already claimed this clientMessageId. Never race to read a
    // user-only, not-yet-answered exchange: check its status and, if it's
    // still being generated, wait a bounded amount of time for the same
    // result the winning request will produce.
    const outcome = await resolveDuplicateOutcome(String(id), clientMessageId);
    if (outcome.kind === "completed") {
      const courseMap = await resolveCourseSummaries(allReferencedIds(outcome.conversation));
      res.status(200).json({ conversation: serializeConversation(outcome.conversation, courseMap) });
      return;
    }
    if (outcome.kind === "failed") {
      res.status(502).json({ error: "The assistant didn't return a usable reply. Please try again." });
      return;
    }
    if (outcome.kind === "not-found") {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    // Timed out still "processing" — genuinely stuck (e.g. the original
    // request's process died mid-generation) rather than just slow. A
    // clear, retryable error rather than hanging or guessing a result;
    // the client already preserves the composer text on any send error.
    res.status(504).json({ error: "The assistant is taking longer than expected. Please try again." });
    return;
  }

  // We won the claim — the user message is already persisted. History is
  // everything before the message we just pushed (the current turn, not
  // prior context).
  const priorMessages = claimed.messages.slice(0, -1).slice(-MAX_HISTORY_MESSAGES);
  const demoHistory: DemoChatHistoryEntry[] = priorMessages.map((m) => ({
    role: m.role,
    content: m.content,
    referencedCourseIds: m.referencedCourseIds.map((refId) => refId.toString()),
  }));
  const realHistory: ChatCompletionMessageParam[] = priorMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const claimedMessageIndex = claimed.messages.length - 1;

  try {
    const reply = await generateReply({ message: content, demoHistory, realHistory });
    if (!reply) throw new Error("generateReply returned no usable reply");

    const referencedCourseIds = await sanitizeReferencedCourseIds(reply.referencedCourseIds);
    const wasFirstExchange = claimed.messages.length === 1;

    claimed.messages[claimedMessageIndex]!.status = "completed";
    claimed.messages.push({
      role: "assistant",
      content: reply.content,
      referencedCourseIds,
      createdAt: new Date(),
    });
    if (wasFirstExchange) {
      claimed.title = deriveTitle(content);
    }
    await claimed.save();

    const courseMap = await resolveCourseSummaries(allReferencedIds(claimed));
    res.status(201).json({ conversation: serializeConversation(claimed.toObject(), courseMap) });
  } catch (err) {
    console.error("[chat] Failed to generate/save reply:", err);
    // Mark the claimed message failed so any duplicate waiting on it stops
    // polling immediately instead of running out the full timeout — best
    // effort: if even this write fails, waiters still resolve via timeout.
    try {
      claimed.messages[claimedMessageIndex]!.status = "failed";
      await claimed.save();
    } catch (markErr) {
      console.error("[chat] Failed to mark message as failed:", markErr);
    }
    res.status(502).json({ error: "The assistant didn't return a usable reply. Please try again." });
  }
}

export async function deleteConversation(req: Request, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "Invalid conversation id" });
    return;
  }

  const conversation = await ChatConversation.findById(id);
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  if (conversation.userId !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to delete this conversation" });
    return;
  }

  await conversation.deleteOne();
  res.json({ ok: true });
}
