import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import { createPaymentSchema } from "@/validations/payment";
import { createPaymentNotification } from "@/lib/notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = { isDeleted: false };

    if (userId) query.userId = userId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    // Search by receipt number directly
    if (search) {
      query.receiptNo = { $regex: search, $options: "i" };
    }

    // First get payments matching the query
    let payments = await Payment.find(query)
      .populate("userId", "fullName username")
      .populate("approvedBy", "fullName")
      .sort({ createdAt: -1 });

    // If searching and no receipt match, try searching by member name
    if (search && payments.length === 0) {
      delete query.receiptNo;
      const User = (await import("@/models/User")).default;
      const matchingUsers = await User.find({
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);
      if (userIds.length > 0) {
        query.userId = { $in: userIds };
      }
      payments = await Payment.find(query)
        .populate("userId", "fullName username")
        .populate("approvedBy", "fullName")
        .sort({ createdAt: -1 });
    }

    // Apply pagination manually after search
    const total = payments.length;
    const paginatedPayments = payments.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginatedPayments,
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Check duplicate payment
    const duplicate = await Payment.findOne({
      userId: parsed.data.userId,
      month: parsed.data.month,
      year: parsed.data.year,
      isDeleted: false,
    });
    if (duplicate) {
      return NextResponse.json({ success: false, error: "Payment already recorded for this member and month" }, { status: 409 });
    }

    // Generate receipt number: FP-{year}-{sequential 4-digit}
    const lastPayment = await Payment.findOne({ year: parsed.data.year })
      .sort({ receiptNo: -1 })
      .select("receiptNo");

    let seq = 1;
    if (lastPayment?.receiptNo) {
      const parts = lastPayment.receiptNo.split("-");
      seq = parseInt(parts[2]) + 1;
    }
    const receiptNo = `FP-${parsed.data.year}-${String(seq).padStart(4, "0")}`;

    const payment = await Payment.create({
      ...parsed.data,
      receiptNo,
      approvedBy: currentUser.userId,
      status: "approved",
    });

    const populated = await Payment.findById(payment._id)
      .populate("userId", "fullName username")
      .populate("approvedBy", "fullName");

    const memberName = typeof populated?.userId === "object" ? (populated.userId as { fullName: string }).fullName : "Unknown";
    const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    await createAuditLog("payment_created", currentUser.userId, {
      action_description: `Recorded payment of BDT ${parsed.data.amount.toLocaleString()} for ${memberName} (${MONTH_NAMES[parsed.data.month - 1]} ${parsed.data.year})`,
      member_name: memberName,
      month: `${MONTH_NAMES[parsed.data.month - 1]} ${parsed.data.year}`,
      amount: parsed.data.amount,
      penalty: parsed.data.penalty || 0,
      receipt_no: payment.receiptNo,
    }, parsed.data.userId);

    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    await createPaymentNotification(
      parsed.data.userId,
      payment._id.toString(),
      `${MONTHS[parsed.data.month - 1]} ${parsed.data.year}`,
      parsed.data.amount
    );

    return NextResponse.json({ success: true, data: populated, message: "Payment recorded successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to record payment" }, { status: 500 });
  }
}
