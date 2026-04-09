import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function createMeetingNotification(
  type:
    | "meeting_created"
    | "meeting_updated"
    | "meeting_cancelled"
    | "action_item_assigned",
  inviteeIds: string[],
  meetingId: string,
  title: string,
  message: string
) {
  await dbConnect();
  const notifications = inviteeIds.map((userId) => ({
    userId: new mongoose.Types.ObjectId(userId),
    type,
    title,
    message,
    referenceId: new mongoose.Types.ObjectId(meetingId),
    isRead: false,
  }));
  await Notification.insertMany(notifications);
}
