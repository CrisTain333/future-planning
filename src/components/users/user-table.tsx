"use client";

import { IUser } from "@/types";
import { Table, Button } from "antd";
import type { TableProps } from "antd";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PencilIcon, KeyRound, ToggleLeftIcon, ToggleRightIcon } from "lucide-react";
import { ResetPasswordModal } from "./reset-password-modal";
import { useState } from "react";
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
  const [resetPasswordUser, setResetPasswordUser] = useState<IUser | null>(null);

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

  const columns: TableProps<IUser>['columns'] = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, index) => (page - 1) * limit + index + 1,
      className: "text-muted-foreground",
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      className: "font-medium",
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || "-",
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || "-",
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Badge variant={role === "admin" ? "default" : "secondary"}>
          {role}
        </Badge>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge
          variant={record.isDisabled ? "destructive" : "outline"}
          className={
            !record.isDisabled
              ? "border-green-500/50 text-green-600 dark:text-green-400"
              : ""
          }
        >
          {record.isDisabled ? "Disabled" : "Active"}
        </Badge>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="text"
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => onEdit(record)}
            title="Edit user"
          />
          <Button
            type="text"
            icon={<KeyRound className="h-4 w-4 text-amber-600" />}
            onClick={() => setResetPasswordUser(record)}
            title="Reset password"
          />
          <Button
            type="text"
            loading={isToggling}
            icon={
              record.isDisabled ? (
                <ToggleLeftIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ToggleRightIcon className="h-4 w-4 text-green-600" />
              )
            }
            onClick={() => handleToggleStatus(record)}
            title={record.isDisabled ? "Enable user" : "Disable user"}
          />
        </div>
      ),
    },
  ];

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
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          pagination={false}
        />
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
                  type="text"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => onEdit(user)}
                />
                <Button
                  type="text"
                  icon={<KeyRound className="h-4 w-4 text-amber-600" />}
                  onClick={() => setResetPasswordUser(user)}
                />
                <Button
                  type="text"
                  loading={isToggling}
                  icon={
                    user.isDisabled ? (
                      <ToggleLeftIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ToggleRightIcon className="h-4 w-4 text-green-600" />
                    )
                  }
                  onClick={() => handleToggleStatus(user)}
                />
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

      <ResetPasswordModal
        open={resetPasswordUser !== null}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
      />
    </>
  );
}
