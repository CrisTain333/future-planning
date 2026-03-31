# Future Planning - Phase Breakdown Design Spec

**Date:** 2026-03-31
**Project:** Future Planning - Foundation Accounting System
**Approach:** Feature-Cluster Phases (Admin-First)
**Phases:** 4

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Phasing approach | Feature-cluster, admin-first | Admin can start using the system after Phase 2 |
| State management | Redux Toolkit + RTK Query | Centralized state, eliminates manual fetch/loading/error handling |
| PDF receipts | Server-side via pdfkit | Simpler, no client-side rendering overhead |
| Notice body format | Plain text | Faster to build, sufficient for the use case |
| Primary color | `#40916c` | Centralized in Tailwind/shadcn theme config, one-file change |
| Responsiveness | Mobile-first from Phase 1 | Every component built responsive from the start, not retrofitted |

---

## Tech Stack (Updated)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Database | MongoDB 7.x (Atlas) + Mongoose 8.x |
| Authentication | NextAuth.js v5 (Auth.js) |
| State Management | Redux Toolkit + RTK Query |
| UI | Tailwind CSS 4 + shadcn/ui |
| Charts | Recharts 2.x |
| PDF Generation | pdfkit (server-side) |
| Image Upload | next-cloudinary |
| Validation | Zod 3.x |
| Forms | React Hook Form 7.x |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Phase 1: Foundation & Infrastructure

**Goal:** Project scaffolding, auth system, database, Redux store, and shared layouts — the skeleton everything else builds on.

### Deliverables

1. **Project Initialization**
   - Next.js 15 + TypeScript
   - Tailwind CSS 4 with custom primary color `#40916c` centralized in theme config
   - shadcn/ui component library setup
   - ESLint configuration

2. **Theme Configuration**
   - Primary color `#40916c` defined in a single config file
   - shadcn/ui theme variables mapped to the primary color
   - All components inherit from this single source of truth

3. **MongoDB Connection**
   - `src/lib/db.ts` with Mongoose connection pooling
   - Connection reuse for serverless environment (Vercel)

4. **All 6 Mongoose Models**
   - User, Payment, Notice, Notification, AuditLog, Settings
   - All indexes defined as per DATABASE.md
   - Built upfront so later phases don't modify models

5. **Zod Validation Schemas**
   - All validation schemas for: auth, user, payment, notice
   - Shared between API routes and forms

6. **TypeScript Types**
   - `src/types/index.ts` — all interfaces matching the database schema

7. **NextAuth v5 Authentication**
   - Credentials provider (username + password)
   - Session includes: `userId`, `role`, `fullName`
   - Middleware for route protection: public (`/login`), authenticated (`/dashboard`, `/profile`), admin-only (`/admin/*`)
   - Redirect logic: logged in -> `/dashboard`, not logged in -> `/login`

8. **Redux Toolkit Setup**
   - Store configuration with RTK Query base API
   - Auth header injection via base query
   - Provider wrapper in root layout
   - Empty API slices as extension points for later phases

9. **Shared Layout (Mobile-First)**
   - Sidebar: role-aware menu items, collapses to hamburger menu on mobile (Sheet component)
   - Header: foundation name, notification bell (placeholder), avatar dropdown with logout
   - Footer: "Future Planning (c) 2026"
   - All layout components responsive from the start

10. **Login Page**
    - Centered card layout, foundation name/logo
    - Username + password fields with Zod validation
    - Error handling (invalid credentials, disabled account)
    - Redirect to dashboard on success

11. **Seed Script**
    - `npm run seed` command
    - Creates default settings document (foundation name, monthly amount 2000, initial amount 10000, start month March 2026)
    - Creates default admin user (username: "admin", password: "1234" hashed with bcrypt)

12. **Environment Configuration**
    - `.env.local` template with: MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL, Cloudinary keys

### Exit Criteria
- App runs locally with `npm run dev`
- Admin can log in with seeded credentials
- Sidebar and header render correctly on mobile and desktop
- Protected routes redirect to login
- Login redirects to dashboard (empty placeholder page)

---

## Phase 2: Admin Core (Users + Accounting + Dashboard)

**Goal:** Admins can manage members and record payments — the system becomes functional.

### Deliverables

1. **Manage Users Page** (`/admin/users`)
   - User table: #, Name, Username, Email, Phone, Role (badge), Status (badge), Actions
   - Search by name/username
   - Filter by role (Admin/User) and status (Active/Disabled)
   - Pagination
   - Add User modal: full name, username, password, email, phone, address, blood group dropdown, role dropdown
   - Edit User modal: same fields pre-filled, admin can change any field including role
   - Disable/Enable toggle with confirmation
   - Last-admin guard: cannot disable the last remaining admin
   - RTK Query endpoints for: list users, create user, get user, update user, toggle status
   - Mobile: table switches to card layout on small screens

2. **Accounting Page** (`/admin/accounting`)
   - Payment list table: #, Member Name, Month, Amount (BDT), Penalty (BDT), Recorded By, Date, Actions (View/Edit/Delete)
   - Filter by: member (dropdown), month, year
   - Search by member name
   - Pagination
   - Record Payment modal:
     - Member dropdown (select from active users)
     - Month-Year picker (excludes months already paid by selected member)
     - Amount pre-filled from settings (10,000 for March 2026, 2,000 for subsequent)
     - Penalty field (default 0)
     - Penalty reason (shown only if penalty > 0)
     - Note (optional)
   - Edit Payment modal: same fields pre-filled
   - Soft-delete with confirmation dialog
   - Duplicate payment guard: unique constraint on userId + month + year
   - Auto-generated receipt number: FP-YYYY-NNNN format
   - RTK Query endpoints for: list payments, create payment, get payment, update payment, delete payment
   - Mobile: table switches to card layout on small screens

3. **Admin Dashboard** (`/dashboard` for admin role)
   - Row 1 — Charts:
     - Total Fund Over Time (Recharts line chart)
     - Member Contribution Share (Recharts pie chart)
   - Row 2 — Side-by-side sections:
     - Recent Payments (last 5-6 with member name, month, amount)
     - Recent Notices (placeholder — populated in Phase 3)
   - Row 3 — Summary Cards:
     - Total Fund (sum of all approved payments)
     - Total Members (count of active members)
     - Payments This Month (count + total amount)
     - Pending/Overdue (members who haven't paid current month)
   - RTK Query endpoint for `/api/dashboard/admin`
   - Mobile: charts stack vertically, cards in 2x2 grid then 1-column

4. **API Routes**
   - `/api/users` — GET (list, paginated), POST (create)
   - `/api/users/[id]` — GET, PUT
   - `/api/users/[id]/toggle-status` — PATCH
   - `/api/payments` — GET (list, filtered, paginated), POST (create)
   - `/api/payments/[id]` — GET, PUT, DELETE (soft)
   - `/api/dashboard/admin` — GET
   - Standard response format: `{ success, data, message }` and `{ success, data, pagination }`

### Exit Criteria
- Admin can create, edit, disable/enable members
- Admin can record payments with duplicate guard working
- Admin can edit and soft-delete payments
- Admin dashboard shows accurate charts and summary cards
- All tables are paginated and filterable
- All pages render correctly on mobile

---

## Phase 3: Member Experience + Notices

**Goal:** Members can log in, see their data, download receipts. Admin gets the notice board.

### Deliverables

1. **Member Dashboard** (`/dashboard` for user role)
   - Stat cards: Total Paid, Months Paid, Outstanding, Status ("Up to date" / "X months due")
   - Payment bar chart (monthly payments over time via Recharts)
   - Payment History table: #, Date, Month, Amount (BDT), Penalty (BDT), Approved By, Receipt (download button)
   - Pagination
   - RTK Query endpoint for `/api/dashboard/member`
   - Mobile: stat cards stack, table switches to card layout

2. **PDF Receipt Download**
   - Server-side generation via pdfkit at `/api/payments/[id]/receipt`
   - Receipt contents: receipt no (FP-YYYY-NNNN), foundation name, member name, month, amount paid, penalty (with reason if any), total, approved by, date, footer ("This is a system-generated receipt.")
   - Access control: members can only download their own receipts, admins can download any
   - Returns PDF as downloadable file

3. **Profile Page** (`/profile` — both roles)
   - Profile picture display with upload button (Cloudinary, max 2MB, jpg/png)
   - Editable fields: full name, username, email, phone, address, blood group dropdown
   - Save changes with validation
   - Password change section: current password + new password (min 4 chars)
   - RTK Query endpoints for: get profile, update profile, change password, upload picture
   - Mobile: single-column layout

4. **Notice Board** (`/admin/notices` — admin)
   - Notice list table: #, Title, Created By, Date, Actions (View/Edit/Delete)
   - Pagination
   - Create Notice modal: title + plain text body
   - Edit Notice modal: pre-filled
   - Soft-delete with confirmation
   - RTK Query endpoints for: list notices, create, get, update, delete

5. **Member Notice View**
   - Read-only notices section on member dashboard
   - Shows recent notices with title, date, and expandable body
   - "Recent Notices" section on admin dashboard now populated with real data

6. **API Routes**
   - `/api/dashboard/member` — GET
   - `/api/payments/[id]/receipt` — GET (PDF download)
   - `/api/payments/my` — GET (member's own payments)
   - `/api/profile` — GET, PUT
   - `/api/profile/password` — PUT
   - `/api/profile/picture` — POST
   - `/api/notices` — GET (all, paginated), POST
   - `/api/notices/[id]` — GET, PUT, DELETE (soft)

### Exit Criteria
- Members can log in and see accurate dashboard stats
- Members can view payment history and download PDF receipts
- Members can update their profile and change password
- Profile picture upload to Cloudinary works
- Admin can create, edit, delete notices
- Members see notices on their dashboard
- All pages render correctly on mobile

---

## Phase 4: Notifications, Audit Logs, Settings & Polish

**Goal:** Complete all remaining features, add transparency/traceability, and polish for production.

### Deliverables

1. **In-App Notifications**
   - Bell icon in header with unread count badge (replaces Phase 1 placeholder)
   - Click opens dropdown with recent notifications
   - Mark as read on click
   - Auto-created when:
     - Admin records a payment for a member -> member gets notified
     - New notice is posted -> all members get notified
   - RTK Query endpoints for: list notifications, unread count, mark-read
   - `/api/notifications` — GET (paginated)
   - `/api/notifications/unread-count` — GET
   - `/api/notifications/mark-read` — PATCH

2. **Audit Logs**
   - Append-only logging on all sensitive actions:
     - Payment: created, edited, deleted
     - User: created, edited, disabled, enabled
     - Notice: created, edited, deleted
     - Settings: updated
   - Stores before/after values for edits
   - Audit Log viewer page (`/admin/audit-logs`):
     - Table with: action, performed by, target user, details, date
     - Filter by action type, admin
     - Pagination
   - API route: `/api/audit-logs` — GET (paginated, filterable)
   - RTK Query endpoint
   - Mobile: table horizontal scroll

3. **Application Settings** (`/admin/settings`)
   - Editable fields: foundation name, monthly amount, initial amount, start month, start year
   - Changes reflected across the app:
     - Receipt header uses foundation name
     - Payment modal pre-fills amount from settings
   - API routes: `/api/settings` — GET, PUT
   - RTK Query endpoint

4. **Responsive Audit & Polish**
   - Final mobile audit across all pages at 320px, 375px, 768px, 1024px breakpoints
   - Sidebar: hamburger menu fully tested on mobile
   - All tables: card layout or horizontal scroll on < 768px
   - Dashboard: widgets stack vertically on mobile
   - Modals: full-screen on mobile, centered on desktop
   - Touch targets: minimum 44px for all interactive elements

5. **UX Polish**
   - Loading states: Skeleton components on all data-fetching pages
   - Toast notifications: success/error on all CRUD actions
   - Empty states: meaningful messages when tables have no data
   - Confirmation dialogs: all destructive actions (delete, disable)
   - Disabled user login: clear error message "Your account has been disabled. Contact admin."

### Exit Criteria
- Notification bell shows accurate unread count and marks read on click
- All sensitive actions are logged in audit logs
- Admin can view and filter audit logs
- Admin can update application settings
- Settings changes reflect in payment recording and receipts
- App is fully responsive at all breakpoints (320px to 1440px+)
- All pages have loading states, empty states, and toast feedback
- No horizontal overflow on any mobile viewport

---

## Cross-Phase Requirements

### Mobile-First (All Phases)
Every component is built mobile-first from Phase 1. This is not a Phase 4 concern. Specific expectations:
- Layouts use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Default styles target mobile, breakpoints add desktop enhancements
- All forms are single-column on mobile
- Navigation uses Sheet (slide-out) on mobile
- Phase 4 performs a final audit, not a retrofit

### Redux Architecture (All Phases)
- Single store configured in Phase 1
- Each phase extends the store with RTK Query API endpoints via `injectEndpoints`
- No manual fetch calls — all API communication through RTK Query
- Optimistic updates for better UX where appropriate (e.g., mark notification as read)

### Standard API Response Format (All Phases)
```json
// Success
{ "success": true, "data": {}, "message": "Operation successful" }

// Error
{ "success": false, "error": "Error message here" }

// Paginated
{ "success": true, "data": [], "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 } }
```

### Soft Delete Pattern (All Phases)
All deletions set `isDeleted: true` — no records are ever removed from the database.
