import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IAuditLogDocument extends Document {
  action:
    | "payment_created"
    | "payment_edited"
    | "payment_deleted"
    | "user_created"
    | "user_edited"
    | "user_disabled"
    | "user_enabled"
    | "user_password_reset"
    | "notice_created"
    | "notice_edited"
    | "notice_deleted"
    | "settings_updated"
    | "profile_updated"
    | "profile_picture_updated"
    | "password_changed"
    | "user_login"
    | "user_login_failed";
  performedBy?: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      enum: [
        "payment_created",
        "payment_edited",
        "payment_deleted",
        "user_created",
        "user_edited",
        "user_disabled",
        "user_enabled",
        "user_password_reset",
        "notice_created",
        "notice_edited",
        "notice_deleted",
        "settings_updated",
        "profile_updated",
        "profile_picture_updated",
        "password_changed",
        "user_login",
        "user_login_failed",
      ],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ targetUser: 1 });
AuditLogSchema.index({ createdAt: -1 });

// Delete cached model to pick up schema changes in dev
if (mongoose.models.AuditLog) {
  delete mongoose.models.AuditLog;
}
const AuditLog = mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
export default AuditLog;
