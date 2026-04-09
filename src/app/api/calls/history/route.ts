import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import CallLog from "@/models/CallLog";

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

    // Get user's conversation IDs
    const conversations = await Conversation.find(
      { participants: currentUser.userId },
      { _id: 1 }
    );
    const conversationIds = conversations.map((c) => c._id);

    const query = {
      conversationId: { $in: conversationIds },
      status: { $in: ["ended", "missed"] },
    };

    const total = await CallLog.countDocuments(query);
    const calls = await CallLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("initiatedBy", "fullName profilePicture username")
      .populate("participants.userId", "fullName profilePicture username")
      .populate("conversationId", "name type");

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch call history" },
      { status: 500 }
    );
  }
}
