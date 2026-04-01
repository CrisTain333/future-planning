"use client";

import { useGetPaymentGridQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid3X3 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500",
  paid_penalty: "bg-amber-500",
  unpaid: "bg-red-400/40",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  paid_penalty: "Paid (Penalty)",
  unpaid: "Unpaid",
};

export function PaymentGrid() {
  const { data, isLoading } = useGetPaymentGridQuery();

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

  const gridData = data?.data;
  if (!gridData) return null;

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            Payment Status Grid
          </CardTitle>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-muted-foreground">Paid</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-muted-foreground">Penalty</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-400/40" />
              <span className="text-muted-foreground">Unpaid</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Scrollable container */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-t border-b border-white/20">
                <th className="text-left py-2.5 px-3 font-semibold sticky left-0 z-10 bg-white/90 backdrop-blur-md min-w-[110px] md:min-w-[140px] border-r border-white/20">
                  Member
                </th>
                {gridData.months.map((mo) => (
                  <th
                    key={`${mo.month}-${mo.year}`}
                    className="py-2.5 px-0.5 font-medium text-center text-muted-foreground whitespace-nowrap min-w-[36px] md:min-w-[44px]"
                  >
                    <span className="hidden md:inline">{mo.label}</span>
                    <span className="md:hidden">{mo.label.replace(" ", "\n").split("\n")[0]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.grid.map((row, rowIdx) => (
                <tr
                  key={row.memberId}
                  className={`border-b border-white/10 transition-colors hover:bg-white/30 ${
                    rowIdx % 2 === 0 ? "" : "bg-white/5"
                  }`}
                >
                  <td className="py-2 px-3 font-medium sticky left-0 z-10 bg-white/90 backdrop-blur-md border-r border-white/20 truncate max-w-[140px]">
                    <span className="hidden md:inline">{row.name}</span>
                    <span className="md:hidden">{row.name.split(" ")[0]}</span>
                  </td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="py-1.5 px-0.5 text-center">
                      <div
                        className={`w-5 h-5 md:w-6 md:h-6 rounded-sm mx-auto transition-transform hover:scale-125 cursor-default ${STATUS_COLORS[cell]}`}
                        title={`${row.name} — ${gridData.months[i].label}: ${STATUS_LABELS[cell]}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-4 py-3 border-t border-white/20 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>{gridData.grid.length} members</span>
          <span>{gridData.months.length} months</span>
          <span>
            {gridData.grid.reduce((acc, row) => acc + row.cells.filter(c => c === "paid" || c === "paid_penalty").length, 0)} / {gridData.grid.length * gridData.months.length} payments
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
