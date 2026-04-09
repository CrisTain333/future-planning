import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import Presence from "@/models/Presence";
import { sendPushToUser } from "@/lib/push";

export async function notifyNewMessage(
  senderId: string,
  senderName: string,
  recipientIds: string[],
  conversationId: string,
  messagePreview: string
): Promise<void> {
  await dbConnect();

  const recipients = recipientIds.filter((id) => id !== senderId);

  const onlinePresences = await Presence.find({
    userId: { $in: recipients },
    status: "online",
  });
  const onlineUserIds = new Set(onlinePresences.map((p) => p.userId.toString()));

  const notifications = recipients.map((userId) => ({
    userId,
    type: "chat_message" as const,
    title: `Message from ${senderName}`,
    message: messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview,
    referenceId: conversationId,
  }));
  await Notification.insertMany(notifications);

  const offlineRecipients = recipients.filter((id) => !onlineUserIds.has(id));
  for (const userId of offlineRecipients) {
    await sendPushToUser(userId, {
      title: `Message from ${senderName}`,
      body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview,
      tag: `chat-${conversationId}`,
      data: { type: "chat_message", conversationId },
    });
  }
}

export async function notifyIncomingCall(
  callerId: string,
  callerName: string,
  recipientIds: string[],
  conversationId: string,
  callId: string,
  callType: "audio" | "video"
): Promise<void> {
  await dbConnect();

  const recipients = recipientIds.filter((id) => id !== callerId);

  for (const userId of recipients) {
    await sendPushToUser(userId, {
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling you`,
      tag: `call-${callId}`,
      data: { type: "incoming_call", conversationId, callId, callType },
    });
  }
}
