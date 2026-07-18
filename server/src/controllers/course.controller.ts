import type { Request, Response } from "express";
import Course from "../models/Course";
import {
  buildCourseFilter,
  buildCourseSort,
  courseQuerySchema,
  createCourseSchema,
} from "../utils/courseQuery";
import { generateUniqueSlug } from "../utils/slugify";

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

export async function createCourse(req: Request, res: Response) {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid course data",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  // requireAuth already rejected the request with 401 if there's no
  // session, so req.session.user is guaranteed here. createdBy is always
  // derived from the session — the client cannot set it, even though the
  // parsed body strips unknown fields anyway.
  const createdBy = req.session!.user.id;
  const slug = await generateUniqueSlug(parsed.data.title);

  const course = await Course.create({ ...parsed.data, slug, createdBy });
  res.status(201).json({ course });
}

export async function listMyCourses(req: Request, res: Response) {
  const createdBy = req.session!.user.id;
  // Every status (not just "published") — this is the owner's own
  // management view, unlike the public listing/detail endpoints.
  const items = await Course.find({ createdBy }).sort({ createdAt: -1 }).lean();
  res.json({ items });
}

export async function deleteCourse(req: Request, res: Response) {
  const { id } = req.params;

  const course = await Course.findById(id);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  // Ownership check also blocks deleting seeded courses: seeded courses
  // use the sentinel createdBy "system-seed", which never matches a real
  // Better Auth session user id, so no normal user can ever pass this
  // check for them.
  if (course.createdBy !== req.session!.user.id) {
    res.status(403).json({ error: "You do not have permission to delete this course" });
    return;
  }

  await course.deleteOne();
  res.json({ ok: true });
}
