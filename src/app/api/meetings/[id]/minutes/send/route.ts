import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { sendEmail } from "@/lib/email/send";
import { MeetingMinutesEmail } from "@/lib/email/templates/meeting-minutes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .populate("invitees", "fullName email")
      .populate("minutes.actionItems.assignee", "fullName");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.minutes.status !== "finalized") {
      return NextResponse.json(
        { success: false, error: "Minutes must be finalized before sending" },
        { status: 400 }
      );
    }

    const meetingDate = new Date(meeting.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build summary from mode
    const summary = meeting.minutes.mode === "freeform"
      ? meeting.minutes.freeformContent || ""
      : meeting.minutes.agendaItems
          .map((item: { title: string; discussion: string; decision: string }) =>
            `${item.title}: ${item.discussion}${item.decision ? ` (Decision: ${item.decision})` : ""}`
          )
          .join("\n");

    const actionItems = meeting.minutes.actionItems.map(
      (item: { title: string; assignee: { fullName: string } | unknown; dueDate: Date }) => ({
        title: item.title,
        assigneeName: typeof item.assignee === "object" && item.assignee !== null
          ? (item.assignee as { fullName: string }).fullName
          : "Unassigned",
        dueDate: new Date(item.dueDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      })
    );

    for (const invitee of meeting.invitees) {
      const inv = invitee as unknown as { _id: { toString(): string }; fullName: string; email: string };
      sendEmail({
        to: inv.email,
        toUserId: inv._id.toString(),
        subject: `Minutes: ${meeting.title}`,
        type: "meeting_minutes",
        react: MeetingMinutesEmail({
          memberName: inv.fullName,
          meetingTitle: meeting.title,
          meetingDate,
          decisions: meeting.minutes.decisions || [],
          actionItems,
          summary,
        }),
        metadata: { meetingId: id },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Minutes sent successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send minutes" }, { status: 500 });
  }
}
