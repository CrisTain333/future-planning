"use client";

import { useGetAnalyticsSummaryQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function FundProjection() {
  const { data, isLoading } = useGetAnalyticsSummaryQuery();

  if (isLoading) return <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;

  const projection = data?.data?.projection || [];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Fund Projection</CardTitle>
        <p className="text-xs text-muted-foreground">Projected vs actual fund growth (if all members pay on time)</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={11} tickLine={false} />
              <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [`৳${Number(value).toLocaleString()}`, ""]} />
              <Legend />
              <Line type="monotone" dataKey="projected" name="Projected" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="hsl(181, 87%, 31%)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
