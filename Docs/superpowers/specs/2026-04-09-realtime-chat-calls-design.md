# Real-Time Chat, Push Notifications & Video Calls

**Date:** 2026-04-09
**Status:** Approved
**Cost Target:** $0 (all free-tier services)

## Overview

Add real-time communication to Future Planning: direct messages, group chat, push notifications, and peer-to-peer video/audio calls with screen sharing — all at zero cost on Vercel.

## Architecture Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Real-time delivery | Adaptive polling (2s active, 30s idle) | Vercel has no WebSocket support |
| Background alerts | Web Push API with VAPID keys | Free W3C standard, no third party |
| Video/Audio | WebRTC via PeerJS | Free peer-to-peer, no media server |
| Signaling | PeerJS Cloud server | Free for small usage |
| STUN | Google (`stun:stun.l.google.com:19302`) | Free, reliable |
| TURN (fallback) | Metered.ca free tier (500MB/month) | Only used when P2P fails |
| Screen sharing | WebRTC `getDisplayMedia` | Built into browsers |
| In-call chat | PeerJS data channel | No server needed during call |
| Chat persistence | MongoDB (same Atlas instance) | No data fragmentation |

## Data Models

### Message

```
- _id
- conversationId (ref: Conversation)
- senderId (ref: User)
- content (string)
- type: "text" | "image" | "file" | "system"
- replyTo (ref: Message, optional)
- readBy: [{ userId, readAt }]
- isDeleted (boolean, soft delete)
- deletedAt (Date)
- timestamps (createdAt, updatedAt)
- Indexes: conversationId+createdAt, senderId
```

### Conversation

```
- _id
- type: "direct" | "group"
- name (string, for groups)
- participants: [ref: User]
- createdBy (ref: User)
- lastMessage: { content, senderId, createdAt } (denormalized)
- timestamps
- Indexes: participants, updatedAt
```

### Presence

```
- userId (ref: User, unique)
- status: "online" | "offline"
- lastSeen (Date)
- isTyping: { conversationId, since } (null when not typing)
- Indexes: userId (unique), status
```

### PushSubscription

```
- userId (ref: User)
- endpoint (string)
- keys: { p256dh, auth }
- deviceName (string, optional)
- createdAt
- Indexes: userId
```

### CallLog

```
- _id
- conversationId (ref: Conversation)
- initiatedBy (ref: User)
- participants: [{ userId, joinedAt, leftAt }]
- type: "audio" | "video"
- status: "ringing" | "active" | "ended" | "missed"
- startedAt, endedAt
- duration (number, seconds)
- timestamps
```

## API Routes (13 new endpoints)

### Real-Time Sync

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/realtime/sync?since={timestamp}` | Bundled sync: new messages, presence changes, typing state, incoming calls |
| POST | `/api/realtime/heartbeat` | Update online status and typing state |

### Chat

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/conversations` | List user's conversations |
| POST | `/api/conversations` | Create conversation (direct or group) |
| PUT | `/api/conversations/[id]` | Update group name/participants |
| GET | `/api/conversations/[id]/messages?before={cursor}` | Paginated messages (cursor-based) |
| POST | `/api/conversations/[id]/messages` | Send message |
| DELETE | `/api/conversations/[id]/messages/[msgId]` | Soft delete message |
| POST | `/api/conversations/[id]/read` | Mark conversation as read |

### Calls

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/calls` | Initiate call (creates CallLog, triggers push) |
| PATCH | `/api/calls/[id]` | Update call (answer, end, miss) |
| GET | `/api/calls/history` | Call history for user |

### Push Subscriptions

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/push/subscribe` | Save push subscription |
| DELETE | `/api/push/subscribe` | Remove subscription |

## Polling Engine

Single bundled endpoint returns all real-time state changes since last sync:

```
GET /api/realtime/sync?since={timestamp}

Response:
{
  messages: [new messages],
  presence: [changed statuses],
  typing: [who's typing where],
  calls: [incoming/active calls],
  serverTime: timestamp
}
```

### Adaptive Polling Strategy

| State | Interval | Trigger |
|-------|----------|---------|
| Conversation open | 2 seconds | User is actively chatting |
| App open, no chat focused | 30 seconds | Browsing other pages |
| Tab hidden/backgrounded | Stopped | `visibilitychange` event; Web Push takes over |
| Tab returns to foreground | Immediate catch-up sync, then resume | `visibilitychange` |
| Network offline | Stopped | `navigator.onLine`; show "Reconnecting..." banner |

### Presence

- Client sends heartbeat every 30 seconds
- Server marks user offline if no heartbeat for 60 seconds
- Typing state: sent on keypress, auto-clears after 3 seconds of inactivity

## Video/Audio Call Flow

### 1-on-1 Calls

```
1. Caller → POST /api/calls (status: "ringing")
2. Server sends Web Push to callee
3. Callee sees incoming call via sync polling / push notification
4. Both connect via PeerJS Cloud signaling
5. WebRTC peer-to-peer established (STUN: Google free servers)
6. getUserMedia() for camera/mic
7. getDisplayMedia() for screen sharing
8. Data channel for in-call text chat
9. On hang up → PATCH /api/calls/[id] (status: "ended", duration calculated)
```

### Group Calls

- Mesh topology: each participant connects to every other participant
- Maximum 12 peers — mesh is viable at this scale
- Late join: new participant connects to all existing peers
- PeerJS manages peer discovery

### TURN Fallback

Most connections work with STUN only. When peer-to-peer fails (strict NAT/firewall):
- Metered.ca free tier provides 500MB/month TURN relay
- For 12 members with occasional TURN usage, this is sufficient

## Push Notifications

### Setup

- Generate VAPID key pair (one-time, stored in env)
- Service worker handles `push` and `notificationclick` events
- User subscribes via `PushManager.subscribe()`
- Subscription saved to PushSubscription collection

### When to Push

| Event | Push if |
|-------|---------|
| New message | User is offline or tab is hidden |
| Incoming call | Always (urgent) |
| Missed call | User was offline |

### When NOT to Push

- User is actively viewing that conversation (check presence + active conversation)
- User has disabled notifications for that conversation (future enhancement)

## Components

### Chat

```
components/chat/
├── chat-sidebar.tsx          — conversation list, search, unread badges
├── chat-window.tsx           — messages view + input
├── message-bubble.tsx        — single message with reply, delete
├── message-input.tsx         — text input, file attach, reply preview
├── typing-indicator.tsx      — "X is typing..." animation
├── conversation-header.tsx   — name, online dot, call buttons
├── create-conversation.tsx   — modal for new DM or group
├── online-badge.tsx          — green/gray status dot
└── unread-count.tsx          — red badge number
```

### Call

```
components/call/
├── call-screen.tsx           — full-screen video/audio layout
├── call-controls.tsx         — mute, camera, screen share, hang up, chat
├── incoming-call.tsx         — ringing overlay with accept/reject
├── participant-grid.tsx      — auto-adjusting video tile grid (1-12)
├── in-call-chat.tsx          — side panel chat via data channel
└── call-history.tsx          — past calls with duration
```

### Pages

```
app/(dashboard)/chat/page.tsx        — main chat (sidebar + window)
app/(dashboard)/chat/[id]/page.tsx   — direct link to conversation
```

### Modified Existing Components

- `sidebar.tsx` — add Chat nav link with unread badge
- `header.tsx` — add chat icon with total unread count
- `notification-bell.tsx` — integrate incoming call alerts

### Hooks

```
hooks/
├── use-polling.ts    — adaptive polling engine
├── use-peer.ts       — PeerJS connection lifecycle
├── use-call.ts       — call state machine (idle → ringing → active → ended)
└── use-push.ts       — push subscription management
```

### RTK Query Slices

```
store/
├── chat-api.ts       — conversations, messages CRUD
├── calls-api.ts      — call history
└── realtime-api.ts   — sync endpoint, heartbeat
```

## Edge Cases

### Chat

- **Offline sending:** Queue locally, retry on reconnect. Show sent/sending/failed status
- **Message ordering:** Server `createdAt` is authoritative, not client time
- **Deleted messages:** Soft delete, show "This message was deleted" placeholder
- **Large history:** Load last 30 messages, infinite scroll up with cursor pagination

### Calls

- **Missed call:** 30-second timeout, then mark as missed
- **Call dropped:** PeerJS `close` event triggers cleanup + CallLog update
- **Multiple tabs:** `BroadcastChannel` API ensures only one tab handles the call
- **Group late join:** New peer connects to all existing peers on entry

### Push

- **Permission denied:** Chat works via polling. Show banner suggesting to enable
- **Subscription expired:** Re-subscribe on next visit
- **Duplicate notifications:** Don't push if user has the conversation open

### Security

- API checks `userId` is in `conversation.participants` for all message/call access
- Rate limit: max 1 message per second per user
- Sanitize message content before rendering (XSS prevention)

## Dependencies (New)

| Package | Purpose | Cost |
|---------|---------|------|
| `peerjs` | WebRTC abstraction + free signaling server | Free |
| `web-push` | Server-side Web Push API | Free |

## Environment Variables (New)

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # Generated VAPID public key
VAPID_PRIVATE_KEY=              # Generated VAPID private key
VAPID_EMAIL=mailto:admin@...    # Contact email for push service
METERED_TURN_URL=               # Metered.ca TURN server URL
METERED_TURN_USERNAME=          # Metered.ca credential
METERED_TURN_PASSWORD=          # Metered.ca credential
NEXT_PUBLIC_PEERJS_HOST=0.peerjs.com  # PeerJS cloud server
```

## Cost Summary

| Service | Free Tier Limit | Our Usage | Headroom |
|---------|----------------|-----------|----------|
| Vercel Hobby | 100 GB-hrs/month | ~5 GB-hrs | 95% free |
| MongoDB Atlas | 512 MB | ~50-100 MB with chat | 80%+ free |
| PeerJS Cloud | Unlimited (small scale) | 12 users | Plenty |
| Google STUN | Unlimited | 12 users | Unlimited |
| Metered.ca TURN | 500 MB/month | Occasional fallback | Plenty |
| Web Push | Free (browser vendors) | 12 users | Unlimited |

**Total monthly cost: $0**
