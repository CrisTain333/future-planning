import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { endpoint, keys, deviceName } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Upsert by endpoint
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          userId: currentUser.userId,
          endpoint,
          keys,
          deviceName: deviceName || "",
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: subscription }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save push subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: "Endpoint is required" },
        { status: 400 }
      );
    }

    await PushSubscription.deleteOne({
      userId: currentUser.userId,
      endpoint,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to remove push subscription" },
      { status: 500 }
    );
  }
}
