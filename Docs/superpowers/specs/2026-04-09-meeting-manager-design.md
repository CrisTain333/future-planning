# Meeting Manager — Design Specification

**Date:** 2026-04-09
**Status:** Approved
**Author:** Brainstorming session with admin

---

## 1. Overview

A comprehensive Meeting Manager for the foundation admin panel, integrated with Google Calendar API and Google Meet. Admins can schedule meetings, send calendar invites to members' Gmail, track attendance, record minutes, and manage action items — all from within the app.

### Goals

- Centralize meeting management within the foundation app
- Leverage Google Calendar for invites, Meet links, and notifications
- Track attendance with both self-check-in and admin override
- Capture structured or freeform meeting minutes with action items
- Provide full calendar views (Month/Week/Day/Agenda)

### Non-Goals

- Recurring meeting automation (admins create each meeting individually)
- Cron-based reminders (all notifications are action-triggered or manual)
- Video call hosting (delegated to Google Meet)
- Integration with non-Google calendar providers

---

## 2. Google OAuth2 Integration

### Admin Connection Flow

1. New "Google Account" section in admin Settings page
2. Admin clicks "Connect Google Account" -> OAuth2 consent screen
3. Grants calendar scopes -> access token + refresh token returned
4. Tokens stored encrypted in the `User` model (admin users only)
5. Token auto-refreshes silently via refresh token
6. If token revoked/expired beyond refresh, admin sees "Reconnect" prompt

### OAuth Scopes

- `https://www.googleapis.com/auth/calendar.events` — create/edit/delete events
- `https://www.googleapis.com/auth/calendar.readonly` — read calendar data

### Google Cloud Setup (One-time, manual)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g., "Foundation Meeting Manager")
3. Enable **Google Calendar API**
4. Configure **OAuth consent screen**:
   - User type: External (or Internal if using Google Workspace)
   - App name: Foundation name from settings
   - Scopes: `calendar.events`, `calendar.readonly`
5. Create **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URI: `{APP_URL}/api/auth/google/callback`
6. Copy Client ID and Client Secret to environment variables

### Environment Variables

```
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI={APP_URL}/api/auth/google/callback
```

---

## 3. Data Model

### Meeting Schema (MongoDB/Mongoose)

```typescript
{
  title: string;                    // Required, meeting name
  description: string;              // Detailed description/purpose
  agenda: string[];                 // List of agenda items
  date: Date;                       // Meeting date & start time (UTC)
  duration: number;                 // Duration in minutes
  type: 'regular' | 'special' | 'emergency';
  googleEventId: string;            // Synced Google Calendar event ID
  meetLink: string;                 // Google Meet URL
  invitees: ObjectId[];             // Ref: User — members invited
  attendance: [{
    user: ObjectId;                 // Ref: User
    status: 'present' | 'absent' | 'excused' | 'not_marked';
    checkInTime: Date | null;       // When member checked in
    markedBy: 'self' | 'admin';     // Who marked this
    markedByAdmin: ObjectId | null; // Ref: User (if admin-marked)
  }];
  minutes: {
    mode: 'structured' | 'freeform';
    freeformContent: string;        // Rich text content (freeform mode)
    agendaItems: [{
      title: string;
      discussion: string;
      decision: string;
    }];
    decisions: string[];            // Collected + manually added
    actionItems: [{
      title: string;
      assignee: ObjectId;           // Ref: User
      dueDate: Date;
      status: 'pending' | 'done';
    }];
    status: 'draft' | 'finalized';
    finalizedAt: Date | null;
  };
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  cancelledReason: string;          // If cancelled, why
  reminderSent: [{
    sentAt: Date;
    sentBy: ObjectId;               // Admin who triggered it
  }];
  createdBy: ObjectId;              // Ref: User (admin)
  createdAt: Date;
  updatedAt: Date;
}
```

### User Model Additions

```typescript
{
  // Existing fields...
  googleTokens: {
    accessToken: string;            // Encrypted
    refreshToken: string;           // Encrypted
    expiresAt: Date;
    scope: string;
  } | null;
}
```

### Indexes

- `{ date: 1, status: 1 }` — calendar queries
- `{ 'attendance.user': 1 }` — attendance lookups
- `{ 'minutes.actionItems.assignee': 1, 'minutes.actionItems.status': 1 }` — action item queries
- `{ createdBy: 1 }` — admin's meetings
- `{ googleEventId: 1 }` — Google Calendar sync lookups

---

## 4. API Routes

### Meeting CRUD

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/meetings` | Admin | List meetings, filterable by date range, status, type |
| POST | `/api/meetings` | Admin | Create meeting + Google Calendar event + send invites |
| GET | `/api/meetings/[id]` | Admin/Member | Get meeting detail (members see only invited meetings) |
| PUT | `/api/meetings/[id]` | Admin | Update meeting + sync Google Calendar |
| DELETE | `/api/meetings/[id]` | Admin | Cancel meeting + delete Google event + notify invitees |

### Attendance

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/meetings/[id]/attendance` | Admin | Bulk or individual attendance marking |
| POST | `/api/meetings/[id]/checkin` | Member | Self-check-in (time-windowed) |

### Minutes & Action Items

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/meetings/[id]/minutes` | Admin | Get meeting minutes |
| PUT | `/api/meetings/[id]/minutes` | Admin | Save/update minutes (draft or finalize) |
| POST | `/api/meetings/[id]/minutes/send` | Admin | Email finalized minutes to all invitees |
| GET | `/api/meetings/action-items` | Admin/Member | List action items (admin: all, member: own) |
| PUT | `/api/meetings/action-items/[id]` | Admin | Update action item status |

### Reminders & Notifications

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/meetings/[id]/remind` | Admin | Send reminder email to all invitees immediately |

### Google OAuth

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/auth/google` | Admin | Initiate Google OAuth2 flow |
| GET | `/api/auth/google/callback` | Public | Handle OAuth callback, store tokens |
| DELETE | `/api/auth/google` | Admin | Disconnect Google account, remove tokens |

### Validation

All request bodies validated with Zod schemas:
- `meetingCreateSchema` — title (required), date (required, future), duration (required, min 15), type, agenda, invitees
- `meetingUpdateSchema` — partial of create schema
- `attendanceSchema` — array of `{ userId, status }`
- `minutesSchema` — mode, content based on mode, action items

---

## 5. UI Design

### Page Location

- Route: `/admin/meetings`
- Sidebar menu item: "Meetings" (calendar icon)
- Placed between "Reports" and "Investments" in sidebar

### Layout Structure

```
+--------------------------------------------------+
| [Month] [Week] [Day] [Agenda]    [+ New Meeting]  |
+--------------------------------------------------+
|                                                    |
|            Active Calendar/List View               |
|                                                    |
+--------------------------------------------------+
```

### Month View

- Grid calendar (7 columns x 5-6 rows)
- Each day cell shows meeting chips: colored dot + title + time
- Click a day -> switches to Day view for that date
- Click a meeting chip -> opens meeting detail drawer
- Navigation: < Previous Month | Current Month Title | Next Month >
- "Today" button to jump back to current date

### Week View

- 7-column time grid (hours 6am-10pm on Y-axis, days on X-axis)
- Meetings shown as colored blocks spanning their duration
- Header row shows day names + dates
- Current time indicator (horizontal red line)

### Day View

- Single column hourly timeline
- Full meeting cards showing: title, time, duration, attendees count, type badge, Meet link
- Quick action buttons visible: Edit, Cancel, Join Meet, Send Reminder

### Agenda View

- Sorted list of upcoming meetings (next 30 days default, adjustable)
- Each row: date, time, title, type badge, attendee count, status badge
- Filters: by type (regular/special/emergency), by status, date range picker
- Collapsible "Past Meetings" section at the bottom

### Color Coding

- Regular meetings: Primary green (#40916c)
- Special meetings: Blue (#2563eb)
- Emergency meetings: Red (#dc2626)
- Cancelled: Gray with strikethrough

### Meeting Creation Form

Modal/drawer with fields:
1. Title (text input, required)
2. Type (radio: Regular / Special / Emergency)
3. Date & Time (date-time picker, required)
4. Duration (select: 30min / 45min / 1hr / 1.5hr / 2hr / custom)
5. Description (textarea)
6. Agenda Items (dynamic list — add/remove/reorder)
7. Invitees (multi-select with "Select All Members" option)
8. Submit: "Create Meeting & Send Invites"

### Meeting Detail View

Drawer or full page with:
- Header: title, date/time, duration, type badge, status badge
- Google Meet link with prominent "Join Meeting" button
- Invitee list with attendance status indicators (green/red/gray dots)
- Tabs: **Agenda** | **Minutes** | **Attendance** | **Action Items**
- Admin action buttons: Edit, Reschedule, Cancel, Send Reminder

### Minutes Editor

**Structured mode (default):**
- Pre-populated sections from agenda items
- Each agenda item: title (read-only), discussion notes (textarea), decision (textarea)
- "Decisions" summary section — auto-collected from above + manual additions
- "Action Items" section — add items with: title, assignee (member select), due date
- "Finalize Minutes" button (locks editing, enables email send)

**Freeform mode:**
- Rich text editor (consistent with Notice Board editor)
- No structure enforced
- Same finalize workflow

Toggle button at top: "Structured" / "Freeform"

### Attendance Tab

- Table of all invitees
- Columns: Member Name, Status (dropdown: present/absent/excused), Check-in Time, Marked By
- Bulk actions row: "Mark All Present" / "Mark All Absent"
- Self-check-in entries highlighted differently
- Attendance summary bar: X present / Y absent / Z excused

---

## 6. Attendance Check-in

### Self Check-in (Member Side)

- Members see upcoming meetings on their dashboard (meetings they're invited to)
- "Check In" button appears **15 minutes before** meeting start
- Button remains available until **30 minutes after** meeting start
- Check-in window is configurable in Settings
- After check-in: button changes to "Checked In at [time]"
- Outside the window: button disabled with "Check-in closed"

### Admin Override

- Admin can mark/change any member's attendance at any time (no time window)
- Admin changes override self-check-in status
- `markedBy` field tracks the source for audit purposes

---

## 7. Notifications & Reminders

### Action-triggered Notifications (Automatic)

| Event | Channel | Recipients |
|-------|---------|------------|
| Meeting created | Google Calendar invite + in-app notification | All invitees |
| Meeting updated (time/date) | Updated Google Calendar invite + in-app | All invitees |
| Meeting cancelled | Google Calendar cancellation + email with reason + in-app | All invitees |
| Minutes finalized + sent | Email with summary | All invitees (admin-triggered) |
| Action item assigned | In-app notification | Assignee |

### Manual Reminder

- Admin clicks "Send Reminder" on meeting detail
- Email sent via Resend to all invitees containing: meeting title, date/time, agenda, Meet link
- Reminder tracked: `reminderSent: [{ sentAt, sentBy }]`
- Admin can see "Last reminder sent: [date] by [admin name]"

### Email Templates

New templates in `src/lib/email/templates/`:
- `meeting-invite.tsx` — meeting details + Meet link + agenda
- `meeting-cancelled.tsx` — cancellation with reason
- `meeting-reminder.tsx` — reminder with Meet link
- `meeting-minutes.tsx` — finalized minutes summary

### In-app Notifications

Uses existing `Notification` model with new types:
- `meeting_created`
- `meeting_updated`
- `meeting_cancelled`
- `action_item_assigned`

---

## 8. Member Dashboard Integration

### Upcoming Meetings Widget

- Shows next 3 meetings the member is invited to
- Each shows: title, date/time, type badge, "Join Meet" link (if within 15 min of start)
- Check-in button when within the check-in window
- "View All Meetings" link to a member meetings page

### My Action Items Widget

- Shows pending action items assigned to the member
- Each shows: title, from which meeting, due date, overdue indicator
- Click to mark as done (or view meeting detail)

### Member Meetings Page

- Route: `/dashboard/meetings`
- List of all meetings member is invited to (past and upcoming)
- Status shown for each: attended, absent, upcoming
- Click to view meeting detail (read-only minutes, own attendance status)

---

## 9. Google Calendar API Integration Details

### Creating an Event

```typescript
// Pseudocode for creating a Google Calendar event with Meet
const event = {
  summary: meeting.title,
  description: meeting.description,
  start: { dateTime: meeting.date.toISOString(), timeZone: 'Asia/Kolkata' },
  end: { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' },
  attendees: invitees.map(u => ({ email: u.email })),
  conferenceData: {
    createRequest: {
      requestId: uniqueId,
      conferenceSolutionKey: { type: 'hangoutsMeet' }
    }
  },
  reminders: { useDefault: false, overrides: [] } // We handle reminders ourselves
};

const response = await calendar.events.insert({
  calendarId: 'primary',
  resource: event,
  conferenceDataVersion: 1,
  sendUpdates: 'all' // Google sends invite emails to attendees
});

// Store: response.id -> googleEventId, response.hangoutLink -> meetLink
```

### Token Management

- Store encrypted tokens in User model
- Before each API call, check if `expiresAt` is within 5 minutes
- If expiring, use refresh token to get new access token
- If refresh fails (revoked), mark `googleTokens: null` and prompt reconnect
- Use `googleapis` npm package for API calls

### Error Handling

- Google API unavailable: save meeting locally, mark `googleEventId: null`, show warning "Calendar invite not sent — Google API unavailable"
- Token expired: prompt admin to reconnect before creating meetings
- Rate limits: retry with exponential backoff (Google Calendar API: 60 requests/min)

---

## 10. Security Considerations

- **Token encryption:** Google OAuth tokens encrypted at rest using AES-256 (encryption key in env var)
- **Scope minimization:** Only request calendar.events and calendar.readonly scopes
- **Token isolation:** Each admin's tokens stored only on their User document
- **HTTPS only:** OAuth redirect URI must use HTTPS in production
- **State parameter:** OAuth flow uses `state` param to prevent CSRF
- **Zod validation:** All API inputs validated before processing
- **Role enforcement:** Meeting CRUD = admin only, check-in = authenticated member, view = invitee only

---

## 11. Dependencies

### New npm packages

- `googleapis` — Google Calendar API client
- `crypto` (built-in) — Token encryption/decryption

### Existing packages leveraged

- `resend` — Email sending (reminders, minutes)
- `mongoose` — Meeting model
- `zod` — Request validation
- `@reduxjs/toolkit` — RTK Query API slice for meetings
- `antd` — UI components (modals, forms, tables, selects)
- `framer-motion` — Animations
- `recharts` — Potential attendance charts

---

## 12. RTK Query API Slice

New file: `src/store/meetingApi.ts`

Endpoints:
- `getMeetings` — query with date range, status, type filters
- `getMeeting` — query by ID
- `createMeeting` — mutation
- `updateMeeting` — mutation
- `cancelMeeting` — mutation (DELETE)
- `sendReminder` — mutation
- `updateAttendance` — mutation
- `selfCheckIn` — mutation
- `getMinutes` — query
- `updateMinutes` — mutation
- `sendMinutes` — mutation
- `getActionItems` — query with filters
- `updateActionItem` — mutation
- `connectGoogle` — mutation (initiates OAuth)
- `disconnectGoogle` — mutation

Tag-based cache invalidation:
- Tag: `Meeting` — invalidated on create/update/cancel
- Tag: `MeetingDetail` — invalidated on attendance/minutes changes
- Tag: `ActionItem` — invalidated on action item updates
