// Mirrors server/src/models/Course.ts — duplicated per CLAUDE.md's
// "duplicate small shared types" rule rather than a shared package.
export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export interface Course {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  whatYoullLearn: string[];
  prerequisites: string[];
  category: string;
  tags: string[];
  level: CourseLevel;
  price: number;
  isFree: boolean;
  currency: string;
  instructorName: string;
  images: string[];
  durationHours: number;
  rating: number;
  ratingCount: number;
  status: "draft" | "published";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseListResponse {
  items: Course[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CourseDetailResponse {
  course: Course;
  relatedCourses: Course[];
}

export const COURSE_SORTS = ["newest", "price_asc", "price_desc", "rating"] as const;
export type CourseSort = (typeof COURSE_SORTS)[number];

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  sort?: CourseSort;
}

// Mirrors server's createCourseSchema (server/src/utils/courseQuery.ts).
// createdBy/slug/isFree/status/rating/ratingCount are server-controlled and
// deliberately excluded — the client never sends them.
export interface CreateCourseInput {
  title: string;
  shortDescription: string;
  fullDescription: string;
  whatYoullLearn: string[];
  prerequisites: string[];
  category: string;
  tags: string[];
  level: CourseLevel;
  price: number;
  instructorName: string;
  images: string[];
  durationHours: number;
}

export interface MyCoursesResponse {
  items: Course[];
}

// Mirrors server/src/models/Enrollment.ts
export type EnrollmentType = "free" | "paid";
export type EnrollmentStatus = "pending" | "active" | "refunded";

export interface Enrollment {
  _id: string;
  userId: string;
  courseId: string | Course;
  type: EnrollmentType;
  status: EnrollmentStatus;
  amountPaid: number;
  currency: string;
  enrolledAt: string;
}

export interface EnrollmentStatusResponse {
  enrolled: boolean;
  status: EnrollmentStatus | "none";
  type?: EnrollmentType;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface MyEnrollmentsResponse {
  items: Enrollment[];
}

// Mirrors server/src/utils/studyPlan.ts's CourseSummary — a trimmed course
// shape embedded in study-plan responses, enough to render a card and link
// to the real course without shipping the full Course document.
export interface CourseSummary {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  category: string;
  level: CourseLevel;
  price: number;
  isFree: boolean;
  durationHours: number;
}

export interface StudyPlanInputs {
  goal: string;
  skillLevel: CourseLevel;
  weeklyHours: number;
  budget: number;
  timeframeWeeks: number;
  preferredTopics: string[];
}

export interface StudyPlanMilestone {
  title: string;
  description: string;
  order: number;
  estimatedWeeks: number;
  estimatedHours: number;
  courses: CourseSummary[];
}

export type StudyPlanRecommendedCourse = CourseSummary & {
  reason: string;
  matchScore: number;
};

export interface StudyPlanFeedbackEntry {
  feedback: string;
  requestedAt: string;
}

export type StudyPlanStatus = "active" | "archived";

// Mirrors server's serializePlan() output (studyPlan.controller.ts).
export interface StudyPlan {
  _id: string;
  userId: string;
  title: string;
  inputs: StudyPlanInputs;
  summary: string;
  recommendedCourses: StudyPlanRecommendedCourse[];
  milestones: StudyPlanMilestone[];
  risks: string[];
  nextActions: string[];
  version: number;
  feedbackHistory: StudyPlanFeedbackEntry[];
  generatedAt: string;
  status: StudyPlanStatus;
}

// Mirrors server's createStudyPlanSchema (server/src/utils/studyPlan.ts).
export interface CreateStudyPlanInput {
  goal: string;
  skillLevel: CourseLevel;
  weeklyHours: number;
  budget: number;
  timeframeWeeks: number;
  preferredTopics: string[];
}

export interface RefineStudyPlanInput {
  feedback: string;
}

export interface MyStudyPlansResponse {
  items: StudyPlan[];
}

export interface StudyPlanResponse {
  studyPlan: StudyPlan;
}

// Non-secret, derived flag only — never the raw OPENAI_API_KEY/AI_DEMO_MODE
// env values themselves (see server's getStudyPlanConfig controller).
export interface StudyPlanConfigResponse {
  demoMode: boolean;
}

// Mirrors server's serializeConversation() output (chat.controller.ts).
export type ChatMessageRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  referencedCourses: CourseSummary[];
  createdAt: string;
}

export interface ChatConversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Lightweight shape for the sidebar list — no message bodies.
export interface ChatConversationListItem {
  _id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageInput {
  content: string;
  // Client-generated idempotency key for this send attempt — lets the
  // server detect and replay a resubmitted request (double-click,
  // repeated Enter, a network retry) instead of appending a duplicate
  // user/assistant pair. See server's sendMessageSchema.
  clientMessageId: string;
}

export interface ChatConversationsListResponse {
  items: ChatConversationListItem[];
}

export interface ChatConversationResponse {
  conversation: ChatConversation;
}

// Non-secret, derived flag only — mirrors StudyPlanConfigResponse (see
// server's getChatConfig controller).
export interface ChatConfigResponse {
  demoMode: boolean;
}
