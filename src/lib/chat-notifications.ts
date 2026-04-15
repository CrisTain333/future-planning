import dbConnect from "@/lib/db";
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
  const preview = messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview;

  // Chat uses device push notifications only — no in-app notification records.
  // Send push to all recipients except those actively online with the chat open
  // (they'll see it via polling). For simplicity, push to everyone — the browser
  // won't show a duplicate if the tab is focused (service worker handles this).
  for (const userId of recipients) {
    await sendPushToUser(userId, {
      title: senderName,
      body: preview,
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
