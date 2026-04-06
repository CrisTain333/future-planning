import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const payment = await Payment.findByIdAndUpdate(
      id,
      {
        status: "approved",
        $unset: { archivedBy: 1, archivedAt: 1 },
      },
      { new: true }
    )
      .populate("userId", "fullName username")
      .populate("approvedBy", "fullName");

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    const memberName = typeof payment.userId === "object" ? (payment.userId as { fullName: string }).fullName : "Unknown";
    const memberId = typeof payment.userId === "object" ? (payment.userId as { _id: { toString(): string } })._id.toString() : String(payment.userId);

    await createAuditLog("payment_unarchived", currentUser.userId, {
      action_description: `Unarchived payment for ${memberName}`,
      member_name: memberName,
      receipt_no: payment.receiptNo,
    }, memberId);

    return NextResponse.json({ success: true, data: payment, message: "Payment unarchived successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to unarchive payment" }, { status: 500 });
  }
}
