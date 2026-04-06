import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmailLog from "@/models/EmailLog";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query)
      .populate("toUserId", "fullName username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
