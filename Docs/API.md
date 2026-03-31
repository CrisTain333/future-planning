# Future Planning - API Routes

**Framework:** Next.js App Router (Route Handlers)
**Base Path:** `/api`
**Auth:** NextAuth.js v5 session-based

---

## Authentication

### NextAuth Configuration

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | * | NextAuth.js handler (login, logout, session) |

**Credentials Provider:**
- Login with `username` + `password`
- Session includes: `userId`, `role`, `fullName`

---

## User APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/users` | GET | Yes | Admin | List all users (supports search, pagination) |
| `/api/users` | POST | Yes | Admin | Create a new user |
| `/api/users/[id]` | GET | Yes | Admin | Get single user details |
| `/api/users/[id]` | PUT | Yes | Admin | Update user details |
| `/api/users/[id]/toggle-status` | PATCH | Yes | Admin | Enable/disable a user |

### Query Parameters (GET /api/users)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| search | string | — | Search by name or username |
| role | string | — | Filter by "admin" or "user" |
| status | string | — | Filter by "active" or "disabled" |

### Request Body (POST /api/users)

```json
{
  "fullName": "John Doe",
  "username": "john",
  "password": "1234",
  "email": "john@example.com",
  "phone": "01700000000",
  "address": "Dhaka, Bangladesh",
  "bloodGroup": "O+",
  "role": "user"
}
```

---

## Profile APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/profile` | GET | Yes | Any | Get current user's profile |
| `/api/profile` | PUT | Yes | Any | Update current user's profile |
| `/api/profile/password` | PUT | Yes | Any | Change own password |
| `/api/profile/picture` | POST | Yes | Any | Upload profile picture to Cloudinary |

### Request Body (PUT /api/profile)

```json
{
  "fullName": "Updated Name",
  "email": "new@email.com",
  "phone": "01800000000",
  "address": "Chittagong, Bangladesh",
  "bloodGroup": "A+"
}
```

### Request Body (PUT /api/profile/password)

```json
{
  "currentPassword": "1234",
  "newPassword": "5678"
}
```

---

## Payment APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/payments` | GET | Yes | Admin | List all payments (filtered, paginated) |
| `/api/payments` | POST | Yes | Admin | Record a new payment for a member |
| `/api/payments/[id]` | GET | Yes | Admin | Get single payment details |
| `/api/payments/[id]` | PUT | Yes | Admin | Edit a payment |
| `/api/payments/[id]` | DELETE | Yes | Admin | Soft-delete a payment |
| `/api/payments/my` | GET | Yes | Any | Get current user's payment history |
| `/api/payments/[id]/receipt` | GET | Yes | Any | Download PDF receipt |

### Query Parameters (GET /api/payments)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| userId | string | — | Filter by member |
| month | number | — | Filter by month (1-12) |
| year | number | — | Filter by year |

### Request Body (POST /api/payments)

```json
{
  "userId": "60f7b2c9e1d3a4001f2b3c4d",
  "month": 3,
  "year": 2026,
  "amount": 10000,
  "penalty": 0,
  "penaltyReason": "",
  "note": ""
}
```

**Validations:**
- Cannot create duplicate payment for same user + month + year
- Amount must be positive
- Month must be 1-12
- Penalty must be >= 0

---

## Notice APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/notices` | GET | Yes | Any | List all notices (paginated) |
| `/api/notices` | POST | Yes | Admin | Create a notice |
| `/api/notices/[id]` | GET | Yes | Any | Get single notice |
| `/api/notices/[id]` | PUT | Yes | Admin | Update a notice |
| `/api/notices/[id]` | DELETE | Yes | Admin | Soft-delete a notice |

### Request Body (POST /api/notices)

```json
{
  "title": "Monthly Meeting",
  "body": "Meeting scheduled for April 5, 2026 at 7 PM."
}
```

---

## Notification APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/notifications` | GET | Yes | Any | Get current user's notifications |
| `/api/notifications/mark-read` | PATCH | Yes | Any | Mark notifications as read |
| `/api/notifications/unread-count` | GET | Yes | Any | Get unread notification count |

### Query Parameters (GET /api/notifications)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

### Request Body (PATCH /api/notifications/mark-read)

```json
{
  "notificationIds": ["id1", "id2"]
}
```

---

## Dashboard APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/dashboard/member` | GET | Yes | Any | Member dashboard data (totals, chart data) |
| `/api/dashboard/admin` | GET | Yes | Admin | Admin dashboard data (fund totals, charts, recent activity) |

### Response (GET /api/dashboard/member)

```json
{
  "totalPaid": 12000,
  "monthsPaid": 2,
  "outstanding": 0,
  "status": "up_to_date",
  "chartData": [
    { "month": "Mar 2026", "amount": 10000 },
    { "month": "Apr 2026", "amount": 2000 }
  ]
}
```

### Response (GET /api/dashboard/admin)

```json
{
  "totalFund": 144000,
  "totalMembers": 12,
  "paymentsThisMonth": { "count": 10, "amount": 20000 },
  "overdueCount": 2,
  "fundGrowthChart": [
    { "month": "Mar 2026", "total": 120000 },
    { "month": "Apr 2026", "total": 144000 }
  ],
  "memberShareChart": [
    { "name": "John", "total": 12000, "percentage": 8.33 }
  ],
  "recentPayments": [],
  "recentNotices": []
}
```

---

## Settings APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/settings` | GET | Yes | Admin | Get application settings |
| `/api/settings` | PUT | Yes | Admin | Update application settings |

---

## Audit Log APIs

| Route | Method | Auth | Role | Description |
|-------|--------|------|------|-------------|
| `/api/audit-logs` | GET | Yes | Admin | List audit logs (paginated, filterable) |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| action | string | — | Filter by action type |
| performedBy | string | — | Filter by admin userId |

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error

```json
{
  "success": false,
  "error": "Error message here"
}
```

### Paginated

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```
