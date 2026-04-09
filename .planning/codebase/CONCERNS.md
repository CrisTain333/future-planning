# Codebase Concerns

**Analysis Date:** 2026-04-09

## Security Considerations

### Plaintext Password Sent via Email [Critical]

- Risk: When an admin resets a user's password, the new plaintext password is emailed to the user via the `PasswordChangedEmail` template. This means the plaintext password is transmitted over email, stored in the email provider's logs, and visible in the `EmailLog` collection metadata.
- Files: `src/app/api/users/[id]/route.ts` (lines 126-130), `src/lib/email/templates/password-changed.tsx` (line 28)
- Current mitigation: The email advises users to change their password after login.
- Recommendations: Send a password reset link instead of the plaintext password. If the plaintext approach must remain, do not log the password in audit/email logs.

### No Rate Limiting on Any Endpoint [High]

- Risk: All API endpoints, including login (`/api/auth/[...nextauth]`), password change (`/api/profile/password`), and the auth audit endpoint (`/api/auth/audit`) lack rate limiting. An attacker can brute-force credentials, spam email-sending endpoints, or exhaust server resources.
- Files: All files under `src/app/api/`
- Current mitigation: None detected.
- Recommendations: Add rate limiting middleware (e.g., `upstash/ratelimit` for serverless). Prioritize login, password change, email send, and cron endpoints.

### MongoDB Regex Injection via Unsanitized Search Input [High]

- Risk: User-supplied `search` parameters are passed directly into `$regex` MongoDB queries without sanitization. A crafted search string like `.*` or `a{10000}` could cause ReDoS (Regular Expression Denial of Service) or unintended data exposure.
- Files: `src/app/api/users/route.ts` (lines 34-36), `src/app/api/payments/route.ts` (lines 39, 54-55)
- Current mitigation: None.
- Recommendations: Escape regex special characters from user input before use in `$regex`, or use MongoDB text indexes with `$text` search instead.

### Auth Audit Endpoint Has No Authentication [High]

- Risk: The `/api/auth/audit` POST endpoint accepts arbitrary login audit events without any authentication. Anyone can submit fake audit entries claiming failed or successful logins for any username.
- Files: `src/app/api/auth/audit/route.ts` (line 32 -- no `auth()` check before processing login_success type)
- Current mitigation: The endpoint catches errors silently to avoid breaking login flow.
- Recommendations: For `login_success` events, verify the session exists. For `login_failed` events, consider moving audit creation server-side into the `authorize` callback or middleware rather than relying on a client-side POST.

### Unvalidated Settings Update Body [Medium]

- Risk: The PUT `/api/settings` endpoint passes the raw request body directly to `$set` without Zod validation. An attacker with admin access could inject arbitrary fields into the settings document.
- Files: `src/app/api/settings/route.ts` (lines 36-39 -- `{ $set: body }` with `runValidators: false`)
- Current mitigation: Only admins can access this endpoint.
- Recommendations: Create a Zod schema for settings updates and validate the body before applying.

### Unvalidated Investment Create/Update Body [Medium]

- Risk: The investment POST and PUT endpoints destructure fields from the raw body without Zod schema validation. The PUT endpoint spreads `...body` directly into `findByIdAndUpdate`, allowing arbitrary fields.
- Files: `src/app/api/investments/route.ts` (lines 63-73), `src/app/api/investments/[id]/route.ts` (lines 55-63)
- Current mitigation: Admin-only access.
- Recommendations: Create Zod validation schemas for investment creation and updates, consistent with how payments and users are validated.

### Weak Password Policy [Medium]

- Risk: Minimum password length is only 4 characters across all validation schemas. The seed script creates the admin account with password `1234`.
- Files: `src/validations/auth.ts` (line 4), `src/validations/user.ts` (lines 8, 37-38), `scripts/seed.ts` (line 43)
- Current mitigation: None.
- Recommendations: Increase minimum password length to at least 8 characters. Add complexity requirements. Force admin password change on first login.

### Missing CSRF Protection [Low]

- Risk: API routes rely solely on JWT session tokens in cookies. There is no explicit CSRF token mechanism, though Next.js API routes with `SameSite` cookies and `POST` methods provide some implicit protection.
- Files: All `src/app/api/` route handlers.
- Current mitigation: Next.js default cookie behavior.
- Recommendations: Consider adding CSRF tokens for state-changing operations, especially for the settings and user management endpoints.

## Tech Debt

### Duplicated Month Name Arrays [High]

- Issue: Month name arrays (`MONTHS`, `MONTH_NAMES`, `MONTH_NAMES_SHORT`, `MONTH_NAMES_FULL`) are defined independently in at least 20+ locations across the codebase with varying formats (short vs full names).
- Files: `src/app/api/payments/route.ts` (lines 138, 148), `src/app/api/payments/[id]/route.ts` (lines 33, 116), `src/app/api/payments/[id]/receipt/route.ts` (line 10), `src/app/api/dashboard/member/route.ts` (line 8), `src/app/api/analytics/summary/route.ts` (line 68), `src/app/api/analytics/collection-rate/route.ts` (line 24), `src/app/api/analytics/payment-grid/route.ts` (line 32), `src/app/api/analytics/export/route.ts` (line 7), `src/app/api/analytics/monthly-report/route.ts` (line 59), `src/app/api/investments/analytics/route.ts` (line 191), `src/app/api/emails/reminders/route.ts` (line 10), `src/app/api/emails/send-reminder/route.ts` (line 9), `src/components/dashboard/member-dashboard.tsx` (line 36), `src/components/dashboard/recent-payments.tsx` (line 4), `src/components/dashboard/fund-line-chart.tsx` (line 14), `src/components/accounting/payment-table.tsx` (line 10), `src/components/accounting/payment-detail-modal.tsx` (line 8), `src/app/(admin)/admin/collection-calendar/page.tsx` (lines 11-12), `src/app/(admin)/admin/settings/page.tsx` (lines 11, 29), `src/app/(admin)/admin/reports/page.tsx` (line 11)
- Impact: Any change to month formatting requires edits in 20+ files. Easy to introduce inconsistencies.
- Fix approach: Create a single `src/lib/constants.ts` file exporting `MONTH_NAMES_FULL` and `MONTH_NAMES_SHORT`, then import everywhere.

### Repeated Session Type Casting Pattern [Medium]

- Issue: Every API route handler repeats the same `session?.user as unknown as { userId: string; role: string } | undefined` type assertion. This fragile pattern appears in every single route file.
- Files: Every file in `src/app/api/` (approximately 30 occurrences)
- Impact: If the session shape changes, every file needs updating. The `as unknown as` double cast bypasses TypeScript safety.
- Fix approach: Extend the NextAuth `Session` type in `src/types/next-auth.d.ts` so that `session.user` includes `userId` and `role` natively, eliminating the need for unsafe casts.

### Hardcoded Year Filter Options [Medium]

- Issue: Year filter dropdowns are hardcoded with options 2026, 2027, 2028 instead of being dynamically generated.
- Files: `src/app/(admin)/admin/accounting/page.tsx` (lines 217-219), `src/app/(admin)/admin/reports/page.tsx` (lines 79-81)
- Impact: These will become stale as years pass. Users cannot filter to years outside this range.
- Fix approach: Generate year options dynamically based on the settings `startYear` through the current year plus 1-2 years.

### Hardcoded Year Minimum in Payment Validation [Medium]

- Issue: Payment validation schema enforces `.min(2026)` for year, which is hardcoded to the foundation's start year rather than derived from settings.
- Files: `src/validations/payment.ts` (line 6)
- Impact: If the foundation start year changes in settings, the validation will not reflect it.
- Fix approach: The minimum year should either be removed or made configurable.

### Inconsistent Model Registration Strategy [Low]

- Issue: Some models use `delete mongoose.models.X` to force re-registration on every import (`AuditLog`, `Settings`), while others use the standard `mongoose.models.X || mongoose.model(...)` pattern (`User`, `Payment`, `Notice`, `Notification`, `EmailLog`, `Investment`). This was likely a hot-reload workaround during development.
- Files: `src/models/AuditLog.ts` (lines 69-72), `src/models/Settings.ts` (lines 31-34)
- Impact: In production, `delete mongoose.models.X` is wasteful and could cause issues under concurrent requests. In development, the inconsistency is confusing.
- Fix approach: Standardize on the `mongoose.models.X || mongoose.model(...)` pattern for all models. If schema changes need hot-reload support in dev, handle it uniformly.

### process.emitWarning Monkey-Patch [Low]

- Issue: Five model files contain a `process.emitWarning = () => {}` override that suppresses all Node.js warnings. This is a global mutation that affects the entire runtime.
- Files: `src/models/Payment.ts` (lines 3-5), `src/models/Notice.ts` (lines 3-5), `src/models/Notification.ts` (lines 3-5), `src/models/Investment.ts` (lines 3-5), `src/models/AuditLog.ts` (lines 3-5)
- Impact: Suppresses legitimate warnings from all Node.js modules and packages. Hides potential issues.
- Fix approach: Identify the specific warning being suppressed and address it properly. Remove the monkey-patch.

### Duplicated Admin/Dashboard Layouts [Low]

- Issue: The admin layout and dashboard layout files are identical, both importing the same Sidebar, Header, and Footer components with the same JSX structure.
- Files: `src/app/(admin)/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- Impact: Changes to the shared layout need to be applied in both files.
- Fix approach: Create a shared `AppLayout` component and use it in both route group layouts.

## Performance Bottlenecks

### In-Memory Pagination for Payments Search [High]

- Problem: When searching payments, all matching records are fetched from MongoDB into memory, then paginated with `Array.slice()`. This fetches the entire result set on every request.
- Files: `src/app/api/payments/route.ts` (lines 43-71)
- Cause: The two-phase search strategy (first by receipt number, then by member name) requires fetching all results to determine total count, then slicing for the requested page.
- Improvement path: Use MongoDB `$facet` aggregation to combine both search strategies with database-level pagination and counting. Alternatively, refactor to use `$or` with a text index.

### Hardcoded `limit: 100` for User Dropdowns [Medium]

- Problem: Multiple components fetch all users with `{ page: 1, limit: 100 }` for dropdown population. If the member count exceeds 100, the dropdowns will be incomplete.
- Files: `src/components/investments/investment-form-modal.tsx` (line 27), `src/components/accounting/payment-form-modal.tsx` (line 42), `src/app/(admin)/admin/accounting/page.tsx` (line 53), `src/app/(admin)/admin/audit-logs/page.tsx` (line 141)
- Cause: Dropdowns need the full user list but the API only supports paginated access.
- Improvement path: Create a dedicated lightweight endpoint like `/api/users/list` that returns only `{_id, fullName}` for all active users without pagination, or implement a searchable async Select component.

### No Lazy Loading or Code Splitting [Medium]

- Problem: All 49 client components are loaded eagerly. There is no use of `React.lazy()`, `next/dynamic`, or `Suspense` boundaries anywhere in the codebase. Heavy components like Recharts and antd are bundled together.
- Files: All `"use client"` components (49 files)
- Cause: Not implemented.
- Improvement path: Use `next/dynamic` with `ssr: false` for chart components and modals. Add `Suspense` boundaries around data-fetching sections.

### Sequential Email Sending for Notices [Medium]

- Problem: When a notice is created, emails are sent sequentially in a `for` loop to all active members. With many members, this blocks the response.
- Files: `src/app/api/notices/route.ts` (lines 81-95)
- Cause: The emails are fire-and-forget (`.catch(() => {})`), but the loop itself runs serially within the request context.
- Improvement path: Use `Promise.allSettled()` for parallel sending, or queue emails for async processing.

### Investment Analytics CPU-Heavy Computation [Low]

- Problem: The investment analytics endpoint computes compound interest calculations in nested loops (30 days x N investments for daily growth, plus month-by-month growth charts). This is computed on every request with no caching.
- Files: `src/app/api/investments/analytics/route.ts` (lines 128-231)
- Cause: Financial calculations are done server-side on every request.
- Improvement path: Cache the result with a short TTL (e.g., 5 minutes) since investment data changes infrequently.

## Missing Best Practices

### Zero Test Coverage [Critical]

- Issue: The project has no test files whatsoever. No unit tests, no integration tests, no E2E tests. Playwright is listed as a dev dependency but has no test files or configuration.
- Files: No test files exist anywhere under `src/`
- Impact: Any code change risks introducing regressions with no automated way to catch them. All API routes, business logic, and components are untested.
- Priority: High -- start with API route integration tests and critical business logic (payment creation, receipt generation, investment calculations).

### No Error Boundaries [High]

- Issue: There are no React error boundaries (`error.tsx` files) anywhere in the app. No `loading.tsx` files for Suspense-based loading states either.
- Files: Missing `src/app/error.tsx`, `src/app/(admin)/error.tsx`, `src/app/(dashboard)/error.tsx`, `src/app/(admin)/admin/*/error.tsx`
- Impact: Any uncaught runtime error in a client component will crash the entire page with no recovery UI.
- Priority: High -- add `error.tsx` at the root layout level at minimum, and `loading.tsx` for route segments with data fetching.

### No Input Sanitization [Medium]

- Issue: No sanitization or escaping is applied to user inputs before storage or display. While React escapes JSX by default, the notice body is rendered with `whitespace-pre-line` and could contain misleading content. MongoDB string fields accept any input.
- Files: `src/components/dashboard/member-dashboard.tsx` (line 143), all API routes that accept text input
- Current mitigation: React's built-in JSX escaping, no `dangerouslySetInnerHTML` usage detected.
- Recommendations: Add input length limits and basic content validation for text fields like notice body, payment notes, and user addresses.

### No Logging Framework [Medium]

- Issue: All logging uses `console.error()` with no structured logging, log levels, or log aggregation.
- Files: `src/lib/email/send.ts`, `src/lib/audit.ts`, all API routes
- Impact: In production (Vercel), `console.error` output goes to Vercel's ephemeral log stream. No persistent logging, no log search, no alerting.
- Recommendations: Integrate a logging service (e.g., Axiom, Logtail, or Vercel's log drain) for production observability.

### Type Definitions Out of Sync [Medium]

- Issue: The `IAuditLog` interface in `src/types/index.ts` lists fewer action types than the `AuditLog` Mongoose model and the `AuditAction` type in `src/lib/audit.ts`. The `IPayment` interface is missing the `"archived"` status that exists in the Mongoose schema.
- Files: `src/types/index.ts` (lines 59-70 -- missing `payment_archived`, `payment_unarchived`, `user_password_reset`, `profile_updated`, `profile_picture_updated`, `password_changed`, `user_login`, `user_login_failed`), `src/types/index.ts` (line 30 -- `IPayment.status` missing `"archived"`)
- Impact: TypeScript will not catch uses of the missing statuses on the frontend.
- Fix approach: Synchronize the frontend types with the Mongoose model enums.

## Accessibility Gaps

### Minimal ARIA Attributes [Medium]

- Issue: Only 3 files across all components contain any `aria-*` or `role` attributes. Custom interactive elements (tab switches in accounting page, expandable notice cards in member dashboard) lack proper ARIA roles and states.
- Files: `src/app/(admin)/admin/accounting/page.tsx` (lines 233-245 -- custom tab buttons without `role="tab"` or `aria-selected`), `src/components/dashboard/member-dashboard.tsx` (lines 120-148 -- expandable sections without `aria-expanded`)
- Impact: Screen readers cannot properly navigate or understand the application's interactive elements.
- Recommendations: Add `role="tablist"`, `role="tab"`, `aria-selected` to custom tabs. Add `aria-expanded` to expandable sections. Ensure all interactive icons have accessible labels.

### No Skip-to-Content Link [Low]

- Issue: The layout has no skip navigation link for keyboard users. The sidebar contains many links that keyboard users must tab through to reach main content.
- Files: `src/app/(admin)/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- Impact: Keyboard-only users must tab through the entire sidebar on every page.
- Recommendations: Add a visually hidden skip link as the first focusable element.

## Fragile Areas

### Receipt Number Generation [High]

- Files: `src/app/api/payments/route.ts` (lines 115-124)
- Why fragile: Receipt numbers are generated by finding the last payment for a year and incrementing. Under concurrent requests, two payments could get the same receipt number before either is saved. The unique index on `receiptNo` in the Payment model would cause one to fail.
- Safe modification: Use MongoDB's `$inc` on a counter collection, or use a retry loop on duplicate key errors.
- Test coverage: None.

### Fund Calculation Logic Spread Across Multiple Endpoints [Medium]

- Files: `src/app/api/dashboard/admin/route.ts`, `src/app/api/dashboard/member/route.ts`, `src/app/api/analytics/summary/route.ts`
- Why fragile: Total fund, outstanding amounts, and expected payments are calculated independently in 3 different endpoints with slightly different logic. The admin dashboard aggregates `amount` only, while analytics summary aggregates `amount + penalty`.
- Safe modification: Extract fund calculation into a shared utility function.
- Test coverage: None.

### Settings Singleton Assumption [Low]

- Files: `src/models/Settings.ts`, `src/app/api/settings/route.ts`
- Why fragile: The settings model assumes a single document exists. `findOne({})` returns the first document found. If somehow multiple settings documents are created, behavior becomes unpredictable.
- Safe modification: Add a unique identifier field or enforce single-document constraint at the application level.

## Dependencies at Risk

### next-auth@5.0.0-beta.30 [High]

- Risk: Using a beta version of next-auth v5 in production. Beta APIs may change or have undiscovered bugs.
- Impact: Authentication is a critical path; any breaking change or bug directly affects all users.
- Migration plan: Monitor the next-auth v5 stable release and upgrade when available. Pin the exact version in the meantime.

### antd@6.3.5 with Tailwind CSS [Medium]

- Risk: Ant Design and Tailwind CSS can have style conflicts. Ant Design v6 is relatively new and the dual UI library approach (antd + shadcn/ui components) increases bundle size and introduces inconsistent styling patterns.
- Impact: Increased bundle size from loading two full component libraries. Potential visual inconsistencies.
- Migration plan: Consider consolidating on one UI library. If antd is preferred, migrate remaining shadcn components to antd. If Tailwind is preferred, replace antd with headless UI components.

## Test Coverage Gaps

### All Business Logic is Untested [Critical]

- What's not tested: Payment creation with receipt number generation, investment maturity calculations, expected months computation, email sending logic, audit logging, dashboard aggregations, notification creation.
- Files: `src/app/api/payments/route.ts`, `src/lib/investment-utils.ts`, `src/lib/skip-months.ts`, `src/lib/email/send.ts`, `src/lib/audit.ts`, `src/lib/notifications.ts`
- Risk: Financial calculations (investment maturity amounts, outstanding balances, expected contributions) could silently produce incorrect results. Receipt generation, the most user-facing artifact, has no tests.
- Priority: Critical -- `src/lib/investment-utils.ts` and `src/lib/skip-months.ts` are pure functions ideal for unit testing. API routes need integration tests.

---

*Concerns audit: 2026-04-09*
