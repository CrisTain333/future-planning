# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript ^5 - All application code (components, API routes, models, validations, store)
- TSX - React components and email templates

**Secondary:**
- JavaScript (ESM) - Test/automation scripts (`scripts/browser-test.mjs`, `scripts/full-test.mjs`, `scripts/screenshot-pages.mjs`)
- CSS - Global styles with Tailwind v4 (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js 22.14.0 (local development)
- Vercel serverless (production deployment)

**Package Manager:**
- npm 10.9.2
- Lockfile: `package-lock.json` (present, 12978 lines)

## Frameworks

**Core:**
- Next.js 16.2.1 - Full-stack React framework (App Router)
  - Config: `next.config.ts`
  - Uses `serverExternalPackages: ["pdfkit"]` for PDF generation
  - RSC (React Server Components) enabled
  - Middleware at `src/middleware.ts` for auth route protection

- React 19.2.4 / ReactDOM 19.2.4 - UI library

**Testing:**
- Playwright ^1.58.2 (dev dependency) - Browser-based E2E testing
  - Custom test scripts in `scripts/browser-test.mjs`
  - No formal test runner config (jest/vitest not used)

**Build/Dev:**
- TypeScript ^5 - Type checking (`tsconfig.json`, target ES2017, strict mode)
- ESLint ^9 - Linting (`eslint.config.mjs`)
  - Uses `eslint-config-next` with core-web-vitals and TypeScript presets
- PostCSS with `@tailwindcss/postcss` plugin (`postcss.config.mjs`)
- tsx ^4.21.0 - Script runner for seed scripts (`npm run seed`)

## Key Dependencies

**UI Component Libraries:**
- Ant Design (antd) ^6.3.5 - Primary component library for tables, forms, buttons, modals
  - Configured in root layout with custom theme: `src/app/layout.tsx`
  - Primary color: `hsl(181, 87%, 31%)` (#0a9396 equivalent)
- shadcn/ui ^4.1.1 (style: base-nova) - Secondary component library
  - Config: `components.json`
  - Components in `src/components/ui/` (avatar, badge, card, separator, skeleton, sonner)
  - Uses CSS variables for theming
- @base-ui/react ^1.3.0 - Base UI primitives (used by shadcn)

**Icons:**
- lucide-react ^1.7.0 - Icon library (configured as shadcn icon library)

**State Management:**
- @reduxjs/toolkit ^2.11.2 - State management with RTK Query
  - Store: `src/store/store.ts`
  - Base API: `src/store/api.ts` (fetchBaseQuery, baseUrl: "/api")
  - Tag types: Users, Payments, Notices, Notifications, Settings, Dashboard, AuditLogs, EmailLogs, Investments
- react-redux ^9.2.0 - React bindings
  - Provider: `src/components/providers/redux-provider.tsx`

**Data Fetching:**
- RTK Query (via @reduxjs/toolkit) - All client-side API calls
  - API slices: `src/store/payments-api.ts`, `src/store/users-api.ts`, `src/store/investments-api.ts`, `src/store/analytics-api.ts`, `src/store/notices-api.ts`, `src/store/notifications-api.ts`, `src/store/audit-logs-api.ts`, `src/store/email-logs-api.ts`, `src/store/settings-api.ts`, `src/store/dashboard-api.ts`, `src/store/member-api.ts`, `src/store/profile-api.ts`

**Forms & Validation:**
- react-hook-form ^7.72.0 - Form state management
- @hookform/resolvers ^5.2.2 - Schema resolver integration
- zod ^4.3.6 - Schema validation
  - Schemas: `src/validations/auth.ts`, `src/validations/payment.ts`, `src/validations/user.ts`, `src/validations/notice.ts`

**Charts:**
- recharts ^3.8.1 - Data visualization (analytics, investment charts)

**Animation:**
- framer-motion ^12.38.0 - Component animations
- tw-animate-css ^1.4.0 - Tailwind animation utilities

**Styling:**
- tailwindcss ^4 - Utility-first CSS framework (v4 with `@import "tailwindcss"` syntax)
- class-variance-authority ^0.7.1 - Component variant management (CVA)
- clsx ^2.1.1 - Conditional class joining
- tailwind-merge ^3.5.0 - Tailwind class deduplication
  - Utility: `src/lib/utils.ts` exports `cn()` function

**Authentication:**
- next-auth ^5.0.0-beta.30 (Auth.js v5) - Authentication
  - Config: `src/lib/auth.config.ts` (JWT strategy, route authorization)
  - Implementation: `src/lib/auth.ts` (Credentials provider)
  - Session provider: `src/components/providers/session-provider.tsx`
  - Middleware: `src/middleware.ts`

**Database:**
- mongoose ^8.23.0 - MongoDB ODM
  - Connection: `src/lib/db.ts` (cached singleton pattern)
  - Models: `src/models/` (User, Payment, Investment, Notice, Notification, AuditLog, EmailLog, Settings)

**Email:**
- resend ^6.10.0 - Email sending service SDK
  - Client: `src/lib/email/resend.ts`
  - Send utility: `src/lib/email/send.ts`
- @react-email/components ^1.0.11 - Email template components
  - Templates: `src/lib/email/templates/` (layout, notice, password-changed, payment-receipt, payment-reminder)

**PDF Generation:**
- pdfkit ^0.18.0 - Server-side PDF generation
  - Used in: `src/app/api/payments/[id]/receipt/route.ts`
  - Externalized in Next.js config via `serverExternalPackages`
  - Type definitions: @types/pdfkit ^0.17.5

**File Upload:**
- cloudinary ^2.9.0 - Cloud image hosting (optional)
  - Used in: `src/app/api/profile/picture/route.ts`
  - Falls back to local filesystem (`public/uploads/profiles/`)
- next-cloudinary ^6.17.5 - Next.js Cloudinary integration

**Password Hashing:**
- bcryptjs ^3.0.3 - Password hashing
  - Used in auth and seed scripts
  - Type definitions: @types/bcryptjs ^2.4.6

**Notifications (UI):**
- react-hot-toast ^2.6.0 - Toast notifications (configured in root layout)
- sonner ^2.0.7 - Secondary toast system (shadcn Toaster component at `src/components/ui/sonner.tsx`)

**Theming:**
- next-themes ^0.4.6 - Dark/light mode support
  - CSS variables for dark mode in `src/app/globals.css`

**Monitoring:**
- @vercel/speed-insights ^2.0.0 - Performance monitoring
  - Integrated in: `src/app/layout.tsx`

## Configuration

**TypeScript:**
- Config: `tsconfig.json`
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Incremental compilation enabled

**Environment:**
- `.env.local` file present (gitignored)
- Required env vars: MONGODB_URI, AUTH_SECRET, RESEND_API_KEY, CRON_SECRET
- Optional env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

**Build:**
- `next.config.ts` - Minimal config, externalizes pdfkit
- `postcss.config.mjs` - @tailwindcss/postcss plugin
- `eslint.config.mjs` - next/core-web-vitals + next/typescript
- `components.json` - shadcn UI config (base-nova style, neutral base color, CSS variables)

**PWA:**
- `public/manifest.json` - Web app manifest (standalone mode, theme #0a9396)
- `public/sw.js` - Service worker
- Service worker registration: `src/components/providers/sw-register.tsx`

## Platform Requirements

**Development:**
- Node.js >= 22 (local version 22.14.0)
- MongoDB instance (connection via MONGODB_URI)
- npm for package management

**Production:**
- Vercel hosting (indicated by `vercel.json` with cron jobs)
- `vercel.json` configures a daily cron at `0 8 * * *` hitting `/api/emails/reminders`
- MongoDB Atlas or compatible hosted MongoDB

**Scripts:**
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database (tsx scripts/seed.ts)
```

---

*Stack analysis: 2026-04-09*
