# Bulk Edit for Accounting Records

## Problem

Admins cannot edit multiple accounting records at once. When a batch of records need the same change (e.g. correcting the month or adjusting the amount), the admin must edit each record individually.

## Solution

Add checkbox selection to the payment table with a bulk edit modal that lets admins apply changes to multiple records at once.

## UX Flow

1. Each row in the payment table gets a checkbox column (Ant Design `rowSelection`).
2. When 1+ records are selected, a floating action bar appears at the bottom: "{N} selected — [Bulk Edit]".
3. Clicking "Bulk Edit" opens `BulkEditModal` with three fields: month, year, amount. Each field has an "apply" toggle — only toggled-on fields are included in the update.
4. On submit, each selected record is updated individually via the existing `PUT /api/payments/[id]` endpoint. This creates individual audit log entries per record (consistent with single edit behavior).
5. Results are reported: successes proceed, failures (e.g. duplicate month/year conflict) are listed with reasons.

## Components

### Payment Table (`src/components/accounting/payment-table.tsx`)

- Add `rowSelection` prop to Ant Design Table.
- Accept `selectedRowKeys` and `onSelectionChange` props from parent page.
- Selection state is managed by the parent accounting page, not the table.

### Accounting Page (`src/app/(admin)/admin/accounting/page.tsx`)

- Track `selectedRowKeys: string[]` state.
- Clear selection when filters, search, or pagination change.
- Render floating action bar when selection is non-empty: fixed to bottom center, shows count and "Bulk Edit" button.
- Manage `bulkEditOpen` modal state.

### BulkEditModal (`src/components/accounting/bulk-edit-modal.tsx`) — NEW

- Props: `open`, `onOpenChange`, `selectedPayments: IPayment[]`.
- Three field groups, each with a checkbox toggle and the field input:
  - Month (Select dropdown, same options as PaymentFormModal)
  - Year (number input, 2020-2100)
  - Amount (number input, positive)
- Only toggled-on fields are sent in the update payload.
- Confirmation text: "Apply changes to {N} records".
- On submit:
  - Call `updatePayment` mutation for each selected record sequentially.
  - Collect successes and failures.
  - Show summary toast: "Updated X of Y records" (and failure details if any).
  - Close modal and clear selection on completion.
- Submit button is disabled if no fields are toggled on.

### API

No new endpoints. Reuses existing `PUT /api/payments/[id]` which already:
- Validates via `updatePaymentSchema` (now includes month/year).
- Handles duplicate key errors (409).
- Creates individual audit log entries with field-level diffs.

## Error Handling

- Duplicate key conflict (409): reported per-record in the summary. Other records still succeed.
- Network/server errors: reported per-record. The bulk operation does not stop on first failure.
- Summary toast after completion: "Updated 4 of 5 records. 1 failed: [error detail]".

## Constraints

- Mobile: The floating action bar and checkbox selection should work on mobile card view too. Checkboxes render at the top of each card.
- Selection is cleared on filter/search/page change to avoid stale selections across different result sets.
