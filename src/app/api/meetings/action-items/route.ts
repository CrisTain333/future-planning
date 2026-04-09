import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Find meetings with non-empty action items
    const meetings = await Meeting.find({
      "minutes.actionItems.0": { $exists: true },
    })
      .populate("minutes.actionItems.assignee", "fullName email")
      .select("title date minutes.actionItems");

    interface PopulatedAssignee {
      _id: { toString(): string };
      fullName: string;
      email: string;
    }

    interface ActionItemSubdoc {
      _id: { toString(): string };
      title: string;
      assignee: PopulatedAssignee | unknown;
      dueDate: Date;
      status: "pending" | "done";
    }

    interface MeetingDoc {
      _id: { toString(): string };
      title: string;
      date: Date;
      minutes: {
        actionItems: ActionItemSubdoc[];
      };
    }

    // Flatten action items with meeting context
    const allItems: {
      _id: string;
      title: string;
      assignee: PopulatedAssignee | unknown;
      dueDate: Date;
      status: string;
      meetingId: string;
      meetingTitle: string;
      meetingDate: Date;
    }[] = [];

    for (const meeting of meetings as unknown as MeetingDoc[]) {
      for (const item of meeting.minutes.actionItems) {
        // Members: only include items assigned to them
        if (currentUser.role !== "admin") {
          const assigneeId = typeof item.assignee === "object" && item.assignee !== null
            ? (item.assignee as PopulatedAssignee)._id.toString()
            : String(item.assignee);
          if (assigneeId !== currentUser.userId) continue;
        }

        // Apply status filter if provided
        if (statusFilter && item.status !== statusFilter) continue;

        allItems.push({
          _id: item._id.toString(),
          title: item.title,
          assignee: item.assignee,
          dueDate: item.dueDate,
          status: item.status,
          meetingId: meeting._id.toString(),
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
        });
      }
    }

    // Sort by due date ascending
    allItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({ success: true, data: allItems });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch action items" }, { status: 500 });
  }
}
