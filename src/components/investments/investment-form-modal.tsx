"use client";

import { useEffect, useState, useMemo } from "react";
import { IInvestment, IUser } from "@/types";
import {
  useCreateInvestmentMutation,
  useUpdateInvestmentMutation,
} from "@/store/investments-api";
import { useGetUsersQuery } from "@/store/users-api";
import toast from "react-hot-toast";
import { Modal, Select, Input, Button, DatePicker } from "antd";
import dayjs from "dayjs";

interface InvestmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: IInvestment | null;
}

export function InvestmentFormModal({
  open,
  onOpenChange,
  investment,
}: InvestmentFormModalProps) {
  const isEdit = !!investment;

  const { data: usersData } = useGetUsersQuery({ page: 1, limit: 100 });
  const [createInvestment, { isLoading: isCreating }] =
    useCreateInvestmentMutation();
  const [updateInvestment, { isLoading: isUpdating }] =
    useUpdateInvestmentMutation();

  const users = usersData?.data ?? [];

  const [bankName, setBankName] = useState("");
  const [principalAmount, setPrincipalAmount] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(0);
  const [compoundingFrequency, setCompoundingFrequency] = useState<
    "quarterly" | "monthly" | "yearly"
  >("quarterly");
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(dayjs());
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [memberContributions, setMemberContributions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (investment) {
      setBankName(investment.bankName);
      setPrincipalAmount(investment.principalAmount);
      setInterestRate(investment.interestRate);
      setCompoundingFrequency(investment.compoundingFrequency);
      setStartDate(dayjs(investment.startDate));
      setTenureMonths(investment.tenureMonths);
      setMemberContributions(
        investment.memberContributions.map((m) =>
          typeof m === "object" ? m._id : m
        )
      );
      setNotes(investment.notes ?? "");
    } else {
      setBankName("");
      setPrincipalAmount(0);
      setInterestRate(0);
      setCompoundingFrequency("quarterly");
      setStartDate(dayjs());
      setTenureMonths(12);
      setMemberContributions([]);
      setNotes("");
    }
  }, [investment, open]);

  // Live calculated preview
  const preview = useMemo(() => {
    if (!principalAmount || !interestRate || !startDate || !tenureMonths) {
      return null;
    }
    const n =
      compoundingFrequency === "quarterly"
        ? 4
        : compoundingFrequency === "monthly"
          ? 12
          : 1;
    const r = interestRate / 100;
    const t = tenureMonths / 12;
    const maturityAmount =
      Math.round(principalAmount * Math.pow(1 + r / n, n * t) * 100) / 100;
    const totalInterest = Math.round((maturityAmount - principalAmount) * 100) / 100;
    const maturityDate = startDate.add(tenureMonths, "month");

    return { maturityDate, maturityAmount, totalInterest };
  }, [principalAmount, interestRate, compoundingFrequency, startDate, tenureMonths]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bankName || !principalAmount || !interestRate || !startDate || !tenureMonths) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        bankName,
        principalAmount,
        interestRate,
        compoundingFrequency,
        startDate: startDate.toISOString(),
        tenureMonths,
        memberContributions,
        notes: notes || undefined,
      };

      if (isEdit) {
        await updateInvestment({
          id: investment._id,
          body: payload,
        }).unwrap();
        toast.success("Investment updated successfully");
      } else {
        await createInvestment(payload).unwrap();
        toast.success("Investment created successfully");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const message = (err as { data?: { error?: string } })?.data?.error;
      toast.error(
        message || (isEdit ? "Failed to update investment" : "Failed to create investment")
      );
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      title={
        <div>
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Fixed Deposit" : "Create Fixed Deposit"}
          </h2>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            {isEdit
              ? "Update the fixed deposit details below."
              : "Fill in the details to create a new fixed deposit."}
          </p>
        </div>
      }
      footer={null}
      destroyOnClose
      width={560}
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        {/* Bank Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Bank Name</label>
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g., XYZ Bank"
            required
          />
        </div>

        {/* Principal & Rate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Principal Amount (৳)</label>
            <Input
              type="number"
              value={principalAmount || ""}
              onChange={(e) => setPrincipalAmount(Number(e.target.value))}
              placeholder="150000"
              min={0}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Interest Rate (%)</label>
            <Input
              type="number"
              value={interestRate || ""}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              placeholder="9.5"
              min={0}
              step={0.1}
              required
            />
          </div>
        </div>

        {/* Start Date & Tenure */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Start Date</label>
            <DatePicker
              className="w-full"
              value={startDate}
              onChange={(date) => setStartDate(date)}
              format="DD MMM YYYY"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tenure (months)</label>
            <Input
              type="number"
              value={tenureMonths || ""}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              placeholder="36"
              min={1}
              required
            />
          </div>
        </div>

        {/* Compounding */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Compounding Frequency</label>
          <Select
            className="w-full"
            value={compoundingFrequency}
            onChange={(val) => setCompoundingFrequency(val)}
            options={[
              { value: "quarterly", label: "Quarterly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
            ]}
          />
        </div>

        {/* Contributing Members */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Contributing Members</label>
          <Select
            className="w-full"
            mode="multiple"
            value={memberContributions}
            onChange={(val) => setMemberContributions(val)}
            placeholder="Select members"
            options={users.map((user: IUser) => ({
              label: user.fullName,
              value: user._id,
            }))}
            optionFilterProp="label"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={2}
          />
        </div>

        {/* Calculated Preview */}
        {preview && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-primary">Calculated Preview</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maturity Date</span>
              <span>{preview.maturityDate.format("DD MMM YYYY")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Maturity Amount</span>
              <span className="font-semibold text-emerald-500">
                ৳{preview.maturityAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Interest</span>
              <span className="text-cyan-500">
                ৳{preview.totalInterest.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button htmlType="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {isEdit ? "Update FD" : "Create FD"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
