# Real-Time Chat, Push Notifications & Video Calls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add DM + group chat, Web Push notifications, and WebRTC video/audio calls with screen sharing — all at $0 cost on Vercel.

**Architecture:** Adaptive polling (2s active / 30s idle) against MongoDB for chat & presence. Web Push API for background notifications. PeerJS + WebRTC for peer-to-peer video/audio calls. PeerJS data channels for in-call chat and screen sharing via `getDisplayMedia`.

**Tech Stack:** Next.js 16, MongoDB/Mongoose, RTK Query, PeerJS, Web Push API, WebRTC, Ant Design + Tailwind CSS

**New Dependencies:** `peerjs`, `web-push`, `@types/web-push`

---

## File Structure

### Models (5 new files)
| File | Responsibility |
|------|---------------|
| `src/models/Message.ts` | Chat message schema with soft delete, readBy, replyTo |
| `src/models/Conversation.ts` | DM and group conversation schema with denormalized lastMessage |
| `src/models/Presence.ts` | Online/offline status and typing indicator per user |
| `src/models/PushSubscription.ts` | Web Push subscription endpoints per user/device |
| `src/models/CallLog.ts` | Video/audio call history with participant tracking |

### Types (additions to existing file)
| File | Changes |
|------|---------|
| `src/types/index.ts` | Add IMessage, IConversation, IPresence, IPushSubscription, ICallLog, chat-related API types |

### Validations (1 new file)
| File | Responsibility |
|------|---------------|
| `src/validations/chat.ts` | Zod schemas for message, conversation, call creation |

### API Routes (13 new endpoints)
| File | Endpoints |
|------|-----------|
| `src/app/api/realtime/sync/route.ts` | `GET` — bundled sync (messages, presence, typing, calls) |
| `src/app/api/realtime/heartbeat/route.ts` | `POST` — online status + typing updates |
| `src/app/api/conversations/route.ts` | `GET` list, `POST` create |
| `src/app/api/conversations/[id]/route.ts` | `PUT` update group |
| `src/app/api/conversations/[id]/messages/route.ts` | `GET` paginated, `POST` send |
| `src/app/api/conversations/[id]/messages/[msgId]/route.ts` | `DELETE` soft delete |
| `src/app/api/conversations/[id]/read/route.ts` | `POST` mark read |
| `src/app/api/calls/route.ts` | `POST` initiate call |
| `src/app/api/calls/[id]/route.ts` | `PATCH` update call status |
| `src/app/api/calls/history/route.ts` | `GET` call history |
| `src/app/api/push/subscribe/route.ts` | `POST` save, `DELETE` remove subscription |

### Lib (2 new files)
| File | Responsibility |
|------|---------------|
| `src/lib/push.ts` | Server-side Web Push send utility |
| `src/lib/chat-notifications.ts` | Create in-app + push notifications for chat/call events |

### RTK Query Slices (2 new files)
| File | Responsibility |
|------|---------------|
| `src/store/chat-api.ts` | Conversations, messages CRUD, mark read |
| `src/store/calls-api.ts` | Call initiation, update, history |

### Hooks (4 new files)
| File | Responsibility |
|------|---------------|
| `src/hooks/use-polling.ts` | Adaptive polling engine (2s/30s/off) |
| `src/hooks/use-peer.ts` | PeerJS connection lifecycle |
| `src/hooks/use-call.ts` | Call state machine (idle → ringing → active → ended) |
| `src/hooks/use-push.ts` | Push subscription management |

### Components (16 new files)
| File | Responsibility |
|------|---------------|
| `src/components/chat/chat-sidebar.tsx` | Conversation list with search, unread badges |
| `src/components/chat/chat-window.tsx` | Active conversation: messages + input |
| `src/components/chat/message-bubble.tsx` | Single message with reply, delete, read receipts |
| `src/components/chat/message-input.tsx` | Text input, reply preview, file indicator |
| `src/components/chat/typing-indicator.tsx` | "X is typing..." with animation |
| `src/components/chat/conversation-header.tsx` | Name, online dot, call buttons |
| `src/components/chat/create-conversation-modal.tsx` | New DM or group modal |
| `src/components/chat/online-badge.tsx` | Green/gray status dot |
| `src/components/call/call-screen.tsx` | Full-screen video/audio layout |
| `src/components/call/call-controls.tsx` | Mute, camera, screen share, hang up |
| `src/components/call/incoming-call.tsx` | Ringing overlay with accept/reject |
| `src/components/call/participant-grid.tsx` | Auto-adjusting video tile grid |
| `src/components/call/in-call-chat.tsx` | Side panel chat via data channel |

### Pages (1 new file)
| File | Responsibility |
|------|---------------|
| `src/app/(dashboard)/chat/page.tsx` | Main chat page (sidebar + window split layout) |

### Modified Files
| File | Changes |
|------|---------|
| `src/store/api.ts` | Add tag types: `Conversations`, `Messages`, `Calls` |
| `src/components/layout/sidebar.tsx` | Add Chat link with unread badge to both admin and member nav |
| `src/components/layout/header.tsx` | Add incoming call alert integration |
| `src/middleware.ts` | Add `/chat` to protected routes |
| `src/types/index.ts` | Add chat/call interfaces |
| `src/models/Notification.ts` | Add new notification types for chat |
| `public/sw.js` | Add push event handler |
| `src/components/providers/sw-register.tsx` | Add push subscription on registration |
| `package.json` | Add peerjs, web-push dependencies |
| `.env.local` | Add VAPID keys, METERED credentials |

---

## Task 1: Install Dependencies & Environment Setup

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: Install peerjs and web-push**

```bash
cd /Users/cristain/Documents/projects/future-planning
npm install peerjs web-push
npm install -D @types/web-push
```

- [ ] **Step 2: Generate VAPID keys**

```bash
npx web-push generate-vapid-keys
```

Copy the output keys.

- [ ] **Step 3: Add environment variables to `.env.local`**

Add these lines to the end of `.env.local`:

```env
# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<paste public key from step 2>
VAPID_PRIVATE_KEY=<paste private key from step 2>
VAPID_EMAIL=mailto:admin@futureplanning.org

# Metered TURN (free tier — sign up at metered.ca)
METERED_TURN_URL=turn:a.]relay.metered.ca:443
METERED_TURN_USERNAME=<from metered dashboard>
METERED_TURN_PASSWORD=<from metered dashboard>

# PeerJS
NEXT_PUBLIC_PEERJS_HOST=0.peerjs.com
NEXT_PUBLIC_PEERJS_PORT=443
NEXT_PUBLIC_PEERJS_SECURE=true
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add peerjs and web-push dependencies"
```

---

## Task 2: Data Models

**Files:**
- Create: `src/models/Message.ts`
- Create: `src/models/Conversation.ts`
- Create: `src/models/Presence.ts`
- Create: `src/models/PushSubscription.ts`
- Create: `src/models/CallLog.ts`

- [ ] **Step 1: Create Message model**

Create `src/models/Message.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  type: "text" | "image" | "file" | "system";
  replyTo: mongoose.Types.ObjectId | null;
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    readBy: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });

const Message = mongoose.models.Message || mongoose.model<IMessageDocument>("Message", MessageSchema);
export default Message;
```

- [ ] **Step 2: Create Conversation model**

Create `src/models/Conversation.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IConversationDocument extends Document {
  type: "direct" | "group";
  name: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage: {
    content: string;
    senderId: mongoose.Types.ObjectId;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: { type: String, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: {
      type: {
        content: { type: String },
        senderId: { type: Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date },
      },
      default: null,
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
export default Conversation;
```

- [ ] **Step 3: Create Presence model**

Create `src/models/Presence.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IPresenceDocument extends Document {
  userId: mongoose.Types.ObjectId;
  status: "online" | "offline";
  lastSeen: Date;
  isTyping: {
    conversationId: mongoose.Types.ObjectId;
    since: Date;
  } | null;
}

const PresenceSchema = new Schema<IPresenceDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  status: {
    type: String,
    enum: ["online", "offline"],
    default: "offline",
  },
  lastSeen: { type: Date, default: Date.now },
  isTyping: {
    type: {
      conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
      since: { type: Date },
    },
    default: null,
  },
});

PresenceSchema.index({ userId: 1 }, { unique: true });
PresenceSchema.index({ status: 1 });

const Presence = mongoose.models.Presence || mongoose.model<IPresenceDocument>("Presence", PresenceSchema);
export default Presence;
```

- [ ] **Step 4: Create PushSubscription model**

Create `src/models/PushSubscription.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IPushSubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceName: string;
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscriptionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  deviceName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

PushSubscriptionSchema.index({ userId: 1 });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscriptionDocument>("PushSubscription", PushSubscriptionSchema);
export default PushSubscription;
```

- [ ] **Step 5: Create CallLog model**

Create `src/models/CallLog.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface ICallLogDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  initiatedBy: mongoose.Types.ObjectId;
  participants: {
    userId: mongoose.Types.ObjectId;
    joinedAt: Date | null;
    leftAt: Date | null;
  }[];
  type: "audio" | "video";
  status: "ringing" | "active" | "ended" | "missed";
  startedAt: Date | null;
  endedAt: Date | null;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const CallLogSchema = new Schema<ICallLogDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    participants: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: null },
        leftAt: { type: Date, default: null },
      },
    ],
    type: {
      type: String,
      enum: ["audio", "video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ringing", "active", "ended", "missed"],
      default: "ringing",
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CallLogSchema.index({ conversationId: 1 });
CallLogSchema.index({ initiatedBy: 1 });
CallLogSchema.index({ status: 1 });

const CallLog = mongoose.models.CallLog || mongoose.model<ICallLogDocument>("CallLog", CallLogSchema);
export default CallLog;
```

- [ ] **Step 6: Commit**

```bash
git add src/models/Message.ts src/models/Conversation.ts src/models/Presence.ts src/models/PushSubscription.ts src/models/CallLog.ts
git commit -m "feat: add data models for chat, presence, push subscriptions, and call logs"
```

---

## Task 3: TypeScript Interfaces & Validation Schemas

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/validations/chat.ts`

- [ ] **Step 1: Add interfaces to `src/types/index.ts`**

Append the following to the end of `src/types/index.ts`:

```typescript
// --- Real-Time Chat & Calls Types ---

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string | IUser;
  content: string;
  type: "text" | "image" | "file" | "system";
  replyTo: string | IMessage | null;
  readBy: { userId: string; readAt: string }[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IConversation {
  _id: string;
  type: "direct" | "group";
  name: string;
  participants: (string | IUser)[];
  createdBy: string | IUser;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface IPresence {
  _id: string;
  userId: string;
  status: "online" | "offline";
  lastSeen: string;
  isTyping: {
    conversationId: string;
    since: string;
  } | null;
}

export interface IPushSub {
  _id: string;
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  deviceName: string;
  createdAt: string;
}

export interface ICallLog {
  _id: string;
  conversationId: string | IConversation;
  initiatedBy: string | IUser;
  participants: {
    userId: string | IUser;
    joinedAt: string | null;
    leftAt: string | null;
  }[];
  type: "audio" | "video";
  status: "ringing" | "active" | "ended" | "missed";
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResponse {
  messages: IMessage[];
  presence: IPresence[];
  typing: IPresence[];
  calls: ICallLog[];
  serverTime: string;
}
```

- [ ] **Step 2: Create validation schemas**

Create `src/validations/chat.ts`:

```typescript
import { z } from "zod";

export const createConversationSchema = z.object({
  type: z.enum(["direct", "group"]),
  name: z.string().max(100).optional().or(z.literal("")),
  participants: z.array(z.string().min(1)).min(1, "At least one participant is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
  type: z.enum(["text", "image", "file"]).default("text"),
  replyTo: z.string().optional(),
});

export const updateConversationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  addParticipants: z.array(z.string()).optional(),
  removeParticipants: z.array(z.string()).optional(),
});

export const heartbeatSchema = z.object({
  typing: z
    .object({
      conversationId: z.string().min(1),
      isTyping: z.boolean(),
    })
    .optional(),
});

export const initiateCallSchema = z.object({
  conversationId: z.string().min(1, "Conversation is required"),
  type: z.enum(["audio", "video"]),
});

export const updateCallSchema = z.object({
  status: z.enum(["active", "ended", "missed"]),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;
export type InitiateCallInput = z.infer<typeof initiateCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/validations/chat.ts
git commit -m "feat: add TypeScript interfaces and Zod validations for chat and calls"
```

---

## Task 4: Server-Side Push Utility & Chat Notifications

**Files:**
- Create: `src/lib/push.ts`
- Create: `src/lib/chat-notifications.ts`

- [ ] **Step 1: Create Web Push utility**

Create `src/lib/push.ts`:

```typescript
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
```

- [ ] **Step 2: Create chat notification helper**

Create `src/lib/chat-notifications.ts`:

```typescript
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

  // Filter out the sender
  const recipients = recipientIds.filter((id) => id !== senderId);

  // Check which users are online and viewing this conversation
  const onlinePresences = await Presence.find({
    userId: { $in: recipients },
    status: "online",
  });
  const onlineUserIds = new Set(onlinePresences.map((p) => p.userId.toString()));

  // Create in-app notifications for all recipients
  const notifications = recipients.map((userId) => ({
    userId,
    type: "chat_message" as const,
    title: `Message from ${senderName}`,
    message: messagePreview.length > 100 ? messagePreview.slice(0, 100) + "..." : messagePreview,
    referenceId: conversationId,
  }));
  await Notification.insertMany(notifications);

  // Send push to offline users only
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

  // Always push for calls — they're urgent
  for (const userId of recipients) {
    await sendPushToUser(userId, {
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling you`,
      tag: `call-${callId}`,
      data: { type: "incoming_call", conversationId, callId, callType },
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/push.ts src/lib/chat-notifications.ts
git commit -m "feat: add Web Push utility and chat notification helpers"
```

---

## Task 5: Update Store Base API Tags

**Files:**
- Modify: `src/store/api.ts`

- [ ] **Step 1: Add new tag types**

In `src/store/api.ts`, add `"Conversations"`, `"Messages"`, `"Calls"` to the `tagTypes` array:

```typescript
tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs", "EmailLogs", "Investments", "Meetings", "MeetingDetail", "ActionItems", "Conversations", "Messages", "Calls"],
```

- [ ] **Step 2: Commit**

```bash
git add src/store/api.ts
git commit -m "feat: add Conversations, Messages, Calls tag types to RTK Query base API"
```

---

## Task 6: RTK Query — Chat API Slice

**Files:**
- Create: `src/store/chat-api.ts`

- [ ] **Step 1: Create chat API slice**

Create `src/store/chat-api.ts`:

```typescript
import { api } from "./api";
import {
  IConversation,
  IMessage,
  SyncResponse,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

interface GetConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface SendMessageBody {
  content: string;
  type?: "text" | "image" | "file";
  replyTo?: string;
}

interface CreateConversationBody {
  type: "direct" | "group";
  name?: string;
  participants: string[];
}

interface UpdateConversationBody {
  name?: string;
  addParticipants?: string[];
  removeParticipants?: string[];
}

interface HeartbeatBody {
  typing?: {
    conversationId: string;
    isTyping: boolean;
  };
}

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<PaginatedResponse<IConversation>, GetConversationsParams>({
      query: (params) => ({
        url: "/conversations",
        params,
      }),
      providesTags: ["Conversations"],
    }),
    createConversation: builder.mutation<ApiResponse<IConversation>, CreateConversationBody>({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
    updateConversation: builder.mutation<
      ApiResponse<IConversation>,
      { id: string; body: UpdateConversationBody }
    >({
      query: ({ id, body }) => ({
        url: `/conversations/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),
    getMessages: builder.query<
      PaginatedResponse<IMessage>,
      { conversationId: string; before?: string; limit?: number }
    >({
      query: ({ conversationId, before, limit }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: { before, limit },
      }),
      providesTags: ["Messages"],
    }),
    sendMessage: builder.mutation<
      ApiResponse<IMessage>,
      { conversationId: string; body: SendMessageBody }
    >({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messages", "Conversations"],
    }),
    deleteMessage: builder.mutation<ApiResponse<null>, { conversationId: string; messageId: string }>({
      query: ({ conversationId, messageId }) => ({
        url: `/conversations/${conversationId}/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Messages"],
    }),
    markConversationRead: builder.mutation<ApiResponse<null>, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Conversations"],
    }),
    sync: builder.query<SyncResponse, { since: string }>({
      query: ({ since }) => ({
        url: "/realtime/sync",
        params: { since },
      }),
    }),
    heartbeat: builder.mutation<ApiResponse<null>, HeartbeatBody>({
      query: (body) => ({
        url: "/realtime/heartbeat",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
  useLazySyncQuery,
  useHeartbeatMutation,
} = chatApi;
```

- [ ] **Step 2: Commit**

```bash
git add src/store/chat-api.ts
git commit -m "feat: add RTK Query chat API slice with conversations, messages, sync endpoints"
```

---

## Task 7: RTK Query — Calls API Slice

**Files:**
- Create: `src/store/calls-api.ts`

- [ ] **Step 1: Create calls API slice**

Create `src/store/calls-api.ts`:

```typescript
import { api } from "./api";
import { ICallLog, ApiResponse, PaginatedResponse } from "@/types";

interface InitiateCallBody {
  conversationId: string;
  type: "audio" | "video";
}

interface UpdateCallBody {
  status: "active" | "ended" | "missed";
}

export const callsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    initiateCall: builder.mutation<ApiResponse<ICallLog>, InitiateCallBody>({
      query: (body) => ({
        url: "/calls",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Calls"],
    }),
    updateCall: builder.mutation<ApiResponse<ICallLog>, { id: string; body: UpdateCallBody }>({
      query: ({ id, body }) => ({
        url: `/calls/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Calls"],
    }),
    getCallHistory: builder.query<PaginatedResponse<ICallLog>, { page?: number; limit?: number }>({
      query: (params) => ({
        url: "/calls/history",
        params,
      }),
      providesTags: ["Calls"],
    }),
  }),
});

export const {
  useInitiateCallMutation,
  useUpdateCallMutation,
  useGetCallHistoryQuery,
} = callsApi;
```

- [ ] **Step 2: Commit**

```bash
git add src/store/calls-api.ts
git commit -m "feat: add RTK Query calls API slice with initiate, update, and history"
```

---

## Task 8: API Routes — Realtime Sync & Heartbeat

**Files:**
- Create: `src/app/api/realtime/sync/route.ts`
- Create: `src/app/api/realtime/heartbeat/route.ts`

- [ ] **Step 1: Create the sync endpoint**

Create `src/app/api/realtime/sync/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Presence from "@/models/Presence";
import CallLog from "@/models/CallLog";
import Conversation from "@/models/Conversation";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 10000);

    // Get conversations this user is part of
    const userConversations = await Conversation.find({
      participants: currentUser.userId,
    }).select("_id participants");

    const conversationIds = userConversations.map((c) => c._id);
    const allParticipantIds = [
      ...new Set(userConversations.flatMap((c) => c.participants.map((p: { toString: () => string }) => p.toString()))),
    ];

    // New messages since last sync
    const messages = await Message.find({
      conversationId: { $in: conversationIds },
      createdAt: { $gt: sinceDate },
    })
      .populate("senderId", "fullName profilePicture")
      .populate("replyTo", "content senderId")
      .sort({ createdAt: 1 })
      .limit(100);

    // Presence changes for participants
    const presence = await Presence.find({
      userId: { $in: allParticipantIds },
    });

    // Currently typing users
    const threeSecondsAgo = new Date(Date.now() - 3000);
    const typing = await Presence.find({
      userId: { $in: allParticipantIds, $ne: currentUser.userId },
      "isTyping.since": { $gt: threeSecondsAgo },
    });

    // Active/ringing calls for user's conversations
    const calls = await CallLog.find({
      conversationId: { $in: conversationIds },
      status: { $in: ["ringing", "active"] },
    }).populate("initiatedBy", "fullName profilePicture");

    return NextResponse.json({
      success: true,
      data: {
        messages,
        presence,
        typing,
        calls,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the heartbeat endpoint**

Create `src/app/api/realtime/heartbeat/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Presence from "@/models/Presence";
import { heartbeatSchema } from "@/validations/chat";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = heartbeatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const update: Record<string, unknown> = {
      status: "online",
      lastSeen: new Date(),
    };

    if (parsed.data.typing) {
      update.isTyping = parsed.data.typing.isTyping
        ? { conversationId: parsed.data.typing.conversationId, since: new Date() }
        : null;
    }

    await Presence.findOneAndUpdate(
      { userId: currentUser.userId },
      { $set: update },
      { upsert: true }
    );

    // Mark users offline if no heartbeat for 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60000);
    await Presence.updateMany(
      { lastSeen: { $lt: sixtySecondsAgo }, status: "online" },
      { $set: { status: "offline", isTyping: null } }
    );

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Heartbeat failed" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/realtime/sync/route.ts src/app/api/realtime/heartbeat/route.ts
git commit -m "feat: add realtime sync and heartbeat API endpoints"
```

---

## Task 9: API Routes — Conversations CRUD

**Files:**
- Create: `src/app/api/conversations/route.ts`
- Create: `src/app/api/conversations/[id]/route.ts`
- Create: `src/app/api/conversations/[id]/read/route.ts`

- [ ] **Step 1: Create conversations list + create endpoint**

Create `src/app/api/conversations/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { createConversationSchema } from "@/validations/chat";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = {
      participants: currentUser.userId,
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await Conversation.countDocuments(query);
    const conversations = await Conversation.find(query)
      .populate("participants", "fullName profilePicture email")
      .populate("createdBy", "fullName")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: currentUser.userId },
          "readBy.userId": { $ne: currentUser.userId },
          isDeleted: false,
        });
        return { ...conv.toObject(), unreadCount };
      })
    );

    return NextResponse.json({
      success: true,
      data: conversationsWithUnread,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = createConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { type, name, participants } = parsed.data;

    // Ensure creator is in participants
    const allParticipants = [...new Set([currentUser.userId, ...participants])];

    // For DMs, check if conversation already exists between these two users
    if (type === "direct" && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        type: "direct",
        participants: { $all: allParticipants, $size: 2 },
      }).populate("participants", "fullName profilePicture email");

      if (existing) {
        return NextResponse.json({ success: true, data: existing });
      }
    }

    const conversation = await Conversation.create({
      type,
      name: type === "group" ? name || "New Group" : "",
      participants: allParticipants,
      createdBy: currentUser.userId,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "fullName profilePicture email")
      .populate("createdBy", "fullName");

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create conversation update endpoint**

Create `src/app/api/conversations/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Conversation from "@/models/Conversation";
import { updateConversationSchema } from "@/validations/chat";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Must be a participant
    if (!conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    if (conversation.type !== "group") {
      return NextResponse.json({ success: false, error: "Cannot modify direct conversations" }, { status: 400 });
    }

    const { name, addParticipants, removeParticipants } = parsed.data;

    if (name) conversation.name = name;
    if (addParticipants) {
      const newParticipants = addParticipants.filter(
        (p) => !conversation.participants.some((existing: { toString: () => string }) => existing.toString() === p)
      );
      conversation.participants.push(...newParticipants);
    }
    if (removeParticipants) {
      conversation.participants = conversation.participants.filter(
        (p: { toString: () => string }) => !removeParticipants.includes(p.toString())
      );
    }

    await conversation.save();

    const populated = await Conversation.findById(id)
      .populate("participants", "fullName profilePicture email")
      .populate("createdBy", "fullName");

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update conversation" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create mark-read endpoint**

Create `src/app/api/conversations/[id]/read/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Verify participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: currentUser.userId },
        "readBy.userId": { $ne: currentUser.userId },
        isDeleted: false,
      },
      {
        $push: { readBy: { userId: currentUser.userId, readAt: new Date() } },
      }
    );

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to mark as read" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/conversations/route.ts src/app/api/conversations/\[id\]/route.ts src/app/api/conversations/\[id\]/read/route.ts
git commit -m "feat: add conversations CRUD and mark-read API endpoints"
```

---

## Task 10: API Routes — Messages CRUD

**Files:**
- Create: `src/app/api/conversations/[id]/messages/route.ts`
- Create: `src/app/api/conversations/[id]/messages/[msgId]/route.ts`

- [ ] **Step 1: Create messages list + send endpoint**

Create `src/app/api/conversations/[id]/messages/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";
import { sendMessageSchema } from "@/validations/chat";
import { notifyNewMessage } from "@/lib/chat-notifications";
import User from "@/models/User";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Verify participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "30");

    const query: Record<string, unknown> = { conversationId: id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const total = await Message.countDocuments({ conversationId: id });
    const messages = await Message.find(query)
      .populate("senderId", "fullName profilePicture")
      .populate("replyTo", "content senderId")
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order
    messages.reverse();

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: { total, limit, hasMore: messages.length === limit },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string; fullName: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Verify participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const message = await Message.create({
      conversationId: id,
      senderId: currentUser.userId,
      content: parsed.data.content,
      type: parsed.data.type || "text",
      replyTo: parsed.data.replyTo || null,
      readBy: [{ userId: currentUser.userId, readAt: new Date() }],
    });

    // Update conversation's lastMessage
    await Conversation.findByIdAndUpdate(id, {
      lastMessage: {
        content: parsed.data.content,
        senderId: currentUser.userId,
        createdAt: new Date(),
      },
      updatedAt: new Date(),
    });

    const populated = await Message.findById(message._id)
      .populate("senderId", "fullName profilePicture")
      .populate("replyTo", "content senderId");

    // Get sender name for notifications
    const sender = await User.findById(currentUser.userId).select("fullName");
    const senderName = sender?.fullName || "Someone";

    // Notify other participants
    const recipientIds = conversation.participants.map((p: { toString: () => string }) => p.toString());
    await notifyNewMessage(
      currentUser.userId,
      senderName,
      recipientIds,
      id,
      parsed.data.content
    );

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create message delete endpoint**

Create `src/app/api/conversations/[id]/messages/[msgId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Conversation from "@/models/Conversation";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, msgId } = await params;

    // Verify participant
    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    const message = await Message.findById(msgId);
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Only sender or admin can delete
    if (message.senderId.toString() !== currentUser.userId && currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Cannot delete this message" }, { status: 403 });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete message" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/conversations/\[id\]/messages/route.ts src/app/api/conversations/\[id\]/messages/\[msgId\]/route.ts
git commit -m "feat: add messages list, send, and soft-delete API endpoints"
```

---

## Task 11: API Routes — Calls

**Files:**
- Create: `src/app/api/calls/route.ts`
- Create: `src/app/api/calls/[id]/route.ts`
- Create: `src/app/api/calls/history/route.ts`

- [ ] **Step 1: Create call initiation endpoint**

Create `src/app/api/calls/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import Conversation from "@/models/Conversation";
import User from "@/models/User";
import { initiateCallSchema } from "@/validations/chat";
import { notifyIncomingCall } from "@/lib/chat-notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = initiateCallSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { conversationId, type } = parsed.data;

    // Verify participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some((p: { toString: () => string }) => p.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    // Check for active call in this conversation
    const activeCall = await CallLog.findOne({
      conversationId,
      status: { $in: ["ringing", "active"] },
    });
    if (activeCall) {
      return NextResponse.json({ success: false, error: "A call is already in progress" }, { status: 409 });
    }

    const participants = conversation.participants.map((p: { toString: () => string }) => ({
      userId: p.toString(),
      joinedAt: p.toString() === currentUser.userId ? new Date() : null,
      leftAt: null,
    }));

    const callLog = await CallLog.create({
      conversationId,
      initiatedBy: currentUser.userId,
      participants,
      type,
      status: "ringing",
    });

    const populated = await CallLog.findById(callLog._id)
      .populate("initiatedBy", "fullName profilePicture")
      .populate("participants.userId", "fullName profilePicture");

    // Notify other participants
    const caller = await User.findById(currentUser.userId).select("fullName");
    const recipientIds = conversation.participants.map((p: { toString: () => string }) => p.toString());
    await notifyIncomingCall(
      currentUser.userId,
      caller?.fullName || "Someone",
      recipientIds,
      conversationId,
      callLog._id.toString(),
      type
    );

    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to initiate call" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create call update endpoint**

Create `src/app/api/calls/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import { updateCallSchema } from "@/validations/chat";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCallSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const callLog = await CallLog.findById(id);
    if (!callLog) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 });
    }

    // Must be a participant
    if (!callLog.participants.some((p: { userId: { toString: () => string } }) => p.userId.toString() === currentUser.userId)) {
      return NextResponse.json({ success: false, error: "Not a call participant" }, { status: 403 });
    }

    const { status } = parsed.data;

    if (status === "active") {
      callLog.status = "active";
      callLog.startedAt = callLog.startedAt || new Date();
      // Mark this user as joined
      const participant = callLog.participants.find(
        (p: { userId: { toString: () => string } }) => p.userId.toString() === currentUser.userId
      );
      if (participant && !participant.joinedAt) {
        participant.joinedAt = new Date();
      }
    } else if (status === "ended") {
      callLog.status = "ended";
      callLog.endedAt = new Date();
      if (callLog.startedAt) {
        callLog.duration = Math.round((callLog.endedAt.getTime() - callLog.startedAt.getTime()) / 1000);
      }
      // Mark user as left
      const participant = callLog.participants.find(
        (p: { userId: { toString: () => string } }) => p.userId.toString() === currentUser.userId
      );
      if (participant) {
        participant.leftAt = new Date();
      }
    } else if (status === "missed") {
      callLog.status = "missed";
      callLog.endedAt = new Date();
    }

    await callLog.save();

    const populated = await CallLog.findById(id)
      .populate("initiatedBy", "fullName profilePicture")
      .populate("participants.userId", "fullName profilePicture");

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update call" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create call history endpoint**

Create `src/app/api/calls/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import CallLog from "@/models/CallLog";
import Conversation from "@/models/Conversation";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get user's conversations
    const userConversations = await Conversation.find({
      participants: currentUser.userId,
    }).select("_id");
    const conversationIds = userConversations.map((c) => c._id);

    const query = {
      conversationId: { $in: conversationIds },
      status: { $in: ["ended", "missed"] },
    };

    const total = await CallLog.countDocuments(query);
    const calls = await CallLog.find(query)
      .populate("initiatedBy", "fullName profilePicture")
      .populate("participants.userId", "fullName profilePicture")
      .populate("conversationId", "type name participants")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: calls,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch call history" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/calls/route.ts src/app/api/calls/\[id\]/route.ts src/app/api/calls/history/route.ts
git commit -m "feat: add call initiation, update, and history API endpoints"
```

---

## Task 12: API Routes — Push Subscription

**Files:**
- Create: `src/app/api/push/subscribe/route.ts`

- [ ] **Step 1: Create push subscribe/unsubscribe endpoint**

Create `src/app/api/push/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PushSubscription from "@/models/PushSubscription";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json({ success: false, error: "Invalid subscription" }, { status: 400 });
    }

    // Upsert by endpoint to avoid duplicates
    await PushSubscription.findOneAndUpdate(
      { endpoint: body.endpoint },
      {
        userId: currentUser.userId,
        endpoint: body.endpoint,
        keys: body.keys,
        deviceName: body.deviceName || "",
        createdAt: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: null }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    if (!body.endpoint) {
      return NextResponse.json({ success: false, error: "Endpoint required" }, { status: 400 });
    }

    await PushSubscription.deleteOne({ endpoint: body.endpoint, userId: currentUser.userId });

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to remove subscription" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/push/subscribe/route.ts
git commit -m "feat: add push subscription save and remove API endpoints"
```

---

## Task 13: Service Worker — Push Handler

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Add push and notification click handlers to service worker**

Replace the full content of `public/sw.js` with:

```javascript
const CACHE_NAME = 'fp-cache-v1';
const STATIC_ASSETS = [
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network first for API calls and pages
  if (event.request.url.includes('/api/') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// --- Web Push Notifications ---

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  const { title, body, icon, tag, data } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/android-chrome-192x192.png',
      tag: tag || 'default',
      data: data || {},
      badge: '/android-chrome-192x192.png',
      vibrate: [200, 100, 200],
      actions:
        data?.type === 'incoming_call'
          ? [
              { action: 'answer', title: 'Answer' },
              { action: 'decline', title: 'Decline' },
            ]
          : [],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/chat';

  if (data.type === 'chat_message' && data.conversationId) {
    targetUrl = `/chat?id=${data.conversationId}`;
  } else if (data.type === 'incoming_call' && data.conversationId) {
    targetUrl = `/chat?id=${data.conversationId}&call=${data.callId}`;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes('/chat') || client.url.includes('/dashboard')) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add push notification and notification click handlers to service worker"
```

---

## Task 14: Custom Hooks — Polling, Push, Peer, Call

**Files:**
- Create: `src/hooks/use-polling.ts`
- Create: `src/hooks/use-push.ts`
- Create: `src/hooks/use-peer.ts`
- Create: `src/hooks/use-call.ts`

- [ ] **Step 1: Create adaptive polling hook**

Create `src/hooks/use-polling.ts`:

```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { IMessage, IPresence, ICallLog } from "@/types";

interface SyncData {
  messages: IMessage[];
  presence: IPresence[];
  typing: IPresence[];
  calls: ICallLog[];
}

interface UsePollingOptions {
  activeConversationId?: string | null;
  onMessages?: (messages: IMessage[]) => void;
  onPresence?: (presence: IPresence[]) => void;
  onTyping?: (typing: IPresence[]) => void;
  onCalls?: (calls: ICallLog[]) => void;
  enabled?: boolean;
}

const ACTIVE_INTERVAL = 2000;
const IDLE_INTERVAL = 30000;

export function usePolling({
  activeConversationId,
  onMessages,
  onPresence,
  onTyping,
  onCalls,
  enabled = true,
}: UsePollingOptions) {
  const lastSyncRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  const sync = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtime/sync?since=${encodeURIComponent(lastSyncRef.current)}`);
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success) return;

      const data: SyncData = json.data;
      lastSyncRef.current = data.serverTime || new Date().toISOString();

      if (data.messages.length > 0) onMessages?.(data.messages);
      if (data.presence.length > 0) onPresence?.(data.presence);
      onTyping?.(data.typing);
      if (data.calls.length > 0) onCalls?.(data.calls);
    } catch {
      // Silently fail — next poll will retry
    }
  }, [onMessages, onPresence, onTyping, onCalls]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Polling loop
  useEffect(() => {
    if (!enabled || !isVisible) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const interval = activeConversationId ? ACTIVE_INTERVAL : IDLE_INTERVAL;

    // Immediate sync when becoming visible or changing conversation
    sync();

    intervalRef.current = setInterval(sync, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isVisible, activeConversationId, sync]);

  return { sync, isVisible };
}
```

- [ ] **Step 2: Create push subscription hook**

Create `src/hooks/use-push.ts`:

```typescript
"use client";

import { useEffect, useCallback, useState } from "react";

export function usePush() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;

    // Convert VAPID key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setIsSubscribed(true);
    } catch {
      // Subscription failed — user may have denied permission
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      await subscribe();
    }
  }, [subscribe]);

  // Check initial state
  useEffect(() => {
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);

    if (Notification.permission === "granted") {
      subscribe();
    }
  }, [subscribe]);

  return { isSubscribed, permission, requestPermission, subscribe };
}
```

- [ ] **Step 3: Create PeerJS connection hook**

Create `src/hooks/use-peer.ts`:

```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Peer, { MediaConnection, DataConnection } from "peerjs";

interface UsePeerOptions {
  userId: string;
  enabled?: boolean;
}

export function usePeer({ userId, enabled = true }: UsePeerOptions) {
  const peerRef = useRef<Peer | null>(null);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const mediaConnectionsRef = useRef<Map<string, MediaConnection>>(new Map());
  const dataConnectionsRef = useRef<Map<string, DataConnection>>(new Map());

  // Initialize PeerJS
  useEffect(() => {
    if (!enabled || !userId) return;

    const peer = new Peer(`fp-${userId}`, {
      host: process.env.NEXT_PUBLIC_PEERJS_HOST || "0.peerjs.com",
      port: parseInt(process.env.NEXT_PUBLIC_PEERJS_PORT || "443"),
      secure: process.env.NEXT_PUBLIC_PEERJS_SECURE !== "false",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          ...(process.env.NEXT_PUBLIC_METERED_TURN_URL
            ? [
                {
                  urls: process.env.NEXT_PUBLIC_METERED_TURN_URL,
                  username: process.env.NEXT_PUBLIC_METERED_TURN_USERNAME || "",
                  credential: process.env.NEXT_PUBLIC_METERED_TURN_PASSWORD || "",
                },
              ]
            : []),
        ],
      },
    });

    peer.on("open", (id) => {
      setPeerId(id);
      setIsConnected(true);
    });

    peer.on("disconnected", () => {
      setIsConnected(false);
      peer.reconnect();
    });

    peer.on("error", () => {
      setIsConnected(false);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
      peerRef.current = null;
      setPeerId(null);
      setIsConnected(false);
    };
  }, [userId, enabled]);

  const callPeer = useCallback(
    (remotePeerId: string, stream: MediaStream): MediaConnection | null => {
      if (!peerRef.current) return null;
      const call = peerRef.current.call(remotePeerId, stream);
      mediaConnectionsRef.current.set(remotePeerId, call);
      return call;
    },
    []
  );

  const connectData = useCallback((remotePeerId: string): DataConnection | null => {
    if (!peerRef.current) return null;
    const conn = peerRef.current.connect(remotePeerId);
    dataConnectionsRef.current.set(remotePeerId, conn);
    return conn;
  }, []);

  const onIncomingCall = useCallback(
    (handler: (call: MediaConnection) => void) => {
      peerRef.current?.on("call", handler);
    },
    []
  );

  const onIncomingData = useCallback(
    (handler: (conn: DataConnection) => void) => {
      peerRef.current?.on("connection", handler);
    },
    []
  );

  const closeAllConnections = useCallback(() => {
    mediaConnectionsRef.current.forEach((conn) => conn.close());
    dataConnectionsRef.current.forEach((conn) => conn.close());
    mediaConnectionsRef.current.clear();
    dataConnectionsRef.current.clear();
  }, []);

  return {
    peer: peerRef.current,
    peerId,
    isConnected,
    callPeer,
    connectData,
    onIncomingCall,
    onIncomingData,
    closeAllConnections,
    mediaConnections: mediaConnectionsRef.current,
    dataConnections: dataConnectionsRef.current,
  };
}
```

- [ ] **Step 4: Create call state machine hook**

Create `src/hooks/use-call.ts`:

```typescript
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MediaConnection, DataConnection } from "peerjs";
import { ICallLog } from "@/types";

type CallState = "idle" | "ringing" | "connecting" | "active" | "ended";

interface CallParticipant {
  peerId: string;
  userId: string;
  fullName: string;
  stream: MediaStream | null;
  mediaConnection: MediaConnection | null;
  dataConnection: DataConnection | null;
}

interface InCallMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface UseCallOptions {
  onCallEnded?: () => void;
}

export function useCall({ onCallEnded }: UseCallOptions = {}) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<"audio" | "video">("video");
  const [callLog, setCallLog] = useState<ICallLog | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const missedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLocalStream = useCallback(async (type: "audio" | "video") => {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === "video" ? { width: 640, height: 480 } : false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    return stream;
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Auto-stop when user clicks "Stop sharing" in browser UI
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        setIsScreenSharing(false);
      };

      return stream;
    } catch {
      return null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  }, [screenStream]);

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, [localStream]);

  const initiateCall = useCallback(
    async (type: "audio" | "video", callLogData: ICallLog) => {
      setCallType(type);
      setCallLog(callLogData);
      setCallState("ringing");

      // Auto-miss after 30 seconds
      missedTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/calls/${callLogData._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "missed" }),
        });
        setCallState("ended");
        onCallEnded?.();
      }, 30000);
    },
    [onCallEnded]
  );

  const acceptCall = useCallback(
    async (callLogData: ICallLog) => {
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
      setCallLog(callLogData);
      setCallType(callLogData.type);
      setCallState("connecting");

      await fetch(`/api/calls/${callLogData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      setCallState("active");
    },
    []
  );

  const endCall = useCallback(async () => {
    if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);

    // Stop all streams
    localStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());

    if (callLog) {
      await fetch(`/api/calls/${callLog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
    }

    setLocalStream(null);
    setScreenStream(null);
    setParticipants([]);
    setInCallMessages([]);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setCallState("ended");
    setCallLog(null);
    onCallEnded?.();
    setCallState("idle");
  }, [localStream, screenStream, callLog, onCallEnded]);

  const addInCallMessage = useCallback((msg: InCallMessage) => {
    setInCallMessages((prev) => [...prev, msg]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (missedTimeoutRef.current) clearTimeout(missedTimeoutRef.current);
      localStream?.getTracks().forEach((track) => track.stop());
      screenStream?.getTracks().forEach((track) => track.stop());
    };
  }, [localStream, screenStream]);

  return {
    callState,
    callType,
    callLog,
    participants,
    setParticipants,
    localStream,
    screenStream,
    isMuted,
    isCameraOff,
    isScreenSharing,
    inCallMessages,
    startLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleCamera,
    initiateCall,
    acceptCall,
    endCall,
    addInCallMessage,
  };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-polling.ts src/hooks/use-push.ts src/hooks/use-peer.ts src/hooks/use-call.ts
git commit -m "feat: add polling, push, peer, and call custom hooks"
```

---

## Task 15: Update Middleware & Sidebar Navigation

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add `/chat` to middleware matcher**

In `src/middleware.ts`, add `"/chat/:path*"` to the matcher array:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/chat/:path*",
    "/login",
  ],
};
```

- [ ] **Step 2: Add Chat link to sidebar**

In `src/components/layout/sidebar.tsx`, add the `MessageCircle` icon import and Chat links.

Add `MessageCircle` to the lucide-react import:

```typescript
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Calculator,
  BarChart3,
  FileText,
  CalendarDays,
  Settings2,
  ScrollText,
  Mail,
  UserCircle,
  Landmark,
  Video,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
```

Add to `memberLinks` array (after Meetings, before Profile):

```typescript
const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/meetings", label: "Meetings", icon: Video },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
```

Add to `adminLinks` array (after Investments, before Calendar):

```typescript
  { href: "/admin/investments", label: "Investments", icon: Landmark },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/collection-calendar", label: "Calendar", icon: CalendarDays },
```

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts src/components/layout/sidebar.tsx
git commit -m "feat: add chat route protection and sidebar navigation link"
```

---

## Task 16: Update Notification Model for Chat Types

**Files:**
- Modify: `src/models/Notification.ts`

- [ ] **Step 1: Read the current Notification model**

Read `src/models/Notification.ts` and add `"chat_message"`, `"incoming_call"`, `"missed_call"` to the type enum.

Find the `type` field enum array and add the new types:

```typescript
type: {
  type: String,
  enum: ["payment_recorded", "notice_posted", "meeting_created", "meeting_updated", "meeting_cancelled", "action_item_assigned", "chat_message", "incoming_call", "missed_call"],
  required: true,
},
```

- [ ] **Step 2: Update the INotification type in `src/types/index.ts`**

Update the `type` field in the `INotification` interface:

```typescript
export interface INotification {
  _id: string;
  userId: string;
  type: "payment_recorded" | "notice_posted" | "chat_message" | "incoming_call" | "missed_call";
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/models/Notification.ts src/types/index.ts
git commit -m "feat: add chat and call notification types to Notification model"
```

---

## Task 17: Chat Page & Components — Chat Sidebar

**Files:**
- Create: `src/components/chat/online-badge.tsx`
- Create: `src/components/chat/chat-sidebar.tsx`

- [ ] **Step 1: Create online badge component**

Create `src/components/chat/online-badge.tsx`:

```typescript
"use client";

interface OnlineBadgeProps {
  isOnline: boolean;
  size?: "sm" | "md";
}

export function OnlineBadge({ isOnline, size = "sm" }: OnlineBadgeProps) {
  const sizeClass = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`${sizeClass} rounded-full border-2 border-white ${
        isOnline ? "bg-green-500" : "bg-gray-300"
      }`}
    />
  );
}
```

- [ ] **Step 2: Create chat sidebar component**

Create `src/components/chat/chat-sidebar.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Input, Button } from "antd";
import { Plus, Search } from "lucide-react";
import { useGetConversationsQuery } from "@/store/chat-api";
import { useSession } from "next-auth/react";
import { IConversation, IUser, IPresence } from "@/types";
import { OnlineBadge } from "./online-badge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ChatSidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNew: () => void;
  presenceMap: Map<string, IPresence>;
}

export function ChatSidebar({
  activeConversationId,
  onSelectConversation,
  onCreateNew,
  presenceMap,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;

  const { data, isLoading } = useGetConversationsQuery({ search, limit: 50 });
  const conversations = (data?.data as (IConversation & { unreadCount?: number })[]) || [];

  const getDisplayName = (conv: IConversation) => {
    if (conv.type === "group") return conv.name;
    const otherParticipant = conv.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return otherParticipant?.fullName || "Unknown";
  };

  const getOtherUserId = (conv: IConversation) => {
    if (conv.type !== "direct") return null;
    const other = conv.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return other?._id || null;
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Chats</h2>
          <Button
            type="primary"
            size="small"
            icon={<Plus className="h-4 w-4" />}
            onClick={onCreateNew}
          />
        </div>
        <Input
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          size="small"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet. Start a new one!
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeConversationId;
            const displayName = getDisplayName(conv);
            const otherUserId = getOtherUserId(conv);
            const isOnline = otherUserId ? presenceMap.get(otherUserId)?.status === "online" : false;

            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                  isActive ? "bg-accent" : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  {conv.type === "direct" && (
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineBadge isOnline={isOnline} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{displayName}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {dayjs(conv.lastMessage.createdAt).fromNow(true)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unreadCount && conv.unreadCount > 0 ? (
                  <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/online-badge.tsx src/components/chat/chat-sidebar.tsx
git commit -m "feat: add online badge and chat sidebar components"
```

---

## Task 18: Chat Components — Message Bubble, Input, Typing Indicator

**Files:**
- Create: `src/components/chat/message-bubble.tsx`
- Create: `src/components/chat/message-input.tsx`
- Create: `src/components/chat/typing-indicator.tsx`

- [ ] **Step 1: Create message bubble**

Create `src/components/chat/message-bubble.tsx`:

```typescript
"use client";

import { IMessage, IUser } from "@/types";
import dayjs from "dayjs";
import { Trash2, Reply } from "lucide-react";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
  onReply?: (message: IMessage) => void;
}

export function MessageBubble({ message, isOwn, onDelete, onReply }: MessageBubbleProps) {
  const sender = typeof message.senderId === "object" ? (message.senderId as IUser) : null;

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const replyMessage = message.replyTo && typeof message.replyTo === "object" ? (message.replyTo as IMessage) : null;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group`}>
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && sender && (
          <span className="text-xs text-muted-foreground mb-1 block">{sender.fullName}</span>
        )}

        {replyMessage && (
          <div className="px-2 py-1 mb-1 rounded bg-gray-100 border-l-2 border-primary text-xs text-muted-foreground truncate">
            {typeof replyMessage.senderId === "object"
              ? (replyMessage.senderId as IUser).fullName
              : ""}
            : {replyMessage.content}
          </div>
        )}

        <div
          className={`px-3 py-2 rounded-lg text-sm break-words ${
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-gray-100 text-foreground rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-muted-foreground">
            {dayjs(message.createdAt).format("h:mm A")}
          </span>
          {isOwn && message.readBy && message.readBy.length > 1 && (
            <span className="text-[10px] text-blue-500">read</span>
          )}
        </div>

        {/* Actions (visible on hover) */}
        <div className="hidden group-hover:flex items-center gap-1 mt-0.5">
          <button
            onClick={() => onReply?.(message)}
            className="p-1 rounded hover:bg-gray-100 text-muted-foreground"
          >
            <Reply className="h-3 w-3" />
          </button>
          {isOwn && (
            <button
              onClick={() => onDelete?.(message._id)}
              className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create message input**

Create `src/components/chat/message-input.tsx`:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { IMessage, IUser } from "@/types";

interface MessageInputProps {
  onSend: (content: string, replyTo?: string) => void;
  onTyping: (isTyping: boolean) => void;
  replyTo: IMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed, replyTo?._id);
    setContent("");
    onCancelReply();
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
  };

  const replyAuthor =
    replyTo && typeof replyTo.senderId === "object"
      ? (replyTo.senderId as IUser).fullName
      : "";

  return (
    <div className="border-t border-gray-200 p-3">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 px-2 py-1 rounded bg-gray-50 border-l-2 border-primary">
          <span className="text-xs text-muted-foreground truncate">
            Replying to <strong>{replyAuthor}</strong>: {replyTo.content}
          </span>
          <button onClick={onCancelReply} className="p-0.5 hover:bg-gray-200 rounded">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create typing indicator**

Create `src/components/chat/typing-indicator.tsx`:

```typescript
"use client";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="px-4 py-1 text-xs text-muted-foreground flex items-center gap-1">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
      <span>{text}</span>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/message-bubble.tsx src/components/chat/message-input.tsx src/components/chat/typing-indicator.tsx
git commit -m "feat: add message bubble, input, and typing indicator components"
```

---

## Task 19: Chat Components — Conversation Header & Create Modal

**Files:**
- Create: `src/components/chat/conversation-header.tsx`
- Create: `src/components/chat/create-conversation-modal.tsx`

- [ ] **Step 1: Create conversation header**

Create `src/components/chat/conversation-header.tsx`:

```typescript
"use client";

import { IConversation, IUser, IPresence } from "@/types";
import { Phone, Video, Users } from "lucide-react";
import { OnlineBadge } from "./online-badge";

interface ConversationHeaderProps {
  conversation: IConversation;
  currentUserId: string;
  presenceMap: Map<string, IPresence>;
  onAudioCall: () => void;
  onVideoCall: () => void;
}

export function ConversationHeader({
  conversation,
  currentUserId,
  presenceMap,
  onAudioCall,
  onVideoCall,
}: ConversationHeaderProps) {
  const getDisplayName = () => {
    if (conversation.type === "group") return conversation.name;
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    return other?.fullName || "Unknown";
  };

  const getSubtext = () => {
    if (conversation.type === "group") {
      const count = conversation.participants.length;
      return `${count} members`;
    }
    const otherUser = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    if (!otherUser) return "";
    const presence = presenceMap.get(otherUser._id);
    return presence?.status === "online" ? "Online" : "Offline";
  };

  const isOtherOnline = () => {
    if (conversation.type !== "direct") return false;
    const other = conversation.participants.find(
      (p) => typeof p === "object" && (p as IUser)._id !== currentUserId
    ) as IUser | undefined;
    if (!other) return false;
    return presenceMap.get(other._id)?.status === "online";
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
            {conversation.type === "group" ? (
              <Users className="h-5 w-5" />
            ) : (
              getDisplayName().charAt(0).toUpperCase()
            )}
          </div>
          {conversation.type === "direct" && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <OnlineBadge isOnline={isOtherOnline()} />
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{getDisplayName()}</h3>
          <p className="text-xs text-muted-foreground">{getSubtext()}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onAudioCall}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Phone className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          onClick={onVideoCall}
          className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
        >
          <Video className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create conversation modal**

Create `src/components/chat/create-conversation-modal.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Modal, Select, Input, Radio } from "antd";
import { useGetUsersQuery } from "@/store/users-api";
import { useCreateConversationMutation } from "@/store/chat-api";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { IUser } from "@/types";

interface CreateConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function CreateConversationModal({ open, onClose, onCreated }: CreateConversationModalProps) {
  const [type, setType] = useState<"direct" | "group">("direct");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = ((usersData as { data?: IUser[] })?.data || []).filter(
    (u: IUser) => u._id !== currentUserId && !u.isDisabled
  );

  const [createConversation, { isLoading }] = useCreateConversationMutation();

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Select at least one member");
      return;
    }
    if (type === "group" && !groupName.trim()) {
      toast.error("Enter a group name");
      return;
    }

    try {
      const result = await createConversation({
        type,
        name: type === "group" ? groupName.trim() : undefined,
        participants: selectedUsers,
      }).unwrap();

      if (result.success) {
        toast.success(type === "group" ? "Group created" : "Conversation started");
        onCreated(result.data._id);
        handleClose();
      }
    } catch {
      toast.error("Failed to create conversation");
    }
  };

  const handleClose = () => {
    setType("direct");
    setSelectedUsers([]);
    setGroupName("");
    onClose();
  };

  return (
    <Modal
      title="New Conversation"
      open={open}
      onOk={handleCreate}
      onCancel={handleClose}
      confirmLoading={isLoading}
      okText="Start Chat"
    >
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Type</label>
          <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
            <Radio value="direct">Direct Message</Radio>
            <Radio value="group">Group Chat</Radio>
          </Radio.Group>
        </div>

        {type === "group" && (
          <div>
            <label className="text-sm font-medium mb-1 block">Group Name</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">
            {type === "direct" ? "Select Member" : "Select Members"}
          </label>
          <Select
            mode={type === "group" ? "multiple" : undefined}
            value={type === "direct" ? selectedUsers[0] : selectedUsers}
            onChange={(val) => setSelectedUsers(type === "direct" ? [val as string] : (val as string[]))}
            placeholder="Search members..."
            showSearch
            optionFilterProp="label"
            className="w-full"
            options={users.map((u: IUser) => ({ value: u._id, label: u.fullName }))}
          />
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/conversation-header.tsx src/components/chat/create-conversation-modal.tsx
git commit -m "feat: add conversation header and create conversation modal"
```

---

## Task 20: Chat Window Component

**Files:**
- Create: `src/components/chat/chat-window.tsx`

- [ ] **Step 1: Create chat window**

Create `src/components/chat/chat-window.tsx`:

```typescript
"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import {
  useGetMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useMarkConversationReadMutation,
  useHeartbeatMutation,
} from "@/store/chat-api";
import { IConversation, IMessage, IPresence, IUser } from "@/types";
import { ConversationHeader } from "./conversation-header";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import toast from "react-hot-toast";

interface ChatWindowProps {
  conversation: IConversation;
  presenceMap: Map<string, IPresence>;
  typingUsers: IPresence[];
  newMessages: IMessage[];
  onAudioCall: () => void;
  onVideoCall: () => void;
}

export function ChatWindow({
  conversation,
  presenceMap,
  typingUsers,
  newMessages,
  onAudioCall,
  onVideoCall,
}: ChatWindowProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<IMessage | null>(null);
  const [allMessages, setAllMessages] = useState<IMessage[]>([]);

  const { data: messagesData, isLoading } = useGetMessagesQuery({
    conversationId: conversation._id,
    limit: 30,
  });

  const [sendMessage] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [markRead] = useMarkConversationReadMutation();
  const [heartbeat] = useHeartbeatMutation();

  // Merge fetched messages with real-time messages
  useEffect(() => {
    const fetched = messagesData?.data || [];
    const existingIds = new Set(fetched.map((m: IMessage) => m._id));
    const newUnique = newMessages.filter(
      (m) => m.conversationId === conversation._id && !existingIds.has(m._id)
    );
    setAllMessages([...fetched, ...newUnique]);
  }, [messagesData, newMessages, conversation._id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // Mark as read on open
  useEffect(() => {
    markRead(conversation._id);
  }, [conversation._id, markRead]);

  const handleSend = useCallback(
    async (content: string, replyToId?: string) => {
      try {
        await sendMessage({
          conversationId: conversation._id,
          body: { content, type: "text", replyTo: replyToId },
        }).unwrap();
      } catch {
        toast.error("Failed to send message");
      }
    },
    [sendMessage, conversation._id]
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessage({ conversationId: conversation._id, messageId }).unwrap();
      } catch {
        toast.error("Failed to delete message");
      }
    },
    [deleteMessage, conversation._id]
  );

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      heartbeat({ typing: { conversationId: conversation._id, isTyping } });
    },
    [heartbeat, conversation._id]
  );

  // Typing user names for this conversation
  const typingNames = typingUsers
    .filter(
      (t) =>
        t.isTyping?.conversationId === conversation._id &&
        t.userId !== currentUserId
    )
    .map((t) => {
      const participant = conversation.participants.find(
        (p) => typeof p === "object" && (p as IUser)._id === t.userId
      ) as IUser | undefined;
      return participant?.fullName || "Someone";
    });

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader
        conversation={conversation}
        currentUserId={currentUserId}
        presenceMap={presenceMap}
        onAudioCall={onAudioCall}
        onVideoCall={onVideoCall}
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-8">Loading messages...</div>
        ) : allMessages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Say hello!
          </div>
        ) : (
          allMessages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={
                (typeof msg.senderId === "object"
                  ? (msg.senderId as IUser)._id
                  : msg.senderId) === currentUserId
              }
              onDelete={handleDelete}
              onReply={setReplyTo}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <TypingIndicator names={typingNames} />

      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-window.tsx
git commit -m "feat: add chat window component with messages, typing, and replies"
```

---

## Task 21: Call Components

**Files:**
- Create: `src/components/call/incoming-call.tsx`
- Create: `src/components/call/call-controls.tsx`
- Create: `src/components/call/participant-grid.tsx`
- Create: `src/components/call/in-call-chat.tsx`
- Create: `src/components/call/call-screen.tsx`

- [ ] **Step 1: Create incoming call overlay**

Create `src/components/call/incoming-call.tsx`:

```typescript
"use client";

import { Phone, PhoneOff } from "lucide-react";
import { ICallLog, IUser } from "@/types";

interface IncomingCallProps {
  callLog: ICallLog;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCall({ callLog, onAccept, onDecline }: IncomingCallProps) {
  const callerName =
    typeof callLog.initiatedBy === "object"
      ? (callLog.initiatedBy as IUser).fullName
      : "Unknown";

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-sm w-full mx-4 animate-in fade-in zoom-in">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-bold text-primary">{callerName.charAt(0)}</span>
        </div>
        <h3 className="text-lg font-semibold mb-1">{callerName}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Incoming {callLog.type} call...
        </p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onDecline}
            className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={onAccept}
            className="h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create call controls**

Create `src/components/call/call-controls.tsx`:

```typescript
"use client";

import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
} from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  callType: "audio" | "video";
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  callType,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-gray-900/80 rounded-2xl">
      <button
        onClick={onToggleMute}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
          isMuted ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>

      {callType === "video" && (
        <button
          onClick={onToggleCamera}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            isCameraOff ? "bg-red-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </button>
      )}

      <button
        onClick={onToggleScreenShare}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
          isScreenSharing ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
      >
        <Monitor className="h-5 w-5" />
      </button>

      <button
        onClick={onToggleChat}
        className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
          isChatOpen ? "bg-blue-500 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
        }`}
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      <button
        onClick={onEndCall}
        className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create participant grid**

Create `src/components/call/participant-grid.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { MicOff } from "lucide-react";

interface Participant {
  peerId: string;
  name: string;
  stream: MediaStream | null;
  isMuted?: boolean;
}

interface ParticipantGridProps {
  participants: Participant[];
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  localName: string;
}

function VideoTile({
  stream,
  name,
  isMuted,
  isLocal,
  isScreen,
}: {
  stream: MediaStream | null;
  name: string;
  isMuted?: boolean;
  isLocal?: boolean;
  isScreen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreen ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
        {name}
        {isLocal && " (You)"}
        {isScreen && " - Screen"}
      </div>
      {isMuted && (
        <div className="absolute top-2 right-2 p-1 rounded bg-red-500/80">
          <MicOff className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  );
}

export function ParticipantGrid({
  participants,
  localStream,
  screenStream,
  localName,
}: ParticipantGridProps) {
  const totalTiles = participants.length + 1 + (screenStream ? 1 : 0);

  const gridClass =
    totalTiles <= 1
      ? "grid-cols-1"
      : totalTiles <= 2
        ? "grid-cols-2"
        : totalTiles <= 4
          ? "grid-cols-2 grid-rows-2"
          : totalTiles <= 6
            ? "grid-cols-3 grid-rows-2"
            : "grid-cols-4 grid-rows-3";

  return (
    <div className={`flex-1 grid ${gridClass} gap-2 p-2`}>
      {screenStream && (
        <VideoTile stream={screenStream} name={localName} isLocal isScreen />
      )}
      <VideoTile stream={localStream} name={localName} isLocal />
      {participants.map((p) => (
        <VideoTile
          key={p.peerId}
          stream={p.stream}
          name={p.name}
          isMuted={p.isMuted}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create in-call chat panel**

Create `src/components/call/in-call-chat.tsx`:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";

interface InCallMessage {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface InCallChatProps {
  messages: InCallMessage[];
  onSend: (content: string) => void;
  onClose: () => void;
  currentUserId: string;
}

export function InCallChat({ messages, onSend, onClose, currentUserId }: InCallChatProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-medium text-white">In-call Chat</span>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i}>
            <span className="text-xs font-medium text-blue-400">
              {msg.senderId === currentUserId ? "You" : msg.senderName}
            </span>
            <p className="text-sm text-gray-200">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-gray-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create call screen (orchestrator component)**

Create `src/components/call/call-screen.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePeer } from "@/hooks/use-peer";
import { useCall } from "@/hooks/use-call";
import { ICallLog, IConversation, IUser } from "@/types";
import { CallControls } from "./call-controls";
import { ParticipantGrid } from "./participant-grid";
import { InCallChat } from "./in-call-chat";
import { MediaConnection, DataConnection } from "peerjs";

interface CallScreenProps {
  callLog: ICallLog;
  conversation: IConversation;
  isInitiator: boolean;
  onClose: () => void;
}

export function CallScreen({ callLog, conversation, isInitiator, onClose }: CallScreenProps) {
  const { data: session } = useSession();
  const currentUser = session?.user as unknown as { userId: string; fullName: string };
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { callPeer, connectData, onIncomingCall, onIncomingData, closeAllConnections } = usePeer({
    userId: currentUser.userId,
  });

  const call = useCall({ onCallEnded: onClose });

  // Start the call
  useEffect(() => {
    const setup = async () => {
      const stream = await call.startLocalStream(callLog.type);

      if (isInitiator) {
        await call.initiateCall(callLog.type, callLog);

        // When callee answers, they'll call us
        onIncomingCall((incomingCall: MediaConnection) => {
          incomingCall.answer(stream);
          incomingCall.on("stream", (remoteStream) => {
            const remotePeerId = incomingCall.peer;
            const remoteUserId = remotePeerId.replace("fp-", "");
            const remoteUser = conversation.participants.find(
              (p) => typeof p === "object" && (p as IUser)._id === remoteUserId
            ) as IUser | undefined;

            call.setParticipants((prev) => [
              ...prev.filter((p) => p.peerId !== remotePeerId),
              {
                peerId: remotePeerId,
                userId: remoteUserId,
                fullName: remoteUser?.fullName || "Unknown",
                stream: remoteStream,
                mediaConnection: incomingCall,
                dataConnection: null,
              },
            ]);
          });
        });
      } else {
        await call.acceptCall(callLog);

        // Call the initiator
        const initiatorId =
          typeof callLog.initiatedBy === "object"
            ? (callLog.initiatedBy as IUser)._id
            : callLog.initiatedBy;
        const remotePeerId = `fp-${initiatorId}`;
        const mediaConn = callPeer(remotePeerId, stream);

        if (mediaConn) {
          mediaConn.on("stream", (remoteStream) => {
            const initiatorUser = conversation.participants.find(
              (p) => typeof p === "object" && (p as IUser)._id === initiatorId
            ) as IUser | undefined;

            call.setParticipants((prev) => [
              ...prev.filter((p) => p.peerId !== remotePeerId),
              {
                peerId: remotePeerId,
                userId: initiatorId,
                fullName: initiatorUser?.fullName || "Unknown",
                stream: remoteStream,
                mediaConnection: mediaConn,
                dataConnection: null,
              },
            ]);
          });
        }
      }

      // Data channel for in-call chat
      onIncomingData((conn: DataConnection) => {
        conn.on("data", (data) => {
          const msg = data as { senderId: string; senderName: string; content: string };
          call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
        });
      });
    };

    setup();

    return () => {
      closeAllConnections();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendChatMessage = useCallback(
    (content: string) => {
      const msg = {
        senderId: currentUser.userId,
        senderName: currentUser.fullName,
        content,
      };

      // Send via data channel to all peers
      call.participants.forEach((p) => {
        if (p.dataConnection) {
          p.dataConnection.send(msg);
        } else {
          const conn = connectData(p.peerId);
          if (conn) {
            conn.on("open", () => conn.send(msg));
          }
        }
      });

      call.addInCallMessage({ ...msg, timestamp: new Date().toISOString() });
    },
    [call, connectData, currentUser]
  );

  const handleToggleScreenShare = useCallback(async () => {
    if (call.isScreenSharing) {
      call.stopScreenShare();
    } else {
      await call.startScreenShare();
    }
  }, [call]);

  return (
    <div className="fixed inset-0 z-[90] bg-gray-900 flex flex-col">
      <ParticipantGrid
        participants={call.participants.map((p) => ({
          peerId: p.peerId,
          name: p.fullName,
          stream: p.stream,
        }))}
        localStream={call.localStream}
        screenStream={call.screenStream}
        localName={currentUser.fullName}
      />

      <div className="flex items-center justify-center pb-6">
        <CallControls
          isMuted={call.isMuted}
          isCameraOff={call.isCameraOff}
          isScreenSharing={call.isScreenSharing}
          isChatOpen={isChatOpen}
          callType={call.callType}
          onToggleMute={call.toggleMute}
          onToggleCamera={call.toggleCamera}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          onEndCall={call.endCall}
        />
      </div>

      {isChatOpen && (
        <div className="absolute top-0 right-0 h-full">
          <InCallChat
            messages={call.inCallMessages}
            onSend={handleSendChatMessage}
            onClose={() => setIsChatOpen(false)}
            currentUserId={currentUser.userId}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/call/incoming-call.tsx src/components/call/call-controls.tsx src/components/call/participant-grid.tsx src/components/call/in-call-chat.tsx src/components/call/call-screen.tsx
git commit -m "feat: add call components — incoming call, controls, video grid, in-call chat, call screen"
```

---

## Task 22: Chat Page (Main Orchestrator)

**Files:**
- Create: `src/app/(dashboard)/chat/page.tsx`

- [ ] **Step 1: Create the chat page**

Create `src/app/(dashboard)/chat/page.tsx`:

```typescript
"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/use-polling";
import { usePush } from "@/hooks/use-push";
import { useHeartbeatMutation, useGetConversationsQuery } from "@/store/chat-api";
import { useInitiateCallMutation } from "@/store/calls-api";
import { IMessage, IPresence, ICallLog, IConversation } from "@/types";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { CreateConversationModal } from "@/components/chat/create-conversation-modal";
import { IncomingCall } from "@/components/call/incoming-call";
import { CallScreen } from "@/components/call/call-screen";
import { MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as unknown as { userId: string })?.userId;
  const searchParams = useSearchParams();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get("id")
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessages, setNewMessages] = useState<IMessage[]>([]);
  const [presenceList, setPresenceList] = useState<IPresence[]>([]);
  const [typingUsers, setTypingUsers] = useState<IPresence[]>([]);
  const [incomingCall, setIncomingCall] = useState<ICallLog | null>(null);
  const [activeCall, setActiveCall] = useState<{ callLog: ICallLog; isInitiator: boolean } | null>(null);

  const { data: conversationsData } = useGetConversationsQuery({ limit: 50 });
  const conversations = (conversationsData?.data || []) as IConversation[];
  const activeConversation = conversations.find((c) => c._id === activeConversationId) || null;

  const [initiateCall] = useInitiateCallMutation();
  const [heartbeat] = useHeartbeatMutation();

  // Push notifications
  usePush();

  // Heartbeat every 30 seconds
  const sendHeartbeat = useCallback(() => {
    heartbeat({});
  }, [heartbeat]);

  // Heartbeat interval
  useState(() => {
    const interval = setInterval(sendHeartbeat, 30000);
    sendHeartbeat(); // Initial heartbeat
    return () => clearInterval(interval);
  });

  // Presence map
  const presenceMap = useMemo(() => {
    const map = new Map<string, IPresence>();
    presenceList.forEach((p) => map.set(p.userId, p));
    return map;
  }, [presenceList]);

  // Polling handlers
  const handleMessages = useCallback((msgs: IMessage[]) => {
    setNewMessages((prev) => [...prev, ...msgs]);
  }, []);

  const handlePresence = useCallback((presence: IPresence[]) => {
    setPresenceList(presence);
  }, []);

  const handleTyping = useCallback((typing: IPresence[]) => {
    setTypingUsers(typing);
  }, []);

  const handleCalls = useCallback(
    (calls: ICallLog[]) => {
      // Check for incoming ringing calls
      const ringingCall = calls.find(
        (c) =>
          c.status === "ringing" &&
          (typeof c.initiatedBy === "object"
            ? (c.initiatedBy as { _id: string })._id
            : c.initiatedBy) !== currentUserId
      );
      if (ringingCall && !activeCall) {
        setIncomingCall(ringingCall);
      }
    },
    [currentUserId, activeCall]
  );

  // Start polling
  usePolling({
    activeConversationId,
    onMessages: handleMessages,
    onPresence: handlePresence,
    onTyping: handleTyping,
    onCalls: handleCalls,
    enabled: !!currentUserId,
  });

  const handleStartCall = useCallback(
    async (type: "audio" | "video") => {
      if (!activeConversationId) return;
      try {
        const result = await initiateCall({
          conversationId: activeConversationId,
          type,
        }).unwrap();
        if (result.success) {
          setActiveCall({ callLog: result.data, isInitiator: true });
        }
      } catch {
        toast.error("Failed to start call");
      }
    },
    [activeConversationId, initiateCall]
  );

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setActiveCall({ callLog: incomingCall, isInitiator: false });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const handleDeclineCall = useCallback(async () => {
    if (incomingCall) {
      await fetch(`/api/calls/${incomingCall._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "missed" }),
      });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 hidden md:block">
        <ChatSidebar
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          onCreateNew={() => setShowCreateModal(true)}
          presenceMap={presenceMap}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            presenceMap={presenceMap}
            typingUsers={typingUsers}
            newMessages={newMessages}
            onAudioCall={() => handleStartCall("audio")}
            onVideoCall={() => handleStartCall("video")}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Create conversation modal */}
      <CreateConversationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => setActiveConversationId(id)}
      />

      {/* Incoming call overlay */}
      {incomingCall && !activeCall && (
        <IncomingCall
          callLog={incomingCall}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Active call screen */}
      {activeCall && activeConversation && (
        <CallScreen
          callLog={activeCall.callLog}
          conversation={activeConversation}
          isInitiator={activeCall.isInitiator}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/chat/page.tsx
git commit -m "feat: add main chat page with polling, conversations, calls integration"
```

---

## Task 23: Update Service Worker Registration for Push

**Files:**
- Modify: `src/components/providers/sw-register.tsx`

- [ ] **Step 1: Update service worker registration**

Replace content of `src/components/providers/sw-register.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function ServiceWorkerRegister() {
  const { data: session } = useSession();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed silently
      });
    }
  }, []);

  // Auto-subscribe to push when logged in and permission granted
  useEffect(() => {
    if (!session?.user || !("PushManager" in window)) return;

    const autoSubscribe = async () => {
      if (Notification.permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return; // Already subscribed

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) return;

      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
      };

      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Push subscription failed silently
      }
    };

    autoSubscribe();
  }, [session]);

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/providers/sw-register.tsx
git commit -m "feat: auto-subscribe to push notifications on login"
```

---

## Task 24: Verify Build

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/cristain/Documents/projects/future-planning
npx tsc --noEmit
```

Expected: No errors. If there are type errors, fix them.

- [ ] **Step 2: Run Next.js build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Run the dev server and test**

```bash
npm run dev
```

Open `http://localhost:3000/chat` and verify:
1. Chat page loads with sidebar
2. Create conversation modal opens
3. Conversations list shows
4. Messages load when clicking a conversation
5. Can send and receive messages (open two browser tabs)
6. Typing indicator works
7. Online/offline status updates
8. Push notification permission prompt works

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build issues for chat and calls feature"
```
