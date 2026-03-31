"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDeleteNoticeMutation } from "@/store/notices-api";
import { INotice, IUser } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.map((notice, index) => (
              <TableRow key={notice._id}>
                <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                <TableCell className="font-medium">{notice.title}</TableCell>
                <TableCell>{getCreatorName(notice.createdBy)}</TableCell>
                <TableCell>{formatDate(notice.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(notice)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteId(notice._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(notice)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteId(notice._id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notice? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
