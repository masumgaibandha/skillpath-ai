import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const COURSE_STATUSES = ["draft", "published"] as const;

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Two distinct fields, never derived from one another: shortDescription
    // powers cards/listings, fullDescription powers the detail page overview.
    shortDescription: { type: String, required: true, trim: true },
    fullDescription: { type: String, required: true, trim: true },
    whatYoullLearn: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    level: { type: String, enum: COURSE_LEVELS, required: true },
    price: { type: Number, required: true, min: 0 },
    // Derived from price in the pre-validate hook below — never set directly.
    isFree: { type: Boolean, default: false },
    currency: { type: String, default: "usd" },
    instructorName: { type: String, required: true, trim: true },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (arr: string[]) => arr.length >= 2 && arr.length <= 4,
        message: "images must contain between 2 and 4 URLs",
      },
    },
    durationHours: { type: Number, required: true, min: 0 },
    // Realistic seeded aggregate numbers — not derived from real reviews.
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: COURSE_STATUSES, default: "published" },
    // Better Auth user id of the owner. Any authenticated user can create a
    // course; edit/delete must check createdBy server-side (Phase 4). Seeded
    // courses use the sentinel "system-seed" rather than a real user id.
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

courseSchema.pre("validate", function (next) {
  this.isFree = this.price === 0;
  next();
});

// Search: title + both description fields + tags.
courseSchema.index({
  title: "text",
  shortDescription: "text",
  fullDescription: "text",
  tags: "text",
});
// Explore page filters (status is always in the query; category/level/price vary).
courseSchema.index({ status: 1, category: 1, level: 1, price: 1 });
// Newest-first sort.
courseSchema.index({ createdAt: -1 });

export type CourseAttrs = InferSchemaType<typeof courseSchema>;
export type CourseDocument = HydratedDocument<CourseAttrs>;

const Course = model<CourseAttrs>("Course", courseSchema);

export default Course;
