"use client";

import { IPayment, IUser } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";

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
  const getUserName = (userId: string | IUser) =>
    typeof userId === "object" ? userId.fullName : userId;

  const getApprovedByName = (approvedBy: string | IUser) =>
    typeof approvedBy === "object" ? approvedBy.fullName : approvedBy;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Member Name</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Amount (BDT)</TableHead>
              <TableHead>Penalty</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment, index) => (
                <TableRow key={payment._id}>
                  <TableCell>{(page - 1) * limit + index + 1}</TableCell>
                  <TableCell className="font-medium">
                    {getUserName(payment.userId)}
                  </TableCell>
                  <TableCell>
                    {MONTH_NAMES[payment.month - 1]} {payment.year}
                  </TableCell>
                  <TableCell>{payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {payment.penalty > 0 ? (
                      <span className="text-destructive">
                        {payment.penalty.toLocaleString()}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>{getApprovedByName(payment.approvedBy)}</TableCell>
                  <TableCell>
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(payment)}
                    >
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(payment)}
                >
                  <PencilIcon />
                </Button>
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

    </>
  );
}
