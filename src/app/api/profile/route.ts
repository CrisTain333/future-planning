import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { updateProfileSchema } from "@/validations/user";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(currentUser.userId).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (parsed.data.username) {
      const existing = await User.findOne({
        username: parsed.data.username.toLowerCase(),
        _id: { $ne: currentUser.userId },
      });
      if (existing) {
        return NextResponse.json({ success: false, error: "Username already exists" }, { status: 409 });
      }
    }

    const user = await User.findByIdAndUpdate(currentUser.userId, parsed.data, { new: true }).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await createAuditLog("profile_updated", currentUser.userId, {
      action_description: `Updated own profile`,
      changes: Object.entries(parsed.data).filter(([, v]) => v !== undefined).map(([key, val]) => ({
        field: key,
        to: val,
      })),
    }, currentUser.userId);

    return NextResponse.json({ success: true, data: user, message: "Profile updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update profile" }, { status: 500 });
  }
}
