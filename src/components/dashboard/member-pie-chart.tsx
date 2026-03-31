"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "hsl(153, 50%, 40%)",
  "hsl(200, 60%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(35, 80%, 55%)",
  "hsl(350, 60%, 55%)",
  "hsl(170, 50%, 45%)",
  "hsl(220, 55%, 50%)",
  "hsl(60, 60%, 45%)",
];

interface MemberShareEntry {
  name: string;
  total: number;
  percentage: number;
}

interface MemberPieChartProps {
  data: MemberShareEntry[];
}

export function MemberPieChart({ data }: MemberPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Contribution Share</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`৳${value.toLocaleString()}`, "Total"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
