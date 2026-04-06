"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Wallet,
  CalendarCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, Table, Pagination } from "antd";
import type { TableProps } from "antd";
import { StatCard } from "./stat-card";
import { FundLineChart } from "./fund-line-chart";
import {
  useGetMemberDashboardQuery,
  useGetMyPaymentsQuery,
} from "@/store/member-api";
import { useGetNoticesQuery } from "@/store/notices-api";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface PaymentItem {
  _id: string;
  month: number;
  year: number;
  amount: number;
  penalty: number;
  approvedBy: string | { fullName: string };
  receiptNo: string;
  createdAt: string;
}

interface NoticeItem {
  _id: string;
  title: string;
  body: string;
  createdAt: string;
}

function NoticeCard({ notice }: { notice: NoticeItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-0 pb-3 last:pb-0">
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="text-sm font-medium">{notice.title}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(notice.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {expanded && (
        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
          {notice.body}
        </p>
      )}
    </div>
  );
}

function PaymentCardMobile({ payment, index }: { payment: PaymentItem; index: number }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {MONTHS[payment.month - 1]} {payment.year}
          </span>
          <span className="text-sm font-bold">
            ৳{payment.amount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {new Date(payment.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {payment.penalty > 0 && (
            <span className="text-destructive">
              Penalty: ৳{payment.penalty.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Approved by: {typeof payment.approvedBy === "object" ? payment.approvedBy?.fullName : "—"}</span>
          <Button
            type="text"
            icon={<Download className="h-3 w-3" />}
            onClick={() =>
              window.open(`/api/payments/${payment._id}/receipt`, "_blank")
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemberDashboard() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: dashRes, isLoading: dashLoading } =
    useGetMemberDashboardQuery();
  const { data: payRes, isLoading: payLoading } = useGetMyPaymentsQuery({
    page,
    limit,
  });
  const { data: noticeRes } = useGetNoticesQuery({ page: 1, limit: 4 });

  if (dashLoading) {
    return <DashboardSkeleton />;
  }

  const dashboard = dashRes?.data;
  const payments: PaymentItem[] = payRes?.data ?? [];
  const pagination = payRes?.pagination;
  const notices: NoticeItem[] = noticeRes?.data ?? [];
  const recentNotices = notices.slice(0, 4);

  const statusRaw = dashboard?.status ?? "";
  const statusIsDue = statusRaw !== "up_to_date" && statusRaw !== "Up to date";
  const statusLabel = statusIsDue
    ? statusRaw.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "Up to date";

  const chartData = (dashboard?.chartData ?? []).map(
    (entry) => ({
      label: entry.month,
      amount: entry.amount,
    })
  );

  const columns: TableProps<PaymentItem>['columns'] = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_, __, index) => (page - 1) * limit + index + 1,
    },
    {
      title: 'Date',
      key: 'createdAt',
      render: (_, record) => new Date(record.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    },
    {
      title: 'Month',
      key: 'month',
      render: (_, record) => `${MONTHS[record.month - 1]} ${record.year}`,
    },
    {
      title: 'Amount (BDT)',
      key: 'amount',
      render: (_, record) => `৳${record.amount.toLocaleString()}`,
    },
    {
      title: 'Penalty (BDT)',
      key: 'penalty',
      render: (_, record) => record.penalty > 0 ? `৳${record.penalty.toLocaleString()}` : "—",
    },
    {
      title: 'Approved By',
      key: 'approvedBy',
      render: (_, record) => typeof record.approvedBy === "object" ? record.approvedBy?.fullName : "—",
    },
    {
      title: 'Receipt',
      key: 'receipt',
      render: (_, record) => (
        <Button
          type="text"
          icon={<Download className="h-3 w-3" />}
          onClick={() => window.open(`/api/payments/${record._id}/receipt`, "_blank")}
        />
      ),
    },
  ];

  const fundGrowthChart = dashboard?.fundGrowthChart ?? [];

  return (
    <div className="space-y-5">
      {/* Row 1: Stat Cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <StatCard
          title="Total Paid"
          value={`৳${(dashboard?.totalPaid ?? 0).toLocaleString()}`}
          icon={Wallet}
          index={0}
        />
        <StatCard
          title="Months Paid"
          value={dashboard?.monthsPaid ?? 0}
          icon={CalendarCheck}
          index={1}
        />
        <StatCard
          title="Outstanding"
          value={`৳${(dashboard?.outstanding ?? 0).toLocaleString()}`}
          icon={AlertCircle}
          index={2}
        />
        <StatCard
          title="Status"
          value={statusLabel}
          icon={statusIsDue ? Clock : CheckCircle}
          index={3}
        />
      </motion.div>

      {/* Row 2: Charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Payments Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-base">My Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="label"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `৳${v.toLocaleString()}`}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `৳${Number(value).toLocaleString()}`,
                          "Payment",
                        ]}
                      />
                      <Bar
                        dataKey="amount"
                        fill="hsl(181, 87%, 31%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment data available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Fund Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <FundLineChart data={fundGrowthChart} />
        </motion.div>
      </div>

      {/* Row 3: Notices + Payment History side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Notices - takes 1/3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-base">Recent Notices</CardTitle>
            </CardHeader>
            <CardContent>
              {recentNotices.length > 0 ? (
                <div className="space-y-3">
                  {recentNotices.map((notice) => (
                    <NoticeCard key={notice._id} notice={notice} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notices yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History - takes 2/3 */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payments recorded yet.
                </p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table
                      columns={columns}
                      dataSource={payments}
                      rowKey="_id"
                      pagination={false}
                    />
                  </div>

                  {/* Mobile card layout */}
                  <div className="md:hidden space-y-3">
                    {payments.map((payment, idx) => (
                      <PaymentCardMobile
                        key={payment._id}
                        payment={payment}
                        index={(page - 1) * limit + idx + 1}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {(pagination?.total ?? 0) > 0 && (
                    <div className="flex justify-center mt-4 border-t border-white/10 pt-4">
                      <Pagination
                        current={page}
                        total={pagination?.total ?? 0}
                        pageSize={limit}
                        onChange={(p) => setPage(p)}
                        showSizeChanger={true}
                        onShowSizeChange={(current, size) => {
                          setLimit(size);
                          setPage(1);
                        }}
                        pageSizeOptions={['10', '20', '50', '100']}
                      />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
