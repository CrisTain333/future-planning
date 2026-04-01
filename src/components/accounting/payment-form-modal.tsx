"use client";

import { useEffect, useState } from "react";
import { IPayment, IUser } from "@/types";
import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from "@/store/payments-api";
import { useGetUsersQuery } from "@/store/users-api";
import { useGetSettingsQuery } from "@/store/settings-api";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button } from "antd";

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

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: IPayment | null;
}

export function PaymentFormModal({
  open,
  onOpenChange,
  payment,
}: PaymentFormModalProps) {
  const isEdit = !!payment;

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const { data: settingsData } = useGetSettingsQuery();
  const [createPayment, { isLoading: isCreating }] =
    useCreatePaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] =
    useUpdatePaymentMutation();

  const users = usersData?.data ?? [];
  const settings = settingsData?.data;

  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [amount, setAmount] = useState<number>(0);
  const [penalty, setPenalty] = useState<number>(0);
  const [penaltyReason, setPenaltyReason] = useState("");
  const [note, setNote] = useState("");

  // Pre-fill amount based on settings when month/year change
  useEffect(() => {
    if (isEdit) return;
    if (!settings) return;
    if (
      month === settings.startMonth &&
      year === settings.startYear
    ) {
      setAmount(settings.initialAmount);
    } else {
      setAmount(settings.monthlyAmount);
    }
  }, [month, year, settings, isEdit]);

  // Populate form when editing
  useEffect(() => {
    if (payment) {
      const uid =
        typeof payment.userId === "object"
          ? payment.userId._id
          : payment.userId;
      setUserId(uid);
      setMonth(payment.month);
      setYear(payment.year);
      setAmount(payment.amount);
      setPenalty(payment.penalty);
      setPenaltyReason(payment.penaltyReason ?? "");
      setNote(payment.note ?? "");
    } else {
      setUserId("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());
      setPenalty(0);
      setPenaltyReason("");
      setNote("");
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit) {
        await updatePayment({
          id: payment._id,
          body: { amount, penalty, penaltyReason, note },
        }).unwrap();
        toast.success("Payment updated successfully");
      } else {
        if (!userId) {
          toast.error("Please select a member");
          return;
        }
        await createPayment({
          userId,
          month,
          year,
          amount,
          penalty,
          penaltyReason,
          note,
        }).unwrap();
        toast.success("Payment recorded successfully");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "Failed to update payment" : "Failed to record payment");
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Payment" : "Record Payment"}</h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEdit
              ? "Update the payment details below."
              : "Fill in the details to record a new payment."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Member select */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="member">Member</label>
          {isEdit ? (
            <Input
              value={
                typeof payment.userId === "object"
                  ? payment.userId.fullName
                  : payment.userId
              }
              disabled
            />
          ) : (
            <Select
              className="w-full"
              value={userId || undefined}
              onChange={(val: string) => setUserId(val)}
              placeholder="Select a member"
              options={users.map((user: IUser) => ({
                label: user.fullName,
                value: user._id,
              }))}
            />
          )}
        </div>

        {/* Month & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="month">Month</label>
            {isEdit ? (
              <Input
                value={MONTH_OPTIONS[payment.month - 1]?.label}
                disabled
              />
            ) : (
              <Select
                className="w-full"
                value={month}
                onChange={(val: number) => setMonth(val)}
                placeholder="Month"
                options={MONTH_OPTIONS}
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="year">Year</label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={isEdit}
              min={2020}
              max={2100}
            />
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="amount">Amount (BDT)</label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={0}
            required
          />
        </div>

        {/* Penalty */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="penalty">Penalty (BDT)</label>
          <Input
            id="penalty"
            type="number"
            value={penalty}
            onChange={(e) => setPenalty(Number(e.target.value))}
            min={0}
          />
        </div>

        {/* Penalty reason - only visible when penalty > 0 */}
        {penalty > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="penaltyReason">Penalty Reason</label>
            <Input
              id="penaltyReason"
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
              placeholder="Reason for penalty"
            />
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="note">Note</label>
          <Input.TextArea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEdit ? "Update Payment" : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
