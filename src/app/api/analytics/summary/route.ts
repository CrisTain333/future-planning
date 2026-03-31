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

    const totalMembers = await User.countDocuments({ isDisabled: false });

    // Calculate total expected months from start to current
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let expectedMonths = 0;
    let m = settings.startMonth;
    let y = settings.startYear;
    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      expectedMonths++;
      m++;
      if (m > 12) { m = 1; y++; }
    }

    // Total expected = initial + (remaining months * monthly) per member
    const totalExpected = totalMembers * (settings.initialAmount + (expectedMonths - 1) * settings.monthlyAmount);

    // Total collected
    const fundResult = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalPenalty: { $sum: "$penalty" } } },
    ]);
    const totalCollected = fundResult[0]?.totalAmount || 0;
    const totalPenaltyRevenue = fundResult[0]?.totalPenalty || 0;

    const totalOutstanding = totalExpected - totalCollected;

    // Members with outstanding
    const paymentsPerMember = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const membersWithOutstanding = totalMembers - paymentsPerMember.filter(p => p.count >= expectedMonths).length;

    // Penalty trend (last 6 months)
    const penaltyTrend = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved", penalty: { $gt: 0 } } },
      { $group: { _id: { month: "$month", year: "$year" }, totalPenalty: { $sum: "$penalty" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const penaltyData = penaltyTrend.reverse().map(p => ({
      label: `${MONTH_NAMES[p._id.month - 1]} '${String(p._id.year).slice(-2)}`,
      amount: p.totalPenalty,
      count: p.count,
    }));

    // Fund projection: project to end of next 12 months assuming all pay on time
    const currentFund = totalCollected + totalPenaltyRevenue;
    const projectionMonths = 12;

    // Get actual fund by month
    const actualByMonth = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: { month: "$month", year: "$year" }, total: { $sum: { $add: ["$amount", "$penalty"] } } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    let cumActual = 0;
    const actualMap = new Map<string, number>();
    for (const a of actualByMonth) {
      cumActual += a.total;
      actualMap.set(`${a._id.month}-${a._id.year}`, cumActual);
    }

    const projection: { label: string; projected: number; actual?: number }[] = [];
    let projMonth = settings.startMonth;
    let projYear = settings.startYear;
    let projectedCum = 0;
    for (let i = 0; i < expectedMonths + projectionMonths; i++) {
      const isFirst = i === 0;
      projectedCum += totalMembers * (isFirst ? settings.initialAmount : settings.monthlyAmount);
      const key = `${projMonth}-${projYear}`;
      const label = `${MONTH_NAMES[projMonth - 1]} '${String(projYear).slice(-2)}`;

      projection.push({
        label,
        projected: projectedCum,
        actual: actualMap.get(key),
      });

      projMonth++;
      if (projMonth > 12) { projMonth = 1; projYear++; }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        membersWithOutstanding,
        totalPenaltyRevenue,
        penaltyData,
        currentFund,
        projection,
      },
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
