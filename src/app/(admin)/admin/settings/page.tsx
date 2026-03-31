"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/settings-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

  const { register, handleSubmit, reset } = useForm<SettingsForm>();

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
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Application Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foundation Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="foundationName">Foundation Name</Label>
              <Input id="foundationName" {...register("foundationName")} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyAmount">Monthly Amount (BDT)</Label>
                <Input id="monthlyAmount" type="number" {...register("monthlyAmount")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialAmount">Initial Amount (BDT)</Label>
                <Input id="initialAmount" type="number" {...register("initialAmount")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startMonth">Start Month</Label>
                <select
                  id="startMonth"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("startMonth")}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startYear">Start Year</Label>
                <Input id="startYear" type="number" {...register("startYear")} />
              </div>
            </div>

            <Button type="submit" disabled={updating}>
              {updating ? "Saving..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
