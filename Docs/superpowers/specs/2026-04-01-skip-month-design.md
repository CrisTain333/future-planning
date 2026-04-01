# Skip Month Feature — Design Spec

**Date:** 2026-04-01
**Feature:** Foundation-wide month skipping for collection calendar

## Data Model

Add `skippedMonths` array to Settings document:
```
skippedMonths: [{ month: 6, year: 2026, reason: "Ramadan" }]
```

## Settings Page UI

New "Collection Calendar" section below existing settings form. Shows months from start date to 12 months ahead as toggleable chips. Click to skip (turns gray with reason input), click again to unskip. Audit logged.

## Affected Systems

1. **Payment Grid heatmap** — Skipped months show gray, not red
2. **Outstanding calculation** — Skipped months excluded from expected
3. **Member dashboard stats** — Months due excludes skipped
4. **Collection Rate chart** — Skipped months excluded from denominator
5. **Monthly Report** — Shows "Collection skipped"
6. **Payment modal** — Shows "skipped" label but still allows voluntary payment
7. **Member scores** — Expected months adjusted
8. **Fund projection** — Projected line excludes skipped months

## API Changes

- Settings model: add `skippedMonths` field
- `PUT /api/settings`: accepts `skippedMonths`
- All analytics/dashboard APIs: read and apply `skippedMonths`

## Audit

- `settings_updated` action logs skip/unskip with month and reason
