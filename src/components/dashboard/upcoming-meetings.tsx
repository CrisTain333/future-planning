"use client";

import { Tag, Button } from "antd";
import { Video, ExternalLink, CheckCircle, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMeetingsQuery, useSelfCheckInMutation } from "@/store/meetings-api";
import { IMeeting } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

const TYPE_TAG_COLORS: Record<string, string> = {
  regular: "#40916c",
  special: "#2563eb",
  emergency: "#dc2626",
};

function isWithinCheckInWindow(meetingDate: string): boolean {
  const now = new Date();
  const start = new Date(meetingDate);
  const windowStart = new Date(start.getTime() - 15 * 60 * 1000); // 15 min before
  const windowEnd = new Date(start.getTime() + 30 * 60 * 1000); // 30 min after
  return now >= windowStart && now <= windowEnd;
}

function MeetingCard({ meeting }: { meeting: IMeeting }) {
  const [selfCheckIn, { isLoading: isCheckingIn }] = useSelfCheckInMutation();

  const handleCheckIn = async () => {
    try {
      await selfCheckIn(meeting._id).unwrap();
      toast.success("Checked in successfully");
    } catch {
      toast.error("Failed to check in");
    }
  };

  const dateStr = new Date(meeting.date).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = new Date(meeting.date).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const typeColor = TYPE_TAG_COLORS[meeting.type] ?? TYPE_TAG_COLORS.regular;
  const canCheckIn = isWithinCheckInWindow(meeting.date);

  return (
    <div className="border border-white/10 rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{meeting.title}</p>
          <p className="text-xs text-muted-foreground">
            {dateStr} at {timeStr}
          </p>
        </div>
        <Tag color={typeColor} className="text-[10px] m-0 shrink-0">
          {meeting.type}
        </Tag>
      </div>
      <div className="flex items-center gap-2">
        {meeting.meetLink && (
          <Button
            type="link"
            size="small"
            icon={<ExternalLink className="h-3 w-3" />}
            href={meeting.meetLink}
            target="_blank"
            className="text-xs px-0"
          >
            Join Meet
          </Button>
        )}
        {canCheckIn && (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircle className="h-3 w-3" />}
            onClick={handleCheckIn}
            loading={isCheckingIn}
            className="text-xs"
          >
            Check In
          </Button>
        )}
      </div>
    </div>
  );
}

export function UpcomingMeetings() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, isLoading } = useGetMeetingsQuery({
    startDate: today.toISOString(),
    limit: 3,
  });
  const meetings = data?.data ?? [];

  if (isLoading) {
    return (
      <Card className="glass-card h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4 text-primary" />
            Upcoming Meetings
          </CardTitle>
          <Link
            href="/dashboard/meetings"
            className="text-xs text-primary hover:underline"
          >
            View All
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {meetings.length > 0 ? (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming meetings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
