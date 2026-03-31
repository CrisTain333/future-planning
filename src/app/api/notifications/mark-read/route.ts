import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ success: false, error: "notificationIds required" }, { status: 400 });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, userId: currentUser.userId },
      { isRead: true }
    );

    return NextResponse.json({ success: true, data: null, message: "Notifications marked as read" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to mark as read" }, { status: 500 });
  }
}
