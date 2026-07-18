import { Schema, model, Types, type InferSchemaType } from "mongoose";

export const CHAT_MESSAGE_ROLES = ["user", "assistant"] as const;
export const CHAT_MESSAGE_STATUSES = ["processing", "completed", "failed"] as const;

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: CHAT_MESSAGE_ROLES, required: true },
    content: { type: String, required: true, trim: true },
    // Populated only on assistant messages, from real searchCourses tool
    // results — cross-checked against real published courses before the
    // conversation is ever saved (see chat.controller.ts). Never trusted
    // directly from the AI/demo-generator response.
    referencedCourseIds: { type: [Types.ObjectId], ref: "Course", default: [] },
    createdAt: { type: Date, default: Date.now },
    // Set on user messages only — a client-generated id for the send
    // attempt that produced this message. Lets chat.controller.ts detect
    // a resubmitted request (double-click, repeated Enter, a client-side
    // network retry) and replay the existing result instead of appending
    // a duplicate user/assistant pair.
    clientMessageId: { type: String },
    // Set on user messages only, alongside clientMessageId — lets a
    // concurrent duplicate request tell "still generating the reply" from
    // "done" apart, so it can wait for the real result instead of racing
    // to read a user-only, not-yet-answered exchange. Internal only, never
    // exposed in serializeConversation's response.
    status: { type: String, enum: CHAT_MESSAGE_STATUSES },
  },
  { _id: false }
);

const chatConversationSchema = new Schema(
  {
    // Better Auth user id — not a Mongoose ref, same convention as
    // Course.createdBy / StudyPlan.userId.
    userId: { type: String, required: true, index: true },
    // Derived from the first user message once sent (see chat.controller.ts);
    // starts as a placeholder for a freshly-created, still-empty conversation.
    title: { type: String, required: true, trim: true, default: "New conversation" },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true }
);

chatConversationSchema.index({ userId: 1, updatedAt: -1 });

export type ChatConversationAttrs = InferSchemaType<typeof chatConversationSchema>;

const ChatConversation = model<ChatConversationAttrs>("ChatConversation", chatConversationSchema);

export default ChatConversation;
