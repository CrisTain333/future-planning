"use client";

import { useState, useMemo } from "react";
import { Tag, Segmented, Spin } from "antd";
import { Video, CalendarDays, Clock, Users } from "lucide-react";
import { useGetMeetingsQuery } from "@/store/meetings-api";
import { MeetingDetailDrawer } from "@/components/meetings/meeting-detail-drawer";
import { IMeeting } from "@/types";

type MeetingFilter = "upcoming" | "past";

const TYPE_TAG_COLORS: Record<string, string> = {
  regular: "#40916c",
  special: "#2563eb",
  emergency: "#dc2626",
};

const STATUS_TAG_COLORS: Record<string, string> = {
  scheduled: "blue",
  "in-progress": "green",
  completed: "default",
  cancelled: "red",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MemberMeetingsPage() {
  const [filter, setFilter] = useState<MeetingFilter>("upcoming");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading } = useGetMeetingsQuery({ limit: 200 });
  const allMeetings = data?.data ?? [];

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    const sorted = [...allMeetings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (filter === "upcoming") {
      return sorted.filter((m) => new Date(m.date) >= now || m.status === "scheduled" || m.status === "in-progress");
    }
    return sorted
      .filter((m) => new Date(m.date) < now || m.status === "completed" || m.status === "cancelled")
      .reverse();
  }, [allMeetings, filter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            My Meetings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View meetings you have been invited to
          </p>
        </div>

        <Segmented
          value={filter}
          onChange={(val) => setFilter(val as MeetingFilter)}
          options={[
            { label: "Upcoming", value: "upcoming" },
            { label: "Past", value: "past" },
          ]}
        />
      </div>

      {/* Meeting List */}
      {isLoading ? (
        <div className="glass-card rounded-xl p-12 flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground">
            No {filter} meetings
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {filter === "upcoming"
              ? "You have no upcoming meetings scheduled."
              : "No past meetings found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMeetings.map((meeting) => {
            const typeColor =
              meeting.status === "cancelled"
                ? "#9ca3af"
                : TYPE_TAG_COLORS[meeting.type] ?? TYPE_TAG_COLORS.regular;
            const statusColor =
              STATUS_TAG_COLORS[meeting.status] ?? "default";
            const inviteeCount = meeting.invitees?.length ?? 0;

            return (
              <button
                key={meeting._id}
                className="glass-card rounded-xl w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 cursor-pointer"
                onClick={() => setDetailId(meeting._id)}
              >
                {/* Date & Time */}
                <div className="shrink-0 text-center w-20">
                  <div className="text-sm font-medium">
                    {formatDate(meeting.date).split(",")[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(meeting.date)}
                  </div>
                </div>

                {/* Title & date detail */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {meeting.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(meeting.date)}
                  </div>
                </div>

                {/* Type tag */}
                <Tag
                  color={typeColor}
                  className="text-[10px] m-0 shrink-0"
                >
                  {meeting.type}
                </Tag>

                {/* Attendees */}
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Users className="h-3 w-3" />
                  {inviteeCount}
                </span>

                {/* Status tag */}
                <Tag
                  color={statusColor}
                  className="text-[10px] m-0 shrink-0"
                >
                  {meeting.status}
                </Tag>
              </button>
            );
          })}
        </div>
      )}

      <MeetingDetailDrawer
        meetingId={detailId}
        onClose={() => setDetailId(null)}
        onEdit={() => {}}
      />
    </div>
  );
}
