"use client";

import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/settings-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Modal, Input } from "antd";
import toast from "react-hot-toast";
import { CalendarDays, CheckCircle, XCircle, Ban, Lock } from "lucide-react";

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface MonthEntry {
  month: number;
  year: number;
}

function generateMonths(startMonth: number, startYear: number): MonthEntry[] {
  const months: MonthEntry[] = [];
  const now = new Date();
  const endYear = now.getFullYear() + 1;
  const endMonth = now.getMonth() + 1;

  let m = startMonth, y = startYear;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ month: m, year: y });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function groupByYear(months: MonthEntry[]): Record<number, MonthEntry[]> {
  const groups: Record<number, MonthEntry[]> = {};
  for (const mo of months) {
    if (!groups[mo.year]) groups[mo.year] = [];
    groups[mo.year].push(mo);
  }
  return groups;
}

export default function CollectionCalendarPage() {
  const { data, isLoading } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const settings = data?.data;
  if (!settings) return null;

  const skippedMonths = settings.skippedMonths || [];
  const allMonths = generateMonths(settings.startMonth, settings.startYear);
  const yearGroups = groupByYear(allMonths);
  const years = Object.keys(yearGroups).map(Number).sort();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isSkipped = (mo: MonthEntry) =>
    skippedMonths.some(s => s.month === mo.month && s.year === mo.year);

  const getSkipReason = (mo: MonthEntry) =>
    skippedMonths.find(s => s.month === mo.month && s.year === mo.year)?.reason;

  const isPast = (mo: MonthEntry) =>
    mo.year < currentYear || (mo.year === currentYear && mo.month < currentMonth);

  const isCurrent = (mo: MonthEntry) =>
    mo.month === currentMonth && mo.year === currentYear;

  const handleSkip = (mo: MonthEntry) => {
    Modal.confirm({
      title: `Skip ${MONTH_NAMES_FULL[mo.month - 1]} ${mo.year}?`,
      content: (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            No payments will be expected from any member for this month.
          </p>
          <Input placeholder="Reason (e.g., Ramadan, Eid holiday)" id="skip-reason" />
        </div>
      ),
      okText: "Skip Month",
      okButtonProps: { danger: true },
      onOk: async () => {
        const reason = (document.getElementById("skip-reason") as HTMLInputElement)?.value || "";
        const updated = [...skippedMonths, { month: mo.month, year: mo.year, ...(reason ? { reason } : {}) }];
        await updateSettings({ skippedMonths: updated }).unwrap();
        toast.success(`${MONTH_NAMES_FULL[mo.month - 1]} ${mo.year} marked as skipped`);
      },
    });
  };

  const handleUnskip = (mo: MonthEntry) => {
    Modal.confirm({
      title: `Resume ${MONTH_NAMES_FULL[mo.month - 1]} ${mo.year}?`,
      content: "Members will be expected to pay for this month again.",
      okText: "Resume Collection",
      onOk: async () => {
        const updated = skippedMonths.filter(s => !(s.month === mo.month && s.year === mo.year));
        await updateSettings({ skippedMonths: updated }).unwrap();
        toast.success(`${MONTH_NAMES_FULL[mo.month - 1]} ${mo.year} collection resumed`);
      },
    });
  };

  const totalActive = allMonths.filter(mo => !isSkipped(mo)).length;
  const totalSkipped = skippedMonths.length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Collection Calendar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage which months require member contributions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Months</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMonths.length}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalActive}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skipped</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalSkipped}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{((totalActive > 0 ? settings.initialAmount + (totalActive - 1) * settings.monthlyAmount : 0) * 12).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">for all members</p>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-400" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary border-2 border-primary" />
            <span>Current month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-300" />
            <span>Upcoming — click to skip</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
            <span>Skipped — click to resume</span>
          </div>
        </div>
      </div>

      {/* Year Cards */}
      {years.map(year => (
        <div key={year} className="glass-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/20">
            <h2 className="text-lg font-bold">{year}</h2>
            <p className="text-xs text-muted-foreground">
              {yearGroups[year].filter(mo => isSkipped(mo)).length} skipped of {yearGroups[year].length} months
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {yearGroups[year].map(mo => {
                const skipped = isSkipped(mo);
                const reason = getSkipReason(mo);
                const past = isPast(mo);
                const current = isCurrent(mo);

                // Past months are locked (not clickable) unless skipped
                const locked = past && !skipped;

                return (
                  <div
                    key={`${mo.month}-${mo.year}`}
                    onClick={() => {
                      if (locked) return;
                      skipped ? handleUnskip(mo) : handleSkip(mo);
                    }}
                    className={`
                      relative rounded-xl p-4 transition-all duration-200 border-2 text-center
                      ${locked ? "cursor-default opacity-80" : "cursor-pointer hover:shadow-lg hover:-translate-y-1"}
                      ${skipped
                        ? "bg-red-50 border-red-300 hover:bg-red-100"
                        : current
                          ? "bg-primary/20 border-primary ring-2 ring-primary/40 shadow-md"
                          : past
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-blue-50 border-blue-300 hover:bg-blue-100"
                      }
                    `}
                  >
                    {locked && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock className="h-3 w-3 text-emerald-500" />
                      </div>
                    )}
                    <div className={`text-lg font-bold ${
                      skipped ? "text-red-400 line-through"
                        : current ? "text-primary"
                        : past ? "text-emerald-700"
                        : "text-blue-700"
                    }`}>
                      {MONTH_NAMES_SHORT[mo.month - 1]}
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      skipped ? "text-red-400" : past ? "text-emerald-600" : "text-muted-foreground"
                    }`}>
                      {MONTH_NAMES_FULL[mo.month - 1]}
                    </div>

                    {skipped && (
                      <Badge variant="destructive" className="mt-2 text-[10px] px-1.5 py-0">
                        Skipped
                      </Badge>
                    )}
                    {skipped && reason && (
                      <p className="text-[10px] text-red-400 mt-1 truncate" title={reason}>
                        {reason}
                      </p>
                    )}
                    {!skipped && current && (
                      <Badge className="mt-2 text-[10px] px-1.5 py-0 bg-primary text-white">
                        Current
                      </Badge>
                    )}
                    {!skipped && past && (
                      <div className="mt-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                      </div>
                    )}
                    {!skipped && !current && !past && (
                      <p className="text-[10px] text-blue-500 mt-2 font-medium">Upcoming</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Skipped Months Summary */}
      {totalSkipped > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-white/20">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Skipped Months Summary
            </h2>
          </div>
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">#</th>
                    <th className="text-left p-2 font-medium">Month</th>
                    <th className="text-left p-2 font-medium">Reason</th>
                    <th className="text-right p-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedMonths
                    .sort((a, b) => a.year - b.year || a.month - b.month)
                    .map((s, i) => (
                    <tr key={`${s.month}-${s.year}`} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium">{MONTH_NAMES_FULL[s.month - 1]} {s.year}</td>
                      <td className="p-2 text-muted-foreground">{s.reason || "—"}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => handleUnskip({ month: s.month, year: s.year })}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Resume
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
