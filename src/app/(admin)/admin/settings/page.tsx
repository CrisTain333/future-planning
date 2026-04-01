"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/settings-api";
import { Input, Button, Select } from "antd";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";

const MONTHS = [
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

interface SettingsForm {
  foundationName: string;
  monthlyAmount: number;
  initialAmount: number;
  startMonth: number;
  startYear: number;
}

export default function SettingsPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: updating }] = useUpdateSettingsMutation();

  const { control, handleSubmit, reset, watch, setValue } = useForm<SettingsForm>();

  useEffect(() => {
    if (data?.data) {
      reset({
        foundationName: data.data.foundationName,
        monthlyAmount: data.data.monthlyAmount,
        initialAmount: data.data.initialAmount,
        startMonth: data.data.startMonth,
        startYear: data.data.startYear,
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData: SettingsForm) => {
    try {
      await updateSettings({
        ...formData,
        monthlyAmount: Number(formData.monthlyAmount),
        initialAmount: Number(formData.initialAmount),
        startMonth: Number(formData.startMonth),
        startYear: Number(formData.startYear),
      }).unwrap();
      toast.success("Settings updated successfully");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Application Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure foundation details and contribution amounts
        </p>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-lg font-semibold">Foundation Configuration</h2>
          <p className="text-sm text-muted-foreground">These settings affect payments and receipts</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="foundationName">Foundation Name</label>
            <Controller
              name="foundationName"
              control={control}
              render={({ field }) => (
                <Input id="foundationName" {...field} />
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="monthlyAmount">Monthly Amount (BDT)</label>
              <Controller
                name="monthlyAmount"
                control={control}
                render={({ field }) => (
                  <Input id="monthlyAmount" type="number" {...field} />
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="initialAmount">Initial Amount (BDT)</label>
              <Controller
                name="initialAmount"
                control={control}
                render={({ field }) => (
                  <Input id="initialAmount" type="number" {...field} />
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="startMonth">Start Month</label>
              <Select
                id="startMonth"
                className="w-full"
                value={watch("startMonth")}
                onChange={(val) => setValue("startMonth", val)}
                options={MONTHS}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="startYear">Start Year</label>
              <Controller
                name="startYear"
                control={control}
                render={({ field }) => (
                  <Input id="startYear" type="number" {...field} />
                )}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="primary" htmlType="submit" className="glow-primary" loading={updating}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
