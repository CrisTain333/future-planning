# Investment Tracker (FD Module) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only investment tracking module for fixed deposits with CRUD management, compound interest calculations, and rich analytics visualizations.

**Architecture:** New `/admin/investments` page with 3 tabs (Overview, Fixed Deposits, Analytics). Server-side compound interest calculations via a dedicated analytics API endpoint. RTK Query for data fetching with tag-based invalidation. Recharts for all visualizations.

**Tech Stack:** Next.js 16 (App Router), MongoDB/Mongoose, RTK Query, Recharts, Ant Design + shadcn/ui, Framer Motion, TypeScript

---

### Task 1: Add TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Investment types to the types file**

Add the following at the end of `src/types/index.ts`, before any closing exports:

```typescript
export interface IInvestment {
  _id: string;
  bankName: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: "quarterly" | "monthly" | "yearly";
  startDate: string;
  tenureMonths: number;
  maturityDate: string;
  maturityAmount: number;
  status: "active" | "matured" | "withdrawn";
  memberContributions: string[] | IUser[];
  notes?: string;
  createdBy: string | IUser;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentAnalytics {
  summary: {
    totalInvested: number;
    totalInterestEarned: number;
    currentValue: number;
    projectedMaturityValue: number;
    activeFDCount: number;
    dailyEarnings: number;
    hourlyEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
  };
  perFD: Array<{
    id: string;
    bankName: string;
    principalAmount: number;
    currentValue: number;
    interestEarned: number;
    projectedInterest: number;
    progressPercent: number;
    daysRemaining: number;
    maturityDate: string;
    maturityAmount: number;
  }>;
  dailyGrowth: Array<{
    date: string;
    fundValue: number;
    dailyGain: number;
    cumulativeInterest: number;
    growthPercent: number;
  }>;
  growthChart: Array<{
    date: string;
    totalValue: number;
    [fdId: string]: number | string;
  }>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Investment and InvestmentAnalytics types"
```

---

### Task 2: Create Mongoose Model

**Files:**
- Create: `src/models/Investment.ts`

- [ ] **Step 1: Create the Investment model**

Create `src/models/Investment.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

if (typeof process !== "undefined" && !process.emitWarning) {
  process.emitWarning = (() => {}) as typeof process.emitWarning;
}

export interface IInvestmentDocument extends Document {
  bankName: string;
  principalAmount: number;
  interestRate: number;
  compoundingFrequency: "quarterly" | "monthly" | "yearly";
  startDate: Date;
  tenureMonths: number;
  maturityDate: Date;
  maturityAmount: number;
  status: "active" | "matured" | "withdrawn";
  memberContributions: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestmentDocument>(
  {
    bankName: { type: String, required: true },
    principalAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    compoundingFrequency: {
      type: String,
      enum: ["quarterly", "monthly", "yearly"],
      default: "quarterly",
    },
    startDate: { type: Date, required: true },
    tenureMonths: { type: Number, required: true, min: 1 },
    maturityDate: { type: Date, required: true },
    maturityAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "matured", "withdrawn"],
      default: "active",
    },
    memberContributions: [{ type: Schema.Types.ObjectId, ref: "User" }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

InvestmentSchema.index({ status: 1 });
InvestmentSchema.index({ maturityDate: 1 });

const Investment =
  mongoose.models.Investment ||
  mongoose.model<IInvestmentDocument>("Investment", InvestmentSchema);
export default Investment;
```

- [ ] **Step 2: Commit**

```bash
git add src/models/Investment.ts
git commit -m "feat: add Investment mongoose model"
```

---

### Task 3: Create CRUD API Routes

**Files:**
- Create: `src/app/api/investments/route.ts`
- Create: `src/app/api/investments/[id]/route.ts`
- Create: `src/lib/investment-utils.ts`

- [ ] **Step 1: Create the interest calculation utility**

Create `src/lib/investment-utils.ts`:

```typescript
/**
 * Calculate compound interest maturity amount.
 * A = P × (1 + r/n)^(n × t)
 */
export function calculateMaturityAmount(
  principal: number,
  annualRate: number,
  compoundingFrequency: "quarterly" | "monthly" | "yearly",
  tenureMonths: number
): number {
  const n =
    compoundingFrequency === "quarterly"
      ? 4
      : compoundingFrequency === "monthly"
        ? 12
        : 1;
  const r = annualRate / 100;
  const t = tenureMonths / 12;
  const amount = principal * Math.pow(1 + r / n, n * t);
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate accrued value at a given number of days since start.
 */
export function calculateValueAtDay(
  principal: number,
  annualRate: number,
  compoundingFrequency: "quarterly" | "monthly" | "yearly",
  daysSinceStart: number
): number {
  const n =
    compoundingFrequency === "quarterly"
      ? 4
      : compoundingFrequency === "monthly"
        ? 12
        : 1;
  const r = annualRate / 100;
  const t = daysSinceStart / 365;
  const amount = principal * Math.pow(1 + r / n, n * t);
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate maturity date from start date + tenure in months.
 */
export function calculateMaturityDate(
  startDate: Date,
  tenureMonths: number
): Date {
  const maturity = new Date(startDate);
  maturity.setMonth(maturity.getMonth() + tenureMonths);
  return maturity;
}
```

- [ ] **Step 2: Create the list + create API route**

Create `src/app/api/investments/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import {
  calculateMaturityAmount,
  calculateMaturityDate,
} from "@/lib/investment-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, string> = {};
    if (status) filter.status = status;

    const investments = await Investment.find(filter)
      .populate("memberContributions", "fullName username")
      .populate("createdBy", "fullName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: investments });
  } catch (error) {
    console.error("Get investments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const {
      bankName,
      principalAmount,
      interestRate,
      compoundingFrequency = "quarterly",
      startDate,
      tenureMonths,
      memberContributions = [],
      notes,
    } = body;

    if (!bankName || !principalAmount || !interestRate || !startDate || !tenureMonths) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const maturityDate = calculateMaturityDate(start, tenureMonths);
    const maturityAmount = calculateMaturityAmount(
      principalAmount,
      interestRate,
      compoundingFrequency,
      tenureMonths
    );

    const investment = await Investment.create({
      bankName,
      principalAmount,
      interestRate,
      compoundingFrequency,
      startDate: start,
      tenureMonths,
      maturityDate,
      maturityAmount,
      memberContributions,
      notes,
      createdBy: currentUser.userId,
    });

    return NextResponse.json(
      { success: true, data: investment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create investment" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create the update + delete API route**

Create `src/app/api/investments/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import {
  calculateMaturityAmount,
  calculateMaturityDate,
} from "@/lib/investment-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const existing = await Investment.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404 }
      );
    }

    // Recalculate if financial fields changed
    const principalAmount = body.principalAmount ?? existing.principalAmount;
    const interestRate = body.interestRate ?? existing.interestRate;
    const compoundingFrequency = body.compoundingFrequency ?? existing.compoundingFrequency;
    const tenureMonths = body.tenureMonths ?? existing.tenureMonths;
    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;

    const maturityDate = calculateMaturityDate(startDate, tenureMonths);
    const maturityAmount = calculateMaturityAmount(
      principalAmount,
      interestRate,
      compoundingFrequency,
      tenureMonths
    );

    const updated = await Investment.findByIdAndUpdate(
      id,
      {
        ...body,
        startDate,
        maturityDate,
        maturityAmount,
      },
      { new: true }
    )
      .populate("memberContributions", "fullName username")
      .populate("createdBy", "fullName");

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update investment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const deleted = await Investment.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { message: "Investment deleted" } });
  } catch (error) {
    console.error("Delete investment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete investment" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/investment-utils.ts src/app/api/investments/route.ts src/app/api/investments/\[id\]/route.ts
git commit -m "feat: add investment CRUD API routes and calculation utils"
```

---

### Task 4: Create Analytics API Endpoint

**Files:**
- Create: `src/app/api/investments/analytics/route.ts`

- [ ] **Step 1: Create the analytics endpoint**

Create `src/app/api/investments/analytics/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Investment from "@/models/Investment";
import { calculateValueAtDay } from "@/lib/investment-utils";

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user as unknown as {
      userId: string;
      role: string;
    } | undefined;
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const investments = await Investment.find({}).sort({ startDate: 1 });
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeInvestments = investments.filter((inv) => inv.status === "active");

    // --- Summary ---
    let totalInvested = 0;
    let totalInterestEarned = 0;
    let currentValue = 0;
    let projectedMaturityValue = 0;

    const perFD = investments.map((inv) => {
      const start = new Date(inv.startDate);
      const daysSinceStart = Math.max(
        0,
        Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const cv = inv.status === "active"
        ? calculateValueAtDay(
            inv.principalAmount,
            inv.interestRate,
            inv.compoundingFrequency,
            daysSinceStart
          )
        : inv.maturityAmount;
      const interestEarned = cv - inv.principalAmount;
      const projectedInterest = inv.maturityAmount - inv.principalAmount;
      const progressPercent =
        projectedInterest > 0
          ? Math.min(100, Math.round((interestEarned / projectedInterest) * 100))
          : 0;

      const matDate = new Date(inv.maturityDate);
      const daysRemaining = Math.max(
        0,
        Math.ceil((matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (inv.status === "active") {
        totalInvested += inv.principalAmount;
        totalInterestEarned += interestEarned;
        currentValue += cv;
        projectedMaturityValue += inv.maturityAmount;
      }

      return {
        id: inv._id.toString(),
        bankName: inv.bankName,
        principalAmount: inv.principalAmount,
        currentValue: Math.round(cv * 100) / 100,
        interestEarned: Math.round(interestEarned * 100) / 100,
        projectedInterest: Math.round(projectedInterest * 100) / 100,
        progressPercent,
        daysRemaining,
        maturityDate: inv.maturityDate.toISOString(),
        maturityAmount: inv.maturityAmount,
      };
    });

    // Daily earnings (sum across all active FDs)
    let dailyEarnings = 0;
    for (const inv of activeInvestments) {
      const start = new Date(inv.startDate);
      const daysSinceStart = Math.max(
        0,
        Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );
      const valueToday = calculateValueAtDay(
        inv.principalAmount,
        inv.interestRate,
        inv.compoundingFrequency,
        daysSinceStart
      );
      const valueYesterday = calculateValueAtDay(
        inv.principalAmount,
        inv.interestRate,
        inv.compoundingFrequency,
        Math.max(0, daysSinceStart - 1)
      );
      dailyEarnings += valueToday - valueYesterday;
    }
    dailyEarnings = Math.round(dailyEarnings * 100) / 100;

    const summary = {
      totalInvested,
      totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      projectedMaturityValue: Math.round(projectedMaturityValue * 100) / 100,
      activeFDCount: activeInvestments.length,
      dailyEarnings,
      hourlyEarnings: Math.round((dailyEarnings / 24) * 100) / 100,
      monthlyEarnings: Math.round(dailyEarnings * 30 * 100) / 100,
      yearlyEarnings: Math.round(dailyEarnings * 365 * 100) / 100,
    };

    // --- Daily Growth (last 30 days) ---
    const dailyGrowth: Array<{
      date: string;
      fundValue: number;
      dailyGain: number;
      cumulativeInterest: number;
      growthPercent: number;
    }> = [];

    for (let d = 29; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      let totalValue = 0;
      let totalPrincipal = 0;

      for (const inv of activeInvestments) {
        const start = new Date(inv.startDate);
        if (date < start) continue;
        const days = Math.floor(
          (date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalValue += calculateValueAtDay(
          inv.principalAmount,
          inv.interestRate,
          inv.compoundingFrequency,
          days
        );
        totalPrincipal += inv.principalAmount;
      }

      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);
      let prevValue = 0;
      for (const inv of activeInvestments) {
        const start = new Date(inv.startDate);
        if (prevDate < start) continue;
        const days = Math.floor(
          (prevDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        prevValue += calculateValueAtDay(
          inv.principalAmount,
          inv.interestRate,
          inv.compoundingFrequency,
          days
        );
      }

      const cumulativeInterest = totalValue - totalPrincipal;
      const dailyGain = totalValue - prevValue;
      const growthPercent =
        totalPrincipal > 0 ? (cumulativeInterest / totalPrincipal) * 100 : 0;

      dailyGrowth.push({
        date: date.toISOString().split("T")[0],
        fundValue: Math.round(totalValue * 100) / 100,
        dailyGain: Math.round(dailyGain * 100) / 100,
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
        growthPercent: Math.round(growthPercent * 1000) / 1000,
      });
    }

    // --- Growth Chart (monthly data points from earliest start to latest maturity) ---
    const growthChart: Array<Record<string, number | string>> = [];

    if (activeInvestments.length > 0) {
      const earliest = new Date(
        Math.min(...activeInvestments.map((inv) => new Date(inv.startDate).getTime()))
      );
      const latest = new Date(
        Math.max(...activeInvestments.map((inv) => new Date(inv.maturityDate).getTime()))
      );

      const MONTH_NAMES = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      while (cursor <= latest) {
        const point: Record<string, number | string> = {
          date: `${MONTH_NAMES[cursor.getMonth()]} '${String(cursor.getFullYear()).slice(-2)}`,
          totalValue: 0,
        };

        for (const inv of activeInvestments) {
          const start = new Date(inv.startDate);
          if (cursor < start) {
            point[inv._id.toString()] = 0;
            continue;
          }
          const days = Math.floor(
            (cursor.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          const maturityDays = Math.floor(
            (new Date(inv.maturityDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
          const effectiveDays = Math.min(days, maturityDays);
          const value = calculateValueAtDay(
            inv.principalAmount,
            inv.interestRate,
            inv.compoundingFrequency,
            effectiveDays
          );
          point[inv._id.toString()] = Math.round(value * 100) / 100;
          (point.totalValue as number) += value;
        }

        point.totalValue = Math.round((point.totalValue as number) * 100) / 100;
        growthChart.push(point);

        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    return NextResponse.json({
      success: true,
      data: { summary, perFD, dailyGrowth, growthChart },
    });
  } catch (error) {
    console.error("Investment analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch investment analytics" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/investments/analytics/route.ts
git commit -m "feat: add investment analytics API endpoint"
```

---

### Task 5: Create RTK Query API Slice

**Files:**
- Create: `src/store/investments-api.ts`
- Modify: `src/store/api.ts` (add tag type)

- [ ] **Step 1: Add "Investments" to the base API tag types**

In `src/store/api.ts`, update the `tagTypes` array:

```typescript
tagTypes: ["Users", "Payments", "Notices", "Notifications", "Settings", "Dashboard", "AuditLogs", "EmailLogs", "Investments"],
```

- [ ] **Step 2: Create the investments API slice**

Create `src/store/investments-api.ts`:

```typescript
import { api } from "./api";
import { ApiResponse, IInvestment, InvestmentAnalytics } from "@/types";

export const investmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInvestments: builder.query<ApiResponse<IInvestment[]>, { status?: string } | void>({
      query: (params) => {
        const status = params && "status" in params ? params.status : undefined;
        return status ? `/investments?status=${status}` : "/investments";
      },
      providesTags: ["Investments"],
    }),
    getInvestmentAnalytics: builder.query<ApiResponse<InvestmentAnalytics>, void>({
      query: () => "/investments/analytics",
      providesTags: ["Investments"],
    }),
    createInvestment: builder.mutation<ApiResponse<IInvestment>, Partial<IInvestment>>({
      query: (body) => ({
        url: "/investments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Investments"],
    }),
    updateInvestment: builder.mutation<ApiResponse<IInvestment>, { id: string; body: Partial<IInvestment> }>({
      query: ({ id, body }) => ({
        url: `/investments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Investments"],
    }),
    deleteInvestment: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({
        url: `/investments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Investments"],
    }),
  }),
});

export const {
  useGetInvestmentsQuery,
  useGetInvestmentAnalyticsQuery,
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
  useDeleteInvestmentMutation,
} = investmentsApi;
```

- [ ] **Step 3: Commit**

```bash
git add src/store/api.ts src/store/investments-api.ts
git commit -m "feat: add investments RTK Query API slice"
```

---

### Task 6: Add Sidebar Navigation Link

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add the Investments link to the admin sidebar**

In `src/components/layout/sidebar.tsx`:

1. Add `Landmark` to the lucide-react import:
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
} from "lucide-react";
```

2. Add the investments link to `adminLinks`, after the Reports entry:
```typescript
{ href: "/admin/investments", label: "Investments", icon: Landmark },
```

The full `adminLinks` array should be:
```typescript
const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/notices", label: "Notice Board", icon: Megaphone },
  { href: "/admin/accounting", label: "Accounting", icon: Calculator },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/investments", label: "Investments", icon: Landmark },
  { href: "/admin/collection-calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/settings", label: "Settings", icon: Settings2 },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/email-logs", label: "Email Logs", icon: Mail },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "feat: add Investments link to admin sidebar"
```

---

### Task 7: Create Investment Form Modal

**Files:**
- Create: `src/components/investments/investment-form-modal.tsx`

- [ ] **Step 1: Create the form modal component**

Create `src/components/investments/investment-form-modal.tsx`:

```typescript
"use client";

import { useEffect, useState, useMemo } from "react";
import { IInvestment, IUser } from "@/types";
import {
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
} from "@/store/investments-api";
import { useGetUsersQuery } from "@/store/users-api";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button, DatePicker } from "antd";
import dayjs from "dayjs";

interface InvestmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: IInvestment | null;
}

export function InvestmentFormModal({
  open,
  onOpenChange,
  investment,
}: InvestmentFormModalProps) {
  const isEdit = !!investment;

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const [createInvestment, { isLoading: isCreating }] =
    useCreateInvestmentMutation();
  const [updateInvestment, { isLoading: isUpdating }] =
    useUpdateInvestmentMutation();

  const users = usersData?.data ?? [];

  const [bankName, setBankName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [compoundingFrequency, setCompoundingFrequency] = useState<
    "quarterly" | "monthly" | "yearly"
  >("quarterly");
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [memberContributions, setMemberContributions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (investment) {
      setBankName(investment.bankName);
      setPrincipalAmount(investment.principalAmount);
      setInterestRate(investment.interestRate);
      setCompoundingFrequency(investment.compoundingFrequency);
      setStartDate(dayjs(investment.startDate));
      setTenureMonths(investment.tenureMonths);
      setMemberContributions(
        investment.memberContributions.map((m) =>
          typeof m === "object" ? m._id : m
        )
      );
      setNotes(investment.notes ?? "");
    } else {
      setBankName("");
      setPrincipalAmount(0);
      setInterestRate(0);
      setCompoundingFrequency("quarterly");
      setStartDate(dayjs());
      setTenureMonths(12);
      setMemberContributions([]);
      setNotes("");
    }
  }, [investment, open]);

  // Live calculated preview
  const preview = useMemo(() => {
    if (!principalAmount || !interestRate || !startDate || !tenureMonths) {
      return null;
    }
    const n =
      compoundingFrequency === "quarterly"
        ? 4
        : compoundingFrequency === "monthly"
          ? 12
          : 1;
    const r = interestRate / 100;
    const t = tenureMonths / 12;
    const maturityAmount =
      Math.round(principalAmount * Math.pow(1 + r / n, n * t) * 100) / 100;
    const totalInterest = Math.round((maturityAmount - principalAmount) * 100) / 100;
    const maturityDate = startDate.add(tenureMonths, "month");

    return { maturityDate, maturityAmount, totalInterest };
  }, [principalAmount, interestRate, compoundingFrequency, startDate, tenureMonths]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !principalAmount || !interestRate || !startDate || !tenureMonths) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        bankName,
        principalAmount,
        interestRate,
        compoundingFrequency,
        startDate: startDate.toISOString(),
        tenureMonths,
        memberContributions,
        notes: notes || undefined,
      };

      if (isEdit) {
        await updateInvestment({
          id: investment._id,
          body: payload,
        }).unwrap();
        toast.success("Investment updated successfully");
      } else {
        await createInvestment(payload).unwrap();
        toast.success("Investment created successfully");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error;
      toast.error(
        message || (isEdit ? "Failed to update investment" : "Failed to create investment")
      );
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Fixed Deposit" : "Create Fixed Deposit"}
          </h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEdit
              ? "Update the fixed deposit details below."
              : "Fill in the details to create a new fixed deposit."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
      width={560}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Bank Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bank Name</label>
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g., XYZ Bank"
            required
          />
        </div>

        {/* Principal & Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Principal Amount (৳)</label>
            <Input
              type="number"
              value={principalAmount || ""}
              onChange={(e) => setPrincipalAmount(Number(e.target.value))}
              placeholder="150000"
              min={0}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Interest Rate (%)</label>
            <Input
              type="number"
              value={interestRate || ""}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              placeholder="9.5"
              min={0}
              step={0.1}
              required
            />
          </div>
        </div>

        {/* Start Date & Tenure */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start Date</label>
            <DatePicker
              className="w-full"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              format="DD MMM YYYY"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tenure (months)</label>
            <Input
              type="number"
              value={tenureMonths || ""}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              placeholder="36"
              min={1}
              required
            />
          </div>
        </div>

        {/* Compounding */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Compounding Frequency</label>
          <Select
            className="w-full"
            value={compoundingFrequency}
            onChange={(val) => setCompoundingFrequency(val)}
            options={[
              { value: "quarterly", label: "Quarterly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
        </div>

        {/* Contributing Members */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contributing Members</label>
          <Select
            className="w-full"
            mode="multiple"
            value={memberContributions}
            onChange={(val) => setMemberContributions(val)}
            placeholder="Select members"
            options={users.map((user: IUser) => ({
              label: user.fullName,
              value: user._id,
            }))}
            optionFilterProp="label"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={2}
          />
        </div>

        {/* Calculated Preview */}
        {preview && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-primary">Calculated Preview</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maturity Date</span>
              <span>{preview.maturityDate.format("DD MMM YYYY")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maturity Amount</span>
              <span className="font-semibold text-emerald-500">
                ৳{preview.maturityAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Interest</span>
              <span className="text-cyan-500">
                ৳{preview.totalInterest.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEdit ? "Update FD" : "Create FD"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/investments/investment-form-modal.tsx
git commit -m "feat: add investment form modal with live calculated preview"
```

---

### Task 8: Create Overview Tab Component

**Files:**
- Create: `src/components/investments/overview-tab.tsx`

- [ ] **Step 1: Create the overview tab**

Create `src/components/investments/overview-tab.tsx`:

```typescript
"use client";

import { useGetInvestmentAnalyticsQuery } from "@/store/investments-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Banknote, TrendingUp, Wallet, Target } from "lucide-react";
import { useState } from "react";

export function OverviewTab() {
  const { data, isLoading } = useGetInvestmentAnalyticsQuery();
  const [timeRange, setTimeRange] = useState<"all" | "12" | "6" | "1">("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-[80px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) return null;

  const { summary, growthChart, perFD } = analytics;

  const filteredChart = (() => {
    if (timeRange === "all" || !growthChart.length) return growthChart;
    const months =
      timeRange === "12" ? 12 : timeRange === "6" ? 6 : 1;
    return growthChart.slice(-months);
  })();

  const summaryCards = [
    {
      title: "Total Invested",
      value: `৳${summary.totalInvested.toLocaleString()}`,
      subtitle: `Across ${summary.activeFDCount} active FD${summary.activeFDCount !== 1 ? "s" : ""}`,
      icon: Banknote,
      color: "text-primary",
    },
    {
      title: "Interest Earned",
      value: `৳${summary.totalInterestEarned.toLocaleString()}`,
      subtitle: "As of today",
      icon: TrendingUp,
      color: "text-cyan-500",
    },
    {
      title: "Current Value",
      value: `৳${summary.currentValue.toLocaleString()}`,
      subtitle:
        summary.totalInvested > 0
          ? `+${(((summary.currentValue - summary.totalInvested) / summary.totalInvested) * 100).toFixed(2)}% growth`
          : "",
      icon: Wallet,
      color: "text-foreground",
    },
    {
      title: "Projected at Maturity",
      value: `৳${summary.projectedMaturityValue.toLocaleString()}`,
      subtitle: "All FDs combined",
      icon: Target,
      color: "text-amber-500",
    },
  ];

  const activeFDs = perFD.filter((fd) => fd.daysRemaining > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Chart */}
      {growthChart.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Combined Fund Growth</CardTitle>
                <p className="text-xs text-muted-foreground">
                  All active fixed deposits
                </p>
              </div>
              <div className="flex gap-1">
                {(["all", "12", "6", "1"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timeRange === range
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range === "all"
                      ? "All Time"
                      : range === "12"
                        ? "1Y"
                        : range === "6"
                          ? "6M"
                          : "1M"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `৳${value.toLocaleString()}`,
                      "Fund Value",
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    name="Total Value"
                    stroke="hsl(181, 87%, 31%)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Earnings + Active FDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Earnings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Daily Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              ৳{summary.dailyEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Earning this much every day across all FDs
            </p>
            <div className="mt-4 pt-4 border-t space-y-2">
              {[
                { label: "Per hour", value: summary.hourlyEarnings },
                { label: "Per month", value: summary.monthlyEarnings },
                { label: "Per year", value: summary.yearlyEarnings },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>৳{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active FDs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Active Fixed Deposits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeFDs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active fixed deposits
              </p>
            ) : (
              activeFDs.map((fd) => (
                <div
                  key={fd.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-semibold">{fd.bankName}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳{fd.principalAmount.toLocaleString()} ·{" "}
                      {fd.daysRemaining} days left
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-500">
                      ৳{fd.currentValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +৳{fd.interestEarned.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/investments/overview-tab.tsx
git commit -m "feat: add investment overview tab with summary cards, growth chart, and daily earnings"
```

---

### Task 9: Create Fixed Deposits Tab Component

**Files:**
- Create: `src/components/investments/fd-tab.tsx`

- [ ] **Step 1: Create the fixed deposits management tab**

Create `src/components/investments/fd-tab.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  useGetInvestmentsQuery,
  useDeleteInvestmentMutation,
  useUpdateInvestmentMutation,
} from "@/store/investments-api";
import { useGetInvestmentAnalyticsQuery } from "@/store/investments-api";
import { IInvestment, IUser } from "@/types";
import { InvestmentFormModal } from "./investment-form-modal";
import { Table, Button, Dropdown, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "matured", label: "Matured" },
  { key: "withdrawn", label: "Withdrawn" },
] as const;

export function FDTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<IInvestment | null>(null);

  const queryParams = statusFilter === "all" ? undefined : { status: statusFilter };
  const { data, isLoading } = useGetInvestmentsQuery(queryParams);
  const { data: analyticsData } = useGetInvestmentAnalyticsQuery();
  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [updateInvestment] = useUpdateInvestmentMutation();

  const investments = data?.data ?? [];

  const statusCounts = {
    all: investments.length,
    active: 0,
    matured: 0,
    withdrawn: 0,
  };

  // When filter is "all", count from the full list
  if (statusFilter === "all") {
    for (const inv of investments) {
      if (inv.status in statusCounts) {
        statusCounts[inv.status as keyof typeof statusCounts]++;
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvestment(id).unwrap();
      toast.success("Investment deleted");
    } catch {
      toast.error("Failed to delete investment");
    }
  };

  const handleMarkStatus = async (id: string, status: "matured" | "withdrawn") => {
    try {
      await updateInvestment({ id, body: { status } }).unwrap();
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const columns: ColumnsType<IInvestment> = [
    {
      title: "Bank",
      dataIndex: "bankName",
      key: "bankName",
      render: (name: string, record: IInvestment) => {
        const members = record.memberContributions as IUser[];
        const tenureYears = record.tenureMonths / 12;
        const tenureLabel =
          tenureYears >= 1
            ? `${tenureYears % 1 === 0 ? tenureYears : tenureYears.toFixed(1)} year${tenureYears !== 1 ? "s" : ""} term`
            : `${record.tenureMonths} month term`;
        return (
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">
              {tenureLabel} · {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        );
      },
    },
    {
      title: "Principal",
      dataIndex: "principalAmount",
      key: "principalAmount",
      render: (v: number) => `৳${v.toLocaleString()}`,
    },
    {
      title: "Rate",
      dataIndex: "interestRate",
      key: "interestRate",
      render: (v: number) => `${v}%`,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Maturity",
      dataIndex: "maturityDate",
      key: "maturityDate",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Current Value",
      key: "currentValue",
      render: (_: unknown, record: IInvestment) => {
        if (record.status !== "active") {
          return <span>৳{record.maturityAmount.toLocaleString()}</span>;
        }
        const perFD = analyticsData?.data?.perFD?.find((fd) => fd.id === record._id);
        const value = perFD?.currentValue ?? record.principalAmount;
        return (
          <span className="text-emerald-500 font-semibold">
            ৳{value.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: "green",
          matured: "gold",
          withdrawn: "red",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: unknown, record: IInvestment) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => {
                  setEditingInvestment(record);
                  setModalOpen(true);
                },
              },
              ...(record.status === "active"
                ? [
                    {
                      key: "matured",
                      label: "Mark as Matured",
                      icon: <CheckCircle className="h-3.5 w-3.5" />,
                      onClick: () => handleMarkStatus(record._id, "matured"),
                    },
                  ]
                : []),
              {
                key: "delete",
                label: "Delete",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                danger: true,
                onClick: () => handleDelete(record._id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreHorizontal className="h-4 w-4" />}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fixed Deposits</h2>
          <p className="text-sm text-muted-foreground">
            {statusCounts.active} active · {statusCounts.matured} matured
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingInvestment(null);
            setModalOpen(true);
          }}
        >
          New Fixed Deposit
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === filter.key
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={investments}
        rowKey="_id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      {/* Form Modal */}
      <InvestmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        investment={editingInvestment}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/investments/fd-tab.tsx
git commit -m "feat: add fixed deposits management tab with table and actions"
```

---

### Task 10: Create Analytics Tab Component

**Files:**
- Create: `src/components/investments/analytics-tab.tsx`

- [ ] **Step 1: Create the analytics tab**

Create `src/components/investments/analytics-tab.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useGetInvestmentAnalyticsQuery } from "@/store/investments-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const FD_COLORS = [
  "hsl(181, 87%, 31%)",
  "#22d3ee",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
  "#34d399",
];

export function AnalyticsTab() {
  const { data, isLoading } = useGetInvestmentAnalyticsQuery();
  const [growthFilter, setGrowthFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) return null;

  const { perFD, dailyGrowth, growthChart } = analytics;
  const activeFDs = perFD.filter((fd) => fd.daysRemaining > 0);

  // Build line keys for per-FD chart
  const fdLineKeys = activeFDs.map((fd, i) => ({
    key: fd.id,
    name: fd.bankName,
    color: FD_COLORS[i % FD_COLORS.length],
  }));

  // Daily growth table columns
  const dailyColumns: ColumnsType<(typeof dailyGrowth)[0]> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Fund Value",
      dataIndex: "fundValue",
      key: "fundValue",
      render: (v: number) => (
        <span className="font-medium">৳{v.toLocaleString()}</span>
      ),
    },
    {
      title: "Daily Gain",
      dataIndex: "dailyGain",
      key: "dailyGain",
      render: (v: number) => (
        <span className="text-emerald-500">+৳{v.toLocaleString()}</span>
      ),
    },
    {
      title: "Cumulative Interest",
      dataIndex: "cumulativeInterest",
      key: "cumulativeInterest",
      render: (v: number) => `৳${v.toLocaleString()}`,
    },
    {
      title: "Growth %",
      dataIndex: "growthPercent",
      key: "growthPercent",
      render: (v: number) => (
        <span className="text-emerald-500">+{v.toFixed(3)}%</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Per-FD Growth Comparison */}
      {growthChart.length > 0 && fdLineKeys.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Per-FD Growth Comparison
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Each FD&apos;s value over time · Hover for details
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `৳${value.toLocaleString()}`,
                      name,
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  {fdLineKeys.map((fd) => (
                    <Line
                      key={fd.key}
                      type="monotone"
                      dataKey={fd.key}
                      name={fd.name}
                      stroke={fd.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interest Breakdown + Maturity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Interest Breakdown by FD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {perFD.map((fd, i) => (
              <div key={fd.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{fd.bankName}</span>
                  <span className="text-emerald-500">
                    ৳{fd.interestEarned.toLocaleString()} earned
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fd.progressPercent}%`,
                      background: FD_COLORS[i % FD_COLORS.length],
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {fd.progressPercent}% of projected ৳
                    {fd.projectedInterest.toLocaleString()}
                  </span>
                  <span>{fd.daysRemaining} days left</span>
                </div>
              </div>
            ))}
            {perFD.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No fixed deposits to show
              </p>
            )}
          </CardContent>
        </Card>

        {/* Maturity Timeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Maturity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-5">
              {/* Timeline line */}
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-border" />

              {perFD
                .filter((fd) => fd.daysRemaining > 0)
                .sort(
                  (a, b) =>
                    new Date(a.maturityDate).getTime() -
                    new Date(b.maturityDate).getTime()
                )
                .map((fd, i) => {
                  const years = Math.floor(fd.daysRemaining / 365);
                  const months = Math.floor((fd.daysRemaining % 365) / 30);
                  const timeLabel =
                    years > 0
                      ? `${years} year${years !== 1 ? "s" : ""}${months > 0 ? `, ${months} month${months !== 1 ? "s" : ""}` : ""} away`
                      : `${months > 0 ? `${months} month${months !== 1 ? "s" : ""}` : `${fd.daysRemaining} days`} away`;

                  return (
                    <div key={fd.id} className="relative mb-6 last:mb-0">
                      <div
                        className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-background"
                        style={{
                          background: FD_COLORS[i % FD_COLORS.length],
                        }}
                      />
                      <p
                        className="text-xs font-semibold"
                        style={{ color: FD_COLORS[i % FD_COLORS.length] }}
                      >
                        {dayjs(fd.maturityDate).format("DD MMM YYYY")}
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {fd.bankName} matures
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ৳{fd.principalAmount.toLocaleString()} → ৳
                        {fd.maturityAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-500 mt-0.5">
                        {timeLabel}
                      </p>
                    </div>
                  );
                })}

              {/* Total returns summary */}
              {perFD.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-background bg-amber-500" />
                  <p className="text-xs font-semibold text-amber-500">
                    All Matured
                  </p>
                  <p className="text-sm font-medium mt-0.5">Total returns</p>
                  <p className="text-xs text-muted-foreground">
                    ৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.principalAmount, 0)
                      .toLocaleString()}{" "}
                    invested → ৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.maturityAmount, 0)
                      .toLocaleString()}{" "}
                    returned
                  </p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    +৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.projectedInterest, 0)
                      .toLocaleString()}{" "}
                    total interest
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Growth Log */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Daily Growth Log</CardTitle>
          <p className="text-xs text-muted-foreground">
            Day-by-day fund value changes (last 30 days)
          </p>
        </CardHeader>
        <CardContent>
          <Table
            columns={dailyColumns}
            dataSource={[...dailyGrowth].reverse()}
            rowKey="date"
            pagination={{ pageSize: 10, size: "small" }}
            size="small"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/investments/analytics-tab.tsx
git commit -m "feat: add investment analytics tab with charts, breakdown, timeline, and daily log"
```

---

### Task 11: Create the Investments Page

**Files:**
- Create: `src/app/(admin)/admin/investments/page.tsx`

- [ ] **Step 1: Create the investments page**

Create `src/app/(admin)/admin/investments/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";
import { OverviewTab } from "@/components/investments/overview-tab";
import { FDTab } from "@/components/investments/fd-tab";
import { AnalyticsTab } from "@/components/investments/analytics-tab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "deposits", label: "Fixed Deposits" },
  { key: "analytics", label: "Analytics" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function InvestmentsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Investments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track and manage your fixed deposit investments
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "deposits" && <FDTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the app compiles**

Run: `npx next build 2>&1 | head -30` or `npx next lint`

Check that there are no TypeScript errors or import issues.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/investments/page.tsx
git commit -m "feat: add investments page with tabbed layout"
```

---

### Task 12: Manual Smoke Test

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify sidebar link**

Navigate to any admin page. Confirm "Investments" appears in the sidebar with the Landmark icon, positioned after "Reports".

- [ ] **Step 3: Test FD creation**

1. Click "Investments" in sidebar → should land on Overview tab
2. Switch to "Fixed Deposits" tab
3. Click "New Fixed Deposit"
4. Fill: Bank Name = "Test Bank", Principal = 150000, Rate = 9.5, Start Date = today, Tenure = 36, Compounding = Quarterly
5. Verify the calculated preview shows maturity date, amount, and interest
6. Select some members, click "Create FD"
7. Verify the new FD appears in the table

- [ ] **Step 4: Test Overview tab**

1. Switch to Overview tab
2. Verify summary cards show correct data
3. Verify the growth chart renders with a line
4. Hover over the chart line — verify tooltip shows date and amount
5. Verify daily earnings card shows values
6. Verify active FDs mini-list shows the created FD

- [ ] **Step 5: Test Analytics tab**

1. Switch to Analytics tab
2. Verify per-FD growth chart renders (one line since we have one FD)
3. Verify interest breakdown shows progress bar
4. Verify maturity timeline shows the FD
5. Verify daily growth log table has data

- [ ] **Step 6: Test Edit and Status Change**

1. Go to Fixed Deposits tab
2. Click ••• on the FD → Edit → change interest rate → save
3. Verify values update across all tabs
4. Click ••• → Mark as Matured → verify status changes to "Matured"

- [ ] **Step 7: Commit any fixes if needed**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```
