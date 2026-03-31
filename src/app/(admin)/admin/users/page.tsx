"use client";

import { useState, useMemo } from "react";
import { useGetUsersQuery } from "@/store/users-api";
import { IUser } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PlusIcon, SearchIcon, Users } from "lucide-react";

import { UserTable } from "@/components/users/user-table";
import { UserFormModal } from "@/components/users/user-form-modal";
import { useDebounce } from "@/hooks/use-debounce";

const LIMIT = 10;

export default function ManageUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const queryParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: debouncedSearch || undefined,
      role: role !== "all" ? role : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [page, debouncedSearch, role, status]
  );

  const { data, isLoading } = useGetUsersQuery(queryParams);

  const users = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleAddUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: IUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleChange = (value: string | null) => {
    setRole(value ?? "all");
    setPage(1);
  };

  const handleStatusChange = (value: string | null) => {
    setStatus(value ?? "all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Manage Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage foundation members and administrators
          </p>
        </div>
        <Button onClick={handleAddUser} className="glow-primary gap-2">
          <PlusIcon className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 bg-white/50"
            />
          </div>
          <Select value={role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-36 bg-white/50">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-40 bg-white/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-sm font-medium text-muted-foreground">
            {pagination?.total ?? 0} total users
          </h2>
        </div>
        <div className="p-0">
          <UserTable
            users={users}
            isLoading={isLoading}
            onEdit={handleEditUser}
            page={page}
            limit={LIMIT}
          />
        </div>
        {/* Pagination inside the card */}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    if (totalPages <= 5) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - page) <= 1;
                  })
                  .map((p, idx, arr) => {
                    const showEllipsisBefore = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <span key={p} className="contents">
                        {showEllipsisBefore && (
                          <PaginationItem>
                            <span className="flex size-8 items-center justify-center text-muted-foreground">
                              ...
                            </span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={page === p}
                            onClick={() => setPage(p)}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      </span>
                    );
                  })}
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

      <UserFormModal open={modalOpen} onOpenChange={setModalOpen} user={editingUser} />
    </div>
  );
}
