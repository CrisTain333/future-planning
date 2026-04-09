# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx`
- API routes: `route.ts`
- Components: kebab-case (`user-table.tsx`, `stat-card.tsx`, `payment-form-modal.tsx`)
- Models: PascalCase (`User.ts`, `Payment.ts`, `Investment.ts`)
- Store slices: kebab-case with `-api` suffix (`users-api.ts`, `payments-api.ts`, `dashboard-api.ts`)
- Validations: kebab-case matching domain (`user.ts`, `payment.ts`, `notice.ts`, `auth.ts`)
- Hooks: kebab-case with `use-` prefix (`use-debounce.ts`)
- Utility files: kebab-case (`skip-months.ts`, `investment-utils.ts`)
- Email templates: kebab-case (`payment-receipt.tsx`, `payment-reminder.tsx`)

**Functions:**
- Use camelCase for all functions: `handleSubmit`, `createAuditLog`, `dbConnect`
- React components use PascalCase: `UserTable`, `StatCard`, `AdminDashboard`
- Event handlers use `handle` prefix: `handleToggleStatus`, `handleAddUser`, `handleSearchChange`
- API helper functions use verb-noun: `createPaymentNotification`, `sendEmail`, `calculateMaturityAmount`
- Boolean checks use `is` prefix: `isMonthSkipped`, `isEdit`, `isLoading`

**Variables:**
- Use camelCase: `debouncedSearch`, `currentUser`, `queryParams`
- Constants: SCREAMING_SNAKE_CASE for static arrays/maps (`MONTH_OPTIONS`, `BLOOD_GROUPS`, `MONTH_NAMES`)
- Booleans derived from RTK Query: `isLoading`, `isCreating`, `isUpdating`, `isSubmitting`

**Types/Interfaces:**
- Frontend interfaces use `I` prefix: `IUser`, `IPayment`, `INotice`, `ISettings`
- Mongoose document interfaces use `I` prefix + `Document` suffix: `IUserDocument`, `IPaymentDocument`
- API response wrappers: `ApiResponse<T>`, `PaginatedResponse<T>`, `ApiError`
- Form input types inferred from Zod: `CreateUserInput`, `UpdatePaymentInput`, `LoginInput`
- Component props interfaces: `{ComponentName}Props` (`UserTableProps`, `StatCardProps`)
- Store parameter interfaces: inline in store files (`GetUsersParams`, `CreateUserBody`)

## Code Style

**Formatting:**
- No Prettier config detected; relies on default ESLint formatting
- Double quotes for strings (consistent across all files)
- Semicolons: present at end of statements
- Trailing commas: used in object/array definitions
- Indentation: 2 spaces
- Max line length: not enforced; some lines exceed 120 characters

**Linting:**
- ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Config file: `eslint.config.mjs`
- Minimal custom rules; relies on Next.js defaults
- One `eslint-disable-next-line no-var` comment in `src/lib/db.ts` for global cache declaration

## Import Organization

**Order (observed pattern):**
1. React/Next.js framework imports (`"use client"` directive first when present)
2. Third-party library imports (antd, lucide-react, framer-motion, react-hook-form, zod)
3. Internal absolute imports using `@/` alias:
   - Store imports (`@/store/*`)
   - Type imports (`@/types`)
   - Component imports (`@/components/*`)
   - Lib/utility imports (`@/lib/*`)
   - Validation imports (`@/validations/*`)
   - Model imports (`@/models/*`)
4. Relative imports (sibling components: `./reset-password-modal`)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for non-relative imports; never use `../../` deep paths

**Example (from `src/app/(admin)/admin/users/page.tsx`):**
```typescript
"use client";

import { useState, useMemo } from "react";
import { useGetUsersQuery } from "@/store/users-api";
import { IUser } from "@/types";
import { Button, Input, Select, Pagination } from "antd";
import { PlusIcon, SearchIcon, Users } from "lucide-react";
import { UserTable } from "@/components/users/user-table";
import { UserFormModal } from "@/components/users/user-form-modal";
import { useDebounce } from "@/hooks/use-debounce";
```

## Component Patterns

**Client vs Server Components:**
- Pages under `(admin)` and `(dashboard)` route groups are client components (`"use client"` at top)
- Layout components (`src/app/(admin)/layout.tsx`, `src/app/(dashboard)/layout.tsx`) are server components
- Root layout (`src/app/layout.tsx`) is a server component that wraps providers
- All interactive components have `"use client"` directive

**Functional Components Only:**
- No class components anywhere in the codebase
- Use `function` declaration for named exports: `export function UserTable({...}) {}`
- Use `export default function` for pages: `export default function ManageUsersPage() {}`
- Provider components use `export default function`: `export default function ReduxProvider({...}) {}`

**Props Pattern:**
- Define props interface directly above component:
```typescript
interface UserTableProps {
  users: IUser[];
  isLoading: boolean;
  onEdit: (user: IUser) => void;
  page: number;
  limit: number;
}

export function UserTable({ users, isLoading, onEdit, page, limit }: UserTableProps) {
```
- Destructure props in function signature
- Children typed as `React.ReactNode`

**State Management:**
- RTK Query for all server state (API calls, caching, cache invalidation)
- Local `useState` for UI state (modals, filters, pagination, form fields)
- No Redux slices for local state; only RTK Query `api` with `injectEndpoints`
- Pattern: `const { data, isLoading, isFetching } = useGetXxxQuery(params)`
- Mutations: `const [mutate, { isLoading }] = useXxxMutation()`
- Always call `.unwrap()` on mutations for error handling

**Modal Pattern:**
- Modals use Ant Design `<Modal>` component
- Controlled via `open` boolean and `onOpenChange` callback
- Footer set to `null`; custom form buttons inside modal body
- `destroyOnClose` always enabled
- Pattern (see `src/components/users/user-form-modal.tsx`, `src/components/notices/notice-form-modal.tsx`):
```typescript
interface XxxFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: IXxx | null;
}
```

**Form Pattern:**
- Two approaches used:
  1. **react-hook-form + Zod** for validated forms (login, user create/edit, notice create/edit, profile):
     - `useForm<T>({ resolver: zodResolver(schema) })`
     - `Controller` wraps Ant Design inputs
     - Error display: `{errors.field && <p className="text-xs text-destructive">{errors.field.message}</p>}`
  2. **Manual useState** for simpler forms (payment form modal):
     - Individual `useState` per field
     - Manual `handleSubmit` with `e.preventDefault()`

**Loading States:**
- `<Skeleton>` components for initial page load
- Ant Design `Button` with `loading` prop for submit buttons
- Overlay spinner for refetch states: `{isFetching && !isLoading && <div className="absolute inset-0 ...">}`

**Empty States:**
- Inline centered text: `<div className="py-12 text-center text-muted-foreground">No users found.</div>`

**Responsive Design:**
- Desktop table + mobile card pattern in `src/components/users/user-table.tsx`:
  - `<div className="hidden md:block">` for desktop table
  - `<div className="flex flex-col gap-3 md:hidden">` for mobile cards
- Grid breakpoints: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

## TypeScript Usage Patterns

**Strictness:**
- `strict: true` in `tsconfig.json`
- Target: ES2017
- Module resolution: bundler

**Interfaces vs Types:**
- `interface` for all domain models, props, and API shapes
- `type` for Zod inferred types: `type CreateUserInput = z.infer<typeof createUserSchema>`
- `type` for Redux store types: `type RootState = ReturnType<AppStore["getState"]>`

**Session Type Casting:**
- Repeated pattern across ALL API routes (major convention):
```typescript
const session = await auth();
const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
```
- This double cast (`as unknown as`) is used because NextAuth session types don't include custom fields

**Generics:**
- RTK Query endpoints are fully typed: `builder.query<ApiResponse<IUser>, string>`
- Mongoose models typed with document interface: `mongoose.model<IUserDocument>("User", UserSchema)`

**`any` Usage:**
- Minimal -- only 2 instances found:
  - `control={control as any}` in `src/components/users/user-form-modal.tsx` (union type workaround)
  - `history.map((log: any) =>` in `src/components/accounting/payment-detail-modal.tsx`

## CSS/Styling Approach

**Primary: Tailwind CSS v4:**
- Configured via `@tailwindcss/postcss`
- CSS variables for theming in `src/app/globals.css`
- Utility-first approach throughout all components

**Design System:**
- shadcn/ui components in `src/components/ui/` (Card, Badge, Avatar, Skeleton, Separator, Sonner)
- Uses `cn()` utility from `src/lib/utils.ts` for conditional class merging (`clsx` + `tailwind-merge`)
- `class-variance-authority` (cva) for variant-based component styling (`src/components/ui/badge.tsx`)

**Ant Design v6:**
- Used for interactive components: `Table`, `Button`, `Input`, `Select`, `Modal`, `Pagination`, `Drawer`, `Dropdown`
- Themed via `<ConfigProvider>` in root layout with custom `colorPrimary`, `borderRadius`, `fontFamily`

**Custom CSS Classes (in `src/app/globals.css`):**
- Glassmorphism: `glass-card`, `glass-sidebar`, `glass-header`, `glass-strong`, `glass`
- Animated gradient background: `bg-mesh`
- Custom animations: `animate-fade-in-up`, `animate-fade-in`, `animate-slide-in-left`, `animate-scale-in`
- Stagger classes: `stagger-1` through `stagger-6`
- Interactive: `hover-lift`, `glow-primary`
- Layout: `table-container`

**Color Theme:**
- Primary: teal/cyan at HSL `181 87% 31%` (approximately `#0a9396`)
- Uses HSL CSS custom properties for all theme colors
- Dark mode variables defined but not actively toggled (no theme toggle in UI)

**Icons:**
- `lucide-react` for all icons, consistently sized: `className="h-4 w-4"` or `className="h-6 w-6"`

**Animations:**
- `framer-motion` for dashboard component entrance animations
- CSS keyframe animations for simpler effects

## Error Handling

**API Routes (Server-side):**
- Every route handler wrapped in try/catch
- Error responses follow consistent format: `{ success: false, error: "message" }`
- Status codes: 401 (unauthorized), 400 (validation), 409 (conflict), 500 (server error)
- Catch blocks return generic user-friendly messages, not raw error details
- `console.error` used in catch blocks for some newer routes (investments, analytics, receipts)
- Silent catch for non-critical operations: `.catch(() => {})` for fire-and-forget emails

**Client-side:**
- `toast.success()` / `toast.error()` for user feedback (react-hot-toast)
- Try/catch around all mutation `.unwrap()` calls
- Error extraction pattern from RTK Query errors:
```typescript
catch (err: unknown) {
  const message = (err as { data?: { error?: string } })?.data?.error;
  toast.error(message || "Fallback message");
}
```

**Validation:**
- Server: Zod `safeParse` with first error message returned
- Client: react-hook-form + zodResolver for real-time validation
- Pattern: `if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 })`

## Logging

**Framework:** `console.error` only (no structured logging library)

**Patterns:**
- Server-side errors logged with context: `console.error("Receipt generation error:", error)`
- No `console.log` in production code
- Audit logging via `createAuditLog()` in `src/lib/audit.ts` for business events
- Email delivery results logged to `EmailLog` MongoDB collection via `src/lib/email/send.ts`

## API Route Conventions

**Authentication Check (every protected route):**
```typescript
const session = await auth();
const currentUser = session?.user as unknown as { userId: string; role: string } | undefined;
if (!currentUser || currentUser.role !== "admin") {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
```

**Database Connection:**
```typescript
await dbConnect();
```

**Response Format:**
- Success: `{ success: true, data: T, message?: string }`
- Paginated: `{ success: true, data: T[], pagination: { page, limit, total, totalPages } }`
- Error: `{ success: false, error: string }`

**Soft Delete Pattern:**
- Records have `isDeleted: boolean` field
- Queries filter with `{ isDeleted: false }` or `{ isDeleted: false, status: "approved" }`
- Delete operations set `isDeleted: true` + `deletedBy` + `deletedAt`

## Module Design

**Exports:**
- Components: named exports (`export function UserTable`)
- Models: default export (`export default User`)
- Store API slices: named export for slice + destructured hooks
- Validation schemas: named exports (`export const createUserSchema`)
- Utility functions: named exports (`export function calculateMaturityAmount`)

**Barrel Files:**
- Types barrel: `src/types/index.ts` exports all interfaces
- No other barrel files; imports reference specific files

## Mongoose Model Pattern

Every model in `src/models/` follows this structure:
```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface I{Name}Document extends Document {
  // typed fields
}

const {Name}Schema = new Schema<I{Name}Document>(
  { /* schema definition */ },
  { timestamps: true }
);

// Optional: indexes
{Name}Schema.index({ field: 1 });

const {Name} = mongoose.models.{Name} || mongoose.model<I{Name}Document>("{Name}", {Name}Schema);
export default {Name};
```

## RTK Query Store Pattern

Every store API file in `src/store/` follows this structure:
```typescript
import { api } from "./api";
import { ApiResponse, I{Entity}, PaginatedResponse } from "@/types";

// Parameter/body interfaces defined locally

export const {entity}Api = api.injectEndpoints({
  endpoints: (builder) => ({
    getItems: builder.query<ResponseType, ParamsType>({
      query: (params) => ({ url: "/endpoint", params }),
      providesTags: ["TagName"],
    }),
    createItem: builder.mutation<ResponseType, BodyType>({
      query: (body) => ({ url: "/endpoint", method: "POST", body }),
      invalidatesTags: ["TagName"],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = {entity}Api;
```

---

*Convention analysis: 2026-04-09*
