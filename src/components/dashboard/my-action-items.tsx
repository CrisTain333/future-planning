"use client";

import { Tag, Button } from "antd";
import { ListChecks, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetActionItemsQuery,
  useUpdateActionItemMutation,
} from "@/store/meetings-api";
import { IActionItem, IUser } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

function ActionItemRow({ item }: { item: IActionItem }) {
  const [updateActionItem, { isLoading }] = useUpdateActionItemMutation();

  const handleToggle = async () => {
    const newStatus = item.status === "pending" ? "done" : "pending";
    try {
      await updateActionItem({ id: item._id, status: newStatus }).unwrap();
      toast.success(newStatus === "done" ? "Marked as done" : "Marked as pending");
    } catch {
      toast.error("Failed to update action item");
    }
  };

  const overdue = item.status === "pending" && isOverdue(item.dueDate);
  const dueDateStr = new Date(item.dueDate).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
      <Button
        type="text"
        size="small"
        icon={
          item.status === "done" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )
        }
        onClick={handleToggle}
        loading={isLoading}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm truncate ${
            item.status === "done"
              ? "line-through text-muted-foreground"
              : "font-medium"
          }`}
        >
          {item.title}
        </p>
      </div>
      <span
        className={`text-xs shrink-0 ${
          overdue ? "text-red-500 font-medium" : "text-muted-foreground"
        }`}
      >
        {overdue && <AlertCircle className="h-3 w-3 inline mr-0.5" />}
        {dueDateStr}
      </span>
    </div>
  );
}

export function MyActionItems() {
  const { data, isLoading } = useGetActionItemsQuery({ status: "pending" });
  const items: IActionItem[] = Array.isArray(data?.data) ? data.data.slice(0, 5) : [];

  if (isLoading) {
    return (
      <Card className="glass-card h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            My Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            My Action Items
          </CardTitle>
          <Link
            href="/dashboard/meetings"
            className="text-xs text-primary hover:underline"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <div>
            {items.map((item) => (
              <ActionItemRow key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending action items
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
