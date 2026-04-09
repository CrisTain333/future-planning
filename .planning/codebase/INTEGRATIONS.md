# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Email Delivery:**
- Resend - Transactional email sending
  - SDK: `resend` ^6.10.0
  - Client: `src/lib/email/resend.ts`
  - Auth: `RESEND_API_KEY` env var
  - Send utility: `src/lib/email/send.ts` (wraps Resend SDK with logging)
  - From address: Dynamic, uses `{foundationName} <onboarding@resend.dev>` pattern
  - Email types sent: payment_reminder, payment_receipt, notice, password_changed
  - Templates built with @react-email/components in `src/lib/email/templates/`

**Image Hosting (Optional):**
- Cloudinary - Cloud-based image storage for profile pictures
  - SDK: `cloudinary` ^2.9.0 (v2 API)
  - Next.js integration: `next-cloudinary` ^6.17.5
  - Auth: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars
  - Configuration: `src/app/api/profile/picture/route.ts` (runtime config)
  - Upload folder: `future-planning/profiles`
  - Transformation: 200x200 crop fill on upload
  - Fallback: If Cloudinary env vars are not set or equal "your-cloud-name", falls back to local filesystem storage at `public/uploads/profiles/`

**Performance Monitoring:**
- Vercel Speed Insights - Real user monitoring
  - SDK: `@vercel/speed-insights` ^2.0.0
  - Integration: `src/app/layout.tsx` (SpeedInsights component)
  - Automatically reports Web Vitals to Vercel dashboard

## Data Storage

**Database:**
- MongoDB (via Mongoose ^8.23.0)
  - Connection env var: `MONGODB_URI`
  - Client: Mongoose ODM with cached singleton connection
  - Connection module: `src/lib/db.ts`
  - Connection options: `{ bufferCommands: false }`
  - 8 collections (models):

| Model | File | Key Indexes |
|-------|------|-------------|
| User | `src/models/User.ts` | username (unique), email (unique) |
| Payment | `src/models/Payment.ts` | userId+month+year (unique compound), userId, month+year |
| Investment | `src/models/Investment.ts` | status, maturityDate |
| Notice | `src/models/Notice.ts` | createdAt (desc) |
| Notification | `src/models/Notification.ts` | userId+isRead+createdAt (compound) |
| AuditLog | `src/models/AuditLog.ts` | performedBy, targetUser, createdAt (desc) |
| EmailLog | `src/models/EmailLog.ts` | type, status, createdAt (desc) |
| Settings | `src/models/Settings.ts` | (singleton document) |

**File Storage:**
- Local filesystem: `public/uploads/profiles/` (when Cloudinary is not configured)
- Cloudinary cloud storage (when configured) at folder `future-planning/profiles`
- Static assets: `public/` directory (favicons, manifest, service worker, PWA icons)
- Signature image: `src/assets/images/santu_signature.png` (embedded in PDF receipts)

**Caching:**
- RTK Query client-side cache with tag-based invalidation
  - Tags: Users, Payments, Notices, Notifications, Settings, Dashboard, AuditLogs, EmailLogs, Investments
- Mongoose connection cached in global variable (development hot-reload safe)
- No server-side caching layer (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v5 (Auth.js) beta - Custom credentials-based authentication
  - Config: `src/lib/auth.config.ts`
  - Implementation: `src/lib/auth.ts`
  - Provider: Credentials only (username + password)
  - Session strategy: JWT (no database sessions)
  - Auth secret env var: `AUTH_SECRET`

**Auth Flow:**
1. User submits username/password to `/login`
2. NextAuth `authorize()` callback in `src/lib/auth.ts`:
   - Connects to MongoDB
   - Looks up user by lowercase username
   - Checks `isDisabled` flag
   - Verifies password with bcryptjs
3. JWT token stores: `userId`, `role`, `fullName`
4. Session callback enriches session with JWT claims

**Route Protection:**
- Middleware: `src/middleware.ts` (NextAuth edge middleware)
  - Matched routes: `/dashboard/*`, `/profile/*`, `/admin/*`, `/login`
  - Authorization logic in `src/lib/auth.config.ts`:
    - `/login` is always accessible
    - `/admin/*` requires `role === "admin"`
    - All other matched routes require authentication

**Roles:**
- `admin` - Full access to all routes and API endpoints
- `user` - Member access to dashboard, profile, notices

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, etc.)
- Errors logged to `console.error` in API routes

**Logs:**
- Console-based logging only (`console.error`, `console.log`)
- Email send/fail events logged to `EmailLog` MongoDB collection
- All admin actions logged to `AuditLog` MongoDB collection via `src/lib/audit.ts`
  - Tracked actions: payment CRUD, user CRUD, notice CRUD, settings updates, profile updates, login/login_failed
  - Audit log creation: `createAuditLog(action, performedBy, details, targetUser?)`

**Speed Insights:**
- Vercel Speed Insights for production RUM (Real User Monitoring)

## CI/CD & Deployment

**Hosting:**
- Vercel (serverless)
  - Config: `vercel.json`
  - Cron job: Daily at 08:00 UTC - `/api/emails/reminders`
  - Cron auth: `CRON_SECRET` env var (Bearer token)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, no `.gitlab-ci.yml`, no `Jenkinsfile`)

**Build:**
- `next build` (standard Next.js build)
- Deployed as serverless functions on Vercel

## Environment Configuration

**Required env vars:**
- `MONGODB_URI` - MongoDB connection string
- `AUTH_SECRET` - NextAuth.js session encryption secret
- `RESEND_API_KEY` - Resend email API key
- `CRON_SECRET` - Bearer token for Vercel cron job authentication

**Optional env vars:**
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name (falls back to local storage)
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

**Env file:**
- `.env.local` present (gitignored)
- Loaded by Next.js automatically for server-side code
- Seed script uses `dotenv` to load `.env.local` explicitly

**Secrets location:**
- Environment variables on Vercel (production)
- `.env.local` file (development)

## Webhooks & Callbacks

**Incoming:**
- `/api/emails/reminders` (GET) - Vercel cron endpoint
  - Schedule: Daily at 08:00 UTC (`0 8 * * *`)
  - Auth: Bearer token via `CRON_SECRET`
  - Purpose: Sends payment reminder emails to unpaid members on days 1, 5, 10, 15 of each month

**Outgoing:**
- Resend API calls for email delivery (no webhook callbacks configured)
- Cloudinary API calls for image upload (no webhook callbacks configured)

## Internal API Routes

All API routes are Next.js App Router route handlers at `src/app/api/`:

**Auth:**
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers
- `POST /api/auth/audit` - Login audit logging

**Users (admin):**
- `GET/POST /api/users` - List/create users
- `GET/PUT /api/users/[id]` - Get/update user
- `PUT /api/users/[id]/toggle-status` - Enable/disable user

**Payments (admin):**
- `GET/POST /api/payments` - List/create payments
- `GET/PUT/DELETE /api/payments/[id]` - Get/update/delete payment
- `PUT /api/payments/[id]/archive` - Archive payment
- `PUT /api/payments/[id]/unarchive` - Unarchive payment
- `GET /api/payments/[id]/history` - Payment audit history
- `GET /api/payments/[id]/receipt` - Download PDF receipt
- `GET /api/payments/my` - Member's own payments

**Investments (admin):**
- `GET/POST /api/investments` - List/create investments
- `GET/PUT/DELETE /api/investments/[id]` - Get/update/delete investment
- `GET /api/investments/analytics` - Investment analytics data

**Notices:**
- `GET/POST /api/notices` - List/create notices
- `GET/PUT/DELETE /api/notices/[id]` - Get/update/delete notice

**Notifications:**
- `GET /api/notifications` - List user notifications
- `PUT /api/notifications/mark-read` - Mark notifications as read
- `GET /api/notifications/unread-count` - Unread notification count

**Analytics (admin):**
- `GET /api/analytics/summary` - Overview statistics
- `GET /api/analytics/collection-rate` - Collection rate data
- `GET /api/analytics/member-scores` - Member payment scores
- `GET /api/analytics/monthly-report` - Monthly report data
- `GET /api/analytics/payment-grid` - Payment grid visualization data
- `GET /api/analytics/export` - CSV export (payments or members)

**Profile:**
- `GET/PUT /api/profile` - View/update own profile
- `PUT /api/profile/password` - Change own password
- `POST /api/profile/picture` - Upload profile picture (multipart form)

**Dashboard:**
- `GET /api/dashboard/admin` - Admin dashboard data
- `GET /api/dashboard/member` - Member dashboard data

**Other:**
- `GET/PUT /api/settings` - Foundation settings (admin)
- `GET /api/audit-logs` - Audit log listing (admin)
- `GET /api/emails/logs` - Email log listing (admin)
- `POST /api/emails/send-reminder` - Manual email reminder trigger (admin)
- `GET /api/emails/reminders` - Cron-triggered automated reminders

---

*Integration audit: 2026-04-09*
