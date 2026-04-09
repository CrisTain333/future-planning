import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getAuthUrl, removeTokens } from "@/lib/google/calendar";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authUrl = getAuthUrl(currentUser.userId);

    return NextResponse.json({ success: true, data: { authUrl } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to generate auth URL" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    await removeTokens(currentUser.userId);

    await createAuditLog("google_disconnected", currentUser.userId, {
      action_description: "Disconnected Google Calendar integration",
    });

    return NextResponse.json({ success: true, message: "Google account disconnected successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to disconnect Google account" }, { status: 500 });
  }
}
