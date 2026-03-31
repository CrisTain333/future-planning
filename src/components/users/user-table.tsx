"use client";

import { IUser } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import { useToggleUserStatusMutation } from "@/store/users-api";
import { toast } from "sonner";

interface UserTableProps {
  users: IUser[];
  isLoading: boolean;
  onEdit: (user: IUser) => void;
  page: number;
  limit: number;
}

export function UserTable({
  users,
  isLoading,
  onEdit,
  page,
  limit,
}: UserTableProps) {
  const [toggleUserStatus, { isLoading: isToggling }] =
    useToggleUserStatusMutation();

  const handleToggleStatus = async (user: IUser) => {
    const action = user.isDisabled ? "enable" : "disable";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${user.fullName}"?`
    );
    if (!confirmed) return;

    try {
      await toggleUserStatus(user._id).unwrap();
      toast.success(`User ${action}d successfully`);
    } catch {
      toast.error(`Failed to ${action} user`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No users found.
      </div>
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
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={user._id}>
                <TableCell className="text-muted-foreground">
                  {(page - 1) * limit + index + 1}
                </TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>{user.phone || "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isDisabled ? "destructive" : "outline"}
                    className={
                      !user.isDisabled
                        ? "border-green-500/50 text-green-600 dark:text-green-400"
                        : ""
                    }
                  >
                    {user.isDisabled ? "Disabled" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(user)}
                    >
                      <PencilIcon />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleToggleStatus(user)}
                      disabled={isToggling}
                    >
                      {user.isDisabled ? (
                        <ToggleLeftIcon className="text-muted-foreground" />
                      ) : (
                        <ToggleRightIcon className="text-green-600" />
                      )}
                      <span className="sr-only">Toggle status</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {users.map((user, index) => (
          <div
            key={user._id}
            className="rounded-lg border bg-card p-4 text-card-foreground"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {(page - 1) * limit + index + 1}. {user.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{user.username}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(user)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleToggleStatus(user)}
                  disabled={isToggling}
                >
                  {user.isDisabled ? (
                    <ToggleLeftIcon className="text-muted-foreground" />
                  ) : (
                    <ToggleRightIcon className="text-green-600" />
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge
                variant={user.role === "admin" ? "default" : "secondary"}
              >
                {user.role}
              </Badge>
              <Badge
                variant={user.isDisabled ? "destructive" : "outline"}
                className={
                  !user.isDisabled
                    ? "border-green-500/50 text-green-600 dark:text-green-400"
                    : ""
                }
              >
                {user.isDisabled ? "Disabled" : "Active"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
