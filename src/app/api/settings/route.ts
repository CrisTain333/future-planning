import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Settings from "@/models/Settings";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({});
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    const before = await Settings.findOne({});
    const settings = await Settings.findOneAndUpdate({}, { $set: body }, { new: true, upsert: true, runValidators: false });

    await createAuditLog("settings_updated", currentUser.userId, {
      action_description: "Updated application settings",
      changes: Object.entries(body).filter(([key]) => (before as Record<string, unknown>)?.[key] !== body[key]).map(([key, val]) => ({
        field: key,
        from: (before as Record<string, unknown>)?.[key],
        to: val,
      })),
    });

    return NextResponse.json({ success: true, data: settings, message: "Settings updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
