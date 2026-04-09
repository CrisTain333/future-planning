# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
future-planning/
├── src/
│   ├── app/                    # Next.js App Router (pages + API routes)
│   │   ├── (admin)/            # Route group: admin pages (requires admin role)
│   │   │   ├── layout.tsx      # Sidebar + Header + Footer layout
│   │   │   └── admin/
│   │   │       ├── accounting/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── audit-logs/page.tsx
│   │   │       ├── collection-calendar/page.tsx
│   │   │       ├── email-logs/page.tsx
│   │   │       ├── investments/page.tsx
│   │   │       ├── notices/page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── users/page.tsx
│   │   ├── (auth)/             # Route group: unauthenticated pages
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/        # Route group: member pages (any authenticated user)
│   │   │   ├── layout.tsx      # Sidebar + Header + Footer layout
│   │   │   ├── dashboard/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── api/                # REST API route handlers
│   │   │   ├── analytics/      # Analytics endpoints (6 routes)
│   │   │   ├── audit-logs/     # Audit log listing
│   │   │   ├── auth/           # NextAuth + auth audit
│   │   │   ├── dashboard/      # Admin + member dashboard data
│   │   │   ├── emails/         # Email logs, reminders, send-reminder
│   │   │   ├── investments/    # Investment CRUD + analytics
│   │   │   ├── notices/        # Notice CRUD
│   │   │   ├── notifications/  # Notification list + mark-read + unread-count
│   │   │   ├── payments/       # Payment CRUD + archive + receipt + history
│   │   │   ├── profile/        # Profile get/update + password + picture
│   │   │   ├── settings/       # Foundation settings
│   │   │   └── users/          # User CRUD + toggle-status
│   │   ├── globals.css         # Tailwind v4 + shadcn theme variables + custom styles
│   │   ├── layout.tsx          # Root layout (providers, fonts, metadata)
│   │   └── page.tsx            # Root page (redirects to /login)
│   ├── assets/
│   │   └── images/             # Static image assets
│   ├── components/             # React components organized by feature
│   │   ├── accounting/         # Payment management components
│   │   ├── analytics/          # Analytics charts and tables
│   │   ├── dashboard/          # Dashboard widgets (admin + member)
│   │   ├── investments/        # Investment tracking components
│   │   ├── layout/             # Shell components (sidebar, header, footer)
│   │   ├── notices/            # Notice board components
│   │   ├── profile/            # Profile editing components
│   │   ├── providers/          # Context providers (Redux, Session, SW)
│   │   ├── ui/                 # shadcn/ui primitives (card, badge, avatar, etc.)
│   │   └── users/              # User management components
│   ├── hooks/                  # Custom React hooks
│   │   └── use-debounce.ts     # Debounce hook for search inputs
│   ├── lib/                    # Shared server-side utilities
│   │   ├── audit.ts            # Audit log creation helper
│   │   ├── auth.config.ts      # NextAuth config (Edge-safe)
│   │   ├── auth.ts             # NextAuth full config (with Credentials provider)
│   │   ├── db.ts               # MongoDB connection singleton
│   │   ├── email/              # Email service
│   │   │   ├── resend.ts       # Resend client instance
│   │   │   ├── send.ts         # Email sending + logging helper
│   │   │   └── templates/      # React Email templates
│   │   │       ├── layout.tsx          # Shared email layout
│   │   │       ├── notice.tsx          # Notice notification email
│   │   │       ├── password-changed.tsx # Password change confirmation
│   │   │       ├── payment-receipt.tsx  # Payment receipt email
│   │   │       └── payment-reminder.tsx # Payment reminder email
│   │   ├── investment-utils.ts # Compound interest calculators
│   │   ├── notifications.ts    # In-app notification creation helpers
│   │   ├── skip-months.ts      # Skip month logic for collection calendar
│   │   └── utils.ts            # cn() Tailwind merge utility (shadcn)
│   ├── middleware.ts           # NextAuth route protection middleware
│   ├── models/                 # Mongoose schemas and models
│   │   ├── AuditLog.ts
│   │   ├── EmailLog.ts
│   │   ├── Investment.ts
│   │   ├── Notice.ts
│   │   ├── Notification.ts
│   │   ├── Payment.ts
│   │   ├── Settings.ts
│   │   └── User.ts
│   ├── store/                  # Redux Toolkit Query API layer
│   │   ├── api.ts              # Base createApi instance
│   │   ├── store.ts            # Redux store factory
│   │   ├── analytics-api.ts    # Analytics query hooks
│   │   ├── audit-logs-api.ts   # Audit log query hooks
│   │   ├── dashboard-api.ts    # Dashboard query hooks
│   │   ├── email-logs-api.ts   # Email log query + reminder mutation hooks
│   │   ├── investments-api.ts  # Investment CRUD hooks
│   │   ├── member-api.ts       # Member dashboard + my-payments hooks
│   │   ├── notices-api.ts      # Notice CRUD hooks
│   │   ├── notifications-api.ts # Notification hooks
│   │   ├── payments-api.ts     # Payment CRUD + archive hooks
│   │   ├── profile-api.ts      # Profile + password + picture hooks
│   │   ├── settings-api.ts     # Settings hooks
│   │   └── users-api.ts        # User CRUD hooks
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces (IUser, IPayment, etc.)
│   └── validations/            # Zod validation schemas
│       ├── auth.ts             # Login schema
│       ├── notice.ts           # Notice create/update schemas
│       ├── payment.ts          # Payment create/update schemas
│       └── user.ts             # User create/update + profile + password schemas
├── public/                     # Static files served at root
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── uploads/profiles/       # (Likely unused - Cloudinary for profile pics)
│   └── *.png, *.svg            # Favicons, icons, Next.js defaults
├── scripts/                    # Development/utility scripts
│   ├── seed.ts                 # Database seeder (run via `npm run seed`)
│   ├── seed-demo.ts            # Demo data seeder
│   ├── browser-test.mjs        # Playwright browser tests
│   ├── full-test.mjs           # Full test suite
│   └── screenshot-pages.mjs    # Page screenshot utility
├── Docs/                       # Project documentation
│   ├── PRD.md                  # Product requirements document
│   ├── API.md                  # API endpoint documentation
│   ├── DATABASE.md             # Database schema documentation
│   ├── PAGES.md                # Page/UI documentation
│   ├── TECH_STACK.md           # Technology stack documentation
│   └── superpowers/            # AI-generated plans and specs
├── favicon_io/                 # Favicon source files
├── .planning/                  # GSD planning documents
│   └── codebase/               # Architecture analysis documents
├── components.json             # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
├── postcss.config.mjs          # PostCSS configuration (Tailwind v4)
├── vercel.json                 # Vercel deployment config (cron jobs)
├── package.json                # Dependencies and scripts
└── AGENTS.md / CLAUDE.md       # AI assistant instructions
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router directory containing all routes and API endpoints
- Contains: Page components (`page.tsx`), layouts (`layout.tsx`), API route handlers (`route.ts`)
- Key files: `layout.tsx` (root layout with providers), `globals.css` (theme)

**`src/app/(admin)/admin/`:**
- Purpose: Admin-only pages for managing the foundation
- Contains: 10 feature pages, each a single `page.tsx` file
- All pages are `"use client"` components that compose feature components from `src/components/`

**`src/app/(dashboard)/`:**
- Purpose: Pages accessible to all authenticated users
- Contains: `dashboard/page.tsx` (role-switching dashboard), `profile/page.tsx`

**`src/app/api/`:**
- Purpose: All REST API endpoints
- Contains: `route.ts` files organized by resource
- Pattern: Each route file exports named functions (GET, POST, PUT, PATCH, DELETE)

**`src/components/`:**
- Purpose: Reusable React components organized by feature domain
- Contains: Feature-specific directories + shared `ui/`, `layout/`, `providers/`
- Key pattern: Feature components are imported by corresponding page components

**`src/components/ui/`:**
- Purpose: shadcn/ui primitive components
- Contains: `card.tsx`, `badge.tsx`, `avatar.tsx`, `skeleton.tsx`, `separator.tsx`, `sonner.tsx`
- Generated: Yes (via `npx shadcn add`)
- Note: Most UI primitives come from Ant Design (`antd`), not shadcn

**`src/components/layout/`:**
- Purpose: App shell components shared across admin and dashboard route groups
- Contains: `sidebar.tsx`, `header.tsx`, `footer.tsx`, `notification-bell.tsx`

**`src/components/providers/`:**
- Purpose: React context providers wrapping the app
- Contains: `redux-provider.tsx`, `session-provider.tsx`, `sw-register.tsx`

**`src/models/`:**
- Purpose: Mongoose schema definitions and model exports
- Contains: One file per collection (8 models total)
- Pattern: Exports both `IXxxDocument` interface and default model

**`src/store/`:**
- Purpose: Redux Toolkit Query API definitions and store configuration
- Contains: Base API (`api.ts`), store factory (`store.ts`), one file per domain (`*-api.ts`)
- Pattern: Each file uses `api.injectEndpoints()` and exports auto-generated hooks

**`src/lib/`:**
- Purpose: Server-side shared utilities and services
- Contains: Auth config, DB connection, audit logging, email service, business logic helpers

**`src/lib/email/`:**
- Purpose: Email sending infrastructure
- Contains: Resend client, send helper with logging, React Email templates

**`src/types/`:**
- Purpose: Shared TypeScript type definitions
- Contains: Single `index.ts` with all interfaces (client-facing versions of model types)

**`src/validations/`:**
- Purpose: Zod validation schemas for API input validation
- Contains: One file per domain (auth, user, payment, notice)

**`scripts/`:**
- Purpose: Development utilities and test scripts
- Contains: Database seeders, Playwright browser tests
- Not part of production build

**`Docs/`:**
- Purpose: Project documentation (PRD, API docs, database schema, etc.)
- Contains: Markdown documentation files
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout -- providers, fonts, metadata, PWA config
- `src/app/page.tsx`: Root page -- redirects to `/login`
- `src/middleware.ts`: Auth middleware -- route protection

**Configuration:**
- `next.config.ts`: Next.js config (serverExternalPackages: pdfkit)
- `tsconfig.json`: TypeScript config (path alias `@/*` -> `./src/*`)
- `components.json`: shadcn/ui config (base-nova style, rsc: true)
- `vercel.json`: Vercel deploy config (cron: daily email reminders)
- `postcss.config.mjs`: PostCSS with Tailwind v4
- `eslint.config.mjs`: ESLint configuration

**Core Logic:**
- `src/lib/auth.ts`: NextAuth configuration with Credentials provider
- `src/lib/auth.config.ts`: Edge-compatible auth config (JWT callbacks, authorization)
- `src/lib/db.ts`: MongoDB connection singleton
- `src/lib/audit.ts`: Audit log creation helper
- `src/lib/notifications.ts`: In-app notification creation
- `src/lib/email/send.ts`: Email sending with Resend + logging

**State Management:**
- `src/store/store.ts`: Redux store factory (RTK Query only)
- `src/store/api.ts`: Base RTK Query API instance

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: `kebab-case.tsx` (e.g., `payment-table.tsx`, `stat-card.tsx`)
- Models: `PascalCase.ts` (e.g., `Payment.ts`, `AuditLog.ts`)
- Store slices: `kebab-case-api.ts` (e.g., `payments-api.ts`, `dashboard-api.ts`)
- Validations: `kebab-case.ts` (e.g., `payment.ts`, `user.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-debounce.ts`)
- Utilities: `kebab-case.ts` (e.g., `skip-months.ts`, `investment-utils.ts`)

**Directories:**
- Route groups: `(group-name)` with parentheses (Next.js convention)
- Feature directories: `kebab-case` (e.g., `audit-logs`, `email-logs`)
- Component directories: `kebab-case` matching feature domain (e.g., `accounting`, `analytics`)

**Exports:**
- Components: Named exports for non-page components (e.g., `export function Sidebar()`)
- Pages: Default exports (e.g., `export default function DashboardPage()`)
- Models: Default export of Mongoose model (e.g., `export default Payment`)
- Hooks: Named exports (e.g., `export const { useGetPaymentsQuery } = paymentsApi`)
- Types: Named exports from barrel file (e.g., `export interface IPayment {}`)

## Where to Add New Code

**New Admin Feature Page:**
1. Create page: `src/app/(admin)/admin/{feature-name}/page.tsx` (use `"use client"` directive)
2. Create components: `src/components/{feature-name}/` directory with feature-specific components
3. Create API route: `src/app/api/{feature-name}/route.ts` with GET/POST handlers
4. Create RTK Query slice: `src/store/{feature-name}-api.ts` using `api.injectEndpoints()`
5. Add tag type to `src/store/api.ts` tagTypes array
6. Add Mongoose model if new collection: `src/models/{ModelName}.ts`
7. Add types: Export new interfaces from `src/types/index.ts`
8. Add validation schema if needed: `src/validations/{feature-name}.ts`
9. Add sidebar link: Update `adminLinks` array in `src/components/layout/sidebar.tsx`

**New Member-Facing Page:**
1. Create page: `src/app/(dashboard)/{page-name}/page.tsx`
2. Add sidebar link: Update `memberLinks` array in `src/components/layout/sidebar.tsx`
3. Add middleware matcher: Update `config.matcher` in `src/middleware.ts`

**New API Endpoint:**
- Resource CRUD: `src/app/api/{resource}/route.ts` (GET, POST)
- Resource by ID: `src/app/api/{resource}/[id]/route.ts` (GET, PUT, DELETE)
- Sub-resource: `src/app/api/{resource}/[id]/{action}/route.ts`
- Follow pattern: session check -> dbConnect -> validate input -> perform operation -> return `ApiResponse<T>`

**New Component:**
- Feature-specific: `src/components/{feature-name}/{component-name}.tsx`
- Shared UI primitive: `src/components/ui/{component-name}.tsx` (prefer shadcn `npx shadcn add`)
- Layout component: `src/components/layout/{component-name}.tsx`

**New Mongoose Model:**
- File: `src/models/{ModelName}.ts`
- Pattern: Define `IModelDocument extends Document` interface, create schema, export model
- Register: Use `mongoose.models.Name || mongoose.model()` to prevent re-registration in dev

**New RTK Query Endpoints:**
- File: `src/store/{domain}-api.ts`
- Pattern: `api.injectEndpoints({ endpoints: (builder) => ({ ... }) })`
- Export: Auto-generated hooks

**New Utility:**
- Server-side: `src/lib/{utility-name}.ts`
- Client-side hook: `src/hooks/use-{hook-name}.ts`

**New Email Template:**
- File: `src/lib/email/templates/{template-name}.tsx`
- Uses React Email components
- Add type string to `SendEmailOptions.type` union in `src/lib/email/send.ts`

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and dev server cache
- Generated: Yes
- Committed: No (in `.gitignore`)

**`.next-old-root/`:**
- Purpose: Appears to be a leftover from a previous Next.js version/migration
- Generated: Yes
- Committed: Unclear -- should likely be in `.gitignore`

**`node_modules/`:**
- Purpose: npm packages
- Generated: Yes
- Committed: No

**`public/uploads/profiles/`:**
- Purpose: Intended for profile picture uploads
- Note: Profile pictures appear to use Cloudinary (via `next-cloudinary`), so this may be unused

**`favicon_io/`:**
- Purpose: Source favicon files (from favicon.io generator)
- Generated: External tool
- Committed: Yes

---

*Structure analysis: 2026-04-09*
