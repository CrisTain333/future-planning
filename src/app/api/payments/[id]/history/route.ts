import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import AuditLog from "@/models/AuditLog";
import Payment from "@/models/Payment";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Get the payment to find its userId for target-based lookup
    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    // Find audit logs related to this payment
    // Match by: details containing the payment ID, receipt number, or matching amount+month+year
    const logs = await AuditLog.find({
      action: { $in: ["payment_created", "payment_edited", "payment_deleted"] },
      $or: [
        { "details.receipt_no": payment.receiptNo },
        { "details.paymentId": id },
        {
          targetUser: payment.userId,
          "details.month": `${["January","February","March","April","May","June","July","August","September","October","November","December"][payment.month - 1]} ${payment.year}`,
        },
        {
          targetUser: payment.userId,
          action: "payment_created",
          "details.amount": payment.amount,
        },
      ],
    })
      .populate("performedBy", "fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Payment history error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payment history" }, { status: 500 });
  }
}
