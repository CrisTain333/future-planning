import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "payments";

    let csv = "";
    let filename = "";

    if (type === "payments") {
      const payments = await Payment.find({ isDeleted: false, status: "approved" })
        .populate("userId", "fullName")
        .populate("approvedBy", "fullName")
        .sort({ year: 1, month: 1 });

      csv = "Receipt No,Member,Month,Year,Amount (BDT),Penalty (BDT),Penalty Reason,Recorded By,Date\n";
      for (const p of payments) {
        const member = typeof p.userId === "object" ? (p.userId as { fullName: string }).fullName : "Unknown";
        const approver = typeof p.approvedBy === "object" ? (p.approvedBy as { fullName: string }).fullName : "Unknown";
        csv += `"${p.receiptNo}","${member}","${MONTH_NAMES[p.month - 1]}","${p.year}","${p.amount}","${p.penalty}","${p.penaltyReason || ""}","${approver}","${new Date(p.createdAt).toLocaleDateString()}"\n`;
      }
      filename = "payments-export.csv";
    } else if (type === "members") {
      const members = await User.find({}).select("-password").sort({ fullName: 1 });

      csv = "Name,Username,Email,Phone,Address,Blood Group,Role,Status\n";
      for (const m of members) {
        csv += `"${m.fullName}","${m.username}","${m.email || ""}","${m.phone || ""}","${m.address || ""}","${m.bloodGroup || ""}","${m.role}","${m.isDisabled ? "Disabled" : "Active"}"\n`;
      }
      filename = "members-export.csv";
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to export" }, { status: 500 });
  }
}
