"use client";

import { useState } from "react";
import {
  useGetInvestmentsQuery,
  useDeleteInvestmentMutation,
  useUpdateInvestmentMutation,
} from "@/store/investments-api";
import { useGetInvestmentAnalyticsQuery } from "@/store/investments-api";
import { IInvestment, IUser } from "@/types";
import { InvestmentFormModal } from "./investment-form-modal";
import { Table, Button, Dropdown, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, MoreHorizontal, Pencil, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "matured", label: "Matured" },
  { key: "withdrawn", label: "Withdrawn" },
] as const;

export function FDTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<IInvestment | null>(null);

  const queryParams = statusFilter === "all" ? undefined : { status: statusFilter };
  const { data, isLoading } = useGetInvestmentsQuery(queryParams);
  const { data: analyticsData } = useGetInvestmentAnalyticsQuery();
  const [deleteInvestment] = useDeleteInvestmentMutation();
  const [updateInvestment] = useUpdateInvestmentMutation();

  const investments = data?.data ?? [];

  const statusCounts = {
    all: investments.length,
    active: 0,
    matured: 0,
    withdrawn: 0,
  };

  // When filter is "all", count from the full list
  if (statusFilter === "all") {
    for (const inv of investments) {
      if (inv.status in statusCounts) {
        statusCounts[inv.status as keyof typeof statusCounts]++;
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteInvestment(id).unwrap();
      toast.success("Investment deleted");
    } catch {
      toast.error("Failed to delete investment");
    }
  };

  const handleMarkStatus = async (id: string, status: "matured" | "withdrawn") => {
    try {
      await updateInvestment({ id, body: { status } }).unwrap();
      toast.success(`Marked as ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const columns: ColumnsType<IInvestment> = [
    {
      title: "Bank",
      dataIndex: "bankName",
      key: "bankName",
      render: (name: string, record: IInvestment) => {
        const members = record.memberContributions as IUser[];
        const tenureYears = record.tenureMonths / 12;
        const tenureLabel =
          tenureYears >= 1
            ? `${tenureYears % 1 === 0 ? tenureYears : tenureYears.toFixed(1)} year${tenureYears !== 1 ? "s" : ""} term`
            : `${record.tenureMonths} month term`;
        return (
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">
              {tenureLabel} · {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        );
      },
    },
    {
      title: "Principal",
      dataIndex: "principalAmount",
      key: "principalAmount",
      render: (v: number) => `৳${v.toLocaleString()}`,
    },
    {
      title: "Rate",
      dataIndex: "interestRate",
      key: "interestRate",
      render: (v: number) => `${v}%`,
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Maturity",
      dataIndex: "maturityDate",
      key: "maturityDate",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Current Value",
      key: "currentValue",
      render: (_: unknown, record: IInvestment) => {
        if (record.status !== "active") {
          return <span>৳{record.maturityAmount.toLocaleString()}</span>;
        }
        const perFD = analyticsData?.data?.perFD?.find((fd) => fd.id === record._id);
        const value = perFD?.currentValue ?? record.principalAmount;
        return (
          <span className="text-emerald-500 font-semibold">
            ৳{value.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          active: "green",
          matured: "gold",
          withdrawn: "red",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 48,
      render: (_: unknown, record: IInvestment) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "edit",
                label: "Edit",
                icon: <Pencil className="h-3.5 w-3.5" />,
                onClick: () => {
                  setEditingInvestment(record);
                  setModalOpen(true);
                },
              },
              ...(record.status === "active"
                ? [
                    {
                      key: "matured",
                      label: "Mark as Matured",
                      icon: <CheckCircle className="h-3.5 w-3.5" />,
                      onClick: () => handleMarkStatus(record._id, "matured"),
                    },
                  ]
                : []),
              {
                key: "delete",
                label: "Delete",
                icon: <Trash2 className="h-3.5 w-3.5" />,
                danger: true,
                onClick: () => handleDelete(record._id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreHorizontal className="h-4 w-4" />}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fixed Deposits</h2>
          <p className="text-sm text-muted-foreground">
            {statusCounts.active} active · {statusCounts.matured} matured
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingInvestment(null);
            setModalOpen(true);
          }}
        >
          New Fixed Deposit
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === filter.key
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={investments}
        rowKey="_id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      {/* Form Modal */}
      <InvestmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        investment={editingInvestment}
      />
    </div>
  );
}
