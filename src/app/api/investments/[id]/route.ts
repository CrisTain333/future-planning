import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import {
  calculateMaturityAmount,
  calculateMaturityDate,
} from "@/lib/investment-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const existing = await Investment.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404 }
      );
    }

    // Recalculate if financial fields changed
    const principalAmount = body.principalAmount ?? existing.principalAmount;
    const interestRate = body.interestRate ?? existing.interestRate;
    const compoundingFrequency = body.compoundingFrequency ?? existing.compoundingFrequency;
    const tenureMonths = body.tenureMonths ?? existing.tenureMonths;
    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;

    const maturityDate = calculateMaturityDate(startDate, tenureMonths);
    const maturityAmount = calculateMaturityAmount(
      principalAmount,
      interestRate,
      compoundingFrequency,
      tenureMonths
    );

    const updated = await Investment.findByIdAndUpdate(
      id,
      {
        ...body,
        startDate,
        maturityDate,
        maturityAmount,
      },
      { new: true }
    )
      .populate("memberContributions", "fullName username")
      .populate("createdBy", "fullName");

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update investment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const deleted = await Investment.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { message: "Investment deleted" } });
  } catch (error) {
    console.error("Delete investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete investment" },
      { status: 500 }
    );
  }
}
