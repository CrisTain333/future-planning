import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { updateConversationSchema } from "@/validations/chat";
import mongoose from "mongoose";

export async function PUT(
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

    // Verify the current user is a participant
    const isParticipant = conversation.participants
      .map((p: mongoose.Types.ObjectId) => p.toString())
      .includes(currentUser.userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Only group conversations can be updated
    if (conversation.type !== "group") {
      return NextResponse.json(
        { success: false, error: "Only group conversations can be updated" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, addParticipants, removeParticipants } = parsed.data;
    const update: Record<string, unknown> = {};

    if (name !== undefined) {
      update.name = name;
    }

    if (addParticipants && addParticipants.length > 0) {
      const newIds = addParticipants.map((pid) => new mongoose.Types.ObjectId(pid));
      await Conversation.findByIdAndUpdate(id, {
        $addToSet: { participants: { $each: newIds } },
      });
    }

    if (removeParticipants && removeParticipants.length > 0) {
      const removeIds = removeParticipants.map((pid) => new mongoose.Types.ObjectId(pid));
      await Conversation.findByIdAndUpdate(id, {
        $pull: { participants: { $in: removeIds } },
      });
    }

    if (Object.keys(update).length > 0) {
      await Conversation.findByIdAndUpdate(id, { $set: update });
    }

    const updated = await Conversation.findById(id)
      .populate("participants", "fullName profilePicture username")
      .populate("createdBy", "fullName profilePicture username");

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// Delete (leave) conversation
export async function DELETE(
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

    if (conversation.type === "direct") {
      // DM: delete conversation and all messages permanently
      await Message.deleteMany({ conversationId: id });
      await Conversation.findByIdAndDelete(id);
    } else {
      // Group: remove user from participants
      await Conversation.findByIdAndUpdate(id, {
        $pull: { participants: new mongoose.Types.ObjectId(currentUser.userId) },
      });

      // If no participants left, delete the conversation
      const updated = await Conversation.findById(id);
      if (updated && updated.participants.length === 0) {
        await Message.deleteMany({ conversationId: id });
        await Conversation.findByIdAndDelete(id);
      }
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
