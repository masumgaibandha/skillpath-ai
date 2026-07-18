import { Schema, model, type InferSchemaType } from "mongoose";

// Write-only from the user's side — backs the /contact form, no admin
// inbox UI is built for this MVP, just proof the form is real and persists.
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type ContactMessageAttrs = InferSchemaType<typeof contactMessageSchema>;

const ContactMessage = model<ContactMessageAttrs>("ContactMessage", contactMessageSchema);

export default ContactMessage;
