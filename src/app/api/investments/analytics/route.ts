import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import { calculateValueAtDay } from "@/lib/investment-utils";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const investments = await Investment.find({}).sort({ startDate: 1 });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeInvestments = investments.filter((inv) => inv.status === "active");

    // --- Summary ---
    let totalInvested = 0;
    let totalInterestEarned = 0;
    let currentValue = 0;
    let projectedMaturityValue = 0;

    const perFD = investments.map((inv) => {
      const start = new Date(inv.startDate);
      const daysSinceStart = Math.max(
        0,
        Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const cv = inv.status === "active"
        ? calculateValueAtDay(
            inv.principalAmount,
            inv.interestRate,
            inv.compoundingFrequency,
            daysSinceStart
          )
        : inv.maturityAmount;
      const interestEarned = cv - inv.principalAmount;
      const projectedInterest = inv.maturityAmount - inv.principalAmount;
      const progressPercent =
        projectedInterest > 0
          ? Math.min(100, Math.round((interestEarned / projectedInterest) * 100))
          : 0;

      const matDate = new Date(inv.maturityDate);
      const daysRemaining = Math.max(
        0,
        Math.ceil((matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (inv.status === "active") {
        totalInvested += inv.principalAmount;
        totalInterestEarned += interestEarned;
        currentValue += cv;
        projectedMaturityValue += inv.maturityAmount;
      }

      return {
        id: inv._id.toString(),
        bankName: inv.bankName,
        principalAmount: inv.principalAmount,
        currentValue: Math.round(cv * 100) / 100,
        interestEarned: Math.round(interestEarned * 100) / 100,
        projectedInterest: Math.round(projectedInterest * 100) / 100,
        progressPercent,
        daysRemaining,
        maturityDate: inv.maturityDate.toISOString(),
        maturityAmount: inv.maturityAmount,
      };
    });

    // Daily earnings (sum across all active FDs)
    let dailyEarnings = 0;
    for (const inv of activeInvestments) {
      const start = new Date(inv.startDate);
      const daysSinceStart = Math.max(
        0,
        Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const valueToday = calculateValueAtDay(
        inv.principalAmount,
        inv.interestRate,
        inv.compoundingFrequency,
        daysSinceStart
      );
      const valueYesterday = calculateValueAtDay(
        inv.principalAmount,
        inv.interestRate,
        inv.compoundingFrequency,
        Math.max(0, daysSinceStart - 1)
      );
      dailyEarnings += valueToday - valueYesterday;
    }
    dailyEarnings = Math.round(dailyEarnings * 100) / 100;

    const summary = {
      totalInvested,
      totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      projectedMaturityValue: Math.round(projectedMaturityValue * 100) / 100,
      activeFDCount: activeInvestments.length,
      dailyEarnings,
      hourlyEarnings: Math.round((dailyEarnings / 24) * 100) / 100,
      monthlyEarnings: Math.round(dailyEarnings * 30 * 100) / 100,
      yearlyEarnings: Math.round(dailyEarnings * 365 * 100) / 100,
    };

    // --- Daily Growth (last 30 days) ---
    const dailyGrowth: Array<{
      date: string;
      fundValue: number;
      dailyGain: number;
      cumulativeInterest: number;
      growthPercent: number;
    }> = [];

    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      let totalValue = 0;
      let totalPrincipal = 0;

      for (const inv of activeInvestments) {
        const start = new Date(inv.startDate);
        if (date < start) continue;
        const days = Math.floor(
          (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalValue += calculateValueAtDay(
          inv.principalAmount,
          inv.interestRate,
          inv.compoundingFrequency,
          days
        );
        totalPrincipal += inv.principalAmount;
      }

      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      let prevValue = 0;
      for (const inv of activeInvestments) {
        const start = new Date(inv.startDate);
        if (prevDate < start) continue;
        const days = Math.floor(
          (prevDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        prevValue += calculateValueAtDay(
          inv.principalAmount,
          inv.interestRate,
          inv.compoundingFrequency,
          days
        );
      }

      const cumulativeInterest = totalValue - totalPrincipal;
      const dailyGain = totalValue - prevValue;
      const growthPercent =
        totalPrincipal > 0 ? (cumulativeInterest / totalPrincipal) * 100 : 0;

      dailyGrowth.push({
        date: date.toISOString().split("T")[0],
        fundValue: Math.round(totalValue * 100) / 100,
        dailyGain: Math.round(dailyGain * 100) / 100,
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
        growthPercent: Math.round(growthPercent * 1000) / 1000,
      });
    }

    // --- Growth Chart (monthly data points from earliest start to latest maturity) ---
    const growthChart: Array<Record<string, number | string>> = [];

    if (activeInvestments.length > 0) {
      const earliest = new Date(
        Math.min(...activeInvestments.map((inv) => new Date(inv.startDate).getTime()))
      );
      const latest = new Date(
        Math.max(...activeInvestments.map((inv) => new Date(inv.maturityDate).getTime()))
      );

      const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      while (cursor <= latest) {
        const point: Record<string, number | string> = {
          date: `${MONTH_NAMES[cursor.getMonth()]} '${String(cursor.getFullYear()).slice(-2)}`,
          totalValue: 0,
        };

        for (const inv of activeInvestments) {
          const start = new Date(inv.startDate);
          if (cursor < start) {
            point[inv._id.toString()] = 0;
            continue;
          }
          const days = Math.floor(
            (cursor.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          const maturityDays = Math.floor(
            (new Date(inv.maturityDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          const effectiveDays = Math.min(days, maturityDays);
          const value = calculateValueAtDay(
            inv.principalAmount,
            inv.interestRate,
            inv.compoundingFrequency,
            effectiveDays
          );
          point[inv._id.toString()] = Math.round(value * 100) / 100;
          (point.totalValue as number) += value;
        }

        point.totalValue = Math.round((point.totalValue as number) * 100) / 100;
        growthChart.push(point);

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return NextResponse.json({
      success: true,
      data: { summary, perFD, dailyGrowth, growthChart },
    });
  } catch (error) {
    console.error("Investment analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investment analytics" },
      { status: 500 }
    );
  }
}
