"use client";

import { useState } from "react";
import { useGetNoticesQuery } from "@/store/notices-api";
import { INotice } from "@/types";
import { Button } from "@/components/ui/button";
import { NoticeTable } from "@/components/notices/notice-table";
import { NoticeFormModal } from "@/components/notices/notice-form-modal";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Megaphone, Plus as PlusIcon } from "lucide-react";

const LIMIT = 10;

export default function NoticesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<INotice | undefined>();

  const { data, isLoading } = useGetNoticesQuery({ page, limit: LIMIT });
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
        <Button onClick={handleNew} className="glow-primary gap-2">
          <PlusIcon className="h-4 w-4" />
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
        <div className="p-0">
          <NoticeTable
            notices={notices}
            isLoading={isLoading}
            page={page}
            limit={LIMIT}
            onEdit={handleEdit}
          />
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/20">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-disabled={page <= 1}
                    className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-disabled={page >= totalPages}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
