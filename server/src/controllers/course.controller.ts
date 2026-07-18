import type { Request, Response } from "express";
import Course from "../models/Course";
import {
  buildCourseFilter,
  buildCourseSort,
  courseQuerySchema,
} from "../utils/courseQuery";

export async function listCourses(req: Request, res: Response) {
  const parsed = courseQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid query parameters",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const query = parsed.data;
  const filter = buildCourseFilter(query);
  const sort = buildCourseSort(query.sort);
  const skip = (query.page - 1) * query.limit;

  const [items, total] = await Promise.all([
    Course.find(filter).sort(sort).skip(skip).limit(query.limit).lean(),
    Course.countDocuments(filter),
  ]);

  res.json({
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
}

export async function getCourseBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  const course = await Course.findOne({ slug, status: "published" }).lean();
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  const relatedCourses = await Course.find({
    _id: { $ne: course._id },
    status: "published",
    $or: [{ category: course.category }, { tags: { $in: course.tags } }],
  })
    .limit(4)
    .lean();

  res.json({ course, relatedCourses });
}
