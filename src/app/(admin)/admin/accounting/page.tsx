"use client";

import { useState } from "react";
import { useGetPaymentsQuery } from "@/store/payments-api";
import { useGetUsersQuery } from "@/store/users-api";
import { IPayment, IUser } from "@/types";
import { PaymentTable } from "@/components/accounting/payment-table";
import { PaymentFormModal } from "@/components/accounting/payment-form-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { PlusIcon, Calculator } from "lucide-react";

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

const LIMIT = 10;

export default function AccountingPage() {
  const [page, setPage] = useState(1);
  const [filterUserId, setFilterUserId] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<number | "">("");
  const [filterYear, setFilterYear] = useState<number | "">(
    new Date().getFullYear()
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const users = usersData?.data ?? [];

  const { data: paymentsData, isLoading } = useGetPaymentsQuery({
    page,
    limit: LIMIT,
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
        <Button onClick={handleOpenCreate} className="glow-primary gap-2">
          <PlusIcon className="h-4 w-4" />
          Record Payment
        </Button>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Member</span>
            <Select
              value={filterUserId || undefined}
              onValueChange={(val) => {
                setFilterUserId(val as string);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48 bg-white/50">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All members</SelectItem>
                {users.map((user: IUser) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Month</span>
            <Select
              value={filterMonth || undefined}
              onValueChange={(val) => {
                setFilterMonth(val as number | "");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-40 bg-white/50">
                <SelectValue placeholder="All months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All months</SelectItem>
                {MONTH_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-medium">Year</span>
            <Input
              type="number"
              className="w-full sm:w-28 bg-white/50"
              value={filterYear}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : "";
                setFilterYear(val);
                setPage(1);
              }}
              placeholder="Year"
              min={2020}
              max={2100}
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
        <div className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading payments...
            </div>
          ) : (
            <PaymentTable
              payments={payments}
              page={page}
              limit={LIMIT}
              onEdit={handleEdit}
            />
          )}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setPage(p)}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
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

      {/* Payment form modal */}
      <PaymentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        payment={editingPayment}
      />
    </div>
  );
}
