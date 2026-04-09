import webpush from "web-push";
import dbConnect from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@futureplanning.org",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  await dbConnect();
  const subscriptions = await PushSubscription.find({ userId });

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/android-chrome-192x192.png",
    tag: payload.tag || "default",
    data: payload.data || {},
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        },
        pushPayload
      )
    )
  );

  // Clean up expired subscriptions
  const expiredIds: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "rejected" && result.reason?.statusCode === 410) {
      expiredIds.push(subscriptions[index]._id as string);
    }
  });

  if (expiredIds.length > 0) {
    await PushSubscription.deleteMany({ _id: { $in: expiredIds } });
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map((userId) => sendPushToUser(userId, payload)));
}
