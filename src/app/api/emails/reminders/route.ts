import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";

const REMINDER_DAYS = [1, 5, 10, 15];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfMonth = today.getDate();

  // Only run on reminder days
  if (!REMINDER_DAYS.includes(dayOfMonth)) {
    return NextResponse.json({ message: "Not a reminder day", sent: 0 });
  }

  try {
    await dbConnect();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const settings = await Settings.findOne();
    const monthlyAmount = settings?.monthlyAmount || 2000;
    const foundationName = settings?.foundationName || "Future Planning";

    // Check if current month is a skipped month
    const isSkipped = settings?.skippedMonths?.some(
      (s) => s.month === currentMonth && s.year === currentYear
    );
    if (isSkipped) {
      return NextResponse.json({ message: "Skipped month", sent: 0 });
    }

    // Find members who have already paid for this month
    const paidPayments = await Payment.find({
      month: currentMonth,
      year: currentYear,
      isDeleted: false,
      status: "approved",
    }).select("userId");
    const paidUserIds = paidPayments.map((p) => p.userId.toString());

    // Find active members with email who haven't paid
    const unpaidMembers = await User.find({
      isDisabled: false,
      role: "user",
      email: { $exists: true, $ne: "" },
      ...(paidUserIds.length > 0 ? { _id: { $nin: paidUserIds } } : {}),
    }).select("_id email fullName");

    let sentCount = 0;
    for (const member of unpaidMembers) {
      const result = await sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Payment Reminder - ${MONTHS[currentMonth - 1]} ${currentYear}`,
        type: "payment_reminder",
        react: PaymentReminderEmail({
          memberName: member.fullName,
          amount: monthlyAmount,
          monthName: MONTHS[currentMonth - 1],
          year: currentYear,
          foundationName,
        }),
        metadata: { month: currentMonth, year: currentYear, day: dayOfMonth },
      });
      if (result.success) sentCount++;
    }

    return NextResponse.json({
      message: `Reminders sent for ${MONTHS[currentMonth - 1]} ${currentYear}`,
      sent: sentCount,
      total: unpaidMembers.length,
    });
  } catch (error) {
    console.error("Cron reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
