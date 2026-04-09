import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import CallLog from "@/models/CallLog";
import User from "@/models/User";
import { initiateCallSchema } from "@/validations/chat";
import { notifyIncomingCall } from "@/lib/chat-notifications";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const parsed = initiateCallSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { conversationId, type } = parsed.data;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .includes(currentUser.userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Check no active call already in this conversation
    const existingCall = await CallLog.findOne({
      conversationId,
      status: { $in: ["ringing", "active"] },
    });
    if (existingCall) {
      return NextResponse.json(
        { success: false, error: "A call is already in progress in this conversation" },
        { status: 409 }
      );
    }

    const now = new Date();
    const participants = conversation.participants.map((p: mongoose.Types.ObjectId) => ({
      userId: p,
      joinedAt: p.toString() === currentUser.userId ? now : null,
      leftAt: null,
    }));

    const callLog = await CallLog.create({
      conversationId,
      initiatedBy: currentUser.userId,
      participants,
      type,
      status: "ringing",
    });

    // Notify other participants
    const callerUser = await User.findById(currentUser.userId, "fullName");
    const otherParticipantIds = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .filter((pid: string) => pid !== currentUser.userId);

    if (otherParticipantIds.length > 0 && callerUser) {
      await notifyIncomingCall(
        currentUser.userId,
        callerUser.fullName,
        otherParticipantIds,
        conversationId,
        callLog._id.toString(),
        type
      );
    }

    return NextResponse.json({ success: true, data: callLog }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
