# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**
- No test runner is configured
- No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` files exist in the project root
- `playwright` is listed in `devDependencies` (`^1.58.2`) but has no configuration file and no test files

**Assertion Library:**
- None configured

**Run Commands:**
```bash
# No test scripts exist in package.json
# Available scripts: dev, build, start, lint, seed
```

**Linting (the only quality check):**
```bash
npm run lint   # Runs: eslint
```

## Test File Organization

**Location:**
- No test files exist anywhere in `src/`
- No `__tests__/` directories
- No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files in project source

**Naming:**
- No convention established (no tests to derive convention from)

## Test Coverage

**Requirements:** None enforced

**Current Coverage:** 0% -- no tests exist

**Coverage Tools:** None configured

## Test Types

**Unit Tests:**
- Not present. No unit tests for:
  - Utility functions (`src/lib/utils.ts`, `src/lib/skip-months.ts`, `src/lib/investment-utils.ts`)
  - Validation schemas (`src/validations/*.ts`)
  - Store API slices (`src/store/*.ts`)

**Integration Tests:**
- Not present. No integration tests for:
  - API route handlers (`src/app/api/**/*.ts`)
  - Database operations (Mongoose models)
  - Authentication flows

**E2E Tests:**
- Not present despite `playwright` being in devDependencies
- No `playwright.config.ts` file
- No test files matching Playwright conventions

**Component Tests:**
- Not present. No component tests for any React components in `src/components/`

## What IS Tested vs What is NOT Tested

**What IS tested:**
- ESLint catches syntax errors and Next.js-specific issues (via `npm run lint`)
- TypeScript compiler catches type errors at build time (`strict: true`)
- Zod schemas validate request bodies at runtime in API routes

**What is NOT tested (complete list of untested areas):**

**Critical Business Logic (HIGH priority for testing):**
- `src/lib/investment-utils.ts` -- compound interest calculations (`calculateMaturityAmount`, `calculateValueAtDay`, `calculateMaturityDate`)
- `src/lib/skip-months.ts` -- month counting logic (`countExpectedMonths`, `isMonthSkipped`)
- `src/validations/payment.ts` -- payment validation schemas
- `src/validations/user.ts` -- user validation schemas (create, update, profile, password)
- `src/validations/notice.ts` -- notice validation schemas
- `src/validations/auth.ts` -- login validation schema
- Receipt number generation logic in `src/app/api/payments/route.ts` (sequential `FP-{year}-{nnnn}`)
- Payment duplicate detection in `src/app/api/payments/route.ts`

**API Routes (MEDIUM-HIGH priority):**
- All 36 route handlers in `src/app/api/` are untested:
  - `src/app/api/users/route.ts` (GET, POST)
  - `src/app/api/users/[id]/route.ts` (GET, PUT)
  - `src/app/api/users/[id]/toggle-status/route.ts` (PATCH)
  - `src/app/api/payments/route.ts` (GET, POST)
  - `src/app/api/payments/[id]/route.ts` (GET, PUT, DELETE)
  - `src/app/api/payments/[id]/archive/route.ts` (PUT)
  - `src/app/api/payments/[id]/unarchive/route.ts` (PUT)
  - `src/app/api/payments/[id]/receipt/route.ts` (GET -- PDF generation)
  - `src/app/api/payments/[id]/history/route.ts` (GET)
  - `src/app/api/payments/my/route.ts` (GET)
  - `src/app/api/notices/route.ts` (GET, POST)
  - `src/app/api/notices/[id]/route.ts` (PUT, DELETE)
  - `src/app/api/investments/route.ts` (GET, POST)
  - `src/app/api/investments/[id]/route.ts` (PUT, DELETE)
  - `src/app/api/investments/analytics/route.ts` (GET)
  - `src/app/api/dashboard/admin/route.ts` (GET)
  - `src/app/api/dashboard/member/route.ts` (GET)
  - `src/app/api/analytics/summary/route.ts` (GET)
  - `src/app/api/analytics/collection-rate/route.ts` (GET)
  - `src/app/api/analytics/payment-grid/route.ts` (GET)
  - `src/app/api/analytics/member-scores/route.ts` (GET)
  - `src/app/api/analytics/monthly-report/route.ts` (GET)
  - `src/app/api/analytics/export/route.ts` (GET)
  - `src/app/api/settings/route.ts` (GET, PUT)
  - `src/app/api/notifications/route.ts` (GET)
  - `src/app/api/notifications/unread-count/route.ts` (GET)
  - `src/app/api/notifications/mark-read/route.ts` (PUT)
  - `src/app/api/audit-logs/route.ts` (GET)
  - `src/app/api/emails/logs/route.ts` (GET)
  - `src/app/api/emails/reminders/route.ts` (POST)
  - `src/app/api/emails/send-reminder/route.ts` (POST)
  - `src/app/api/profile/route.ts` (GET, PUT)
  - `src/app/api/profile/password/route.ts` (PUT)
  - `src/app/api/profile/picture/route.ts` (POST)
  - `src/app/api/auth/[...nextauth]/route.ts`
  - `src/app/api/auth/audit/route.ts` (POST)

**Authentication & Authorization (HIGH priority):**
- `src/lib/auth.ts` -- credential verification, password comparison, disabled account check
- `src/lib/auth.config.ts` -- JWT callback, session callback, route authorization
- `src/middleware.ts` -- route matching and protection
- Admin-only access control (repeated in every admin API route)

**Mongoose Models (MEDIUM priority):**
- `src/models/User.ts` -- unique constraints, schema validation
- `src/models/Payment.ts` -- compound indexes, unique receipt numbers
- `src/models/Investment.ts` -- status enum, date handling
- `src/models/Notice.ts`, `src/models/Notification.ts`, `src/models/AuditLog.ts`, `src/models/Settings.ts`, `src/models/EmailLog.ts`

**UI Components (MEDIUM priority):**
- `src/components/users/user-table.tsx` -- table rendering, toggle status confirmation
- `src/components/users/user-form-modal.tsx` -- create/edit mode switching, form validation
- `src/components/accounting/payment-form-modal.tsx` -- amount auto-fill from settings, member selection
- `src/components/accounting/payment-table.tsx` -- payment listing, actions
- `src/components/notices/notice-form-modal.tsx` -- create/edit notice
- `src/components/dashboard/admin-dashboard.tsx` -- dashboard data rendering
- `src/components/profile/profile-form.tsx` -- profile update, image upload
- `src/components/investments/*` -- all investment tab components

**External Integrations (LOW priority but risky):**
- `src/lib/email/send.ts` -- Resend email delivery, error logging
- `src/lib/email/resend.ts` -- Resend client initialization
- Email templates (`src/lib/email/templates/*`) -- render correctness
- Cloudinary integration for profile pictures (`src/app/api/profile/picture/route.ts`)

## Recommended Test Setup

**Framework Recommendation:**
Given the codebase uses Next.js 16 + React 19 + TypeScript:
- **Unit/Integration:** Vitest (fast, TypeScript-native, compatible with React 19)
- **Component:** React Testing Library + Vitest
- **E2E:** Playwright (already in devDependencies)

**Highest Priority Tests to Add:**

1. **Pure utility functions** (easiest, highest value):
   - `src/lib/investment-utils.ts` -- financial calculations must be verified
   - `src/lib/skip-months.ts` -- date logic is error-prone

2. **Validation schemas** (easy, prevents invalid data):
   - All schemas in `src/validations/*.ts`

3. **API route authorization** (critical for security):
   - Verify unauthenticated requests get 401
   - Verify non-admin requests to admin routes get 401

4. **E2E login flow** (already have Playwright installed):
   - Login with valid credentials
   - Login with invalid credentials
   - Disabled account handling

## Mocking

**Framework:** None in use

**What Would Need Mocking:**
- MongoDB/Mongoose for API route tests (use `mongodb-memory-server` or mock `dbConnect`)
- NextAuth `auth()` function for authorization tests
- Resend API for email tests
- Cloudinary for image upload tests
- `fetch` for client-side RTK Query tests

## Fixtures and Factories

**Test Data:**
- No fixtures exist
- `scripts/seed.ts` provides a basic seed script that creates default Settings and an admin user
- Seed data could serve as a starting point for test fixtures

**Location:**
- No fixture directory exists. Recommended: `src/__tests__/fixtures/` or `tests/fixtures/`

---

*Testing analysis: 2026-04-09*
