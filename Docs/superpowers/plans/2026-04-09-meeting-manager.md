# Meeting Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive Meeting Manager with Google Calendar API integration, calendar views, attendance tracking, minutes, and action items.

**Architecture:** Next.js 16 App Router with Mongoose models, RTK Query client state, Google Calendar API for event sync/Meet links, Resend for emails, and Ant Design + Tailwind for UI. All meetings stored in MongoDB with Google Calendar as the sync target.

**Tech Stack:** Next.js 16, React 19, TypeScript, MongoDB/Mongoose, RTK Query, Google Calendar API (googleapis), Resend, Ant Design, Tailwind CSS, Lucide icons, Zod

**Spec:** `docs/superpowers/specs/2026-04-09-meeting-manager-design.md`

---

## File Structure

### New Files

```
src/models/Meeting.ts                              — Mongoose model + IDocument interface
src/validations/meeting.ts                          — Zod schemas for meeting CRUD
src/lib/google/calendar.ts                          — Google Calendar API helper (create/update/delete events, token refresh)
src/lib/google/encrypt.ts                           — AES-256 token encryption/decryption
src/lib/meeting-notifications.ts                    — Helper to create meeting-related notifications
src/lib/email/templates/meeting-invite.tsx           — Meeting invite email template
src/lib/email/templates/meeting-cancelled.tsx        — Meeting cancelled email template
src/lib/email/templates/meeting-reminder.tsx         — Meeting reminder email template
src/lib/email/templates/meeting-minutes.tsx          — Finalized minutes email template
src/app/api/auth/google/route.ts                    — GET: initiate OAuth, DELETE: disconnect
src/app/api/auth/google/callback/route.ts           — GET: OAuth callback handler
src/app/api/meetings/route.ts                       — GET: list meetings, POST: create meeting
src/app/api/meetings/[id]/route.ts                  — GET/PUT/DELETE: single meeting CRUD
src/app/api/meetings/[id]/attendance/route.ts        — POST: admin mark attendance
src/app/api/meetings/[id]/checkin/route.ts           — POST: member self-check-in
src/app/api/meetings/[id]/minutes/route.ts           — GET/PUT: meeting minutes
src/app/api/meetings/[id]/minutes/send/route.ts      — POST: email finalized minutes
src/app/api/meetings/[id]/remind/route.ts            — POST: send reminder email
src/app/api/meetings/action-items/route.ts           — GET: list action items across meetings
src/app/api/meetings/action-items/[id]/route.ts      — PUT: update action item status
src/store/meetings-api.ts                            — RTK Query API slice for meetings
src/components/meetings/calendar-month-view.tsx       — Month grid calendar
src/components/meetings/calendar-week-view.tsx        — Week time-grid view
src/components/meetings/calendar-day-view.tsx         — Day timeline view
src/components/meetings/calendar-agenda-view.tsx      — Agenda list view
src/components/meetings/meeting-form-modal.tsx        — Create/edit meeting modal
src/components/meetings/meeting-detail-drawer.tsx     — Meeting detail view with tabs
src/components/meetings/attendance-tab.tsx            — Attendance management tab
src/components/meetings/minutes-tab.tsx               — Minutes editor tab (structured + freeform)
src/components/meetings/action-items-tab.tsx          — Action items management tab
src/components/meetings/calendar-header.tsx           — View toggle + navigation + new meeting btn
src/components/dashboard/upcoming-meetings.tsx        — Member dashboard widget
src/components/dashboard/my-action-items.tsx          — Member dashboard widget
src/app/(admin)/admin/meetings/page.tsx              — Admin meetings page
src/app/(dashboard)/dashboard/meetings/page.tsx      — Member meetings page
src/app/(admin)/admin/settings/google-account.tsx    — Google account connection section
```

### Modified Files

```
src/models/User.ts                                  — Add googleTokens field
src/models/Notification.ts                           — Add meeting notification types
src/types/index.ts                                   — Add Meeting, ActionItem types
src/store/api.ts                                     — Add "Meetings", "MeetingDetail", "ActionItems" tag types
src/lib/email/send.ts                                — Add meeting email types to SendEmailOptions
src/components/layout/sidebar.tsx                    — Add "Meetings" menu item
src/components/dashboard/member-dashboard.tsx         — Add upcoming meetings + action items widgets
src/middleware.ts                                     — Add /dashboard/meetings to matcher (already covered by /dashboard/:path*)
```

---

## Task 1: Install Dependencies & Environment Setup

**Files:**
- Modify: `package.json`
- Create: `.env.local` entries (manual)

- [ ] **Step 1: Install googleapis package**

```bash
cd /Users/cristain/Documents/projects/future-planning
npm install googleapis
```

- [ ] **Step 2: Add environment variables to .env.local**

Add these lines (values to be filled after Google Cloud setup):

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=
```

Generate a random encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(meetings): install googleapis dependency"
```

---

## Task 2: Token Encryption Utility

**Files:**
- Create: `src/lib/google/encrypt.ts`

- [ ] **Step 1: Create encryption utility**

```typescript
// src/lib/google/encrypt.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY environment variable is required");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/google/encrypt.ts
git commit -m "feat(meetings): add AES-256-GCM token encryption utility"
```

---

## Task 3: Meeting Types & Update Existing Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Meeting-related types to the end of src/types/index.ts**

```typescript
// --- Meeting Manager Types ---

export interface IAttendanceRecord {
  user: string | IUser;
  status: "present" | "absent" | "excused" | "not_marked";
  checkInTime: string | null;
  markedBy: "self" | "admin";
  markedByAdmin: string | null;
}

export interface IActionItem {
  _id: string;
  title: string;
  assignee: string | IUser;
  dueDate: string;
  status: "pending" | "done";
}

export interface IMeetingMinutes {
  mode: "structured" | "freeform";
  freeformContent: string;
  agendaItems: {
    title: string;
    discussion: string;
    decision: string;
  }[];
  decisions: string[];
  actionItems: IActionItem[];
  status: "draft" | "finalized";
  finalizedAt: string | null;
}

export interface IReminderRecord {
  sentAt: string;
  sentBy: string | IUser;
}

export interface IMeeting {
  _id: string;
  title: string;
  description: string;
  agenda: string[];
  date: string;
  duration: number;
  type: "regular" | "special" | "emergency";
  googleEventId: string | null;
  meetLink: string | null;
  invitees: (string | IUser)[];
  attendance: IAttendanceRecord[];
  minutes: IMeetingMinutes;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  cancelledReason: string;
  reminderSent: IReminderRecord[];
  createdBy: string | IUser;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(meetings): add Meeting types to types/index.ts"
```

---

## Task 4: Meeting Mongoose Model

**Files:**
- Create: `src/models/Meeting.ts`

- [ ] **Step 1: Create Meeting model**

```typescript
// src/models/Meeting.ts
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IActionItemSubDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  assignee: mongoose.Types.ObjectId;
  dueDate: Date;
  status: "pending" | "done";
}

export interface IMeetingDocument extends Document {
  title: string;
  description: string;
  agenda: string[];
  date: Date;
  duration: number;
  type: "regular" | "special" | "emergency";
  googleEventId: string | null;
  meetLink: string | null;
  invitees: mongoose.Types.ObjectId[];
  attendance: {
    user: mongoose.Types.ObjectId;
    status: "present" | "absent" | "excused" | "not_marked";
    checkInTime: Date | null;
    markedBy: "self" | "admin";
    markedByAdmin: mongoose.Types.ObjectId | null;
  }[];
  minutes: {
    mode: "structured" | "freeform";
    freeformContent: string;
    agendaItems: {
      title: string;
      discussion: string;
      decision: string;
    }[];
    decisions: string[];
    actionItems: IActionItemSubDoc[];
    status: "draft" | "finalized";
    finalizedAt: Date | null;
  };
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  cancelledReason: string;
  reminderSent: {
    sentAt: Date;
    sentBy: mongoose.Types.ObjectId;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema({
  title: { type: String, required: true },
  assignee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ["pending", "done"], default: "pending" },
});

const MeetingSchema = new Schema<IMeetingDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    agenda: [{ type: String }],
    date: { type: Date, required: true },
    duration: { type: Number, required: true, min: 15 },
    type: { type: String, enum: ["regular", "special", "emergency"], default: "regular" },
    googleEventId: { type: String, default: null },
    meetLink: { type: String, default: null },
    invitees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendance: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
          type: String,
          enum: ["present", "absent", "excused", "not_marked"],
          default: "not_marked",
        },
        checkInTime: { type: Date, default: null },
        markedBy: { type: String, enum: ["self", "admin"], default: "admin" },
        markedByAdmin: { type: Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],
    minutes: {
      mode: { type: String, enum: ["structured", "freeform"], default: "structured" },
      freeformContent: { type: String, default: "" },
      agendaItems: [
        {
          title: { type: String },
          discussion: { type: String, default: "" },
          decision: { type: String, default: "" },
        },
      ],
      decisions: [{ type: String }],
      actionItems: [ActionItemSchema],
      status: { type: String, enum: ["draft", "finalized"], default: "draft" },
      finalizedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    cancelledReason: { type: String, default: "" },
    reminderSent: [
      {
        sentAt: { type: Date, required: true },
        sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

MeetingSchema.index({ date: 1, status: 1 });
MeetingSchema.index({ "attendance.user": 1 });
MeetingSchema.index({ "minutes.actionItems.assignee": 1, "minutes.actionItems.status": 1 });
MeetingSchema.index({ createdBy: 1 });
MeetingSchema.index({ googleEventId: 1 });
MeetingSchema.index({ invitees: 1 });

const Meeting =
  mongoose.models.Meeting || mongoose.model<IMeetingDocument>("Meeting", MeetingSchema);
export default Meeting;
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Meeting.ts
git commit -m "feat(meetings): add Meeting mongoose model with attendance and minutes"
```

---

## Task 5: Update User Model with Google Tokens

**Files:**
- Modify: `src/models/User.ts`

- [ ] **Step 1: Read the current User model to find exact insertion point**

Read `src/models/User.ts` and find the schema fields section.

- [ ] **Step 2: Add googleTokens field to User schema**

Add to the IUserDocument interface:

```typescript
googleTokens: {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope: string;
} | null;
```

Add to the UserSchema fields:

```typescript
googleTokens: {
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  scope: { type: String },
},
```

Note: Tokens are encrypted before storage by the Google Calendar helper, not by Mongoose.

- [ ] **Step 3: Commit**

```bash
git add src/models/User.ts
git commit -m "feat(meetings): add googleTokens field to User model"
```

---

## Task 6: Zod Validation Schemas

**Files:**
- Create: `src/validations/meeting.ts`

- [ ] **Step 1: Create validation schemas**

```typescript
// src/validations/meeting.ts
import { z } from "zod";

export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().or(z.literal("")),
  agenda: z.array(z.string().min(1)).default([]),
  date: z.string().min(1, "Date is required").refine(
    (val) => new Date(val) > new Date(),
    "Meeting date must be in the future"
  ),
  duration: z.number().int().min(15, "Minimum 15 minutes").max(480, "Maximum 8 hours"),
  type: z.enum(["regular", "special", "emergency"]).default("regular"),
  invitees: z.array(z.string().min(1)).min(1, "At least one invitee is required"),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().or(z.literal("")),
  agenda: z.array(z.string()).optional(),
  date: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  type: z.enum(["regular", "special", "emergency"]).optional(),
  invitees: z.array(z.string()).optional(),
});

export const attendanceSchema = z.object({
  attendance: z.array(
    z.object({
      userId: z.string().min(1),
      status: z.enum(["present", "absent", "excused"]),
    })
  ),
});

export const minutesSchema = z.object({
  mode: z.enum(["structured", "freeform"]),
  freeformContent: z.string().optional().or(z.literal("")),
  agendaItems: z
    .array(
      z.object({
        title: z.string(),
        discussion: z.string().optional().or(z.literal("")),
        decision: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
  decisions: z.array(z.string()).optional(),
  actionItems: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string().min(1, "Title is required"),
        assignee: z.string().min(1, "Assignee is required"),
        dueDate: z.string().min(1, "Due date is required"),
        status: z.enum(["pending", "done"]).default("pending"),
      })
    )
    .optional(),
  finalize: z.boolean().optional(),
});

export const actionItemUpdateSchema = z.object({
  status: z.enum(["pending", "done"]),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type AttendanceInput = z.infer<typeof attendanceSchema>;
export type MinutesInput = z.infer<typeof minutesSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/validations/meeting.ts
git commit -m "feat(meetings): add Zod validation schemas for meetings"
```

---

## Task 7: Google Calendar API Helper

**Files:**
- Create: `src/lib/google/calendar.ts`

- [ ] **Step 1: Create Google Calendar helper**

```typescript
// src/lib/google/calendar.ts
import { google, calendar_v3 } from "googleapis";
import { encrypt, decrypt } from "./encrypt";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export function getAuthUrl(state: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state,
    prompt: "consent",
  });
}

export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function saveTokens(
  userId: string,
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null; scope?: string }
) {
  await dbConnect();
  await User.findByIdAndUpdate(userId, {
    googleTokens: {
      accessToken: tokens.access_token ? encrypt(tokens.access_token) : "",
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : "",
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
      scope: tokens.scope || SCOPES.join(" "),
    },
  });
}

export async function removeTokens(userId: string) {
  await dbConnect();
  await User.findByIdAndUpdate(userId, { googleTokens: null });
}

async function getAuthenticatedClient(userId: string): Promise<calendar_v3.Calendar | null> {
  await dbConnect();
  const user = await User.findById(userId).select("googleTokens");
  if (!user?.googleTokens?.accessToken) return null;

  const accessToken = decrypt(user.googleTokens.accessToken);
  const refreshToken = decrypt(user.googleTokens.refreshToken);

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: user.googleTokens.expiresAt?.getTime(),
  });

  // Check if token needs refresh (within 5 minutes of expiry)
  const now = Date.now();
  const expiresAt = user.googleTokens.expiresAt?.getTime() || 0;
  if (expiresAt - now < 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await saveTokens(userId, {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        expiry_date: credentials.expiry_date,
        scope: credentials.scope || undefined,
      });
      oauth2Client.setCredentials(credentials);
    } catch {
      // Token revoked — clear tokens
      await removeTokens(userId);
      return null;
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export interface CreateEventParams {
  userId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
}

export async function createCalendarEvent(params: CreateEventParams) {
  const calendar = await getAuthenticatedClient(params.userId);
  if (!calendar) return null;

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: params.title,
        description: params.description,
        start: { dateTime: params.startTime.toISOString(), timeZone: "Asia/Kolkata" },
        end: { dateTime: params.endTime.toISOString(), timeZone: "Asia/Kolkata" },
        attendees: params.attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meeting-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        reminders: { useDefault: false, overrides: [] },
      },
    });

    return {
      googleEventId: response.data.id || null,
      meetLink: response.data.hangoutLink || null,
    };
  } catch (error) {
    console.error("Failed to create Google Calendar event:", error);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  googleEventId: string,
  updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendeeEmails?: string[];
  }
) {
  const calendar = await getAuthenticatedClient(userId);
  if (!calendar) return false;

  try {
    const requestBody: calendar_v3.Schema$Event = {};
    if (updates.title) requestBody.summary = updates.title;
    if (updates.description) requestBody.description = updates.description;
    if (updates.startTime) {
      requestBody.start = { dateTime: updates.startTime.toISOString(), timeZone: "Asia/Kolkata" };
    }
    if (updates.endTime) {
      requestBody.end = { dateTime: updates.endTime.toISOString(), timeZone: "Asia/Kolkata" };
    }
    if (updates.attendeeEmails) {
      requestBody.attendees = updates.attendeeEmails.map((email) => ({ email }));
    }

    await calendar.events.patch({
      calendarId: "primary",
      eventId: googleEventId,
      sendUpdates: "all",
      requestBody,
    });

    return true;
  } catch (error) {
    console.error("Failed to update Google Calendar event:", error);
    return false;
  }
}

export async function deleteCalendarEvent(userId: string, googleEventId: string) {
  const calendar = await getAuthenticatedClient(userId);
  if (!calendar) return false;

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
      sendUpdates: "all",
    });
    return true;
  } catch (error) {
    console.error("Failed to delete Google Calendar event:", error);
    return false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/google/calendar.ts
git commit -m "feat(meetings): add Google Calendar API helper with token management"
```

---

## Task 8: Meeting Notification Helpers

**Files:**
- Create: `src/lib/meeting-notifications.ts`
- Modify: `src/models/Notification.ts`

- [ ] **Step 1: Update Notification model type enum**

In `src/models/Notification.ts`, update the type enum in both the interface and schema:

Change:
```typescript
type: "payment_recorded" | "notice_posted";
```
To:
```typescript
type: "payment_recorded" | "notice_posted" | "meeting_created" | "meeting_updated" | "meeting_cancelled" | "action_item_assigned";
```

Update the schema enum array to match.

- [ ] **Step 2: Create meeting notification helpers**

```typescript
// src/lib/meeting-notifications.ts
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

export async function createMeetingNotification(
  type: "meeting_created" | "meeting_updated" | "meeting_cancelled" | "action_item_assigned",
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
```

- [ ] **Step 3: Commit**

```bash
git add src/models/Notification.ts src/lib/meeting-notifications.ts
git commit -m "feat(meetings): add meeting notification types and helpers"
```

---

## Task 9: Email Templates

**Files:**
- Create: `src/lib/email/templates/meeting-invite.tsx`
- Create: `src/lib/email/templates/meeting-cancelled.tsx`
- Create: `src/lib/email/templates/meeting-reminder.tsx`
- Create: `src/lib/email/templates/meeting-minutes.tsx`
- Modify: `src/lib/email/send.ts`

- [ ] **Step 1: Update SendEmailOptions type in send.ts**

In `src/lib/email/send.ts`, add meeting types to the `type` union:

Change:
```typescript
type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed";
```
To:
```typescript
type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed" | "meeting_invite" | "meeting_cancelled" | "meeting_reminder" | "meeting_minutes";
```

- [ ] **Step 2: Create meeting invite email template**

```tsx
// src/lib/email/templates/meeting-invite.tsx
import { Text, Section, Hr, Link } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingInviteProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  meetingType: string;
  agenda: string[];
  meetLink: string | null;
  organizer: string;
  foundationName?: string;
}

export function MeetingInviteEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  duration,
  meetingType,
  agenda,
  meetLink,
  organizer,
  foundationName = "Future Planning",
}: MeetingInviteProps) {
  return (
    <EmailLayout preview={`Meeting: ${meetingTitle}`} foundationName={foundationName}>
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        You have been invited to a {meetingType} meeting.
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>{meetingTitle}</Text>
        <Hr style={divider} />
        <Text style={detailRow}><strong>Date:</strong> {meetingDate}</Text>
        <Text style={detailRow}><strong>Time:</strong> {meetingTime}</Text>
        <Text style={detailRow}><strong>Duration:</strong> {duration}</Text>
        <Text style={detailRow}><strong>Organized by:</strong> {organizer}</Text>
        {meetLink && (
          <Text style={detailRow}>
            <strong>Join Meeting:</strong>{" "}
            <Link href={meetLink} style={linkStyle}>{meetLink}</Link>
          </Text>
        )}
      </Section>

      {agenda.length > 0 && (
        <Section style={agendaBox}>
          <Text style={agendaTitle}>Agenda</Text>
          {agenda.map((item, i) => (
            <Text key={i} style={agendaItem}>
              {i + 1}. {item}
            </Text>
          ))}
        </Section>
      )}

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = { fontSize: "16px", lineHeight: "24px", color: "#18181b", margin: "0 0 16px" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "0 0 16px" };
const detailBox = { backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "20px", margin: "16px 0" };
const detailTitle = { fontSize: "16px", fontWeight: "700" as const, color: "#0a9396", margin: "0 0 8px", textAlign: "center" as const };
const divider = { borderColor: "#e4e4e7", margin: "12px 0" };
const detailRow = { fontSize: "13px", color: "#18181b", margin: "4px 0", lineHeight: "20px" };
const linkStyle = { color: "#0a9396", textDecoration: "underline" };
const agendaBox = { margin: "16px 0" };
const agendaTitle = { fontSize: "14px", fontWeight: "600" as const, color: "#18181b", margin: "0 0 8px" };
const agendaItem = { fontSize: "13px", color: "#3f3f46", margin: "2px 0", lineHeight: "20px" };
const regards = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "24px 0 0" };
```

- [ ] **Step 3: Create meeting cancelled email template**

```tsx
// src/lib/email/templates/meeting-cancelled.tsx
import { Text, Section, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingCancelledProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  reason: string;
  cancelledBy: string;
  foundationName?: string;
}

export function MeetingCancelledEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  reason,
  cancelledBy,
  foundationName = "Future Planning",
}: MeetingCancelledProps) {
  return (
    <EmailLayout preview={`Meeting Cancelled: ${meetingTitle}`} foundationName={foundationName}>
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        The following meeting has been cancelled.
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Cancelled</Text>
        <Hr style={divider} />
        <Text style={detailRow}><strong>Meeting:</strong> {meetingTitle}</Text>
        <Text style={detailRow}><strong>Was scheduled for:</strong> {meetingDate} at {meetingTime}</Text>
        <Text style={detailRow}><strong>Cancelled by:</strong> {cancelledBy}</Text>
        {reason && <Text style={detailRow}><strong>Reason:</strong> {reason}</Text>}
      </Section>

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = { fontSize: "16px", lineHeight: "24px", color: "#18181b", margin: "0 0 16px" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "0 0 16px" };
const detailBox = { backgroundColor: "#fff5f5", border: "1px solid #fecaca", borderRadius: "6px", padding: "20px", margin: "16px 0" };
const detailTitle = { fontSize: "16px", fontWeight: "700" as const, color: "#dc2626", margin: "0 0 8px", textAlign: "center" as const };
const divider = { borderColor: "#fecaca", margin: "12px 0" };
const detailRow = { fontSize: "13px", color: "#18181b", margin: "4px 0", lineHeight: "20px" };
const regards = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "24px 0 0" };
```

- [ ] **Step 4: Create meeting reminder email template**

```tsx
// src/lib/email/templates/meeting-reminder.tsx
import { Text, Section, Hr, Link } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingReminderProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  duration: string;
  agenda: string[];
  meetLink: string | null;
  foundationName?: string;
}

export function MeetingReminderEmail({
  memberName,
  meetingTitle,
  meetingDate,
  meetingTime,
  duration,
  agenda,
  meetLink,
  foundationName = "Future Planning",
}: MeetingReminderProps) {
  return (
    <EmailLayout preview={`Reminder: ${meetingTitle}`} foundationName={foundationName}>
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        This is a reminder about an upcoming meeting.
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Reminder</Text>
        <Hr style={divider} />
        <Text style={detailRow}><strong>Meeting:</strong> {meetingTitle}</Text>
        <Text style={detailRow}><strong>Date:</strong> {meetingDate}</Text>
        <Text style={detailRow}><strong>Time:</strong> {meetingTime}</Text>
        <Text style={detailRow}><strong>Duration:</strong> {duration}</Text>
        {meetLink && (
          <Text style={detailRow}>
            <strong>Join Meeting:</strong>{" "}
            <Link href={meetLink} style={linkStyle}>{meetLink}</Link>
          </Text>
        )}
      </Section>

      {agenda.length > 0 && (
        <Section>
          <Text style={agendaTitle}>Agenda</Text>
          {agenda.map((item, i) => (
            <Text key={i} style={agendaItem}>
              {i + 1}. {item}
            </Text>
          ))}
        </Section>
      )}

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = { fontSize: "16px", lineHeight: "24px", color: "#18181b", margin: "0 0 16px" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "0 0 16px" };
const detailBox = { backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", padding: "20px", margin: "16px 0" };
const detailTitle = { fontSize: "16px", fontWeight: "700" as const, color: "#d97706", margin: "0 0 8px", textAlign: "center" as const };
const divider = { borderColor: "#fde68a", margin: "12px 0" };
const detailRow = { fontSize: "13px", color: "#18181b", margin: "4px 0", lineHeight: "20px" };
const linkStyle = { color: "#0a9396", textDecoration: "underline" };
const agendaTitle = { fontSize: "14px", fontWeight: "600" as const, color: "#18181b", margin: "0 0 8px" };
const agendaItem = { fontSize: "13px", color: "#3f3f46", margin: "2px 0", lineHeight: "20px" };
const regards = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "24px 0 0" };
```

- [ ] **Step 5: Create meeting minutes email template**

```tsx
// src/lib/email/templates/meeting-minutes.tsx
import { Text, Section, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

interface MeetingMinutesEmailProps {
  memberName: string;
  meetingTitle: string;
  meetingDate: string;
  decisions: string[];
  actionItems: { title: string; assigneeName: string; dueDate: string }[];
  summary: string;
  foundationName?: string;
}

export function MeetingMinutesEmail({
  memberName,
  meetingTitle,
  meetingDate,
  decisions,
  actionItems,
  summary,
  foundationName = "Future Planning",
}: MeetingMinutesEmailProps) {
  return (
    <EmailLayout preview={`Minutes: ${meetingTitle}`} foundationName={foundationName}>
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        The minutes for the following meeting have been finalized.
      </Text>

      <Section style={detailBox}>
        <Text style={detailTitle}>Meeting Minutes</Text>
        <Text style={subtitle}>{meetingTitle} - {meetingDate}</Text>
        <Hr style={divider} />

        {summary && <Text style={detailRow}>{summary}</Text>}

        {decisions.length > 0 && (
          <>
            <Text style={sectionTitle}>Decisions</Text>
            {decisions.map((d, i) => (
              <Text key={i} style={listItem}>&#8226; {d}</Text>
            ))}
          </>
        )}

        {actionItems.length > 0 && (
          <>
            <Text style={sectionTitle}>Action Items</Text>
            {actionItems.map((item, i) => (
              <Text key={i} style={listItem}>
                &#8226; {item.title} — assigned to {item.assigneeName} (due: {item.dueDate})
              </Text>
            ))}
          </>
        )}
      </Section>

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = { fontSize: "16px", lineHeight: "24px", color: "#18181b", margin: "0 0 16px" };
const paragraph = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "0 0 16px" };
const detailBox = { backgroundColor: "#fafafa", border: "1px solid #e4e4e7", borderRadius: "6px", padding: "20px", margin: "16px 0" };
const detailTitle = { fontSize: "16px", fontWeight: "700" as const, color: "#0a9396", margin: "0 0 4px", textAlign: "center" as const };
const subtitle = { fontSize: "13px", color: "#71717a", margin: "0 0 8px", textAlign: "center" as const };
const divider = { borderColor: "#e4e4e7", margin: "12px 0" };
const detailRow = { fontSize: "13px", color: "#18181b", margin: "4px 0", lineHeight: "20px" };
const sectionTitle = { fontSize: "14px", fontWeight: "600" as const, color: "#18181b", margin: "12px 0 4px" };
const listItem = { fontSize: "13px", color: "#3f3f46", margin: "2px 0", lineHeight: "20px" };
const regards = { fontSize: "14px", lineHeight: "24px", color: "#3f3f46", margin: "24px 0 0" };
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/email/send.ts src/lib/email/templates/meeting-invite.tsx src/lib/email/templates/meeting-cancelled.tsx src/lib/email/templates/meeting-reminder.tsx src/lib/email/templates/meeting-minutes.tsx
git commit -m "feat(meetings): add email templates and update send types"
```

---

## Task 10: Google OAuth API Routes

**Files:**
- Create: `src/app/api/auth/google/route.ts`
- Create: `src/app/api/auth/google/callback/route.ts`

- [ ] **Step 1: Create Google OAuth initiation + disconnect route**

```typescript
// src/app/api/auth/google/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUrl, removeTokens } from "@/lib/google/calendar";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const authUrl = getAuthUrl(currentUser.userId);
    return NextResponse.json({ success: true, data: { authUrl } });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to generate auth URL" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await removeTokens(currentUser.userId);

    await createAuditLog("google_disconnected", currentUser.userId, {
      action_description: "Disconnected Google account",
    });

    return NextResponse.json({ success: true, message: "Google account disconnected" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to disconnect" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create OAuth callback route**

```typescript
// src/app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode, saveTokens } from "@/lib/google/calendar";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
    }

    const tokens = await getTokensFromCode(code);
    await saveTokens(state, tokens);

    await createAuditLog("google_connected", state, {
      action_description: "Connected Google account for meeting management",
    });

    return NextResponse.redirect(new URL("/admin/settings?google=success", req.url));
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/admin/settings?google=error", req.url));
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/google/route.ts src/app/api/auth/google/callback/route.ts
git commit -m "feat(meetings): add Google OAuth routes for connect/disconnect"
```

---

## Task 11: Meeting CRUD API Routes

**Files:**
- Create: `src/app/api/meetings/route.ts`
- Create: `src/app/api/meetings/[id]/route.ts`

- [ ] **Step 1: Create meetings list + create route**

```typescript
// src/app/api/meetings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import { createMeetingSchema } from "@/validations/meeting";
import { createCalendarEvent } from "@/lib/google/calendar";
import { createMeetingNotification } from "@/lib/meeting-notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const query: Record<string, unknown> = {};

    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (status) query.status = status;
    if (type) query.type = type;

    // Members only see meetings they're invited to
    if (currentUser.role !== "admin") {
      query.invitees = currentUser.userId;
    }

    const total = await Meeting.countDocuments(query);
    const meetings = await Meeting.find(query)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName")
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: meetings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch meetings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string; fullName: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    const parsed = createMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meetingDate = new Date(parsed.data.date);
    const endTime = new Date(meetingDate.getTime() + parsed.data.duration * 60 * 1000);

    // Get invitee emails for Google Calendar
    const inviteeUsers = await User.find({ _id: { $in: parsed.data.invitees } }).select("fullName email");
    const attendeeEmails = inviteeUsers.map((u) => u.email).filter(Boolean);

    // Create Google Calendar event
    const googleResult = await createCalendarEvent({
      userId: currentUser.userId,
      title: parsed.data.title,
      description: parsed.data.description || "",
      startTime: meetingDate,
      endTime,
      attendeeEmails,
    });

    // Initialize attendance records for all invitees
    const attendance = parsed.data.invitees.map((userId) => ({
      user: userId,
      status: "not_marked" as const,
      checkInTime: null,
      markedBy: "admin" as const,
      markedByAdmin: null,
    }));

    // Initialize minutes with agenda items
    const minutes = {
      mode: "structured" as const,
      freeformContent: "",
      agendaItems: parsed.data.agenda.map((item) => ({
        title: item,
        discussion: "",
        decision: "",
      })),
      decisions: [],
      actionItems: [],
      status: "draft" as const,
      finalizedAt: null,
    };

    const meeting = await Meeting.create({
      ...parsed.data,
      date: meetingDate,
      googleEventId: googleResult?.googleEventId || null,
      meetLink: googleResult?.meetLink || null,
      attendance,
      minutes,
      createdBy: currentUser.userId,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName");

    // Create notifications for invitees
    const inviteeIds = parsed.data.invitees.filter((id) => id !== currentUser.userId);
    if (inviteeIds.length > 0) {
      await createMeetingNotification(
        "meeting_created",
        inviteeIds,
        meeting._id.toString(),
        `New Meeting: ${parsed.data.title}`,
        `You've been invited to a ${parsed.data.type} meeting on ${meetingDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
      );
    }

    await createAuditLog("meeting_created", currentUser.userId, {
      action_description: `Created meeting: "${parsed.data.title}"`,
      meeting_type: parsed.data.type,
      invitee_count: parsed.data.invitees.length,
    });

    return NextResponse.json({
      success: true,
      data: populated,
      message: googleResult ? "Meeting created with Google Calendar invite" : "Meeting created (Google Calendar sync unavailable)",
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create meeting" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create single meeting GET/PUT/DELETE route**

```typescript
// src/app/api/meetings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import User from "@/models/User";
import { updateMeetingSchema } from "@/validations/meeting";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/google/calendar";
import { createMeetingNotification } from "@/lib/meeting-notifications";
import { createAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { MeetingCancelledEmail } from "@/lib/email/templates/meeting-cancelled";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName")
      .populate("attendance.user", "fullName email")
      .populate("minutes.actionItems.assignee", "fullName")
      .populate("reminderSent.sentBy", "fullName");

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Members can only view meetings they're invited to
    if (currentUser.role !== "admin") {
      const isInvited = meeting.invitees.some(
        (inv: { _id: { toString: () => string } }) => inv._id.toString() === currentUser.userId
      );
      if (!isInvited) {
        return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch meeting" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.date) {
      updateData.date = new Date(parsed.data.date);
    }

    // If invitees changed, update attendance records
    if (parsed.data.invitees) {
      const existingUserIds = meeting.attendance.map((a: { user: { toString: () => string } }) => a.user.toString());
      const newInvitees = parsed.data.invitees.filter((id: string) => !existingUserIds.includes(id));

      const newAttendance = [
        ...meeting.attendance,
        ...newInvitees.map((userId: string) => ({
          user: userId,
          status: "not_marked",
          checkInTime: null,
          markedBy: "admin",
          markedByAdmin: null,
        })),
      ];
      updateData.attendance = newAttendance;

      // Update agenda items in minutes if agenda changed
      if (parsed.data.agenda) {
        updateData["minutes.agendaItems"] = parsed.data.agenda.map((item: string) => ({
          title: item,
          discussion: "",
          decision: "",
        }));
      }
    }

    const updated = await Meeting.findByIdAndUpdate(id, updateData, { new: true })
      .populate("invitees", "fullName email")
      .populate("createdBy", "fullName");

    // Sync with Google Calendar
    if (meeting.googleEventId) {
      const endTime = parsed.data.date && parsed.data.duration
        ? new Date(new Date(parsed.data.date).getTime() + (parsed.data.duration || meeting.duration) * 60 * 1000)
        : undefined;

      const inviteeUsers = parsed.data.invitees
        ? await User.find({ _id: { $in: parsed.data.invitees } }).select("email")
        : undefined;

      await updateCalendarEvent(currentUser.userId, meeting.googleEventId, {
        title: parsed.data.title,
        description: parsed.data.description,
        startTime: parsed.data.date ? new Date(parsed.data.date) : undefined,
        endTime,
        attendeeEmails: inviteeUsers?.map((u) => u.email),
      });
    }

    // Notify invitees of update
    const inviteeIds = (updated?.invitees || [])
      .map((inv: { _id: { toString: () => string } }) => inv._id.toString())
      .filter((uid: string) => uid !== currentUser.userId);
    if (inviteeIds.length > 0) {
      await createMeetingNotification(
        "meeting_updated",
        inviteeIds,
        id,
        `Meeting Updated: ${updated?.title}`,
        "Meeting details have been updated. Please check for changes."
      );
    }

    await createAuditLog("meeting_updated", currentUser.userId, {
      action_description: `Updated meeting: "${updated?.title}"`,
      changes: Object.keys(parsed.data),
    });

    return NextResponse.json({ success: true, data: updated, message: "Meeting updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update meeting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string; fullName: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = (body as { reason?: string }).reason || "";

    const meeting = await Meeting.findById(id).populate("invitees", "fullName email");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Cancel in Google Calendar
    if (meeting.googleEventId) {
      await deleteCalendarEvent(currentUser.userId, meeting.googleEventId);
    }

    // Mark as cancelled (don't delete for audit trail)
    meeting.status = "cancelled";
    meeting.cancelledReason = reason;
    await meeting.save();

    // Notify invitees
    const meetingDate = new Date(meeting.date);
    const dateStr = meetingDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = meetingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const inviteeIds = meeting.invitees
      .map((inv: { _id: { toString: () => string } }) => inv._id.toString())
      .filter((uid: string) => uid !== currentUser.userId);

    if (inviteeIds.length > 0) {
      await createMeetingNotification(
        "meeting_cancelled",
        inviteeIds,
        id,
        `Meeting Cancelled: ${meeting.title}`,
        reason ? `Reason: ${reason}` : "The meeting has been cancelled."
      );
    }

    // Send cancellation emails
    for (const invitee of meeting.invitees as { _id: { toString: () => string }; fullName: string; email: string }[]) {
      sendEmail({
        to: invitee.email,
        toUserId: invitee._id.toString(),
        subject: `Meeting Cancelled: ${meeting.title}`,
        type: "meeting_cancelled",
        react: MeetingCancelledEmail({
          memberName: invitee.fullName,
          meetingTitle: meeting.title,
          meetingDate: dateStr,
          meetingTime: timeStr,
          reason,
          cancelledBy: currentUser.fullName,
        }),
        metadata: { meetingId: id },
      }).catch(() => {});
    }

    await createAuditLog("meeting_cancelled", currentUser.userId, {
      action_description: `Cancelled meeting: "${meeting.title}"`,
      reason,
    });

    return NextResponse.json({ success: true, message: "Meeting cancelled" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to cancel meeting" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/meetings/route.ts src/app/api/meetings/\[id\]/route.ts
git commit -m "feat(meetings): add meeting CRUD API routes with Google Calendar sync"
```

---

## Task 12: Attendance, Check-in, Reminder, Minutes, Action Items API Routes

**Files:**
- Create: `src/app/api/meetings/[id]/attendance/route.ts`
- Create: `src/app/api/meetings/[id]/checkin/route.ts`
- Create: `src/app/api/meetings/[id]/remind/route.ts`
- Create: `src/app/api/meetings/[id]/minutes/route.ts`
- Create: `src/app/api/meetings/[id]/minutes/send/route.ts`
- Create: `src/app/api/meetings/action-items/route.ts`
- Create: `src/app/api/meetings/action-items/[id]/route.ts`

- [ ] **Step 1: Create attendance route**

```typescript
// src/app/api/meetings/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { attendanceSchema } from "@/validations/meeting";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = attendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    for (const record of parsed.data.attendance) {
      const existing = meeting.attendance.find(
        (a: { user: { toString: () => string } }) => a.user.toString() === record.userId
      );
      if (existing) {
        existing.status = record.status;
        existing.markedBy = "admin";
        existing.markedByAdmin = currentUser.userId;
      }
    }

    await meeting.save();

    await createAuditLog("attendance_marked", currentUser.userId, {
      action_description: `Marked attendance for meeting: "${meeting.title}"`,
      meeting_id: id,
      records_updated: parsed.data.attendance.length,
    });

    return NextResponse.json({ success: true, data: meeting.attendance, message: "Attendance updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update attendance" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create self-check-in route**

```typescript
// src/app/api/meetings/[id]/checkin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";

const CHECK_IN_BEFORE_MINUTES = 15;
const CHECK_IN_AFTER_MINUTES = 30;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    // Check if user is invited
    const isInvited = meeting.invitees.some(
      (inv: { toString: () => string }) => inv.toString() === currentUser.userId
    );
    if (!isInvited) {
      return NextResponse.json({ success: false, error: "You are not invited to this meeting" }, { status: 403 });
    }

    // Check time window
    const now = new Date();
    const meetingStart = new Date(meeting.date);
    const windowStart = new Date(meetingStart.getTime() - CHECK_IN_BEFORE_MINUTES * 60 * 1000);
    const windowEnd = new Date(meetingStart.getTime() + CHECK_IN_AFTER_MINUTES * 60 * 1000);

    if (now < windowStart || now > windowEnd) {
      return NextResponse.json({
        success: false,
        error: `Check-in is available from ${CHECK_IN_BEFORE_MINUTES} minutes before to ${CHECK_IN_AFTER_MINUTES} minutes after meeting start`,
      }, { status: 400 });
    }

    // Update attendance
    const attendanceRecord = meeting.attendance.find(
      (a: { user: { toString: () => string } }) => a.user.toString() === currentUser.userId
    );
    if (attendanceRecord) {
      attendanceRecord.status = "present";
      attendanceRecord.checkInTime = now;
      attendanceRecord.markedBy = "self";
    } else {
      meeting.attendance.push({
        user: currentUser.userId,
        status: "present",
        checkInTime: now,
        markedBy: "self",
        markedByAdmin: null,
      });
    }

    await meeting.save();

    return NextResponse.json({ success: true, message: "Checked in successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to check in" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create reminder route**

```typescript
// src/app/api/meetings/[id]/remind/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { sendEmail } from "@/lib/email/send";
import { MeetingReminderEmail } from "@/lib/email/templates/meeting-reminder";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id).populate("invitees", "fullName email");
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.status === "cancelled") {
      return NextResponse.json({ success: false, error: "Cannot send reminder for cancelled meeting" }, { status: 400 });
    }

    const meetingDate = new Date(meeting.date);
    const dateStr = meetingDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const timeStr = meetingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const hours = Math.floor(meeting.duration / 60);
    const mins = meeting.duration % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

    for (const invitee of meeting.invitees as { _id: { toString: () => string }; fullName: string; email: string }[]) {
      sendEmail({
        to: invitee.email,
        toUserId: invitee._id.toString(),
        subject: `Reminder: ${meeting.title}`,
        type: "meeting_reminder",
        react: MeetingReminderEmail({
          memberName: invitee.fullName,
          meetingTitle: meeting.title,
          meetingDate: dateStr,
          meetingTime: timeStr,
          duration: durationStr,
          agenda: meeting.agenda,
          meetLink: meeting.meetLink,
        }),
        metadata: { meetingId: id },
      }).catch(() => {});
    }

    meeting.reminderSent.push({ sentAt: new Date(), sentBy: currentUser.userId });
    await meeting.save();

    return NextResponse.json({ success: true, message: "Reminder sent to all invitees" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send reminder" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create minutes GET/PUT route**

```typescript
// src/app/api/meetings/[id]/minutes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { minutesSchema } from "@/validations/meeting";
import { createMeetingNotification } from "@/lib/meeting-notifications";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .select("minutes title")
      .populate("minutes.actionItems.assignee", "fullName");

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: meeting.minutes });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch minutes" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const parsed = minutesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.minutes.status === "finalized" && !parsed.data.finalize) {
      return NextResponse.json({ success: false, error: "Minutes are finalized and cannot be edited" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      "minutes.mode": parsed.data.mode,
    };

    if (parsed.data.mode === "freeform") {
      updateData["minutes.freeformContent"] = parsed.data.freeformContent || "";
    } else {
      if (parsed.data.agendaItems) updateData["minutes.agendaItems"] = parsed.data.agendaItems;
      if (parsed.data.decisions) updateData["minutes.decisions"] = parsed.data.decisions;
    }

    if (parsed.data.actionItems) {
      updateData["minutes.actionItems"] = parsed.data.actionItems;

      // Notify newly assigned action items
      for (const item of parsed.data.actionItems) {
        if (item.assignee !== currentUser.userId) {
          await createMeetingNotification(
            "action_item_assigned",
            [item.assignee],
            id,
            `Action Item: ${item.title}`,
            `You've been assigned an action item from meeting "${meeting.title}"`
          );
        }
      }
    }

    if (parsed.data.finalize) {
      updateData["minutes.status"] = "finalized";
      updateData["minutes.finalizedAt"] = new Date();
    }

    const updated = await Meeting.findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .populate("minutes.actionItems.assignee", "fullName");

    await createAuditLog("minutes_updated", currentUser.userId, {
      action_description: `Updated minutes for meeting: "${meeting.title}"`,
      finalized: !!parsed.data.finalize,
    });

    return NextResponse.json({ success: true, data: updated?.minutes, message: "Minutes saved" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to save minutes" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create minutes send route**

```typescript
// src/app/api/meetings/[id]/minutes/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { sendEmail } from "@/lib/email/send";
import { MeetingMinutesEmail } from "@/lib/email/templates/meeting-minutes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    const meeting = await Meeting.findById(id)
      .populate("invitees", "fullName email")
      .populate("minutes.actionItems.assignee", "fullName");

    if (!meeting) {
      return NextResponse.json({ success: false, error: "Meeting not found" }, { status: 404 });
    }

    if (meeting.minutes.status !== "finalized") {
      return NextResponse.json({ success: false, error: "Minutes must be finalized before sending" }, { status: 400 });
    }

    const meetingDate = new Date(meeting.date);
    const dateStr = meetingDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const decisions = meeting.minutes.decisions || [];
    const actionItems = (meeting.minutes.actionItems || []).map((item: { title: string; assignee: { fullName: string }; dueDate: Date }) => ({
      title: item.title,
      assigneeName: typeof item.assignee === "object" ? item.assignee.fullName : "Unknown",
      dueDate: new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    }));

    const summary = meeting.minutes.mode === "freeform"
      ? meeting.minutes.freeformContent.substring(0, 500)
      : meeting.minutes.agendaItems
          .map((a: { title: string; decision: string }) => a.decision ? `${a.title}: ${a.decision}` : "")
          .filter(Boolean)
          .join("; ");

    for (const invitee of meeting.invitees as { _id: { toString: () => string }; fullName: string; email: string }[]) {
      sendEmail({
        to: invitee.email,
        toUserId: invitee._id.toString(),
        subject: `Meeting Minutes: ${meeting.title}`,
        type: "meeting_minutes",
        react: MeetingMinutesEmail({
          memberName: invitee.fullName,
          meetingTitle: meeting.title,
          meetingDate: dateStr,
          decisions,
          actionItems,
          summary,
        }),
        metadata: { meetingId: id },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "Minutes sent to all invitees" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to send minutes" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Create action items list route**

```typescript
// src/app/api/meetings/action-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "pending" | "done" | null (all)

    const matchStage: Record<string, unknown> = {
      "minutes.actionItems.0": { $exists: true },
    };

    // Members only see their own action items
    if (currentUser.role !== "admin") {
      matchStage["minutes.actionItems.assignee"] = currentUser.userId;
    }

    const meetings = await Meeting.find(matchStage)
      .select("title date minutes.actionItems")
      .populate("minutes.actionItems.assignee", "fullName email");

    // Flatten action items with meeting context
    const actionItems = meetings.flatMap((meeting) =>
      meeting.minutes.actionItems
        .filter((item: { status: string; assignee: { _id: { toString: () => string } } }) => {
          if (status && item.status !== status) return false;
          if (currentUser.role !== "admin") {
            const assigneeId = typeof item.assignee === "object" ? item.assignee._id.toString() : item.assignee;
            return assigneeId === currentUser.userId;
          }
          return true;
        })
        .map((item: { _id: { toString: () => string }; title: string; assignee: unknown; dueDate: Date; status: string }) => ({
          _id: item._id.toString(),
          title: item.title,
          assignee: item.assignee,
          dueDate: item.dueDate,
          status: item.status,
          meetingId: meeting._id.toString(),
          meetingTitle: meeting.title,
          meetingDate: meeting.date,
        }))
    );

    // Sort by due date
    actionItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return NextResponse.json({ success: true, data: actionItems });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch action items" }, { status: 500 });
  }
}
```

- [ ] **Step 7: Create action item update route**

```typescript
// src/app/api/meetings/action-items/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Meeting from "@/models/Meeting";
import { actionItemUpdateSchema } from "@/validations/meeting";

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
    const parsed = actionItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const meeting = await Meeting.findOne({ "minutes.actionItems._id": id });
    if (!meeting) {
      return NextResponse.json({ success: false, error: "Action item not found" }, { status: 404 });
    }

    const actionItem = meeting.minutes.actionItems.id(id);
    if (!actionItem) {
      return NextResponse.json({ success: false, error: "Action item not found" }, { status: 404 });
    }

    // Members can only update their own action items
    if (currentUser.role !== "admin" && actionItem.assignee.toString() !== currentUser.userId) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    actionItem.status = parsed.data.status;
    await meeting.save();

    return NextResponse.json({ success: true, message: "Action item updated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update action item" }, { status: 500 });
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/api/meetings/
git commit -m "feat(meetings): add attendance, checkin, minutes, reminder, and action items API routes"
```

---

## Task 13: RTK Query API Slice

**Files:**
- Modify: `src/store/api.ts`
- Create: `src/store/meetings-api.ts`

- [ ] **Step 1: Add meeting tags to base API**

In `src/store/api.ts`, add `"Meetings"`, `"MeetingDetail"`, `"ActionItems"` to the `tagTypes` array.

- [ ] **Step 2: Create meetings RTK Query API slice**

```typescript
// src/store/meetings-api.ts
import { api } from "./api";
import { IMeeting, ApiResponse, PaginatedResponse } from "@/types";

interface GetMeetingsParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

interface CreateMeetingBody {
  title: string;
  description?: string;
  agenda?: string[];
  date: string;
  duration: number;
  type: "regular" | "special" | "emergency";
  invitees: string[];
}

interface UpdateMeetingBody {
  title?: string;
  description?: string;
  agenda?: string[];
  date?: string;
  duration?: number;
  type?: "regular" | "special" | "emergency";
  invitees?: string[];
}

interface AttendanceBody {
  attendance: { userId: string; status: "present" | "absent" | "excused" }[];
}

interface MinutesBody {
  mode: "structured" | "freeform";
  freeformContent?: string;
  agendaItems?: { title: string; discussion?: string; decision?: string }[];
  decisions?: string[];
  actionItems?: { _id?: string; title: string; assignee: string; dueDate: string; status?: "pending" | "done" }[];
  finalize?: boolean;
}

interface ActionItemWithContext {
  _id: string;
  title: string;
  assignee: { _id: string; fullName: string; email: string } | string;
  dueDate: string;
  status: "pending" | "done";
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
}

export const meetingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMeetings: builder.query<PaginatedResponse<IMeeting>, GetMeetingsParams>({
      query: (params) => ({ url: "/meetings", params }),
      providesTags: ["Meetings"],
    }),
    getMeeting: builder.query<ApiResponse<IMeeting>, string>({
      query: (id) => `/meetings/${id}`,
      providesTags: ["MeetingDetail"],
    }),
    createMeeting: builder.mutation<ApiResponse<IMeeting>, CreateMeetingBody>({
      query: (body) => ({ url: "/meetings", method: "POST", body }),
      invalidatesTags: ["Meetings"],
    }),
    updateMeeting: builder.mutation<ApiResponse<IMeeting>, { id: string; body: UpdateMeetingBody }>({
      query: ({ id, body }) => ({ url: `/meetings/${id}`, method: "PUT", body }),
      invalidatesTags: ["Meetings", "MeetingDetail"],
    }),
    cancelMeeting: builder.mutation<ApiResponse<null>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/meetings/${id}`, method: "DELETE", body: { reason } }),
      invalidatesTags: ["Meetings", "MeetingDetail"],
    }),
    sendReminder: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/meetings/${id}/remind`, method: "POST" }),
      invalidatesTags: ["MeetingDetail"],
    }),
    updateAttendance: builder.mutation<ApiResponse<unknown>, { id: string; body: AttendanceBody }>({
      query: ({ id, body }) => ({ url: `/meetings/${id}/attendance`, method: "POST", body }),
      invalidatesTags: ["MeetingDetail"],
    }),
    selfCheckIn: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/meetings/${id}/checkin`, method: "POST" }),
      invalidatesTags: ["MeetingDetail", "Meetings"],
    }),
    getMinutes: builder.query<ApiResponse<IMeeting["minutes"]>, string>({
      query: (id) => `/meetings/${id}/minutes`,
      providesTags: ["MeetingDetail"],
    }),
    updateMinutes: builder.mutation<ApiResponse<IMeeting["minutes"]>, { id: string; body: MinutesBody }>({
      query: ({ id, body }) => ({ url: `/meetings/${id}/minutes`, method: "PUT", body }),
      invalidatesTags: ["MeetingDetail", "ActionItems"],
    }),
    sendMinutes: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/meetings/${id}/minutes/send`, method: "POST" }),
    }),
    getActionItems: builder.query<ApiResponse<ActionItemWithContext[]>, { status?: string }>({
      query: (params) => ({ url: "/meetings/action-items", params }),
      providesTags: ["ActionItems"],
    }),
    updateActionItem: builder.mutation<ApiResponse<null>, { id: string; status: "pending" | "done" }>({
      query: ({ id, status }) => ({ url: `/meetings/action-items/${id}`, method: "PUT", body: { status } }),
      invalidatesTags: ["ActionItems", "MeetingDetail"],
    }),
    getGoogleAuthUrl: builder.query<ApiResponse<{ authUrl: string }>, void>({
      query: () => "/auth/google",
    }),
    disconnectGoogle: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/google", method: "DELETE" }),
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useGetMeetingQuery,
  useCreateMeetingMutation,
  useUpdateMeetingMutation,
  useCancelMeetingMutation,
  useSendReminderMutation,
  useUpdateAttendanceMutation,
  useSelfCheckInMutation,
  useGetMinutesQuery,
  useUpdateMinutesMutation,
  useSendMinutesMutation,
  useGetActionItemsQuery,
  useUpdateActionItemMutation,
  useLazyGetGoogleAuthUrlQuery,
  useDisconnectGoogleMutation,
} = meetingsApi;
```

- [ ] **Step 3: Commit**

```bash
git add src/store/api.ts src/store/meetings-api.ts
git commit -m "feat(meetings): add RTK Query API slice with all meeting endpoints"
```

---

## Task 14: Update Sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add Meetings menu item to adminLinks array**

Import `Video` icon from lucide-react (for meetings with Google Meet).

Add to the `adminLinks` array after the "Reports" entry:

```typescript
{ href: "/admin/meetings", label: "Meetings", icon: Video },
```

Also add to `memberLinks`:

```typescript
{ href: "/dashboard/meetings", label: "My Meetings", icon: Video },
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat(meetings): add Meetings menu item to sidebar"
```

---

## Task 15: Calendar Header Component

**Files:**
- Create: `src/components/meetings/calendar-header.tsx`

- [ ] **Step 1: Create calendar header with view toggles and navigation**

```tsx
// src/components/meetings/calendar-header.tsx
"use client";

import { Button, Segmented } from "antd";
import { ChevronLeft, ChevronRight, Plus, Video } from "lucide-react";

export type CalendarView = "month" | "week" | "day" | "agenda";

interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewMeeting: () => void;
  title: string;
}

export function CalendarHeader({
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onNewMeeting,
  title,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          Meetings
        </h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button size="small" onClick={onPrev} icon={<ChevronLeft className="h-4 w-4" />} />
          <Button size="small" onClick={onToday}>Today</Button>
          <Button size="small" onClick={onNext} icon={<ChevronRight className="h-4 w-4" />} />
          <span className="text-sm font-medium min-w-[180px] text-center">{title}</span>
        </div>
        <Segmented
          value={view}
          onChange={(val) => onViewChange(val as CalendarView)}
          options={[
            { label: "Month", value: "month" },
            { label: "Week", value: "week" },
            { label: "Day", value: "day" },
            { label: "Agenda", value: "agenda" },
          ]}
          size="small"
        />
        <Button onClick={onNewMeeting} type="primary" className="glow-primary" icon={<Plus className="h-4 w-4" />}>
          New Meeting
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/calendar-header.tsx
git commit -m "feat(meetings): add calendar header with view toggle and navigation"
```

---

## Task 16: Calendar View Components

**Files:**
- Create: `src/components/meetings/calendar-month-view.tsx`
- Create: `src/components/meetings/calendar-week-view.tsx`
- Create: `src/components/meetings/calendar-day-view.tsx`
- Create: `src/components/meetings/calendar-agenda-view.tsx`

- [ ] **Step 1: Create Month View**

Build a grid calendar (7 columns, 5-6 rows) showing meeting chips per day. Each chip is color-coded by meeting type. Clicking a meeting chip calls `onMeetingClick(id)`. Clicking a day calls `onDayClick(date)`.

Use the color scheme:
- `regular` = `#40916c` (primary green)
- `special` = `#2563eb` (blue)
- `emergency` = `#dc2626` (red)
- `cancelled` = `#9ca3af` (gray)

The component receives `meetings: IMeeting[]`, `currentDate: Date`, `onMeetingClick`, `onDayClick` as props.

Build the day grid using `Date` calculations — first day of month, padding days from previous month, etc. Show meeting title truncated + time in each cell.

- [ ] **Step 2: Create Week View**

Build a 7-column time grid (6am-10pm rows). Meetings render as positioned blocks based on their time and duration. Block height = duration. Block position = start time offset from 6am.

Same props as Month View. Include a red "current time" line if viewing the current week.

- [ ] **Step 3: Create Day View**

Single-column hourly timeline (6am-10pm). Meetings shown as full-width cards at their time position. Cards show: title, time range, type badge, attendee count, Meet link button, quick action buttons (Edit, Cancel, Remind).

- [ ] **Step 4: Create Agenda View**

A list of upcoming meetings sorted by date. Each row shows: date, time, title, type badge (Tag component), attendee count, status badge. Include a date range filter and type/status filters using Ant Design Select components.

Collapsible "Past Meetings" section using Ant Design Collapse.

- [ ] **Step 5: Commit**

```bash
git add src/components/meetings/calendar-month-view.tsx src/components/meetings/calendar-week-view.tsx src/components/meetings/calendar-day-view.tsx src/components/meetings/calendar-agenda-view.tsx
git commit -m "feat(meetings): add Month, Week, Day, and Agenda calendar view components"
```

---

## Task 17: Meeting Form Modal

**Files:**
- Create: `src/components/meetings/meeting-form-modal.tsx`

- [ ] **Step 1: Create meeting creation/edit form modal**

Use Ant Design Modal with Form. Fields:
1. `title` — Input
2. `type` — Radio.Group (Regular / Special / Emergency)
3. `date` — DatePicker with showTime
4. `duration` — Select (30, 45, 60, 90, 120 minutes)
5. `description` — Input.TextArea
6. `agenda` — Dynamic Form.List (add/remove items)
7. `invitees` — Select mode="multiple" with "Select All" checkbox. Populate options from `useGetUsersQuery` (existing RTK query).

On submit: call `useCreateMeetingMutation` or `useUpdateMeetingMutation`.

The modal accepts `open`, `onOpenChange`, and optional `meeting: IMeeting` for edit mode. In edit mode, pre-fill all fields.

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/meeting-form-modal.tsx
git commit -m "feat(meetings): add meeting creation/edit form modal"
```

---

## Task 18: Meeting Detail Drawer

**Files:**
- Create: `src/components/meetings/meeting-detail-drawer.tsx`

- [ ] **Step 1: Create meeting detail drawer component**

Use Ant Design Drawer. Shows:
- Header: title, date/time, duration, type Tag, status Tag
- Meet link with "Join Meeting" Button (opens in new tab)
- Invitee count summary
- Tabs component with 4 tabs: Agenda, Minutes, Attendance, Action Items
- Action buttons bar: Edit, Reschedule, Cancel (with Popconfirm), Send Reminder

The drawer loads meeting detail via `useGetMeetingQuery(meetingId)` when open.

Tab content rendered by dedicated components from Tasks 19-21.

Cancel action shows a Modal.confirm with textarea for reason, then calls `useCancelMeetingMutation`.

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/meeting-detail-drawer.tsx
git commit -m "feat(meetings): add meeting detail drawer with tabs and actions"
```

---

## Task 19: Attendance Tab Component

**Files:**
- Create: `src/components/meetings/attendance-tab.tsx`

- [ ] **Step 1: Create attendance management component**

Table (Ant Design Table) with columns:
- Member Name (from populated user)
- Status (Select dropdown: present/absent/excused)
- Check-in Time (formatted, or "-" if manual)
- Marked By (badge: "Self" or "Admin")

Bulk actions: "Mark All Present" and "Mark All Absent" buttons.

Summary bar showing: `X present / Y absent / Z excused / W not marked`.

On change: collect modified records and call `useUpdateAttendanceMutation`.

Self-check-in entries (markedBy === "self") get a subtle highlight.

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/attendance-tab.tsx
git commit -m "feat(meetings): add attendance management tab component"
```

---

## Task 20: Minutes Tab Component

**Files:**
- Create: `src/components/meetings/minutes-tab.tsx`

- [ ] **Step 1: Create minutes editor component**

Top: Segmented toggle for "Structured" / "Freeform" mode.

**Structured mode:**
- List of agenda items (from meeting.agenda), each with:
  - Title (read-only display)
  - Discussion (Input.TextArea)
  - Decision (Input.TextArea)
- Decisions section: collected from agenda items + manually added (dynamic list)
- Action Items section: Form.List with fields — title (Input), assignee (Select from invitees), due date (DatePicker), status badge

**Freeform mode:**
- Single large Input.TextArea for free-form notes

Bottom actions:
- "Save Draft" button — calls `useUpdateMinutesMutation` with `finalize: false`
- "Finalize Minutes" button (Popconfirm) — calls with `finalize: true`
- "Send to Invitees" button (only shown when finalized) — calls `useSendMinutesMutation`

If minutes are finalized, all fields become read-only.

Auto-save: debounced save on field changes (optional, save on blur).

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/minutes-tab.tsx
git commit -m "feat(meetings): add minutes editor tab with structured and freeform modes"
```

---

## Task 21: Action Items Tab Component

**Files:**
- Create: `src/components/meetings/action-items-tab.tsx`

- [ ] **Step 1: Create action items component**

Table with columns:
- Title
- Assignee (populated name)
- Due Date (formatted, red text if overdue)
- Status (Tag: green "Done" / yellow "Pending")
- Action: Toggle button to mark done/pending

Uses the action items from meeting detail (not the cross-meeting endpoint — that's for the dashboard widget).

Admin can toggle any item. Shows overdue count at the top.

- [ ] **Step 2: Commit**

```bash
git add src/components/meetings/action-items-tab.tsx
git commit -m "feat(meetings): add action items tab component"
```

---

## Task 22: Admin Meetings Page

**Files:**
- Create: `src/app/(admin)/admin/meetings/page.tsx`

- [ ] **Step 1: Create the admin meetings page**

This is the main orchestration page that ties everything together:

```tsx
"use client";

import { useState, useMemo } from "react";
import { useGetMeetingsQuery } from "@/store/meetings-api";
import { CalendarHeader, CalendarView } from "@/components/meetings/calendar-header";
import { CalendarMonthView } from "@/components/meetings/calendar-month-view";
import { CalendarWeekView } from "@/components/meetings/calendar-week-view";
import { CalendarDayView } from "@/components/meetings/calendar-day-view";
import { CalendarAgendaView } from "@/components/meetings/calendar-agenda-view";
import { MeetingFormModal } from "@/components/meetings/meeting-form-modal";
import { MeetingDetailDrawer } from "@/components/meetings/meeting-detail-drawer";
import { IMeeting } from "@/types";

export default function MeetingsPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<IMeeting | undefined>();
  const [detailId, setDetailId] = useState<string | null>(null);

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    if (view === "month") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (view === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      end.setDate(start.getDate() + 6);
    } else if (view === "day") {
      // Single day
    } else {
      // Agenda: next 60 days
      end.setDate(end.getDate() + 60);
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [currentDate, view]);

  const { data, isLoading } = useGetMeetingsQuery({
    ...dateRange,
    limit: 200,
  });
  const meetings = data?.data ?? [];

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Title based on view
  const title = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" };
    if (view === "month") return currentDate.toLocaleDateString("en-US", opts);
    if (view === "week") {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (view === "day") return currentDate.toLocaleDateString("en-US", { weekday: "long", ...opts, day: "numeric" });
    return "Upcoming Meetings";
  }, [currentDate, view]);

  const handleMeetingClick = (id: string) => setDetailId(id);
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleEdit = (meeting: IMeeting) => {
    setDetailId(null);
    setEditingMeeting(meeting);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingMeeting(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        view={view}
        onViewChange={setView}
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNewMeeting={handleNew}
        title={title}
      />

      <div className="glass-card rounded-xl overflow-hidden p-4">
        {view === "month" && (
          <CalendarMonthView meetings={meetings} currentDate={currentDate} onMeetingClick={handleMeetingClick} onDayClick={handleDayClick} />
        )}
        {view === "week" && (
          <CalendarWeekView meetings={meetings} currentDate={currentDate} onMeetingClick={handleMeetingClick} />
        )}
        {view === "day" && (
          <CalendarDayView meetings={meetings} currentDate={currentDate} onMeetingClick={handleMeetingClick} />
        )}
        {view === "agenda" && (
          <CalendarAgendaView meetings={meetings} isLoading={isLoading} onMeetingClick={handleMeetingClick} />
        )}
      </div>

      <MeetingFormModal open={modalOpen} onOpenChange={setModalOpen} meeting={editingMeeting} />
      <MeetingDetailDrawer meetingId={detailId} onClose={() => setDetailId(null)} onEdit={handleEdit} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/meetings/page.tsx
git commit -m "feat(meetings): add admin meetings page with calendar views"
```

---

## Task 23: Google Account Settings Section

**Files:**
- Create: `src/app/(admin)/admin/settings/google-account.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`

- [ ] **Step 1: Create Google account connection component**

```tsx
// src/app/(admin)/admin/settings/google-account.tsx
"use client";

import { Button, Tag, message } from "antd";
import { Chrome, Unlink } from "lucide-react";
import { useLazyGetGoogleAuthUrlQuery, useDisconnectGoogleMutation } from "@/store/meetings-api";
import { useGetProfileQuery } from "@/store/users-api"; // or wherever profile data comes from

export function GoogleAccountSection() {
  const [getAuthUrl, { isLoading: isConnecting }] = useLazyGetGoogleAuthUrlQuery();
  const [disconnect, { isLoading: isDisconnecting }] = useDisconnectGoogleMutation();

  // Check if user has Google tokens (need to check from profile/session)
  // This will be determined by checking if the user's profile has googleTokens set

  const handleConnect = async () => {
    try {
      const result = await getAuthUrl().unwrap();
      if (result.data?.authUrl) {
        window.location.href = result.data.authUrl;
      }
    } catch {
      message.error("Failed to initiate Google connection");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect().unwrap();
      message.success("Google account disconnected");
    } catch {
      message.error("Failed to disconnect");
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Chrome className="h-5 w-5" />
        Google Account
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Connect your Google account to create meetings with Google Calendar invites and Google Meet links.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleConnect}
          loading={isConnecting}
          icon={<Chrome className="h-4 w-4" />}
        >
          Connect Google Account
        </Button>
        <Button
          danger
          onClick={handleDisconnect}
          loading={isDisconnecting}
          icon={<Unlink className="h-4 w-4" />}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Import and render GoogleAccountSection in the Settings page**

In `src/app/(admin)/admin/settings/page.tsx`, import `GoogleAccountSection` and render it in the settings layout (after existing settings sections).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/settings/google-account.tsx src/app/\(admin\)/admin/settings/page.tsx
git commit -m "feat(meetings): add Google account connection section to Settings"
```

---

## Task 24: Member Dashboard Widgets

**Files:**
- Create: `src/components/dashboard/upcoming-meetings.tsx`
- Create: `src/components/dashboard/my-action-items.tsx`
- Modify: `src/components/dashboard/member-dashboard.tsx`

- [ ] **Step 1: Create Upcoming Meetings widget**

Shows next 3 meetings the member is invited to. Each card shows: title, date/time, type Tag, Meet link button (if within 15 min), Check In button (if within window).

Uses `useGetMeetingsQuery` with date filter from today onwards, limit 3.
Uses `useSelfCheckInMutation` for the check-in button.

- [ ] **Step 2: Create My Action Items widget**

Shows pending action items assigned to the member. Each row: title, meeting name, due date (red if overdue), toggle done button.

Uses `useGetActionItemsQuery({ status: "pending" })`.
Uses `useUpdateActionItemMutation` to toggle status.

- [ ] **Step 3: Add widgets to member dashboard**

In `src/components/dashboard/member-dashboard.tsx`, import both widgets and render them in the dashboard layout (after existing widgets).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/upcoming-meetings.tsx src/components/dashboard/my-action-items.tsx src/components/dashboard/member-dashboard.tsx
git commit -m "feat(meetings): add upcoming meetings and action items widgets to member dashboard"
```

---

## Task 25: Member Meetings Page

**Files:**
- Create: `src/app/(dashboard)/dashboard/meetings/page.tsx`

- [ ] **Step 1: Create member meetings page**

A simple list page showing all meetings the member is invited to (past and upcoming).

Uses `useGetMeetingsQuery` (the API already filters for members).

Each meeting row shows: date, time, title, type Tag, attendance status (attended/absent/upcoming), click to open detail.

Uses the same `MeetingDetailDrawer` from Task 18, but in read-only mode for members (no edit/cancel buttons, just view agenda, minutes, own attendance).

Include a toggle to show/hide past meetings.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/meetings/page.tsx
git commit -m "feat(meetings): add member meetings page"
```

---

## Task 26: Final Verification & Cleanup

- [ ] **Step 1: Verify all files are created**

Run: `find src -path "*/meetings*" -o -path "*/meeting*" | sort`

Ensure all files from the file structure section exist.

- [ ] **Step 2: Run the build to check for TypeScript errors**

```bash
npm run build
```

Fix any type errors that come up.

- [ ] **Step 3: Manual testing checklist**

Start the dev server: `npm run dev`

1. Navigate to Settings > Google Account > Connect — verify OAuth flow initiates
2. Navigate to /admin/meetings — verify calendar renders with Month/Week/Day/Agenda views
3. Create a new meeting — verify form submits, Google Calendar event created (if connected)
4. Open meeting detail — verify all tabs work (Agenda, Minutes, Attendance, Action Items)
5. Mark attendance — verify bulk and individual marking
6. Write minutes (structured mode) — verify save draft and finalize
7. Write minutes (freeform mode) — verify toggle works
8. Send reminder — verify email sends
9. Cancel a meeting — verify cancellation with reason
10. Log in as member — verify dashboard widgets show upcoming meetings and action items
11. Navigate to /dashboard/meetings — verify member meetings list
12. Test self-check-in within time window

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(meetings): complete Meeting Manager implementation"
```
