"use client";

import { useEffect, useState } from "react";
import { IPayment, IUser } from "@/types";
import {
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from "@/store/payments-api";
import { useGetUsersQuery } from "@/store/users-api";
import { useGetSettingsQuery } from "@/store/settings-api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Payment" : "Record Payment"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the payment details below."
              : "Fill in the details to record a new payment."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member select */}
          <div className="space-y-1.5">
            <Label htmlFor="member">Member</Label>
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
                value={userId}
                onValueChange={(val) => setUserId(val as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: IUser) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="month">Month</Label>
              {isEdit ? (
                <Input
                  value={MONTH_OPTIONS[payment.month - 1]?.label}
                  disabled
                />
              ) : (
                <Select
                  value={month}
                  onValueChange={(val) => setMonth(val as number)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
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
            <Label htmlFor="amount">Amount (BDT)</Label>
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
            <Label htmlFor="penalty">Penalty (BDT)</Label>
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
              <Label htmlFor="penaltyReason">Penalty Reason</Label>
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
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? "Updating..."
                  : "Recording..."
                : isEdit
                  ? "Update Payment"
                  : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
