import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";
import Settings from "@/models/Settings";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const settings = await Settings.findOne({});
    if (!settings) return NextResponse.json({ success: false, error: "Settings not found" }, { status: 500 });

    const allMembers = await User.find({ isDisabled: false }).select("fullName username").sort({ fullName: 1 });

    const payments = await Payment.find({
      month,
      year,
      isDeleted: false,
      status: "approved",
    }).populate("userId", "fullName username").populate("approvedBy", "fullName");

    const paidMemberIds = new Set(payments.map(p => {
      const uid = typeof p.userId === "object" ? (p.userId as { _id: { toString(): string } })._id.toString() : p.userId.toString();
      return uid;
    }));

    const paidMembers = payments.map(p => ({
      name: typeof p.userId === "object" ? (p.userId as { fullName: string }).fullName : "Unknown",
      amount: p.amount,
      penalty: p.penalty,
      penaltyReason: p.penaltyReason || "",
      approvedBy: typeof p.approvedBy === "object" ? (p.approvedBy as { fullName: string }).fullName : "Unknown",
      date: p.createdAt,
    }));

    const unpaidMembers = allMembers
      .filter(m => !paidMemberIds.has(m._id.toString()))
      .map(m => ({ name: m.fullName, username: m.username }));

    const isInitialMonth = month === settings.startMonth && year === settings.startYear;
    const expectedAmount = isInitialMonth ? settings.initialAmount : settings.monthlyAmount;
    const totalCollected = payments.reduce((sum, p) => sum + p.amount + p.penalty, 0);
    const totalExpected = allMembers.length * expectedAmount;
    const collectionRate = allMembers.length > 0 ? Math.round((payments.length / allMembers.length) * 100) : 0;

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        monthName: `${MONTH_NAMES[month - 1]} ${year}`,
        totalMembers: allMembers.length,
        paidCount: payments.length,
        unpaidCount: unpaidMembers.length,
        collectionRate,
        totalCollected,
        totalExpected,
        expectedAmountPerMember: expectedAmount,
        paidMembers,
        unpaidMembers,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch monthly report" }, { status: 500 });
  }
}
