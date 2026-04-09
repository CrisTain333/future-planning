"use client";

import { useMemo } from "react";
import { Tag, Spin } from "antd";
import { CalendarDays, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMeeting } from "@/types";

interface CalendarAgendaViewProps {
  meetings: IMeeting[];
  isLoading: boolean;
  onMeetingClick: (id: string) => void;
}

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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return "Today";
  }
  if (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  ) {
    return "Tomorrow";
  }
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function toDayKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CalendarAgendaView({
  meetings,
  isLoading,
  onMeetingClick,
}: CalendarAgendaViewProps) {
  const grouped = useMemo(() => {
    const sorted = [...meetings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const groups: { dateKey: string; dateLabel: string; items: IMeeting[] }[] =
      [];
    let lastKey = "";

    for (const m of sorted) {
      const key = toDayKey(m.date);
      if (key !== lastKey) {
        groups.push({
          dateKey: key,
          dateLabel: formatDateHeading(m.date),
          items: [],
        });
        lastKey = key;
      }
      groups[groups.length - 1].items.push(m);
    }

    return groups;
  }, [meetings]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-12 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No meetings found
        </h3>
        <p className="text-sm text-muted-foreground/60 mt-1">
          Create a new meeting to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.dateKey} className="glass-card rounded-xl overflow-hidden">
          {/* Date heading */}
          <div className="px-4 py-2.5 border-b border-white/20 bg-white/5">
            <h3 className="text-sm font-semibold">{group.dateLabel}</h3>
          </div>

          {/* Meeting rows */}
          <div className="divide-y divide-white/10">
            {group.items.map((m) => {
              const inviteeCount = m.invitees?.length ?? 0;
              const typeColor =
                m.status === "cancelled"
                  ? "#9ca3af"
                  : TYPE_TAG_COLORS[m.type] ?? TYPE_TAG_COLORS.regular;
              const statusColor =
                STATUS_TAG_COLORS[m.status] ?? "default";

              return (
                <button
                  key={m._id}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/5 cursor-pointer"
                  )}
                  onClick={() => onMeetingClick(m._id)}
                >
                  {/* Time */}
                  <div className="w-20 shrink-0 text-sm font-medium text-muted-foreground">
                    {formatTime(m.date)}
                  </div>

                  {/* Title */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {m.title}
                    </div>
                    {m.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {m.description}
                      </div>
                    )}
                  </div>

                  {/* Type tag */}
                  <Tag
                    color={typeColor}
                    className="text-[10px] m-0 shrink-0"
                  >
                    {m.type}
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
                    {m.status}
                  </Tag>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
