"use client";

import { useState } from "react";
import { useGetAuditLogsQuery } from "@/store/audit-logs-api";
import { useGetUsersQuery } from "@/store/users-api";
import { IUser } from "@/types";
import { Table, Select, Pagination } from "antd";
import type { TableProps } from "antd";
import { Skeleton } from "@/components/ui/skeleton";
import { FileX2, ScrollText } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  payment_created: "Payment Created",
  payment_edited: "Payment Edited",
  payment_deleted: "Payment Deleted",
  user_created: "User Created",
  user_edited: "User Edited",
  user_disabled: "User Disabled",
  user_enabled: "User Enabled",
  user_password_reset: "Password Reset",
  notice_created: "Notice Created",
  notice_edited: "Notice Edited",
  notice_deleted: "Notice Deleted",
  settings_updated: "Settings Updated",
  profile_updated: "Profile Updated",
  profile_picture_updated: "Profile Picture Updated",
  password_changed: "Password Changed",
  user_login: "User Login",
  user_login_failed: "Failed Login",
};

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface AuditLogEntry {
  _id: string;
  action: string;
  performedBy: string | { _id: string; fullName: string };
  targetUser?: string | { _id: string; fullName: string } | null;
  details: Record<string, unknown>;
  createdAt: string;
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

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "object") {
    try { return JSON.stringify(val); } catch { return String(val); }
  }
  return String(val);
}

function FormattedDetails({ details }: { details: Record<string, unknown> }) {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-muted-foreground italic">No details</span>;
  }

  const { action_description, changes, timestamp: _ts, ...rest } = details;
  const description = typeof action_description === "string" ? action_description : null;

  // Handle changes — could be an array (new format) or object (old format)
  const changeItems: { field: string; from?: unknown; to?: unknown }[] = [];
  if (Array.isArray(changes)) {
    changeItems.push(...(changes as { field: string; from?: unknown; to?: unknown }[]));
  } else if (changes && typeof changes === "object") {
    // Old format: { changes: { amount: 2000, penalty: 0 } }
    for (const [key, val] of Object.entries(changes as Record<string, unknown>)) {
      changeItems.push({ field: key, to: val });
    }
  }

  // Collect remaining simple fields (skip objects unless they're small)
  const extraFields: { label: string; value: string }[] = [];
  for (const [key, val] of Object.entries(rest)) {
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
      .trim();
    if (typeof val === "object" && val !== null) {
      const str = JSON.stringify(val);
      if (str.length < 100) extraFields.push({ label, value: str });
    } else if (val !== undefined && val !== null && val !== "") {
      extraFields.push({ label, value: String(val) });
    }
  }

  const hasContent = description || changeItems.length > 0 || extraFields.length > 0;
  if (!hasContent) {
    return <span className="text-muted-foreground italic">No details</span>;
  }

  return (
    <div className="text-xs space-y-1.5 max-w-xs">
      {description && (
        <p className="font-medium text-foreground leading-snug">{description}</p>
      )}
      {changeItems.length > 0 && (
        <div className="space-y-0.5 pl-2 border-l-2 border-primary/20">
          {changeItems.map((change, i) => (
            <div key={i} className="text-muted-foreground">
              <span className="font-medium capitalize">{change.field.replace(/_/g, " ")}:</span>{" "}
              {change.from !== undefined && (
                <><span className="line-through text-red-500/70">{formatValue(change.from)}</span> → </>
              )}
              <span className="text-emerald-600 font-medium">{formatValue(change.to)}</span>
            </div>
          ))}
        </div>
      )}
      {extraFields.length > 0 && (
        <div className="space-y-0.5">
          {extraFields.map(({ label, value }) => (
            <div key={label} className="text-muted-foreground">
              <span className="font-medium">{label}:</span> {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterPerformedBy, setFilterPerformedBy] = useState<string>("");

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.data ?? [];

  const { data: auditData, isLoading, isFetching } = useGetAuditLogsQuery({
    page,
    limit,
    ...(filterAction ? { action: filterAction } : {}),
    ...(filterPerformedBy ? { performedBy: filterPerformedBy } : {}),
  });

  const logs: AuditLogEntry[] = auditData?.data ?? [];
  const pagination = auditData?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const columns: TableProps<AuditLogEntry>['columns'] = [
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => ACTION_LABELS[record.action] ?? record.action,
      className: "font-medium",
    },
    {
      title: 'Performed By',
      key: 'performedBy',
      render: (_, record) => typeof record.performedBy === "object" ? record.performedBy?.fullName : "Unknown",
    },
    {
      title: 'Target User',
      key: 'targetUser',
      render: (_, record) => typeof record.targetUser === "object" && record.targetUser ? record.targetUser.fullName : "—",
    },
    {
      title: 'Details',
      key: 'details',
      className: "max-w-xs",
      render: (_, record) => <FormattedDetails details={record.details} />,
    },
    {
      title: 'Date',
      key: 'createdAt',
      className: "text-muted-foreground",
      render: (_, record) => formatDate(record.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all system actions and changes
        </p>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Filter by Action</label>
            <Select
              className="w-full bg-white/50"
              value={filterAction || undefined}
              onChange={(val) => {
                setFilterAction(val as string);
                setPage(1);
              }}
              placeholder="All actions"
              options={[
                { label: "All actions", value: "" },
                ...ACTION_OPTIONS
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Filter by Performed By</label>
            <Select
              className="w-full bg-white/50"
              value={filterPerformedBy || undefined}
              onChange={(val) => {
                setFilterPerformedBy(val as string);
                setPage(1);
              }}
              placeholder="All users"
              options={[
                { label: "All users", value: "" },
                ...users.map((user: IUser) => ({ label: user.fullName, value: user._id }))
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-sm font-medium text-muted-foreground">
            {total} audit entries
          </h2>
        </div>
        <div className="table-container overflow-x-auto relative">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </div>
          )}
          {logs.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <FileX2 className="h-10 w-10" />
              <p className="text-sm">No audit logs found.</p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="_id"
              loading={isLoading}
              pagination={false}
              locale={{ emptyText: <></> }}
            />
          )}
        </div>
        {total > 0 && (
          <div className="p-4 border-t border-white/20 flex justify-center">
            <Pagination
              current={page}
              total={total}
              pageSize={limit}
              onChange={(p) => setPage(p)}
              showSizeChanger={true}
              onShowSizeChange={(current, size) => {
                setLimit(size);
                setPage(1);
              }}
              pageSizeOptions={['10', '15', '20', '50', '100']}
            />
          </div>
        )}
      </div>
    </div>
  );
}
