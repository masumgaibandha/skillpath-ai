import { z } from "zod";
import { COURSE_LEVELS } from "../models/Course.js";

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message is required").max(2000),
  // Client-generated idempotency key for this specific send attempt (see
  // ChatConversation.messages.clientMessageId) — required so double-clicks,
  // repeated Enter, or a network-level retry can be detected and replayed
  // instead of creating a duplicate user/assistant pair.
  clientMessageId: z.string().trim().min(1, "clientMessageId is required").max(100),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Args for the one searchCourses tool — shared shape between the real
// OpenAI function-calling definition (see chat.controller.ts) and demo
// mode's own constructed calls (see lib/chatDemo.ts), so both sources go
// through the exact same query in lib/courseSearch.ts.
export const searchCoursesArgsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  // Exact category match — distinct from `query`, which is a free-text
  // relevance search. Lets callers (e.g. a "what's next" follow-up that
  // already knows a course's exact category) filter precisely instead of
  // relying on text-search scoring against the category name.
  category: z.string().trim().max(100).optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  freeOnly: z.boolean().optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});
export type SearchCoursesArgs = z.infer<typeof searchCoursesArgsSchema>;

// The shape we require back from OpenAI (via zodResponseFormat) — or from
// the deterministic demo generator (lib/chatDemo.ts) when AI_DEMO_MODE is
// on — and independently re-validate with .safeParse() before ever
// saving it, uniformly for both sources. referencedCourseIds is required
// (not optional/default'd) so OpenAI's strict structured-output mode has
// something to always populate, but an empty array is valid — most replies
// won't reference a course at all.
export const chatReplySchema = z.object({
  content: z.string().min(1).max(3000),
  referencedCourseIds: z.array(z.string()).max(10),
});
export type ChatReply = z.infer<typeof chatReplySchema>;

// Lightweight course shape embedded in chat responses (referenced courses)
// — enough for the client to render a card and link to the real course,
// without shipping the full Course document. Mirrors
// server/src/utils/studyPlan.ts's CourseSummary.
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
