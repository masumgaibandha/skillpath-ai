import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Course from "../models/Course";
import Enrollment from "../models/Enrollment";

export async function enrollFree(req: Request, res: Response) {
  const { courseId } = req.params;
  if (!isValidObjectId(courseId)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }

  const course = await Course.findOne({ _id: courseId, status: "published" });
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  if (!course.isFree) {
    res.status(400).json({ error: "This course is not free — use checkout instead" });
    return;
  }

  const userId = req.session!.user.id;
  const existing = await Enrollment.findOne({ userId, courseId });
  if (existing?.status === "active") {
    res.status(409).json({ error: "You're already enrolled in this course" });
    return;
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { userId, courseId },
    {
      userId,
      courseId,
      type: "free",
      status: "active",
      amountPaid: 0,
      currency: course.currency,
      enrolledAt: new Date(),
    },
    { upsert: true, new: true }
  );

  res.status(201).json({ enrollment });
}

export async function listMyEnrollments(req: Request, res: Response) {
  const userId = req.session!.user.id;
  const items = await Enrollment.find({ userId, status: "active" })
    .sort({ enrolledAt: -1 })
    .populate("courseId")
    .lean();
  res.json({ items });
}

export async function getEnrollmentStatus(req: Request, res: Response) {
  const { courseId } = req.params;
  if (!isValidObjectId(courseId)) {
    res.status(400).json({ error: "Invalid course id" });
    return;
  }

  const userId = req.session!.user.id;
  const enrollment = await Enrollment.findOne({ userId, courseId }).lean();

  if (!enrollment) {
    res.json({ enrolled: false, status: "none" });
    return;
  }

  res.json({
    enrolled: enrollment.status === "active",
    status: enrollment.status,
    type: enrollment.type,
  });
}
