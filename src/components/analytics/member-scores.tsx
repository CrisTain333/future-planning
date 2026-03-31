"use client";

import { useGetMemberScoresQuery } from "@/store/analytics-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

const GRADE_COLORS: Record<string, string> = {
  Excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Good: "bg-blue-100 text-blue-700 border-blue-200",
  Fair: "bg-amber-100 text-amber-700 border-amber-200",
  "Needs Attention": "bg-red-100 text-red-700 border-red-200",
};

export function MemberScores() {
  const { data, isLoading } = useGetMemberScoresQuery();

  if (isLoading) return <Card className="glass-card"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>;

  const scores = data?.data || [];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Member Performance Scores
        </CardTitle>
        <p className="text-xs text-muted-foreground">Based on payment rate (70%) and penalty-free rate (30%)</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">#</th>
                <th className="text-left p-2 font-medium">Member</th>
                <th className="text-center p-2 font-medium">Paid</th>
                <th className="text-center p-2 font-medium">Expected</th>
                <th className="text-center p-2 font-medium">Rate</th>
                <th className="text-center p-2 font-medium">Penalties</th>
                <th className="text-center p-2 font-medium">Score</th>
                <th className="text-center p-2 font-medium">Grade</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => (
                <tr key={s.memberId} className="border-b border-white/10 hover:bg-white/30 transition-colors">
                  <td className="p-2 text-muted-foreground">{i + 1}</td>
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2 text-center">{s.paidMonths}</td>
                  <td className="p-2 text-center">{s.expectedMonths}</td>
                  <td className="p-2 text-center">{s.paymentRate}%</td>
                  <td className="p-2 text-center">{s.penaltyCount > 0 ? <span className="text-amber-600">{s.penaltyCount}</span> : "0"}</td>
                  <td className="p-2 text-center font-bold">{s.score}</td>
                  <td className="p-2 text-center">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${GRADE_COLORS[s.grade] || ""}`}>
                      {s.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
