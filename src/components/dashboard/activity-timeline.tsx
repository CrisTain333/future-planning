"use client";

import { useGetAuditLogsQuery } from "@/store/audit-logs-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  UserPlus, CreditCard, Megaphone, Settings, KeyRound, LogIn, Edit, Trash2, Shield,
} from "lucide-react";

const ACTION_ICONS: Record<string, { icon: typeof UserPlus; color: string }> = {
  user_created: { icon: UserPlus, color: "text-blue-500 bg-blue-50" },
  user_edited: { icon: Edit, color: "text-indigo-500 bg-indigo-50" },
  user_disabled: { icon: Shield, color: "text-red-500 bg-red-50" },
  user_enabled: { icon: Shield, color: "text-green-500 bg-green-50" },
  user_password_reset: { icon: KeyRound, color: "text-amber-500 bg-amber-50" },
  payment_created: { icon: CreditCard, color: "text-emerald-500 bg-emerald-50" },
  payment_edited: { icon: Edit, color: "text-teal-500 bg-teal-50" },
  payment_deleted: { icon: Trash2, color: "text-red-500 bg-red-50" },
  notice_created: { icon: Megaphone, color: "text-purple-500 bg-purple-50" },
  notice_edited: { icon: Edit, color: "text-purple-400 bg-purple-50" },
  notice_deleted: { icon: Trash2, color: "text-red-400 bg-red-50" },
  settings_updated: { icon: Settings, color: "text-gray-500 bg-gray-50" },
  profile_updated: { icon: Edit, color: "text-sky-500 bg-sky-50" },
  password_changed: { icon: KeyRound, color: "text-orange-500 bg-orange-50" },
  user_login: { icon: LogIn, color: "text-green-500 bg-green-50" },
  user_login_failed: { icon: LogIn, color: "text-red-500 bg-red-50" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityTimeline() {
  const { data, isLoading } = useGetAuditLogsQuery({ page: 1, limit: 8 });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const logs = data?.data || [];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {logs.map((log) => {
                const config = ACTION_ICONS[log.action] || { icon: Edit, color: "text-gray-500 bg-gray-50" };
                const IconComp = config.icon;
                const by = typeof log.performedBy === "object" && log.performedBy
                  ? (log.performedBy as { fullName: string }).fullName
                  : "System";
                const desc = typeof log.details === "object" && log.details
                  ? (log.details as { action_description?: string }).action_description || log.action.replace(/_/g, " ")
                  : log.action.replace(/_/g, " ");

                return (
                  <div key={log._id} className="relative flex gap-3 pl-1">
                    <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.color}`}>
                      <IconComp className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{by}</span>
                        {" "}
                        <span className="text-muted-foreground">{desc}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(log.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
