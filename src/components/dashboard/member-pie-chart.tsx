"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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
  "hsl(10, 70%, 55%)",
  "hsl(130, 45%, 50%)",
  "hsl(250, 55%, 60%)",
  "hsl(80, 55%, 45%)",
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
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Member Contribution Share</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Pie chart */}
          <div className="h-[250px] w-full md:w-1/2 min-w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`৳${Number(value).toLocaleString()}`, name]}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div className="w-full md:w-1/2 max-h-[250px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-1.5">
              {data.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="truncate flex-1">{entry.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    {entry.percentage}%
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    ৳{entry.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
