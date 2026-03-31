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
import { Plus } from "lucide-react";

const LIMIT = 10;

export default function NoticesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<INotice | undefined>();

  const { data, isLoading } = useGetNoticesQuery({ page, limit: LIMIT });
  const notices = data?.data ?? [];
  const pagination = data?.pagination;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notice Board</h1>
        <Button onClick={handleNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Notice
        </Button>
      </div>

      <NoticeTable
        notices={notices}
        isLoading={isLoading}
        page={page}
        limit={LIMIT}
        onEdit={handleEdit}
      />

      {totalPages > 1 && (
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
      )}

      <NoticeFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        notice={editingNotice}
      />
    </div>
  );
}
