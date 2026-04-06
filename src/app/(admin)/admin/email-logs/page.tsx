"use client";

import { useState } from "react";
import { useGetEmailLogsQuery } from "@/store/email-logs-api";
import { IEmailLog, IUser } from "@/types";
import { Table, Select, Pagination, Tag } from "antd";
import { Mail, CheckCircle2, XCircle } from "lucide-react";
import type { ColumnsType } from "antd/es/table";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "payment_reminder", label: "Payment Reminder" },
  { value: "payment_receipt", label: "Payment Receipt" },
  { value: "notice", label: "Notice" },
  { value: "password_changed", label: "Password Changed" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

const TYPE_COLORS: Record<string, string> = {
  payment_reminder: "blue",
  payment_receipt: "green",
  notice: "purple",
  password_changed: "orange",
};

const TYPE_LABELS: Record<string, string> = {
  payment_reminder: "Payment Reminder",
  payment_receipt: "Payment Receipt",
  notice: "Notice",
  password_changed: "Password Changed",
};

export default function EmailLogsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data, isLoading } = useGetEmailLogsQuery({
    page,
    limit,
    type: filterType,
    status: filterStatus,
  });

  const columns: ColumnsType<IEmailLog> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Recipient",
      key: "recipient",
      width: 200,
      render: (_: unknown, record: IEmailLog) => {
        const user = record.toUserId as IUser | undefined;
        return (
          <div>
            <div className="font-medium text-sm">
              {user && typeof user === "object" ? user.fullName : "—"}
            </div>
            <div className="text-xs text-muted-foreground">{record.to}</div>
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 160,
      render: (type: string) => (
        <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Tag>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) =>
        status === "sent" ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle2 size={14} /> Sent
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <XCircle size={14} /> Failed
          </span>
        ),
    },
    {
      title: "Error",
      dataIndex: "error",
      key: "error",
      width: 200,
      ellipsis: true,
      render: (error: string) =>
        error ? (
          <span className="text-xs text-red-500">{error}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Email Logs</h1>
          <p className="text-sm text-muted-foreground">
            Track all emails sent from the system
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-3">
          <Select
            style={{ width: 180 }}
            value={filterType}
            onChange={(val) => {
              setFilterType(val);
              setPage(1);
            }}
            options={TYPE_OPTIONS}
            placeholder="Filter by type"
          />
          <Select
            style={{ width: 140 }}
            value={filterStatus}
            onChange={(val) => {
              setFilterStatus(val);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            placeholder="Filter by status"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {data?.pagination.total ?? 0} total emails
          </p>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="_id"
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
          />
        </div>

        {(data?.pagination.totalPages ?? 0) > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              current={page}
              pageSize={limit}
              total={data?.pagination.total ?? 0}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
