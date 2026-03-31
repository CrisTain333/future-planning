import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const count = await Notification.countDocuments({ userId: currentUser.userId, isRead: false });

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch count" }, { status: 500 });
  }
}
