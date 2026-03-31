# Future Planning - Database Schema

**Database:** MongoDB
**ODM:** Mongoose

---

## Collections

### 1. `users`

```javascript
{
  _id: ObjectId,
  fullName: String,          // required
  username: String,          // required, unique, lowercase
  email: String,             // optional
  password: String,          // required, bcrypt hashed, min 4 chars before hashing
  phone: String,             // optional
  address: String,           // optional
  bloodGroup: String,        // optional, enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
  profilePicture: String,    // optional, Cloudinary URL
  role: String,              // required, enum: ["admin", "user"], default: "user"
  isDisabled: Boolean,       // default: false
  createdAt: Date,           // auto (timestamps)
  updatedAt: Date            // auto (timestamps)
}
```

**Indexes:**
- `username`: unique
- `email`: unique, sparse (allows multiple nulls)

---

### 2. `payments`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref: "users", required
  month: Number,             // required, 1-12
  year: Number,              // required, e.g., 2026
  amount: Number,            // required, in BDT
  penalty: Number,           // default: 0
  penaltyReason: String,     // optional
  note: String,              // optional
  receiptNo: String,         // auto-generated, unique (e.g., "FP-2026-0001")
  status: String,            // enum: ["approved", "deleted"], default: "approved"
  approvedBy: ObjectId,      // ref: "users" (the admin who recorded it)
  isDeleted: Boolean,        // default: false (soft delete)
  deletedBy: ObjectId,       // ref: "users", set on soft delete
  deletedAt: Date,           // set on soft delete
  createdAt: Date,           // auto (timestamps)
  updatedAt: Date            // auto (timestamps)
}
```

**Indexes:**
- `{ userId, month, year }`: unique compound index (prevents duplicate payments)
- `receiptNo`: unique
- `userId`: for querying member payments
- `{ month, year }`: for monthly reports

---

### 3. `notices`

```javascript
{
  _id: ObjectId,
  title: String,             // required
  body: String,              // required
  createdBy: ObjectId,       // ref: "users" (admin)
  isDeleted: Boolean,        // default: false
  createdAt: Date,           // auto (timestamps)
  updatedAt: Date            // auto (timestamps)
}
```

**Indexes:**
- `createdAt`: descending, for listing recent notices

---

### 4. `notifications`

```javascript
{
  _id: ObjectId,
  userId: ObjectId,          // ref: "users" (recipient)
  type: String,              // enum: ["payment_recorded", "notice_posted"]
  title: String,             // short summary
  message: String,           // detail text
  referenceId: ObjectId,     // the payment or notice ID
  isRead: Boolean,           // default: false
  createdAt: Date            // auto (timestamps)
}
```

**Indexes:**
- `{ userId, isRead, createdAt }`: compound index for fetching unread notifications

---

### 5. `auditLogs`

```javascript
{
  _id: ObjectId,
  action: String,            // enum: [
                             //   "payment_created", "payment_edited", "payment_deleted",
                             //   "user_created", "user_edited", "user_disabled", "user_enabled",
                             //   "notice_created", "notice_edited", "notice_deleted",
                             //   "settings_updated"
                             // ]
  performedBy: ObjectId,     // ref: "users" (who did it)
  targetUser: ObjectId,      // ref: "users" (optional — who was affected)
  details: Object,           // flexible — stores before/after values, amounts, etc.
  createdAt: Date            // auto (timestamps), immutable
}
```

**Indexes:**
- `performedBy`: for filtering by admin
- `targetUser`: for filtering by affected user
- `createdAt`: descending, for listing recent logs
- This collection is **append-only** — no updates or deletes allowed at application level

---

### 6. `settings`

```javascript
{
  _id: ObjectId,
  foundationName: String,    // default: "Future Planning"
  monthlyAmount: Number,     // default: 2000
  initialAmount: Number,     // default: 10000
  startMonth: Number,        // default: 3 (March)
  startYear: Number,         // default: 2026
  createdAt: Date,
  updatedAt: Date
}
```

**Note:** Only one document exists in this collection. Use `findOneAndUpdate` with `upsert: true`.

---

## Relationships Diagram

```
users
  │
  ├──< payments        (userId → users._id)
  │     └── approvedBy  → users._id
  │
  ├──< notifications    (userId → users._id)
  │
  ├──< notices          (createdBy → users._id)
  │
  └──< auditLogs       (performedBy → users._id)
                        (targetUser → users._id)

settings (standalone, single document)
```

---

## Seed Data

On first run, the application should seed:

1. **Settings document** with default values
2. **One admin user:**
   - fullName: "Super Admin"
   - username: "admin"
   - password: "1234" (hashed)
   - role: "admin"
