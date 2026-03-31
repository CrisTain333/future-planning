"use client";

import { useGetCollectionRateQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

export function CollectionRateChart() {
  const { data, isLoading } = useGetCollectionRateQuery();

  if (isLoading) return <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-[300px] w-full" /></CardContent></Card>;

  const chartData = data?.data || [];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Monthly Collection Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="paid" name="Members Paid" fill="hsl(181, 87%, 31%)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="rate" name="Collection Rate %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
