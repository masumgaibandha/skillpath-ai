import type { FilterQuery, SortOrder } from "mongoose";
import { z } from "zod";
import { COURSE_LEVELS, type CourseAttrs } from "../models/Course";

export const COURSE_SORTS = [
  "newest",
  "price_asc",
  "price_desc",
  "rating",
] as const;

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  level: z.enum(COURSE_LEVELS).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  isFree: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(COURSE_SORTS).default("newest"),
});

export type CourseQuery = z.infer<typeof courseQuerySchema>;

/** Every listing query is scoped to published courses only. */
export function buildCourseFilter(query: CourseQuery): FilterQuery<CourseAttrs> {
  const filter: FilterQuery<CourseAttrs> = { status: "published" };

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.level) {
    filter.level = query.level;
  }
  if (query.isFree !== undefined) {
    filter.isFree = query.isFree;
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
  }

  return filter;
}

export function buildCourseSort(
  sort: CourseQuery["sort"]
): Record<string, SortOrder> {
  switch (sort) {
    case "price_asc":
      return { price: 1 };
    case "price_desc":
      return { price: -1 };
    case "rating":
      return { rating: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}
