import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { attendanceSchema } from "@/validations/meeting";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    for (const record of parsed.data.attendance) {
      const existing = meeting.attendance.find(
        (a: { user: { toString(): string } }) => a.user.toString() === record.userId
      );
      if (existing) {
        existing.status = record.status;
        existing.markedBy = "admin";
        existing.markedByAdmin = currentUser.userId;
      } else {
        meeting.attendance.push({
          user: record.userId,
          status: record.status,
          checkInTime: null,
          markedBy: "admin",
          markedByAdmin: currentUser.userId,
        });
      }
    }

    await meeting.save();

    await createAuditLog("attendance_marked", currentUser.userId, {
      action_description: `Marked attendance for meeting: "${meeting.title}"`,
      meeting_title: meeting.title,
      records_updated: parsed.data.attendance.length,
    });

    return NextResponse.json({
      success: true,
      data: meeting.attendance,
      message: "Attendance updated successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update attendance" }, { status: 500 });
  }
}
