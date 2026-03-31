import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const settings = await Settings.findOne({});
    if (!settings) return NextResponse.json({ success: false, error: "Settings not found" }, { status: 500 });

    const members = await User.find({ isDisabled: false }).select("fullName username").sort({ fullName: 1 });
    const payments = await Payment.find({ isDeleted: false, status: "approved" }).select("userId month year penalty");

    // Build month columns from start to current
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const months: { month: number; year: number; label: string }[] = [];
    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let m = settings.startMonth;
    let y = settings.startYear;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      months.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]} ${y}` });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    // Build payment lookup: "userId-month-year" -> payment
    const paymentMap = new Map<string, { paid: boolean; penalty: boolean }>();
    for (const p of payments) {
      paymentMap.set(`${p.userId.toString()}-${p.month}-${p.year}`, {
        paid: true,
        penalty: p.penalty > 0,
      });
    }

    // Build grid
    const grid = members.map((member) => ({
      memberId: member._id.toString(),
      name: member.fullName,
      cells: months.map((mo) => {
        const key = `${member._id.toString()}-${mo.month}-${mo.year}`;
        const payment = paymentMap.get(key);
        if (!payment) return "unpaid";
        return payment.penalty ? "paid_penalty" : "paid";
      }),
    }));

    return NextResponse.json({
      success: true,
      data: { months, grid },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch payment grid" }, { status: 500 });
  }
}
