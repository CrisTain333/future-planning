import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: "payment_recorded" | "notice_posted" | "meeting_created" | "meeting_updated" | "meeting_cancelled" | "action_item_assigned";
  title: string;
  message: string;
  referenceId: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["payment_recorded", "notice_posted", "meeting_created", "meeting_updated", "meeting_cancelled", "action_item_assigned"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
export default Notification;
