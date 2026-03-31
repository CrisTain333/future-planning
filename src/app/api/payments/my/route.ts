import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const query = {
      userId: currentUser.userId,
      isDeleted: false,
      status: "approved" as const,
    };

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate("approvedBy", "fullName")
      .sort({ year: -1, month: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}
