# Phase 3: Member Experience + Notices — Implementation Plan

**Goal:** Members can log in, see their dashboard, download receipts, manage profile. Admin gets notice board.

**Tasks:** 9 tasks — backend APIs, RTK Query, frontend pages, PDF generation.

---

## Task 1: Member Dashboard + My Payments APIs
- `/api/dashboard/member` — GET member stats
- `/api/payments/my` — GET member's own payments

## Task 2: Profile APIs
- `/api/profile` — GET, PUT
- `/api/profile/password` — PUT
- `/api/profile/picture` — POST (Cloudinary)

## Task 3: Notice APIs
- `/api/notices` — GET (paginated), POST
- `/api/notices/[id]` — GET, PUT, DELETE (soft)

## Task 4: PDF Receipt API
- `/api/payments/[id]/receipt` — GET (pdfkit server-side)

## Task 5: RTK Query — Member, Profile, Notice endpoints

## Task 6: Member Dashboard Page
- Stat cards, bar chart, payment history table, notices section

## Task 7: Profile Page
- Profile form, picture upload, password change

## Task 8: Notice Board Page (admin)
- Notice table, CRUD modal, member notice view on dashboard

## Task 9: Build Verification & Fixes
