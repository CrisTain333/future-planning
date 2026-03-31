"use client";

import { useGetPaymentGridQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500/80",
  paid_penalty: "bg-amber-500/80",
  unpaid: "bg-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  paid_penalty: "Paid (Penalty)",
  unpaid: "Unpaid",
};

export function PaymentGrid() {
  const { data, isLoading } = useGetPaymentGridQuery();

  if (isLoading) return <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

  const gridData = data?.data;
  if (!gridData) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Payment Status Grid</CardTitle>
        <div className="flex gap-4 text-xs mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-500/80" /> Paid</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/80" /> Paid (Penalty)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500/30" /> Unpaid</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 font-medium sticky left-0 bg-white/80 backdrop-blur-sm min-w-[120px]">Member</th>
                {gridData.months.map((mo) => (
                  <th key={`${mo.month}-${mo.year}`} className="p-1 font-medium text-center whitespace-nowrap">
                    {mo.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.grid.map((row) => (
                <tr key={row.memberId} className="border-t border-white/10">
                  <td className="p-2 font-medium sticky left-0 bg-white/80 backdrop-blur-sm">{row.name}</td>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="p-1 text-center">
                      <div
                        className={`w-6 h-6 rounded mx-auto ${STATUS_COLORS[cell]}`}
                        title={`${row.name} - ${gridData.months[i].label}: ${STATUS_LABELS[cell]}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
