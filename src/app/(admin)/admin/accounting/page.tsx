"use client";

import { useState, useEffect } from "react";
import { useGetPaymentsQuery, useArchivePaymentMutation, useUnarchivePaymentMutation } from "@/store/payments-api";
import { useGetUsersQuery } from "@/store/users-api";
import { IPayment, IUser } from "@/types";
import { PaymentTable } from "@/components/accounting/payment-table";
import { PaymentFormModal } from "@/components/accounting/payment-form-modal";
import { BulkEditModal } from "@/components/accounting/bulk-edit-modal";
import { Button, Input, Select, Pagination } from "antd";
import { PlusIcon, Calculator, SearchIcon, PencilIcon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import toast from "react-hot-toast";

const MONTH_FILTER_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function AccountingPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState<number | "">(
    new Date().getFullYear()
  );

  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<IPayment[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const [archivePayment] = useArchivePaymentMutation();
  const [unarchivePayment] = useUnarchivePaymentMutation();

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.data ?? [];

  const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery({
    page,
    limit,
    status: activeTab === "archived" ? "archived" : "approved",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filterUserId ? { userId: filterUserId } : {}),
    ...(filterMonth ? { month: filterMonth } : {}),
    ...(filterYear ? { year: filterYear } : {}),
  });

  const payments = paymentsData?.data ?? [];
  const pagination = paymentsData?.pagination;

  const clearSelection = () => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  };

  useEffect(() => {
    clearSelection();
  }, [page, limit, debouncedSearch, filterUserId, filterMonth, filterYear, activeTab]);

  const handleArchive = async (payment: IPayment) => {
    try {
      await archivePayment(payment._id).unwrap();
      toast.success("Payment archived");
    } catch {
      toast.error("Failed to archive payment");
    }
  };

  const handleUnarchive = async (payment: IPayment) => {
    try {
      await unarchivePayment(payment._id).unwrap();
      toast.success("Payment unarchived");
    } catch {
      toast.error("Failed to unarchive payment");
    }
  };

  const handleBulkArchive = async () => {
    let successCount = 0;
    const failures: string[] = [];
    for (const payment of selectedRows) {
      try {
        await archivePayment(payment._id).unwrap();
        successCount++;
      } catch {
        const name = payment.userId && typeof payment.userId === "object"
          ? (payment.userId as { fullName: string }).fullName : "Unknown";
        failures.push(`Failed to archive payment for ${name}`);
      }
    }
    if (failures.length === 0) {
      toast.success(`Archived ${successCount} record${successCount !== 1 ? "s" : ""}`);
    } else {
      toast.success(`Archived ${successCount} of ${selectedRows.length} records`);
      failures.forEach((msg) => toast.error(msg));
    }
    clearSelection();
  };

  const handleBulkUnarchive = async () => {
    let successCount = 0;
    const failures: string[] = [];
    for (const payment of selectedRows) {
      try {
        await unarchivePayment(payment._id).unwrap();
        successCount++;
      } catch {
        const name = payment.userId && typeof payment.userId === "object"
          ? (payment.userId as { fullName: string }).fullName : "Unknown";
        failures.push(`Failed to unarchive payment for ${name}`);
      }
    }
    if (failures.length === 0) {
      toast.success(`Unarchived ${successCount} record${successCount !== 1 ? "s" : ""}`);
    } else {
      toast.success(`Unarchived ${successCount} of ${selectedRows.length} records`);
      failures.forEach((msg) => toast.error(msg));
    }
    clearSelection();
  };

  const handleEdit = (payment: IPayment) => {
    setEditingPayment(payment);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPayment(null);
    setModalOpen(true);
  };

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Accounting
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record and manage member payments
          </p>
        </div>
        <Button 
          type="primary" 
          onClick={handleOpenCreate} 
          className="glow-primary gap-2"
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Record Payment
        </Button>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="sm:w-64">
            <Input
              placeholder="Search by name or receipt no..."
              prefix={<SearchIcon className="h-4 w-4 text-muted-foreground" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              allowClear
            />
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              className="w-full sm:w-40"
              value={filterUserId || undefined}
              onChange={(val) => { setFilterUserId(val as string); setPage(1); }}
              placeholder="All members"
              options={[
                { label: "All members", value: "" },
                ...users.map((user: IUser) => ({ label: user.fullName, value: user._id }))
              ]}
            />
            <Select
              className="w-full sm:w-36"
              value={filterMonth || undefined}
              onChange={(val) => { setFilterMonth(val as number | ""); setPage(1); }}
              placeholder="All months"
              options={[
                { label: "All months", value: "" },
                ...MONTH_FILTER_OPTIONS
              ]}
            />
            <Select
              className="w-full sm:w-28"
              value={filterYear || undefined}
              onChange={(val) => { setFilterYear(val as number | ""); setPage(1); }}
              placeholder="Year"
              options={[
                { label: "All years", value: "" },
                { label: "2026", value: 2026 },
                { label: "2027", value: 2027 },
                { label: "2028", value: 2028 },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {pagination?.total ?? 0} {activeTab === "archived" ? "archived" : "total"} payments
          </h2>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => { setActiveTab("active"); setPage(1); }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === "active" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Active
            </button>
            <button
              onClick={() => { setActiveTab("archived"); setPage(1); }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${activeTab === "archived" ? "bg-card shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Archived
            </button>
          </div>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading payments...
              </div>
            </div>
          ) : (
            <PaymentTable
              payments={payments}
              page={page}
              limit={limit}
              mode={activeTab}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={(keys, rows) => {
                setSelectedRowKeys(keys);
                setSelectedRows(rows);
              }}
            />
          )}
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

      {/* Payment form modal */}
      <PaymentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        payment={editingPayment}
      />

      {/* Bulk edit modal */}
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedPayments={selectedRows}
        onComplete={() => {
          setSelectedRowKeys([]);
          setSelectedRows([]);
        }}
      />

      {/* Floating action bar */}
      {selectedRowKeys.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 rounded-xl bg-card border shadow-lg px-5 py-3">
            <span className="text-sm font-medium">
              {selectedRowKeys.length} selected
            </span>
            {activeTab === "active" ? (
              <>
                <Button
                  type="primary"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => setBulkEditOpen(true)}
                >
                  Bulk Edit
                </Button>
                <Button
                  icon={<ArchiveIcon className="h-4 w-4" />}
                  onClick={handleBulkArchive}
                >
                  Bulk Archive
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<ArchiveRestoreIcon className="h-4 w-4" />}
                onClick={handleBulkUnarchive}
              >
                Bulk Unarchive
              </Button>
            )}
            <Button
              size="small"
              type="text"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
