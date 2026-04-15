import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";

// Register this user's PeerJS ID on the call, and return all participants' peer IDs
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const { peerId } = await req.json();

    if (!peerId) {
      return NextResponse.json({ success: false, error: "peerId required" }, { status: 400 });
    }

    // Update this user's peerId in the call
    await CallLog.updateOne(
      { _id: id, "participants.userId": currentUser.userId },
      { $set: { "participants.$.peerId": peerId } }
    );

    // Return all participants with their peer IDs
    const callLog = await CallLog.findById(id)
      .populate("participants.userId", "fullName profilePicture");

    return NextResponse.json({ success: true, data: callLog });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to register peer" }, { status: 500 });
  }
}

// Get current peer IDs for all participants
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const callLog = await CallLog.findById(id)
      .populate("participants.userId", "fullName profilePicture");

    if (!callLog) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: callLog });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to get peers" }, { status: 500 });
  }
}
