# Editable Month/Year in Accounting Records

## Problem

Admin cannot edit the month or year of an accounting (payment) record after creation. These fields are disabled in the edit form and excluded from the update validation schema and API types.

## Solution

Enable month and year editing across the stack: form, validation, API type, API route, and audit log display.

## Changes

### 1. Validation Schema (`src/validations/payment.ts`)

Add `month` (number, 1-12) and `year` (number, 2020-2100) as optional fields in `updatePaymentSchema`.

### 2. API Type (`src/store/payments-api.ts`)

Add `month?: number` and `year?: number` to the `UpdatePaymentBody` interface.

### 3. API Route (`src/app/api/payments/[id]/route.ts`)

- Month/year changes are applied via the existing update flow (already iterates over all validated fields).
- Handle MongoDB duplicate key error (code 11000) on the `(userId, month, year)` unique index. Return a 409 response: "A payment already exists for this member in [Month] [Year]".
- The audit log already records field-level diffs for all fields in the update payload — no additional audit logic needed.

### 4. Edit Form (`src/components/accounting/payment-form-modal.tsx`)

- Month: Replace the disabled `Input` with the same `Select` dropdown used in create mode. Wire `onChange` to `setMonth`.
- Year: Remove the `disabled={isEdit}` prop so the year input is editable in edit mode.
- Include month and year in the `onSubmit` payload when in edit mode.

### 5. Audit Log Display (`src/components/accounting/payment-detail-modal.tsx`)

- When rendering changes for the `month` field, convert numeric values to human-readable month names (e.g., `1` → `"January"`) using the existing `MONTH_OPTIONS` constant.
- Year displays as-is (already a readable number).

## Constraints

- The unique index `(userId, month, year)` prevents duplicate payments for the same member/month/year. The API must catch this and return a user-friendly error.
- Receipt numbers are not affected by month/year changes (they are generated at creation time and remain stable).
