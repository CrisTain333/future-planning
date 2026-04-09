import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { sendEmail } from "@/lib/email/send";
import { MeetingReminderEmail } from "@/lib/email/templates/meeting-reminder";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id).populate("invitees", "fullName email");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "cancelled") {
      return NextResponse.json({ success: false, error: "Cannot send reminders for a cancelled meeting" }, { status: 400 });
    }

    const meetingDate = new Date(meeting.date);
    const dateStr = meetingDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = meetingDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const hours = Math.floor(meeting.duration / 60);
    const minutes = meeting.duration % 60;
    const durationStr = hours > 0
      ? minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
      : `${minutes}m`;

    for (const invitee of meeting.invitees) {
      const inv = invitee as unknown as { _id: { toString(): string }; fullName: string; email: string };
      sendEmail({
        to: inv.email,
        toUserId: inv._id.toString(),
        subject: `Reminder: ${meeting.title}`,
        type: "meeting_reminder",
        react: MeetingReminderEmail({
          memberName: inv.fullName,
          meetingTitle: meeting.title,
          meetingDate: dateStr,
          meetingTime: timeStr,
          duration: durationStr,
          agenda: meeting.agenda,
          meetLink: meeting.meetLink,
        }),
        metadata: { meetingId: id },
      }).catch(() => {});
    }

    meeting.reminderSent.push({
      sentAt: new Date(),
      sentBy: currentUser.userId,
    });
    await meeting.save();

    return NextResponse.json({
      success: true,
      message: "Reminders sent successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send reminders" }, { status: 500 });
  }
}
