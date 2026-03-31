import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLogDocument extends Document {
  action:
    | "payment_created"
    | "payment_edited"
    | "payment_deleted"
    | "user_created"
    | "user_edited"
    | "user_disabled"
    | "user_enabled"
    | "notice_created"
    | "notice_edited"
    | "notice_deleted"
    | "settings_updated";
  performedBy: mongoose.Types.ObjectId;
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
        "notice_created",
        "notice_edited",
        "notice_deleted",
        "settings_updated",
      ],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ targetUser: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
export default AuditLog;
