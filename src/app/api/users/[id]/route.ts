import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { updateUserSchema } from "@/validations/user";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { PasswordChangedEmail } from "@/lib/email/templates/password-changed";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const before = await User.findById(id).select("-password");

    const updateData: Record<string, unknown> = { ...parsed.data };

    // If password is provided, hash it
    if (body.password && body.password.length >= 4) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Check unique username if changed
    if (parsed.data.username) {
      const existing = await User.findOne({
        username: parsed.data.username.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Username already exists" },
          { status: 409 }
        );
      }
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    await createAuditLog("user_edited", currentUser.userId, {
      action_description: `Edited user ${before?.fullName || id}`,
      changes: Object.entries(parsed.data).map(([key, val]) => ({
        field: key,
        from: (before as Record<string, unknown>)?.[key] ?? "N/A",
        to: val,
      })),
    }, id);

    if (body.password) {
      await createAuditLog("user_password_reset", currentUser.userId, {
        action_description: `Reset password for ${before?.fullName || id}`,
      }, id);
      // Send password changed email (non-blocking)
      if (user?.email) {
        sendEmail({
          to: user.email,
          toUserId: id,
          subject: "Your Password Has Been Changed",
          type: "password_changed",
          react: PasswordChangedEmail({
            memberName: user.fullName,
            newPassword: body.password,
          }),
        }).catch(() => {}); // Fire-and-forget
      }
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: "User updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}
