"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface FundGrowthEntry {
  month: number;
  year: number;
  total: number;
}

interface FundLineChartProps {
  data: FundGrowthEntry[];
}

export function FundLineChart({ data }: FundLineChartProps) {
  const chartData = data.map((entry) => ({
    label: `${MONTHS[entry.month - 1]} '${String(entry.year).slice(-2)}`,
    total: entry.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Fund Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v.toLocaleString()}`} />
              <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, "Total Fund"]} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(153, 50%, 40%)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
