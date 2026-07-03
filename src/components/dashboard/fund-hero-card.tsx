"use client";

import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface FundGrowthEntry {
  month: number;
  year: number;
  total: number;
}

interface FundHeroCardProps {
  data: FundGrowthEntry[];
}

export function FundHeroCard({ data }: FundHeroCardProps) {
  const currentTotal = data.length > 0 ? data[data.length - 1].total : 0;

  const baseline = data.length > 0 ? data[0].total : 0;
  const growthPct =
    data.length >= 2 && baseline > 0
      ? ((currentTotal - baseline) / baseline) * 100
      : null;
  const isPositive = growthPct !== null && growthPct >= 0;

  const chartData = data.map((entry) => ({
    label: `${MONTHS[entry.month - 1]} '${String(entry.year).slice(-2)}`,
    total: entry.total,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="relative overflow-hidden rounded-xl px-6 py-6 text-white shadow-lg ring-1 ring-white/10"
        style={{
          background:
            "linear-gradient(135deg, hsl(181 87% 31%) 0%, hsl(181 87% 22%) 100%)",
        }}
      >
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* Left: label + value + growth */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/80">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Total Fund Over Time
              </span>
            </div>
            <div className="text-4xl font-bold md:text-5xl">
              ৳{currentTotal.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              {growthPct !== null && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-medium">
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {isPositive ? "+" : ""}
                  {growthPct.toFixed(1)}%
                </span>
              )}
              <span>Cumulative fund across all members</span>
            </div>
          </div>

          {/* Right: sparkline trend */}
          <div className="h-16 w-full md:h-20 md:w-64">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 4, bottom: 4, left: 4 }}
                >
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "rgba(0,0,0,0.75)",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    formatter={(value) => [
                      `৳${Number(value).toLocaleString()}`,
                      "Total Fund",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: "#ffffff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-end text-xs text-white/60">
                Not enough data to show a trend yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
