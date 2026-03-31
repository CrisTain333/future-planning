# Future Planning - Product Requirements Document (PRD)

**Project:** Future Planning - Foundation Accounting System
**Version:** 1.0
**Date:** March 31, 2026
**Currency:** BDT (Bangladeshi Taka)

---

## 1. Project Overview

Future Planning is a foundation with 12 members. This application replaces pen-and-paper accounting with a digital system to track member contributions, manage payments, and provide transparency into the foundation's funds.

### 1.1 Problem Statement

- No centralized record of who paid, how much, and when
- Manual tracking is error-prone and hard to reference
- Members cannot independently verify their payment history
- No receipts or downloadable proof of payment

### 1.2 Solution

A web-based accounting application where:
- **Admins** record and manage payments, users, and notices
- **Members** view their payment history, download receipts, and see fund status

---

## 2. Contribution Structure

| Period | Amount (BDT) | Note |
|--------|-------------|------|
| March 2026 (Initial) | 10,000 | One-time starting contribution from each member |
| April 2026 onward | 2,000 | Monthly recurring contribution |

- The monthly amount is configurable by admin via application settings
- Penalty/fine can be applied by admin when recording a late payment

---

## 3. User Roles

### 3.1 Normal User (Member)

- Total: 12 members (can grow)
- Login with **username + password** (simple — minimum 4 characters, no complexity rules)
- Can view their own dashboard and payment history
- Can update their own profile
- Cannot see other members' data

### 3.2 Admin

- Has all Normal User capabilities plus administrative access
- Can manage users (create, edit, disable)
- Can record/manage payments for any member
- Can manage notices
- One admin can create another admin
- At least one admin must exist at all times (cannot disable the last admin)

---

## 4. Pages & Features

### 4.1 Authentication

**Login Page (`/login`)**
- Fields: Username, Password
- Simple validation — minimum 4 characters for password, no complexity rules
- Disabled users see an error message: "Your account has been disabled. Contact admin."
- Redirect to dashboard on success

---

### 4.2 Normal User Pages

#### 4.2.1 Dashboard (`/dashboard`)

**Widgets (top section):**

| Widget | Description |
|--------|-------------|
| Total Paid | Total amount this member has contributed to date |
| Months Paid | Number of months paid |
| Outstanding | Amount due (unpaid months x monthly rate + any pending penalties) |
| Status | "Up to date" or "X months due" |

**Chart:**
- Bar or line chart showing the member's monthly payments over time

**Payment History Table:**

| Column | Description |
|--------|-------------|
| # | Row number |
| Date | Date the payment was recorded/approved |
| Month | The month this payment covers (e.g., "March 2026") |
| Amount (BDT) | Amount paid |
| Penalty (BDT) | Fine amount, shows 0 if none |
| Approved By | Name of the admin who recorded the payment |
| Receipt | Download button — generates a PDF receipt |

- Table is responsive (horizontal scroll on mobile or card layout)
- Pagination supported

#### 4.2.2 Profile (`/profile`)

**Editable fields:**

| Field | Required | Notes |
|-------|----------|-------|
| Full Name | Yes | |
| Username | Yes | Unique, used for login |
| Email | No | Optional |
| Phone | No | Optional |
| Address | No | Optional |
| Blood Group | No | Dropdown: A+, A-, B+, B-, O+, O-, AB+, AB- |
| Profile Picture | No | Upload to Cloudinary, max 2MB, jpg/png |

- Password change option (enter new password, minimum 4 characters)

---

### 4.3 Admin Pages

#### 4.3.1 Dashboard (`/admin/dashboard`)

**Row 1 — Charts:**

| Widget | Type | Description |
|--------|------|-------------|
| Total Fund Over Time | Line Chart | Shows cumulative fund growth month by month |
| Member Contribution Share | Pie Chart | Each member's total contribution as a percentage of the total fund |

**Row 2 — Two side-by-side sections:**

| Section | Description |
|---------|-------------|
| Recent Payments | Last 5-6 approved payments with member name, month, amount. Paginated. |
| Recent Notices | Last 3-4 notices with title and date. Link to full notice board. |

**Row 3 — Summary Cards:**

| Card | Value |
|------|-------|
| Total Fund | Sum of all approved payments |
| Total Members | Count of active members |
| Payments This Month | Count + total amount for current month |
| Pending/Overdue | Members who haven't paid for current month |

#### 4.3.2 Manage Users (`/admin/users`)

**User Table:**

| Column | Description |
|--------|-------------|
| # | Row number |
| Name | Full name |
| Username | Login username |
| Email | Email address |
| Phone | Phone number |
| Role | Admin / User (badge) |
| Status | Active / Disabled (badge) |
| Actions | Edit, Disable/Enable |

**Add User Button** — Opens a modal:

| Field | Required | Notes |
|-------|----------|-------|
| Full Name | Yes | |
| Username | Yes | Unique |
| Email | No | |
| Password | Yes | Minimum 4 characters |
| Phone | No | |
| Address | No | |
| Blood Group | No | Dropdown |
| Role | Yes | Dropdown: Admin / User |

**Edit User** — Same modal, pre-filled. Admin can change any field including role.

**Disable/Enable** — Toggle button. Disabled users cannot log in. Cannot disable the last remaining admin.

#### 4.3.3 Notice Board (`/admin/notices`)

**Notice List:**

| Column | Description |
|--------|-------------|
| # | Row number |
| Title | Notice title |
| Created By | Admin name |
| Date | Created date |
| Actions | View, Edit, Delete |

**Create/Edit Notice Modal:**

| Field | Required |
|-------|----------|
| Title | Yes |
| Body | Yes (rich text or plain text) |

- All users (admin and normal) see notices on their dashboard
- Normal users see notices in a read-only notice section on their dashboard or as a notification indicator

#### 4.3.4 Accounting (`/admin/accounting`)

This is the core feature where admins record member payments.

**Payment Recording Flow:**

1. Admin sees a list/table of all members
2. Admin clicks on a member or selects from a dropdown
3. A modal opens with:

| Field | Description |
|-------|-------------|
| Member | Pre-selected (read-only) |
| Month-Year | Month picker (e.g., "March 2026") — cannot select a month already paid by this member |
| Amount (BDT) | Pre-filled with the expected amount (10,000 for March 2026, 2,000 for subsequent months). Admin can override. |
| Penalty (BDT) | Default 0. Admin enters manually if applicable. |
| Penalty Reason | Optional text field, shown only if penalty > 0 |
| Note | Optional — any additional note |

4. On submit, the payment is recorded and immediately visible in the member's dashboard

**Payment List View:**

| Column | Description |
|--------|-------------|
| # | Row number |
| Member Name | Who paid |
| Month | Which month |
| Amount (BDT) | Paid amount |
| Penalty (BDT) | Fine if any |
| Recorded By | Admin who recorded it |
| Date | When it was recorded |
| Actions | View, Edit, Delete |

- Filter by: Member, Month, Year
- Search by member name
- Pagination supported

**Safeguards:**
- Duplicate payment guard: Cannot record the same month twice for the same member (unique constraint on userId + month + year)
- Edit/Delete creates an audit log entry
- Deleted payments are soft-deleted (marked as deleted, not removed from database)

#### 4.3.5 Profile (`/admin/profile`)

Same as Normal User profile (Section 4.2.2).

---

## 5. PDF Receipt

Each payment row has a "Download Receipt" button. The generated PDF contains:

| Field | Value |
|-------|-------|
| Receipt No. | Auto-generated unique ID (e.g., FP-2026-0001) |
| Foundation Name | "Future Planning" |
| Member Name | Full name of the member |
| Month | The month covered |
| Amount Paid | Amount in BDT |
| Penalty | If any, with reason |
| Total | Amount + Penalty |
| Approved By | Admin name |
| Date | Date of approval |
| Footer | "This is a system-generated receipt." |

---

## 6. Notifications (In-App)

- When admin records a payment for a member, the member sees a notification
- When a new notice is posted, all members see a notification
- Simple bell icon with unread count in the header
- Clicking opens a dropdown of recent notifications
- Mark as read on click

---

## 7. Audit Log

Every sensitive action is logged:

| Action | Logged Details |
|--------|---------------|
| Payment created | Who recorded, for whom, amount, month |
| Payment edited | Who edited, what changed (before/after) |
| Payment deleted | Who deleted, which payment |
| User created | Who created, new user details |
| User edited | Who edited, what changed |
| User disabled/enabled | Who changed, target user |
| Notice created/edited/deleted | Who, what |

- Audit logs are immutable (insert-only, no updates or deletes)
- Visible to admins only (optional: add an Audit Log page later)

---

## 8. Application Settings

Admins can configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Foundation Name | "Future Planning" | Shown on receipts and header |
| Monthly Amount | 2,000 BDT | Expected monthly contribution |
| Initial Amount | 10,000 BDT | One-time first-month amount |
| Start Month | March 2026 | When the foundation started |

---

## 9. Responsive Design

- Mobile-first approach
- Dashboard widgets stack vertically on mobile
- Tables switch to card layout or horizontal scroll on small screens
- Navigation collapses to hamburger menu on mobile

---

## 10. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Authentication | Session-based via NextAuth.js v5 |
| Password Storage | bcrypt hashed (never stored in plain text) |
| Password Rules | Minimum 4 characters, no complexity requirement |
| Data Deletion | Soft delete only — records are flagged, never removed |
| Image Upload | Cloudinary, max 2MB, jpg/png only |
| PDF Generation | Server-side via API route |
| Deployment | Vercel (recommended) |
| Database | MongoDB Atlas (cloud) |
