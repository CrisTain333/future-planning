import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import { sendMessageSchema } from "@/validations/chat";
import { notifyNewMessage } from "@/lib/chat-notifications";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .includes(currentUser.userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: Record<string, unknown> = { conversationId: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "fullName profilePicture username")
      .populate("replyTo", "content senderId");

    // Reverse to chronological order
    messages.reverse();

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const isParticipant = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .includes(currentUser.userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, type, replyTo } = parsed.data;

    const message = await Message.create({
      conversationId: id,
      senderId: currentUser.userId,
      content,
      type: type || "text",
      replyTo: replyTo ? new mongoose.Types.ObjectId(replyTo) : null,
      readBy: [{ userId: currentUser.userId, readAt: new Date() }],
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(id, {
      $set: {
        lastMessage: {
          content,
          senderId: currentUser.userId,
          createdAt: message.createdAt,
        },
      },
    });

    const populated = await Message.findById(message._id)
      .populate("senderId", "fullName profilePicture username")
      .populate("replyTo", "content senderId");

    // Notify other participants
    const senderUser = await User.findById(currentUser.userId, "fullName");
    const otherParticipantIds = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .filter((pid: string) => pid !== currentUser.userId);

    if (otherParticipantIds.length > 0 && senderUser) {
      await notifyNewMessage(
        currentUser.userId,
        senderUser.fullName,
        otherParticipantIds,
        id,
        content
      );
    }

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 }
    );
  }
}
