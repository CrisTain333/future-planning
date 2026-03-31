import AuditLog from "@/models/AuditLog";

type AuditAction =
  | "payment_created" | "payment_edited" | "payment_deleted"
  | "user_created" | "user_edited" | "user_disabled" | "user_enabled"
  | "notice_created" | "notice_edited" | "notice_deleted"
  | "settings_updated";

export async function createAuditLog(
  action: AuditAction,
  performedBy: string,
  details: Record<string, unknown>,
  targetUser?: string
) {
  await AuditLog.create({
    action,
    performedBy,
    targetUser: targetUser || undefined,
    details,
  });
}
