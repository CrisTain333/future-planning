# Email System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a professional email system using Resend + React Email that sends payment reminders, receipts, notices, and password change notifications to members.

**Architecture:** React Email templates rendered server-side, sent via Resend SDK, logged to MongoDB. A Vercel Cron job triggers automatic payment reminders on the 1st, 5th, 10th, and 15th of each month. All email sends are non-blocking (fire-and-forget).

**Tech Stack:** Resend SDK, @react-email/components, MongoDB (EmailLog model), Vercel Cron, Next.js API routes

---

## File Structure

```
src/
├── lib/
│   └── email/
│       ├── resend.ts              # Resend client instance
│       ├── send.ts                # Unified send function with auto-logging
│       └── templates/
│           ├── layout.tsx         # Shared email layout (header, footer, #0a9396 theme)
│           ├── payment-reminder.tsx
│           ├── payment-receipt.tsx
│           ├── notice.tsx
│           └── password-changed.tsx
├── models/
│   └── EmailLog.ts
├── types/
│   └── index.ts                   # Add IEmailLog interface
├── store/
│   └── email-logs-api.ts          # RTK Query endpoints for email logs
├── app/
│   ├── api/
│   │   └── emails/
│   │       ├── reminders/
│   │       │   └── route.ts       # Cron endpoint for auto reminders
│   │       ├── logs/
│   │       │   └── route.ts       # GET email logs for admin
│   │       └── send-reminder/
│   │           └── route.ts       # Manual reminder endpoint
│   └── (admin)/
│       └── admin/
│           └── email-logs/
│               └── page.tsx       # Admin email log viewer
```

**Modified files:**
- `src/models/User.ts` — make email required
- `src/types/index.ts` — add IEmailLog type
- `src/validations/user.ts` — make email required in create schema
- `src/store/api.ts` — add "EmailLogs" tag type
- `src/app/api/payments/route.ts:151` — add receipt email after payment creation
- `src/app/api/notices/route.ts:63` — add notice email after notice creation
- `src/app/api/users/[id]/route.ts:113` — add password changed email
- `vercel.json` — create with cron config
- `.env.local` — add CRON_SECRET

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install resend and react-email components**

```bash
npm install resend @react-email/components
```

- [ ] **Step 2: Generate a CRON_SECRET and add to .env.local**

```bash
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local
```

- [ ] **Step 3: Create vercel.json with cron config**

Create `vercel.json` at project root:

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

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vercel.json
git commit -m "chore: add resend and react-email dependencies, vercel cron config"
```

---

### Task 2: EmailLog Model + Type

**Files:**
- Create: `src/models/EmailLog.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create the EmailLog model**

Create `src/models/EmailLog.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IEmailLogDocument extends Document {
  to: string;
  toUserId?: mongoose.Types.ObjectId;
  type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed";
  subject: string;
  status: "sent" | "failed";
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const EmailLogSchema = new Schema<IEmailLogDocument>(
  {
    to: { type: String, required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["payment_reminder", "payment_receipt", "notice", "password_changed"],
      required: true,
    },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    error: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

EmailLogSchema.index({ type: 1 });
EmailLogSchema.index({ status: 1 });
EmailLogSchema.index({ createdAt: -1 });

const EmailLog =
  mongoose.models.EmailLog ||
  mongoose.model<IEmailLogDocument>("EmailLog", EmailLogSchema);
export default EmailLog;
```

- [ ] **Step 2: Add IEmailLog interface to types**

In `src/types/index.ts`, add after the `ISettings` interface (after line 87):

```typescript
export interface IEmailLog {
  _id: string;
  to: string;
  toUserId?: string | IUser;
  type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed";
  subject: string;
  status: "sent" | "failed";
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/models/EmailLog.ts src/types/index.ts
git commit -m "feat: add EmailLog model and IEmailLog type"
```

---

### Task 3: Make User Email Required

**Files:**
- Modify: `src/models/User.ts:6,22`
- Modify: `src/types/index.ts:5`
- Modify: `src/validations/user.ts:9`

- [ ] **Step 1: Update User model — make email required**

In `src/models/User.ts`, change line 6 from:

```typescript
  email?: string;
```

to:

```typescript
  email: string;
```

And change line 22 from:

```typescript
    email: { type: String, unique: true, sparse: true },
```

to:

```typescript
    email: { type: String, required: true, unique: true },
```

- [ ] **Step 2: Update IUser type**

In `src/types/index.ts`, change line 5 from:

```typescript
  email?: string;
```

to:

```typescript
  email: string;
```

- [ ] **Step 3: Update createUserSchema — make email required**

In `src/validations/user.ts`, change line 9 from:

```typescript
  email: z.string().email("Invalid email").optional().or(z.literal("")),
```

to:

```typescript
  email: z.string().email("Invalid email address"),
```

- [ ] **Step 4: Commit**

```bash
git add src/models/User.ts src/types/index.ts src/validations/user.ts
git commit -m "feat: make user email field required for email system"
```

---

### Task 4: Resend Client + Unified Send Function

**Files:**
- Create: `src/lib/email/resend.ts`
- Create: `src/lib/email/send.ts`

- [ ] **Step 1: Create Resend client**

Create `src/lib/email/resend.ts`:

```typescript
import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = "Future Planning <onboarding@resend.dev>";
```

- [ ] **Step 2: Create unified send function with logging**

Create `src/lib/email/send.ts`:

```typescript
import { resend, EMAIL_FROM } from "./resend";
import dbConnect from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import Settings from "@/models/Settings";
import type { ReactElement } from "react";

interface SendEmailOptions {
  to: string;
  toUserId?: string;
  subject: string;
  type: "payment_reminder" | "payment_receipt" | "notice" | "password_changed";
  react: ReactElement;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(options: SendEmailOptions) {
  const { to, toUserId, subject, type, react, metadata } = options;

  try {
    await dbConnect();

    const settings = await Settings.findOne();
    const foundationName = settings?.foundationName || "Future Planning";
    const from = `${foundationName} <onboarding@resend.dev>`;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      await EmailLog.create({
        to,
        toUserId,
        type,
        subject,
        status: "failed",
        error: error.message,
        metadata,
      });
      console.error(`Email failed [${type}] to ${to}:`, error.message);
      return { success: false, error: error.message };
    }

    await EmailLog.create({
      to,
      toUserId,
      type,
      subject,
      status: "sent",
      metadata,
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    try {
      await dbConnect();
      await EmailLog.create({
        to,
        toUserId,
        type,
        subject,
        status: "failed",
        error: errorMessage,
        metadata,
      });
    } catch {
      console.error("Failed to log email error:", errorMessage);
    }
    return { success: false, error: errorMessage };
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/email/resend.ts src/lib/email/send.ts
git commit -m "feat: add Resend client and unified send function with logging"
```

---

### Task 5: Shared Email Layout Template

**Files:**
- Create: `src/lib/email/templates/layout.tsx`

- [ ] **Step 1: Create the shared layout component**

Create `src/lib/email/templates/layout.tsx`:

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  foundationName?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  preview,
  foundationName = "Future Planning",
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Top color bar */}
          <Section style={topBar} />

          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>{foundationName}</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This is an auto-generated email from {foundationName}. Please do
              not reply to this email.
            </Text>
          </Section>

          {/* Bottom color bar */}
          <Section style={bottomBar} />
        </Container>
      </Body>
    </Html>
  );
}

const PRIMARY = "#0a9396";

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "8px",
  overflow: "hidden" as const,
};

const topBar = {
  backgroundColor: PRIMARY,
  height: "4px",
};

const header = {
  padding: "32px 40px 16px",
};

const headerText = {
  color: PRIMARY,
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0",
};

const divider = {
  borderColor: "#e4e4e7",
  margin: "0 40px",
};

const content = {
  padding: "24px 40px",
};

const footer = {
  padding: "16px 40px 24px",
};

const footerText = {
  color: "#71717a",
  fontSize: "12px",
  lineHeight: "20px",
  margin: "0",
};

const bottomBar = {
  backgroundColor: PRIMARY,
  height: "4px",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/layout.tsx
git commit -m "feat: add shared email layout template with theme branding"
```

---

### Task 6: Payment Reminder Email Template

**Files:**
- Create: `src/lib/email/templates/payment-reminder.tsx`

- [ ] **Step 1: Create the payment reminder template**

Create `src/lib/email/templates/payment-reminder.tsx`:

```tsx
import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PaymentReminderProps {
  memberName: string;
  amount: number;
  monthName: string;
  year: number;
  foundationName?: string;
}

export function PaymentReminderEmail({
  memberName,
  amount,
  monthName,
  year,
  foundationName = "Future Planning",
}: PaymentReminderProps) {
  return (
    <EmailLayout
      preview={`Payment reminder for ${monthName} ${year}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        This is a friendly reminder that your monthly payment of{" "}
        <strong>BDT {amount.toLocaleString()}</strong> for{" "}
        <strong>
          {monthName} {year}
        </strong>{" "}
        is still pending.
      </Text>
      <Section style={highlightBox}>
        <Text style={highlightText}>
          Amount Due: BDT {amount.toLocaleString()}
        </Text>
        <Text style={highlightText}>
          Period: {monthName} {year}
        </Text>
      </Section>
      <Text style={paragraph}>
        Please make your payment at the earliest convenience to avoid any
        penalties.
      </Text>
      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const highlightBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
};

const highlightText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#18181b",
  margin: "0",
  fontWeight: "600" as const,
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/payment-reminder.tsx
git commit -m "feat: add payment reminder email template"
```

---

### Task 7: Payment Receipt Email Template

**Files:**
- Create: `src/lib/email/templates/payment-receipt.tsx`

- [ ] **Step 1: Create the payment receipt template**

Create `src/lib/email/templates/payment-receipt.tsx`:

```tsx
import { Text, Section, Row, Column, Hr } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PaymentReceiptProps {
  memberName: string;
  receiptNo: string;
  monthName: string;
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  approvedBy: string;
  date: string;
  foundationName?: string;
}

export function PaymentReceiptEmail({
  memberName,
  receiptNo,
  monthName,
  year,
  amount,
  penalty,
  penaltyReason,
  approvedBy,
  date,
  foundationName = "Future Planning",
}: PaymentReceiptProps) {
  const total = amount + penalty;

  return (
    <EmailLayout
      preview={`Payment receipt ${receiptNo}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        Your payment has been recorded successfully. Here are the details:
      </Text>

      <Section style={receiptBox}>
        <Text style={receiptTitle}>Payment Receipt</Text>
        <Hr style={receiptDivider} />

        <Row style={tableRow}>
          <Column style={labelCol}>Receipt No</Column>
          <Column style={valueCol}>{receiptNo}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Date</Column>
          <Column style={valueCol}>{date}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Period</Column>
          <Column style={valueCol}>
            {monthName} {year}
          </Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Amount</Column>
          <Column style={valueCol}>BDT {amount.toLocaleString()}</Column>
        </Row>
        {penalty > 0 && (
          <>
            <Row style={tableRow}>
              <Column style={labelCol}>Penalty</Column>
              <Column style={valueCol}>BDT {penalty.toLocaleString()}</Column>
            </Row>
            {penaltyReason && (
              <Row style={tableRow}>
                <Column style={labelCol}>Penalty Reason</Column>
                <Column style={valueCol}>{penaltyReason}</Column>
              </Row>
            )}
          </>
        )}
        <Hr style={receiptDivider} />
        <Row style={tableRow}>
          <Column style={labelCol}>
            <strong>Total</strong>
          </Column>
          <Column style={valueColBold}>BDT {total.toLocaleString()}</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Status</Column>
          <Column style={statusBadge}>Approved</Column>
        </Row>
        <Row style={tableRow}>
          <Column style={labelCol}>Approved By</Column>
          <Column style={valueCol}>{approvedBy}</Column>
        </Row>
      </Section>

      <Text style={paragraph}>
        This serves as your official payment receipt from {foundationName}.
      </Text>
      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const receiptBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const receiptTitle = {
  fontSize: "16px",
  fontWeight: "700" as const,
  color: "#0a9396",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const receiptDivider = {
  borderColor: "#e4e4e7",
  margin: "12px 0",
};

const tableRow = {
  margin: "0",
};

const labelCol = {
  fontSize: "13px",
  color: "#71717a",
  padding: "4px 0",
  width: "140px",
};

const valueCol = {
  fontSize: "13px",
  color: "#18181b",
  padding: "4px 0",
};

const valueColBold = {
  fontSize: "14px",
  color: "#18181b",
  fontWeight: "700" as const,
  padding: "4px 0",
};

const statusBadge = {
  fontSize: "13px",
  color: "#0a9396",
  fontWeight: "600" as const,
  padding: "4px 0",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/payment-receipt.tsx
git commit -m "feat: add payment receipt email template"
```

---

### Task 8: Notice Email Template

**Files:**
- Create: `src/lib/email/templates/notice.tsx`

- [ ] **Step 1: Create the notice email template**

Create `src/lib/email/templates/notice.tsx`:

```tsx
import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface NoticeEmailProps {
  title: string;
  body: string;
  postedBy: string;
  date: string;
  foundationName?: string;
}

export function NoticeEmail({
  title,
  body,
  postedBy,
  date,
  foundationName = "Future Planning",
}: NoticeEmailProps) {
  return (
    <EmailLayout
      preview={`Notice: ${title}`}
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear Member,</Text>
      <Text style={paragraph}>
        A new notice has been posted by {foundationName}:
      </Text>

      <Section style={noticeBox}>
        <Text style={noticeTitle}>{title}</Text>
        <Text style={noticeBody}>{body}</Text>
      </Section>

      <Text style={meta}>
        Posted by {postedBy} on {date}
      </Text>

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const noticeBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
};

const noticeTitle = {
  fontSize: "18px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0 0 12px",
};

const noticeBody = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const meta = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0 0 16px",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/notice.tsx
git commit -m "feat: add notice email template"
```

---

### Task 9: Password Changed Email Template

**Files:**
- Create: `src/lib/email/templates/password-changed.tsx`

- [ ] **Step 1: Create the password changed template**

Create `src/lib/email/templates/password-changed.tsx`:

```tsx
import { Text, Section } from "@react-email/components";
import { EmailLayout } from "./layout";

interface PasswordChangedProps {
  memberName: string;
  newPassword: string;
  foundationName?: string;
}

export function PasswordChangedEmail({
  memberName,
  newPassword,
  foundationName = "Future Planning",
}: PasswordChangedProps) {
  return (
    <EmailLayout
      preview="Your password has been changed"
      foundationName={foundationName}
    >
      <Text style={greeting}>Dear {memberName},</Text>
      <Text style={paragraph}>
        Your account password has been changed by an administrator.
      </Text>

      <Section style={passwordBox}>
        <Text style={passwordLabel}>Your New Password</Text>
        <Text style={passwordValue}>{newPassword}</Text>
      </Section>

      <Section style={warningBox}>
        <Text style={warningText}>
          For your security, please change your password after logging in. Go to
          your Profile and use the Change Password option.
        </Text>
      </Section>

      <Text style={paragraph}>
        If you did not expect this change, please contact your administrator
        immediately.
      </Text>

      <Text style={regards}>
        Best regards,
        <br />
        {foundationName}
      </Text>
    </EmailLayout>
  );
}

const greeting = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#18181b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "0 0 16px",
};

const passwordBox = {
  backgroundColor: "#f0fdfa",
  border: "1px solid #0a9396",
  borderRadius: "6px",
  padding: "20px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const passwordLabel = {
  fontSize: "12px",
  color: "#71717a",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const passwordValue = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#18181b",
  margin: "0",
  fontFamily: "monospace",
  letterSpacing: "0.1em",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
};

const warningText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#92400e",
  margin: "0",
};

const regards = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#3f3f46",
  margin: "24px 0 0",
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/email/templates/password-changed.tsx
git commit -m "feat: add password changed email template"
```

---

### Task 10: Integrate Receipt Email into Payment Creation

**Files:**
- Modify: `src/app/api/payments/route.ts:1-7,151`

- [ ] **Step 1: Add email import to payments route**

In `src/app/api/payments/route.ts`, add after line 7 (`import { createAuditLog } from "@/lib/audit";`):

```typescript
import { sendEmail } from "@/lib/email/send";
import { PaymentReceiptEmail } from "@/lib/email/templates/payment-receipt";
import User from "@/models/User";
```

- [ ] **Step 2: Add email sending after notification creation**

In `src/app/api/payments/route.ts`, add after line 151 (after `createPaymentNotification` call, before the return statement on line 153):

```typescript
    // Send receipt email (non-blocking)
    const member = await User.findById(parsed.data.userId).select("email fullName");
    if (member?.email) {
      const approverName = typeof populated?.approvedBy === "object"
        ? (populated.approvedBy as { fullName: string }).fullName
        : "Admin";
      sendEmail({
        to: member.email,
        toUserId: parsed.data.userId,
        subject: `Payment Receipt - ${payment.receiptNo}`,
        type: "payment_receipt",
        react: PaymentReceiptEmail({
          memberName: member.fullName,
          receiptNo: payment.receiptNo,
          monthName: MONTHS[parsed.data.month - 1],
          year: parsed.data.year,
          amount: parsed.data.amount,
          penalty: parsed.data.penalty || 0,
          penaltyReason: parsed.data.penaltyReason,
          approvedBy: approverName,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }),
        metadata: { paymentId: payment._id.toString(), receiptNo: payment.receiptNo },
      }).catch(() => {}); // Fire-and-forget
    }
```

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/payments/route.ts
git commit -m "feat: send payment receipt email on payment creation"
```

---

### Task 11: Integrate Notice Email into Notice Creation

**Files:**
- Modify: `src/app/api/notices/route.ts:1-7,63`

- [ ] **Step 1: Add email imports to notices route**

In `src/app/api/notices/route.ts`, add after line 7 (`import { createAuditLog } from "@/lib/audit";`):

```typescript
import { sendEmail } from "@/lib/email/send";
import { NoticeEmail } from "@/lib/email/templates/notice";
import User from "@/models/User";
```

- [ ] **Step 2: Add email sending after notification creation**

In `src/app/api/notices/route.ts`, add after line 63 (after `createNoticeNotification` call, before the return on line 65):

```typescript
    // Send notice email to all active members (non-blocking)
    const activeMembers = await User.find({
      isDisabled: false,
      email: { $exists: true, $ne: "" },
    }).select("_id email");
    const creatorName = typeof populated?.createdBy === "object"
      ? (populated.createdBy as { fullName: string }).fullName
      : "Admin";
    const noticeDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    for (const member of activeMembers) {
      sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Notice: ${parsed.data.title}`,
        type: "notice",
        react: NoticeEmail({
          title: parsed.data.title,
          body: parsed.data.body,
          postedBy: creatorName,
          date: noticeDate,
        }),
        metadata: { noticeId: notice._id.toString() },
      }).catch(() => {}); // Fire-and-forget
    }
```

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/notices/route.ts
git commit -m "feat: send notice email to all active members on notice creation"
```

---

### Task 12: Integrate Password Changed Email

**Files:**
- Modify: `src/app/api/users/[id]/route.ts:1-7,113-117`

- [ ] **Step 1: Add email imports**

In `src/app/api/users/[id]/route.ts`, add after line 7 (`import { createAuditLog } from "@/lib/audit";`):

```typescript
import { sendEmail } from "@/lib/email/send";
import { PasswordChangedEmail } from "@/lib/email/templates/password-changed";
```

- [ ] **Step 2: Send password changed email**

In `src/app/api/users/[id]/route.ts`, add after line 117 (after the password reset audit log block, before `return NextResponse.json`):

```typescript
      // Send password changed email (non-blocking)
      if (user?.email) {
        sendEmail({
          to: user.email,
          toUserId: id,
          subject: "Your Password Has Been Changed",
          type: "password_changed",
          react: PasswordChangedEmail({
            memberName: user.fullName,
            newPassword: body.password,
          }),
        }).catch(() => {}); // Fire-and-forget
      }
```

Note: `body.password` contains the plain-text password before it was hashed at line 77. `user` (line 94) is the updated user document with the email.

- [ ] **Step 3: Verify the app builds**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/users/[id]/route.ts
git commit -m "feat: send password changed email when admin resets password"
```

---

### Task 13: Auto Payment Reminder Cron Endpoint

**Files:**
- Create: `src/app/api/emails/reminders/route.ts`

- [ ] **Step 1: Create the cron endpoint**

Create `src/app/api/emails/reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Settings from "@/models/Settings";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";

const REMINDER_DAYS = [1, 5, 10, 15];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const dayOfMonth = today.getDate();

  // Only run on reminder days
  if (!REMINDER_DAYS.includes(dayOfMonth)) {
    return NextResponse.json({ message: "Not a reminder day", sent: 0 });
  }

  try {
    await dbConnect();

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const settings = await Settings.findOne();
    const monthlyAmount = settings?.monthlyAmount || 2000;
    const foundationName = settings?.foundationName || "Future Planning";

    // Check if current month is a skipped month
    const isSkipped = settings?.skippedMonths?.some(
      (s) => s.month === currentMonth && s.year === currentYear
    );
    if (isSkipped) {
      return NextResponse.json({ message: "Skipped month", sent: 0 });
    }

    // Find members who have already paid for this month
    const paidPayments = await Payment.find({
      month: currentMonth,
      year: currentYear,
      isDeleted: false,
      status: "approved",
    }).select("userId");
    const paidUserIds = paidPayments.map((p) => p.userId.toString());

    // Find active members with email who haven't paid
    const unpaidMembers = await User.find({
      isDisabled: false,
      role: "user",
      email: { $exists: true, $ne: "" },
      ...(paidUserIds.length > 0 ? { _id: { $nin: paidUserIds } } : {}),
    }).select("_id email fullName");

    let sentCount = 0;
    for (const member of unpaidMembers) {
      const result = await sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Payment Reminder - ${MONTHS[currentMonth - 1]} ${currentYear}`,
        type: "payment_reminder",
        react: PaymentReminderEmail({
          memberName: member.fullName,
          amount: monthlyAmount,
          monthName: MONTHS[currentMonth - 1],
          year: currentYear,
          foundationName,
        }),
        metadata: { month: currentMonth, year: currentYear, day: dayOfMonth },
      });
      if (result.success) sentCount++;
    }

    return NextResponse.json({
      message: `Reminders sent for ${MONTHS[currentMonth - 1]} ${currentYear}`,
      sent: sentCount,
      total: unpaidMembers.length,
    });
  } catch (error) {
    console.error("Cron reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify the app builds**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/emails/reminders/route.ts
git commit -m "feat: add cron endpoint for automatic payment reminders"
```

---

### Task 14: Manual Send Reminder Endpoint

**Files:**
- Create: `src/app/api/emails/send-reminder/route.ts`

- [ ] **Step 1: Create the manual reminder endpoint**

Create `src/app/api/emails/send-reminder/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Settings from "@/models/Settings";
import { sendEmail } from "@/lib/email/send";
import { PaymentReminderEmail } from "@/lib/email/templates/payment-reminder";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { userIds, month, year } = body as {
      userIds: string[];
      month: number;
      year: number;
    };

    if (!userIds?.length || !month || !year) {
      return NextResponse.json(
        { success: false, error: "userIds, month, and year are required" },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne();
    const monthlyAmount = settings?.monthlyAmount || 2000;
    const foundationName = settings?.foundationName || "Future Planning";

    const members = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: "" },
    }).select("_id email fullName");

    let sentCount = 0;
    for (const member of members) {
      const result = await sendEmail({
        to: member.email,
        toUserId: member._id.toString(),
        subject: `Payment Reminder - ${MONTHS[month - 1]} ${year}`,
        type: "payment_reminder",
        react: PaymentReminderEmail({
          memberName: member.fullName,
          amount: monthlyAmount,
          monthName: MONTHS[month - 1],
          year,
          foundationName,
        }),
        metadata: { month, year, manual: true },
      });
      if (result.success) sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Reminders sent to ${sentCount} of ${members.length} members`,
      sent: sentCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/emails/send-reminder/route.ts
git commit -m "feat: add manual payment reminder endpoint for admin"
```

---

### Task 15: Email Logs API Endpoint

**Files:**
- Create: `src/app/api/emails/logs/route.ts`

- [ ] **Step 1: Create the email logs API**

Create `src/app/api/emails/logs/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import EmailLog from "@/models/EmailLog";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as
      | { userId: string; role: string }
      | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await EmailLog.countDocuments(query);
    const logs = await EmailLog.find(query)
      .populate("toUserId", "fullName username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch email logs" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/emails/logs/route.ts
git commit -m "feat: add email logs API endpoint for admin"
```

---

### Task 16: Email Logs Redux API Slice

**Files:**
- Create: `src/store/email-logs-api.ts`
- Modify: `src/store/api.ts:8`

- [ ] **Step 1: Add EmailLogs tag to base API**

In `src/store/api.ts`, change line 8 from:

```typescript
  tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs"],
```

to:

```typescript
  tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs", "EmailLogs"],
```

- [ ] **Step 2: Create email logs API slice**

Create `src/store/email-logs-api.ts`:

```typescript
import { api } from "./api";
import { IEmailLog, PaginatedResponse } from "@/types";

interface GetEmailLogsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

interface SendReminderParams {
  userIds: string[];
  month: number;
  year: number;
}

export const emailLogsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmailLogs: builder.query<PaginatedResponse<IEmailLog>, GetEmailLogsParams>({
      query: (params) => ({ url: "/emails/logs", params }),
      providesTags: ["EmailLogs"],
    }),
    sendManualReminder: builder.mutation<
      { success: boolean; message: string; sent: number },
      SendReminderParams
    >({
      query: (body) => ({
        url: "/emails/send-reminder",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmailLogs"],
    }),
  }),
});

export const { useGetEmailLogsQuery, useSendManualReminderMutation } = emailLogsApi;
```

- [ ] **Step 3: Commit**

```bash
git add src/store/api.ts src/store/email-logs-api.ts
git commit -m "feat: add email logs Redux API slice"
```

---

### Task 17: Admin Email Logs Page

**Files:**
- Create: `src/app/(admin)/admin/email-logs/page.tsx`

- [ ] **Step 1: Create the email logs admin page**

Create `src/app/(admin)/admin/email-logs/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useGetEmailLogsQuery } from "@/store/email-logs-api";
import { IEmailLog, IUser } from "@/types";
import { Table, Select, Pagination, Tag } from "antd";
import { Mail, CheckCircle2, XCircle } from "lucide-react";
import type { ColumnsType } from "antd/es/table";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "notice", label: "Notice" },
  { value: "password_changed", label: "Password Changed" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

const TYPE_COLORS: Record<string, string> = {
  payment_reminder: "blue",
  payment_receipt: "green",
  notice: "purple",
  password_changed: "orange",
};

const TYPE_LABELS: Record<string, string> = {
  payment_reminder: "Payment Reminder",
  payment_receipt: "Payment Receipt",
  notice: "Notice",
  password_changed: "Password Changed",
};

export default function EmailLogsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading } = useGetEmailLogsQuery({
    page,
    limit,
    type: filterType,
    status: filterStatus,
  });

  const columns: ColumnsType<IEmailLog> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Recipient",
      key: "recipient",
      width: 200,
      render: (_: unknown, record: IEmailLog) => {
        const user = record.toUserId as IUser | undefined;
        return (
          <div>
            <div className="font-medium text-sm">
              {user && typeof user === "object" ? user.fullName : "—"}
            </div>
            <div className="text-xs text-muted-foreground">{record.to}</div>
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: string) => (
        <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Tag>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) =>
        status === "sent" ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle2 size={14} /> Sent
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <XCircle size={14} /> Failed
          </span>
        ),
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
      width: 200,
      ellipsis: true,
      render: (error: string) =>
        error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Email Logs</h1>
          <p className="text-sm text-muted-foreground">
            Track all emails sent from the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          <Select
            style={{ width: 180 }}
            value={filterType}
            onChange={(val) => {
              setFilterType(val);
              setPage(1);
            }}
            options={TYPE_OPTIONS}
            placeholder="Filter by type"
          />
          <Select
            style={{ width: 140 }}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total ?? 0} total emails
          </p>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="_id"
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
          />
        </div>

        {(data?.pagination.totalPages ?? 0) > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              current={page}
              pageSize={limit}
              total={data?.pagination.total ?? 0}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the app builds**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/email-logs/page.tsx
git commit -m "feat: add admin email logs page"
```

---

### Task 18: Add Email Logs Link to Admin Sidebar

**Files:**
- Modify: Admin layout/sidebar (find the sidebar navigation config)

- [ ] **Step 1: Find and update the sidebar navigation**

Search for the admin sidebar component that contains navigation links (likely in `src/components/layout/` or the admin layout). Add an "Email Logs" link with the Mail icon:

```typescript
{
  label: "Email Logs",
  href: "/admin/email-logs",
  icon: Mail, // from lucide-react
}
```

Add this after the "Audit Logs" entry in the navigation items array.

- [ ] **Step 2: Verify navigation works**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add email logs link to admin sidebar navigation"
```

---

### Task 19: Final Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run a full build**

```bash
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

Manually verify:
- Admin sidebar shows "Email Logs" link
- Email Logs page loads with filters and empty table
- (Optional) Create a test payment to see if receipt email is sent and logged

- [ ] **Step 3: Final commit if any cleanup needed**

```bash
git status
```

If clean, this task is done. If there are lint fixes or minor adjustments, commit them:

```bash
git add -A
git commit -m "chore: cleanup and final verification for email system"
```
