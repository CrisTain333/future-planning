import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import { updatePaymentSchema } from "@/validations/payment";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const payment = await Payment.findById(id)
      .populate("userId", "fullName username")
      .populate("approvedBy", "fullName");

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const before = await Payment.findById(id);

    const payment = await Payment.findByIdAndUpdate(id, parsed.data, { new: true })
      .populate("userId", "fullName username")
      .populate("approvedBy", "fullName");

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    const memberName = typeof payment?.userId === "object" ? (payment.userId as { fullName: string }).fullName : "Unknown";
    await createAuditLog("payment_edited", currentUser.userId, {
      action_description: `Edited payment for ${memberName}`,
      changes: Object.entries(parsed.data).map(([key, val]) => ({
        field: key,
        from: (before as Record<string, unknown>)?.[key],
        to: val,
      })),
    });

    return NextResponse.json({ success: true, data: payment, message: "Payment updated successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const beforeDelete = await Payment.findById(id).populate("userId", "fullName");

    const payment = await Payment.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        status: "deleted",
        deletedBy: currentUser.userId,
        deletedAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json({ success: false, error: "Payment not found" }, { status: 404 });
    }

    const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const deleteMemberName = typeof beforeDelete?.userId === "object" ? (beforeDelete.userId as { fullName: string }).fullName : "Unknown";
    await createAuditLog("payment_deleted", currentUser.userId, {
      action_description: `Soft-deleted payment for ${deleteMemberName} (${MONTH_NAMES[beforeDelete?.month ? beforeDelete.month - 1 : 0]} ${beforeDelete?.year})`,
      member_name: deleteMemberName,
      amount: beforeDelete?.amount,
      receipt_no: beforeDelete?.receiptNo,
    });

    return NextResponse.json({ success: true, data: null, message: "Payment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete payment" }, { status: 500 });
  }
}
