import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import mongoose from "mongoose";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id, msgId } = await params;

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

    const message = await Message.findById(msgId);
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Only sender or admin can delete
    const isSender = message.senderId.toString() === currentUser.userId;
    const isAdmin = currentUser.role === "admin";
    if (!isSender && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own messages" },
        { status: 403 }
      );
    }

    await Message.findByIdAndUpdate(msgId, {
      $set: { isDeleted: true, deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
