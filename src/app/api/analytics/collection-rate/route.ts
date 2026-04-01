import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { isMonthSkipped } from "@/lib/skip-months";

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

    const totalMembers = await User.countDocuments({ isDisabled: false });

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get payment counts per month
    const paymentCounts = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: { month: "$month", year: "$year" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const countMap = new Map<string, number>();
    for (const pc of paymentCounts) {
      countMap.set(`${pc._id.month}-${pc._id.year}`, pc.count);
    }

    const skippedMonths = settings.skippedMonths || [];
    const data: { label: string; month: number; year: number; paid: number; total: number; rate: number; skipped: boolean }[] = [];
    let m = settings.startMonth;
    let y = settings.startYear;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      const paid = countMap.get(`${m}-${y}`) || 0;
      const skipped = isMonthSkipped(m, y, skippedMonths);
      data.push({
        label: `${MONTH_NAMES[m - 1]} '${String(y).slice(-2)}`,
        month: m,
        year: y,
        paid,
        total: skipped ? 0 : totalMembers,
        rate: skipped ? -1 : (totalMembers > 0 ? Math.round((paid / totalMembers) * 100) : 0),
        skipped,
      });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch collection rate" }, { status: 500 });
  }
}
