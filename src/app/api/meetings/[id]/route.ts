import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import { updateMeetingSchema } from "@/validations/meeting";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google/calendar";
import { createMeetingNotification } from "@/lib/meeting-notifications";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { MeetingCancelledEmail } from "@/lib/email/templates/meeting-cancelled";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const meeting = await Meeting.findById(id)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName")
      .populate("attendance.user", "fullName email")
      .populate("minutes.actionItems.assignee", "fullName");

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Members can only view meetings they are invited to
    if (currentUser.role !== "admin") {
      const isInvited = meeting.invitees.some(
        (invitee: { _id: { toString(): string } }) => invitee._id.toString() === currentUser.userId
      );
      if (!isInvited) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const before = await Meeting.findById(id);
    if (!before) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Handle invitee changes - add new attendance records
    if (parsed.data.invitees) {
      const existingInviteeIds = before.invitees.map((inv: { toString(): string }) => inv.toString());
      const newInviteeIds = parsed.data.invitees.filter(
        (invId: string) => !existingInviteeIds.includes(invId)
      );

      if (newInviteeIds.length > 0) {
        const newAttendance = newInviteeIds.map((userId: string) => ({
          user: userId,
          status: "not_marked",
          checkInTime: null,
          markedBy: "admin",
          markedByAdmin: null,
        }));
        updateData.attendance = [...before.attendance, ...newAttendance];
      }
    }

    // Update Google Calendar event if connected
    if (before.googleEventId) {
      const calendarUpdates: Record<string, unknown> = {};
      if (parsed.data.title) calendarUpdates.summary = parsed.data.title;
      if (parsed.data.description !== undefined) calendarUpdates.description = parsed.data.description;
      if (parsed.data.date) {
        calendarUpdates.startDateTime = new Date(parsed.data.date).toISOString();
        const duration = parsed.data.duration || before.duration;
        calendarUpdates.endDateTime = new Date(new Date(parsed.data.date).getTime() + duration * 60000).toISOString();
      }
      if (parsed.data.invitees) {
        const inviteeUsers = await User.find({ _id: { $in: parsed.data.invitees } }).select("email");
        calendarUpdates.attendees = inviteeUsers.filter((u) => u.email).map((u) => ({ email: u.email }));
      }

      if (Object.keys(calendarUpdates).length > 0) {
        await updateCalendarEvent(
          currentUser.userId,
          before.googleEventId,
          calendarUpdates as {
            summary?: string;
            description?: string;
            startDateTime?: string;
            endDateTime?: string;
            attendees?: { email: string }[];
          }
        );
      }
    }

    if (parsed.data.date) {
      updateData.date = new Date(parsed.data.date);
    }

    const meeting = await Meeting.findByIdAndUpdate(id, updateData, { new: true })
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName");

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Create notifications for invitees
    const inviteeIds = meeting.invitees.map(
      (inv: { _id: { toString(): string } }) => inv._id.toString()
    );
    await createMeetingNotification(
      "meeting_updated",
      inviteeIds,
      meeting._id.toString(),
      `Meeting Updated: ${meeting.title}`,
      `The meeting "${meeting.title}" has been updated.`
    );

    await createAuditLog("meeting_updated", currentUser.userId, {
      action_description: `Updated meeting: "${before.title}"`,
      meeting_title: before.title,
      changes: Object.entries(parsed.data)
        .filter(([, v]) => v !== undefined)
        .map(([key, val]) => ({
          field: key,
          from: (before as unknown as Record<string, unknown>)[key],
          to: val,
        })),
    });

    return NextResponse.json({ success: true, data: meeting, message: "Meeting updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    let reason = "";
    try {
      const body = await req.json();
      reason = body.reason || "";
    } catch {
      // No body provided
    }

    const meeting = await Meeting.findById(id).populate("invitees", "fullName email");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Mark as cancelled
    meeting.status = "cancelled";
    meeting.cancelledReason = reason;
    await meeting.save();

    // Delete Google Calendar event if connected
    if (meeting.googleEventId) {
      await deleteCalendarEvent(currentUser.userId, meeting.googleEventId);
    }

    // Get admin name for emails
    const adminUser = await User.findById(currentUser.userId).select("fullName");
    const cancelledBy = adminUser?.fullName || "Admin";

    const meetingDate = new Date(meeting.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const meetingTime = new Date(meeting.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send cancellation emails to all invitees (fire-and-forget)
    for (const invitee of meeting.invitees) {
      const inv = invitee as unknown as { _id: { toString(): string }; fullName: string; email: string };
      if (inv.email) {
        sendEmail({
          to: inv.email,
          toUserId: inv._id.toString(),
          subject: `Meeting Cancelled: ${meeting.title}`,
          type: "meeting_cancelled",
          react: MeetingCancelledEmail({
            memberName: inv.fullName,
            meetingTitle: meeting.title,
            meetingDate,
            meetingTime,
            reason: reason || "No reason provided",
            cancelledBy,
          }),
          metadata: { meetingId: meeting._id.toString() },
        }).catch(() => {}); // Fire-and-forget
      }
    }

    // Create notifications for invitees
    const inviteeIds = meeting.invitees.map(
      (inv: { _id: { toString(): string } }) => inv._id.toString()
    );
    await createMeetingNotification(
      "meeting_cancelled",
      inviteeIds,
      meeting._id.toString(),
      `Meeting Cancelled: ${meeting.title}`,
      `The meeting "${meeting.title}" scheduled for ${meetingDate} has been cancelled.${reason ? ` Reason: ${reason}` : ""}`
    );

    await createAuditLog("meeting_cancelled", currentUser.userId, {
      action_description: `Cancelled meeting: "${meeting.title}"`,
      meeting_title: meeting.title,
      meeting_date: meeting.date,
      reason: reason || "No reason provided",
      invitee_count: meeting.invitees.length,
    });

    return NextResponse.json({ success: true, data: null, message: "Meeting cancelled successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to cancel meeting" }, { status: 500 });
  }
}
