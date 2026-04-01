"use client";

import { useState, useMemo } from "react";
import { useGetUsersQuery } from "@/store/users-api";
import { IUser } from "@/types";

import { Button, Input, Select, Pagination } from "antd";
import { PlusIcon, SearchIcon, Users } from "lucide-react";

import { UserTable } from "@/components/users/user-table";
import { UserFormModal } from "@/components/users/user-form-modal";
import { useDebounce } from "@/hooks/use-debounce";

export default function ManageUsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      role: role !== "all" ? role : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [page, limit, debouncedSearch, role, status]
  );

  const { data, isLoading, isFetching } = useGetUsersQuery(queryParams);

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

  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
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
        <Button 
          type="primary" 
          onClick={handleAddUser} 
          className="glow-primary" 
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add User
        </Button>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-4 lg:p-6 mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Search Users</label>
            <Input
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              prefix={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
              className="bg-white/50 w-full"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Filter by Role</label>
            <Select
              className="w-full bg-white/50"
              value={role}
              onChange={handleRoleChange}
              options={[
                { label: "All Roles", value: "all" },
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Filter by Status</label>
            <Select
              className="w-full bg-white/50"
              value={status}
              onChange={handleStatusChange}
              options={[
                { label: "All Status", value: "all" },
                { label: "Active", value: "active" },
                { label: "Disabled", value: "disabled" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/20">
          <h2 className="text-sm font-medium text-muted-foreground">
            {pagination?.total ?? 0} total users
          </h2>
        </div>
        <div className="table-container relative">
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </div>
          )}
          <UserTable
            users={users}
            isLoading={isLoading}
            onEdit={handleEditUser}
            page={page}
            limit={limit}
          />
        </div>
        {/* Pagination inside the card */}
        {(pagination?.total ?? 0) > 0 && (
          <div className="p-4 border-t border-white/20 flex justify-center">
            <Pagination
              current={page}
              total={pagination?.total ?? 0}
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

      <UserFormModal open={modalOpen} onOpenChange={setModalOpen} user={editingUser} />
    </div>
  );
}
