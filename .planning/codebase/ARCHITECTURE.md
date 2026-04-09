# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Next.js 16 App Router full-stack monolith with REST API layer, Redux Toolkit Query for client-side state, and MongoDB via Mongoose for persistence.

**Key Characteristics:**
- Server-side rendering for layouts, client-side rendering for all page content (every page uses `"use client"`)
- Three route groups segregating admin, member dashboard, and auth flows
- RTK Query as the sole data-fetching and caching layer on the client
- Mongoose models as the single source of truth for data shape
- Credential-based authentication via NextAuth v5 with JWT strategy
- Role-based access control (admin / user) enforced at middleware and API route levels

## Application Type

**Hybrid SSR/CSR:** Layouts render server-side (no `"use client"` directive on `(admin)/layout.tsx` and `(dashboard)/layout.tsx`). All page components are client components using `"use client"`, which means pages are hydrated on the client. API routes handle all data operations server-side.

## Layers

**Presentation Layer (Client Components):**
- Purpose: Renders UI, handles user interactions, manages local UI state
- Location: `src/components/`, `src/app/**/page.tsx`
- Contains: React components using Ant Design + shadcn/ui + Framer Motion
- Depends on: RTK Query hooks from `src/store/`, types from `src/types/`
- Used by: Next.js routing

**API Layer (Route Handlers):**
- Purpose: REST endpoints for all data operations, authorization checks, business logic
- Location: `src/app/api/`
- Contains: Next.js route handlers exporting GET/POST/PUT/PATCH/DELETE functions
- Depends on: `src/lib/auth.ts` for session, `src/lib/db.ts` for DB connection, `src/models/` for data access, `src/validations/` for input validation
- Used by: RTK Query via `fetchBaseQuery({ baseUrl: "/api" })`

**Data Access Layer (Mongoose Models):**
- Purpose: Schema definitions, database operations, indexing
- Location: `src/models/`
- Contains: Mongoose schemas and model exports
- Depends on: `mongoose` package
- Used by: API route handlers

**State Management Layer (RTK Query):**
- Purpose: Client-side API state, caching, cache invalidation
- Location: `src/store/`
- Contains: RTK Query API slices with `injectEndpoints` pattern
- Depends on: `@reduxjs/toolkit/query/react`
- Used by: Client components via auto-generated hooks

**Shared Utilities:**
- Purpose: Cross-cutting logic (auth, DB connection, audit logging, notifications, email)
- Location: `src/lib/`
- Contains: Helper functions, email service, validation helpers
- Depends on: Models, external services (Resend, Cloudinary)
- Used by: API route handlers

**Validation Layer:**
- Purpose: Input validation with Zod schemas, shared between client and server
- Location: `src/validations/`
- Contains: Zod schemas and inferred TypeScript types
- Depends on: `zod`
- Used by: API route handlers (server-side validation), login page (client-side with react-hook-form)

## Routing Strategy

**File-based App Router** with three route groups:

| Route Group | Layout | Purpose | Auth Required |
|-------------|--------|---------|--------------|
| `(auth)` | None (uses root) | Login page only | No |
| `(dashboard)` | Sidebar + Header + Footer | Member-facing pages | Yes (any role) |
| `(admin)` | Sidebar + Header + Footer (identical) | Admin-only management pages | Yes (admin only) |

**Middleware** (`src/middleware.ts`):
- Uses NextAuth middleware for route protection
- Matcher: `/dashboard/:path*`, `/profile/:path*`, `/admin/:path*`, `/login`
- Authorization logic in `src/lib/auth.config.ts` `authorized` callback:
  - `/admin/*` routes require `role === "admin"`
  - All other matched routes require authenticated session
  - `/login` is always accessible

**Root page** (`src/app/page.tsx`): Redirects to `/login`

## Data Flow

**Client-Side Data Fetching (primary pattern):**

1. Page component mounts with `"use client"` directive
2. Component calls RTK Query hook (e.g., `useGetPaymentsQuery({ page, limit })`)
3. RTK Query sends GET request to `/api/{resource}`
4. API route handler: validates session via `auth()`, connects to MongoDB via `dbConnect()`, queries Mongoose model
5. Response returned as `{ success: boolean, data: T, pagination?: {...} }`
6. RTK Query caches response, component re-renders with data

**Mutation Flow:**

1. User action triggers RTK Query mutation hook (e.g., `useCreatePaymentMutation`)
2. Mutation sends POST/PUT/DELETE to `/api/{resource}`
3. API route handler: validates session, validates input with Zod, performs DB operation
4. Side effects executed: audit log created, notifications sent, email dispatched (fire-and-forget)
5. Mutation returns, RTK Query invalidates related cache tags (e.g., `["Payments", "Dashboard"]`)
6. Affected queries automatically refetch

**State Management:**
- Redux store contains ONLY the RTK Query `api` reducer -- no custom slices
- All server state managed through RTK Query cache with tag-based invalidation
- Local UI state (modals, filters, pagination) managed with React `useState`
- Session state accessed via `useSession()` from next-auth/react
- Tag types: `Users`, `Payments`, `Notices`, `Notifications`, `Settings`, `Dashboard`, `AuditLogs`, `EmailLogs`, `Investments`

## RTK Query Architecture

**Base API** (`src/store/api.ts`):
- Single `createApi` instance with `fetchBaseQuery({ baseUrl: "/api" })`
- Empty `endpoints` -- all endpoints injected via `api.injectEndpoints()`

**Endpoint Slices** (one file per domain):
| File | Domain | Endpoints |
|------|--------|-----------|
| `src/store/users-api.ts` | User management | CRUD + toggle status |
| `src/store/payments-api.ts` | Payment records | CRUD + archive/unarchive + history |
| `src/store/notices-api.ts` | Notice board | CRUD |
| `src/store/notifications-api.ts` | User notifications | List + unread count + mark read |
| `src/store/dashboard-api.ts` | Dashboard aggregation | Admin dashboard data |
| `src/store/analytics-api.ts` | Analytics | Payment grid, collection rate, summary, member scores, monthly report |
| `src/store/profile-api.ts` | User profile | Get/update profile, change password, upload picture |
| `src/store/settings-api.ts` | Foundation settings | Get/update settings |
| `src/store/member-api.ts` | Member self-service | Member dashboard + my payments |
| `src/store/investments-api.ts` | Investment tracking | CRUD + analytics |
| `src/store/audit-logs-api.ts` | Audit log viewer | Paginated list |
| `src/store/email-logs-api.ts` | Email log viewer | Paginated list + send manual reminder |

## Key Abstractions

**Mongoose Models:**
- Purpose: Define data shape, validation constraints, and indexes
- Models: `User`, `Payment`, `Notice`, `Notification`, `AuditLog`, `Settings`, `EmailLog`, `Investment`
- Pattern: Each file exports both a TypeScript interface (`IXxxDocument extends Document`) and a Mongoose model
- Location: `src/models/`

**RTK Query Hooks:**
- Purpose: Type-safe data fetching with automatic caching
- Pattern: Each `*-api.ts` file exports auto-generated hooks (`useGetXxxQuery`, `useCreateXxxMutation`)
- Cache invalidation uses `providesTags` / `invalidatesTags` with string-based tag types

**API Response Envelope:**
- Standard response shape defined in `src/types/index.ts`:
  - `ApiResponse<T>`: `{ success: boolean, data: T, message?: string }`
  - `PaginatedResponse<T>`: `{ success: boolean, data: T[], pagination: { page, limit, total, totalPages } }`
  - `ApiError`: `{ success: false, error: string }`

**Zod Validation Schemas:**
- Shared schemas in `src/validations/` with inferred TypeScript types
- Used server-side in API routes via `schema.safeParse(body)`
- Used client-side in login page via `zodResolver(loginSchema)` with react-hook-form

## Entry Points

**Root Layout (`src/app/layout.tsx`):**
- Wraps entire app with `SessionProvider` > `ReduxProvider` > `ConfigProvider` (Ant Design theming)
- Registers service worker, initializes toast notifications
- Sets global font (Inter), metadata, and PWA configuration

**Middleware (`src/middleware.ts`):**
- Intercepts requests to protected routes
- Delegates to NextAuth middleware with `authConfig`

**API Auth (`src/app/api/auth/[...nextauth]/route.ts`):**
- NextAuth catch-all route handler
- Delegates to `handlers` from `src/lib/auth.ts`

## Authentication Architecture

**Provider:** NextAuth v5 (beta) with Credentials provider
- Config split: `src/lib/auth.config.ts` (Edge-compatible, no Node.js deps) + `src/lib/auth.ts` (full config with bcrypt/DB)
- Session strategy: JWT (no database sessions)
- JWT enrichment: `userId`, `role`, `fullName` stored in token
- Session enrichment: Same fields available via `session.user`

**Authorization pattern in API routes:**
```typescript
const session = await auth();
const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
if (!currentUser || currentUser.role !== "admin") {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
```

## Cross-Cutting Concerns

**Audit Logging:**
- Helper: `src/lib/audit.ts` > `createAuditLog(action, performedBy, details, targetUser?)`
- Called from API route handlers after successful mutations
- Tracks: payment CRUD, user CRUD, notice CRUD, settings changes, profile updates, auth events
- Stored in MongoDB `AuditLog` collection

**Notifications:**
- Helper: `src/lib/notifications.ts` > `createPaymentNotification()`, `createNoticeNotification()`
- In-app notifications stored in MongoDB `Notification` collection
- Displayed via `NotificationBell` component in header

**Email:**
- Service: Resend API via `src/lib/email/send.ts`
- Templates: React Email components in `src/lib/email/templates/`
- Types: payment_reminder, payment_receipt, notice, password_changed
- Email delivery is fire-and-forget (non-blocking)
- All sends logged to `EmailLog` collection (success and failure)
- Automated daily reminders via Vercel Cron (`vercel.json`: `GET /api/emails/reminders` at 08:00 UTC)

**Validation:**
- Server-side: Zod schemas in `src/validations/` used in API routes
- Client-side: react-hook-form with `zodResolver` (used in login, limited adoption elsewhere)
- Most client forms use Ant Design's built-in validation rather than Zod

**Error Handling:**
- API routes: try/catch wrapping entire handler, generic error response on failure
- Client: RTK Query error states + `react-hot-toast` for user feedback
- No global error boundary
- No structured error logging (only `console.error` in catch blocks)

## Database Connection

**Pattern:** Singleton cached connection (`src/lib/db.ts`)
- Uses global variable `global.mongooseCache` to persist connection across hot reloads
- Every API route calls `await dbConnect()` before any DB operation
- Connection string from `MONGODB_URI` environment variable

## Cron Jobs

**Vercel Cron** (`vercel.json`):
- `GET /api/emails/reminders` runs daily at 08:00 UTC
- Sends payment reminder emails to members with outstanding payments

## PWA Support

- Service worker registered via `src/components/providers/sw-register.tsx`
- Manifest at `public/manifest.json`
- PWA icons in `public/` (android-chrome, apple-touch-icon)

---

*Architecture analysis: 2026-04-09*
