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

    // Group payments by user
    const userPayments = new Map<string, typeof payments>();
    for (const p of payments) {
      const uid = p.userId.toString();
      if (!userPayments.has(uid)) userPayments.set(uid, []);
      userPayments.get(uid)!.push(p);
    }

    const scores = members.map((member) => {
      const memberPayments = userPayments.get(member._id.toString()) || [];
      const paidMonths = memberPayments.length;
      const penaltyCount = memberPayments.filter(p => p.penalty > 0).length;
      const totalPenalty = memberPayments.reduce((sum, p) => sum + p.penalty, 0);

      // Payment rate (0-100)
      const paymentRate = expectedMonths > 0 ? Math.round((paidMonths / expectedMonths) * 100) : 0;

      // Penalty rate (inverse — fewer penalties = better)
      const penaltyRate = paidMonths > 0 ? Math.round(((paidMonths - penaltyCount) / paidMonths) * 100) : 100;

      // Overall score (weighted: 70% payment rate + 30% penalty-free rate)
      const score = Math.round(paymentRate * 0.7 + penaltyRate * 0.3);

      // Grade
      let grade: string;
      if (score >= 90) grade = "Excellent";
      else if (score >= 75) grade = "Good";
      else if (score >= 50) grade = "Fair";
      else grade = "Needs Attention";

      return {
        memberId: member._id.toString(),
        name: member.fullName,
        username: member.username,
        paidMonths,
        expectedMonths,
        paymentRate,
        penaltyCount,
        totalPenalty,
        score,
        grade,
      };
    });

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return NextResponse.json({ success: true, data: scores });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch member scores" }, { status: 500 });
  }
}
