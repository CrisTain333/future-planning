# Archive for Accounting Records

## Problem

Admins have no way to remove outdated or incorrect payment records from the active view. Delete is too destructive for financial records. Archive preserves the record and audit trail while keeping the active view clean.

## Solution

Add archive/unarchive functionality with a tabbed view to separate active and archived records. Archived records are excluded from all calculations.

## Data Model

Add `"archived"` as a new status value to the Payment model (alongside `"approved"` and `"deleted"`). Add two new fields:

- `archivedBy: ObjectId` (ref: User) — admin who archived the record
- `archivedAt: Date` — timestamp of archive action

## Excluded from Calculations

Archived records are excluded from all totals, dashboard aggregations, and reports. The `GET /api/payments` endpoint defaults to `status=approved`, so archived records are only returned when explicitly requested with `status=archived`.

## API Endpoints

### `PUT /api/payments/[id]/archive`

- Sets `status: "archived"`, `archivedBy`, `archivedAt`.
- Creates audit log entry with action `payment_archived`.
- Returns the updated payment.

### `PUT /api/payments/[id]/unarchive`

- Sets `status: "approved"`, unsets `archivedBy` and `archivedAt`.
- Creates audit log entry with action `payment_unarchived`.
- Returns the updated payment.

### `GET /api/payments` (modified)

- Add `status` query param. Defaults to `"approved"` if not provided.
- When `status=archived`, returns only archived records.

## UX

### View Toggle

Two tabs above the table: "Active" (default) and "Archived". Switching tabs changes the `status` query param. Selection is cleared on tab switch.

### Active Tab

- Per-row actions: View, Edit, Archive (archive icon with confirmation popover: "Archive this payment?").
- Bulk actions (floating bar): "Bulk Edit" and "Bulk Archive" buttons.
- Bulk archive shows confirmation: "Archive N records?"

### Archived Tab

- Per-row actions: View, Unarchive (restore icon).
- No edit action on archived records.
- Bulk actions: "Bulk Unarchive" button.
- Table rows or cards may use a muted/subtle style to distinguish from active.

## Audit Log

- `payment_archived`: action description "Archived payment for {memberName}", logs member name and receipt number.
- `payment_unarchived`: action description "Unarchived payment for {memberName}", logs member name and receipt number.
- Individual entries per record for bulk operations (consistent with bulk edit pattern).

## Constraints

- Archived records keep their receipt numbers and full audit history.
- The unique index `(userId, month, year)` still applies — archiving does not free up the month/year slot. If this is needed in the future, it would require a separate design decision.
- Dashboard totals, member summaries, and any aggregate calculations must filter by `status: "approved"` only.
