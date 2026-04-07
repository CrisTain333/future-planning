"use client";

import { useState } from "react";
import { useGetInvestmentAnalyticsQuery } from "@/store/investments-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const FD_COLORS = [
  "hsl(181, 87%, 31%)",
  "#22d3ee",
  "#f59e0b",
  "#a78bfa",
  "#f472b6",
  "#34d399",
];

export function AnalyticsTab() {
  const { data, isLoading } = useGetInvestmentAnalyticsQuery();
  const [growthFilter, setGrowthFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) return null;

  const { perFD, dailyGrowth, growthChart } = analytics;
  const activeFDs = perFD.filter((fd) => fd.daysRemaining > 0);

  // Build line keys for per-FD chart
  const fdLineKeys = activeFDs.map((fd, i) => ({
    key: fd.id,
    name: fd.bankName,
    color: FD_COLORS[i % FD_COLORS.length],
  }));

  // Daily growth table columns
  const dailyColumns: ColumnsType<(typeof dailyGrowth)[0]> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Fund Value",
      dataIndex: "fundValue",
      key: "fundValue",
      render: (v: number) => (
        <span className="font-medium">৳{v.toLocaleString()}</span>
      ),
    },
    {
      title: "Daily Gain",
      dataIndex: "dailyGain",
      key: "dailyGain",
      render: (v: number) => (
        <span className="text-emerald-500">+৳{v.toLocaleString()}</span>
      ),
    },
    {
      title: "Cumulative Interest",
      dataIndex: "cumulativeInterest",
      key: "cumulativeInterest",
      render: (v: number) => `৳${v.toLocaleString()}`,
    },
    {
      title: "Growth %",
      dataIndex: "growthPercent",
      key: "growthPercent",
      render: (v: number) => (
        <span className="text-emerald-500">+{v.toFixed(3)}%</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Per-FD Growth Comparison */}
      {growthChart.length > 0 && fdLineKeys.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Per-FD Growth Comparison
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Each FD&apos;s value over time · Hover for details
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `৳${Number(value).toLocaleString()}`,
                      name,
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Legend />
                  {fdLineKeys.map((fd) => (
                    <Line
                      key={fd.key}
                      type="monotone"
                      dataKey={fd.key}
                      name={fd.name}
                      stroke={fd.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interest Breakdown + Maturity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interest Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Interest Breakdown by FD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {perFD.map((fd, i) => (
              <div key={fd.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{fd.bankName}</span>
                  <span className="text-emerald-500">
                    ৳{fd.interestEarned.toLocaleString()} earned
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fd.progressPercent}%`,
                      background: FD_COLORS[i % FD_COLORS.length],
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>
                    {fd.progressPercent}% of projected ৳
                    {fd.projectedInterest.toLocaleString()}
                  </span>
                  <span>{fd.daysRemaining} days left</span>
                </div>
              </div>
            ))}
            {perFD.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No fixed deposits to show
              </p>
            )}
          </CardContent>
        </Card>

        {/* Maturity Timeline */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Maturity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-5">
              {/* Timeline line */}
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-border" />

              {perFD
                .filter((fd) => fd.daysRemaining > 0)
                .sort(
                  (a, b) =>
                    new Date(a.maturityDate).getTime() -
                    new Date(b.maturityDate).getTime()
                )
                .map((fd, i) => {
                  const years = Math.floor(fd.daysRemaining / 365);
                  const months = Math.floor((fd.daysRemaining % 365) / 30);
                  const timeLabel =
                    years > 0
                      ? `${years} year${years !== 1 ? "s" : ""}${months > 0 ? `, ${months} month${months !== 1 ? "s" : ""}` : ""} away`
                      : `${months > 0 ? `${months} month${months !== 1 ? "s" : ""}` : `${fd.daysRemaining} days`} away`;

                  return (
                    <div key={fd.id} className="relative mb-6 last:mb-0">
                      <div
                        className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-background"
                        style={{
                          background: FD_COLORS[i % FD_COLORS.length],
                        }}
                      />
                      <p
                        className="text-xs font-semibold"
                        style={{ color: FD_COLORS[i % FD_COLORS.length] }}
                      >
                        {dayjs(fd.maturityDate).format("DD MMM YYYY")}
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {fd.bankName} matures
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ৳{fd.principalAmount.toLocaleString()} → ৳
                        {fd.maturityAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-amber-500 mt-0.5">
                        {timeLabel}
                      </p>
                    </div>
                  );
                })}

              {/* Total returns summary */}
              {perFD.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2 border-background bg-amber-500" />
                  <p className="text-xs font-semibold text-amber-500">
                    All Matured
                  </p>
                  <p className="text-sm font-medium mt-0.5">Total returns</p>
                  <p className="text-xs text-muted-foreground">
                    ৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.principalAmount, 0)
                      .toLocaleString()}{" "}
                    invested → ৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.maturityAmount, 0)
                      .toLocaleString()}{" "}
                    returned
                  </p>
                  <p className="text-xs text-emerald-500 mt-0.5">
                    +৳
                    {perFD
                      .reduce((sum, fd) => sum + fd.projectedInterest, 0)
                      .toLocaleString()}{" "}
                    total interest
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Growth Log */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Daily Growth Log</CardTitle>
          <p className="text-xs text-muted-foreground">
            Day-by-day fund value changes (last 30 days)
          </p>
        </CardHeader>
        <CardContent>
          <Table
            columns={dailyColumns}
            dataSource={[...dailyGrowth].reverse()}
            rowKey="date"
            pagination={{ pageSize: 10, size: "small" }}
            size="small"
          />
        </CardContent>
      </Card>
    </div>
  );
}
