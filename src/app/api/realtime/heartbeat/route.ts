import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Presence from "@/models/Presence";
import { heartbeatSchema } from "@/validations/chat";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const parsed = heartbeatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { typing } = parsed.data;
    const now = new Date();

    const typingValue =
      typing?.isTyping === true
        ? { conversationId: typing.conversationId, since: now }
        : null;

    // Upsert presence for current user
    await Presence.findOneAndUpdate(
      { userId: currentUser.userId },
      {
        $set: {
          status: "online",
          lastSeen: now,
          isTyping: typingValue,
        },
      },
      { upsert: true, new: true }
    );

    // Mark users offline if lastSeen > 60 seconds ago
    const offlineThreshold = new Date(Date.now() - 60 * 1000);
    await Presence.updateMany(
      {
        userId: { $ne: currentUser.userId },
        status: "online",
        lastSeen: { $lt: offlineThreshold },
      },
      { $set: { status: "offline", isTyping: null } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update heartbeat" }, { status: 500 });
  }
}
