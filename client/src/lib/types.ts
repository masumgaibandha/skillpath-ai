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
