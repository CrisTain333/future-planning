# Investment Tracker — Fixed Deposit Module

## Overview

A new admin-only investment tracking module at `/admin/investments` for managing fixed deposits (FDs) and visualizing fund growth. The foundation pools member contributions and deposits them in bank FDs. This module tracks those deposits, calculates daily accrued interest using quarterly compounding, and provides rich analytics.

Designed to extend to other investment types (DPS, business, stocks, property) in the future, but this spec covers FD only.

## Page Structure

Single page at `/admin/investments` with 3 tabs:

1. **Overview** — Summary cards, combined growth chart, daily earnings
2. **Fixed Deposits** — CRUD table for managing FDs
3. **Analytics** — Per-FD comparison charts, interest breakdown, maturity timeline, daily growth log

## Data Model

### Investment (Mongoose Model)

| Field | Type | Description |
|-------|------|-------------|
| `bankName` | `String` | Required. Name of the bank |
| `principalAmount` | `Number` | Required. Deposited amount in TAKA |
| `interestRate` | `Number` | Required. Annual interest rate (e.g., 9.5 for 9.5%) |
| `compoundingFrequency` | `String` | Enum: `"quarterly"` (default), `"monthly"`, `"yearly"` |
| `startDate` | `Date` | Required. FD start date |
| `tenureMonths` | `Number` | Required. Duration in months |
| `maturityDate` | `Date` | Auto-calculated: startDate + tenureMonths |
| `maturityAmount` | `Number` | Auto-calculated using compound interest formula |
| `status` | `String` | Enum: `"active"` (default), `"matured"`, `"withdrawn"` |
| `memberContributions` | `[ObjectId]` | Array of User refs — which members funded this FD |
| `notes` | `String` | Optional free-text notes |
| `createdBy` | `ObjectId` | Ref to User (admin who created it) |
| `createdAt` | `Date` | Auto (timestamps) |
| `updatedAt` | `Date` | Auto (timestamps) |

### Interest Calculation

Quarterly compound interest formula:

```
A = P × (1 + r/n)^(n × t)
```

- `P` = principal amount
- `r` = annual interest rate as decimal (e.g., 0.095)
- `n` = compounding frequency per year (4 for quarterly, 12 for monthly, 1 for yearly)
- `t` = time in years

**Daily accrued value** uses the same formula with `t = daysSinceStart / 365`.

**Daily interest earned** = value today - value yesterday (derived, not stored).

## API Endpoints

All under `/api/investments/`, admin-only.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/investments` | List all investments. Supports `?status=active` filter |
| `POST` | `/api/investments` | Create a new FD. Auto-calculates maturityDate and maturityAmount |
| `PUT` | `/api/investments/[id]` | Update an FD (edit details, change status) |
| `DELETE` | `/api/investments/[id]` | Delete an FD |
| `GET` | `/api/investments/analytics` | Returns computed analytics: summary cards, daily growth data, per-FD breakdowns |

### Analytics Endpoint Response Shape

```typescript
{
  summary: {
    totalInvested: number;
    totalInterestEarned: number;
    currentValue: number;
    projectedMaturityValue: number;
    activeFDCount: number;
    dailyEarnings: number;
    hourlyEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
  };
  perFD: Array<{
    id: string;
    bankName: string;
    principalAmount: number;
    currentValue: number;
    interestEarned: number;
    projectedInterest: number;
    progressPercent: number;
    daysRemaining: number;
    maturityDate: string;
    maturityAmount: number;
  }>;
  dailyGrowth: Array<{
    date: string;
    fundValue: number;
    dailyGain: number;
    cumulativeInterest: number;
    growthPercent: number;
  }>;
  growthChart: Array<{
    date: string;
    totalValue: number;
    perFD: Record<string, number>;
  }>;
}
```

## UI Design

### Tab 1: Overview

**Summary Cards (4 cards in a grid):**
- Total Invested — sum of all active FD principals, with count of active FDs
- Interest Earned — total accrued interest as of today
- Current Value — total invested + interest earned, with growth percentage
- Projected at Maturity — combined maturity amounts across all FDs

**Combined Growth Chart:**
- Recharts `LineChart` showing total fund value over time
- `ResponsiveContainer` with gradient fill under the line
- Time range filter buttons: All Time, 1Y, 6M, 1M
- `Tooltip` on hover showing date and amount

**Daily Earnings Card:**
- Large daily earnings number
- Breakdown: per hour, per month, per year
- Calculated from combined daily interest across all active FDs

**Active FDs Mini-List:**
- Compact cards showing each active FD: bank name, principal, rate, tenure, current value, days remaining

### Tab 2: Fixed Deposits

**FD Table:**
- Ant Design `Table` component
- Columns: Bank, Principal, Rate, Start Date, Maturity, Current Value, Status
- Status filter pills: All, Active, Matured, Withdrawn
- Bank name sub-text shows tenure and member count
- Action menu (three dots): Edit, Delete, Mark as Matured/Withdrawn

**Create/Edit FD Modal:**
- Fields: Bank Name, Principal Amount, Interest Rate, Start Date, Tenure (months), Compounding Frequency (dropdown), Contributing Members (multi-select from users), Notes
- Live **Calculated Preview** panel showing: Maturity Date, Maturity Amount, Total Interest
- Preview updates in real-time as form values change
- React Hook Form + Zod validation

### Tab 3: Analytics

**Per-FD Growth Comparison Chart:**
- Recharts multi-line `LineChart` — one line per FD with different colors
- Tooltip on hover showing date and value for each FD
- Legend showing FD names with color indicators

**Interest Breakdown by FD:**
- Per-FD progress bars showing interest earned vs projected total
- Percentage complete, amount earned, days remaining

**Maturity Timeline:**
- Visual vertical timeline ordered by maturity date
- Each entry: date, bank name, principal → maturity amount, time remaining
- Final entry: total returns summary

**Daily Growth Log:**
- Table: Date, Fund Value, Daily Gain, Cumulative Interest, Growth %
- Filterable by specific FD or all combined
- Paginated, sorted by most recent first

## Redux Store

New file: `src/store/investments-api.ts`

- Tag type: `"Investments"`
- Endpoints: `getInvestments`, `createInvestment`, `updateInvestment`, `deleteInvestment`, `getInvestmentAnalytics`
- Cache invalidation on create/update/delete

## Sidebar Navigation

Add "Investments" link to admin sidebar, grouped near the existing analytics/reports links. Use a `TrendingUp` or `Landmark` icon from Lucide.

## Scope & Constraints

- Admin-only access (role check on API + page level)
- FD type only for now — model and UI designed to accommodate other investment types later
- No notifications on maturity (future enhancement)
- All calculations are server-side in the analytics endpoint
- Daily growth is computed on-the-fly, not stored per day
