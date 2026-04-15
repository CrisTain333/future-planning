import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Presence from "@/models/Presence";
import CallLog from "@/models/CallLog";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const sinceDate = sinceParam
      ? new Date(sinceParam)
      : new Date(Date.now() - 10 * 1000);

    // Get user's conversation IDs
    const conversations = await Conversation.find(
      { participants: currentUser.userId },
      { _id: 1 }
    );
    const conversationIds = conversations.map((c) => c._id);

    // New messages since timestamp
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      createdAt: { $gt: sinceDate },
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("senderId", "fullName profilePicture")
      .populate("replyTo", "content senderId");

    // Presence for all participants
    const allParticipantIds = new Set<string>();
    const fullConversations = await Conversation.find({ _id: { $in: conversationIds } });
    fullConversations.forEach((c) => {
      c.participants.forEach((p: mongoose.Types.ObjectId) => allParticipantIds.add(p.toString()));
    });

    const presence = await Presence.find({
      userId: { $in: Array.from(allParticipantIds) },
    });

    // Typing: isTyping.since within last 3 seconds, exclude current user
    const typingThreshold = new Date(Date.now() - 3 * 1000);
    const typing = await Presence.find({
      userId: { $ne: currentUser.userId },
      "isTyping.conversationId": { $in: conversationIds },
      "isTyping.since": { $gt: typingThreshold },
    });

    // Active/ringing calls in user's conversations
    const calls = await CallLog.find({
      conversationId: { $in: conversationIds },
      status: { $in: ["ringing", "active"] },
    })
      .populate("initiatedBy", "fullName profilePicture")
      .populate("participants.userId", "fullName profilePicture");

    return NextResponse.json({
      success: true,
      data: {
        messages,
        presence,
        typing,
        calls,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to sync" }, { status: 500 });
  }
}
