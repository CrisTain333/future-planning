"use client";

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
} from "recharts";
import { Banknote, TrendingUp, Wallet, Target } from "lucide-react";
import { useState } from "react";

export function OverviewTab() {
  const { data, isLoading } = useGetInvestmentAnalyticsQuery();
  const [timeRange, setTimeRange] = useState<"all" | "12" | "6" | "1">("all");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-6">
                <Skeleton className="h-[80px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="glass-card">
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const analytics = data?.data;
  if (!analytics) return null;

  const { summary, growthChart, perFD } = analytics;

  const filteredChart = (() => {
    if (timeRange === "all" || !growthChart.length) return growthChart;
    const months =
      timeRange === "12" ? 12 : timeRange === "6" ? 6 : 1;
    return growthChart.slice(-months);
  })();

  const summaryCards = [
    {
      title: "Total Invested",
      value: `৳${summary.totalInvested.toLocaleString()}`,
      subtitle: `Across ${summary.activeFDCount} active FD${summary.activeFDCount !== 1 ? "s" : ""}`,
      icon: Banknote,
      color: "text-primary",
    },
    {
      title: "Interest Earned",
      value: `৳${summary.totalInterestEarned.toLocaleString()}`,
      subtitle: "As of today",
      icon: TrendingUp,
      color: "text-cyan-500",
    },
    {
      title: "Current Value",
      value: `৳${summary.currentValue.toLocaleString()}`,
      subtitle:
        summary.totalInvested > 0
          ? `+${(((summary.currentValue - summary.totalInvested) / summary.totalInvested) * 100).toFixed(2)}% growth`
          : "",
      icon: Wallet,
      color: "text-foreground",
    },
    {
      title: "Projected at Maturity",
      value: `৳${summary.projectedMaturityValue.toLocaleString()}`,
      subtitle: "All FDs combined",
      icon: Target,
      color: "text-amber-500",
    },
  ];

  const activeFDs = perFD.filter((fd) => fd.daysRemaining > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Growth Chart */}
      {growthChart.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Combined Fund Growth</CardTitle>
                <p className="text-xs text-muted-foreground">
                  All active fixed deposits
                </p>
              </div>
              <div className="flex gap-1">
                {(["all", "12", "6", "1"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timeRange === range
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {range === "all"
                      ? "All Time"
                      : range === "12"
                        ? "1Y"
                        : range === "6"
                          ? "6M"
                          : "1M"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} tickLine={false} />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `৳${Number(value).toLocaleString()}`,
                      "Fund Value",
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    name="Total Value"
                    stroke="hsl(181, 87%, 31%)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Earnings + Active FDs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Earnings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Daily Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              ৳{summary.dailyEarnings.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Earning this much every day across all FDs
            </p>
            <div className="mt-4 pt-4 border-t space-y-2">
              {[
                { label: "Per hour", value: summary.hourlyEarnings },
                { label: "Per month", value: summary.monthlyEarnings },
                { label: "Per year", value: summary.yearlyEarnings },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>৳{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active FDs */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Active Fixed Deposits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeFDs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active fixed deposits
              </p>
            ) : (
              activeFDs.map((fd) => (
                <div
                  key={fd.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-semibold">{fd.bankName}</p>
                    <p className="text-xs text-muted-foreground">
                      ৳{fd.principalAmount.toLocaleString()} ·{" "}
                      {fd.daysRemaining} days left
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-500">
                      ৳{fd.currentValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +৳{fd.interestEarned.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
