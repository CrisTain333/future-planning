import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";
import { countExpectedMonths } from "@/lib/skip-months";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const settings = await Settings.findOne({});
    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings not found" }, { status: 500 });
    }

    const payments = await Payment.find({
      userId: currentUser.userId,
      isDeleted: false,
      status: "approved",
    }).sort({ year: 1, month: 1 });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const monthsPaid = payments.length;

    // Calculate expected months from start to current
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const skippedMonths = settings.skippedMonths || [];
    const expectedMonths = countExpectedMonths(
      settings.startMonth, settings.startYear,
      currentMonth, currentYear,
      skippedMonths
    );

    const monthsDue = expectedMonths - monthsPaid;
    const outstanding = monthsDue > 0 ? monthsDue * settings.monthlyAmount : 0;
    const status = monthsDue <= 0 ? "up_to_date" : `${monthsDue} months due`;

    const chartData = payments.map((p) => ({
      month: `${MONTHS[p.month - 1]} ${p.year}`,
      amount: p.amount,
    }));

    // Fund growth chart: cumulative total by month (all members combined)
    const fundGrowthRaw = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    let cumulative = 0;
    const fundGrowthChart = fundGrowthRaw.map((item) => {
      cumulative += item.total;
      return {
        month: item._id.month,
        year: item._id.year,
        total: cumulative,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalPaid,
        monthsPaid,
        outstanding,
        status,
        chartData,
        fundGrowthChart,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
