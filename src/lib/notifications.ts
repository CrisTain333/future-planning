import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function createPaymentNotification(
  memberId: string,
  paymentId: string,
  month: string,
  amount: number
) {
  await dbConnect();
  await Notification.create({
    userId: memberId,
    type: "payment_recorded",
    title: "Payment Recorded",
    message: `Your payment of BDT ${amount.toLocaleString()} for ${month} has been recorded.`,
    referenceId: paymentId,
  });
}

export async function createNoticeNotification(noticeId: string, noticeTitle: string) {
  await dbConnect();
  const users = await User.find({ isDisabled: false }).select("_id");
  const notifications = users.map((user) => ({
    userId: user._id,
    type: "notice_posted" as const,
    title: "New Notice",
    message: `A new notice has been posted: "${noticeTitle}"`,
    referenceId: noticeId,
  }));
  await Notification.insertMany(notifications);
}
