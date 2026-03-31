# Phase 2: Admin Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can manage members, record payments, and see dashboard analytics — the system becomes functional.

**Architecture:** API routes handle business logic with Mongoose models. RTK Query endpoints manage client-side data fetching/caching. Pages use shadcn/ui components with mobile-first responsive design.

**Tech Stack:** Next.js 16 App Router API routes, Mongoose 8, RTK Query, shadcn/ui (base-ui), Recharts, Zod validation, React Hook Form

**IMPORTANT base-ui note:** This project uses shadcn v4 with base-ui (NOT Radix). Components do NOT support the `asChild` prop. Triggers render as their own elements — style them directly via className.

---

## Task 1: User API Routes

**Files:**
- Create: `src/app/api/users/route.ts`
- Create: `src/app/api/users/[id]/route.ts`
- Create: `src/app/api/users/[id]/toggle-status/route.ts`

### `src/app/api/users/route.ts`

GET — List users with pagination, search, role/status filters. POST — Create new user.

- GET query params: `page`, `limit`, `search`, `role`, `status`
- POST body validated with `createUserSchema` from `src/validations/user.ts`
- Password hashed with bcrypt before saving
- Both require admin role (check session)
- Return standard response format: `{ success, data, pagination }` or `{ success, data, message }`

### `src/app/api/users/[id]/route.ts`

GET — Single user (exclude password). PUT — Update user (validated with `updateUserSchema`).

### `src/app/api/users/[id]/toggle-status/route.ts`

PATCH — Toggle `isDisabled`. Must check: cannot disable the last remaining admin.

All routes must:
- Import `auth` from `@/lib/auth` and check session
- Import `dbConnect` from `@/lib/db`
- Return `{ success: false, error: "..." }` on errors with appropriate status codes

---

## Task 2: Payment API Routes

**Files:**
- Create: `src/app/api/payments/route.ts`
- Create: `src/app/api/payments/[id]/route.ts`

### `src/app/api/payments/route.ts`

GET — List payments with pagination and filters (userId, month, year). Populate `userId` (fullName) and `approvedBy` (fullName). Filter out soft-deleted (`isDeleted: false`).

POST — Create payment:
- Validate with `createPaymentSchema`
- Check duplicate: same userId + month + year
- Auto-generate receiptNo: `FP-{year}-{sequentialNumber}` (pad to 4 digits)
- Set `approvedBy` to current admin's userId
- Set `status: "approved"`

### `src/app/api/payments/[id]/route.ts`

GET — Single payment with populated refs.
PUT — Update payment (amount, penalty, penaltyReason, note only).
DELETE — Soft delete: set `isDeleted: true`, `status: "deleted"`, `deletedBy`, `deletedAt`.

All routes require admin role.

---

## Task 3: Admin Dashboard API Route

**Files:**
- Create: `src/app/api/dashboard/admin/route.ts`

GET — Returns aggregated data:
- `totalFund`: Sum of all approved (non-deleted) payment amounts
- `totalMembers`: Count of active (non-disabled) users
- `paymentsThisMonth`: { count, amount } for current month/year
- `overdueCount`: Members who haven't paid for current month
- `fundGrowthChart`: Array of { month, year, total } showing cumulative fund by month
- `memberShareChart`: Array of { name, total, percentage } for each member
- `recentPayments`: Last 5 approved payments with member name, month, amount
- `recentNotices`: Empty array (populated in Phase 3)

Requires admin role.

---

## Task 4: RTK Query — User Endpoints

**Files:**
- Create: `src/store/users-api.ts`

Inject endpoints into the base API (`src/store/api.ts`) using `api.injectEndpoints`:

- `getUsers`: GET `/users` with query params (page, limit, search, role, status). Provides tag `Users`.
- `createUser`: POST `/users`. Invalidates `Users` tag.
- `getUser`: GET `/users/{id}`. Provides tag `Users`.
- `updateUser`: PUT `/users/{id}`. Invalidates `Users` tag.
- `toggleUserStatus`: PATCH `/users/{id}/toggle-status`. Invalidates `Users` tag.

Export all hooks: `useGetUsersQuery`, `useCreateUserMutation`, etc.

---

## Task 5: RTK Query — Payment & Dashboard Endpoints

**Files:**
- Create: `src/store/payments-api.ts`
- Create: `src/store/dashboard-api.ts`

### `src/store/payments-api.ts`

- `getPayments`: GET `/payments` with filters. Provides `Payments` tag.
- `createPayment`: POST `/payments`. Invalidates `Payments` and `Dashboard` tags.
- `getPayment`: GET `/payments/{id}`. Provides `Payments` tag.
- `updatePayment`: PUT `/payments/{id}`. Invalidates `Payments` and `Dashboard` tags.
- `deletePayment`: DELETE `/payments/{id}`. Invalidates `Payments` and `Dashboard` tags.

### `src/store/dashboard-api.ts`

- `getAdminDashboard`: GET `/dashboard/admin`. Provides `Dashboard` tag.

Export all hooks.

---

## Task 6: Manage Users Page

**Files:**
- Replace: `src/app/(admin)/admin/users/page.tsx`
- Create: `src/components/users/user-table.tsx`
- Create: `src/components/users/user-form-modal.tsx`

### Page (`/admin/users`)

- Top bar: "Manage Users" title + "Add User" button
- Search input + role filter dropdown + status filter dropdown
- UserTable component with pagination
- Mobile: cards instead of table rows below md breakpoint

### `user-table.tsx`

- Columns: #, Name, Username, Email, Phone, Role (Badge), Status (Badge), Actions (Edit, Toggle)
- Role badge: admin = primary color, user = secondary
- Status badge: active = green, disabled = red
- Edit button opens UserFormModal in edit mode
- Toggle button with confirmation dialog
- Responsive: `<div className="hidden md:table-cell">` for optional columns, card layout on mobile

### `user-form-modal.tsx`

- shadcn Dialog component (remember: NO asChild prop)
- Form with React Hook Form + Zod resolver
- Fields: fullName, username, password (create only), email, phone, address, bloodGroup dropdown, role dropdown
- In edit mode: pre-filled, password field hidden
- On submit: calls createUser or updateUser mutation
- Shows toast on success/error (use `sonner` toast: `import { toast } from "sonner"`)

---

## Task 7: Accounting Page

**Files:**
- Replace: `src/app/(admin)/admin/accounting/page.tsx`
- Create: `src/components/accounting/payment-table.tsx`
- Create: `src/components/accounting/payment-form-modal.tsx`

### Page (`/admin/accounting`)

- Top bar: "Accounting" title + "Record Payment" button
- Filters: member dropdown (from users list), month dropdown (1-12), year dropdown
- PaymentTable with pagination
- Mobile: card layout below md breakpoint

### `payment-table.tsx`

- Columns: #, Member Name, Month (formatted as "Mar 2026"), Amount (BDT formatted), Penalty, Recorded By, Date, Actions
- Actions: Edit, Delete (with confirmation dialog)
- Delete calls soft-delete mutation
- Responsive design matching user-table pattern

### `payment-form-modal.tsx`

- Member select dropdown (fetches active users)
- Month-Year picker: shows available months (exclude already-paid months for selected member)
- Amount pre-filled: check settings — if month/year is start month/year, use initialAmount (10,000), else monthlyAmount (2,000)
- Penalty field (default 0), penalty reason (visible when penalty > 0), note
- On submit: calls createPayment or updatePayment mutation
- Toast feedback

Needs a settings API call to get amounts. Create a minimal settings endpoint:

**Files:**
- Create: `src/app/api/settings/route.ts` (GET only for now)
- Create: `src/store/settings-api.ts`

---

## Task 8: Admin Dashboard Page

**Files:**
- Replace: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/components/dashboard/stat-card.tsx`
- Create: `src/components/dashboard/fund-line-chart.tsx`
- Create: `src/components/dashboard/member-pie-chart.tsx`
- Create: `src/components/dashboard/recent-payments.tsx`
- Create: `src/components/dashboard/recent-notices.tsx`

### Page (`/dashboard` for admin role)

Uses `useSession` to check role. If admin, renders admin dashboard. If user, renders placeholder (Phase 3).

### Layout (mobile-first):

Row 1 — Two charts side by side (stack on mobile):
- `fund-line-chart.tsx`: Recharts LineChart showing cumulative fund growth by month
- `member-pie-chart.tsx`: Recharts PieChart showing each member's contribution share

Row 2 — Two sections side by side (stack on mobile):
- `recent-payments.tsx`: Card with last 5 payments (name, month, amount). Link to "/admin/accounting"
- `recent-notices.tsx`: Card with placeholder text "No notices yet"

Row 3 — Summary cards (2x2 grid on tablet, 1 col on mobile, 4 col on desktop):
- `stat-card.tsx`: Reusable card with title, value, optional icon
- Cards: Total Fund, Total Members, Payments This Month, Pending/Overdue

All data from `useGetAdminDashboardQuery` hook. Show Skeleton loading states.

---

## Task 9: Build Verification & Fixes

Verify:
- `npm run build` succeeds
- All pages render without errors
- Test the full flow: login -> dashboard -> manage users -> create user -> accounting -> record payment
- Mobile responsiveness at 375px width
- Fix any issues found

---

## Summary

| Task | Description | Type |
|------|-------------|------|
| 1 | User API routes (CRUD + toggle) | Backend |
| 2 | Payment API routes (CRUD + soft delete) | Backend |
| 3 | Admin Dashboard API route | Backend |
| 4 | RTK Query user endpoints | Data layer |
| 5 | RTK Query payment + dashboard endpoints | Data layer |
| 6 | Manage Users page + components | Frontend |
| 7 | Accounting page + components + settings | Frontend |
| 8 | Admin Dashboard page + charts | Frontend |
| 9 | Build verification & fixes | QA |
