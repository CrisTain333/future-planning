import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { createConversationSchema } from "@/validations/chat";
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = {
      participants: currentUser.userId,
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("participants", "fullName profilePicture username")
      .populate("createdBy", "fullName profilePicture username");

    // Compute unread counts
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: currentUser.userId },
          "readBy.userId": { $ne: currentUser.userId },
          isDeleted: false,
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithUnread,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, name, participants } = parsed.data;

    // Ensure creator is always in participants
    const allParticipants = Array.from(
      new Set([currentUser.userId, ...participants])
    );

    // For DMs: check if a direct conversation already exists between the same 2 users
    if (type === "direct" && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        type: "direct",
        participants: {
          $all: allParticipants.map((id) => new mongoose.Types.ObjectId(id)),
          $size: 2,
        },
      })
        .populate("participants", "fullName profilePicture username")
        .populate("createdBy", "fullName profilePicture username");

      if (existing) {
        return NextResponse.json({ success: true, data: existing });
      }
    }

    const conversation = await Conversation.create({
      type,
      name: name || "",
      participants: allParticipants,
      createdBy: currentUser.userId,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "fullName profilePicture username")
      .populate("createdBy", "fullName profilePicture username");

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
