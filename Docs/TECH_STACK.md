# Future Planning - Tech Stack & Project Setup

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| Database | MongoDB | 7.x (Atlas) |
| ODM | Mongoose | 8.x |
| Authentication | NextAuth.js (Auth.js) | v5 |
| UI Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui | latest |
| Charts | Recharts | 2.x |
| PDF Generation | @react-pdf/renderer | 4.x |
| Image Upload | next-cloudinary | latest |
| Validation | Zod | 3.x |
| Form Handling | React Hook Form | 7.x |
| Icons | Lucide React | latest |
| HTTP Client | Built-in fetch (Next.js) | — |
| Deployment | Vercel | — |

---

## Project Structure

```
future-planning/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Sidebar + Header layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Role-based dashboard
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx              # Admin route guard
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       ├── notices/
│   │   │       │   └── page.tsx
│   │   │       ├── accounting/
│   │   │       │   └── page.tsx
│   │   │       └── settings/
│   │   │           └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── users/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── toggle-status/
│   │   │   │           └── route.ts
│   │   │   ├── profile/
│   │   │   │   ├── route.ts
│   │   │   │   ├── password/
│   │   │   │   │   └── route.ts
│   │   │   │   └── picture/
│   │   │   │       └── route.ts
│   │   │   ├── payments/
│   │   │   │   ├── route.ts
│   │   │   │   ├── my/
│   │   │   │   │   └── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── receipt/
│   │   │   │           └── route.ts
│   │   │   ├── notices/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── notifications/
│   │   │   │   ├── route.ts
│   │   │   │   ├── mark-read/
│   │   │   │   │   └── route.ts
│   │   │   │   └── unread-count/
│   │   │   │       └── route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── member/
│   │   │   │   │   └── route.ts
│   │   │   │   └── admin/
│   │   │   │       └── route.ts
│   │   │   ├── settings/
│   │   │   │   └── route.ts
│   │   │   └── audit-logs/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Redirect to /login
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/
│   │   │   ├── stat-card.tsx
│   │   │   ├── fund-line-chart.tsx
│   │   │   ├── member-pie-chart.tsx
│   │   │   ├── recent-payments.tsx
│   │   │   ├── recent-notices.tsx
│   │   │   └── payment-history-table.tsx
│   │   ├── users/
│   │   │   ├── user-table.tsx
│   │   │   └── user-form-modal.tsx
│   │   ├── notices/
│   │   │   ├── notice-table.tsx
│   │   │   └── notice-form-modal.tsx
│   │   ├── accounting/
│   │   │   ├── payment-table.tsx
│   │   │   └── payment-form-modal.tsx
│   │   └── profile/
│   │       ├── profile-form.tsx
│   │       └── password-form.tsx
│   ├── lib/
│   │   ├── db.ts                       # MongoDB connection
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── cloudinary.ts               # Cloudinary config
│   │   └── utils.ts                    # Utility functions
│   ├── models/
│   │   ├── User.ts
│   │   ├── Payment.ts
│   │   ├── Notice.ts
│   │   ├── Notification.ts
│   │   ├── AuditLog.ts
│   │   └── Settings.ts
│   ├── validations/
│   │   ├── user.ts                     # Zod schemas for user
│   │   ├── payment.ts
│   │   ├── notice.ts
│   │   └── auth.ts
│   ├── types/
│   │   └── index.ts                    # TypeScript interfaces
│   └── middleware.ts                    # Auth middleware (protect routes)
├── public/
│   └── logo.png
├── .env.local                          # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/future-planning

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Middleware (Route Protection)

```
Protected routes:     /dashboard, /profile, /admin/*
Public routes:        /login
Admin-only routes:    /admin/*
Redirect if logged in: /login → /dashboard
Redirect if not logged in: /* → /login
```

---

## Seed Script

A seed script (`src/lib/seed.ts`) runs on first application start or via command:

```bash
npm run seed
```

Creates:
1. Default settings document
2. Default admin user (username: "admin", password: "1234")

---

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run seed         # Seed database with defaults
npm run lint         # Run ESLint
```
