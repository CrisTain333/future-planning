"use client";

import { motion } from "framer-motion";
import { useGetAdminDashboardQuery } from "@/store/dashboard-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "./stat-card";
import { FundLineChart } from "./fund-line-chart";
import { MemberPieChart } from "./member-pie-chart";
import { RecentPayments } from "./recent-payments";
import { ActivityTimeline } from "./activity-timeline";
import { PaymentGrid } from "@/components/analytics/payment-grid";
import { DollarSign, Users, CreditCard, AlertTriangle } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
      </div>
      {/* Recent activity row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-20" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: response, isLoading } = useGetAdminDashboardQuery();

  if (isLoading || !response?.data) {
    return <DashboardSkeleton />;
  }

  const dashboard = response.data;

  return (
    <div className="space-y-4">
      {/* Row 1: Charts */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <FundLineChart data={dashboard.fundGrowthChart} />
        <MemberPieChart data={dashboard.memberShareChart} />
      </motion.div>

      {/* Row 2: Payment Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <PaymentGrid />
      </motion.div>

      {/* Row 3: Recent Activity */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <RecentPayments payments={dashboard.recentPayments} />
        <ActivityTimeline />
      </motion.div>

      {/* Row 4: Stat Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <StatCard
          title="Total Fund"
          value={`৳${dashboard.totalFund.toLocaleString()}`}
          icon={DollarSign}
          description="Cumulative fund balance"
          index={0}
        />
        <StatCard
          title="Total Members"
          value={dashboard.totalMembers}
          icon={Users}
          description="Active members"
          index={1}
        />
        <StatCard
          title="Payments This Month"
          value={dashboard.paymentsThisMonth.count}
          icon={CreditCard}
          description={`৳${dashboard.paymentsThisMonth.amount.toLocaleString()} collected`}
          index={2}
        />
        <StatCard
          title="Overdue"
          value={dashboard.overdueCount}
          icon={AlertTriangle}
          description="Pending payments"
          index={3}
        />
      </motion.div>
    </div>
  );
}
