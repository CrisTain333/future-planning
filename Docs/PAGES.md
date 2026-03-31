# Future Planning - Page Structure & UI Layout

**Framework:** Next.js 15 App Router
**UI Library:** Tailwind CSS + shadcn/ui
**Charts:** Recharts

---

## Route Structure

```
/                          → Redirect to /login
/login                     → Login page

── (authenticated) ────────────────────────
/dashboard                 → Member dashboard (user) / Admin dashboard (admin)
/profile                   → Profile page (both roles)

── (admin only) ───────────────────────────
/admin/users               → Manage users
/admin/notices             → Notice board (CRUD)
/admin/accounting          → Payment management
/admin/settings            → Application settings (optional, Phase 2)
/admin/audit-logs          → Audit log viewer (optional, Phase 2)
```

---

## Layout Structure

### Shared Layout (Authenticated Pages)

```
┌─────────────────────────────────────────────┐
│  Header                                      │
│  ┌──────┐  Future Planning    🔔 (3)  [👤] │
│  │ Logo │                     Bell   Avatar  │
│  └──────┘                     Icon   Menu    │
├──────┬──────────────────────────────────────┤
│ Side │  Page Content                         │
│ bar  │                                       │
│      │                                       │
│ Menu │                                       │
│ Items│                                       │
│      │                                       │
│      │                                       │
│      │                                       │
├──────┴──────────────────────────────────────┤
│  Footer: "Future Planning © 2026"            │
└─────────────────────────────────────────────┘
```

**Mobile:** Sidebar collapses into a hamburger menu. Header stays fixed.

### Sidebar Menus

**Normal User:**
```
Dashboard
Profile
```

**Admin:**
```
Dashboard
Manage Users
Notice Board
Accounting
Profile
```

---

## Page Layouts

### 1. Login Page (`/login`)

```
┌─────────────────────────────────────┐
│           (centered card)            │
│                                      │
│        ┌──────────────────┐         │
│        │   Future Planning │         │
│        │     Foundation    │         │
│        │                   │         │
│        │  Username: [____] │         │
│        │  Password: [____] │         │
│        │                   │         │
│        │    [ Login ]      │         │
│        └──────────────────┘         │
│                                      │
└─────────────────────────────────────┘
```

- Full-page centered layout, no sidebar/header
- Foundation logo/name at top of the card
- Error message shown below the button if login fails

---

### 2. Member Dashboard (`/dashboard` — role: user)

```
┌──────────────────────────────────────────────┐
│  [ Total Paid ]  [ Months Paid ]  [ Due ]  [ Status ]    ← 4 stat cards
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐    │
│  │  My Payments (Bar Chart)             │    │
│  │  ████  ████                          │    │
│  │  Mar   Apr   May  ...               │    │
│  └──────────────────────────────────────┘    │
├──────────────────────────────────────────────┤
│  Payment History                              │
│  ┌────┬──────────┬────────┬─────────┬──────┐ │
│  │ #  │ Month    │ Amount │ Penalty │ Rcpt │ │
│  ├────┼──────────┼────────┼─────────┼──────┤ │
│  │ 1  │ Mar 2026 │ 10,000 │ 0       │ [⬇] │ │
│  │ 2  │ Apr 2026 │ 2,000  │ 0       │ [⬇] │ │
│  └────┴──────────┴────────┴─────────┴──────┘ │
│                    [1] [2] [>]                 │
└──────────────────────────────────────────────┘
```

---

### 3. Admin Dashboard (`/dashboard` — role: admin)

```
┌──────────────────────────────────────────────────────┐
│  ┌─────────────────────────┐ ┌─────────────────────┐ │
│  │  Total Fund Over Time   │ │ Member Contribution  │ │
│  │  (Line Chart)           │ │ Share (Pie Chart)    │ │
│  │  ╱‾‾╲___╱‾‾            │ │    ◕ 8% each         │ │
│  └─────────────────────────┘ └─────────────────────┘ │
├──────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐ ┌─────────────────────┐ │
│  │  Recent Payments        │ │ Recent Notices       │ │
│  │  ─────────────────      │ │ ─────────────────    │ │
│  │  Rahim - Mar - ৳10,000 │ │ Monthly Meeting      │ │
│  │  Karim - Mar - ৳10,000 │ │ posted 2 days ago    │ │
│  │  ...                    │ │ ...                  │ │
│  │  [View All →]           │ │ [View All →]         │ │
│  └─────────────────────────┘ └─────────────────────┘ │
├──────────────────────────────────────────────────────┤
│  [ Total Fund ]  [ Members ]  [ This Month ]  [ Due ] ← Summary cards
└──────────────────────────────────────────────────────┘
```

---

### 4. Manage Users (`/admin/users`)

```
┌──────────────────────────────────────────────┐
│  Manage Users                  [ + Add User ] │
├──────────────────────────────────────────────┤
│  Search: [__________]  Role: [All ▼]          │
├──────────────────────────────────────────────┤
│  ┌────┬──────┬────────┬───────┬──────┬──────┐ │
│  │ #  │ Name │ User   │ Role  │Status│ Act  │ │
│  ├────┼──────┼────────┼───────┼──────┼──────┤ │
│  │ 1  │Rahim │ rahim  │ Admin │ ✅  │ ✏🚫 │ │
│  │ 2  │Karim │ karim  │ User  │ ✅  │ ✏🚫 │ │
│  └────┴──────┴────────┴───────┴──────┴──────┘ │
│                    [1] [2] [>]                 │
└──────────────────────────────────────────────┘
```

**Add/Edit User Modal:**
```
┌──────────────────────────────┐
│  Add New User            [×] │
├──────────────────────────────┤
│  Full Name*:  [____________] │
│  Username*:   [____________] │
│  Password*:   [____________] │
│  Email:       [____________] │
│  Phone:       [____________] │
│  Address:     [____________] │
│  Blood Group: [Select ▼    ] │
│  Role*:       [User ▼      ] │
├──────────────────────────────┤
│         [Cancel]  [Save]     │
└──────────────────────────────┘
```

---

### 5. Notice Board (`/admin/notices`)

```
┌──────────────────────────────────────────────┐
│  Notice Board                [ + New Notice ] │
├──────────────────────────────────────────────┤
│  ┌────┬───────────────┬──────────┬──────────┐ │
│  │ #  │ Title         │ Date     │ Actions  │ │
│  ├────┼───────────────┼──────────┼──────────┤ │
│  │ 1  │ Monthly Meet  │ Mar 31   │ 👁 ✏ 🗑 │ │
│  │ 2  │ Payment Due   │ Mar 28   │ 👁 ✏ 🗑 │ │
│  └────┴───────────────┴──────────┴──────────┘ │
└──────────────────────────────────────────────┘
```

---

### 6. Accounting (`/admin/accounting`)

```
┌──────────────────────────────────────────────────────┐
│  Accounting                   [ + Record Payment ]    │
├──────────────────────────────────────────────────────┤
│  Filter: Member [All ▼]  Month [All ▼]  Year [2026▼] │
├──────────────────────────────────────────────────────┤
│  ┌────┬────────┬──────────┬────────┬─────────┬──────┐ │
│  │ #  │ Member │ Month    │ Amount │ Penalty │ By   │ │
│  ├────┼────────┼──────────┼────────┼─────────┼──────┤ │
│  │ 1  │ Rahim  │ Mar 2026 │ 10,000 │ 0       │Admin │ │
│  │ 2  │ Karim  │ Mar 2026 │ 10,000 │ 500     │Admin │ │
│  └────┴────────┴──────────┴────────┴─────────┴──────┘ │
│                    [1] [2] [>]                         │
└──────────────────────────────────────────────────────┘
```

**Record Payment Modal:**
```
┌──────────────────────────────┐
│  Record Payment          [×] │
├──────────────────────────────┤
│  Member*:     [Select ▼    ] │
│  Month-Year*: [Mar 2026 ▼  ] │
│  Amount*:     [10,000      ] │
│  Penalty:     [0           ] │
│  Penalty Why: [____________] │
│  Note:        [____________] │
├──────────────────────────────┤
│        [Cancel]  [Record]    │
└──────────────────────────────┘
```

- Amount is pre-filled based on settings (10,000 for March 2026, 2,000 for others)
- Month picker only shows months not yet paid by the selected member

---

### 7. Profile (`/profile`)

```
┌──────────────────────────────────────────────┐
│  My Profile                                   │
├──────────────────────────────────────────────┤
│  ┌──────────┐                                 │
│  │  Avatar  │  [ Change Photo ]               │
│  │   (pic)  │                                 │
│  └──────────┘                                 │
│                                               │
│  Full Name:   [____________]                  │
│  Username:    [____________]                  │
│  Email:       [____________]                  │
│  Phone:       [____________]                  │
│  Address:     [____________]                  │
│  Blood Group: [Select ▼    ]                  │
│                                               │
│  [ Save Changes ]                             │
│                                               │
│  ── Change Password ──────────                │
│  Current:  [________]                         │
│  New:      [________]                         │
│  [ Update Password ]                          │
└──────────────────────────────────────────────┘
```

---

## Component Library (shadcn/ui)

Components to install:

| Component | Used In |
|-----------|---------|
| Button | Everywhere |
| Card | Dashboard widgets, stat cards |
| Input | Forms, search |
| Label | Forms |
| Select | Dropdowns, filters |
| Table | All list pages |
| Dialog (Modal) | Add/edit forms |
| Badge | Role, status indicators |
| Avatar | Profile, header |
| DropdownMenu | Header user menu, actions |
| Pagination | All tables |
| Textarea | Notice body, notes |
| Toast | Success/error notifications |
| Skeleton | Loading states |
| Sheet | Mobile sidebar |
| Separator | Section dividers |
| Chart | Dashboard (recharts integration) |

---

## Color Scheme

| Usage | Color | Tailwind Class |
|-------|-------|----------------|
| Primary | Blue | `bg-blue-600` / `text-blue-600` |
| Success/Paid | Green | `bg-green-500` |
| Warning/Pending | Yellow | `bg-yellow-500` |
| Danger/Overdue | Red | `bg-red-500` |
| Disabled/Inactive | Gray | `bg-gray-400` |
| Background | Light Gray | `bg-gray-50` |
| Sidebar | White | `bg-white` |

Uses shadcn/ui's built-in dark/light theme system. Default: light mode.
