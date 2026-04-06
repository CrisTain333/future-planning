import mongoose, { Schema, Document } from "mongoose";

export interface IEmailLogDocument extends Document {
  to: string;
  toUserId?: mongoose.Types.ObjectId;
  type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed";
  subject: string;
  status: "sent" | "failed";
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLogDocument>(
  {
    to: { type: String, required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["payment_reminder", "payment_receipt", "notice", "password_changed"],
      required: true,
    },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

EmailLogSchema.index({ type: 1 });
EmailLogSchema.index({ status: 1 });
EmailLogSchema.index({ createdAt: -1 });

const EmailLog =
  mongoose.models.EmailLog ||
  mongoose.model<IEmailLogDocument>("EmailLog", EmailLogSchema);
export default EmailLog;
