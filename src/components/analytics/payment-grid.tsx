"use client";

import { useMemo } from "react";
import { useGetPaymentGridQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3, Users, Calendar, TrendingUp } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; ring: string; label: string }> = {
  paid: {
    bg: "bg-emerald-500 shadow-emerald-500/30",
    ring: "ring-emerald-400/50",
    label: "Paid",
  },
  paid_penalty: {
    bg: "bg-amber-500 shadow-amber-500/30",
    ring: "ring-amber-400/50",
    label: "Paid (Penalty)",
  },
  unpaid: {
    bg: "bg-rose-400 shadow-rose-400/20",
    ring: "ring-rose-300/40",
    label: "Unpaid",
  },
  skipped: {
    bg: "bg-slate-300/70",
    ring: "ring-slate-300/30",
    label: "Skipped",
  },
};

const LEGEND_ITEMS = [
  { key: "paid", color: "bg-emerald-500", label: "Paid" },
  { key: "paid_penalty", color: "bg-amber-500", label: "Penalty" },
  { key: "unpaid", color: "bg-rose-400", label: "Unpaid" },
  { key: "skipped", color: "bg-slate-300/70", label: "Skipped" },
];

export function PaymentGrid() {
  const { data, isLoading } = useGetPaymentGridQuery();

  const gridData = data?.data;

  const stats = useMemo(() => {
    if (!gridData) return null;
    const total = gridData.grid.length * gridData.months.length;
    const paid = gridData.grid.reduce(
      (acc, row) => acc + row.cells.filter((c) => c === "paid" || c === "paid_penalty").length,
      0
    );
    const rate = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, rate };
  }, [gridData]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!gridData || !stats) return null;

  return (
    <Card className="glass-card overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2.5 tracking-tight">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Grid3X3 className="h-4 w-4 text-primary" />
            </div>
            Payment Status Grid
          </CardTitle>
          <div className="flex items-center gap-4 text-[11px]">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-[3px] ${item.color}`} />
                <span className="text-muted-foreground font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Grid table */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sticky left-0 z-10 bg-muted/30 backdrop-blur-md min-w-[130px] md:min-w-[160px] border-r border-border/40">
                  Member
                </th>
                {gridData.months.map((mo) => (
                  <th
                    key={`${mo.month}-${mo.year}`}
                    className="py-2.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-center text-muted-foreground whitespace-nowrap min-w-[40px] md:min-w-[48px]"
                  >
                    <span className="hidden md:inline">{mo.label}</span>
                    <span className="md:hidden text-[10px]">
                      {mo.label.replace(" ", "\n").split("\n")[0]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {gridData.grid.map((row, rowIdx) => (
                <tr
                  key={row.memberId}
                  className={`transition-colors duration-150 hover:bg-primary/[0.04] ${
                    rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted/15"
                  }`}
                >
                  <td className="py-2.5 px-4 text-[13px] font-medium sticky left-0 z-10 backdrop-blur-md border-r border-border/40 truncate max-w-[160px] bg-background/90">
                    <span className="hidden md:inline">{row.name}</span>
                    <span className="md:hidden">{row.name.split(" ")[0]}</span>
                  </td>
                  {row.cells.map((cell, i) => {
                    const cfg = STATUS_CONFIG[cell];
                    return (
                      <td key={i} className="py-2 px-1 text-center">
                        <div
                          className={`w-[22px] h-[22px] md:w-[26px] md:h-[26px] rounded-md mx-auto shadow-sm transition-all duration-200 hover:scale-[1.3] hover:shadow-md hover:ring-2 ${cfg.bg} ${cfg.ring} cursor-default`}
                          title={`${row.name} — ${gridData.months[i].label}: ${cfg.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-5 py-3.5 border-t border-border/40 bg-muted/20 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium">{gridData.grid.length}</span> members
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">{gridData.months.length}</span> months
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="font-medium">{stats.paid}</span>
            <span>/ {stats.total} payments</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.rate}%` }}
              />
            </div>
            <span className="text-[11px] font-semibold text-foreground/80">{stats.rate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
