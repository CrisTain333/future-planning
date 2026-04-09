import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { minutesSchema } from "@/validations/meeting";
import { createAuditLog } from "@/lib/audit";
import { createMeetingNotification } from "@/lib/meeting-notifications";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .populate("minutes.actionItems.assignee", "fullName email")
      .select("minutes title");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: meeting.minutes });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch minutes" }, { status: 500 });
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
    const parsed = minutesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Block editing if already finalized (unless this is a finalize request)
    if (meeting.minutes.status === "finalized" && !parsed.data.finalize) {
      return NextResponse.json(
        { success: false, error: "Minutes have already been finalized and cannot be edited" },
        { status: 400 }
      );
    }

    // Update mode-specific fields
    meeting.minutes.mode = parsed.data.mode;

    if (parsed.data.mode === "freeform") {
      meeting.minutes.freeformContent = parsed.data.freeformContent || "";
    }

    if (parsed.data.agendaItems !== undefined) {
      meeting.minutes.agendaItems = parsed.data.agendaItems;
    }

    if (parsed.data.decisions !== undefined) {
      meeting.minutes.decisions = parsed.data.decisions;
    }

    if (parsed.data.actionItems !== undefined) {
      meeting.minutes.actionItems = parsed.data.actionItems.map((item) => ({
        ...(item._id ? { _id: item._id } : {}),
        title: item.title,
        assignee: item.assignee,
        dueDate: new Date(item.dueDate),
        status: item.status,
      }));

      // Notify assignees of action items
      const assigneeIds = parsed.data.actionItems.map((item) => item.assignee);
      const uniqueAssigneeIds = [...new Set(assigneeIds)];
      if (uniqueAssigneeIds.length > 0) {
        await createMeetingNotification(
          "action_item_assigned",
          uniqueAssigneeIds,
          id,
          "Action Item Assigned",
          `You have been assigned action items from meeting: "${meeting.title}"`
        );
      }
    }

    if (parsed.data.finalize) {
      meeting.minutes.status = "finalized";
      meeting.minutes.finalizedAt = new Date();
    }

    await meeting.save();

    await createAuditLog("minutes_updated", currentUser.userId, {
      action_description: parsed.data.finalize
        ? `Finalized minutes for meeting: "${meeting.title}"`
        : `Updated minutes for meeting: "${meeting.title}"`,
      meeting_title: meeting.title,
      finalized: !!parsed.data.finalize,
    });

    const updated = await Meeting.findById(id)
      .populate("minutes.actionItems.assignee", "fullName email")
      .select("minutes");

    return NextResponse.json({
      success: true,
      data: updated?.minutes,
      message: parsed.data.finalize ? "Minutes finalized successfully" : "Minutes updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update minutes" }, { status: 500 });
  }
}
