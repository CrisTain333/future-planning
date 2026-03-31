# Phase 1: Foundation & Infrastructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the full project skeleton — Next.js 15, MongoDB models, NextAuth, Redux Toolkit, shared layouts, login page, and seed script — so all future phases build on a working foundation.

**Architecture:** Next.js 15 App Router with TypeScript. MongoDB via Mongoose for data. NextAuth v5 for session-based auth. Redux Toolkit with RTK Query for client state and API calls. Tailwind CSS 4 + shadcn/ui for mobile-first UI. Primary color `#40916c` centralized in CSS variables.

**Tech Stack:** Next.js 15, TypeScript 5, MongoDB/Mongoose 8, NextAuth v5, Redux Toolkit/RTK Query, Tailwind CSS 4, shadcn/ui, Zod, React Hook Form, Lucide React

---

## File Structure

```
future-planning/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx              # Login page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Sidebar + Header + Footer layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Placeholder dashboard (role-based redirect later)
│   │   │   └── profile/
│   │   │       └── page.tsx              # Placeholder profile page
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                # Admin route guard layout
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       │   └── page.tsx          # Placeholder
│   │   │       ├── notices/
│   │   │       │   └── page.tsx          # Placeholder
│   │   │       ├── accounting/
│   │   │       │   └── page.tsx          # Placeholder
│   │   │       └── settings/
│   │   │           └── page.tsx          # Placeholder
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts          # NextAuth handler
│   │   ├── layout.tsx                    # Root layout (Redux + Session providers)
│   │   ├── page.tsx                      # Redirect to /login
│   │   └── globals.css                   # Tailwind + custom theme variables
│   ├── components/
│   │   ├── ui/                           # shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx               # Role-aware sidebar with mobile Sheet
│   │   │   ├── header.tsx                # Header with bell + avatar dropdown
│   │   │   └── footer.tsx                # Simple footer
│   │   └── providers/
│   │       ├── redux-provider.tsx        # Redux store provider
│   │       └── session-provider.tsx      # NextAuth session provider
│   ├── lib/
│   │   ├── db.ts                         # MongoDB connection with pooling
│   │   ├── auth.ts                       # NextAuth v5 configuration
│   │   └── utils.ts                      # shadcn/ui cn() utility
│   ├── store/
│   │   ├── store.ts                      # Redux store configuration
│   │   └── api.ts                        # RTK Query base API
│   ├── models/
│   │   ├── User.ts                       # User mongoose model
│   │   ├── Payment.ts                    # Payment mongoose model
│   │   ├── Notice.ts                     # Notice mongoose model
│   │   ├── Notification.ts              # Notification mongoose model
│   │   ├── AuditLog.ts                  # AuditLog mongoose model
│   │   └── Settings.ts                  # Settings mongoose model
│   ├── validations/
│   │   ├── auth.ts                       # Login validation schema
│   │   ├── user.ts                       # User CRUD validation schemas
│   │   ├── payment.ts                    # Payment validation schemas
│   │   └── notice.ts                     # Notice validation schemas
│   ├── types/
│   │   └── index.ts                      # All TypeScript interfaces
│   └── middleware.ts                     # NextAuth route protection middleware
├── scripts/
│   └── seed.ts                           # Database seed script
├── .env.example                          # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── components.json                       # shadcn/ui config
```

---

## Task 1: Project Initialization & Dependencies

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.example`, `components.json`
- Create: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/cristain/Documents/projects
npx create-next-app@latest future-planning --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

When prompted, accept defaults. This creates the base project with Next.js 15, TypeScript, Tailwind CSS 4, ESLint, App Router, and `src/` directory.

- [ ] **Step 2: Install all project dependencies**

```bash
cd /Users/cristain/Documents/projects/future-planning
npm install mongoose@8 next-auth@5 @auth/mongodb-adapter @reduxjs/toolkit react-redux bcryptjs zod react-hook-form @hookform/resolvers pdfkit next-cloudinary lucide-react recharts clsx tailwind-merge class-variance-authority
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D @types/bcryptjs @types/pdfkit
```

- [ ] **Step 4: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

Accept defaults. This creates `components.json` and sets up `src/components/ui/`.

- [ ] **Step 5: Install required shadcn/ui components**

```bash
npx shadcn@latest add button card input label select table dialog badge avatar dropdown-menu pagination textarea toast skeleton sheet separator
```

- [ ] **Step 6: Set up the custom primary color theme**

Replace the contents of `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate/css";

@custom-variant dark (&:is(.dark *));

:root {
  --primary: 153 50% 40%;
  --primary-foreground: 0 0% 100%;

  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 153 50% 40%;
  --radius: 0.5rem;
  --chart-1: 153 50% 40%;
  --chart-2: 153 50% 50%;
  --chart-3: 153 50% 30%;
  --chart-4: 153 50% 60%;
  --chart-5: 153 50% 20%;
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 153 50% 40%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 153 50% 95%;
  --sidebar-accent-foreground: 153 50% 25%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 153 50% 40%;
}

.dark {
  --primary: 153 50% 50%;
  --primary-foreground: 0 0% 100%;

  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 3.9%;
  --popover-foreground: 0 0% 98%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 153 50% 50%;
  --chart-1: 153 50% 50%;
  --chart-2: 153 50% 60%;
  --chart-3: 153 50% 40%;
  --chart-4: 153 50% 70%;
  --chart-5: 153 50% 30%;
  --sidebar-background: 0 0% 5%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-primary: 153 50% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 153 50% 15%;
  --sidebar-accent-foreground: 153 50% 80%;
  --sidebar-border: 0 0% 14.9%;
  --sidebar-ring: 153 50% 50%;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --color-sidebar-background: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

The primary color `#40916c` converts to HSL `153 50% 40%`. All `--primary`, `--ring`, `--sidebar-primary`, and `--chart-*` variables reference this hue. To change the primary color later, update the HSL values in `:root`.

- [ ] **Step 7: Create environment template**

Create `.env.example`:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/future-planning

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-key-here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

- [ ] **Step 8: Update root page to redirect to login**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
```

- [ ] **Step 9: Verify the app runs**

```bash
npm run dev
```

Expected: App starts on `http://localhost:3000` and redirects to `/login` (404 is fine — login page doesn't exist yet).

- [ ] **Step 10: Commit**

```bash
git init
echo "node_modules\n.next\n.env.local\n.env" > .gitignore
git add .
git commit -m "feat: initialize Next.js 15 project with Tailwind, shadcn/ui, and dependencies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create all TypeScript interfaces**

Create `src/types/index.ts`:

```typescript
export interface IUser {
  _id: string;
  fullName: string;
  username: string;
  email?: string;
  password?: string; // excluded from API responses
  phone?: string;
  address?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  profilePicture?: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  userId: string | IUser;
  month: number; // 1-12
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  note?: string;
  receiptNo: string;
  status: "approved" | "deleted";
  approvedBy: string | IUser;
  isDeleted: boolean;
  deletedBy?: string | IUser;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface INotice {
  _id: string;
  title: string;
  body: string;
  createdBy: string | IUser;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: "payment_recorded" | "notice_posted";
  title: string;
  message: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  action:
    | "payment_created"
    | "payment_edited"
    | "payment_deleted"
    | "user_created"
    | "user_edited"
    | "user_disabled"
    | "user_enabled"
    | "notice_created"
    | "notice_edited"
    | "notice_deleted"
    | "settings_updated";
  performedBy: string | IUser;
  targetUser?: string | IUser;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface ISettings {
  _id: string;
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Session type extension for NextAuth
export interface SessionUser {
  userId: string;
  role: "admin" | "user";
  fullName: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript interfaces for all models and API responses"
```

---

## Task 3: MongoDB Connection

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create the MongoDB connection module**

Create `src/lib/db.ts`:

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add MongoDB connection with serverless pooling"
```

---

## Task 4: Mongoose Models

**Files:**
- Create: `src/models/User.ts`
- Create: `src/models/Payment.ts`
- Create: `src/models/Notice.ts`
- Create: `src/models/Notification.ts`
- Create: `src/models/AuditLog.ts`
- Create: `src/models/Settings.ts`

- [ ] **Step 1: Create User model**

Create `src/models/User.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  fullName: string;
  username: string;
  email?: string;
  password: string;
  phone?: string;
  address?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
  profilePicture?: string;
  role: "admin" | "user";
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    email: { type: String, sparse: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    profilePicture: { type: String },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    isDisabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });

const User = mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
export default User;
```

- [ ] **Step 2: Create Payment model**

Create `src/models/Payment.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;
  penalty: number;
  penaltyReason?: string;
  note?: string;
  receiptNo: string;
  status: "approved" | "deleted";
  approvedBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    penalty: { type: Number, default: 0 },
    penaltyReason: { type: String },
    note: { type: String },
    receiptNo: { type: String, required: true, unique: true },
    status: { type: String, enum: ["approved", "deleted"], default: "approved" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ month: 1, year: 1 });

const Payment = mongoose.models.Payment || mongoose.model<IPaymentDocument>("Payment", PaymentSchema);
export default Payment;
```

- [ ] **Step 3: Create Notice model**

Create `src/models/Notice.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface INoticeDocument extends Document {
  title: string;
  body: string;
  createdBy: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INoticeDocument>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NoticeSchema.index({ createdAt: -1 });

const Notice = mongoose.models.Notice || mongoose.model<INoticeDocument>("Notice", NoticeSchema);
export default Notice;
```

- [ ] **Step 4: Create Notification model**

Create `src/models/Notification.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: "payment_recorded" | "notice_posted";
  title: string;
  message: string;
  referenceId: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["payment_recorded", "notice_posted"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
export default Notification;
```

- [ ] **Step 5: Create AuditLog model**

Create `src/models/AuditLog.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLogDocument extends Document {
  action:
    | "payment_created"
    | "payment_edited"
    | "payment_deleted"
    | "user_created"
    | "user_edited"
    | "user_disabled"
    | "user_enabled"
    | "notice_created"
    | "notice_edited"
    | "notice_deleted"
    | "settings_updated";
  performedBy: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      enum: [
        "payment_created",
        "payment_edited",
        "payment_deleted",
        "user_created",
        "user_edited",
        "user_disabled",
        "user_enabled",
        "notice_created",
        "notice_edited",
        "notice_deleted",
        "settings_updated",
      ],
      required: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: Schema.Types.ObjectId, ref: "User" },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ performedBy: 1 });
AuditLogSchema.index({ targetUser: 1 });
AuditLogSchema.index({ createdAt: -1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>("AuditLog", AuditLogSchema);
export default AuditLog;
```

- [ ] **Step 6: Create Settings model**

Create `src/models/Settings.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface ISettingsDocument extends Document {
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    foundationName: { type: String, default: "Future Planning" },
    monthlyAmount: { type: Number, default: 2000 },
    initialAmount: { type: Number, default: 10000 },
    startMonth: { type: Number, default: 3 },
    startYear: { type: Number, default: 2026 },
  },
  { timestamps: true }
);

const Settings =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>("Settings", SettingsSchema);
export default Settings;
```

- [ ] **Step 7: Commit**

```bash
git add src/models/
git commit -m "feat: add all 6 Mongoose models with indexes"
```

---

## Task 5: Zod Validation Schemas

**Files:**
- Create: `src/validations/auth.ts`
- Create: `src/validations/user.ts`
- Create: `src/validations/payment.ts`
- Create: `src/validations/notice.ts`

- [ ] **Step 1: Create auth validation**

Create `src/validations/auth.ts`:

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 2: Create user validation**

Create `src/validations/user.ts`:

```typescript
import { z } from "zod";

const bloodGroupEnum = z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required").toLowerCase(),
  password: z.string().min(4, "Password must be at least 4 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
  role: z.enum(["admin", "user"]).default("user"),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  username: z.string().min(1, "Username is required").toLowerCase().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
  role: z.enum(["admin", "user"]).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  username: z.string().min(1, "Username is required").toLowerCase().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  bloodGroup: bloodGroupEnum.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(4, "Current password is required"),
  newPassword: z.string().min(4, "New password must be at least 4 characters"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
```

- [ ] **Step 3: Create payment validation**

Create `src/validations/payment.ts`:

```typescript
import { z } from "zod";

export const createPaymentSchema = z.object({
  userId: z.string().min(1, "Member is required"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2026),
  amount: z.number().positive("Amount must be positive"),
  penalty: z.number().min(0, "Penalty cannot be negative").default(0),
  penaltyReason: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  penalty: z.number().min(0, "Penalty cannot be negative").optional(),
  penaltyReason: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
```

- [ ] **Step 4: Create notice validation**

Create `src/validations/notice.ts`:

```typescript
import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  body: z.string().min(1, "Body is required").optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
```

- [ ] **Step 5: Commit**

```bash
git add src/validations/
git commit -m "feat: add Zod validation schemas for auth, user, payment, notice"
```

---

## Task 6: NextAuth v5 Authentication

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create NextAuth configuration**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        await dbConnect();

        const user = await User.findOne({
          username: (credentials.username as string).toLowerCase(),
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.isDisabled) {
          throw new Error("Your account has been disabled. Contact admin.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role: string }).role;
        token.fullName = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { userId: string }).userId = token.userId as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { fullName: string }).fullName = token.fullName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

- [ ] **Step 2: Create NextAuth API route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create route protection middleware**

Create `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string })?.role;

  // Public routes
  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protected routes — redirect to login if not authenticated
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
  ],
};
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/middleware.ts
git commit -m "feat: add NextAuth v5 with credentials provider and route middleware"
```

---

## Task 7: Redux Toolkit & RTK Query Setup

**Files:**
- Create: `src/store/store.ts`
- Create: `src/store/api.ts`
- Create: `src/components/providers/redux-provider.tsx`
- Create: `src/components/providers/session-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create RTK Query base API**

Create `src/store/api.ts`:

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs"],
  endpoints: () => ({}),
});
```

- [ ] **Step 2: Create Redux store**

Create `src/store/store.ts`:

```typescript
import { configureStore } from "@reduxjs/toolkit";
import { api } from "./api";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
```

- [ ] **Step 3: Create Redux provider**

Create `src/components/providers/redux-provider.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "@/store/store";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

- [ ] **Step 4: Create session provider**

Create `src/components/providers/session-provider.tsx`:

```tsx
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 5: Update root layout with providers**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/redux-provider";
import SessionProvider from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Future Planning",
  description: "Foundation Accounting System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <ReduxProvider>
            {children}
            <Toaster />
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the app compiles**

```bash
npm run dev
```

Expected: App compiles without errors. The Redux and Session providers wrap the application.

- [ ] **Step 7: Commit**

```bash
git add src/store/ src/components/providers/ src/app/layout.tsx
git commit -m "feat: add Redux Toolkit store, RTK Query base API, and providers"
```

---

## Task 8: Shared Layout — Sidebar, Header, Footer

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/layout/footer.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Calculator,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const memberLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/notices", label: "Notice Board", icon: Megaphone },
  { href: "/admin/accounting", label: "Accounting", icon: Calculator },
  { href: "/profile", label: "Profile", icon: UserCircle },
];

function SidebarContent({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const links = role === "admin" ? adminLinks : memberLinks;

  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-bold text-primary">Future Planning</h2>
      </div>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r bg-card h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent onClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Create the header component**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, LogOut, UserCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileSidebar } from "./sidebar";
import Link from "next/link";

export function Header() {
  const { data: session } = useSession();
  const fullName = (session?.user as { fullName?: string })?.fullName || "User";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <MobileSidebar />

      <div className="flex-1">
        <h1 className="text-lg font-semibold md:hidden text-primary">FP</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell placeholder — functional in Phase 4 */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {(session?.user as { role?: string })?.role}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create the footer component**

Create `src/components/layout/footer.tsx`:

```tsx
export function Footer() {
  return (
    <footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground">
      Future Planning &copy; {new Date().getFullYear()}
    </footer>
  );
}
```

- [ ] **Step 4: Create the authenticated dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create the admin layout with role guard**

Create `src/app/(admin)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
```

Note: The actual admin role guard is handled by `middleware.ts` (Task 6). This layout just provides the same shell. The middleware redirects non-admin users away from `/admin/*` routes.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/app/(dashboard)/layout.tsx src/app/(admin)/layout.tsx
git commit -m "feat: add mobile-first sidebar, header, footer, and authenticated layouts"
```

---

## Task 9: Placeholder Pages

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(dashboard)/profile/page.tsx`
- Create: `src/app/(admin)/admin/users/page.tsx`
- Create: `src/app/(admin)/admin/notices/page.tsx`
- Create: `src/app/(admin)/admin/accounting/page.tsx`
- Create: `src/app/(admin)/admin/settings/page.tsx`

- [ ] **Step 1: Create member dashboard placeholder**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Dashboard content coming in Phase 2.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create profile placeholder**

Create `src/app/(dashboard)/profile/page.tsx`:

```tsx
export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-muted-foreground">Profile page coming in Phase 3.</p>
    </div>
  );
}
```

- [ ] **Step 3: Create admin placeholder pages**

Create `src/app/(admin)/admin/users/page.tsx`:

```tsx
export default function ManageUsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Manage Users</h1>
      <p className="text-muted-foreground">User management coming in Phase 2.</p>
    </div>
  );
}
```

Create `src/app/(admin)/admin/notices/page.tsx`:

```tsx
export default function NoticesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Notice Board</h1>
      <p className="text-muted-foreground">Notice board coming in Phase 3.</p>
    </div>
  );
}
```

Create `src/app/(admin)/admin/accounting/page.tsx`:

```tsx
export default function AccountingPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Accounting</h1>
      <p className="text-muted-foreground">Accounting coming in Phase 2.</p>
    </div>
  );
}
```

Create `src/app/(admin)/admin/settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-muted-foreground">Settings coming in Phase 4.</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/ src/app/(admin)/
git commit -m "feat: add placeholder pages for all routes"
```

---

## Task 10: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-bold text-primary-foreground">FP</span>
          </div>
          <CardTitle className="text-2xl">Future Planning</CardTitle>
          <p className="text-sm text-muted-foreground">Foundation Accounting System</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter username"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(auth)/
git commit -m "feat: add login page with form validation and error handling"
```

---

## Task 11: Seed Script

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Create the seed script**

Create `scripts/seed.ts`:

```typescript
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env.local");
  process.exit(1);
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db!;

    // Seed Settings
    const settingsCollection = db.collection("settings");
    const existingSettings = await settingsCollection.findOne({});
    if (!existingSettings) {
      await settingsCollection.insertOne({
        foundationName: "Future Planning",
        monthlyAmount: 2000,
        initialAmount: 10000,
        startMonth: 3,
        startYear: 2026,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Settings seeded");
    } else {
      console.log("Settings already exist, skipping");
    }

    // Seed Admin User
    const usersCollection = db.collection("users");
    const existingAdmin = await usersCollection.findOne({ username: "admin" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("1234", 10);
      await usersCollection.insertOne({
        fullName: "Super Admin",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Admin user seeded (username: admin, password: 1234)");
    } else {
      console.log("Admin user already exists, skipping");
    }

    console.log("Seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
```

- [ ] **Step 2: Install dotenv and tsx for running the seed script**

```bash
npm install -D dotenv tsx
```

- [ ] **Step 3: Add seed command to package.json**

Add this to the `"scripts"` section of `package.json`:

```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 4: Create .env.local with your MongoDB URI**

Create `.env.local` (do NOT commit this file — it's in `.gitignore`):

```env
MONGODB_URI=mongodb+srv://<your-connection-string>
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-random-secret-here
```

Replace the MongoDB URI with your actual Atlas connection string.

- [ ] **Step 5: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Connected to MongoDB
Settings seeded
Admin user seeded (username: admin, password: 1234)
Seed complete!
```

- [ ] **Step 6: Commit**

```bash
git add scripts/seed.ts package.json .env.example
git commit -m "feat: add database seed script for default admin and settings"
```

---

## Task 12: End-to-End Verification

**Files:** None — this is a verification task.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: App compiles and starts on `http://localhost:3000`.

- [ ] **Step 2: Test redirect from root**

Open `http://localhost:3000` in the browser.

Expected: Redirects to `/login`.

- [ ] **Step 3: Test login with invalid credentials**

Enter username: `wrong`, password: `wrong`.

Expected: Error message "Invalid credentials" appears below the form.

- [ ] **Step 4: Test login with correct credentials**

Enter username: `admin`, password: `1234`.

Expected: Redirects to `/dashboard`. Sidebar shows all admin links (Dashboard, Manage Users, Notice Board, Accounting, Profile). Header shows avatar with "SA" initials and bell icon.

- [ ] **Step 5: Test mobile layout**

Open browser DevTools, toggle device toolbar, select iPhone 14 (390px wide).

Expected: Sidebar is hidden. Hamburger menu icon is visible in the header. Tapping it opens the sidebar as a Sheet overlay. All navigation links are visible and tappable.

- [ ] **Step 6: Test navigation**

Click each link in the sidebar: Dashboard, Manage Users, Notice Board, Accounting, Profile.

Expected: Each page loads with its placeholder title. URL changes correctly. Active link is highlighted in the sidebar.

- [ ] **Step 7: Test logout**

Click the avatar dropdown, click "Log out".

Expected: Redirects to `/login`. Navigating to `/dashboard` redirects back to `/login`.

- [ ] **Step 8: Test protected routes**

While logged out, navigate to `http://localhost:3000/dashboard`.

Expected: Redirects to `/login`.

- [ ] **Step 9: Final commit if any fixes were needed**

If any fixes were made during verification:

```bash
git add -A
git commit -m "fix: address issues found during Phase 1 verification"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Project init, deps, shadcn, theme | Project root, globals.css |
| 2 | TypeScript types | src/types/index.ts |
| 3 | MongoDB connection | src/lib/db.ts |
| 4 | All 6 Mongoose models | src/models/*.ts |
| 5 | Zod validation schemas | src/validations/*.ts |
| 6 | NextAuth v5 + middleware | src/lib/auth.ts, middleware.ts |
| 7 | Redux Toolkit + RTK Query + providers | src/store/*.ts, providers |
| 8 | Sidebar, header, footer, layouts | src/components/layout/*.tsx |
| 9 | Placeholder pages | All route page.tsx files |
| 10 | Login page | src/app/(auth)/login/page.tsx |
| 11 | Seed script | scripts/seed.ts |
| 12 | End-to-end verification | Manual testing |
