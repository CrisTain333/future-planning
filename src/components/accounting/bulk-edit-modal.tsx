"use client";

import { useState } from "react";
import { IPayment } from "@/types";
import { useUpdatePaymentMutation } from "@/store/payments-api";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button, Checkbox } from "antd";

const MONTH_OPTIONS = [
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

interface BulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPayments: IPayment[];
  onComplete: () => void;
}

export function BulkEditModal({
  open,
  onOpenChange,
  selectedPayments,
  onComplete,
}: BulkEditModalProps) {
  const [updatePayment] = useUpdatePaymentMutation();

  const [applyMonth, setApplyMonth] = useState(false);
  const [applyYear, setApplyYear] = useState(false);
  const [applyAmount, setApplyAmount] = useState(false);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [amount, setAmount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanges = applyMonth || applyYear || applyAmount;

  const handleSubmit = async () => {
    if (!hasChanges) return;

    const body: Record<string, number> = {};
    if (applyMonth) body.month = month;
    if (applyYear) body.year = year;
    if (applyAmount) body.amount = amount;

    setIsSubmitting(true);
    let successCount = 0;
    const failures: string[] = [];

    for (const payment of selectedPayments) {
      try {
        await updatePayment({ id: payment._id, body }).unwrap();
        successCount++;
      } catch (err: unknown) {
        const message = (err as { data?: { error?: string } })?.data?.error;
        const memberName =
          payment.userId && typeof payment.userId === "object"
            ? (payment.userId as { fullName: string }).fullName
            : "Unknown";
        failures.push(message || `Failed to update payment for ${memberName}`);
      }
    }

    setIsSubmitting(false);

    if (failures.length === 0) {
      toast.success(`Updated ${successCount} record${successCount !== 1 ? "s" : ""} successfully`);
    } else {
      toast.success(`Updated ${successCount} of ${selectedPayments.length} records`);
      failures.forEach((msg) => toast.error(msg));
    }

    setApplyMonth(false);
    setApplyYear(false);
    setApplyAmount(false);
    onOpenChange(false);
    onComplete();
  };

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">Bulk Edit</h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Apply changes to {selectedPayments.length} selected record{selectedPayments.length !== 1 ? "s" : ""}. Toggle on the fields you want to change.
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <div className="space-y-4 mt-4">
        {/* Month */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox checked={applyMonth} onChange={(e) => setApplyMonth(e.target.checked)} />
            <label className="text-sm font-medium">Month</label>
          </div>
          {applyMonth && (
            <Select
              className="w-full"
              value={month}
              onChange={(val: number) => setMonth(val)}
              options={MONTH_OPTIONS}
            />
          )}
        </div>

        {/* Year */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox checked={applyYear} onChange={(e) => setApplyYear(e.target.checked)} />
            <label className="text-sm font-medium">Year</label>
          </div>
          {applyYear && (
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min={2020}
              max={2100}
            />
          )}
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Checkbox checked={applyAmount} onChange={(e) => setApplyAmount(e.target.checked)} />
            <label className="text-sm font-medium">Amount (BDT)</label>
          </div>
          {applyAmount && (
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={0}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!hasChanges}
          >
            Apply to {selectedPayments.length} Record{selectedPayments.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
