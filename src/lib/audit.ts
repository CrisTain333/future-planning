import AuditLog from "@/models/AuditLog";

type AuditAction =
  | "payment_created"
  | "payment_edited"
  | "payment_deleted"
  | "payment_archived"
  | "payment_unarchived"
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
  | "user_login_failed"
  | "google_connected"
  | "google_disconnected"
  | "meeting_created"
  | "meeting_updated"
  | "meeting_cancelled"
  | "attendance_marked"
  | "minutes_updated"
  | "action_item_updated";

export async function createAuditLog(
  action: AuditAction,
  performedBy: string,
  details: Record<string, unknown>,
  targetUser?: string
) {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetUser: targetUser || undefined,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Audit log creation failed:", error);
  }
}
