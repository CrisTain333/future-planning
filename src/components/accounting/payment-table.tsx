"use client";

import { useState } from "react";
import { IPayment, IUser } from "@/types";
import { Table, Button } from "antd";
import type { TableProps } from "antd";
import { Eye, PencilIcon } from "lucide-react";
import { PaymentDetailModal } from "./payment-detail-modal";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface PaymentTableProps {
  payments: IPayment[];
  page: number;
  limit: number;
  onEdit: (payment: IPayment) => void;
}

export function PaymentTable({
  payments,
  page,
  limit,
  onEdit,
}: PaymentTableProps) {
  const [viewPayment, setViewPayment] = useState<IPayment | null>(null);
  const getUserName = (userId: string | IUser) =>
    typeof userId === "object" ? userId.fullName : userId;

  const getApprovedByName = (approvedBy: string | IUser) =>
    typeof approvedBy === "object" ? approvedBy.fullName : approvedBy;

  const columns: TableProps<IPayment>['columns'] = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Member Name',
      key: 'memberName',
      className: "font-medium",
      render: (_, record) => (
        <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setViewPayment(record)}>
          {getUserName(record.userId)}
        </span>
      ),
    },
    {
      title: 'Month',
      key: 'month',
      render: (_, record) => `${MONTH_NAMES[record.month - 1]} ${record.year}`,
    },
    {
      title: 'Amount (BDT)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => amount.toLocaleString(),
    },
    {
      title: 'Penalty',
      key: 'penalty',
      render: (_, record) => record.penalty > 0 ? (
        <span className="text-destructive">
          {record.penalty.toLocaleString()}
        </span>
      ) : "0",
    },
    {
      title: 'Recorded By',
      key: 'approvedBy',
      render: (_, record) => getApprovedByName(record.approvedBy),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr) => new Date(dateStr).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <>
          <Button
            type="text"
            icon={<Eye className="h-4 w-4 text-primary" />}
            onClick={() => setViewPayment(record)}
            title="View details"
          />
          <Button
            type="text"
            icon={<PencilIcon className="h-4 w-4" />}
            onClick={() => onEdit(record)}
          />
        </>
      ),
    },
  ];

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="_id"
          pagination={false}
          locale={{ emptyText: <span className="text-muted-foreground">No payments found.</span> }}
        />
      </div>

      {/* Mobile card layout */}
      <div className="flex flex-col gap-3 md:hidden">
        {payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No payments found.
          </p>
        ) : (
          payments.map((payment, index) => (
            <div
              key={payment._id}
              className="rounded-lg border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {(page - 1) * limit + index + 1}.{" "}
                  {getUserName(payment.userId)}
                </span>
                <Button
                  type="text"
                  icon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => onEdit(payment)}
                />
              </div>
              <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                <span>
                  Month: {MONTH_NAMES[payment.month - 1]} {payment.year}
                </span>
                <span>Amount: {payment.amount.toLocaleString()} BDT</span>
                {payment.penalty > 0 && (
                  <span className="text-destructive">
                    Penalty: {payment.penalty.toLocaleString()}
                  </span>
                )}
                <span>
                  Date: {new Date(payment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <PaymentDetailModal
        open={viewPayment !== null}
        onClose={() => setViewPayment(null)}
        payment={viewPayment}
      />
    </>
  );
}
