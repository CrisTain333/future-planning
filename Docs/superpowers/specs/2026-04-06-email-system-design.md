# Email System Design Spec

## Overview

Implement a professional email system using **Resend** + **React Email** for the Future Planning foundation app. The system sends payment reminders, receipts, notices, and password change notifications to members with branded, mobile-responsive templates.

**Max expected volume:** ~50 emails/month (well within Resend's free tier of 100/day).

## Email Types & Triggers

| Email Type | Trigger | Recipients |
|------------|---------|------------|
| Payment Reminder (Auto) | Vercel Cron on 1st, 5th, 10th, 15th of each month | All unpaid members for current month |
| Payment Reminder (Manual) | Admin clicks "Send Reminder" button | Selected unpaid member(s) |
| Payment Receipt | Auto on payment creation | The member who paid |
| Notice | Auto on notice creation | All active members with email |
| Password Changed | Auto when admin resets a member's password | That member |

### Behavior Rules

- **Payment reminders** only go to members who haven't paid for the current month. Once paid, no more reminders for that month.
- **Auto reminders** run via a single Vercel Cron job daily at 8 AM UTC. The route checks if today is 1st, 5th, 10th, or 15th — exits early otherwise.
- **All sends are non-blocking (fire-and-forget).** If an email fails, it's logged but the primary operation (payment creation, notice posting, etc.) still succeeds.
- **Every email is logged** to the EmailLog collection with status, type, recipient, and metadata.

## Architecture

### File Structure

```
src/
├── lib/
│   └── email/
│       ├── resend.ts              # Resend client instance
│       ├── send.ts                # Unified send function with auto-logging
│       └── templates/
│           ├── layout.tsx         # Shared email layout (header, footer, theme)
│           ├── payment-reminder.tsx
│           ├── payment-receipt.tsx
│           ├── notice.tsx
│           └── password-changed.tsx
├── models/
│   └── EmailLog.ts               # Email log MongoDB model
├── app/
│   └── api/
│       └── emails/
│           └── reminders/
│               └── route.ts      # Cron endpoint for auto reminders
```

### Dependencies

- `resend` — Resend SDK for sending emails
- `@react-email/components` — React components for building email templates

### Environment Variables

- `RESEND_API_KEY` — Already configured in `.env.local`
- `CRON_SECRET` — New. Protects the cron endpoint from unauthorized access.

### Vercel Cron Configuration

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/emails/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Data Model

### EmailLog Schema

```
- _id: ObjectId
- to: string (email address)
- toUserId: ObjectId → User
- type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed"
- subject: string
- status: "sent" | "failed"
- error?: string (failure reason)
- metadata?: object (paymentId, noticeId, etc.)
- createdAt: Date
```

### User Model Change

The `email` field on the User model changes from optional to **required**. Existing members without an email will need one added by admin.

## Email Template Design

### Shared Layout

All emails use a shared layout component with consistent branding:

- **Top bar:** Solid `#0a9396` color bar
- **Header:** Foundation name (fetched from Settings.foundationName)
- **Body:** Template-specific content
- **Footer:** "This is an auto-generated email from {foundationName}."
- **Bottom bar:** Solid `#0a9396` color bar
- **Max width:** 600px, centered
- **Font:** System font stack, readable sizes
- **Mobile responsive** via `@react-email/components`

### Template Details

#### 1. Payment Reminder
- **Subject:** "Payment Reminder - {monthName} {year}"
- Greeting: "Dear {memberName},"
- Body: "This is a reminder that your monthly payment of {amount} for {monthName} {year} is pending."
- If penalty applies: "A penalty of {penalty} may be applied for late payment."
- CTA: "Please make your payment at the earliest."

#### 2. Payment Receipt
- **Subject:** "Payment Receipt - {receiptNo}"
- Greeting: "Dear {memberName},"
- Body: "Your payment has been recorded successfully."
- Table with: Receipt No, Month/Year, Amount, Penalty (if any), Total, Status, Approved By
- Note: "This serves as your official payment receipt."

#### 3. Notice
- **Subject:** "Notice: {noticeTitle}"
- Greeting: "Dear Member,"
- Body: Full notice text rendered in the email
- Footer: Posted by {adminName} on {date}

#### 4. Password Changed
- **Subject:** "Your Password Has Been Changed"
- Greeting: "Dear {memberName},"
- Body: "Your account password has been changed by an administrator."
- Highlighted box with new password: "Your new password: {newPassword}"
- Warning: "Please change your password after logging in for security."

## Integration Points

### 1. Payment Receipt — `POST /api/payments/route.ts`
After payment is created successfully, call `sendPaymentReceipt()` with payment + member data. Non-blocking.

### 2. Notice — `POST /api/notices/route.ts`
After notice is created and in-app notifications are sent, call `sendNoticeEmail()` to all active members with email. Non-blocking.

### 3. Password Changed — `PUT /api/users/[id]/route.ts`
When admin resets password, capture the plain-text password **before** hashing. Call `sendPasswordChangedEmail()` with member info + plain-text password. Non-blocking.

### 4. Manual Reminder — Admin UI
"Send Reminder" button on unpaid members in the accounting/payment views. Calls send function directly or via a lightweight API endpoint.

### 5. Auto Reminders — `GET /api/emails/reminders/route.ts`
- Protected with `CRON_SECRET` header verification
- Checks if today is 1st, 5th, 10th, or 15th — exits early otherwise
- Queries all members who haven't paid for the current month
- Sends reminder to each unpaid member
- Logs all results to EmailLog

### 6. Email Log Viewer — Admin Page
- New admin page showing email history
- Table columns: Date, Recipient, Type, Subject, Status
- Filterable by type and status

## From Address

- **Current:** `Future Planning <onboarding@resend.dev>` (Resend default)
- **Future:** Custom domain can be configured in Resend dashboard and swapped by updating the from address in `resend.ts`. No code changes needed beyond that.

## Spam Prevention Best Practices

- Use Resend's built-in DKIM/SPF handling (automatic with their domain)
- Keep email content professional and text-heavy (no image-only emails)
- Include foundation name consistently
- Don't send excessive emails (4 reminders/month max per member)
- Include clear sender identification in footer
