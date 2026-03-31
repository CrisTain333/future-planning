"use client";

import { useGetNoticesQuery } from "@/store/notices-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";
import Link from "next/link";

export function RecentNotices() {
  const { data } = useGetNoticesQuery({ page: 1, limit: 4 });
  const notices = data?.data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Notices</CardTitle>
        <Megaphone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notices yet</p>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice._id} className="border-b pb-2 last:border-0">
                <p className="text-sm font-medium">{notice.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notice.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            <Link href="/admin/notices" className="text-sm text-primary hover:underline">
              View All →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
