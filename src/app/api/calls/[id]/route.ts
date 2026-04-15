import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import { updateCallSchema } from "@/validations/chat";
import mongoose from "mongoose";

export async function PATCH(
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

    const callLog = await CallLog.findById(id);
    if (!callLog) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    // Verify participant
    const isParticipant = callLog.participants
      .map((p: { userId: mongoose.Types.ObjectId; joinedAt: Date | null; leftAt: Date | null }) => p.userId.toString())
      .includes(currentUser.userId);
    if (!isParticipant) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateCallSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const now = new Date();
    const update: Record<string, unknown> = { status };

    if (status === "active") {
      update.startedAt = now;
      // Mark current user as joined
      await CallLog.updateOne(
        { _id: id, "participants.userId": new mongoose.Types.ObjectId(currentUser.userId) },
        { $set: { "participants.$.joinedAt": now } }
      );
    } else if (status === "ended") {
      update.endedAt = now;
      // Calculate duration from startedAt
      if (callLog.startedAt) {
        update.duration = Math.floor((now.getTime() - callLog.startedAt.getTime()) / 1000);
      }
      // Mark current user as left
      await CallLog.updateOne(
        { _id: id, "participants.userId": new mongoose.Types.ObjectId(currentUser.userId) },
        { $set: { "participants.$.leftAt": now } }
      );
    } else if (status === "missed") {
      update.endedAt = now;
    }

    const updated = await CallLog.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update call" },
      { status: 500 }
    );
  }
}
