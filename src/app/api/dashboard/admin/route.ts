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

    // Total fund (sum of all approved, non-deleted payments)
    const fundResult = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalFund = fundResult[0]?.total || 0;

    // Total active members
    const totalMembers = await User.countDocuments({ isDisabled: false });

    // Payments this month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const thisMonthResult = await Payment.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear,
          isDeleted: false,
          status: "approved",
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);
    const paymentsThisMonth = {
      count: thisMonthResult[0]?.count || 0,
      amount: thisMonthResult[0]?.amount || 0,
    };

    // Overdue: members who haven't paid current month
    const settings = await Settings.findOne({});
    const skippedMonths = settings?.skippedMonths || [];
    const currentMonthSkipped = isMonthSkipped(currentMonth, currentYear, skippedMonths);

    let overdueCount = 0;
    if (!currentMonthSkipped) {
      const paidThisMonth = await Payment.distinct("userId", {
        month: currentMonth,
        year: currentYear,
        isDeleted: false,
        status: "approved",
      });
      overdueCount = await User.countDocuments({
        isDisabled: false,
        _id: { $nin: paidThisMonth },
      });
    }

    // Fund growth chart: cumulative total by month
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

    // Member contribution share
    const memberShareRaw = await Payment.aggregate([
      { $match: { isDeleted: false, status: "approved" } },
      { $group: { _id: "$userId", total: { $sum: "$amount" } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $sort: { total: -1 } },
    ]);

    const memberShareChart = memberShareRaw.map((item) => ({
      name: item.user.fullName,
      total: item.total,
      percentage: totalFund > 0 ? parseFloat(((item.total / totalFund) * 100).toFixed(2)) : 0,
    }));

    // Recent payments (last 5)
    const recentPayments = await Payment.find({ isDeleted: false, status: "approved" })
      .populate("userId", "fullName")
      .sort({ createdAt: -1 })
      .limit(5)
      .select("userId month year amount createdAt");

    return NextResponse.json({
      success: true,
      data: {
        totalFund,
        totalMembers,
        paymentsThisMonth,
        overdueCount,
        fundGrowthChart,
        memberShareChart,
        recentPayments,
        recentNotices: [],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
