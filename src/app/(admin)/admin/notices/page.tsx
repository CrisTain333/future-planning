"use client";

import { useState } from "react";
import { useGetNoticesQuery } from "@/store/notices-api";
import { INotice } from "@/types";
import { Button, Pagination } from "antd";
import { NoticeTable } from "@/components/notices/notice-table";
import { NoticeFormModal } from "@/components/notices/notice-form-modal";
import { Megaphone, Plus as PlusIcon } from "lucide-react";

export default function NoticesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<INotice | undefined>();

  const { data, isLoading } = useGetNoticesQuery({ page, limit });
  const notices = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const handleEdit = (notice: INotice) => {
    setEditingNotice(notice);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingNotice(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Notice Board
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage announcements for members
          </p>
        </div>
        <Button onClick={handleNew} type="primary" className="glow-primary gap-2" icon={<PlusIcon className="h-4 w-4" />}>
          New Notice
        </Button>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-sm font-medium text-muted-foreground">
            {total} total notices
          </h2>
        </div>
        <div className="table-container">
          <NoticeTable
            notices={notices}
            isLoading={isLoading}
            page={page}
            limit={limit}
            onEdit={handleEdit}
          />
        </div>
        {(pagination?.total ?? 0) > 0 && (
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
              pageSizeOptions={['10', '20', '50', '100']}
            />
          </div>
        )}
      </div>

      <NoticeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        notice={editingNotice}
      />
    </div>
  );
}
