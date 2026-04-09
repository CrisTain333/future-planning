"use client";

import { useMemo } from "react";
import { Table, Tag, Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { IMeeting, IActionItem, IUser } from "@/types";
import { useUpdateActionItemMutation } from "@/store/meetings-api";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface ActionItemsTabProps {
  meeting: IMeeting;
}

export function ActionItemsTab({ meeting }: ActionItemsTabProps) {
  const actionItems: IActionItem[] = meeting.minutes?.actionItems ?? [];
  const [updateActionItem, { isLoading }] = useUpdateActionItemMutation();

  const counts = useMemo(() => {
    const now = dayjs();
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    for (const item of actionItems) {
      if (item.status === "done") {
        completed++;
      } else {
        pending++;
        if (item.dueDate && dayjs(item.dueDate).isBefore(now, "day")) {
          overdue++;
        }
      }
    }
    return { pending, completed, overdue };
  }, [actionItems]);

  const handleToggleStatus = async (item: IActionItem) => {
    const newStatus = item.status === "done" ? "pending" : "done";
    try {
      await updateActionItem({ id: item._id, status: newStatus }).unwrap();
      toast.success(
        newStatus === "done" ? "Marked as done" : "Marked as pending"
      );
    } catch {
      toast.error("Failed to update action item");
    }
  };

  const columns: ColumnsType<IActionItem> = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title: string) => (
        <span className="font-medium">{title}</span>
      ),
    },
    {
      title: "Assignee",
      key: "assignee",
      width: 140,
      render: (_: unknown, record: IActionItem) => {
        const user = record.assignee as IUser;
        return user?.fullName ?? "-";
      },
    },
    {
      title: "Due Date",
      key: "dueDate",
      width: 150,
      render: (_: unknown, record: IActionItem) => {
        if (!record.dueDate) return "-";
        const due = dayjs(record.dueDate);
        const isOverdue =
          record.status === "pending" && due.isBefore(dayjs(), "day");
        return (
          <div className="flex items-center gap-1.5">
            <span className={isOverdue ? "text-red-500 font-medium" : ""}>
              {due.format("DD MMM YYYY")}
            </span>
            {isOverdue && (
              <Tag color="red" className="m-0 text-xs">
                Overdue
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: unknown, record: IActionItem) =>
        record.status === "done" ? (
          <Tag color="green">Done</Tag>
        ) : (
          <Tag color="gold">Pending</Tag>
        ),
    },
    {
      title: "",
      key: "action",
      width: 100,
      render: (_: unknown, record: IActionItem) => (
        <Button
          size="small"
          onClick={() => handleToggleStatus(record)}
          loading={isLoading}
        >
          {record.status === "done" ? "Undo" : "Mark Done"}
        </Button>
      ),
    },
  ];

  if (actionItems.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No action items for this meeting.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          <span className="font-semibold text-yellow-500">
            {counts.pending}
          </span>{" "}
          pending
        </span>
        <span className="text-muted-foreground">/</span>
        <span>
          <span className="font-semibold" style={{ color: "#40916c" }}>
            {counts.completed}
          </span>{" "}
          completed
        </span>
        {counts.overdue > 0 && (
          <>
            <span className="text-muted-foreground">/</span>
            <span>
              <span className="font-semibold text-red-500">
                {counts.overdue}
              </span>{" "}
              overdue
            </span>
          </>
        )}
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={actionItems}
        rowKey="_id"
        pagination={false}
        size="small"
      />
    </div>
  );
}
