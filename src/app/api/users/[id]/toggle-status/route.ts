import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function PATCH(
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
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Prevent disabling the last admin
    if (!user.isDisabled && user.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
        isDisabled: false,
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot disable the last admin" },
          { status: 400 }
        );
      }
    }

    user.isDisabled = !user.isDisabled;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({
      success: true,
      data: userObj,
      message: user.isDisabled ? "User disabled" : "User enabled",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
