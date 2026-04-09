import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { actionItemUpdateSchema } from "@/validations/meeting";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = actionItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Find meeting containing this action item by subdoc ID
    const meeting = await Meeting.findOne({ "minutes.actionItems._id": id });
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Action item not found" }, { status: 404 });
    }

    const actionItem = meeting.minutes.actionItems.id(id);
    if (!actionItem) {
      return NextResponse.json({ success: false, error: "Action item not found" }, { status: 404 });
    }

    // Members can only update their own action items
    if (currentUser.role !== "admin" && actionItem.assignee.toString() !== currentUser.userId) {
      return NextResponse.json(
        { success: false, error: "You can only update action items assigned to you" },
        { status: 403 }
      );
    }

    actionItem.status = parsed.data.status;
    await meeting.save();

    await createAuditLog("action_item_updated", currentUser.userId, {
      action_description: `Updated action item "${actionItem.title}" to ${parsed.data.status}`,
      meeting_title: meeting.title,
      action_item_title: actionItem.title,
      new_status: parsed.data.status,
    });

    return NextResponse.json({
      success: true,
      data: actionItem,
      message: "Action item updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update action item" }, { status: 500 });
  }
}
