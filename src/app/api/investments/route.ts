import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import {
  calculateMaturityAmount,
  calculateMaturityDate,
} from "@/lib/investment-utils";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const investments = await Investment.find(filter)
      .populate("memberContributions", "fullName username")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: investments });
  } catch (error) {
    console.error("Get investments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      bankName,
      principalAmount,
      interestRate,
      compoundingFrequency = "quarterly",
      startDate,
      tenureMonths,
      memberContributions = [],
      notes,
    } = body;

    if (!bankName || !principalAmount || !interestRate || !startDate || !tenureMonths) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const maturityDate = calculateMaturityDate(start, tenureMonths);
    const maturityAmount = calculateMaturityAmount(
      principalAmount,
      interestRate,
      compoundingFrequency,
      tenureMonths
    );

    const investment = await Investment.create({
      bankName,
      principalAmount,
      interestRate,
      compoundingFrequency,
      startDate: start,
      tenureMonths,
      maturityDate,
      maturityAmount,
      memberContributions,
      notes,
      createdBy: currentUser.userId,
    });

    return NextResponse.json(
      { success: true, data: investment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create investment" },
      { status: 500 }
    );
  }
}
