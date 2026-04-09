import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Check if user is invited
    const isInvited = meeting.invitees.some(
      (invitee: { toString(): string }) => invitee.toString() === currentUser.userId
    );
    if (!isInvited) {
      return NextResponse.json({ success: false, error: "You are not invited to this meeting" }, { status: 403 });
    }

    // Check if within check-in window: 15 min before to 30 min after meeting.date
    const now = new Date();
    const meetingDate = new Date(meeting.date);
    const windowStart = new Date(meetingDate.getTime() - 15 * 60 * 1000);
    const windowEnd = new Date(meetingDate.getTime() + 30 * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      return NextResponse.json(
        {
          success: false,
          error: "Check-in is only available from 15 minutes before to 30 minutes after the meeting start time",
        },
        { status: 400 }
      );
    }

    // Update or create attendance record
    const existingIndex = meeting.attendance.findIndex(
      (a: { user: { toString(): string } }) => a.user.toString() === currentUser.userId
    );

    if (existingIndex >= 0) {
      meeting.attendance[existingIndex].status = "present";
      meeting.attendance[existingIndex].checkInTime = now;
      meeting.attendance[existingIndex].markedBy = "self";
    } else {
      meeting.attendance.push({
        user: currentUser.userId,
        status: "present",
        checkInTime: now,
        markedBy: "self",
        markedByAdmin: null,
      });
    }

    await meeting.save();

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to check in" }, { status: 500 });
  }
}
