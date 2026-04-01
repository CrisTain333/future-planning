import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { changePasswordSchema } from "@/validations/user";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await User.findById(currentUser.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 10);
    await user.save();

    await createAuditLog("password_changed", currentUser.userId, {
      action_description: "Changed own password",
    }, currentUser.userId);

    return NextResponse.json({ success: true, data: null, message: "Password changed successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
