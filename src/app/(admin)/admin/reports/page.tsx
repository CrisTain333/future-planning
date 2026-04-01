"use client";

import { useState } from "react";
import { useGetMonthlyReportQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "antd";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Users, CheckCircle, XCircle, TrendingUp } from "lucide-react";

const MONTHS = [
  { value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" },
  { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" },
  { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" },
];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useGetMonthlyReportQuery({ month, year });
  const report = data?.data;

  const handleExportPayments = () => {
    window.open("/api/analytics/export?type=payments", "_blank");
  };

  const handleExportMembers = () => {
    window.open("/api/analytics/export?type=members", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Monthly Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View detailed monthly collection reports and export data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportPayments} icon={<Download className="h-4 w-4" />}>
            Export Payments CSV
          </Button>
          <Button onClick={handleExportMembers} icon={<Download className="h-4 w-4" />}>
            Export Members CSV
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Month</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-white/50 px-3 py-2 text-sm"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Year</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="flex h-10 w-full sm:w-32 rounded-md border border-input bg-white/50 px-3 py-2 text-sm"
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
              <option value={2028}>2028</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : report?.isSkipped ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <p className="text-lg font-medium text-muted-foreground">Collection Skipped</p>
          <p className="text-sm text-muted-foreground mt-1">
            {report.skipReason ? `Reason: ${report.skipReason}` : "No collection was scheduled for this month"}
          </p>
        </div>
      ) : report ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalMembers}</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">{report.paidCount}</div>
                <p className="text-xs text-muted-foreground">of {report.totalMembers} members</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{report.unpaidCount}</div>
                <p className="text-xs text-muted-foreground">still pending</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.collectionRate}%</div>
                <p className="text-xs text-muted-foreground">৳{report.totalCollected.toLocaleString()} collected</p>
              </CardContent>
            </Card>
          </div>

          {/* Paid Members */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/20">
              <h2 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Paid Members ({report.paidCount})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Member</th>
                    <th className="text-left p-3 font-medium">Amount (BDT)</th>
                    <th className="text-left p-3 font-medium">Penalty</th>
                    <th className="text-left p-3 font-medium">Recorded By</th>
                    <th className="text-left p-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {report.paidMembers.map((m, i) => (
                    <tr key={i} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-medium">{m.name}</td>
                      <td className="p-3">৳{m.amount.toLocaleString()}</td>
                      <td className="p-3">{m.penalty > 0 ? <span className="text-amber-600">৳{m.penalty.toLocaleString()}</span> : "—"}</td>
                      <td className="p-3 text-muted-foreground">{m.approvedBy}</td>
                      <td className="p-3 text-muted-foreground">{new Date(m.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {report.paidMembers.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payments recorded for this month</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unpaid Members */}
          {report.unpaidMembers.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/20">
                <h2 className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Unpaid Members ({report.unpaidCount})
                </h2>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {report.unpaidMembers.map((m) => (
                    <Badge key={m.username} variant="outline" className="text-red-600 border-red-200 bg-red-50">
                      {m.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
