import { resend } from "./resend";
import dbConnect from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import Settings from "@/models/Settings";
import type { ReactElement } from "react";

interface SendEmailOptions {
  to: string;
  toUserId?: string;
  subject: string;
  type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed" | "meeting_invite" | "meeting_cancelled" | "meeting_reminder" | "meeting_minutes";
  react: ReactElement;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, toUserId, subject, type, react, metadata } = options;

  try {
    await dbConnect();

    const settings = await Settings.findOne();
    const foundationName = settings?.foundationName || "Future Planning";
    const from = `${foundationName} <onboarding@resend.dev>`;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      await EmailLog.create({
        to,
        toUserId,
        type,
        subject,
        status: "failed",
        error: error.message,
        metadata,
      });
      console.error(`Email failed [${type}] to ${to}:`, error.message);
      return { success: false, error: error.message };
    }

    await EmailLog.create({
      to,
      toUserId,
      type,
      subject,
      status: "sent",
      metadata,
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    try {
      await dbConnect();
      await EmailLog.create({
        to,
        toUserId,
        type,
        subject,
        status: "failed",
        error: errorMessage,
        metadata,
      });
    } catch {
      console.error("Failed to log email error:", errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}
