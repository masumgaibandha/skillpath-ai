import { Schema, model, Types, type InferSchemaType } from "mongoose";

export const ENROLLMENT_TYPES = ["free", "paid"] as const;
export const ENROLLMENT_STATUSES = ["pending", "active", "refunded"] as const;

const enrollmentSchema = new Schema(
  {
    // Better Auth user id — not a Mongoose ref, same convention as
    // Course.createdBy (Better Auth owns its own user collection).
    userId: { type: String, required: true, index: true },
    courseId: { type: Types.ObjectId, ref: "Course", required: true, index: true },
    type: { type: String, enum: ENROLLMENT_TYPES, required: true },
    // Free enrollments are created directly as "active". Paid enrollments
    // start "pending" at checkout-session creation and only become
    // "active" via the Stripe webhook's checkout.session.completed event
    // — never set directly by a client request.
    status: { type: String, enum: ENROLLMENT_STATUSES, default: "pending" },
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "usd" },
    // Unique + sparse: free enrollments never set this, so multiple free
    // enrollments must not collide on "missing" values.
    stripeCheckoutSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: { type: String },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One enrollment per user per course — also the "already enrolled" check,
// and lets checkout-session creation safely upsert on retry/re-checkout.
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type EnrollmentAttrs = InferSchemaType<typeof enrollmentSchema>;

const Enrollment = model<EnrollmentAttrs>("Enrollment", enrollmentSchema);

export default Enrollment;
