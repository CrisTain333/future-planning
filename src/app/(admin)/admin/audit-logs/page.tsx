"use client";

import { useState } from "react";
import { useGetAuditLogsQuery } from "@/store/audit-logs-api";
import { useGetUsersQuery } from "@/store/users-api";
import { IUser } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX2 } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  payment_created: "Payment Created",
  payment_edited: "Payment Edited",
  payment_deleted: "Payment Deleted",
  user_created: "User Created",
  user_edited: "User Edited",
  user_disabled: "User Disabled",
  user_enabled: "User Enabled",
  notice_created: "Notice Created",
  notice_edited: "Notice Edited",
  notice_deleted: "Notice Deleted",
  settings_updated: "Settings Updated",
};

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const LIMIT = 15;

interface IAuditLog {
  _id: string;
  action: string;
  performedBy: { _id: string; fullName: string };
  targetUser: { _id: string; fullName: string } | null;
  details: Record<string, unknown>;
  createdAt: string;
}

function formatDetails(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) return "—";
  return Object.entries(details)
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase());
      const displayValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${label}: ${displayValue}`;
    })
    .join(", ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Performed By</TableHead>
          <TableHead>Target User</TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterPerformedBy, setFilterPerformedBy] = useState<string>("");

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.data ?? [];

  const { data: auditData, isLoading } = useGetAuditLogsQuery({
    page,
    limit: LIMIT,
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterPerformedBy ? { performedBy: filterPerformedBy } : {}),
  });

  const logs: IAuditLog[] = auditData?.data ?? [];
  const pagination = auditData?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-2xl font-bold">Audit Logs</h1>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Action</span>
          <Select
            value={filterAction || undefined}
            onValueChange={(val) => {
              setFilterAction(val as string);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">Performed By</span>
          <Select
            value={filterPerformedBy || undefined}
            onValueChange={(val) => {
              setFilterPerformedBy(val as string);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All users</SelectItem>
              {users.map((user: IUser) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <FileX2 className="h-10 w-10" />
          <p className="text-sm">No audit logs found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </TableCell>
                    <TableCell>
                      {log.performedBy?.fullName ?? "Unknown"}
                    </TableCell>
                    <TableCell>
                      {log.targetUser?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {formatDetails(log.details)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page <= 1}
                    className={
                      page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    aria-disabled={page >= totalPages}
                    className={
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
