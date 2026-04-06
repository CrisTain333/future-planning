import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { userIds, month, year } = body as {
      userIds: string[];
      month: number;
      year: number;
    };

    if (!userIds?.length || !month || !year) {
      return NextResponse.json(
        { success: false, error: "userIds, month, and year are required" },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne();
    const monthlyAmount = settings?.monthlyAmount || 2000;
    const foundationName = settings?.foundationName || "Future Planning";

    const members = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: "" },
    }).select("_id email fullName");

    let sentCount = 0;
    for (const member of members) {
      const result = await sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Payment Reminder - ${MONTHS[month - 1]} ${year}`,
        type: "payment_reminder",
        react: PaymentReminderEmail({
          memberName: member.fullName,
          amount: monthlyAmount,
          monthName: MONTHS[month - 1],
          year,
          foundationName,
        }),
        metadata: { month, year, manual: true },
      });
      if (result.success) sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Reminders sent to ${sentCount} of ${members.length} members`,
      sent: sentCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
