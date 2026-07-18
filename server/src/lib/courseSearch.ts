import type { FilterQuery } from "mongoose";
import Course, { type CourseAttrs } from "../models/Course.js";
import type { SearchCoursesArgs } from "../utils/chat.js";

// The ONE searchCourses tool — called directly by demo mode (lib/chatDemo.ts)
// and invoked as an OpenAI function-calling tool by real mode
// (chat.controller.ts). Both sources return real, published MongoDB courses
// only; nothing about a course here is ever invented. Reuses the same
// $text index and filter shape as the Explore page's course search
// (utils/courseQuery.ts) for consistency.
export interface CourseSearchResult {
  _id: string;
  title: string;
  slug: string;
  category: string;
  level: string;
  price: number;
  isFree: boolean;
  durationHours: number;
  shortDescription: string;
  images: string[];
}

export async function searchCourses(args: SearchCoursesArgs): Promise<CourseSearchResult[]> {
  const filter: FilterQuery<CourseAttrs> = { status: "published" };

  if (args.query) {
    filter.$text = { $search: args.query };
  }
  if (args.category) {
    filter.category = args.category;
  }
  if (args.level) {
    filter.level = args.level;
  }
  if (args.freeOnly) {
    filter.isFree = true;
  } else if (typeof args.maxPrice === "number") {
    filter.$or = [{ isFree: true }, { price: { $lte: args.maxPrice } }];
  }

  // Sorting by $meta: "textScore" requires that same meta be projected —
  // string-form .select() would silently drop it, so the query/no-query
  // cases build the projection+sort together rather than composing them.
  const baseFields = {
    title: 1,
    slug: 1,
    category: 1,
    level: 1,
    price: 1,
    isFree: 1,
    durationHours: 1,
    shortDescription: 1,
    images: 1,
  } as const;

  const cursor = args.query
    ? Course.find(filter)
        .select({ ...baseFields, score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" } })
    : Course.find(filter).select(baseFields).sort({ createdAt: -1 });

  const courses = await cursor.limit(args.limit).lean();

  return courses.map((c) => ({
    _id: c._id.toString(),
    title: c.title,
    slug: c.slug,
    category: c.category,
    level: c.level,
    price: c.price,
    isFree: c.isFree,
    durationHours: c.durationHours,
    shortDescription: c.shortDescription,
    images: c.images,
  }));
}
