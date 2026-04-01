"use client";

import { useState } from "react";
import { useGetPaymentsQuery } from "@/store/payments-api";
import { useGetUsersQuery } from "@/store/users-api";
import { IPayment, IUser } from "@/types";
import { PaymentTable } from "@/components/accounting/payment-table";
import { PaymentFormModal } from "@/components/accounting/payment-form-modal";
import { Button, Input, Select, Pagination } from "antd";
import { PlusIcon, Calculator, SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.data ?? [];

  const { data: paymentsData, isLoading, isFetching } = useGetPaymentsQuery({
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filterUserId ? { userId: filterUserId } : {}),
    ...(filterMonth ? { month: filterMonth } : {}),
    ...(filterYear ? { year: filterYear } : {}),
  });

  const payments = paymentsData?.data ?? [];
  const pagination = paymentsData?.pagination;

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
        <div className="p-4 border-b border-white/20">
          <h2 className="text-sm font-medium text-muted-foreground">
            {pagination?.total ?? 0} total payments
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
              onEdit={handleEdit}
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
    </div>
  );
}
