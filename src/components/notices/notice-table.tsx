"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDeleteNoticeMutation } from "@/store/notices-api";
import { INotice, IUser } from "@/types";
import type { TableProps } from "antd";
import { Table, Modal, Button } from "antd";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2 } from "lucide-react";

interface NoticeTableProps {
  notices: INotice[];
  isLoading: boolean;
  page: number;
  limit: number;
  onEdit: (notice: INotice) => void;
}

function getCreatorName(createdBy: string | IUser): string {
  if (typeof createdBy === "string") return createdBy;
  return createdBy.fullName;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function NoticeTable({
  notices,
  isLoading,
  page,
  limit,
  onEdit,
}: NoticeTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteNotice, { isLoading: isDeleting }] = useDeleteNoticeMutation();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteNotice(deleteId).unwrap();
      toast.success("Notice deleted successfully");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete notice");
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (notices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No notices found.
      </p>
    );
  }

  const columns: TableProps<INotice>['columns'] = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      className: "font-medium",
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_, record) => getCreatorName(record.createdBy),
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (_, record) => formatDate(record.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 96,
      render: (_, record) => (
        <div className="flex justify-end gap-1">
          <Button
            type="text"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => setDeleteId(record._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={notices}
          rowKey="_id"
          pagination={false}
        />
      </div>

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {notices.map((notice, index) => (
          <div
            key={notice._id}
            className="rounded-lg border p-4 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {(page - 1) * limit + index + 1}. {notice.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getCreatorName(notice.createdBy)} &middot;{" "}
                  {formatDate(notice.createdAt)}
                </p>
              </div>
              <div className="flex gap-1 ml-2 shrink-0">
                <Button
                  type="text"
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => onEdit(notice)}
                />
                <Button
                  type="text"
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => setDeleteId(notice._id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Modal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        title={
          <div>
            <h2 className="text-lg font-semibold">Delete Notice</h2>
            <p className="text-sm font-normal text-muted-foreground mt-1">
              Are you sure you want to delete this notice? This action cannot be undone.
            </p>
          </div>
        }
        footer={
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button danger type="primary" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </div>
        }
        destroyOnClose
      />
    </>
  );
}
