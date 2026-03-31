"use client";

import { useGetAnalyticsSummaryQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingDown, Banknote } from "lucide-react";

export function OutstandingSummary() {
  const { data, isLoading } = useGetAnalyticsSummaryQuery();

  if (isLoading) return <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>;

  const summary = data?.data;
  if (!summary) return null;

  const collectionRate = summary.totalExpected > 0
    ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">৳{summary.totalOutstanding.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{summary.membersWithOutstanding} members have dues</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Collection</CardTitle>
          <TrendingDown className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{collectionRate}%</div>
          <p className="text-xs text-muted-foreground">৳{summary.totalCollected.toLocaleString()} of ৳{summary.totalExpected.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Penalty Revenue</CardTitle>
          <Banknote className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">৳{summary.totalPenaltyRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From late payments</p>
        </CardContent>
      </Card>
    </div>
  );
}
